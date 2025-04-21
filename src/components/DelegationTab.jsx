import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatAddress } from '../utils/formatters';
import { ethers } from 'ethers';
import Loader from './Loader';
import { 
  ArrowRight, 
  RotateCcw, 
  Users, 
  Wallet, 
  Lock, 
  Unlock,
  Zap,
  Info,
  Camera,
  ArrowUpRight
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

const DelegationTab = ({ user, delegation }) => {
  // Component state
  const [delegateAddress, setDelegateAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [delegationData, setDelegationData] = useState({
    votingPower: "0.00000000",
    directDelegations: "0",
    indirectDelegations: "0",
    delegationPath: [],
    currentSnapshotId: null,
    isProposer: false,
    proposerStake: 0,
    isLoading: true
  });
  
  // Get Web3 context to access contracts - same as VoteTab
  const { contracts, contractsReady, account } = useWeb3();
  
  // Use ref to track if component is mounted and prevent memory leaks
  const mountedRef = useRef(true);
  
  // Use a ref to track last calculation inputs to prevent redundant recalculations
  const lastCalculationRef = useRef({
    votingPower: "0",
    directDelegations: "0",
    userBalance: "0",
    isProposer: false,
    proposerStake: 0
  });
  
  // Debounce timers
  const timersRef = useRef({
    fetchDelegation: null,
    fetchVotingPower: null
  });

  // Handle the case where delegation might be undefined
  const delegationInfo = delegation?.delegationInfo || {
    currentDelegate: null,
    lockedTokens: "0",
    delegatedToYou: "0",
    delegators: [],
    delegationChain: [],
    effectiveVotingPower: "0"
  };
  
  const loading = delegation?.loading || false;
  const delegate = delegation?.delegate || (() => {
    console.error("Delegation function not available");
    alert("Delegation feature not available");
  });
  const resetDelegation = delegation?.resetDelegation || (() => {
    console.error("Reset delegation function not available");
    alert("Reset delegation feature not available");
  });
  const getDelegationDepthWarning = delegation?.getDelegationDepthWarning || (() => {
    return { warningLevel: 0, message: "Delegation depth check not available" };
  });

  // Helper function to properly detect self-delegation - memoized
  const isSelfDelegated = useCallback((userAddress, delegateAddress) => {
    if (!userAddress || !delegateAddress) return true; // Default to self-delegated if addresses aren't available
    
    // Normalize addresses for comparison
    const normalizedUserAddr = userAddress.toLowerCase();
    const normalizedDelegateAddr = delegateAddress.toLowerCase();
    
    // Check if delegate is self or zero address
    return normalizedUserAddr === normalizedDelegateAddr || 
           delegateAddress === '0x0000000000000000000000000000000000000000';
  }, []);

  // Set mountedRef to false when component unmounts
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      // Clear any pending timers
      if (timersRef.current.fetchDelegation) {
        clearTimeout(timersRef.current.fetchDelegation);
      }
      if (timersRef.current.fetchVotingPower) {
        clearTimeout(timersRef.current.fetchVotingPower);
      }
    };
  }, []);

  // Fetch snapshot ID only once when contracts are ready
  useEffect(() => {
    if (!contractsReady || !contracts?.justToken) return;
    
    let isCancelled = false;
    
    const fetchSnapshotId = async () => {
      try {
        // Try multiple method variations
        const methodVariations = [
          'getCurrentSnapshotId',
          'get_current_snapshot_id',
          'currentSnapshotId',
          '_getCurrentSnapshotId'
        ];
  
        let id = null;
        for (const methodName of methodVariations) {
          if (isCancelled) return;
          
          try {
            if (typeof contracts.justToken[methodName] === 'function') {
              id = await contracts.justToken[methodName]();
              break;
            }
          } catch (methodError) {
            // Silently continue to next method
          }
        }
  
        if (!isCancelled && id && mountedRef.current) {
          // Store in ref to avoid dependency cycles
          snapshotIdRef.current = id.toString();
          
          // Update state only once to display it in the UI
          setDelegationData(prev => ({
            ...prev,
            currentSnapshotId: id.toString()
          }));
        }
      } catch (error) {
        // Log error but don't update state if cancelled
        if (!isCancelled) {
          console.error("Error fetching snapshot ID:", error);
        }
      }
    };
  
    fetchSnapshotId();
    
    return () => {
      isCancelled = true;
    };
  }, [contractsReady, contracts?.justToken]);

  // Improved proposer status check method with better error handling
  const checkProposerStatus = useCallback(async () => {
    try {
      // Ensure we have the necessary objects
      if (!contracts || !account || !delegation || !user?.address) {
        return { 
          isProposer: false, 
          proposerStake: 0 
        };
      }

      // First, check if getLastProposalDetails method exists
      if (typeof delegation.getLastProposalDetails !== 'function') {
        return { 
          isProposer: false, 
          proposerStake: 0 
        };
      }

      // Fetch last proposal details
      const lastProposalDetails = await delegation.getLastProposalDetails();

      // Check if proposer exists and matches current account
      if (lastProposalDetails && 
          lastProposalDetails.proposer && 
          user?.address && 
          lastProposalDetails.proposer.toLowerCase() === user.address.toLowerCase()) {
        
        // Parse stake amount, defaulting to 0 if not available
        const proposerStake = parseFloat(lastProposalDetails.stakedAmount || "0");
        
        return { 
          isProposer: true, 
          proposerStake 
        };
      }

      // If no match found
      return { 
        isProposer: false, 
        proposerStake: 0 
      };
    } catch (error) {
      console.error('Error in proposer status check:', error);
      return { 
        isProposer: false, 
        proposerStake: 0 
      };
    }
  }, [contracts, account, delegation, user?.address]);

  // Calculate indirect delegations - with stable calculations
  const calculateIndirectDelegations = useCallback((
    directDelegationsValue,
    votingPowerValue,
    userBalance,
    isUserProposer,
    stakeAmount
  ) => {
    // Convert inputs to floats and ensure they're numbers
    const vp = parseFloat(votingPowerValue || "0");
    const direct = parseFloat(directDelegationsValue || "0");
    const balance = parseFloat(userBalance || "0");
    const stake = isUserProposer ? parseFloat(stakeAmount || "0") : 0;
    
    // Calculate indirect by taking total voting power and subtracting components
    return Math.max(0, vp - balance - direct - stake);
  }, []);

  // Fetch delegation path - with more robust method based on analytics tab
  const fetchDelegationPath = useCallback(async () => {
    if (!contracts?.justToken || !user?.address || !mountedRef.current) return [];
    
    try {
      // If delegation helper is available, use it first
      if (delegation?.getDelegationPath) {
        try {
          const path = await delegation.getDelegationPath(user.address);
          if (path && path.length > 0) {
            return path; // Return if valid path found
          }
        } catch (error) {
          console.warn("Error using helper for delegation path:", error);
          // Continue to fallback method
        }
      }
      
      // Fallback: Trace the delegation chain manually
      const path = [];
      let current = user.address;
      path.push(current);
      
      // Set to track visited addresses to prevent infinite loops
      const visited = new Set();
      visited.add(current.toLowerCase());
      
      // Follow the delegation chain up to a reasonable depth
      const MAX_DEPTH = 8; // Match contract MAX_DELEGATION_DEPTH
      
      for (let i = 0; i < MAX_DEPTH; i++) {
        try {
          // Get the delegate of the current address
          const delegate = await contracts.justToken.getDelegate(current);
          
          // Stop if we reach an address that delegates to itself or zero address
          if (!delegate || 
              delegate === '0x0000000000000000000000000000000000000000' || 
              delegate.toLowerCase() === current.toLowerCase()) {
            break;
          }
          
          // Check for cycles
          if (visited.has(delegate.toLowerCase())) {
            // We found a cycle - add the delegate to complete the cycle in the UI
            path.push(delegate);
            break;
          }
          
          // Add this delegate to our path and visited set
          path.push(delegate);
          visited.add(delegate.toLowerCase());
          
          // Move to the next delegate in the chain
          current = delegate;
        } catch (error) {
          console.error("Error tracing delegation chain:", error);
          break;
        }
      }
      
      return path;
    } catch (error) {
      console.error("Error fetching delegation path:", error);
      return [];
    }
  }, [contracts?.justToken, user?.address, delegation?.getDelegationPath]);

  // Store snapshot ID in a ref to avoid dependency cycles
  const snapshotIdRef = useRef(null);
  
  // Memoized unified fetch delegation data function
  const fetchDelegationData = useCallback(async () => {
    if (!user?.address || !mountedRef.current) return;
    
    // Begin by setting loading state
    setDelegationData(prev => ({
      ...prev,
      isLoading: true
    }));
    
    try {
      // Run parallel operations to improve performance
      const [
        proposerResult,
        delegationPath,
        effectiveVotingPower
      ] = await Promise.all([
        checkProposerStatus(), 
        fetchDelegationPath(),
        (delegation?.getEffectiveVotingPower 
          ? delegation.getEffectiveVotingPower(user.address).catch(e => {
              console.error("Error fetching voting power:", e);
              return delegationInfo.effectiveVotingPower || "0";
            }) 
          : Promise.resolve(delegationInfo.effectiveVotingPower || "0"))
      ]);
      
      // If component unmounted during the async operations, abort
      if (!mountedRef.current) return;
      
      // Calculate direct delegations from delegationInfo
      const directFromDelegators = delegationInfo.delegators?.reduce((sum, delegator) => {
        if (delegator.address?.toLowerCase() === user.address.toLowerCase()) return sum;
        return sum + parseFloat(delegator.balance || "0");
      }, 0).toString() || "0";
      
      // Calculate indirect delegations from the raw values
      const indirectDelegationsValue = calculateIndirectDelegations(
        directFromDelegators,
        effectiveVotingPower,
        user?.balance,
        proposerResult.isProposer,
        proposerResult.proposerStake
      );
      
      // Batch update all state to prevent multiple re-renders
      setDelegationData(prev => ({
        ...prev,
        votingPower: effectiveVotingPower,
        directDelegations: directFromDelegators,
        indirectDelegations: indirectDelegationsValue.toString(),
        delegationPath,
        isProposer: proposerResult.isProposer,
        proposerStake: proposerResult.proposerStake,
        isLoading: false
      }));
      
    } catch (error) {
      console.error("Error in fetchDelegationData:", error);
      
      // Set loading to false but don't change other values
      if (mountedRef.current) {
        setDelegationData(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    }
  }, [
    user?.address,
    user?.balance,
    delegationInfo.delegators,
    delegationInfo.effectiveVotingPower,
    delegation?.getEffectiveVotingPower,
    calculateIndirectDelegations,
    checkProposerStatus,
    fetchDelegationPath
  ]);

  // Track if initial data has been loaded
  const initialDataLoadedRef = useRef(false);
  
  // Debounced effect with stable dependency
  useEffect(() => {
    if (!user?.address) return;
    
    // Set a flag to prevent repeated fetches after initial load
    if (!initialDataLoadedRef.current) {
      // Clear any pending fetch timer
      if (timersRef.current.fetchDelegation) {
        clearTimeout(timersRef.current.fetchDelegation);
      }
      
      // Set a small delay to prevent rapid consecutive fetches
      timersRef.current.fetchDelegation = setTimeout(() => {
        fetchDelegationData();
        
        // Mark that we've loaded data
        initialDataLoadedRef.current = true;
      }, 500); // Increased debounce delay for more stability
    }
    
    // Cleanup function
    return () => {
      if (timersRef.current.fetchDelegation) {
        clearTimeout(timersRef.current.fetchDelegation);
      }
    };
  }, [fetchDelegationData]);

  // Format numbers with more precision for specific values - memoized
  const formatToFiveDecimals = useCallback((value) => {
    if (!value) return "0.00000";
    return parseFloat(value).toFixed(5);
  }, []);
  
  // Format with 8 decimal places for locked tokens and voting power - memoized
  const formatToEightDecimals = useCallback((value) => {
    if (!value) return "0.00000000";
    return parseFloat(value).toFixed(8);
  }, []);

  // Determine delegation status
  const userAddress = user?.address || '';
  const currentDelegate = delegationInfo?.currentDelegate || '';
  const selfDelegated = useMemo(() => 
    isSelfDelegated(userAddress, currentDelegate), 
    [isSelfDelegated, userAddress, currentDelegate]
  );

  // Get directly delegated tokens (excluding self) - memoized
  const directDelegatedToYou = delegationData.directDelegations;

  // Get full transitive delegated tokens - memoized with safer calculation
  const fullTransitiveDelegation = useMemo(() => {
    // Convert to numbers first to ensure proper addition
    const direct = parseFloat(delegationData.directDelegations || "0");
    const indirect = parseFloat(delegationData.indirectDelegations || "0");
    
    // Add direct and indirect delegations
    const total = direct + indirect;
    
    // Safety check to ensure we have a valid number
    return isNaN(total) ? "0" : total.toString();
  }, [delegationData.directDelegations, delegationData.indirectDelegations]);

  // Calculate proper voting power - use the effective voting power from contract - memoized
  const displayVotingPower = useMemo(() => {
    // Use the delegationInfo.effectiveVotingPower if available, otherwise use the fetched votingPower
    return delegationInfo.effectiveVotingPower || delegationData.votingPower || "0.00000000";
  }, [delegationInfo.effectiveVotingPower, delegationData.votingPower]);

  // Check if there are actual delegators (excluding self)
  const hasRealDelegators = useMemo(() => {
    if (!delegationInfo.delegators || delegationInfo.delegators.length === 0) {
      return false;
    }
    
    // Check if there are delegators other than the user themselves
    return delegationInfo.delegators.some(delegator => 
      delegator.address?.toLowerCase() !== userAddress?.toLowerCase()
    );
  }, [delegationInfo.delegators, userAddress]);

  // Check if user is part of a delegation chain
  const isPartOfDelegationChain = !selfDelegated && currentDelegate !== '';

  // Check if there's transitive delegation
  const hasTransitiveDelegation = parseFloat(delegationData.indirectDelegations) > 0.00001;

  // Check if there are direct delegations (needed for conditional rendering)
  const hasDirectDelegations = parseFloat(directDelegatedToYou) > 0.00001;

  // Calculate the ultimate delegate in a delegation chain
  const ultimateDelegate = useMemo(() => {
    if (selfDelegated || !currentDelegate) {
      return userAddress;
    }
    
    // If we have a delegation path, return the last address in that path
    if (delegationData.delegationPath && delegationData.delegationPath.length > 0) {
      return delegationData.delegationPath[delegationData.delegationPath.length - 1];
    }
    
    // Fallback to just the current delegate
    return currentDelegate;
  }, [selfDelegated, currentDelegate, userAddress, delegationData.delegationPath]);

  // Check if ultimate delegate is self - calculated directly with safety check
  const ultimateDelegateIsSelf = useMemo(() => {
    if (!userAddress || !ultimateDelegate) return true;
    return ultimateDelegate.toLowerCase() === userAddress.toLowerCase();
  }, [ultimateDelegate, userAddress]);

  // Render the delegation chain/path - memoized
  const renderDelegationChain = useCallback(() => {
    if (!isPartOfDelegationChain || !delegationData.delegationPath || delegationData.delegationPath.length <= 1) {
      return null;
    }
    
    return (
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-4">
        <h5 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2 flex items-center">
          <ArrowUpRight className="w-4 h-4 mr-1" />
          Delegation Chain
        </h5>
        <div className="flex flex-wrap items-center text-sm">
          {delegationData.delegationPath.map((address, idx) => (
            <React.Fragment key={idx}>
              <span className={`px-2 py-1 rounded-md ${address.toLowerCase() === userAddress.toLowerCase() 
                ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {formatAddress(address)}
              </span>
              {idx < delegationData.delegationPath.length - 1 && (
                <ArrowRight className="mx-1 w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }, [isPartOfDelegationChain, delegationData.delegationPath, userAddress]);

  // Main stats cards with updated display logic - memoized
  const statCards = useMemo(() => [
    {
      title: "Current Delegate",
      value: selfDelegated ? 
        `${userAddress ? formatAddress(userAddress) : 'Self'} (Self)` : 
        currentDelegate ? formatAddress(currentDelegate) : 'Unknown',
      icon: <Users className="w-5 h-5" />
    },
    {
      title: "Locked Tokens",
      value: selfDelegated ? 
        "Unlocked" : 
        `${formatToEightDecimals(user?.balance)} JST`,
      icon: selfDelegated ? 
        <Unlock className="w-5 h-5" /> : 
        <Lock className="w-5 h-5" />,
      iconBgClass: selfDelegated ? 
        "bg-green-100 dark:bg-green-900/30" : 
        "bg-red-100 dark:bg-red-900/30",
      iconClass: selfDelegated ? 
        "text-green-600 dark:text-green-400" : 
        "text-red-600 dark:text-red-400",
      valueClass: selfDelegated ? 
        "text-green-600 dark:text-green-400" : 
        "text-red-600 dark:text-red-400"
    },
    {
      title: "Your Balance",
      value: `${formatToFiveDecimals(user?.balance)} JST`,
      icon: <Wallet className="w-5 h-5" />
    },
    {
      title: "Your Voting Power",
      value: `${formatToEightDecimals(displayVotingPower)} JST`,
      icon: <Zap className="w-5 h-5" />
    }
  ], [
    selfDelegated, 
    userAddress, 
    currentDelegate, 
    user?.balance, 
    displayVotingPower, 
    formatToEightDecimals, 
    formatToFiveDecimals
  ]);

  // Handler for reset delegation - memoized
  const handleResetDelegation = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await resetDelegation();
      if (mountedRef.current) {
        setDelegateAddress('');
      }
      
      // Clear any pending fetch timers
      if (timersRef.current.fetchVotingPower) {
        clearTimeout(timersRef.current.fetchVotingPower);
      }
      
      // Reset the flag so we can fetch data again
      initialDataLoadedRef.current = false;
      
      // Refresh voting power after resetting delegation
      timersRef.current.fetchVotingPower = setTimeout(async () => {
        if (mountedRef.current) {
          fetchDelegationData();
          // Set the flag back to true
          initialDataLoadedRef.current = true;
        }
      }, 800); // Increase delay to ensure transaction has time to confirm
    } catch (error) {
      console.error("Error resetting delegation:", error);
      alert("Error resetting delegation. See console for details.");
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [resetDelegation, fetchDelegationData]);

  // Handler for delegation - memoized
  const handleDelegate = useCallback(async () => {
    if (!delegateAddress) return;
    
    // Make sure user address exists
    if (!user?.address) {
      alert("User address not available");
      return;
    }
    
    // Prevent self-delegation via the form - should use reset instead
    if (delegateAddress.toLowerCase() === user.address.toLowerCase()) {
      return handleResetDelegation();
    }
    
    try {
      setIsSubmitting(true);
      
      // First, check if the target address is already delegating to someone else
      let targetAlreadyDelegating = false;
      let targetDelegateAddress = null;
      
      try {
        if (contracts && contracts.justToken) {
          targetDelegateAddress = await contracts.justToken.getDelegate(delegateAddress);
          targetAlreadyDelegating = 
            targetDelegateAddress !== ethers.constants.AddressZero && 
            targetDelegateAddress.toLowerCase() !== delegateAddress.toLowerCase();
          
          if (targetAlreadyDelegating) {
            // Warn the user but allow them to proceed
            const proceed = window.confirm(
              `The address you're delegating to (${formatAddress(delegateAddress)}) is already delegating to ${formatAddress(targetDelegateAddress)}. ` +
              "This might fail due to delegation depth or cycle restrictions. Continue anyway?"
            );
            
            if (!proceed) {
              if (mountedRef.current) {
                setIsSubmitting(false);
              }
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Could not check if target is delegating:", err);
        // Continue anyway as this is just a pre-check
      }
      
      // Check for potential delegation depth issues
      try {
        const warning = await delegation.getDelegationDepthWarning(user.address, delegateAddress);
        
        if (warning.warningLevel === 3) {
          alert(warning.message || "This delegation would exceed the maximum delegation depth limit or create a cycle");
          if (mountedRef.current) {
            setIsSubmitting(false);
          }
          return;
        } else if (warning.warningLevel > 0) {
          const proceed = window.confirm((warning.message || "This delegation may create a deep chain") + ". Do you want to proceed?");
          if (!proceed) {
            if (mountedRef.current) {
              setIsSubmitting(false);
            }
            return;
          }
        }
      } catch (err) {
        console.warn("Error checking delegation depth:", err);
        // Continue with delegation attempt but warn user
        const proceed = window.confirm(
          "Could not fully validate this delegation. There may be restrictions that prevent it from succeeding. Continue anyway?"
        );
        
        if (!proceed) {
          if (mountedRef.current) {
            setIsSubmitting(false);
          }
          return;
        }
      }
      
      try {
        await delegate(delegateAddress);
        
        if (mountedRef.current) {
          setDelegateAddress('');
        }
        
        // Clear any pending fetch timers
        if (timersRef.current.fetchVotingPower) {
          clearTimeout(timersRef.current.fetchVotingPower);
        }
        
        // Reset the flag so we can fetch data again
        initialDataLoadedRef.current = false;
        
        // Refresh delegation data after delegation
        timersRef.current.fetchVotingPower = setTimeout(async () => {
          if (mountedRef.current) {
            fetchDelegationData();
            // Set the flag back to true
            initialDataLoadedRef.current = true;
          }
        }, 800); // Increase delay to ensure transaction has time to confirm
        
        // Show success message
        alert("Delegation successful!");
      } catch (error) {
        console.error("Error delegating:", error);
        
        let errorMessage = "Error delegating";
        
        // Check for specific error patterns
        if (error.message.includes("cycle")) {
          errorMessage = "This delegation would create a cycle in the delegation chain";
        } else if (error.message.includes("depth")) {
          errorMessage = "This delegation would exceed the maximum delegation depth";
        } else if (error.message.includes("zero balance")) {
          errorMessage = "You cannot delegate with zero balance";
        } else if (error.message.includes("CALL_EXCEPTION")) {
          errorMessage = "Transaction failed on the blockchain";
          
          // Add more specific guidance based on what we know
          if (targetAlreadyDelegating) {
            errorMessage += `\n\nThis may be because the address you're delegating to (${formatAddress(delegateAddress)}) is already delegating to ${formatAddress(targetDelegateAddress)}, which could create an invalid delegation chain.`;
          } else {
            errorMessage += "\n\nPossible reasons:";
            errorMessage += "\n- There might be a restriction against delegating to this address";
            errorMessage += "\n- The delegation would create a too deep chain or cycle";
            errorMessage += "\n- You may not have enough tokens to delegate";
            errorMessage += "\n- There might be other contract-level restrictions";
          }
          
          errorMessage += "\n\nYou can try resetting your delegation and then trying again.";
        } else {
          errorMessage += ": " + error.message;
        }
        
        alert(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [
    delegateAddress,
    user?.address,
    contracts,
    delegation,
    delegate,
    fetchDelegationData,
    handleResetDelegation,
    mountedRef,
    timersRef,
    formatAddress
  ]);
  
  // Prepare delegation card content to prevent jitter during loading/transitions
  const renderDelegationCardContent = () => {
    // Handle the initial loading case
    if (delegationData.isLoading && !directDelegatedToYou && !hasTransitiveDelegation) {
      return (
        <div className="flex justify-center items-center py-12 min-h-[300px]">
          <Loader size="medium" text="Loading delegation data..." />
        </div>
      );
    }
    
    // Skeleton structure for data that's already been loaded once
    return (
      <>
        <div className="flex items-center justify-center space-x-6 mb-6">
          {/* Direct delegation circle - centered when no indirect delegation */}
          <div className={`text-center ${!hasTransitiveDelegation || !hasDirectDelegations ? 'mx-auto' : ''}`}>
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3 shadow-md transition-opacity duration-300">
              <div className={delegationData.isLoading ? "opacity-30" : "opacity-100"}>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatToFiveDecimals(directDelegatedToYou)}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Direct</p>
          </div>
          
          {/* Only show indirect circle if we have transitive delegation AND direct delegations > 0 */}
          {hasTransitiveDelegation && hasDirectDelegations && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-3 shadow-md transition-opacity duration-300">
                <div className={delegationData.isLoading ? "opacity-30" : "opacity-100"}>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatToFiveDecimals(delegationData.indirectDelegations)}
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Indirect</p>
              {delegationData.isProposer && parseFloat(delegationData.proposerStake) > 0 && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  (Excludes {formatToFiveDecimals(delegationData.proposerStake)} JST proposal stake)
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 transition-colors duration-300">
          <div className={delegationData.isLoading ? "opacity-60" : "opacity-100"}>
            {parseFloat(fullTransitiveDelegation) > 0 ? (
              <div>
                {(hasDirectDelegations || !hasTransitiveDelegation) && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    You have {formatToFiveDecimals(fullTransitiveDelegation)} JST tokens delegated to you 
                    {hasTransitiveDelegation && hasDirectDelegations ? (
                      <>
                       ( <span className="text-emerald-600 dark:text-emerald-400">{formatToFiveDecimals(delegationData.directDelegations)} direct</span> + 
                        <span className="text-indigo-600 dark:text-indigo-400"> {formatToFiveDecimals(delegationData.indirectDelegations)} indirect</span>).
                      </>
                    ) : (
                      <span> </span>
                    )}
                  </p>
                )}
                
                {!hasDirectDelegations && hasTransitiveDelegation && (
                  <div className="mt-2 p-3 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 rounded-md">
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 flex items-start">
                      <Info className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span>
                        Your proposal stake of {formatToFiveDecimals(delegationData.indirectDelegations)} JST is included in your total voting power.
                      </span>
                    </p>
                  </div>
                )}
                {!selfDelegated && !ultimateDelegateIsSelf && (
                  <div className="flex items-center mt-2 text-xs text-amber-600 dark:text-amber-400">
                    <Info className="w-4 h-4 mr-1" />
                    <span>These tokens flow through to {formatAddress(ultimateDelegate)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                No tokens delegated to you yet.
              </p>
            )}
          </div>
        </div>
        
        {/* Delegators section */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors duration-300">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Voting Power:</h4>
            <div className={delegationData.isLoading ? "opacity-60" : "opacity-100"}>
              {parseFloat(directDelegatedToYou) > 0 && (
                <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md">
                  Total: {formatToFiveDecimals(fullTransitiveDelegation)} JST
                  {delegationData.isProposer && parseFloat(delegationData.proposerStake) > 0 && ' (excl. stake)'}
                </span>
              )}
            </div>
          </div>
          
          {/* Direct delegators list */}
          <div className={delegationData.isLoading ? "opacity-60" : "opacity-100"}>
            {hasRealDelegators ? (
              <div>
                <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Direct Delegators:</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2 mb-4">
                  {delegationInfo.delegators
                    .filter(delegator => delegator.address?.toLowerCase() !== userAddress?.toLowerCase())
                    .map((delegator, idx) => (
                      <div 
                        key={idx} 
                        className="text-sm flex justify-between items-center p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/30 hover:bg-white dark:hover:bg-gray-700 transition-colors duration-150"
                      >
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatAddress(delegator.address)}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full text-xs">
                          {formatToFiveDecimals(delegator.balance)} JST
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 text-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">No direct delegators</p>
              </div>
            )}
            
            {/* Indirect delegation summary - only shown if there are indirect delegations AND direct delegations > 0 */}
            {hasTransitiveDelegation && hasDirectDelegations && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Indirect Delegations:</h5>
                  <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                    {formatToFiveDecimals(delegationData.indirectDelegations)} JST
                    {delegationData.isProposer && parseFloat(delegationData.proposerStake) > 0 && ' (excl. stake)'}
                  </span>
                </div>
                {delegationData.isProposer && parseFloat(delegationData.proposerStake) > 0 && (
                  <div className="mt-2 p-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 rounded-md">
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start">
                      <Info className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span>
                        As the most recent proposer, your stake of {formatToFiveDecimals(delegationData.proposerStake)} JST is included in your voting power.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };
  
  return (
    <div className="transition-colors duration-300">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-300">Delegation</h2>
        <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300 mt-1">
          Manage your voting power and delegate tokens for governance participation
        </p>
      </div>
      
      {/* Snapshot Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-100 dark:border-gray-700 shadow-sm min-h-0">        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Current Snapshot ID:
            </span>
          </div>
          {delegationData.currentSnapshotId !== null ? (
            <span className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg text-sm">
              #{delegationData.currentSnapshotId}
            </span>
          ) : (
            <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg text-sm">
              <Loader size="tiny" className="mr-2" />
              Loading...
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Note: Delegation chains and voting power calculations are finalized when a snapshot is created for governance actions.
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size="large" text="Loading delegation data..." />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main cards layout - using a 3-column grid with first card spanning 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Your Delegation Status - takes up 8 out of 12 columns (2/3 of the width) */}
            <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-600/20 dark:to-purple-600/20 py-4 px-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Your Delegation Status
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {statCards.map((card, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{card.title}</p>
                          <p className={`text-lg font-semibold ${card.valueClass || "text-gray-800 dark:text-white"}`}>{card.value}</p>
                        </div>
                        <div className={`p-2 ${card.iconBgClass || "bg-indigo-100 dark:bg-indigo-900/30"} rounded-lg ${card.iconClass || "text-indigo-600 dark:text-indigo-400"}`}>
                          {card.icon}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                
                {/* Ultimate delegate indicator for users who are delegating */}
                {!selfDelegated && currentDelegate && currentDelegate !== userAddress && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        Ultimate Delegate:
                      </h5>
                      <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium">
                        {formatAddress(ultimateDelegate)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {ultimateDelegateIsSelf 
                        ? "Your delegation forms a circular path back to you." 
                        : `Your voting power flows to this address at the end of the chain.`}
                    </p>
                    {delegationData.delegationPath && delegationData.delegationPath.length > 1 && (
                      <div className="mt-2">
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium block mb-1">Delegation Path:</span>
                        <div className="flex flex-wrap items-center text-xs gap-1 max-w-full">
                          {delegationData.delegationPath.map((addr, idx) => (
                            <React.Fragment key={idx}>
                              <span className="px-1.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded inline-block">
                                {formatAddress(addr)}
                              </span>
                              {idx < delegationData.delegationPath.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-gray-400 inline-block mx-0.5 flex-shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Delegation actions - UPDATED FOR MOBILE RESPONSIVENESS */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 transition-colors duration-300">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delegate Your Voting Power</label>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <input 
                        type="text" 
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-800 dark:text-white transition-colors duration-300 placeholder-gray-400 dark:placeholder-gray-500" 
                        placeholder="Enter delegate address (0x...)" 
                        value={delegateAddress}
                        onChange={(e) => setDelegateAddress(e.target.value)}
                      />
                      <button 
                        className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white px-5 py-3 rounded-lg shadow-sm hover:shadow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        onClick={handleDelegate}
                        disabled={!user?.balance || parseFloat(user?.balance || "0") === 0 || isSubmitting}
                      >
                        {isSubmitting ? "Processing..." : "Delegate"}
                        {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Delegating transfers your voting power but allows you to maintain token ownership.
                      {!selfDelegated && " Your tokens are locked while delegated."}
                    </p>
                  </div>
                  
                  {!selfDelegated && (
                    <div className="text-center">
                      <button 
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/40 px-5 py-3 rounded-lg font-medium transition-all duration-300"
                        onClick={handleResetDelegation}
                        disabled={isSubmitting}
                      >
                        <RotateCcw className="w-4 h-4" />
                        {isSubmitting ? "Processing..." : "Reset Delegation (Self-Delegate)"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delegated to you card - takes up 4 out of 12 columns (1/3 of the width) */}
            <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-600/20 dark:to-teal-600/20 py-4 px-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Delegated to You
                </h3>
              </div>
              
              <div className="p-6">
                {/* Always maintain consistent height regardless of loading state */}
                <div className="min-h-[420px] transition-opacity duration-300">
                  {renderDelegationCardContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DelegationTab;