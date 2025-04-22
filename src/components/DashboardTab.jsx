import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Clock, ArrowRight, RefreshCw, Users, FileText, Layers, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPercentage, formatCountdown } from '../utils/formatters';
import { formatTokenAmount } from '../utils/tokenFormatters';
import Loader from './Loader';
import blockchainDataCache from '../utils/blockchainDataCache';
import { useWeb3 } from '../contexts/Web3Context';
import useGovernanceParams from '../hooks/useGovernanceParams';

// Cache expiration time in milliseconds (1 minute)
const CACHE_EXPIRATION = 60 * 1000;

// Proposal batch size for optimized loading
const PROPOSAL_BATCH_SIZE = 20;
// Maximum proposal ID to check (to avoid excessive queries)
const MAX_PROPOSAL_ID = 50;

const DashboardTab = ({ user, stats, loading, proposals, getProposalVoteTotals, onRefresh }) => {
  const { contracts, isConnected } = useWeb3();
  const [directStats, setDirectStats] = useState({
    activeProposalsCount: 0,
    totalProposalsCount: 0,
    loading: true,
    stateBreakdown: {
      active: 0,
      canceled: 0,
      defeated: 0,
      succeeded: 0,
      queued: 0,
      executed: 0,
      expired: 0
    },
    lastUpdated: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [proposalVoteData, setProposalVoteData] = useState({});
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(CACHE_EXPIRATION);
  
  // Refs for tracking mounted state and canceling operations
  const isMounted = useRef(true);
  const abortControllerRef = useRef(new AbortController());
  const pendingPromises = useRef([]);
  
  // Format numbers for display with better null/undefined handling
  const formatNumberDisplay = (value) => {
    if (value === undefined || value === null) return "0";
    
    // Handle string inputs
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // If it's NaN or not a number, return "0"
    if (isNaN(numValue)) return "0";
    
    // For whole numbers, don't show decimals
    if (Math.abs(numValue - Math.round(numValue)) < 0.00001) {
      return numValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    
    // For decimal numbers, limit to 2 decimal places
    return numValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };
  
    const [threatLevelDelays, setThreatLevelDelays] = useState({});
  

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
    }, [])
  
  // Utilize our token formatter directly to ensure consistent display
  const formatToFiveDecimals = (value) => {
    return formatTokenAmount(value);
  };
  
  // Responsive formatter for token values with dynamic decimal places
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // Format with dynamic decimal places based on screen size and layout
  const formatDynamicDecimals = (value) => {
    if (value === undefined || value === null) return "0";
    
    // Handle string inputs
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // If it's NaN or not a number, return "0"
    if (isNaN(numValue)) return "0";
    
    // Dynamic decimal places based on screen width and layout
    let decimalPlaces = 10; // Default for large screens
    
    // In a responsive grid, cards stack at small screens (< 768px)
    // which gives more horizontal space per card
    if (windowWidth < 768) { 
      // Small screens with stacked layout (more horizontal space)
      decimalPlaces = 8;
    } else if (windowWidth < 900) {
      // Medium-small screens with 3-column layout (very constrained)
      decimalPlaces = 4; 
    } else if (windowWidth < 1024) {
      // Medium screens
      decimalPlaces = 6;
    } else if (windowWidth < 1280) {
      // Medium-large screens
      decimalPlaces = 8;
    }
    
    return numValue.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  };

  // OPTIMIZED: Batch proposal counting using multicall if available, or optimized batches if not
  const countProposalsWithCache = useCallback(async () => {
    if (!isMounted.current || !isConnected || !contracts.governance) {
      if (isMounted.current) {
        setDirectStats(prev => ({
          ...prev,
          loading: false,
          activeProposalsCount: 0,
          totalProposalsCount: 0,
          lastUpdated: Date.now()
        }));
      }
      return;
    }

    try {
      console.log("Checking cached proposal counts...");
      
      // Try to get from cache first
      const cacheKey = 'dashboard-proposal-counts';
      const cachedData = blockchainDataCache.get(cacheKey);
      const now = Date.now();
      
      // If we have valid cached data that's less than 1 minute old, use it
      if (cachedData && cachedData.timestamp && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
        console.log("Using cached proposal counts from", new Date(cachedData.timestamp));
        
        if (isMounted.current) {
          setDirectStats({
            ...cachedData.data,
            loading: false,
            lastUpdated: cachedData.timestamp
          });
        }
        return;
      }
      
      console.log("Cache expired or missing, counting proposals with optimized method...");
      
      // State names for logging
      const stateNames = [
        'active',     // 0
        'canceled',   // 1
        'defeated',   // 2
        'succeeded',  // 3
        'queued',     // 4
        'executed',   // 5
        'expired'     // 6
      ];
      
      // Initialize counters
      const stateBreakdown = {
        active: 0,
        canceled: 0,
        defeated: 0,
        succeeded: 0,
        queued: 0,
        executed: 0,
        expired: 0
      };
      
      // First, try to use the analyticsHelper contract if available
      // This is much faster as it can return all data in a single call
      if (contracts.analyticsHelper) {
        try {
          console.log("Using analyticsHelper for fast proposal counting");
          
          // Try to get the latest proposal ID first to optimize the range
          let latestProposalId = 0;
          
          // Check if we can get total proposals directly from the analytics helper
          if (typeof contracts.analyticsHelper.getTotalProposalsCount === 'function') {
            try {
              const count = await contracts.analyticsHelper.getTotalProposalsCount();
              latestProposalId = Math.max(0, Number(count) - 1);
              console.log(`Got total proposal count: ${count}, latest ID: ${latestProposalId}`);
            } catch (e) {
              console.warn("Error getting total proposals count:", e);
            }
          }
          
          // If we couldn't get the count, try to estimate it by checking recent IDs
          if (latestProposalId === 0) {
            latestProposalId = Math.min(MAX_PROPOSAL_ID, 100); // Limit to a reasonable number
          }
          
          // Get proposal analytics from the helper
          const analytics = await contracts.analyticsHelper.getProposalAnalytics(0, latestProposalId);
          
          // Process the analytics data
          stateBreakdown.active = Number(analytics.activeProposals) || 0;
          stateBreakdown.canceled = Number(analytics.canceledProposals) || 0;
          stateBreakdown.defeated = Number(analytics.defeatedProposals) || 0;
          stateBreakdown.succeeded = Number(analytics.succeededProposals) || 0;
          stateBreakdown.queued = Number(analytics.queuedProposals) || 0;
          stateBreakdown.executed = Number(analytics.executedProposals) || 0;
          stateBreakdown.expired = Number(analytics.expiredProposals) || 0;
          
          const totalProposals = Number(analytics.totalProposals) || 0;
          
          console.log("Fast proposal counting results:", {
            total: totalProposals,
            active: stateBreakdown.active,
            breakdown: stateBreakdown
          });
          
          // Create the data to cache and set in state
          const dataToCache = {
            activeProposalsCount: stateBreakdown.active,
            totalProposalsCount: totalProposals,
            stateBreakdown
          };
          
          // Cache the results
          blockchainDataCache.set(cacheKey, {
            timestamp: now,
            data: dataToCache
          });
          
          // Update state with fresh data
          if (isMounted.current) {
            setDirectStats({
              ...dataToCache,
              loading: false,
              lastUpdated: now
            });
          }
          
          return;
        } catch (error) {
          console.error("Error using analytics helper for proposal counting:", error);
          // Continue to fallback method
        }
      }
      
      // Fallback: Use batch processing for better performance
      console.log("Using optimized batch processing for proposal counting");
      
      let foundProposals = 0;
      
      // Process proposals in batches for better performance
      for (let batchStart = 0; batchStart < MAX_PROPOSAL_ID; batchStart += PROPOSAL_BATCH_SIZE) {
        if (!isMounted.current) return;
        
        const batchEnd = Math.min(batchStart + PROPOSAL_BATCH_SIZE, MAX_PROPOSAL_ID);
        const batchPromises = [];
         
        // Create a batch of promises
        for (let id = batchStart; id < batchEnd; id++) {
          batchPromises.push(
            contracts.governance.getProposalState(id)
              .then(state => {
                return { id, state: state };
              })
              .catch(() => null) // Return null for non-existent proposals
          );
        }
        

        
        // Execute batch in parallel
        const results = await Promise.all(batchPromises);
        
        // Process results
        for (const result of results) {
          if (result) {
            foundProposals++;
            const stateNum = typeof result.state === 'object' && result.state.toNumber 
              ? result.state.toNumber() 
              : Number(result.state);
            const stateName = stateNames[stateNum];
            if (stateName && stateBreakdown.hasOwnProperty(stateName)) {
              stateBreakdown[stateName]++;
            }
          }
        }
      }
      
      // Create the data to cache and set in state
      const dataToCache = {
        activeProposalsCount: stateBreakdown.active,
        totalProposalsCount: foundProposals,
        stateBreakdown
      };
      
      // Cache the results
      blockchainDataCache.set(cacheKey, {
        timestamp: now,
        data: dataToCache
      });
      
      console.log("Updated proposal counts:", dataToCache);
      
      // Update state with fresh data
      if (isMounted.current) {
        setDirectStats({
          ...dataToCache,
          loading: false,
          lastUpdated: now
        });
      }
    } catch (error) {
      console.error("Error in proposal counting:", error);
      
      if (isMounted.current) {
        setDirectStats(prev => ({
          ...prev,
          loading: false,
          lastUpdated: Date.now()
        }));
      }
    }
  }, [contracts.governance, contracts.analyticsHelper, isConnected]);

  // OPTIMIZED: Optimized vote data fetching with batch processing
  const fetchVoteDataWithCache = useCallback(async () => {
    if (!getProposalVoteTotals || !proposals || proposals.length === 0 || !isMounted.current) return;
    
    console.log("Optimized vote data fetching for", proposals.length, "proposals");
    const now = Date.now();
    let voteData = {};
    
    // Check cached data first for all proposals
    const cachedData = {};
    const proposalsNeedingFetch = [];
    
    // First pass: Check cache for all proposals
    for (const proposal of proposals) {
      const cacheKey = `dashboard-votes-${proposal.id}`;
      const cached = blockchainDataCache.get(cacheKey);
      
      if (cached && cached.fetchedAt && (now - cached.fetchedAt < CACHE_EXPIRATION)) {
        console.log(`Using cached vote data for proposal #${proposal.id}`);
        cachedData[proposal.id] = cached;
      } else {
        proposalsNeedingFetch.push(proposal);
      }
    }
    
    // If we need to fetch data for some proposals
    if (proposalsNeedingFetch.length > 0) {
      console.log(`Fetching fresh vote data for ${proposalsNeedingFetch.length} proposals`);
      
      // Check if we can use the analyticsHelper for a batch request
      if (contracts.analyticsHelper && 
          typeof contracts.analyticsHelper.getProposalVoteTotals === 'function') {
        try {
          console.log("Using analyticsHelper for batch vote data fetch");
          
          // Map proposals to just their IDs
          const proposalIds = proposalsNeedingFetch.map(p => p.id);
          
          // Use the helper to get vote data for all proposals in one call
          const batchResults = await contracts.analyticsHelper.getProposalVoteTotals(proposalIds);
          
          // Process the batch results
          for (let i = 0; i < proposalIds.length; i++) {
            const id = proposalIds[i];
            const data = batchResults[i] || {};
            
            // Process the data to ensure consistent format
            const processedData = {
              yesVotes: parseFloat(data.yesVotes) || 0,
              noVotes: parseFloat(data.noVotes) || 0,
              abstainVotes: parseFloat(data.abstainVotes) || 0,
              yesVotingPower: parseFloat(data.yesVotes || data.yesVotingPower) || 0,
              noVotingPower: parseFloat(data.noVotes || data.noVotingPower) || 0,
              abstainVotingPower: parseFloat(data.abstainVotes || data.abstainVotingPower) || 0,
              totalVoters: data.totalVoters || 0,
              fetchedAt: now
            };
            
            // Calculate total voting power
            processedData.totalVotingPower = processedData.yesVotingPower + 
                                          processedData.noVotingPower + 
                                          processedData.abstainVotingPower;
            
            // Calculate percentages
            if (processedData.totalVotingPower > 0) {
              processedData.yesPercentage = (processedData.yesVotingPower / processedData.totalVotingPower) * 100;
              processedData.noPercentage = (processedData.noVotingPower / processedData.totalVotingPower) * 100;
              processedData.abstainPercentage = (processedData.abstainVotingPower / processedData.totalVotingPower) * 100;
            } else {
              processedData.yesPercentage = 0;
              processedData.noPercentage = 0;
              processedData.abstainPercentage = 0;
            }
            
            // Cache the result
            const cacheKey = `dashboard-votes-${id}`;
            blockchainDataCache.set(cacheKey, processedData);
            
            // Store in our results
            cachedData[id] = processedData;
          }
        } catch (error) {
          console.error("Error in batch vote data fetch:", error);
          // Fall back to individual fetches
        }
      }
      
      // If we still have proposals needing data (batch method failed or isn't available)
      const remainingProposals = proposalsNeedingFetch.filter(p => !cachedData[p.id]);
      
      if (remainingProposals.length > 0 && isMounted.current) {
        console.log(`Fetching individual vote data for ${remainingProposals.length} proposals`);
        
        // Process remaining proposals in smaller batches for better performance
        const batchSize = 3; // Reduced batch size to avoid RPC errors
        for (let i = 0; i < remainingProposals.length; i += batchSize) {
          if (!isMounted.current) return;
          
          const batch = remainingProposals.slice(i, i + batchSize);
          
          // Process this batch in parallel
          const batchPromises = batch.map(async (proposal) => {
            try {
              if (!isMounted.current) return { id: proposal.id, data: null };
              
              console.log(`Fetching vote data for proposal #${proposal.id}`);
              
              // Use the getProposalVoteTotals function from the context
              const data = await getProposalVoteTotals(proposal.id);
              
              // Process the data to ensure consistent format
              const processedData = {
                yesVotes: parseFloat(data.yesVotes) || 0,
                noVotes: parseFloat(data.noVotes) || 0,
                abstainVotes: parseFloat(data.abstainVotes) || 0,
                yesVotingPower: parseFloat(data.yesVotes || data.yesVotingPower) || 0,
                noVotingPower: parseFloat(data.noVotes || data.noVotingPower) || 0,
                abstainVotingPower: parseFloat(data.abstainVotes || data.abstainVotingPower) || 0,
                totalVoters: data.totalVoters || 0,
                
                // Store percentages based on voting power
                yesPercentage: data.yesPercentage || 0,
                noPercentage: data.noPercentage || 0,
                abstainPercentage: data.abstainPercentage || 0,
                
                // Add a timestamp to know when the data was fetched
                fetchedAt: now
              };
              
              // Calculate total voting power
              processedData.totalVotingPower = processedData.yesVotingPower + 
                                            processedData.noVotingPower + 
                                            processedData.abstainVotingPower;
              
              // If percentages aren't provided, calculate them based on voting power
              if (!data.yesPercentage && !data.noPercentage && !data.abstainPercentage) {
                if (processedData.totalVotingPower > 0) {
                  processedData.yesPercentage = (processedData.yesVotingPower / processedData.totalVotingPower) * 100;
                  processedData.noPercentage = (processedData.noVotingPower / processedData.totalVotingPower) * 100;
                  processedData.abstainPercentage = (processedData.abstainVotingPower / processedData.totalVotingPower) * 100;
                }
              }
              
              // Cache the result
              const cacheKey = `dashboard-votes-${proposal.id}`;
              blockchainDataCache.set(cacheKey, processedData);
              
              return {
                id: proposal.id,
                data: processedData
              };
            } catch (error) {
              console.error(`Error fetching vote data for proposal ${proposal.id}:`, error);
              return {
                id: proposal.id,
                data: null
              };
            }
          });
          
          // Add a small delay between batches to avoid RPC errors
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Process this batch
          const batchResults = await Promise.allSettled(batchPromises);
          
          // Collect successful results from this batch
          batchResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value && result.value.data) {
              cachedData[result.value.id] = result.value.data;
            }
          });
        }
      }
    }
    
    // Update state with all collected vote data
    if (isMounted.current) {
      setProposalVoteData(cachedData);
    }
  }, [proposals, getProposalVoteTotals, contracts.analyticsHelper]);

  // Combined refresh function to update all data
  const refreshAllData = useCallback(async (force = false) => {
    if (!isMounted.current) return;
    
    const now = Date.now();
    setLastRefreshTime(now);
    setTimeUntilRefresh(CACHE_EXPIRATION);
    
    // Only refresh if forced or if the cache has expired
    if (force || !directStats.lastUpdated || (now - directStats.lastUpdated > CACHE_EXPIRATION)) {
      setIsRefreshing(true);
      
      // If onRefresh is provided from parent, call it
      if (onRefresh) {
        try {
          await onRefresh();
        } catch (error) {
          console.error("Error in parent onRefresh:", error);
        }
      }
      
      try {
        // Create an array to track promises so we can safely handle component unmount
        const promises = [];
        
        // Queue our data fetching operations
        promises.push(countProposalsWithCache());
        
        // Only fetch vote data if we have proposals
        if (proposals && proposals.length > 0) {
          promises.push(fetchVoteDataWithCache());
        }
        
        // Track pending promises for cleanup
        pendingPromises.current = promises;
        
        // Wait for all promises to complete or for component to unmount
        await Promise.all(promises);
        
        // Clear pending promises array
        pendingPromises.current = [];
        
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error refreshing data:", error);
        }
      }
      
      if (isMounted.current) {
        setIsRefreshing(false);
      }
    }
  }, [directStats.lastUpdated, onRefresh, proposals]);

  // Set mounted flag on initial render and cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      
      // Abort any pending fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        // Create a new controller for future requests if the component re-mounts
        abortControllerRef.current = new AbortController();
      }
      
      // Clear any pending promises
      pendingPromises.current = [];
    };
  }, []);

  // Countdown timer for next refresh
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isMounted.current) {
        clearInterval(timer);
        return;
      }
      
      const elapsed = Date.now() - lastRefreshTime;
      const remaining = Math.max(0, CACHE_EXPIRATION - elapsed);
      
      if (isMounted.current) {
        setTimeUntilRefresh(remaining);
        
        // Auto-refresh when the time is up
        if (remaining === 0) {
          refreshAllData();
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lastRefreshTime, refreshAllData]);

  // Initial load of proposal counts
  useEffect(() => {
    // Only run once on initial load and when dependencies change
    if (directStats.loading && !directStats.lastUpdated && isMounted.current) {
      countProposalsWithCache();
    }
  }, [countProposalsWithCache, directStats.loading, directStats.lastUpdated]);

  // Initial load of vote data
  useEffect(() => {
    // Only run on initial load or when proposals change
    if (isMounted.current && proposals && proposals.length > 0) {
      fetchVoteDataWithCache();
    }
  }, [fetchVoteDataWithCache, proposals]);

  // Calculate proposal success rate
  const calculateProposalSuccessRate = useCallback(() => {
    const { stateBreakdown } = directStats;
    const successfulProposals = (stateBreakdown.succeeded || 0) + 
                              (stateBreakdown.queued || 0) + 
                              (stateBreakdown.executed || 0);
    const nonCanceledCount = directStats.totalProposalsCount - (stateBreakdown.canceled || 0);
    return nonCanceledCount > 0 ? (successfulProposals / nonCanceledCount) : 0;
  }, [directStats]);
  
  // Get the success rate and format it
  const proposalSuccessRate = useMemo(() => calculateProposalSuccessRate(), [calculateProposalSuccessRate]);
  const formattedSuccessRate = formatPercentage(proposalSuccessRate);
  const [isGovExpanded, setIsGovExpanded] = useState(true);

  // Format the time until next refresh
  const formatTimeUntilRefresh = () => {
    const seconds = Math.ceil(timeUntilRefresh / 1000);
    return `${seconds}s`;
  };
  
  const [isCoreSectionExpanded, setIsCoreSectionExpanded] = useState(false);
  const [isThreatSectionExpanded, setIsThreatSectionExpanded] = useState(false);
  const [isRefundSectionExpanded, setIsRefundSectionExpanded] = useState(false);
  const govParams = useGovernanceParams();

  


  return (
    
    <div>
     <div className="mb-6">
<<<<<<< HEAD
  <h2 className="text-xl font-semibold dark:text-white">Dashboard</h2>
  <p className="text-gray-500 dark:text-gray-400">Snapshot of important data</p>
=======
  <h3 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-300">Dashboard</h3>
  <p className="text-gray-500 dark:text-gray-400">View important DAO mertics</p>
>>>>>>> d051713 (Initial commit or update)
</div>

   
   {/* Governance Parameters Section */}
   <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 border-l-4 border-indigo-500 dark:border-indigo-400 transition-all duration-300  mx-0 px-2 relative overflow-hidden" >
   {/* Hidden spacer to force full width - invisible but takes up space */}
  <div className="absolute opacity-0 invisible w-full px-4" aria-hidden="true">
    {"".padEnd(2000, " ")}
  </div>

  <div 
    onClick={() => setIsGovExpanded(!isGovExpanded)} 
    className="flex items-center justify-between px-6 py-3 cursor-pointer"
  >
    <div className="flex items-center">
      <Settings 
        className={`h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2 transition-transform duration-300 ${isGovExpanded ? '' : 'transform rotate-180'}`} 
      />
      <h3 className="text-lg font-medium dark:text-white">Governance Parameters</h3>
      {govParams.loading && <div className="ml-2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
    </div>
    <button 
      onClick={(e) => {
        e.stopPropagation(); // Prevent the parent div's onClick from firing
        setIsGovExpanded(!isGovExpanded);
      }}
      className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
      aria-label={isGovExpanded ? "Collapse section" : "Expand section"}
    >
      {isGovExpanded ? 
        <ChevronUp className="h-5 w-5 text-indigo-500 dark:text-indigo-400" /> : 
        <ChevronDown className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
      }
    </button>
  </div>

  {govParams.error && (
    <div className="text-sm text-red-500 dark:text-red-400 mt-1 px-6">
      {govParams.error}
    </div>
  )}

    {/* Collapsible Governance Details */}
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isGovExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Core Parameters Section */}
        <div className="border-b border-gray-100 dark:border-gray-700">
          <div 
            className="px-6 py-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300 relative group"
            onClick={() => setIsCoreSectionExpanded(!isCoreSectionExpanded)}
          >
            <div className="flex items-center justify-between relative">
              <div className="flex items-center">
                {/* Animated indicator with rounded caps and smoother transition */}
                <div 
                  className={`absolute left-0 transition-all duration-300 ease-in-out 
                    ${isCoreSectionExpanded 
                      ? 'w-2 h-2 rounded-full bg-indigo-400/70 dark:bg-indigo-500/50 top-1/2 -translate-y-1/2 -translate-x-3' 
                      : 'w-full h-1 rounded-full bg-indigo-400/30 dark:bg-indigo-500/30 bottom-0 origin-left'}`}
                  style={{
                    transformOrigin: 'left center',
                    animationName: isCoreSectionExpanded ? 'lineToPoint' : 'pointToLine',
                    animationDuration: isCoreSectionExpanded ? '650ms' : '500ms',
                    animationFillMode: 'forwards',
                    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 relative pl-0 transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Core Parameters
                </span>
              </div>
              {isCoreSectionExpanded ? 
                <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              }
            </div>
          </div>
          
          <div 
            className={`bg-gray-50 dark:bg-gray-800/50 px-6 py-2 space-y-2 transition-all duration-500 ease-in-out overflow-hidden ${
              isCoreSectionExpanded ? 'max-h-[250px] opacity-100' : 'max-h-0 opacity-0 py-0'
            }`}
          >
            <div className="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Quorum</span>
              <span className="text-sm font-medium dark:text-white">{govParams.formattedQuorum} JST</span>
            </div>
            
            <div className="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Voting Duration</span>
              <span className="text-sm font-medium dark:text-white">{govParams.formattedDuration}</span>
            </div>
            
            <div className="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Proposal Threshold</span>
              <span className="text-sm font-medium dark:text-white">{govParams.formattedThreshold} JST</span>
            </div>
            
            <div className="flex items-center justify-between pb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">Proposal Stake</span>
              <span className="text-sm font-medium dark:text-white">{govParams.formattedStake} JST</span>
            </div>
          </div>
        </div>
        
        {/* Threat Levels Section */}
        <div className="border-b border-gray-100 dark:border-gray-700">
          <div 
            className="px-6 py-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300 relative group"
            onClick={() => setIsThreatSectionExpanded(!isThreatSectionExpanded)}
          >
            <div className="flex items-center justify-between relative">
              <div className="flex items-center">
                {/* Animated indicator with rounded caps and smoother transition */}
                <div 
                  className={`absolute left-0 transition-all duration-300 ease-in-out 
                    ${isThreatSectionExpanded 
                      ? 'w-2 h-2 rounded-full bg-amber-400/70 dark:bg-amber-500/50 top-1/2 -translate-y-1/2 -translate-x-3' 
                      : 'w-full h-1 rounded-full bg-amber-400/30 dark:bg-amber-500/30 bottom-0 origin-left'}`}
                  style={{
                    transformOrigin: 'left center',
                    animationName: isThreatSectionExpanded ? 'lineToPoint' : 'pointToLine',
                    animationDuration: isThreatSectionExpanded ? '650ms' : '500ms',
                    animationFillMode: 'forwards',
                    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 relative pl-0 transition-colors duration-300 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Threat Levels
                </span>
              </div>
              {isThreatSectionExpanded ? 
                <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 group-hover:text-amber-600 dark:group-hover:text-amber-400" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
              }
            </div>
          </div>
          
          <div 
            className={`bg-gray-50 dark:bg-gray-800/50 px-6 py-2 space-y-2 transition-all duration-500 ease-in-out overflow-hidden ${
              isThreatSectionExpanded ? 'max-h-[250px] opacity-100' : 'max-h-0 opacity-0 py-0'
            }`}
          >
            <div className="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-sm text-emerald-700 dark:text-emerald-400">Low Threat</span>
              <span className="text-sm font-medium dark:text-white">{formatTimeDuration(threatLevelDelays[0] || 0)}</span>
            </div>
            
            <div className="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-sm text-amber-700 dark:text-amber-400">Medium Threat</span>
              <span className="text-sm font-medium dark:text-white">{formatTimeDuration(threatLevelDelays[1] || 0)}</span>
            </div>
            
            <div className="flex items-center justify-between pb-1">
              <span className="text-sm text-rose-700 dark:text-rose-400">High Threat</span>
              <span className="text-sm font-medium dark:text-white">{formatTimeDuration(threatLevelDelays[2] || 0)}</span>
            </div>
          </div>
        </div>
        
        {/* Refund Percentages Section */}
        <div>
          <div 
            className="px-6 py-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300 relative group"
            onClick={() => setIsRefundSectionExpanded(!isRefundSectionExpanded)}
          >
            <div className="flex items-center justify-between relative">
              <div className="flex items-center">
                {/* Animated indicator with rounded caps and smoother transition */}
                <div 
                  className={`absolute left-0 transition-all duration-300 ease-in-out 
                    ${isRefundSectionExpanded 
                      ? 'w-2 h-2 rounded-full bg-purple-400/70 dark:bg-purple-500/50 top-1/2 -translate-y-1/2 -translate-x-3' 
                      : 'w-full h-1 rounded-full bg-purple-400/30 dark:bg-purple-500/30 bottom-0 origin-left'}`}
                  style={{
                    transformOrigin: 'left center',
                    animationName: isRefundSectionExpanded ? 'lineToPoint' : 'pointToLine',
                    animationDuration: isRefundSectionExpanded ? '650ms' : '500ms',
                    animationFillMode: 'forwards',
                    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 relative pl-0 transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  Refund Percentages
                </span>
              </div>
              {isRefundSectionExpanded ? 
                <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              }
            </div>
          </div>
          
          <div 
            className={`bg-gray-50 dark:bg-gray-800/50 px-6 py-2 space-y-2 transition-all duration-500 ease-in-out overflow-hidden ${
              isRefundSectionExpanded ? 'max-h-[250px] opacity-100' : 'max-h-0 opacity-0 py-0'
            }`}
          >
            <div className="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-sm bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 rounded-full px-3 py-1 inline-flex items-center">
                <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                Defeated
              </span>
              <span className="text-sm font-medium dark:text-white">{govParams.defeatedRefundPercentage}%</span>
            </div>
            
            <div className="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-sm bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-600 inline-flex items-center">
                <div className="h-2 w-2 bg-gray-500 rounded-full mr-2"></div>
                Canceled
              </span>
              <span className="text-sm font-medium dark:text-white">{govParams.canceledRefundPercentage}%</span>
            </div>
            
            <div className="flex items-center justify-between pb-1">
              <span className="text-sm bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700 inline-flex items-center">
                <div className="h-2 w-2 bg-gray-700 rounded-full mr-2"></div>
                Expired
              </span>
              <span className="text-sm font-medium dark:text-white">{govParams.expiredRefundPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
	        </div>


     
     {/* Governance Stats */}
     <div className="grid grid-cols-1 px-2 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 text-center">DAO Overview</h3>
          {directStats.loading && !directStats.lastUpdated ? (
            <Loader size="small" text="Loading stats..." />
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col items-start">
                <p className="text-gray-500 dark:text-gray-400">Token Holders</p>
                <p className="text-2xl font-bold dark:text-white flex items-center justify-start">
                  <Users className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                  {formatNumberDisplay(stats.totalHolders)}
                </p>
                {stats.totalHolders === 0 && <p className="text-xs text-orange-500 dark:text-orange-400"></p>}
              </div>
              <div className="flex flex-col items-end">
                <p className="text-gray-500 dark:text-gray-400">Circulating</p>
                <p className="text-2xl font-bold dark:text-white">{formatNumberDisplay(stats.circulatingSupply)}</p>
                {stats.circulatingSupply === "0" && <p className="text-xs text-orange-500 dark:text-orange-400"></p>}
              </div>
              <div className="flex flex-col items-start">
                <p className="text-gray-500 dark:text-gray-400">Active <br /> Proposals</p>
                <p className="text-2xl font-bold dark:text-white flex items-center justify-start">
                  <FileText className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
                  {directStats.activeProposalsCount}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-gray-500 dark:text-gray-400">Total <br /> Proposals</p>
                <p className="text-2xl font-bold dark:text-white flex items-center justify-end">
                  <Layers className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400" />
                  {directStats.totalProposalsCount}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 text-center">Your Account</h3>
        <div className="space-y-3">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Balance</p>
              <div className="relative">
                <p className="text-xl md:text-2xl font-bold overflow-hidden text-ellipsis whitespace-nowrap dark:text-white">
                  {formatDynamicDecimals(user.balance)} <span className="text-sm md:text-base font-medium">JST</span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Voting Power</p>
              <div className="relative">
                <p className="text-xl md:text-2xl font-bold overflow-hidden text-ellipsis whitespace-nowrap dark:text-white">
                  {formatDynamicDecimals(user.votingPower)} <span className="text-sm md:text-base font-medium">JST</span>
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <button 
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium flex items-center"
                onClick={() => document.querySelector('[data-tab="delegation"]')?.click()}
              >
                View Delegation Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 text-center">Governance Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Participation Rate</p>
                <p className="text-sm font-medium dark:text-gray-300">{stats.formattedParticipationRate || formatPercentage(stats.participationRate)}</p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 dark:bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(stats.participationRate * 100, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Delegation Rate</p>
                <p className="text-sm font-medium dark:text-gray-300">{stats.formattedDelegationRate || formatPercentage(stats.delegationRate)}</p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 dark:bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(stats.delegationRate * 100, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Proposal Success Rate</p>
                <p className="text-sm font-medium dark:text-gray-300">{formattedSuccessRate}</p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-indigo-500 dark:bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(proposalSuccessRate * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error Message (if any) */}
      {stats.errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error loading dashboard data:</p>
          <p className="text-sm">{stats.errorMessage}</p>
          <p className="text-sm mt-2">Try refreshing the page or check your network connection.</p>
        </div>
      )}
      
      {/* Active Proposals */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Proposals</h3>
          <button 
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
            onClick={() => document.querySelector('[data-tab="proposals"]')?.click()}
          >
            View All
          </button>
        </div>
        {loading && proposals.length === 0 ? (
          <Loader size="small" text="Loading proposals..." />
        ) : (
          <div className="space-y-4">
            {proposals && proposals.length > 0 ? (
              proposals.map((proposal, idx) => {
                // Get vote data from our state
                const voteData = proposalVoteData[proposal.id] || {
                  yesVotes: parseFloat(proposal.yesVotes) || 0,
                  noVotes: parseFloat(proposal.noVotes) || 0,
                  abstainVotes: parseFloat(proposal.abstainVotes) || 0,
                  yesVotingPower: parseFloat(proposal.yesVotes) || 0,
                  noVotingPower: parseFloat(proposal.noVotes) || 0,
                  abstainVotingPower: parseFloat(proposal.abstainVotes) || 0,
                  totalVoters: 0,
                  yesPercentage: 0,
                  noPercentage: 0,
                  abstainPercentage: 0
                };

                // Ensure we have all required properties with correct types
                const processedVoteData = {
                  // Original values from blockchain
                  yesVotingPower: parseFloat(voteData.yesVotingPower || voteData.yesVotes || 0),
                  noVotingPower: parseFloat(voteData.noVotingPower || voteData.noVotes || 0),
                  abstainVotingPower: parseFloat(voteData.abstainVotingPower || voteData.abstainVotes || 0),
                  totalVoters: voteData.totalVoters || 0,
                  
                  // Use existing percentages if available, otherwise calculate
                  yesPercentage: voteData.yesPercentage || 0,
                  noPercentage: voteData.noPercentage || 0,
                  abstainPercentage: voteData.abstainPercentage || 0
                };

                // Calculate total voting power
                const totalVotingPower = processedVoteData.yesVotingPower + 
                                        processedVoteData.noVotingPower + 
                                        processedVoteData.abstainVotingPower;

                // If percentages aren't provided, calculate them based on voting power
                if (!voteData.yesPercentage && !voteData.noPercentage && !voteData.abstainPercentage) {
                  if (totalVotingPower > 0) {
                    processedVoteData.yesPercentage = (processedVoteData.yesVotingPower / totalVotingPower) * 100;
                    processedVoteData.noPercentage = (processedVoteData.noVotingPower / totalVotingPower) * 100;
                    processedVoteData.abstainPercentage = (processedVoteData.abstainVotingPower / totalVotingPower) * 100;
                  }
                }
                
                return (
                  <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium dark:text-white">{proposal.title || `Proposal #${proposal.id}`}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Proposal #{proposal.id}</p>
                      </div>
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatCountdown(proposal.deadline)}
                      </span>
                    </div>
                    
                    {/* Vote percentages */}
                    <div className="flex justify-between text-sm mb-2 dark:text-gray-300">
                      <span>Yes: {processedVoteData.yesPercentage.toFixed(1)}%</span>
                      <span>No: {processedVoteData.noPercentage.toFixed(1)}%</span>
                      <span>Abstain: {processedVoteData.abstainPercentage.toFixed(1)}%</span>
                    </div>
                    
                    {/* Vote bar */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="flex h-full">
                        <div 
                          className="bg-green-500 h-full" 
                          style={{ width: `${processedVoteData.yesPercentage}%` }}
                        ></div>
                        <div 
                          className="bg-red-500 h-full" 
                          style={{ width: `${processedVoteData.noPercentage}%` }}
                        ></div>
                        <div 
                          className="bg-gray-400 dark:bg-gray-500 h-full" 
                          style={{ width: `${processedVoteData.abstainPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Voting power display */}
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <div>{formatToFiveDecimals(processedVoteData.yesVotingPower)} JST</div>
                      <div className="text-center">{formatToFiveDecimals(processedVoteData.noVotingPower)} JST</div>
                      <div className="text-right">{formatToFiveDecimals(processedVoteData.abstainVotingPower)} JST</div>
                    </div>
                    
                    {/* Total voters count */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      Total voters: {processedVoteData.totalVoters || 0}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No active proposals at the moment
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Last updated info */}
      {directStats.lastUpdated && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-right">
          Last updated: {new Date(directStats.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
