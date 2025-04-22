// AnalyticsTab.jsx (Main Component with Original Blockchain Calls)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Check, Coins, Link, Clock, Database, 
  AlertTriangle } from 'lucide-react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import useGovernanceParams from '../hooks/useGovernanceParams';

// Import separated pages
import ProposalAnalyticsPage from './ProposalAnalyticsPage';
import TokenAnalyticsPage from './TokenAnalyticsPage';
import TimelockAnalyticsPage from './TimelockAnalyticsPage';
import CurrentStatsPage from './CurrentStatsPage';
import ConsistentDelegationTab from './ConsistentDelegationTab';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

const AnalyticsTab = () => {
  const { contracts, contractsReady, account, provider } = useWeb3();
  const [selectedMetric, setSelectedMetric] = useState('proposal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionDetails, setConnectionDetails] = useState(null);
  
  // Get governance parameters using the same hook as VoteTab
  const govParams = useGovernanceParams();
  
  // Analytics state
  const [proposalAnalytics, setProposalAnalytics] = useState(null);
  const [tokenAnalytics, setTokenAnalytics] = useState(null);
  const [timelockAnalytics, setTimelockAnalytics] = useState(null);
  const [delegationAnalytics, setDelegationAnalytics] = useState(null);
  const [currentStatsData, setCurrentStatsData] = useState(null);
  const [currentStatsLastUpdated, setCurrentStatsLastUpdated] = useState(null);
  const [loadingCurrentStats, setLoadingCurrentStats] = useState(false);

  // Threat level states to match VoteTab - REMOVED CRITICAL
  const THREAT_LEVELS = useMemo(() => ({
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2
  }), []);
  const [threatLevelDelays, setThreatLevelDelays] = useState({});

  // Cache references
  const cacheRef = useRef({
    proposal: { data: null, timestamp: 0 },
    token: { data: null, timestamp: 0 },
    timelock: { data: null, timestamp: 0 },
    delegation: { data: null, timestamp: 0 },
    currentStats: { data: null, timestamp: 0 }
  });
  
  // Track component mount state
  const isMountedRef = useRef(true);

  // Improved BigNumber to Number conversion
  const formatBigNumberToNumber = useCallback((bn) => {
    if (!bn) return 0;
    if (typeof bn === 'number') return bn;
    
    // Try using ethers BigNumber methods first
    if (ethers.BigNumber.isBigNumber(bn)) {
      try {
        return bn.toNumber();
      } catch (e) {
        return parseFloat(bn.toString());
      }
    }
    
    // Handle regular objects with toString method
    try {
      if (bn.toString && typeof bn.toString === 'function') {
        const str = bn.toString();
        if (str.includes('e+')) {
          return parseFloat(str);
        }
        return parseFloat(str);
      }
    } catch (err) {
      console.error("Error parsing value:", err, bn);
    }
    
    // Last resort - try to use formatUnits
    try {
      return parseFloat(ethers.utils.formatUnits(bn, 0));
    } catch (e) {
      console.error("All conversion methods failed for:", bn);
    }
    
    return 0;
  }, []);

  // Helper function to check if an address is self-delegated
  const isSelfDelegated = useCallback((delegator, delegate) => {
    if (!delegator || !delegate) return true;
    const normalizedDelegator = delegator.toLowerCase();
    const normalizedDelegate = delegate.toLowerCase();
    return normalizedDelegator === normalizedDelegate || 
           delegate === ethers.constants.AddressZero;
  }, []);

  // Helper function to check cache validity
  const isCacheValid = useCallback((type) => {
    const cache = cacheRef.current[type];
    return cache && 
           cache.data && 
           cache.timestamp > 0 && 
           (Date.now() - cache.timestamp) < CACHE_DURATION;
  }, []);
  
  // Helper function to update cache
  const updateCache = useCallback((type, data) => {
    cacheRef.current[type] = {
      data,
      timestamp: Date.now()
    };
  }, []);

  // Debug function to check contract connectivity
  const checkContractConnectivity = useCallback(async () => {
    if (!contractsReady) {
      return {
        connected: false,
        message: "Contracts not ready. Connect your wallet to continue."
      };
    }

    const details = {
      connected: true,
      contracts: {},
      account: account || "Not connected",
      networkId: null
    };

    try {
      if (provider) {
        const network = await provider.getNetwork();
        details.networkId = network.chainId;
      }

      // Check each contract
      if (contracts.justToken) {
        try {
          const symbol = await contracts.justToken.symbol();
          const totalSupply = await contracts.justToken.totalSupply();
          details.contracts.justToken = {
            address: contracts.justToken.address,
            symbol,
            totalSupply: ethers.utils.formatEther(totalSupply)
          };
        } catch (err) {
          details.contracts.justToken = {
            address: contracts.justToken.address,
            error: err.message
          };
        }
      } else {
        details.contracts.justToken = "Not initialized";
      }

      if (contracts.governance) {
        try {
          const state = await contracts.governance.getProposalState(0).catch(() => "No proposals");
          details.contracts.governance = {
            address: contracts.governance.address,
            status: "Connected"
          };
        } catch (err) {
          details.contracts.governance = {
            address: contracts.governance?.address,
            error: err.message
          };
        }
      } else {
        details.contracts.governance = "Not initialized";
      }

      if (contracts.timelock) {
        try {
          const minDelay = await contracts.timelock.minDelay();
          details.contracts.timelock = {
            address: contracts.timelock.address,
            minDelay: minDelay.toString()
          };
        } catch (err) {
          details.contracts.timelock = {
            address: contracts.timelock?.address,
            error: err.message
          };
        }
      } else {
        details.contracts.timelock = "Not initialized";
      }

      return details;
    } catch (err) {
      return {
        connected: false,
        message: `Error checking contracts: ${err.message}`
      };
    }
  }, [contractsReady, contracts, account, provider]);

  // Load Current Stats data from JSON file
 const loadCurrentStatsData = useCallback(async () => {
  if (isCacheValid('currentStats')) {
    if (isMountedRef.current) {
      setCurrentStatsData(cacheRef.current.currentStats.data);
      setCurrentStatsLastUpdated(new Date(cacheRef.current.currentStats.timestamp));
      return;
    }
  }
  
  setLoadingCurrentStats(true);
  setError(null);
  
  // Define multiple possible paths to try
  const possiblePaths = [
    '/my-react-app/data/current-stats.json',
    './data/current-stats.json',
    '../data/current-stats.json',
    'data/current-stats.json',
    `${window.location.origin}/data/current-stats.json`,
    `${window.location.origin}/my-react-app/data/current-stats.json`
  ];
  
  let lastError = null;
  
  // Try each path until we get a valid response
  for (const path of possiblePaths) {
    try {
      console.log(`Attempting to fetch stats from: ${path}`);
      
      const response = await fetch(path, {
        headers: {
          'Accept': 'application/json',
        },
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        console.log(`Failed fetch from ${path}: ${response.status} ${response.statusText}`);
        continue; // Try next path
      }
      
      // Read the response as text first to check for HTML content
      const text = await response.text();
      
      // Check if we got HTML instead of JSON
      if (text.trim().startsWith('<')) {
        console.log(`Received HTML instead of JSON from ${path}`, text.substring(0, 100));
        continue; // Try next path
      }
      
      // Parse the JSON manually since we already consumed the response as text
      const data = JSON.parse(text);
      console.log(`Successfully loaded stats from: ${path}`);
      
      // Update last modified date if available from headers
      let lastModified;
      const lastModifiedHeader = response.headers.get('last-modified');
      if (lastModifiedHeader) {
        lastModified = new Date(lastModifiedHeader);
      } else {
        lastModified = new Date();
      }
      
      updateCache('currentStats', data);
      
      if (isMountedRef.current) {
        setCurrentStatsData(data);
        setCurrentStatsLastUpdated(lastModified);
        setLoadingCurrentStats(false);
      }
      
      // We succeeded, so return early
      return;
    } catch (err) {
      console.error(`Error fetching from ${path}:`, err);
      lastError = err;
      // Continue to try next path
    }
  }
  
  // If we get here, all paths failed
  console.error("All fetch attempts failed. Check that your JSON file exists and is accessible.");
  if (isMountedRef.current) {
    setError(`Failed to load current stats: ${lastError?.message || 'Could not access file'}`);
    setLoadingCurrentStats(false);
  }
}, [isCacheValid, updateCache]);

  const loadDelegationAnalytics = useCallback(async () => {
    if (!contractsReady || !contracts.justToken) {
      if (isMountedRef.current) setError("Token contract not available");
      return;
    }
    
    if (isCacheValid('delegation')) {
      const cachedData = cacheRef.current.delegation.data;
      if (cachedData && cachedData.delegations && cachedData.delegations.length > 0) {
        if (isMountedRef.current) {
          setDelegationAnalytics(cachedData);
          return;
        }
      }
    }
    
    try {
      if (isMountedRef.current) setLoading(true);
      
      const totalSupply = await contracts.justToken.totalSupply();
      const totalSupplyEther = ethers.utils.formatEther(totalSupply);
      
      const processedDelegators = new Set();
      const directDelegations = [];
      const delegateVotingPowers = new Map();
      
      const processDelegation = async (delegator) => {
        if (processedDelegators.has(delegator.toLowerCase())) return;
        processedDelegators.add(delegator.toLowerCase());
        
        try {
          const [delegate, balance] = await Promise.all([
            contracts.justToken.getDelegate(delegator),
            contracts.justToken.balanceOf(delegator)
          ]);
          
          if (delegate && !balance.isZero()) {
            const votingPower = ethers.utils.formatEther(balance);
            
            let depth = 1;
            if (contracts.daoHelper) {
              try {
                const delegationPath = await contracts.daoHelper.getDelegationPath(delegator);
                depth = delegationPath.depth || 1;
              } catch (err) {
                console.warn(`Could not get delegation depth for ${delegator}:`, err.message);
              }
            }
            
            const isSelfDelegated = 
              delegate.toLowerCase() === delegator.toLowerCase() || 
              delegate === ethers.constants.AddressZero;
              
            if (!isSelfDelegated) {
              directDelegations.push({
                address: delegator,
                delegate: delegate,
                votingPower: votingPower,
                depth: depth
              });
              
              const currentPower = delegateVotingPowers.get(delegate) || "0";
              const newPower = ethers.utils.formatEther(
                ethers.utils.parseEther(currentPower).add(balance)
              );
              delegateVotingPowers.set(delegate, newPower);
            }
          }
        } catch (err) {
          console.warn(`Error processing delegation for ${delegator}:`, err.message);
        }
      };
      
      const importantAccounts = [
        account,
        contracts.governance?.address,
        contracts.timelock?.address
      ].filter(Boolean);
      
      for (const addr of importantAccounts) {
        await processDelegation(addr);
        
        try {
          const delegators = await contracts.justToken.getDelegatorsOf(addr);
          const delegatorsToProcess = delegators.slice(0, 50);
          for (const delegator of delegatorsToProcess) {
            await processDelegation(delegator);
          }
        } catch (err) {
          console.warn(`Error getting delegators for ${addr}:`, err.message);
        }
      }
      
      if (directDelegations.length < 5 && contracts.justToken) {
        try {
          const filter = contracts.justToken.filters.Transfer();
          const events = await contracts.justToken.queryFilter(filter, -10000);
          
          const uniqueAccounts = new Set();
          for (const event of events) {
            if (event.args && event.args.to) {
              uniqueAccounts.add(event.args.to.toLowerCase());
            }
          }
          
          const accountsToProcess = Array.from(uniqueAccounts).slice(0, 50);
          for (const acct of accountsToProcess) {
            await processDelegation(acct);
          }
        } catch (err) {
          console.warn("Error scanning for additional accounts:", err.message);
        }
      }
      
      if (contracts.daoHelper) {
        try {
          const delegateAccounts = [];
          
          try {
            const topDelegatesData = await contracts.daoHelper.getTopDelegateConcentration(20);
            if (topDelegatesData && Array.isArray(topDelegatesData.topDelegates)) {
              for (let i = 0; i < topDelegatesData.topDelegates.length; i++) {
                delegateAccounts.push(topDelegatesData.topDelegates[i]);
              }
            }
          } catch (err) {
            console.warn("Could not get top delegates from helper:", err.message);
          }
          
          for (const delegate of delegateAccounts) {
            await processDelegation(delegate);
            
            try {
              const delegators = await contracts.justToken.getDelegatorsOf(delegate);
              const delegatorsToProcess = delegators.slice(0, 20);
              
              for (const delegator of delegatorsToProcess) {
                await processDelegation(delegator);
              }
            } catch (err) {
              console.warn(`Error getting delegators for top delegate ${delegate}:`, err.message);
            }
          }
        } catch (err) {
          console.warn("Error processing top delegates:", err.message);
        }
      }
      
      if (directDelegations.length === 0 && contracts.justToken) {
        try {
          const filter = contracts.justToken.filters.DelegateChanged();
          const events = await contracts.justToken.queryFilter(filter, -20000);
          
          for (const event of events) {
            if (event.args) {
              const delegator = event.args.delegator;
              const delegate = event.args.toDelegate;
              
              if (delegator && delegate) {
                if (processedDelegators.has(delegator.toLowerCase())) continue;
                await processDelegation(delegator);
              }
            }
          }
        } catch (err) {
          console.warn("Error looking for delegation events:", err.message);
        }
      }
      
      const topDelegates = Array.from(delegateVotingPowers.entries())
        .map(([address, power]) => {
          const percentage = totalSupply.gt(0) 
            ? parseFloat(ethers.utils.parseEther(power).mul(100).div(totalSupply).toString())
            : 0;
            
          return {
            address,
            delegatedPower: power,
            percentage
          };
        })
        .sort((a, b) => parseFloat(b.delegatedPower) - parseFloat(a.delegatedPower));
      
      const analyticsData = {
        delegations: directDelegations,
        topDelegates: topDelegates,
        totalSupply: totalSupplyEther
      };
      
      updateCache('delegation', analyticsData);
      
      if (isMountedRef.current) {
        setDelegationAnalytics(analyticsData);
      }
      
    } catch (error) {
      console.error("Error loading delegation analytics:", error);
      if (isMountedRef.current) {
        setError(`Failed to load delegation analytics: ${error.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [contracts, contractsReady, account, updateCache, isCacheValid]);

  const formatTimeDuration = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return "0 minutes";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }, []);

  const countProposalsDirectly = useCallback(async () => {
    if (!contracts.governance) {
      console.warn("Governance contract not available for direct proposal counting");
      return {
        totalProposals: 0,
        activeProposals: 0,
        succeededProposals: 0,
        executedProposals: 0,
        defeatedProposals: 0,
        canceledProposals: 0,
        expiredProposals: 0,
        successRate: 0,
        avgVotingTurnout: 0
      };
    }

    try {
      const stateNames = [
        'active',     // 0
        'canceled',   // 1
        'defeated',   // 2
        'succeeded',  // 3
        'queued',     // 4
        'executed',   // 5
        'expired'     // 6
      ];
      
      const stateCounts = {
        active: 0,
        canceled: 0,
        defeated: 0,
        succeeded: 0,
        queued: 0,
        executed: 0,
        expired: 0
      };
      
      const MAX_PROPOSAL_ID = 30;
      
      let foundProposals = 0;
      let consecutiveFailures = 0;
      let lastValidProposal = -1;
      
      const proposalVotesMap = new Map();
      
      for (let id = 0; id < MAX_PROPOSAL_ID; id++) {
        if (consecutiveFailures >= 3) break;
        
        try {
          const state = await contracts.governance.getProposalState(id);
          
          consecutiveFailures = 0;
          lastValidProposal = id;
          foundProposals++;
          
          const stateNum = typeof state === 'object' && state.toNumber 
            ? state.toNumber() 
            : Number(state);
          
          const stateName = stateNames[stateNum];
          if (stateName && stateCounts.hasOwnProperty(stateName)) {
            stateCounts[stateName]++;
          }
          
          if (id >= Math.max(0, lastValidProposal - 5)) {
            try {
              const votes = await contracts.governance.getProposalVoteTotals(id);
              proposalVotesMap.set(id, votes);
            } catch (votesErr) {
              console.warn(`Could not get votes for proposal ${id}:`, votesErr.message);
            }
          }
        } catch (error) {
          consecutiveFailures++;
        }
      }
      
      const successfulProposals = stateCounts.succeeded + stateCounts.queued + stateCounts.executed;
      const nonCanceledCount = foundProposals - stateCounts.canceled;
      const successRate = nonCanceledCount > 0 ? 
        (successfulProposals / nonCanceledCount) * 100 : 0;
      
      let avgVotingTurnout = 0;
      
      if (proposalVotesMap.size > 0 && contracts.justToken) {
        try {
          const totalSupply = await contracts.justToken.totalSupply();
          
          let totalTurnout = 0;
          let sampleCount = 0;
          
          for (const [_, votes] of proposalVotesMap) {
            if (!votes) continue;
            
            let yesVotes, noVotes, abstainVotes;
            
            if (Array.isArray(votes)) {
              yesVotes = ethers.BigNumber.from(votes[0] || 0);
              noVotes = ethers.BigNumber.from(votes[1] || 0);
              abstainVotes = ethers.BigNumber.from(votes[2] || 0);
            } else if (votes && typeof votes === 'object') {
              yesVotes = ethers.BigNumber.from(votes.yesVotes || votes.forVotes || 0);
              noVotes = ethers.BigNumber.from(votes.noVotes || votes.againstVotes || 0);
              abstainVotes = ethers.BigNumber.from(votes.abstainVotes || 0);
            } else {
              continue;
            }
            
            const totalVotes = yesVotes.add(noVotes).add(abstainVotes);
            
            if (!totalSupply.isZero()) {
              const turnoutPercentage = parseFloat(
                totalVotes.mul(10000).div(totalSupply).toString()
              ) / 100;
              
              totalTurnout += turnoutPercentage;
              sampleCount++;
            }
          }
          
          if (sampleCount > 0) {
            avgVotingTurnout = totalTurnout / sampleCount;
          }
        } catch (err) {
          console.warn("Error calculating voting turnout:", err);
        }
      }
      
      return {
        totalProposals: foundProposals,
        activeProposals: stateCounts.active,
        succeededProposals: stateCounts.succeeded,
        executedProposals: stateCounts.executed,
        defeatedProposals: stateCounts.defeated,
        canceledProposals: stateCounts.canceled,
        expiredProposals: stateCounts.expired,
        successRate,
        avgVotingTurnout,
        queuedProposals: stateCounts.queued
      };
    } catch (error) {
      console.error("Error in direct proposal counting:", error);
      return {
        totalProposals: 0,
        activeProposals: 0,
        succeededProposals: 0,
        executedProposals: 0,
        defeatedProposals: 0,
        canceledProposals: 0,
        expiredProposals: 0,
        successRate: 0,
        avgVotingTurnout: 0
      };
    }
  }, [contracts]);

  const loadProposalAnalytics = useCallback(async () => {
    if (!contractsReady || !contracts.governance) {
      if (isMountedRef.current) setError("Governance contract not available");
      return;
    }
    
    if (isCacheValid('proposal')) {
      if (isMountedRef.current) {
        setProposalAnalytics(cacheRef.current.proposal.data);
        return;
      }
    }
    
    try {
      if (isMountedRef.current) setLoading(true);
      
      const directAnalytics = await countProposalsDirectly();
      
      updateCache('proposal', directAnalytics);
      
      if (isMountedRef.current) {
        setProposalAnalytics(directAnalytics);
      }
      
    } catch (error) {
      console.error("Error loading proposal analytics:", error);
      if (isMountedRef.current) {
        setError(`Failed to load proposal analytics: ${error.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [contracts, contractsReady, countProposalsDirectly, isCacheValid, updateCache]);

  const loadTokenAnalytics = useCallback(async () => {
    if (!contractsReady || !contracts.justToken) {
      if (isMountedRef.current) setError("Token contract not available");
      return;
    }
    
    if (isCacheValid('token')) {
      if (isMountedRef.current) {
        setTokenAnalytics(cacheRef.current.token.data);
        return;
      }
    }
    
    try {
      if (isMountedRef.current) setLoading(true);
      const totalSupply = await contracts.justToken.totalSupply();
      
      let snapshotId;
      try {
        snapshotId = await contracts.justToken.getCurrentSnapshotId();
      } catch (err) {
        console.warn("Failed to get snapshot ID:", err.message);
        snapshotId = ethers.BigNumber.from(0);
      }
      
      let activeHolders = 0;
      let activeDelegates = 0;
      let totalDelegated = ethers.BigNumber.from(0);
      
      try {
        const metrics = await contracts.justToken.getSnapshotMetrics(snapshotId);
        
        if (Array.isArray(metrics)) {
          activeHolders = formatBigNumberToNumber(metrics[1] || 0);
          activeDelegates = formatBigNumberToNumber(metrics[2] || 0);
          totalDelegated = metrics[3] || ethers.BigNumber.from(0);
        } else if (metrics && typeof metrics === 'object') {
          activeHolders = formatBigNumberToNumber(metrics.activeHolders || 0);
          activeDelegates = formatBigNumberToNumber(metrics.activeDelegates || 0);
          totalDelegated = metrics.totalDelegatedTokens || ethers.BigNumber.from(0);
        }
      } catch (err) {
        console.warn("Error getting snapshot metrics:", err.message);
        
        if (delegationAnalytics && delegationAnalytics.topDelegates) {
          const uniqueDelegates = new Set(
            delegationAnalytics.delegations
              .filter(d => !isSelfDelegated(d.address, d.delegate))
              .map(d => d.delegate)
          );
          activeDelegates = uniqueDelegates.size;
          
          totalDelegated = delegationAnalytics.delegations
            .filter(d => !isSelfDelegated(d.address, d.delegate))
            .reduce((sum, d) => {
              return sum.add(ethers.utils.parseEther(d.votingPower || '0'));
            }, ethers.BigNumber.from(0));
        }
      }
      
      let percentageDelegated = 0;
      try {
        if (!totalSupply.isZero()) {
          percentageDelegated = parseFloat(
            totalDelegated.mul(100).div(totalSupply).toString()
          );
        }
      } catch (err) {
        console.warn("Error calculating percentage delegated:", err.message);
      }
      
      const tokenAnalyticsData = {
        totalSupply: ethers.utils.formatEther(totalSupply),
        activeHolders,
        activeDelegates,
        totalDelegated: ethers.utils.formatEther(totalDelegated),
        percentageDelegated
      };
      
      updateCache('token', tokenAnalyticsData);
      
      if (isMountedRef.current) {
        setTokenAnalytics(tokenAnalyticsData);
      }
      
    } catch (error) {
      console.error("Error loading token analytics:", error);
      if (isMountedRef.current) {
        setError(`Failed to load token analytics: ${error.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [contracts, contractsReady, delegationAnalytics, isSelfDelegated, formatBigNumberToNumber, isCacheValid, updateCache]);

  const loadTimelockAnalytics = useCallback(async () => {
    if (!contractsReady || !contracts.timelock) {
      if (isMountedRef.current) setError("Timelock contract not available");
      return;
    }
    
    if (isCacheValid('timelock')) {
      if (isMountedRef.current) {
        setTimelockAnalytics(cacheRef.current.timelock.data);
        return;
      }
    }
    
    try {
      if (isMountedRef.current) setLoading(true);
      
      const minDelay = await contracts.timelock.minDelay();
      let maxDelay = ethers.BigNumber.from(30 * 24 * 60 * 60);
      let gracePeriod = ethers.BigNumber.from(14 * 24 * 60 * 60);
      let executorThreshold = ethers.BigNumber.from(0);
      
      try {
        maxDelay = await contracts.timelock.maxDelay();
      } catch (err) {
        console.warn("Using default max delay:", err.message);
      }
      
      try {
        gracePeriod = await contracts.timelock.gracePeriod();
      } catch (err) {
        console.warn("Using default grace period:", err.message);
      }
      
      try {
        executorThreshold = await contracts.timelock.minExecutorTokenThreshold();
      } catch (err) {
        console.warn("Falling back to default executor threshold:", err.message);
      }
      
      let lowThreatDelay = minDelay;
      let mediumThreatDelay = minDelay.mul(3);
      let highThreatDelay = minDelay.mul(7);
      
      try {
        const lowDelay = await contracts.timelock.getDelayForThreatLevel(THREAT_LEVELS.LOW);
        if (!lowDelay.isZero()) lowThreatDelay = lowDelay;
        
        const mediumDelay = await contracts.timelock.getDelayForThreatLevel(THREAT_LEVELS.MEDIUM);
        if (!mediumDelay.isZero()) mediumThreatDelay = mediumDelay;
        
        const highDelay = await contracts.timelock.getDelayForThreatLevel(THREAT_LEVELS.HIGH);
        if (!highDelay.isZero()) highThreatDelay = highDelay;
        
        setThreatLevelDelays({
          [THREAT_LEVELS.LOW]: lowThreatDelay.toNumber(),
          [THREAT_LEVELS.MEDIUM]: mediumThreatDelay.toNumber(),
          [THREAT_LEVELS.HIGH]: highThreatDelay.toNumber()
        });
      } catch (err) {
        console.warn("Using calculated threat level delays:", err.message);
        
        try {
          const directLowDelay = await contracts.timelock.lowThreatDelay();
          if (!directLowDelay.isZero()) lowThreatDelay = directLowDelay;
          
          const directMediumDelay = await contracts.timelock.mediumThreatDelay();
          if (!directMediumDelay.isZero()) mediumThreatDelay = directMediumDelay;
          
          const directHighDelay = await contracts.timelock.highThreatDelay();
          if (!directHighDelay.isZero()) highThreatDelay = directHighDelay;
          
          setThreatLevelDelays({
            [THREAT_LEVELS.LOW]: lowThreatDelay.toNumber(),
            [THREAT_LEVELS.MEDIUM]: mediumThreatDelay.toNumber(),
            [THREAT_LEVELS.HIGH]: highThreatDelay.toNumber()
          });
        } catch (err2) {
          console.warn("Using calculated threat level delays (fallback):", err2.message);
        }
      }
      
      let pendingCount = ethers.BigNumber.from(0);
      try {
        pendingCount = await contracts.timelock.getPendingTransactionCount();
      } catch (err) {
        console.warn("Using default pending transaction count:", err.message);
      }
      
      const timelockAnalyticsData = {
        minDelay: formatBigNumberToNumber(minDelay),
        maxDelay: formatBigNumberToNumber(maxDelay),
        gracePeriod: formatBigNumberToNumber(gracePeriod),
        executorThreshold: ethers.utils.formatEther(executorThreshold),
        lowThreatDelay: formatBigNumberToNumber(lowThreatDelay),
        mediumThreatDelay: formatBigNumberToNumber(mediumThreatDelay),
        highThreatDelay: formatBigNumberToNumber(highThreatDelay),
        pendingTransactions: formatBigNumberToNumber(pendingCount)
      };
      
      updateCache('timelock', timelockAnalyticsData);
      
      if (isMountedRef.current) {
        setTimelockAnalytics(timelockAnalyticsData);
      }
      
    } catch (error) {
      console.error("Error loading timelock analytics:", error);
      if (isMountedRef.current) {
        setError(`Failed to load timelock analytics: ${error.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [contracts, contractsReady, THREAT_LEVELS, formatBigNumberToNumber, isCacheValid, updateCache]);

  // Check contract connectivity when component mounts
  useEffect(() => {
    let mounted = true;
    
    async function checkConnectivity() {
      try {
        if (mounted && contractsReady) {
          const details = await checkContractConnectivity();
          setConnectionDetails(details);
        }
      } catch (error) {
        console.error("Error checking connectivity:", error);
      }
    }
    
    checkConnectivity();
    
    return () => {
      mounted = false;
    };
  }, [contractsReady, checkContractConnectivity]);

  // Reset mounted ref when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load data based on selected metric
  useEffect(() => {
    if (selectedMetric === 'currentStats') {
      loadCurrentStatsData();
      return;
    }
    
    if (!contractsReady) {
      setError("Contracts not ready. Please connect your wallet.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    let cancelled = false;
    
    const loadData = async () => {
      try {
        // Always load timelock data since it's used in Governance Parameters on multiple tabs
        if (contracts.timelock && !isCacheValid('timelock')) {
          await loadTimelockAnalytics();
        }
        
        if (isCacheValid(selectedMetric)) {
          switch (selectedMetric) {
            case 'proposal':
              setProposalAnalytics(cacheRef.current.proposal.data);
              break;
            case 'token':
              setTokenAnalytics(cacheRef.current.token.data);
              break;
            case 'timelock':
              setTimelockAnalytics(cacheRef.current.timelock.data);
              break;
            case 'delegation':
              setDelegationAnalytics(cacheRef.current.delegation.data);
              break;
            default:
              break;
          }
          if (!cancelled) setLoading(false);
          return;
        }
        
        switch (selectedMetric) {
          case 'proposal':
            await loadProposalAnalytics();
            break;
          case 'token':
            await loadTokenAnalytics();
            break;
          case 'timelock':
            // Already loaded above if needed
            break;
          case 'delegation':
            await loadDelegationAnalytics();
            break;
          default:
            break;
        }
      } catch (err) {
        console.error(`Error loading ${selectedMetric} analytics:`, err);
        if (!cancelled) {
          setError(`Failed to load analytics: ${err.message}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      cancelled = true;
    };
  }, [
    selectedMetric, 
    contractsReady,
    contracts,
    loadProposalAnalytics, 
    loadTokenAnalytics, 
    loadTimelockAnalytics, 
    loadDelegationAnalytics,
    loadCurrentStatsData,
    isCacheValid
  ]);
  
  // Also add a separate useEffect to load timelock data when the component mounts
  // and contracts are ready, regardless of selected metric
  useEffect(() => {
    if (contractsReady && contracts.timelock && !timelockAnalytics && !isCacheValid('timelock')) {
      loadTimelockAnalytics();
    }
  }, [contractsReady, contracts, timelockAnalytics, loadTimelockAnalytics, isCacheValid]);

  // Format seconds to a human-readable duration
  const formatDuration = useCallback((seconds) => {
    if (!seconds) return "0 seconds";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  }, []);
  
  // Format token amount
  const formatTokenAmount = useCallback((amount) => {
    if (!amount) return "0";
    return parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }, []);

  // Format dollar amounts
  const formatDollars = useCallback((amount) => {
    if (!amount && amount !== 0) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // Render metric selection buttons - keeping this for navigation
  const renderMetricButtons = () => (
    <div className="flex justify-center mb-6">
      <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg max-w-3xl w-full">
        <button
          className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
            selectedMetric === 'proposal' 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
          onClick={() => setSelectedMetric('proposal')}
        >
          <Check className={`w-4 h-4 mr-2 ${selectedMetric === 'proposal' ? 'text-indigo-500' : ''}`} />
          Proposals
        </button>
        <button
          className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
            selectedMetric === 'token' 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
          onClick={() => setSelectedMetric('token')}
        >
          <Coins className={`w-4 h-4 mr-2 ${selectedMetric === 'token' ? 'text-indigo-500' : ''}`} />
          Tokens
        </button>
        <button
          className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
            selectedMetric === 'timelock' 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
          onClick={() => setSelectedMetric('timelock')}
        >
          <Clock className={`w-4 h-4 mr-2 ${selectedMetric === 'timelock' ? 'text-indigo-500' : ''}`} />
          Timelock
        </button>
        <button
          className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
            selectedMetric === 'delegation' 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
          onClick={() => setSelectedMetric('delegation')}
        >
          <Link className={`w-4 h-4 mr-2 ${selectedMetric === 'delegation' ? 'text-indigo-500' : ''}`} />
          Delegation
        </button>
        <button
          className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
            selectedMetric === 'currentStats' 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
          onClick={() => setSelectedMetric('currentStats')}
        >
          <Database className={`w-4 h-4 mr-2 ${selectedMetric === 'currentStats' ? 'text-indigo-500' : ''}`} />
          Data
        </button>
      </div>
    </div>
  );
  
  // Main render function
  return (
	   <div className="relative w-full">
      <div className="flex flex-col justify-between items-start gap-2 mb-4">
        <div className="flex-grow space-y-1">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-300">DAO Governance Analytics</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
		Only JST token holders are allowed access            </p>
        </div>
        <div>
       
        </div>
      </div>

      
      {!contractsReady && selectedMetric !== 'currentStats' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 text-amber-500" />
          <div>
            <strong>Wallet not connected!</strong> Please connect your wallet to access contract data. Current Stats tab is available without connection.
          </div>
        </div>
      )}
      
      {renderMetricButtons()}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400 mb-4"></div>
          <div className="text-slate-500 dark:text-slate-400">Loading analytics data...</div>
        </div>
      ) : error && selectedMetric !== 'currentStats' ? (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 text-rose-500" />
            <div>{error}</div>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn">
          {selectedMetric === 'proposal' && 
            <ProposalAnalyticsPage 
              proposalAnalytics={proposalAnalytics}
              govParams={govParams}
              timelockAnalytics={timelockAnalytics}
              formatTimeDuration={formatTimeDuration}
              formatDuration={formatDuration}
              formatTokenAmount={formatTokenAmount}
              threatLevelDelays={threatLevelDelays}
            />
          }
          
          {selectedMetric === 'token' && 
            <TokenAnalyticsPage 
              tokenAnalytics={tokenAnalytics}
              govParams={govParams}
              timelockAnalytics={timelockAnalytics}
              formatTimeDuration={formatTimeDuration}
              formatDuration={formatDuration}
              formatTokenAmount={formatTokenAmount}
              threatLevelDelays={threatLevelDelays}
            />
          }
          
          {selectedMetric === 'timelock' && 
            <TimelockAnalyticsPage 
              timelockAnalytics={timelockAnalytics}
              govParams={govParams}
              formatTimeDuration={formatTimeDuration}
              formatDuration={formatDuration}
              formatTokenAmount={formatTokenAmount}
              threatLevelDelays={threatLevelDelays}
            />
          }
          
          {selectedMetric === 'delegation' && <ConsistentDelegationTab />}
          
          {selectedMetric === 'currentStats' && 
            <CurrentStatsPage 
              currentStatsData={currentStatsData}
              loadingCurrentStats={loadingCurrentStats}
              error={error}
              loadCurrentStatsData={loadCurrentStatsData}
              currentStatsLastUpdated={currentStatsLastUpdated}
              formatDollars={formatDollars}
            />
          }
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;