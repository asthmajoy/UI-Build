// src/hooks/useDelegation.js - Updated with enhanced error handling and delegation checks
import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useBlockchainData } from '../contexts/BlockchainDataContext';

export function useDelegation() {
  const { contracts, account, isConnected, contractsReady } = useWeb3();
  const { userData, refreshData } = useBlockchainData();
  
  // Add a ref to track component mount status
  const isMounted = useRef(true);
  
  const [delegationInfo, setDelegationInfo] = useState({
    currentDelegate: null,
    lockedTokens: "0",
    delegatedToYou: "0",
    delegators: [],
    isSelfDelegated: true,
    delegationChain: [], // Track delegation chain
    effectiveVotingPower: "0" // Add effectiveVotingPower to state
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      // Set mounted flag to false when component unmounts
      isMounted.current = false;
    };
  }, []);

  // Sync state with blockchain data from context and fetch effective voting power
  useEffect(() => {
    if (userData) {
      // Calculate if self-delegated
      const isSelfDelegated = 
        userData.delegate === account || 
        userData.delegate === ethers.constants.AddressZero || 
        !userData.delegate;
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        setDelegationInfo({
          currentDelegate: userData.delegate,
          lockedTokens: userData.lockedTokens,
          delegatedToYou: userData.delegatedToYou,
          delegators: userData.delegators || [],
          isSelfDelegated,
          delegationChain: [account, userData.delegate].filter(a => !!a && a !== ethers.constants.AddressZero),
          effectiveVotingPower: "0" // Initialize, will be updated by getEffectiveVotingPower
        });
        
        setLoading(false);
      }
      
      // If not self-delegated, try to fetch the delegation chain
      if (!isSelfDelegated && contractsReady && contracts.justToken && isMounted.current) {
        fetchDelegationChain(account);
      }
      
      // Always fetch effective voting power when userData changes
      if (account && contractsReady && contracts.justToken && isMounted.current) {
        getEffectiveVotingPower(account).then(power => {
          if (isMounted.current) {
            setDelegationInfo(prev => ({
              ...prev,
              effectiveVotingPower: power
            }));
          }
        }).catch(err => {
          console.error("Error fetching effective voting power:", err);
        });
      }
    }
  }, [userData, account, contractsReady, contracts]);

  // Fetch the entire delegation chain for an address
  const fetchDelegationChain = async (startAddr) => {
    if (!contractsReady || !contracts.justToken) return [];
    
    try {
      const chain = [startAddr];
      let currentDelegate = startAddr;
      const visited = new Set();
      visited.add(currentDelegate.toLowerCase());
      
      // Follow the delegation chain up to a reasonable depth
      for (let i = 0; i < 10; i++) {
        try {
          const nextDelegate = await contracts.justToken.getDelegate(currentDelegate);
          
          // Stop if delegate is self or zero address
          if (nextDelegate === ethers.constants.AddressZero || 
              nextDelegate.toLowerCase() === currentDelegate.toLowerCase()) {
            break;
          }
          
          // Detect cycles
          if (visited.has(nextDelegate.toLowerCase())) {
            console.warn("Delegation cycle detected:", chain);
            chain.push(`${nextDelegate} (CYCLE)`);
            break;
          }
          
          // Add to chain and continue
          chain.push(nextDelegate);
          visited.add(nextDelegate.toLowerCase());
          currentDelegate = nextDelegate;
        } catch (err) {
          console.warn("Error following delegation chain:", err);
          break;
        }
      }
      
      console.log("Delegation chain:", chain);
      
      // Update delegation info with the chain ONLY if component is still mounted
      if (isMounted.current) {
        setDelegationInfo(prev => ({
          ...prev,
          delegationChain: chain
        }));
      }
      
      return chain;
    } catch (err) {
      console.error("Error fetching delegation chain:", err);
      return [startAddr];
    }
  };

  // Enhanced delegate function with more robust checks and error handling
  const delegate = async (delegateeAddress) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.justToken) throw new Error("Token contract not initialized");
    if (!ethers.utils.isAddress(delegateeAddress)) throw new Error("Invalid address format");
    
    // Prevent self-delegation via regular delegate - should use resetDelegation instead
    if (delegateeAddress.toLowerCase() === account.toLowerCase()) {
      return resetDelegation();
    }
    
    try {
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }
      
      console.log(`Delegating from ${account} to ${delegateeAddress}`);
      
      // First check if target account is already delegating - this may be causing issues
      const targetDelegate = await contracts.justToken.getDelegate(delegateeAddress);
      const targetIsDelegating = targetDelegate !== ethers.constants.AddressZero && 
                                targetDelegate.toLowerCase() !== delegateeAddress.toLowerCase();
      
      if (targetIsDelegating) {
        console.warn(`Target address ${delegateeAddress} is already delegating to ${targetDelegate}`);
        // This could be causing the issues - warn but continue
      }
      
      // Enhance chain check to include both source and target chains
      const checkCombinedDelegationChains = async (sourceAddr, targetAddr) => {
        // Get current chains for both addresses
        const sourceChain = await fetchDelegationChain(sourceAddr);
        const targetChain = await fetchDelegationChain(targetAddr);
        
        console.log("Source chain:", sourceChain);
        console.log("Target chain:", targetChain);
        
        // Check for potential cycles when these chains are connected
        const addresses = new Set();
        for (const addr of sourceChain) {
          addresses.add(addr.toLowerCase());
        }
        
        // Check if connecting to target chain would create a cycle
        let hasCycle = false;
        for (const addr of targetChain) {
          if (addr.toLowerCase() !== targetAddr.toLowerCase() && 
              addresses.has(addr.toLowerCase())) {
            hasCycle = true;
            break;
          }
        }
        
        // Calculate combined chain depth
        // When sourceAddr delegates to targetAddr, we create sourceChain -> targetChain
        // But we don't double-count targetAddr, so we subtract 1 from the total
        const combinedDepth = sourceChain.length + targetChain.length - 1;
        
        return {
          hasCycle,
          combinedDepth, 
          sourceChain, 
          targetChain
        };
      };
      
      // Check for delegation cycles and find ultimate delegate
      const chainCheck = await checkCombinedDelegationChains(account, delegateeAddress);
      
      if (chainCheck.hasCycle) {
        throw new Error(`This delegation would create a cycle in the delegation chain`);
      }
      
      if (chainCheck.combinedDepth > 8) { // Typical maximum depth is 8
        throw new Error(`This delegation would exceed the maximum depth limit (${chainCheck.combinedDepth} > 8)`);
      }
      
      console.log(`Delegation chains analysis: 
        Your chain: ${chainCheck.sourceChain.join(' -> ')}
        Target's chain: ${chainCheck.targetChain.join(' -> ')}
        Combined depth: ${chainCheck.combinedDepth}`);
      
      // If available, use the helper contract for additional checks
      if (contracts.daoHelper) {
        try {
          const warningLevel = await contracts.daoHelper.checkDelegationDepthWarning(account, delegateeAddress);
          
          if (warningLevel === 3) {
            throw new Error("This delegation would exceed the maximum delegation depth limit or create a cycle");
          } else if (warningLevel === 2) {
            console.warn("This delegation will reach the maximum allowed delegation depth");
          } else if (warningLevel === 1) {
            console.warn("This delegation is getting close to the maximum depth limit");
          }
        } catch (depthErr) {
          // Only re-throw if the error is about delegation issues
          if (depthErr.message.includes("delegation")) {
            throw depthErr;
          }
          // Otherwise log and continue with our own checks
          console.warn("Error using helper contract:", depthErr);
        }
      }
      
      // Check user's balance - some contracts require this
      try {
        const balance = await contracts.justToken.balanceOf(account);
        if (balance.isZero()) {
          throw new Error("You cannot delegate with zero balance");
        }
        console.log(`User balance: ${ethers.utils.formatEther(balance)} JUST`);
      } catch (balanceErr) {
        if (balanceErr.message.includes("balance")) {
          throw balanceErr; // Re-throw balance-specific errors
        }
        console.warn("Could not check balance:", balanceErr);
        // Continue anyway as this is just a pre-check
      }
      
      // Get current delegators before delegation
      const myDelegators = [];
      try {
        const delegatorAddresses = await contracts.justToken.getDelegatorsOf(account);
        for (const addr of delegatorAddresses) {
          try {
            const balance = await contracts.justToken.balanceOf(addr);
            myDelegators.push({
              address: addr,
              balance: ethers.utils.formatEther(balance)
            });
          } catch (err) {
            console.warn(`Error getting delegator ${addr} balance:`, err);
          }
        }
        
        if (myDelegators.length > 0) {
          console.log(`Current delegators who will be affected: ${myDelegators.length}`, 
                     myDelegators.map(d => `${d.address}: ${d.balance} JUST`).join(', '));
          console.log(`Total tokens that will transitively flow: ${
            myDelegators.reduce((sum, d) => sum + parseFloat(d.balance), 0).toFixed(5)
          } JUST`);
        }
      } catch (err) {
        console.warn("Could not check current delegators:", err);
      }
      
      // Execute the delegation with enhanced error handling and higher gas limit
      let receipt;
      try {
        // Use higher gas limit for more complex delegation scenarios
        const tx = await contracts.justToken.delegate(delegateeAddress, {
          gasLimit: 500000 // Increased from 300000
        });
        
        console.log("Delegation transaction submitted:", tx.hash);
        
        receipt = await tx.wait();
        console.log("Delegation transaction confirmed, status:", receipt.status);
        
        if (receipt.status === 0) {
          throw new Error("Transaction was confirmed but execution failed");
        }
      } catch (txErr) {
        console.error("Transaction failed:", txErr);
        
        // Try to extract more specific error information
        let errorMessage = "Transaction failed";
        
        if (txErr.reason) {
          errorMessage += `: ${txErr.reason}`;
        } else if (txErr.error && txErr.error.message) {
          errorMessage += `: ${txErr.error.message}`;
        } else if (txErr.message) {
          errorMessage += `: ${txErr.message}`;
        }
        
        // Check for specific conditions from the error
        if (errorMessage.includes("CALL_EXCEPTION")) {
          if (targetIsDelegating) {
            errorMessage += ". This is likely because the target is already delegating, which may create an invalid delegation chain";
          } else {
            errorMessage += ". There may be a contract-level restriction preventing this delegation";
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Perform post-delegation checks
      try {
        // Check if any delegators are now affected by transitive delegation
        const delegators = await contracts.justToken.getDelegatorsOf(account);
        if (delegators.length > 0) {
          console.log(`This account has ${delegators.length} delegators whose tokens will now transitively flow to ${delegateeAddress}`);
          
          // Calculate total tokens that will transitively flow
          let totalTransitiveTokens = 0;
          for (const delegator of delegators) {
            if (delegator.toLowerCase() !== account.toLowerCase()) {
              try {
                const balance = await contracts.justToken.balanceOf(delegator);
                totalTransitiveTokens += parseFloat(ethers.utils.formatEther(balance));
              } catch (err) {
                console.warn(`Error getting balance for delegator ${delegator}:`, err);
              }
            }
          }
          
          console.log(`Total tokens that will transitively flow: ${totalTransitiveTokens.toFixed(5)} JUST`);
        }
        
        // Fetch and log the new delegation chain
        await fetchDelegationChain(account);
        
        // Update effective voting power after delegation
        const newVotingPower = await getEffectiveVotingPower(account);
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setDelegationInfo(prev => ({
            ...prev,
            effectiveVotingPower: newVotingPower
          }));
        }
      } catch (err) {
        console.warn("Could not perform post-delegation checks:", err);
      }
      
      // Refresh blockchain data to update state
      refreshData();
      
      return true;
    } catch (err) {
      console.error("Error delegating:", err);
      if (isMounted.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Reset delegation (self-delegate)
  const resetDelegation = async () => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.justToken) throw new Error("Token contract not initialized");
    
    try {
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }
      
      console.log("Resetting delegation to self");
      
      // Check for delegators first
      try {
        const delegators = await contracts.justToken.getDelegatorsOf(account);
        if (delegators.length > 0) {
          console.log(`This account has ${delegators.length} delegators who will now delegate directly to you`);
        }
      } catch (err) {
        console.warn("Could not check delegators:", err);
      }
      
      // Use a higher gas limit to account for potential complexity
      const options = { gasLimit: 300000 }; // Increased from 200000
      
      let tx;
      // Check if the contract has resetDelegation or if we should use delegate(self)
      if (typeof contracts.justToken.resetDelegation === 'function') {
        // Use resetDelegation if available
        tx = await contracts.justToken.resetDelegation(options);
      } else {
        // Otherwise delegate to self
        tx = await contracts.justToken.delegate(account, options);
      }
      
      console.log("Reset delegation transaction submitted:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Reset delegation transaction confirmed, status:", receipt.status);
      
      if (receipt.status === 0) {
        throw new Error("Transaction was confirmed but execution failed");
      }
      
      // Update effective voting power after resetting delegation
      const newVotingPower = await getEffectiveVotingPower(account);
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        setDelegationInfo(prev => ({
          ...prev,
          effectiveVotingPower: newVotingPower
        }));
      }
      
      // Refresh blockchain data to update state
      refreshData();
      
      return true;
    } catch (err) {
      console.error("Error resetting delegation:", err);
      if (isMounted.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Get effective voting power from the contract
  const getEffectiveVotingPower = useCallback(
    async (address) => {
      if (!isConnected || !contractsReady || !contracts.justToken) {
        return "0";
      }

      try {
        if (isMounted.current) {
          setLoading(true);
        }

        const currentSnapshotId = await contracts.justToken.getCurrentSnapshotId();

        const votingPower = await contracts.justToken.getEffectiveVotingPower(
          address,
          currentSnapshotId
        );

        const formattedVotingPower = ethers.utils.formatEther(votingPower);

        // Only update state if component is still mounted
        if (isMounted.current) {
          setDelegationInfo((prev) => ({
            ...prev,
            effectiveVotingPower: formattedVotingPower,
          }));
        }

        return formattedVotingPower;
      } catch (err) {
        console.error("Error getting effective voting power:", err);
        return "0";
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [isConnected, contractsReady, contracts.justToken]
  );

  // Helper function to check delegation depth warning
  const getDelegationDepthWarning = async (sourceAddr, targetAddr) => {
    try {
      if (!contracts || !contracts.justToken) {
        return { warningLevel: 0, message: "Contract not available" };
      }
      
      // If helper contract is available, use it
      if (contracts.daoHelper && typeof contracts.daoHelper.checkDelegationDepthWarning === 'function') {
        try {
          const warningLevel = await contracts.daoHelper.checkDelegationDepthWarning(sourceAddr, targetAddr);
          
          let message = "";
          if (warningLevel === 3) {
            message = "This delegation would exceed the maximum delegation depth limit or create a cycle";
          } else if (warningLevel === 2) {
            message = "This delegation will reach the maximum allowed delegation depth";
          } else if (warningLevel === 1) {
            message = "This delegation is getting close to the maximum depth limit";
          }
          
          return { warningLevel, message };
        } catch (err) {
          console.warn("Error using helper for depth warning:", err);
          // Fall back to manual check
        }
      }
      
      // If no helper or it failed, do manual check
      const chainCheck = await checkCombinedDelegationChains(sourceAddr, targetAddr);
      
      if (chainCheck.hasCycle) {
        return { 
          warningLevel: 3,
          message: "This delegation would create a cycle in the delegation chain" 
        };
      }
      
      if (chainCheck.combinedDepth > 8) {
        return { 
          warningLevel: 3, 
          message: `This delegation would exceed the maximum depth limit (${chainCheck.combinedDepth} > 8)` 
        };
      }
      
      if (chainCheck.combinedDepth >= 7) {
        return { 
          warningLevel: 2, 
          message: `This delegation will reach the maximum allowed delegation depth (${chainCheck.combinedDepth})` 
        };
      }
      
      if (chainCheck.combinedDepth >= 5) {
        return { 
          warningLevel: 1, 
          message: `This delegation is getting close to the maximum depth limit (${chainCheck.combinedDepth})` 
        };
      }
      
      return { warningLevel: 0, message: "" };
    } catch (err) {
      console.error("Error checking delegation depth warning:", err);
      return { 
        warningLevel: 0, 
        message: "Could not check delegation depth" 
      };
    }
  };
  
  // Helper function to check combined delegation chains
  const checkCombinedDelegationChains = async (sourceAddr, targetAddr) => {
    try {
      // Get current chains for both addresses
      const sourceChain = await fetchDelegationChain(sourceAddr);
      const targetChain = await fetchDelegationChain(targetAddr);
      
      // Check for potential cycles when these chains are connected
      const addresses = new Set();
      for (const addr of sourceChain) {
        addresses.add(addr.toLowerCase());
      }
      
      // Check if connecting to target chain would create a cycle
      let hasCycle = false;
      for (const addr of targetChain) {
        if (addr.toLowerCase() !== targetAddr.toLowerCase() && 
            addresses.has(addr.toLowerCase())) {
          hasCycle = true;
          break;
        }
      }
      
      // Calculate combined chain depth
      const combinedDepth = sourceChain.length + targetChain.length - 1;
      
      return {
        hasCycle,
        combinedDepth, 
        sourceChain, 
        targetChain
      };
    } catch (err) {
      console.error("Error checking combined delegation chains:", err);
      return {
        hasCycle: false,
        combinedDepth: 0,
        sourceChain: [sourceAddr],
        targetChain: [targetAddr]
      };
    }
  };

  // Manual function to fetch delegation info
  const fetchDelegationInfo = async () => {
    if (!isConnected || !contractsReady || !account) {
      return;
    }
    
    try {
      if (isMounted.current) {
        setLoading(true);
      }
      
      // Get basic delegation info
      const currentDelegate = await contracts.justToken.getDelegate(account);
      const isSelfDelegated = 
        currentDelegate === ethers.constants.AddressZero || 
        currentDelegate.toLowerCase() === account.toLowerCase();
      
      // Get locked tokens
      const lockedTokens = !isSelfDelegated ? 
        await contracts.justToken.balanceOf(account) : 
        ethers.BigNumber.from(0);
      
      // Get delegators
      const delegators = await fetchDelegators(account);
      
      // Calculate delegated to you
      const delegatedToYou = delegators
        .filter(d => d.address.toLowerCase() !== account.toLowerCase())
        .reduce((sum, d) => sum + parseFloat(d.balance), 0);
      
      // Get delegation chain
      const delegationChain = await fetchDelegationChain(account);
      
      // Get effective voting power
      const effectiveVotingPower = await getEffectiveVotingPower(account);
      
      // Update state only if component is still mounted
      if (isMounted.current) {
        setDelegationInfo({
          currentDelegate,
          lockedTokens: ethers.utils.formatEther(lockedTokens),
          delegatedToYou: delegatedToYou.toString(),
          delegators,
          isSelfDelegated,
          delegationChain,
          effectiveVotingPower
        });
      }
      
      // Also refresh global data
      refreshData();
    } catch (err) {
      console.error("Error fetching delegation info:", err);
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Fetch delegators of a given address
  const fetchDelegators = async (address) => {
    if (!isConnected || !contractsReady || !contracts.justToken) {
      return [];
    }
    
    try {
      if (isMounted.current) {
        setLoading(true);
      }
      
      // Get delegator addresses
      const delegatorAddresses = await contracts.justToken.getDelegatorsOf(address);
      
      // Get balance for each delegator
      const delegators = await Promise.all(
        delegatorAddresses.map(async (delegatorAddr) => {
          try {
            const balance = await contracts.justToken.balanceOf(delegatorAddr);
            const formattedBalance = ethers.utils.formatEther(balance);
            
            // Check if this delegator is also delegating to others
            const delegatorDelegate = await contracts.justToken.getDelegate(delegatorAddr);
            const isSelfDelegated = 
              delegatorDelegate === ethers.constants.AddressZero || 
              delegatorDelegate.toLowerCase() === delegatorAddr.toLowerCase();
            
            return {
              address: delegatorAddr,
              balance: formattedBalance,
              isSelfDelegated
            };
          } catch (err) {
            console.warn(`Error getting delegator ${delegatorAddr} details:`, err);
            return {
              address: delegatorAddr,
              balance: "0",
              isSelfDelegated: true
            };
          }
        })
      );
      
      return delegators;
    } catch (err) {
      console.error("Error fetching delegators:", err);
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };
  
  // Return all functions with improved error handling
  return {
    delegationInfo,
    loading,
    error,
    delegate,
    resetDelegation,
    fetchDelegators,
    fetchDelegationInfo,
    fetchDelegationChain,
    getEffectiveVotingPower,
    getDelegationDepthWarning  // New helper function
  };
}

export default useDelegation;