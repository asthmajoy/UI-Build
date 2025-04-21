import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Shield, 
  Lock, 
  Clock, 
  AlertTriangle,
  Check, 
  Users, 
  Code, 
  FileDigit,
  Settings, 
  FileLock,
  Landmark,
  Diff,
  BadgeCheck,
  Vote,
  ChevronDown,
  ChevronUp,
  ChevronRight, 
  ArrowRight
} from 'lucide-react';
import { useBlockchainData } from '../contexts/BlockchainDataContext';
import { useDAOStats } from '../hooks/useDAOStats';
import { useWeb3 } from '../contexts/Web3Context';
import { useGovernanceParams } from '../hooks/useGovernanceParams';
import { ethers } from 'ethers';

// Define all role constants
export const ROLES = { 
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000", 
  ADMIN_ROLE: "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775", 
  GUARDIAN_ROLE: "0x55435dd261a4b9b3364963f7738a7a662ad9c84396d64be3365284bb7f0a5041", 
  ANALYTICS_ROLE: "0x1392683b4fe604b030f727da71b11fe86de118903712aeeae60f8bf8183bbf1b", 
  GOVERNANCE_ROLE: "0x71840dc4906352362b0cdaf79870196c8e42acafade72d5d5a6d59291253ceb1", 
  PROPOSER_ROLE: "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1", 
  EXECUTOR_ROLE: "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63", 
  MINTER_ROLE: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", 
  CANCELLER_ROLE: "0xfd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f783", 
  TIMELOCK_ADMIN_ROLE: "0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5" 
};

// Section divider component
const SectionDivider = ({ title, icon: Icon }) => (
  <div className="flex items-center my-10">
    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
      {Icon && <Icon className="h-5 w-5 text-white" />}
    </div>
    <h2 className="ml-4 text-xl font-bold text-gray-800 dark:text-white border-b-2 border-indigo-500/30 dark:border-indigo-400/30 pb-1">
      {title}
    </h2>
    <div className="ml-4 flex-grow h-px bg-gradient-to-r from-indigo-500/30 to-transparent dark:from-indigo-400/30"></div>
  </div>
);

// Component for collapsible sections
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-10">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-lg group"
      >
        <div className="flex items-center">
          {Icon && (
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center mr-3 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 dark:group-hover:from-indigo-500/30 dark:group-hover:to-purple-500/30 transition-all">
              <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
        </div>
        <div className="text-indigo-500 dark:text-indigo-400 transition-transform duration-300 bg-indigo-50 dark:bg-indigo-900/30 p-1 rounded-full">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      
      <div className={`transition-all duration-300 ease-in-out mt-2 pl-11 ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        {children}
      </div>
    </div>
  );
};

// Main component
const SecurityTabContent = () => {
  // Get blockchain data using provided hooks
  const { userData, daoStats, refreshData } = useBlockchainData();
  const stats = useDAOStats();
  const { contracts, contractsReady, account } = useWeb3();
  const govParams = useGovernanceParams();
  
  // State variables for on-chain data
  const [timelockData, setTimelockData] = useState({
    lowThreatDelay: 0,
    mediumThreatDelay: 0,
    highThreatDelay: 0,
    gracePeriod: 0
  });
  
  const [governanceData, setGovernanceData] = useState({
    roleCount: 0,
    proposalCreationThreshold: '0',
    proposalStake: '0',
    quorum: '0',
    canceledRefundPercentage: 0,
    defeatedRefundPercentage: 0,
    expiredRefundPercentage: 0
  });
  
  const [tokenData, setTokenData] = useState({
    maxDelegationDepth: 0
  });
  
  const [pendingProposals, setPendingProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Define threat levels
  const THREAT_LEVELS = useMemo(() => ({
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2
  }), []);
  
  // Reference to track if data has been loaded to prevent multiple loading attempts
  const dataLoadedRef = useRef(false);
  
  // Reference to track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  
  // Load all data when the component mounts
  useEffect(() => {
    // Define a cleanup function to run when component unmounts
    const cleanup = () => {
      mountedRef.current = false;
    };
    
    const loadData = async () => {
      // If data was already loaded or contracts aren't ready, exit early
      if (dataLoadedRef.current || !contractsReady || !contracts || !contracts.timelock) {
        if (mountedRef.current) {
          setIsLoading(false);
        }
        return;
      }
      
      try {
        // Set loading state
        if (mountedRef.current) {
          setIsLoading(true);
        }
        
        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mountedRef.current) {
            setIsLoading(false);
            console.log("Forced exit from loading state due to timeout");
          }
        }, 10000);
        
        // Get min delay
        const minDelay = await contracts.timelock.minDelay();
        console.log("minDelay:", minDelay.toString());
        
        // Initialize with fallback values
        let lowDelay = minDelay;
        let mediumDelay = minDelay.mul(3); 
        let highDelay = minDelay.mul(7);
        let grace = ethers.BigNumber.from(14 * 86400);
        
        // Try to get threat level delays
        try {
          console.log("Trying getDelayForThreatLevel approach...");
          
          // Use Promise.all to fetch all delays at once
          const [
            lowDelayResult, 
            mediumDelayResult, 
            highDelayResult, 
            gracePeriodResult
          ] = await Promise.all([
            contracts.timelock.getDelayForThreatLevel(0),
            contracts.timelock.getDelayForThreatLevel(1),
            contracts.timelock.getDelayForThreatLevel(2),
            contracts.timelock.gracePeriod()
          ]);
          
          // Update values with successful results
          lowDelay = lowDelayResult;
          mediumDelay = mediumDelayResult;
          highDelay = highDelayResult;
          grace = gracePeriodResult;
          
          console.log("Got lowThreatDelay:", lowDelay.toString());
          console.log("Got mediumThreatDelay:", mediumDelay.toString());
          console.log("Got highThreatDelay:", highDelay.toString());
          console.log("Got gracePeriod:", grace.toString());
          
          console.log("Successfully fetched timelock data via getDelayForThreatLevel");
        } catch (e) {
          console.log("Could not get threat level delays using getDelayForThreatLevel", e);
          
          // Try direct property access as fallback
          try {
            console.log("Trying direct property access...");
            
            // Try to get properties directly, with fallback to existing values
            lowDelay = await contracts.timelock.lowThreatDelay().catch(() => lowDelay);
            mediumDelay = await contracts.timelock.mediumThreatDelay().catch(() => mediumDelay);
            highDelay = await contracts.timelock.highThreatDelay().catch(() => highDelay);
            grace = await contracts.timelock.gracePeriod().catch(() => grace);
          } catch (err) {
            console.log("Could not get direct threat level properties", err);
            // Continue with fallback values
          }
        }
        
        // Convert to days
        const toDays = (seconds) => {
          if (!seconds) return 0;
          try {
            return Math.round(seconds.toNumber() / 86400);
          } catch (err) {
            // Handle case where toNumber() fails (e.g., if seconds is not a BigNumber)
            console.log("Error converting seconds to days:", err);
            const value = typeof seconds === 'string' ? parseInt(seconds) : seconds;
            return Math.round(value / 86400);
          }
        };
        
        // Prepare timelock data object
        const timelockDataUpdate = {
          lowThreatDelay: toDays(lowDelay),
          mediumThreatDelay: toDays(mediumDelay),
          highThreatDelay: toDays(highDelay),
          gracePeriod: toDays(grace)
        };
        
        console.log("Final timelock data:", timelockDataUpdate);
        
        // Update state if component is still mounted
        if (mountedRef.current) {
          setTimelockData(timelockDataUpdate);
        }
        
        // Use governance params from hook if available
        if (govParams && !govParams.loading && !govParams.error && mountedRef.current) {
          setGovernanceData({
            roleCount: Object.keys(ROLES).length, // Set based on ROLES object
            proposalCreationThreshold: govParams.formattedThreshold || '0',
            proposalStake: govParams.formattedStake || '0',
            quorum: govParams.formattedQuorum || '0',
            canceledRefundPercentage: govParams.canceledRefundPercentage || 75,
            defeatedRefundPercentage: govParams.defeatedRefundPercentage || 50,
            expiredRefundPercentage: govParams.expiredRefundPercentage || 25
          });
        } else {
          // Fallback if governance params not available
          try {
            // Get role count from ROLES object
            let roleCount = Object.keys(ROLES).length;
            
            // Try individual parameters with safe fallbacks
            const quorum = await contracts.governance.quorum?.().catch(() => ethers.BigNumber.from(0));
            const proposalCreationThreshold = await contracts.governance.proposalCreationThreshold?.().catch(() => ethers.BigNumber.from(0));
            const proposalStake = await contracts.governance.proposalStake?.().catch(() => ethers.BigNumber.from(0));
            
            // Refund percentages with fallbacks
            const canceledRefundPercentage = (await contracts.governance.canceledRefundPercentage?.().catch(() => 75)) || 75;
            const defeatedRefundPercentage = (await contracts.governance.defeatedRefundPercentage?.().catch(() => 50)) || 50;
            const expiredRefundPercentage = (await contracts.governance.expiredRefundPercentage?.().catch(() => 25)) || 25;
            
            // Update state only if component is still mounted
            if (mountedRef.current) {
              // Safely format values to prevent errors
              const safeFormatEther = (value) => {
                if (!value) return '0';
                try {
                  // Check if value is a valid BigNumber
                  const bn = ethers.BigNumber.isBigNumber(value) ? value : ethers.BigNumber.from(value);
                  return ethers.utils.formatEther(bn);
                } catch (err) {
                  console.warn("Error formatting value with formatEther:", err);
                  return '0';
                }
              };
              
              // Format and set
              setGovernanceData({
                roleCount,
                proposalCreationThreshold: safeFormatEther(proposalCreationThreshold),
                proposalStake: safeFormatEther(proposalStake),
                quorum: safeFormatEther(quorum),
                canceledRefundPercentage: typeof canceledRefundPercentage === 'number' ? canceledRefundPercentage : 75,
                defeatedRefundPercentage: typeof defeatedRefundPercentage === 'number' ? defeatedRefundPercentage : 50,
                expiredRefundPercentage: typeof expiredRefundPercentage === 'number' ? expiredRefundPercentage : 25
              });
            }
          } catch (govErr) {
            console.warn("Error with individual governance parameter calls:", govErr);
            // Use defaults as fallback, but only if mounted
            if (mountedRef.current) {
              setGovernanceData({
                roleCount: Object.keys(ROLES).length,
                proposalCreationThreshold: '1.75',
                proposalStake: '.25',
                quorum: '2',
                canceledRefundPercentage: 75,
                defeatedRefundPercentage: 50,
                expiredRefundPercentage: 25
              });
            }
          }
        }
        
        // Set token data - simplified
        if (mountedRef.current) {
          try {
            // Get delegation depth
            let maxDepth = 8; // Default fallback
            
            try {
              if (contracts.justToken && contracts.justToken.MAX_DELEGATION_DEPTH) {
                const depth = await contracts.justToken.MAX_DELEGATION_DEPTH();
                if (depth) {
                  // Safely parse the delegation depth
                  try {
                    maxDepth = typeof depth.toNumber === 'function' ? depth.toNumber() : parseInt(depth.toString());
                  } catch (parseErr) {
                    console.log("Could not parse MAX_DELEGATION_DEPTH, using string value:", depth.toString());
                    maxDepth = parseInt(depth.toString()) || 8;
                  }
                }
              }
            } catch (e) {
              console.log("Could not get MAX_DELEGATION_DEPTH, using default:", e);
            }
            
            if (mountedRef.current) {
              setTokenData({
                maxDelegationDepth: maxDepth
              });
            }
          } catch (tokenErr) {
            console.warn("Error getting token data:", tokenErr);
            if (mountedRef.current) {
              setTokenData({
                maxDelegationDepth: 8 // Default fallback
              });
            }
          }
        }
        
        // Get pending transactions - simplified
        if (mountedRef.current) {
          try {
            // Try to get pending transactions from timelock
            let pendingTxs = [];
            
            // Check methods available on the contract
            if (contracts.timelock && typeof contracts.timelock.getPendingTransactions === 'function') {
              try {
                const txHashes = await contracts.timelock.getPendingTransactions();
                
                // Limit processing to avoid excess operations
                const hashesToProcess = txHashes.slice(0, 10); 
                
                for (const txHash of hashesToProcess) {
                  try {
                    const [target, value, data, eta, executed] = await contracts.timelock.getTransaction(txHash);
                    const currentTime = Math.floor(Date.now() / 1000);
                    const isReady = currentTime >= eta.toNumber();
                    
                    pendingTxs.push({
                      txHash,
                      target,
                      eta: new Date(eta.toNumber() * 1000).toLocaleString(),
                      ready: isReady && !executed
                    });
                  } catch (e) {
                    console.warn("Error getting transaction details:", e);
                  }
                }
                
                if (mountedRef.current) {
                  setPendingProposals(pendingTxs);
                }
              } catch (err) {
                console.warn("Error with getPendingTransactions:", err);
                if (mountedRef.current) {
                  setPendingProposals([]);
                }
              }
            } else {
              if (mountedRef.current) {
                setPendingProposals([]);
              }
            }
          } catch (pendingErr) {
            console.error("Error fetching pending proposals:", pendingErr);
            if (mountedRef.current) {
              setPendingProposals([]);
            }
          }
        }
        
        // Mark data as loaded to prevent repeated loading
        dataLoadedRef.current = true;
        
        // Clear the timeout since we're done
        clearTimeout(timeoutId);
        
        // Set loading to false
        if (mountedRef.current) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Make sure to set loading to false on error
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    // Only load data if contracts are ready and data hasn't been loaded yet
    if (contractsReady && !dataLoadedRef.current) {
      loadData();
    } else if (!contractsReady) {
      // If contracts aren't ready, ensure we're not in loading state
      setIsLoading(false);
    }
    
    return cleanup;
  }, [contractsReady, contracts]); // Simplified dependency array to prevent unnecessary re-renders

  // Add this function to force exit loading state after a delay
  useEffect(() => {
    let forceExitTimeout;
    
    if (isLoading) {
      forceExitTimeout = setTimeout(() => {
        setIsLoading(false);
        console.log("Forced loading state exit from safety timeout");
      }, 10000); // Force exit after 10 seconds
    }
    
    return () => {
      if (forceExitTimeout) {
        clearTimeout(forceExitTimeout);
      }
    };
  }, [isLoading]);

  // Format delay values for display
  const formatDelay = (days) => {
    if (!days && days !== 0) return "N/A";
    return `${days} day${days !== 1 ? 's' : ''}`;
  };
  
  // Get risk level color classes - more subtle and modern
  const getRiskLevelColorClass = (level) => {
    switch(level) {
      case 'LOW':
        return "bg-green-50/70 text-green-700 border-green-200/70 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/30";
      case 'MEDIUM':
        return "bg-yellow-50/70 text-yellow-700 border-yellow-200/70 dark:bg-yellow-900/10 dark:text-yellow-400 dark:border-yellow-800/30";
      case 'HIGH':
        return "bg-red-50/70 text-red-700 border-red-200/70 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/30";
      default:
        return "bg-blue-50/70 text-blue-700 border-blue-200/70 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/30";
    }
  };
  
  // Main component
  return (
    <div className="max-w-full w-full">
      {/* Show a loading indicator with subtle animation */}
      {isLoading && (
        <div className="flex justify-center items-center p-12 w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {/* Use a container with fixed dimensions to prevent layout shifts */}
      <div className={`w-full transition-opacity duration-500 ${isLoading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        {!isLoading && (
          <>
            {/* Header Overview - Reordered as requested */}
            <section className="rounded-xl bg-gradient-to-br from-indigo-50/90 via-indigo-100/80 to-purple-50/90 dark:from-indigo-900/30 dark:via-indigo-800/20 dark:to-purple-900/30 p-8 border border-indigo-200/50 dark:border-indigo-700/30 shadow-sm mb-12">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 flex items-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mr-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                Security Overview
              </h1>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="relative overflow-hidden rounded-xl bg-white/90 dark:bg-gray-800/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md group border-l-4 border-indigo-500 dark:border-indigo-400">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-300 mb-2 font-medium flex items-center relative">
                    <Users className="h-4 w-4 mr-2" />
                    Access Roles
                  </div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white relative">{governanceData.roleCount}</div>
                </div>
                
                <div className="relative overflow-hidden rounded-xl bg-white/90 dark:bg-gray-800/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md group border-l-4 border-purple-500 dark:border-purple-400">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 dark:from-purple-500/10 dark:to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-sm text-purple-600 dark:text-purple-300 mb-2 font-medium flex items-center relative">
                    <Diff className="h-4 w-4 mr-2" />
                    Delegation Depth
                  </div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white relative">{tokenData.maxDelegationDepth}</div>
                </div>
                
                <div className="relative overflow-hidden rounded-xl bg-white/90 dark:bg-gray-800/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md group border-l-4 border-blue-500 dark:border-blue-400">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-sm text-blue-600 dark:text-blue-300 mb-2 font-medium flex items-center relative">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Layers
                  </div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white relative">4</div>
                </div>
                
                <div className="relative overflow-hidden rounded-xl bg-white/90 dark:bg-gray-800/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md group border-l-4 border-amber-500 dark:border-amber-400">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-sm text-amber-600 dark:text-amber-300 mb-2 font-medium flex items-center relative">
                    <Clock className="h-4 w-4 mr-2" />
                    Timelock Pending 
                  </div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white relative">{pendingProposals.length}</div>
                </div>
              </div>
            </section>
            
            {/* Tiered Security Section - Static */}
            <SectionDivider title="Tiered Security Framework" icon={Clock} />
            
            <div className="mb-10">
              <p className="text-gray-600 dark:text-gray-400 max-w-3xl mb-8">
                The multi-tiered timelock system protects critical operations based on risk level. Each transaction is classified by its security impact and assigned an appropriate mandatory waiting period.
              </p>
              
              {/* Risk Levels with horizontal layout and gradient */}
              <div className="relative mb-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-yellow-500/5 to-red-500/5 dark:from-green-500/10 dark:via-yellow-500/10 dark:to-red-500/10 rounded-xl"></div>
                
                <div className="flex flex-col md:flex-row gap-1 relative">
                  {[
                    {
                      level: "LOW",
                      title: "Low Risk",
                      delay: timelockData.lowThreatDelay,
                      description: "Basic operations like community voting",
                      icon: Check,
                      color: "from-green-500 to-green-600",
                      textColor: "text-green-600 dark:text-green-400",
                      bgColor: "bg-green-50 dark:bg-green-900/20"
                    },
                    {
                      level: "MEDIUM",
                      title: "Medium Risk",
                      delay: timelockData.mediumThreatDelay,
                      description: "Parameter changes and settings",
                      icon: Clock,
                      color: "from-yellow-500 to-yellow-600",
                      textColor: "text-yellow-600 dark:text-yellow-400",
                      bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
                    },
                    {
                      level: "HIGH",
                      title: "High Risk",
                      delay: timelockData.highThreatDelay,
                      description: "Role management and core system changes",
                      icon: AlertTriangle,
                      color: "from-red-500 to-red-600",
                      textColor: "text-red-600 dark:text-red-400",
                      bgColor: "bg-red-50 dark:bg-red-900/20"
                    }
                  ].map((risk, index) => (
                    <div 
                      key={risk.level} 
                      className={`flex-1 p-4 rounded-xl ${risk.bgColor} transition-all duration-300 hover:shadow-md relative overflow-hidden ${index === 0 ? 'md:rounded-r-none' : index === 2 ? 'md:rounded-l-none' : 'md:rounded-none'}`}
                    >
                      <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${risk.color}`}></div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <risk.icon className={`h-4 w-4 mr-2 ${risk.textColor}`} />
                          <h3 className={`text-lg font-semibold ${risk.textColor}`}>{risk.title}</h3>
                        </div>
                        <div className="px-3 py-0.5 rounded-full bg-white/40 dark:bg-gray-800/40 text-sm font-medium text-gray-800 dark:text-gray-200">
                          {formatDelay(risk.delay)}
                        </div>
                      </div>
                      
                      <p className="mt-2 text-gray-600 dark:text-gray-400">{risk.description}</p>
                      
                      {/* Arrow connecting the boxes in desktop view */}
                      {index < 2 && (
                        <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 z-10">
                          <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Timelock Process - Improved visualization */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
                <div className="md:col-span-3 bg-white/95 dark:bg-gray-800/90 rounded-xl p-4 shadow-sm border-l-4 border-indigo-500 dark:border-indigo-400">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    How Timelock Protection Works
                  </h3>
                  
                  <div className="relative pl-8 space-y-4 before:absolute before:left-3 before:top-0 before:h-full before:w-px before:bg-gradient-to-b before:from-indigo-500 before:to-purple-500 before:dark:from-indigo-400 before:dark:to-purple-400">
                    {[
                      {
                        title: "Risk Analysis",
                        description: "System automatically detects threat level based on function signature, target contract, and transaction type."
                      },
                      {
                        title: "Queue Transaction",
                        description: "Transaction details are stored on-chain with a required delay period before execution is permitted."
                      },
                      {
                        title: "Security Waiting Period",
                        description: "Enforced delay gives community time to review, respond, or cancel potentially harmful transactions."
                      },
                      {
                        title: "Execution Window",
                        description: `After delay, transaction enters a ${timelockData.gracePeriod}-day execution window before expiring if not executed.`
                      }
                    ].map((step, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-8 top-0 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">{index + 1}</span>
                        </div>
                        <h4 className="font-medium text-gray-800 dark:text-white">{step.title}</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="md:col-span-2 bg-white/95 dark:bg-gray-800/90 rounded-xl p-4 shadow-sm border-l-4 border-amber-500 dark:border-amber-400">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                    Pending Transactions
                  </h3>
                  
                  {pendingProposals && pendingProposals.length > 0 ? (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {pendingProposals.map((tx, index) => (
                        <div 
                          key={index} 
                          className="py-2 px-3 rounded-lg bg-gray-50/80 dark:bg-gray-900/40 border-l-2 border-gray-200 dark:border-gray-700 transition-all duration-200 hover:border-amber-400 dark:hover:border-amber-500"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[180px]">
                              {tx.target ? `${tx.target.substring(0, 6)}...${tx.target.substring(tx.target.length - 4)}` : 'Unknown contract'}
                            </div>
                            <div className={`text-xs px-2 py-0.5 rounded-full ${tx.ready ? 'bg-green-100/80 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                              {tx.ready ? 'Ready' : 'Waiting'}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Execution time: {tx.eta}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50/80 dark:bg-gray-900/30 rounded-lg text-center text-gray-500 dark:text-gray-400">
                      No transactions currently in timelock
                    </div>
                  )}
                </div>
              </div>
              
              {/* Security Benefits as list instead of boxes */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Benefits of Tiered Transaction Security
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    {
                      title: "Attack Prevention",
                      description: "Guards against flash attacks, governance takeovers, and malicious contract interactions by providing time for detection."
                    },
                    {
                      title: "Community Oversight",
                      description: "Enables community review of pending transactions before execution, increasing transparency and trust."
                    },
                    {
                      title: "Risk-Appropriate Delays",
                      description: "Balances security with operational efficiency by applying delays proportional to transaction risk level."
                    }
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-2 mr-3"></div>
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">{benefit.title}</h4>
                        <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Role-Based Access Control Section - Static as requested */}
            <SectionDivider title="Role-Based Access Control" icon={Users} />
            
            <div className="mb-12">
              <p className="text-gray-600 dark:text-gray-400 max-w-3xl mb-8">
                Granular permission management ensures only authorized accounts can perform specific operations. JustDAO uses a structured role hierarchy with clear separation of responsibilities.
              </p>
              
              {/* Role Hierarchy - Made clearer as requested, with visual improvements */}
              <div className="mb-8">
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 dark:from-gray-900/80 dark:to-indigo-900/20 rounded-xl p-2 shadow-sm">
                  <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg p-4 border-b-2 border-indigo-500 dark:border-indigo-400">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Role Hierarchy</h3>
                    
                    <div className="relative pb-2">
                      {/* Vertical connecting line */}
                      <div className="absolute left-3 top-5 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-blue-500  via-red-500/80  to-green-500"></div>
                      
                      {/* Top level */}
                      <div className="mb-6 relative flex">
                        <div className="z-10 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 dark:bg-indigo-400 flex items-center justify-center shadow-sm">
                          <span className="text-white text-xs font-medium ">D</span>
                        </div>
                        <div className="ml-4 bg-indigo-50/70 dark:bg-indigo-900/10 py-2 px-4 rounded-lg flex-grow border-l-4 border-indigo-500 dark:border-indigo-400">
                          <h4 className="font-semibold text-gray-800 dark:text-white flex items-center">
                            Default Admin
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">Full Access</span>
                          </h4>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Full system control assigned to Timelock</p>
                        </div>
                      </div>
                      
                      {/* Second level - Admin */}
                      <div className="mb-6 relative flex pl-8">
                        <div className="absolute -left-0 top-3 w-8 h-0.5 bg-blue-500"></div>
                        <div className="z-10 flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-400 flex items-center justify-center shadow-sm">
                          <span className="text-white text-xs font-medium">A</span>
                        </div>
                        <div className="ml-4 bg-blue-50/70 dark:bg-blue-900/10 py-2 px-4 rounded-lg flex-grow border-l-4 border-blue-500 dark:border-blue-400">
                          <h4 className="font-semibold text-gray-800 dark:text-white flex items-center">
                            Admin
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">System Admin</span>
                          </h4>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Executive level administrative powers</p>
                        </div>
                      </div>
                      
                      {/* Second level - Guardian */}
                      <div className="mb-6 relative flex pl-8">
                        <div className="absolute -left-0 top-3 w-8 h-0.5 bg-red-500"></div>
                        <div className="z-10 flex-shrink-0 w-6 h-6 rounded-full bg-red-500 dark:bg-red-400 flex items-center justify-center shadow-sm">
                          <span className="text-white text-xs font-medium">G</span>
                        </div>
                        <div className="ml-4 bg-red-50/70 dark:bg-red-900/10 py-2 px-4 rounded-lg flex-grow border-l-4 border-red-500 dark:border-red-400">
                          <h4 className="font-semibold text-gray-800 dark:text-white flex items-center">
                            Guardian
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">Security Enforcer</span>
                          </h4>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Emergency intervention and security operations</p>
                        </div>
                      </div>
                      
                      {/* Third level - Contract Level Roles */}
                      <div className="relative flex pl-16">
                        <div className="absolute left-0 top-3 w-20 h-0.5 bg-green-500"></div>
                        <div className="z-10 flex-shrink-0 w-6 h-6 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center shadow-sm">
                          <span className="text-white text-xs font-medium">C</span>
                        </div>
                        <div className="ml-4 bg-green-50/70 dark:bg-green-900/10 py-2 px-4 rounded-lg flex-grow border-l-4 border-green-500 dark:border-green-400">
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Contract Level Roles</h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                            {[
                              { name: "Proposer", desc: "Create proposals" },
                              { name: "Executor", desc: "Execute passed proposals" },
                              { name: "Minter", desc: "Create new tokens" },
                              { name: "Canceller", desc: "Cancel pending transactions" },
                              { name: "Governance", desc: "Execute governance decisions" },
                              { name: "Analytics", desc: "Access analytics data" },
                              { name: "Timelock Admin", desc: "Manage timelock settings" }
                            ].map((role, idx) => (
                              <div key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400 mr-1.5"></div>
                                <span>{role.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Role Management Safeguards - Converted to cards with icons instead of bullet points */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 pl-4 border-l-4 border-purple-500 dark:border-purple-400">
                  Role Management Safeguards
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Last Admin Protection",
                      description: "Contracts prevent removing the last admin role holder, avoiding potential governance deadlocks.",
                      color: "amber"
                    },
                    {
                      title: "Timelocked Role Changes",
                      description: `Role assignments are subject to HIGH risk timelock delay (${timelockData.highThreatDelay} days), preventing sudden control changes.`,
                      color: "blue"
                    },
                    {
                      title: "Multisig Capability",
                      description: "Critical roles can be assigned to multi-signature wallets, requiring multiple approvers for sensitive operations.",
                      color: "green"
                    }
                  ].map((safeguard, idx) => (
                    <div key={idx} className={`relative overflow-hidden rounded-lg p-4 border border-${safeguard.color}-200 dark:border-${safeguard.color}-700 bg-gradient-to-br from-white to-${safeguard.color}-50/30 dark:from-gray-800 dark:to-${safeguard.color}-900/10`}>
                      <h4 className="text-base font-medium text-gray-800 dark:text-white mb-2">{safeguard.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{safeguard.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* All Roles as a list rather than a grid of cards */}
<CollapsibleSection
  title="All Available Access Roles"
  icon={Lock}
>
  <div className="mt-6 space-y-4">
    {Object.entries(ROLES).map(([role, hash], index) => {
      // Define role info
      const roleInfo = {
        'DEFAULT_ADMIN_ROLE': {
          description: 'Super admin with full system access',
          textColor: 'text-indigo-600 dark:text-indigo-400',
          iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
          iconText: 'D'
        },
        'ADMIN_ROLE': {
          description: 'Administrative powers for system management',
          textColor: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconText: 'A'
        },
        'GUARDIAN_ROLE': {
          description: 'Emergency intervention and security operations',
          textColor: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconText: 'G'
        },
        'ANALYTICS_ROLE': {
          description: 'Access to protected analytics functions',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
          iconText: 'AN'
        },
        'GOVERNANCE_ROLE': {
          description: 'Execute governance approved decisions',
          textColor: 'text-purple-600 dark:text-purple-400',
          iconBg: 'bg-purple-100 dark:bg-purple-900/30',
          iconText: 'GO'
        },
        'PROPOSER_ROLE': {
          description: 'Submit new governance proposals',
          textColor: 'text-green-600 dark:text-green-400',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          iconText: 'P'
        },
        'EXECUTOR_ROLE': {
          description: 'Execute timelock transactions after delay',
          textColor: 'text-amber-600 dark:text-amber-400',
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          iconText: 'E'
        },
        'MINTER_ROLE': {
          description: 'Create new tokens within allocation limits',
          textColor: 'text-cyan-600 dark:text-cyan-400',
          iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
          iconText: 'M'
        },
        'CANCELLER_ROLE': {
          description: 'Cancel suspicious pending transactions',
          textColor: 'text-orange-600 dark:text-orange-400',
          iconBg: 'bg-orange-100 dark:bg-orange-900/30',
          iconText: 'C'
        },
        'TIMELOCK_ADMIN_ROLE': {
          description: 'Administer timelock contract settings',
          textColor: 'text-pink-600 dark:text-pink-400',
          iconBg: 'bg-pink-100 dark:bg-pink-900/30',
          iconText: 'TA'
        }
      };
      
      // Get info for this role with fallback
      const info = roleInfo[role] || {
        description: 'Role with specific permissions',
        textColor: 'text-gray-600 dark:text-gray-400',
        iconBg: 'bg-gray-100 dark:bg-gray-800/50',
        iconText: 'R'
      };
      
      // Format hash to show only first 6 and last 4 characters
      const truncatedHash = `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
      
      const displayName = role.replace(/_ROLE$/, '');
      
      return (
        <div key={index} 
          className="flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${info.iconBg} flex items-center justify-center mr-4`}>
            <span className={`${info.textColor} text-xs font-semibold`}>{info.iconText}</span>
          </div>
          
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-medium text-gray-800 dark:text-white flex items-center">
                {displayName}
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  ROLE
                </span>
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1.5">
              {info.description}
            </p>
            <div className={`text-xs font-mono ${info.textColor} opacity-80`}>
              {truncatedHash}
            </div>
          </div>
        </div>
      );
    })}
  </div>
</CollapsibleSection>
            </div>
            
            {/* Token Security Section - Collapsible */}
            <CollapsibleSection
              title="Token Delegation Security"
              icon={Lock}
            >
              <div className="mb-8">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Advanced token delegation system with safeguards against manipulation.
                </p>
                
                {/* Infographic style token security */}
                <div className="bg-gradient-to-br from-purple-50/70 via-indigo-50/50 to-blue-50/70 dark:from-purple-900/20 dark:via-indigo-900/10 dark:to-blue-900/20 rounded-xl p-6 mb-10">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left panel - Token Locking */}
                    <div className="flex-1">
                      <div className="mb-4 inline-flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white ml-3">
                          Token Locking Mechanism
                        </h3>
                      </div>
                      
                      <ul className="space-y-6 relative before:absolute before:content-[''] before:left-[15px] before:top-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:to-purple-500 before:dark:from-indigo-400 before:dark:to-purple-400">
                        {[
                          {
                            title: "Ownership with Transfer Restriction",
                            description: "When delegated, tokens remain in your wallet but are locked against transfers until delegation is reset."
                          },
                          {
                            title: "On-Chain Explicit Confirmation",
                            description: "Delegation requires explicit transaction confirmation, preventing accidental voting power transfers."
                          },
                          {
                            title: "Self-Delegation Reset",
                            description: "Users can immediately reset to self-delegation at any time, unlocking tokens and reclaiming voting power."
                          }
                        ].map((item, index) => (
                          <li key={index} className="pl-10 relative">
                            <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-indigo-500 dark:border-indigo-400 z-10">
                              <span className="text-indigo-600 dark:text-indigo-400 font-medium">{index + 1}</span>
                            </div>
                            <h4 className="font-medium text-gray-800 dark:text-white">{item.title}</h4>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">{item.description}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Right panel - Delegation Safeguards */}
                    <div className="flex-1">
                      <div className="mb-4 inline-flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white ml-3">
                          Delegation Chain Safeguards
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-5 shadow-sm border-l-4 border-purple-500 dark:border-purple-400">
                          <div className="flex items-center mb-2">
                           
                            <h4 className="font-medium text-gray-800 dark:text-white ml-3">Maximum Delegation Depth</h4>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Enforces <span className="font-semibold text-purple-600 dark:text-purple-400">{tokenData.maxDelegationDepth}-level</span> maximum depth for delegation chains, preventing excessive complexity.
                          </p>
                        </div>
                        
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-5 shadow-sm border-l-4 border-blue-500 dark:border-blue-400">
                          <div className="flex items-center mb-2">
                            
                            <h4 className="font-medium text-gray-800 dark:text-white ml-3">Cycle Detection</h4>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Advanced algorithms detect and prevent delegation cycles that could create infinite loops or manipulate voting power.
                          </p>
                        </div>
                        
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-5 shadow-sm border-l-4 border-indigo-500 dark:border-indigo-400">
                          <div className="flex items-center mb-2">
                            
                            <h4 className="font-medium text-gray-800 dark:text-white ml-3">Diamond Pattern Prevention</h4>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Sophisticated checks block complex delegation structures that could artificially amplify voting power.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Snapshot Voting Security */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 w-40 h-40 bg-blue-200/30 dark:bg-blue-700/10 rounded-full transform translate-x-1/4 translate-y-1/4 blur-xl"></div>
                  
                  <div className="flex flex-col md:flex-row items-start gap-6 relative">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 flex items-center justify-center shadow-sm">
                      <Check className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Snapshot Voting Security</h3>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        When a proposal is created, the system takes a snapshot of all token balances and delegations. This freezes voting power distributions at that moment, preventing last-minute delegation changes or token transfers from manipulating votes after a proposal is submitted.
                      </p>
                      
                      <div className="rounded-lg bg-white/90 dark:bg-gray-800/90 p-4 border-l-4 border-blue-500 dark:border-blue-400 shadow-sm">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 p-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                            This time-bound mechanism ensures fair representation and prevents flash loan or market manipulation attacks by making voting power immutable for each proposal.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
            
            {/* Proposal & Voting Security Section */}
            <CollapsibleSection
              title="Proposal & Voting Security"
              icon={FileLock}
            >
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comprehensive safeguards throughout the proposal lifecycle.
              </p>
              
              {/* Proposal Lifecycle Security */}
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-5 border border-gray-200/70 dark:border-gray-700/50 shadow-sm mb-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Proposal Lifecycle Security</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg p-4 border border-indigo-100/70 dark:border-indigo-800/50 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                    <div className="flex items-center mb-3">
                      <FileLock className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                      <h4 className="font-medium text-indigo-700 dark:text-indigo-300">Creation Security</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Proposers must hold a minimum JST balance and stake a small amount of tokens when submitting. Stakes are refunded based on the proposal outcome. 
                    </p>
                  </div>
                  
                  <div className="bg-purple-50/70 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-100/70 dark:border-purple-800/50 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                    <div className="flex items-center mb-3">
                      <Vote className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                      <h4 className="font-medium text-purple-700 dark:text-purple-300">Voting Security</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Voting uses the snapshot mechanism to freeze token balances at proposal creation. 
                    </p>
                  </div>
                  
                  <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-100/70 dark:border-blue-800/50 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                    <div className="flex items-center mb-3">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <h4 className="font-medium text-blue-700 dark:text-blue-300">Queuing Security</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Successful proposals enter the timelock queue with risk-appropriate delays. Only pre-approved function selectors and target contracts can be called.
                    </p>
                  </div>
                  
                  <div className="bg-green-50/70 dark:bg-green-950/30 rounded-lg p-4 border border-green-100/70 dark:border-green-800/50 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                    <div className="flex items-center mb-3">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                      <h4 className="font-medium text-green-700 dark:text-green-300">Execution Security</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Proposals can only be executed after the timelock delay, and executors must hold a minimum token threshold or have a specific role assignment.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Proposal Constraints */}
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-5 border border-gray-200/70 dark:border-gray-700/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  Proposal Constraints
                </h3>
                
                <div className="space-y-4">
                  <div className="flex">
                    <div className="rounded-md bg-blue-100/80 dark:bg-blue-900/20 p-2 mr-3 h-min">
                      <Code className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">Whitelisted Functions</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Proposals can only call pre-approved function selectors, preventing arbitrary or dangerous calls.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="rounded-md bg-indigo-100/80 dark:bg-indigo-900/20 p-2 mr-3 h-min">
                      <Settings className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">Approved Targets</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Transactions can only target pre-approved contract addresses, preventing interactions with untrusted contracts.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="rounded-md bg-purple-100/80 dark:bg-purple-900/20 p-2 mr-3 h-min">
                      <Shield className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">Guardian Cancellation</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Guardians can cancel suspicious proposals even after they've passed voting, providing an emergency backstop.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
            
            {/* Smart Contract Security Section */}
            <CollapsibleSection
              title="Smart Contract Security"
              icon={Code}
            >
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Advanced on-chain safeguards protect against vulnerabilities and attacks.
              </p>
              
              {/* Contract Security Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {[
                  {
                    title: "Upgradeable Architecture",
                    description: "All contracts use UUPS pattern, allowing future security improvements while preserving state.",
                    icon: Settings,
                    color: "bg-indigo-50/70 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200/70 dark:border-indigo-800/50"
                  },
                  {
                    title: "Reentrancy Protection",
                    description: "Guards against malicious contract callbacks with reentrancy locks on all fund-handling functions.",
                    icon: Shield,
                    color: "bg-red-50/70 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200/70 dark:border-red-800/50"
                  },
                  {
                    title: "Emergency Pause",
                    description: "Critical functions can be paused by guardians in case of detected vulnerabilities.",
                    icon: Clock,
                    color: "bg-amber-50/70 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50"
                  },
                  {
                    title: "Access Control",
                    description: "Granular permission management using OpenZeppelin's AccessControl pattern.",
                    icon: Lock,
                    color: "bg-blue-50/70 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/50"
                  },
                  {
                    title: "ERC20 Safety",
                    description: "SafeERC20 library used for all token interactions, preventing failed transfers.",
                    icon: FileDigit,
                    color: "bg-green-50/70 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200/70 dark:border-green-800/50"
                  },
                  {
                    title: "Integer Safeguards",
                    description: "Solidity 0.8+ compiler automatically checks for arithmetic overflows and underflows.",
                    icon: Diff,
                    color: "bg-purple-50/70 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200/70 dark:border-purple-800/50"
                  }
                ].map((feature, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg p-4 border shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] ${feature.color}`}
                  >
                    <feature.icon className="h-6 w-6 mb-3" />
                    <h4 className="font-medium mb-2">{feature.title}</h4>
                    <p className="text-sm opacity-90">{feature.description}</p>
                  </div>
                ))}
              </div>
              
              {/* Contract Development Standards */}
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-5 border border-gray-200/70 dark:border-gray-700/50 shadow-sm mb-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <BadgeCheck className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  Contract Development Standards
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg p-4 border border-indigo-100/70 dark:border-indigo-800/50 transition-all duration-300 hover:shadow-sm">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2">Storage Gaps</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Reserved storage slots in all upgradeable contracts to prevent layout conflicts in future updates.
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg p-4 border border-indigo-100/70 dark:border-indigo-800/50 transition-all duration-300 hover:shadow-sm">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2">Initialization Protection</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All contracts use initializer pattern with one-time setup to prevent reinitialization attacks.
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg p-4 border border-indigo-100/70 dark:border-indigo-800/50 transition-all duration-300 hover:shadow-sm">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2">Gas Optimization</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Custom errors and optimized storage patterns to reduce gas costs and prevent out-of-gas transaction failures.
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg p-4 border border-indigo-100/70 dark:border-indigo-800/50 transition-all duration-300 hover:shadow-sm">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2">Function Visibility</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Strict access modifiers on all functions to prevent unauthorized calls to internal implementation details.
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg p-4 border border-indigo-100/70 dark:border-indigo-800/50 transition-all duration-300 hover:shadow-sm">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2">Safe External Calls</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      External call safety patterns to ensure tokens can be rescued if accidentally sent to contracts.
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg p-4 border border-indigo-100/70 dark:border-indigo-800/50 transition-all duration-300 hover:shadow-sm">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2">State Changes Before Calls</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      State variables are updated before external calls to prevent potential reentrancy vulnerabilities.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Defense in Depth Philosophy */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg p-5 border border-indigo-100/70 dark:border-indigo-800/50 transition-all duration-300 hover:shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  Defense-in-Depth Philosophy
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-5">
                  JustDAO employs a holistic security approach that combines technical safeguards, governance checks, and human oversight to protect community funds and maintain protocol integrity.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 shadow-sm border border-gray-200/70 dark:border-gray-700/50 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2 flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                      Technical Barriers
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Smart contract safeguards, access controls, and secure coding practices create a strong technical foundation.
                    </p>
                  </div>
                  
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 shadow-sm border border-gray-200/70 dark:border-gray-700/50 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2 flex items-center">
                      <Landmark className="h-4 w-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                      Governance Safeguards
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Voting requirements, proposal thresholds, and time delays prevent governance capture or rushed decision-making.
                    </p>
                  </div>
                  
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 shadow-sm border border-gray-200/70 dark:border-gray-700/50 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                      Human Oversight
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Community review, guardian roles, and off-chain fiduciaries provide crucial human judgment when automated systems alone are insufficient.
                    </p>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
            
            {/* Footer CTA */}
            <section className="mt-10 bg-gradient-to-r from-indigo-50/80 to-indigo-100/80 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-6 border border-indigo-200/70 dark:border-indigo-700/50 text-center transition-all duration-300 hover:shadow-md">
              <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-3">
                Protecting Access to Justice
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-5 max-w-3xl mx-auto">
                JustDAO's security-first approach ensures that community funds for legal aid are protected, governance remains transparent, and the ecosystem continues to serve those in need for the long term.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityTabContent;