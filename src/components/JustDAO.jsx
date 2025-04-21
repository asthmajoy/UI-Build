import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';
import { useBlockchainData } from '../contexts/BlockchainDataContext';
import { formatAddress } from '../utils/formatters';
import { formatTokenAmount } from '../utils/tokenFormatters';
import { PROPOSAL_STATES } from '../utils/constants';
import { ethers } from 'ethers';
import { DarkModeProvider, useDarkMode } from '../contexts/DarkModeContext';
import DarkModeToggle from './DarkModeToggle';
import _ from 'lodash';
import MobileNavigation from './MobileNavigation';
import WalletSelector from './WalletSelector';

// Import components
import HomePage from './HomePage';
import SecuritySettingsTab from './SecuritySettingsTab';
import RoleManagementTab from './RoleManagementTab';
import TimelockSettingsTab from './TimelockSettingsTab';
import EmergencyControlsTab from './EmergencyControlsTab';
import PendingTransactionsTab from './PendingTransactionsTab';
import ProposalsTab from './ProposalsTab';
import VoteTab from './VoteTab';
import DelegationTab from './DelegationTab';
import AnalyticsTab from './AnalyticsTab';
import DashboardTab from './DashboardTab';
import GovernanceTab from './GovernanceTab';

// Define role constants to ensure consistency
const ROLES = {
  DEFAULT_ADMIN_ROLE: ethers.utils.hexZeroPad("0x00", 32),
  ADMIN_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE")),
  GUARDIAN_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GUARDIAN_ROLE")),
  ANALYTICS_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ANALYTICS_ROLE")),
  GOVERNANCE_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GOVERNANCE_ROLE")),
  MINTER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
  PROPOSER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSER_ROLE")),
  EXECUTOR_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EXECUTOR_ROLE")),
  CANCELLER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CANCELLER_ROLE")),
  TIMELOCK_ADMIN_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TIMELOCK_ADMIN_ROLE"))
};

// Helper function to safely convert string to number
const safeStringToNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const numValue = parseFloat(String(value));
  return isNaN(numValue) ? 0 : numValue;
};

// The main component that needs to be wrapped with DarkModeProvider
const JustDAOContent = () => {
  const { isDarkMode } = useDarkMode();
  
  // Add mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State for active tab - set 'home' as the default
  const [activeTab, setActiveTab] = useState('home');
  
  // State for active security subtab
  const [securitySubtab, setSecuritySubtab] = useState('emergency');
  
  // State to track window width
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // State to track refresh animation
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Add state for wallet selector modal
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  
  // Add wallet disconnect state
  const [disconnecting, setDisconnecting] = useState(false);
  
  // Add warning message state for analytics access restriction
  const [warningMessage, setWarningMessage] = useState('');
  
  // Add a refresh counter to force re-renders of child components
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // State to track user roles directly from contract
  const [userRoles, setUserRoles] = useState({
    isAdmin: false,
    isGuardian: false,
    isAnalytics: false,
    isGovernance: false, // Added governance role
  });
  
  // State to track the effective voting power from the contract
  const [transitiveVotingPower, setTransitiveVotingPower] = useState(null);
  
  // REF to track if component is mounted - FIX FOR MEMORY LEAK
  const isMounted = useRef(true);
  
  // Add a flag to prevent multiple refresh operations
  const isRefreshingRef = useRef(false);
  
  // Web3 context for blockchain connection
  const { account, isConnected, connectWallet, disconnectWallet, contracts } = useWeb3();
  
  // Auth context for user roles
  const { hasRole } = useAuth();
  
  // Use our blockchain data context
  const { 
    userData, 
    daoStats, 
    isLoading: dataLoading, 
    refreshData, 
    getProposalVoteTotals 
  } = useBlockchainData();
  
  // Check if user has non-zero JST balance
  const hasNonZeroBalance = useCallback(() => {
    if (!userData || !userData.balance) return false;
    const numBalance = safeStringToNumber(userData.balance);
    return numBalance > 0;
  }, [userData]);
  
  // Function to handle navigation with JST balance check only for analytics content access
  const navigateToTab = useCallback((tabName) => {
    if (tabName === 'analytics' && !hasNonZeroBalance()) {
      // Still set the tab to 'analytics' so the tab appears active
      setActiveTab('analytics');
      // Show warning message
      setWarningMessage('You need to hold JST tokens to view Analytics data. Donate ETH to receive JST tokens.');
    } else {
      setWarningMessage(''); // Clear any warning messages
      setActiveTab(tabName);
    }
    setMobileMenuOpen(false); // Close mobile menu when navigating
  }, [hasNonZeroBalance]);
  
  // Handle disconnect with proper UI state management
  const handleDisconnect = useCallback(async () => {
    try {
      setDisconnecting(true);
      
      // Log the disconnection attempt
      console.log("Disconnecting wallet...");
      
      // Call the actual disconnect function from Web3Context
      const success = await disconnectWallet();
      
      console.log("Disconnect result:", success);
      
      setDisconnecting(false);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      setDisconnecting(false);
    }
  }, [disconnectWallet]);
  
  // Handle wallet connection via the modal
  const handleWalletConnect = async (walletType) => {
    try {
      console.log(`Connecting to ${walletType}...`);
      const success = await connectWallet(walletType);
      
      if (success) {
        // Close the modal on successful connection
        setShowWalletSelector(false);
        
        // Refresh data after connection
        if (refreshData) {
          refreshData();
        }
      }
      
      return success;
    } catch (error) {
      console.error(`Error connecting with ${walletType}:`, error);
      return false;
    }
  };
  
  // Close the wallet selector modal
  const closeWalletSelector = () => {
    setShowWalletSelector(false);
  };
  
  // Listen for window resize events
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Check roles directly from contracts - improved with multiple contract checks
  // FIX for memory leak: Added isMounted ref check before setting state
  useEffect(() => {
    const checkRolesDirectly = async () => {
      if (!isConnected || !account) return;
      
      // Log which contract we're using to check roles
      console.log("Checking roles using contracts:", contracts);
      
      try {
        let isAdmin = false;
        let isGuardian = false;
        let isAnalytics = false;
        let isGovernance = false; // Added governance role check
        
        // Try using justToken first
        if (contracts.justToken) {
          try {
            isAdmin = await contracts.justToken.hasRole(ROLES.ADMIN_ROLE, account);
            isGuardian = await contracts.justToken.hasRole(ROLES.GUARDIAN_ROLE, account);
            isAnalytics = await contracts.justToken.hasRole(ROLES.ANALYTICS_ROLE, account);
            isGovernance = await contracts.justToken.hasRole(ROLES.GOVERNANCE_ROLE, account); // Check governance role
            console.log("Role check from justToken:", { isAdmin, isGuardian, isAnalytics, isGovernance });
          } catch (err) {
            console.warn("Error checking roles from justToken:", err);
          }
        }
        
        // Try using governance as fallback
        if ((!isAdmin || !isGuardian || !isAnalytics || !isGovernance) && contracts.governance) {
          try {
            if (!isAdmin) isAdmin = await contracts.governance.hasRole(ROLES.ADMIN_ROLE, account);
            if (!isGuardian) isGuardian = await contracts.governance.hasRole(ROLES.GUARDIAN_ROLE, account);
            if (!isAnalytics) isAnalytics = await contracts.governance.hasRole(ROLES.ANALYTICS_ROLE, account);
            if (!isGovernance) isGovernance = await contracts.governance.hasRole(ROLES.GOVERNANCE_ROLE, account); // Check governance role
            console.log("Role check from governance:", { isAdmin, isGuardian, isAnalytics, isGovernance });
          } catch (err) {
            console.warn("Error checking roles from governance:", err);
          }
        }
        
        // Try using timelock as another fallback
        if ((!isAdmin || !isGuardian || !isAnalytics || !isGovernance) && contracts.timelock) {
          try {
            if (!isAdmin) isAdmin = await contracts.timelock.hasRole(ROLES.ADMIN_ROLE, account);
            if (!isGuardian) isGuardian = await contracts.timelock.hasRole(ROLES.GUARDIAN_ROLE, account);
            if (!isAnalytics) isAnalytics = await contracts.timelock.hasRole(ROLES.ANALYTICS_ROLE, account);
            if (!isGovernance) isGovernance = await contracts.timelock.hasRole(ROLES.GOVERNANCE_ROLE, account); // Check governance role
            console.log("Role check from timelock:", { isAdmin, isGuardian, isAnalytics, isGovernance });
          } catch (err) {
            console.warn("Error checking roles from timelock:", err);
          }
        }
        
        // Save the results - ONLY if component is still mounted
        if (isMounted.current) {
          setUserRoles({
            isAdmin,
            isGuardian,
            isAnalytics,
            isGovernance // Include governance role
          });
        }
        
      } catch (error) {
        console.error("Error checking roles directly:", error);
      }
    };
    
    checkRolesDirectly();
    
    // Clean up function to prevent memory leaks
    return () => {
      // Component will unmount
    };
  }, [account, isConnected, contracts]);
  
  // Import delegationHook, proposalsHook, and votingHook as before
  // These would be used for actions, while our blockchain data context handles data fetching
  const { useDelegation } = require('../hooks/useDelegation');
  const { useProposals } = require('../hooks/useProposals');
  const { useVoting } = require('../hooks/useVoting');
  
  const delegation = useDelegation();
  const proposalsHook = useProposals();
  const votingHook = useVoting();
  
  // References to store refresh timers for cleanup
  const refreshTimerRef = useRef(null);
  const votingPowerTimerRef = useRef(null);
  
  // Format numbers based on window width
  const formatTokenBasedOnWidth = (value) => {
    if (!value) return '0';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0';
    
    // Determine decimal places based on window width and value size
    let decimals = 8; // Maximum decimals for full screen
  
    if (windowWidth < 640) {
      // Small screen (1/4 window)
      decimals = 4;
    } else if (windowWidth < 960) {
      // Medium screen (1/2 window)
      decimals = 6; 
    } else {
      // Full screen
      if (numValue >= 10000) {
        decimals = 4;
      } else if (numValue >= 1000) {
        decimals = 5;
      } else if (numValue >= 100) {
        decimals = 6;
      } else {
        decimals = 8;
      }
    }
    
    // For very small values, always show some precision
    if (numValue > 0 && numValue < 0.01) {
      decimals = Math.max(decimals, 6);
    }
    
    // Format the number with appropriate decimals
    return numValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  };
  
  // Format numbers to be more readable
  const formatNumber = (value, decimals = 2) => {
    // Handle potentially invalid input
    const numValue = safeStringToNumber(value);
    
    // If it's a whole number or very close to it, don't show decimals
    if (Math.abs(numValue - Math.round(numValue)) < 0.00001) {
      return numValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    
    // Format with the specified number of decimal places
    return numValue.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  };
  
  // Helper function to properly detect self-delegation (copied from DelegationTab)
  const isSelfDelegated = (userAddress, delegateAddress) => {
    if (!userAddress || !delegateAddress) return true; // Default to self-delegated if addresses aren't available
    
    // Normalize addresses for comparison
    const normalizedUserAddr = userAddress.toLowerCase();
    const normalizedDelegateAddr = delegateAddress.toLowerCase();
    
    // Check if delegate is self or zero address
    return normalizedUserAddr === normalizedDelegateAddr || 
           delegateAddress === '0x0000000000000000000000000000000000000000';
  };

  // Get actual delegated tokens by excluding self if self-delegated (copied from DelegationTab)
  const actualDelegatedToYou = () => {
    // If no delegators, return 0
    if (!userData.delegators || userData.delegators.length === 0) {
      return "0";
    }
    
    // Calculate sum of all delegator balances
    return userData.delegators.reduce((sum, delegator) => {
      // Skip if the delegator is the user themselves (to avoid double counting)
      if (delegator.address.toLowerCase() === account.toLowerCase()) {
        return sum;
      }
      return sum + parseFloat(delegator.balance || "0");
    }, 0).toString();
  };

  // Calculate direct voting power without double counting (based on DelegationTab logic)
  const calculateDirectVotingPower = () => {
    // Check if user is self-delegated
    const selfDelegated = isSelfDelegated(account, userData.delegate);
    
    if (!selfDelegated) {
      return "0"; // Not self-delegated, no voting power
    }
    
    const ownBalance = parseFloat(userData.balance || "0");
    const delegatedTokens = parseFloat(actualDelegatedToYou());
    
    return (ownBalance + delegatedTokens).toString();
  };
  
  // Render security subcomponent based on securitySubtab state
  const renderSecuritySubtab = () => {
    switch (securitySubtab) {
      case 'emergency':
        return <EmergencyControlsTab contracts={contracts} account={account} hasRole={hasRole} />;
      case 'roles':
        return <RoleManagementTab contracts={contracts} />;
      case 'timelock':
        return <TimelockSettingsTab contracts={contracts} />;
      case 'pending':
        return <PendingTransactionsTab contracts={contracts} account={account} />;
      default:
        return <EmergencyControlsTab contracts={contracts} account={account} hasRole={hasRole} />;
    }
  };

  // Create a debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useCallback(_.debounce(() => {
    if (isMounted.current) {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, 1500), []);

  // Handle full app refresh - UPDATED to fix endless refresh issue and memory leaks
  const handleFullRefresh = useCallback(() => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) return;
    
    console.log("Starting comprehensive refresh...");
    
    // Show visual feedback
    setIsRefreshing(true);
    
    // Clear any existing timers to prevent memory leaks
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    // Update refresh counter to trigger re-renders in child components
    setRefreshCounter(prev => prev + 1);
    
    // Set up a maximum timeout to reset refresh state no matter what
    refreshTimerRef.current = setTimeout(() => {
      if (isMounted.current) {
        console.log("Maximum refresh timeout hit - resetting state");
        setIsRefreshing(false);
      }
    }, 5000); // Maximum of 5 seconds for refresh
    
    // Wrap all refresh operations in try/catch to ensure state gets reset
    try {
      // Call all available refresh functions
      refreshData();
      
      // IMPORTANT: Clear all localStorage cache entries related to voting and quorum
      try {
        // Get all localStorage keys
        const localStorageKeys = Object.keys(localStorage);
        
        // Define patterns to match for voting and quorum data
        const patterns = [
          'voteTotals-', 
          'quorum-progress-', 
          'vote-counts-', 
          'indexedVotes-',
          'hasVoted-', 
          'voteType-', 
          'user-vote-',
          'dashboard-votes-',
          'analytics-'
        ];
        
        // Clear matching entries
        localStorageKeys.forEach(key => {
          if (patterns.some(pattern => key.includes(pattern))) {
            console.log(`Clearing cache: ${key}`);
            localStorage.removeItem(key);
          }
        });
      } catch (cacheError) {
        console.warn("Error clearing localStorage cache:", cacheError);
      }
      
      // Force refresh proposals with fresh data
      if (proposalsHook && proposalsHook.fetchProposals) {
        proposalsHook.fetchProposals();
      }
      
      // Refresh voting data if available
      if (votingHook) {
        // Reset any cached data if that function exists
        if (votingHook.resetCache) {
          votingHook.resetCache();
        }
        
        // Call the fetch function to get fresh data
        if (votingHook.fetchVotes) {
          votingHook.fetchVotes();
        }
        
        // Directly invalidate vote caches if that function exists
        if (votingHook.invalidateVoteCaches) {
          votingHook.invalidateVoteCaches();
        }
        
        // ADDED: Force refresh for active proposals - critical for vote totals
        if (proposalsHook?.proposals && Array.isArray(proposalsHook.proposals)) {
          // For all proposals but especially active ones
          proposalsHook.proposals.forEach(proposal => {
            try {
              // If voting hook has custom functions, use them
              if (votingHook.getProposalVoteTotals) {
                votingHook.getProposalVoteTotals(proposal.id, true); // true = force refresh
              }
              
              // If voting hook has event-based query, use it
              if (votingHook.getIndexedVoteData) {
                votingHook.getIndexedVoteData(proposal.id, true); // force refresh
              }
              
              // Force refresh detailed votes too
              if (votingHook.getVoteDataWithCaching) {
                votingHook.getVoteDataWithCaching(proposal.id, true);
              }
            } catch (err) {
              console.warn(`Error refreshing vote data for proposal ${proposal.id}:`, err);
            }
          });
        }
      }
      
      // Refresh delegation data if available
      if (delegation && delegation.fetchDelegationInfo) {
        delegation.fetchDelegationInfo();
      }
      
      // Also refresh transitive voting power with memory leak protection
      if (delegation && delegation.getEffectiveVotingPower && account) {
        try {
          delegation.getEffectiveVotingPower(account)
            .then(power => {
              if (isMounted.current) {
                setTransitiveVotingPower(power);
              }
            })
            .catch(err => console.error("Error refreshing transitive voting power:", err));
        } catch (err) {
          console.error("Error refreshing voting power:", err);
        }
      }
      
      // ADDED: Direct refresh of BlockchainDataContext data
      // This is critical for quorum progress which uses this data
      if (window && window.dispatchEvent) {
        // Create a custom event to trigger refreshes in components
        console.log("Dispatching global refresh event");
        const refreshEvent = new CustomEvent('app:refresh', { 
          detail: { timestamp: Date.now() }
        });
        window.dispatchEvent(refreshEvent);
      }
      
      // Reset the refresh state after a short delay to give user visual feedback
      setTimeout(() => {
        if (isMounted.current) {
          console.log("Normal refresh completion - resetting state");
          setIsRefreshing(false);
        }
      }, 1000);
      
    } catch (error) {
      // Log the error but still reset the state
      console.error("Error during refresh:", error);
      
      // Ensure we reset the refresh state even on error
      setTimeout(() => {
        if (isMounted.current) {
          console.log("Error refresh reset - resetting state");
          setIsRefreshing(false);
        }
      }, 1000);
    }
    
    console.log("Comprehensive refresh operations initiated");
  }, [refreshData, proposalsHook, votingHook, delegation, account, isRefreshing]);
  
  // Handle tab-specific refresh button click - UPDATED with memory leak protection
  const handleRefresh = useCallback(() => {
    refreshData();
    
    // Also refresh transitive voting power with memory leak protection
    if (delegation && delegation.getEffectiveVotingPower && account) {
      // Create a safely wrapped version that checks mounted state before updating
      const safeSetTransitiveVotingPower = (power) => {
        if (isMounted.current) {
          setTransitiveVotingPower(power);
        }
      };
      
      delegation.getEffectiveVotingPower(account)
        .then(safeSetTransitiveVotingPower)
        .catch(err => console.error("Error refreshing transitive voting power:", err));
    }
  }, [refreshData, delegation, account]);

  // Get the correct voting power using the improved transitive calculation method
  const getCorrectVotingPower = () => {
    // First priority: Try to use the fetched transitive voting power if available
    if (transitiveVotingPower !== null) {
      console.log("Using transitive voting power from contract:", transitiveVotingPower);
      return transitiveVotingPower;
    }
    
    // Second priority: Try to use the delegationInfo.effectiveVotingPower if it exists
    if (delegation?.delegationInfo?.effectiveVotingPower) {
      console.log("Using effective voting power from delegationInfo:", delegation.delegationInfo.effectiveVotingPower);
      return delegation.delegationInfo.effectiveVotingPower;
    }
    
    // Check delegation status
    const selfDelegated = isSelfDelegated(account, userData.delegate);
    
    // If user has explicitly delegated to someone else, they have zero voting power
    if (!selfDelegated) {
      return "0"; // User has delegated voting power away
    }
    
    // Use the direct calculation as a fallback
    const calculatedVotingPower = calculateDirectVotingPower();
    
    // Only use fallback data from context if we couldn't calculate properly
    if (!calculatedVotingPower || parseFloat(calculatedVotingPower) === 0) {
      // Use the context values if available and user is self-delegated
      if (userData.onChainVotingPower && parseFloat(userData.onChainVotingPower) > 0) {
        return userData.onChainVotingPower;
      }
      return userData.votingPower;
    }
    
    return calculatedVotingPower;
  };
  
  // FIX: Add proper cleanup of async operations
  useEffect(() => {
    // Set isMounted ref to true when component mounts
    isMounted.current = true;
    
    console.log("Effect triggered", { isConnected, account, contracts: contracts.justToken, delegation });
    
    // Return cleanup function
    return () => {
      // Set isMounted ref to false when component unmounts
      isMounted.current = false;
      isRefreshingRef.current = false;
      
      // Clear any pending timers
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      if (votingPowerTimerRef.current) {
        clearTimeout(votingPowerTimerRef.current);
        votingPowerTimerRef.current = null;
      }
      
      // Cancel any pending debounced calls
      debouncedRefresh.cancel();
    };
  }, [isConnected, account, contracts.justToken, delegation, debouncedRefresh]);
  
  // Get label for Voting Power based on window width
  const getVotingPowerLabel = () => {
    if (windowWidth < 300) {
      return "VP";
    } else {
      return "Voting Power";
    }
  };

  // We've replaced the renderWarningMessage function with inline warning banner in the header

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Updated Modern Header */}
      <header className={`bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800 transition-all duration-300 ${isDarkMode ? 'dark' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3">
          <div className="flex flex-col">
            {/* Top Row with Logo and Controls */}
            <div className="flex items-center justify-between">
              {/* Logo Section - Centered */}
              <div className="flex items-center transform hover:scale-102 transition-transform duration-300 pt-4">
                <div className="group relative">
                  <h1 
                    className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-500 tracking-tight cursor-pointer" 
                    onClick={() => navigateToTab('home')}
                  >
                    JustDAO
                  </h1>
                  <div className="absolute -bottom-1 h-1 w-0 bg-indigo-500 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></div>
                </div>
              </div>

              {/* Mobile Menu Button with Current Tab Label - Only visible on small screens */}
              <div className="sm:hidden flex items-center pt-4">
                <MobileNavigation 
                  activeTab={activeTab}
                  setActiveTab={navigateToTab}
                  securitySubtab={securitySubtab}
                  setSecuritySubtab={setSecuritySubtab}
                  userRoles={userRoles}
                  hasRole={hasRole}
                  ROLES={ROLES}
                  hasNonZeroBalance={hasNonZeroBalance}
                />
              </div>

              {/* Account and Controls Section - Shown on all screen sizes */}
              <div className="hidden sm:flex flex-col items-end gap-3 ml-auto pt-4">
                {isConnected ? (
                  <div className="flex flex-col items-end text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {/* Address */}
                        <span className="font-medium">{formatAddress(account)}</span>
                        
                        {/* Refresh button as green icon button */}
                        <button 
                          className={`text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors duration-200 ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
                          onClick={handleFullRefresh}
                          disabled={isRefreshing}
                          aria-label="Refresh data"
                        >
                          <svg 
                            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2" 
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </button>
                        
                        {/* Dark mode toggle */}
                        <div className="transform scale-90">
                          <DarkModeToggle />
                        </div>
                      </div>
                      
                      {/* Updated Disconnect button */}
                      <button 
                        className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-xs font-medium transition-colors duration-200"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        aria-label="Disconnect wallet"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        <span>{disconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
                      </button>
                    </div>
                    
                    {/* JST and Voting Power displays for desktop - Below other controls */}
                    <div className="flex items-center gap-2 mt-2">
                      {/* JST with outline and icon */}
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 group hover:border-indigo-400 dark:hover:border-indigo-400 transition-colors duration-200">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium mr-1">JST:</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-200">
                          {formatTokenBasedOnWidth(userData.balance)}
                        </span>
                      </div>
                      
                      {/* Voting Power with outline and icon */}
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 group hover:border-indigo-400 dark:hover:border-indigo-400 transition-colors duration-200">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium mr-1">{getVotingPowerLabel()}:</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-200">
                          {formatTokenBasedOnWidth(getCorrectVotingPower())}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  
                ) : (
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      {/* Dark mode toggle for when not connected */}
                      <div className="transform scale-90 mr-1">
                        <DarkModeToggle />
                      </div>
                      <span>Not connected</span>
                    </div>
                    
                    {/* Connect button */}
                    <button 
                      className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-300 text-sm font-medium dark:from-indigo-500 dark:to-indigo-400 dark:hover:from-indigo-600 dark:hover:to-indigo-500"
                      onClick={() => setShowWalletSelector(true)}
                    >
                      Connect Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile account controls - Centered with wrapping */}
            <div className="sm:hidden">
              {isConnected ? (
                <div className="flex flex-col items-center w-full px-4 mt-3">
                  {/* Top row with address, refresh, and dark mode */}
                  <div className="flex flex-wrap items-center justify-center gap-3 w-full text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {/* Address */}
                    <span className="font-medium">
                      {formatAddress(account).substring(0, 6)}...{formatAddress(account).substring(formatAddress(account).length - 4)}
                    </span>
                    
                    {/* Refresh button as green icon button */}
                    <button 
                      className={`text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors duration-200 ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
                      onClick={handleFullRefresh}
                      disabled={isRefreshing}
                      aria-label="Refresh data"
                    >
                      <svg 
                        className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                    
                    {/* Dark mode toggle */}
                    <div className="transform scale-90">
                      <DarkModeToggle />
                    </div>
                    
                    {/* Updated Disconnect button for mobile */}
                    <button 
                      className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-xs font-medium transition-colors duration-200"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      aria-label="Disconnect wallet"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                      </svg>
                      <span>{disconnecting ? '...' : 'Disconnect'}</span>
                    </button>
                  </div>
                  
                  {/* Bottom Row with JST and Voting Power */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {/* JST with outline and icon */}
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 group hover:border-indigo-400 dark:hover:border-indigo-400 transition-colors duration-200">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-medium mr-1">JST:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-200">
                        {formatTokenBasedOnWidth(userData.balance)}
                      </span>
                    </div>
                    
                    {/* Voting Power with outline and icon */}
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 group hover:border-indigo-400 dark:hover:border-indigo-400 transition-colors duration-200">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-medium mr-1">{getVotingPowerLabel()}:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-200">
                        {formatTokenBasedOnWidth(getCorrectVotingPower())}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center items-center gap-3 text-sm text-gray-700 dark:text-gray-300 mt-3 px-4">
                  <div className="flex items-center gap-2">
                    {/* Dark mode toggle for when not connected */}
                    <div className="transform scale-90 mr-1">
                      <DarkModeToggle />
                    </div>
                    <span>Not connected</span>
                  </div>
                  
                  {/* Connect button */}
                  <button 
                    className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-300 text-sm font-medium dark:from-indigo-500 dark:to-indigo-400 dark:hover:from-indigo-600 dark:hover:to-indigo-500"
                    onClick={() => setShowWalletSelector(true)}
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu dropdown - Only visible when mobileMenuOpen is true */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
          <div className="py-3 px-4 space-y-2">
            {/* Home tab */}
            <div 
              className={`py-2 px-3 rounded-md cursor-pointer ${activeTab === 'home' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}`}
              onClick={() => navigateToTab('home')}
            >
              <div className="flex items-center gap-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                <span>Home</span>
              </div>
            </div>
            
            {/* Dashboard tab */}
            <div 
              className={`py-2 px-3 rounded-md cursor-pointer ${activeTab === 'dashboard' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}`}
              onClick={() => navigateToTab('dashboard')}
            >
              <div className="flex items-center gap-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                <span>Dashboard</span>
              </div>
            </div>
            
            {/* Proposals tab */}
            <div 
              className={`py-2 px-3 rounded-md cursor-pointer ${activeTab === 'proposals' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}`}
              onClick={() => navigateToTab('proposals')}
            >
              <div className="flex items-center gap-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                <span>Proposals</span>
              </div>
            </div>
            
            {/* Vote tab */}
            <div 
              className={`py-2 px-3 rounded-md cursor-pointer ${activeTab === 'vote' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}`}
              onClick={() => navigateToTab('vote')}
            >
              <div className="flex items-center gap-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                <span>Vote</span>
              </div>
            </div>
            
            {/* Delegation tab */}
            <div 
              className={`py-2 px-3 rounded-md cursor-pointer ${activeTab === 'delegation' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}`}
              onClick={() => navigateToTab('delegation')}
            >
              <div className="flex items-center gap-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                <span>Delegation</span>
              </div>
            </div>
            
            {/* Analytics tab - Now visible to all users on mobile too */}
            <div 
              className={`py-2 px-3 rounded-md cursor-pointer ${activeTab === 'analytics' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}`}
              onClick={() => navigateToTab('analytics')}
            >
              <div className="flex items-center gap-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                <span>Analytics</span>
              </div>
            </div>
            
            {/* Governance tab - only visible to users with GOVERNANCE_ROLE */}
            {(userRoles.isGovernance || hasRole(ROLES.GOVERNANCE_ROLE) || hasRole('governance')) && (
              <div 
                className={`py-2 px-3 rounded-md cursor-pointer ${activeTab === 'governance' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}`}
                onClick={() => navigateToTab('governance')}
              >
                <div className="flex items-center gap-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  <span>Governance</span>
                </div>
              </div>
            )}

            {/* Security tab - only visible to admin or guardian roles */}
            {(userRoles.isAdmin || userRoles.isGuardian || hasRole(ROLES.ADMIN_ROLE) || hasRole(ROLES.GUARDIAN_ROLE) || hasRole('admin') || hasRole('guardian')) && (
              <>
                <div 
                  className={`py-2 px-3 rounded-md cursor-pointer ${activeTab === 'security' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}`}
                  onClick={() => {
                    navigateToTab('security');
                    setSecuritySubtab('emergency');
                  }}
                >
                  <div className="flex items-center gap-2">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    <span>Security</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Modern Responsive Navigation Tabs - For desktop only */}
<div className="hidden sm:block bg-white dark:bg-gray-800 shadow mb-6">
  <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3">
    <nav className="flex flex-col items-stretch">
      {/* Desktop navigation tabs - Left-justified with centered wrapping */}
      <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2">
        {/* Home tab */}
        <div 
          className={`
            relative py-4 px-3 cursor-pointer 
            text-center transition-all duration-300 
            ${activeTab === 'home' 
              ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
          `}
          onClick={() => navigateToTab('home')}
          data-tab="home"
        >
          <span className="relative">
            Home
            <span 
              className={`
                absolute left-0 right-0 -bottom-1 h-0.5
                ${activeTab === 'home' 
                  ? 'bg-indigo-500 opacity-100' 
                  : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600 opacity-0 group-hover:opacity-100'}
                transition-all duration-300
              `}
            />
          </span>
        </div>
        
        {/* Dashboard tab */}
        <div 
          className={`
            relative py-4 px-3 cursor-pointer 
            text-center transition-all duration-300 
            ${activeTab === 'dashboard' 
              ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
          `}
          onClick={() => navigateToTab('dashboard')}
          data-tab="dashboard"
        >
          <span className="relative">
            Dashboard
            <span 
              className={`
                absolute left-0 right-0 -bottom-1 h-0.5
                ${activeTab === 'dashboard' 
                  ? 'bg-indigo-500 opacity-100' 
                  : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600 opacity-0 group-hover:opacity-100'}
                transition-all duration-300
              `}
            />
          </span>
        </div>
        
        {/* Proposals tab */}
        <div 
          className={`
            relative py-4 px-3 cursor-pointer 
            text-center transition-all duration-300 
            ${activeTab === 'proposals' 
              ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
          `}
          onClick={() => navigateToTab('proposals')}
          data-tab="proposals"
        >
          <span className="relative">
            Proposals
            <span 
              className={`
                absolute left-0 right-0 -bottom-1 h-0.5
                ${activeTab === 'proposals' 
                  ? 'bg-indigo-500 opacity-100' 
                  : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600 opacity-0 group-hover:opacity-100'}
                transition-all duration-300
              `}
            />
          </span>
        </div>

        {/* Grouped tabs: Vote, Delegation, Analytics */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {/* Vote tab */}
          <div 
            className={`
              relative py-4 px-3 cursor-pointer 
              text-center transition-all duration-300 
              ${activeTab === 'vote' 
                ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
            `}
            onClick={() => navigateToTab('vote')}
            data-tab="vote"
          >
            <span className="relative">
              Vote
              <span 
                className={`
                  absolute left-0 right-0 -bottom-1 h-0.5
                  ${activeTab === 'vote' 
                    ? 'bg-indigo-500 opacity-100' 
                    : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600 opacity-0 group-hover:opacity-100'}
                  transition-all duration-300
                `}
              />
            </span>
          </div>
          
          {/* Delegation tab */}
          <div 
            className={`
              relative py-4 px-3 cursor-pointer 
              text-center transition-all duration-300 
              ${activeTab === 'delegation' 
                ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
            `}
            onClick={() => navigateToTab('delegation')}
            data-tab="delegation"
          >
            <span className="relative">
              Delegation
              <span 
                className={`
                  absolute left-0 right-0 -bottom-1 h-0.5
                  ${activeTab === 'delegation' 
                    ? 'bg-indigo-500 opacity-100' 
                    : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600 opacity-0 group-hover:opacity-100'}
                  transition-all duration-300
                `}
              />
            </span>
          </div>
          
          {/* Analytics tab - Now visible to all users */}
          <div 
            className={`
              relative py-4 px-3 cursor-pointer 
              text-center transition-all duration-300 
              ${activeTab === 'analytics' 
                ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
            `}
            onClick={() => navigateToTab('analytics')}
            data-tab="analytics"
          >
            <span className="relative">
              Analytics
              <span 
                className={`
                  absolute left-0 right-0 -bottom-1 h-0.5
                  ${activeTab === 'analytics' 
                    ? 'bg-indigo-500 opacity-100' 
                    : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600 opacity-0 group-hover:opacity-100'}
                  transition-all duration-300
                `}
              />
            </span>
          </div>
        </div>
        
        {/* Governance tab - only visible to users with GOVERNANCE_ROLE */}
        {(userRoles.isGovernance || hasRole(ROLES.GOVERNANCE_ROLE) || hasRole('governance')) && (
          <div 
            className={`
              relative py-4 px-3 cursor-pointer 
              text-center transition-all duration-300 
              ${activeTab === 'governance' 
                ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
            `}
            onClick={() => navigateToTab('governance')}
            data-tab="governance"
          >
            <span className="relative">
              Governance
              <span 
                className={`
                  absolute left-0 right-0 -bottom-1 h-0.5
                  ${activeTab === 'governance' 
                    ? 'bg-indigo-500 opacity-100' 
                    : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600 opacity-0 group-hover:opacity-100'}
                  transition-all duration-300
                `}
              />
            </span>
          </div>
        )}

        {/* Security tab - only visible to admin or guardian roles */}
        {(userRoles.isAdmin || userRoles.isGuardian || hasRole(ROLES.ADMIN_ROLE) || hasRole(ROLES.GUARDIAN_ROLE) || hasRole('admin') || hasRole('guardian')) && (
          <div 
            className={`
              relative py-4 px-3 cursor-pointer 
              text-center transition-all duration-300 
              ${activeTab === 'security' 
                ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
            `}
            onClick={() => {
              navigateToTab('security');
              setSecuritySubtab('emergency'); // Assuming you want to set a default subtab
            }}
            data-tab="security"
          >
            <span className="relative">
              Security
              <span 
                className={`
                  absolute left-0 right-0 -bottom-1 h-0.5
                  ${activeTab === 'security' 
                    ? 'bg-indigo-500 opacity-100' 
                    : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600 opacity-0 group-hover:opacity-100'}
                  transition-all duration-300
                `}
              />
            </span>
          </div>
        )}
      </div>
      
     
     
    </nav>
  </div>
</div>

      {/* Warning Message Banner - Displayed in the header space */}
      {warningMessage && (
        <div className="bg-yellow-50 dark:bg-yellow-900/80 border-b border-yellow-200 dark:border-yellow-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-sm font-medium text-yellow-800 dark:text-yellow-200">{warningMessage}</p>
              </div>
              <button 
                className="ml-auto bg-yellow-100 dark:bg-yellow-800 rounded-md p-1 text-yellow-500 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-gray-800"
                onClick={() => setWarningMessage('')}
                aria-label="Dismiss"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        {/* Home tab - new addition */}
        {activeTab === 'home' && (
          <HomePage navigateToTab={navigateToTab} />
        )}
        
        {activeTab === 'dashboard' && (
          <DashboardTab 
            user={{
              ...userData,
              balance: formatTokenAmount(userData.balance),
              // Make sure we're using the right voting power value
              votingPower: formatTokenAmount(getCorrectVotingPower())
            }}
            stats={daoStats} 
            loading={dataLoading}
            proposals={proposalsHook.proposals
              .filter(p => safeStringToNumber(p.state) === PROPOSAL_STATES.ACTIVE)
              .map(p => ({
                ...p,
                state: safeStringToNumber(p.state),
                yesVotes: formatNumber(p.yesVotes),
                noVotes: formatNumber(p.noVotes),
                abstainVotes: formatNumber(p.abstainVotes),
                id: String(p.id),
                deadline: p.deadline instanceof Date ? p.deadline : new Date(),
                snapshotId: String(p.snapshotId)
              }))
            }
            getProposalVoteTotals={getProposalVoteTotals}
            onRefresh={handleRefresh}
            refreshKey={refreshCounter} // Pass refresh counter as prop
          />
        )}
        
        {activeTab === 'proposals' && (
          <ProposalsTab 
            proposals={proposalsHook.proposals.map(proposal => ({
              ...proposal,
              id: String(proposal.id),
              state: safeStringToNumber(proposal.state),
              yesVotes: formatNumber(proposal.yesVotes),
              noVotes: formatNumber(proposal.noVotes),
              abstainVotes: formatNumber(proposal.abstainVotes),
              snapshotId: String(proposal.snapshotId)
            }))}
            createProposal={proposalsHook.createProposal}
            cancelProposal={proposalsHook.cancelProposal}
            queueProposal={proposalsHook.queueProposal}
            executeProposal={proposalsHook.executeProposal}
            claimRefund={proposalsHook.claimRefund}
            loading={proposalsHook.loading}
            contracts={contracts}
            account={account}
            fetchProposals={proposalsHook.fetchProposals}
            refreshKey={refreshCounter} // Pass refresh counter as prop
          />
        )}
        
        {activeTab === 'vote' && (
          <VoteTab 
            proposals={proposalsHook.proposals.map(proposal => ({
              ...proposal,
              id: String(proposal.id),
              state: safeStringToNumber(proposal.state),
              yesVotes: formatNumber(proposal.yesVotes),
              noVotes: formatNumber(proposal.noVotes),
              abstainVotes: formatNumber(proposal.abstainVotes),
              snapshotId: String(proposal.snapshotId)
            }))}
            castVote={votingHook.castVote}
            hasVoted={votingHook.hasVoted}
            getVotingPower={votingHook.getVotingPower}
            voting={votingHook.voting}
            account={account}
            refreshKey={refreshCounter} // Pass refreshCounter as refreshKey prop
          />
        )}
        
        {activeTab === 'delegation' && (
          <DelegationTab 
            user={{
              ...userData,
              address: account,
              balance: formatTokenAmount(userData.balance),
              // Pass transitive voting power to DelegationTab
              votingPower: formatTokenAmount(getCorrectVotingPower())
            }}
            delegation={{
              ...delegation,
              delegationInfo: {
                currentDelegate: userData.delegate,
                lockedTokens: userData.lockedTokens,
                delegatedToYou: userData.delegatedToYou,
                delegators: userData.delegators || [],
                // Pass the effective voting power to the delegationInfo
                effectiveVotingPower: transitiveVotingPower
              },
              loading: dataLoading
            }}
            refreshKey={refreshCounter} // Pass refresh counter as prop
          />
        )}
        
        {/* Governance tab - only visible to users with GOVERNANCE_ROLE */}
        {activeTab === 'governance' && (userRoles.isGovernance || hasRole(ROLES.GOVERNANCE_ROLE) || hasRole('governance')) && (
          <GovernanceTab 
            contracts={contracts}
            account={account}
            refreshKey={refreshCounter} // Pass refresh counter as prop
          />
        )}
        
        {/* Analytics tab - Now visible to everyone but content is restricted */}
        {activeTab === 'analytics' && !hasNonZeroBalance() ? (
          /* Analytics placeholder with incentive message */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-indigo-500 dark:text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Analytics Access Restricted</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              You need to hold JST tokens in your wallet to access detailed DAO analytics and insights.
            </p>
            <div className="max-w-md mx-auto bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">How to get JST tokens:</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Donate ETH to the DAO treasury and receive JST governance tokens in return. These tokens allow you to:
              </p>
              <ul className="text-left text-indigo-700 dark:text-indigo-300 mb-6 space-y-2">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Access detailed analytics and governance data</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Vote on important governance proposals</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Create, queue, and execute governance proposals</span>
                </li>
              </ul>
              <button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow transition duration-200"
                onClick={() => navigateToTab('home')}
              >
                Return to Home Page
              </button>
            </div>
          </div>
        ) : activeTab === 'analytics' && hasNonZeroBalance() ? (
          <AnalyticsTab refreshKey={refreshCounter} /> // Pass refresh counter as prop
        ) : null}
        
        {activeTab === 'security' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold dark:text-white">Security & Administration</h2>
              <p className="text-gray-500 dark:text-gray-400">Manage security settings and administrative functions</p>
            </div>
            
            {/* Security Subtabs */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-700 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-3 py-1 rounded-full text-sm ${securitySubtab === 'emergency' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                  onClick={() => setSecuritySubtab('emergency')}
                >
                  Emergency Controls
                </button>
                
                {/* Pending Transactions tab - visible to both admin and guardian roles */}
                <button
                  className={`px-3 py-1 rounded-full text-sm ${securitySubtab === 'pending' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                  onClick={() => setSecuritySubtab('pending')}
                >
                  Pending Transactions
                </button>
                
                {/* These tabs are only visible to admin roles */}
                {(userRoles.isAdmin || hasRole(ROLES.ADMIN_ROLE) || hasRole('admin')) && (
                  <>
                    <button
                      className={`px-3 py-1 rounded-full text-sm ${securitySubtab === 'roles' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                      onClick={() => setSecuritySubtab('roles')}
                    >
                      Role Management
                    </button>
                    
                    <button
                      className={`px-3 py-1 rounded-full text-sm ${securitySubtab === 'timelock' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                      onClick={() => setSecuritySubtab('timelock')}
                    >
                      Timelock Settings
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Render the selected security subtab */}
            {renderSecuritySubtab()}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          JustDAO &copy; {new Date().getFullYear()} - Powered by JustDAO Governance Framework
        </div>
      </footer>

      {/* Wallet Selector Modal */}
      {showWalletSelector && (
        <WalletSelector 
          onClose={closeWalletSelector} 
          connectWallet={handleWalletConnect}
        />
      )}
    </div>
  );
};

// Wrapping the main component with DarkModeProvider
const JustDAODashboard = () => {
  return (
    <DarkModeProvider>
      <JustDAOContent />
    </DarkModeProvider>
  );
};

export default JustDAODashboard;