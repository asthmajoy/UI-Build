import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  BarChart, 
  Link as LinkIcon, 
  Clock, 
  Users, 
  AlertTriangle, 
  RefreshCw,
  Award,
  ChevronRight,
  Network,
  Percent
} from 'lucide-react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { formatPercentage, formatNumber, formatAddress } from '../utils/formatters';

// Constants
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const NETWORK_NAME = process.env.NETWORK || 'sepolia';

// Reusable components for consistent styling
const DataCard = ({ title, children, className = "", icon = null }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}>
    <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-4 flex items-center gap-2">
      {icon && <span className="text-slate-500 dark:text-slate-400">{icon}</span>}
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const StatBox = ({ label, value, icon, className = "", iconColor = "text-slate-500" }) => (
  <div className={`px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex flex-col ${className}`}>
    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
      {icon && <span className={iconColor}>{icon}</span>}
      <span>{label}</span>
    </div>
    <div className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-200 truncate">
      {value}
    </div>
  </div>
);

const ProgressBar = ({ value, max = 100, color, height = 6 }) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const progressColors = {
    success: "bg-emerald-500 dark:bg-emerald-400",
    info: "bg-sky-500 dark:bg-sky-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-rose-500 dark:bg-rose-400",
    primary: "bg-indigo-500 dark:bg-indigo-400",
    secondary: "bg-slate-500 dark:bg-slate-400",
    default: "bg-blue-500 dark:bg-blue-400"
  };
  
  const bgColor = color ? progressColors[color] || color : progressColors.default;
  
  return (
    <div className="relative w-full">
      <div 
        className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden transition-all duration-300`}
        style={{ height: `${height}px` }}
      >
        <div
          className={`${bgColor} rounded-full transition-all duration-500 ease-out`}
          style={{ 
            width: `${percentage}%`, 
            height: `${height}px` 
          }}
        ></div>
      </div>
    </div>
  );
};

const DelegateListItem = ({ delegate, index, formatVotingPower }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
    <div className="flex items-center">
      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mr-3">
        {index + 1}
      </div>
      <div>
        <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
          {formatAddress(delegate.address)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {delegate.percentageFormatted} of total supply
        </div>
      </div>
    </div>
    <div className="text-right">
      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {formatVotingPower(delegate.delegatedPower)} JST
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
        <Users className="w-3 h-3" />
        <span>{delegate.delegatorCount || 0} delegators</span>
      </div>
    </div>
  </div>
);

const GlobalDelegationComponent = () => {
  const { contracts, contractsReady, provider } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [delegationData, setDelegationData] = useState(null);
  const [blockNumber, setBlockNumber] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(false);
  
  // Add a reference to track if component is mounted
  const isMounted = useRef(true);
  
  // Safe state setter functions - only update state if component is still mounted
  const safeSetLoading = useCallback((value) => {
    if (isMounted.current) setLoading(value);
  }, []);
  
  const safeSetError = useCallback((value) => {
    if (isMounted.current) setError(value);
  }, []);
  
  const safeSetDelegationData = useCallback((value) => {
    if (isMounted.current) setDelegationData(value);
  }, []);
  
  const safeSetBlockNumber = useCallback((value) => {
    if (isMounted.current) setBlockNumber(value);
  }, []);
  
  const safeSetLastUpdated = useCallback((value) => {
    if (isMounted.current) setLastUpdated(value);
  }, []);
  
  const safeSetApiAvailable = useCallback((value) => {
    if (isMounted.current) setApiAvailable(value);
  }, []);
  
  // Format date for display
  const formatDate = useCallback((date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }, []);
  
  // Format voting power for display
  const formatVotingPower = useCallback((power) => {
    if (!power) return "0";
    const numberValue = parseFloat(power);
    if (numberValue < 0.01) return "<0.01";
    return numberValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }, []);
  
  // Cache in localStorage
  const getCachedData = useCallback(() => {
    try {
      const cachedString = localStorage.getItem('delegationCache');
      if (!cachedString) return null;
      
      const cache = JSON.parse(cachedString);
      
      // Check if cache is valid
      if (cache.timestamp && (Date.now() - cache.timestamp) < CACHE_DURATION) {
        return cache.data;
      }
    } catch (err) {
      console.warn("Error reading cache:", err);
    }
    return null;
  }, []);
  
  // Update cache
  const updateCache = useCallback((data) => {
    try {
      localStorage.setItem('delegationCache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn("Error updating cache:", err);
    }
  }, []);
  
  // Load delegation data directly from contracts
  const loadDelegationDataFromContracts = useCallback(async (abortSignal) => {
    if (!contractsReady || !contracts.justToken || abortSignal?.aborted) {
      safeSetError("Token contract not available. Please check your connection.");
      safeSetLoading(false);
      return;
    }
    
    try {
      safeSetLoading(true);
      safeSetError(null);
      
      // Get current block for consistent data
      const currentBlock = await provider.getBlockNumber();
      // Early exit if component was unmounted
      if (abortSignal?.aborted) return;
      
      const blockTag = { blockTag: currentBlock };
      
      // Get total supply for percentage calculations
      const totalSupply = await contracts.justToken.totalSupply(blockTag);
      // Early exit if component was unmounted
      if (abortSignal?.aborted) return;
      
      const totalSupplyFormatted = ethers.utils.formatEther(totalSupply);
      
      // Track global delegation data
      const processedDelegators = new Set();
      const directDelegations = [];
      const delegateVotingPowers = new Map();
      const delegateCounts = new Map();
      
      // Function to process a delegation
      const processDelegation = async (delegator) => {
        if (processedDelegators.has(delegator.toLowerCase()) || abortSignal?.aborted) return;
        processedDelegators.add(delegator.toLowerCase());
        
        try {
          const [delegate, balance] = await Promise.all([
            contracts.justToken.getDelegate(delegator, blockTag),
            contracts.justToken.balanceOf(delegator, blockTag)
          ]);
          
          // Early exit if component was unmounted
          if (abortSignal?.aborted) return;
          
          if (delegate && !balance.isZero()) {
            const votingPower = ethers.utils.formatEther(balance);
            
            // Calculate delegation depth
            let depth = 1;
            if (contracts.daoHelper) {
              try {
                const delegationPath = await contracts.daoHelper.getDelegationPath(delegator, blockTag);
                // Early exit if component was unmounted
                if (abortSignal?.aborted) return;
                depth = delegationPath.depth || 1;
              } catch (err) {
                // Use default depth if helper not available
              }
            }
            
            // Only track non-self delegations
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
              
              // Update delegate's voting power
              const currentPower = delegateVotingPowers.get(delegate.toLowerCase()) || "0";
              const newPower = ethers.utils.formatEther(
                ethers.utils.parseEther(currentPower).add(balance)
              );
              delegateVotingPowers.set(delegate.toLowerCase(), newPower);
              
              // Update delegator count
              delegateCounts.set(
                delegate.toLowerCase(), 
                (delegateCounts.get(delegate.toLowerCase()) || 0) + 1
              );
            }
          }
        } catch (err) {
          console.warn(`Error processing delegation for ${delegator}:`, err.message);
        }
      };
      
      // Process all historical delegates first
      try {
        // Get past delegation events
        const filter = contracts.justToken.filters.DelegateChanged();
        const events = await contracts.justToken.queryFilter(filter, -100000, currentBlock);
        // Early exit if component was unmounted
        if (abortSignal?.aborted) return;
        
        // Extract unique delegates and delegators
        const uniqueAddresses = new Set();
        for (const event of events) {
          if (event.args) {
            if (event.args.delegator) uniqueAddresses.add(event.args.delegator);
            if (event.args.toDelegate) uniqueAddresses.add(event.args.toDelegate);
          }
        }
        
        // Process all unique addresses found in events
        const addresses = Array.from(uniqueAddresses);
        for (const addr of addresses) {
          // Check if aborted before each processing step
          if (abortSignal?.aborted) return;
          await processDelegation(addr);
        }
        
        // If we don't have enough data, scan for token holders
        if (directDelegations.length < 50 && !abortSignal?.aborted) {
          const transferFilter = contracts.justToken.filters.Transfer();
          const transferEvents = await contracts.justToken.queryFilter(transferFilter, -50000, currentBlock);
          // Early exit if component was unmounted
          if (abortSignal?.aborted) return;
          
          const tokenHolders = new Set();
          for (const event of transferEvents) {
            if (event.args) {
              if (event.args.from) tokenHolders.add(event.args.from);
              if (event.args.to) tokenHolders.add(event.args.to);
            }
          }
          
          // Process token holders (limit to avoid too many requests)
          const holders = Array.from(tokenHolders).slice(0, 200);
          for (const holder of holders) {
            // Check if aborted before each processing step
            if (abortSignal?.aborted) return;
            if (!processedDelegators.has(holder.toLowerCase())) {
              await processDelegation(holder);
            }
          }
        }
      } catch (err) {
        console.error("Error scanning events:", err);
        if (abortSignal?.aborted) return;
      }
      
      // Early exit if component was unmounted
      if (abortSignal?.aborted) return;
      
      // Create top delegates list with percentages
      const topDelegates = Array.from(delegateVotingPowers.entries())
        .map(([address, power]) => {
          const percentage = totalSupply.gt(0) 
            ? parseFloat(ethers.utils.parseEther(power).mul(100).div(totalSupply).toString()) / 100
            : 0;
            
          return {
            address,
            delegatedPower: power,
            percentage,
            percentageFormatted: formatPercentage(percentage),
            delegatorCount: delegateCounts.get(address.toLowerCase()) || 0
          };
        })
        .sort((a, b) => parseFloat(b.delegatedPower) - parseFloat(a.delegatedPower));
      
      // Calculate total delegated amount
      const totalDelegated = directDelegations.reduce((sum, d) => {
        return sum.add(ethers.utils.parseEther(d.votingPower));
      }, ethers.BigNumber.from(0));
      
      // Percentage of supply delegated
      const percentageDelegated = totalSupply.gt(0) 
        ? parseFloat(totalDelegated.mul(100).div(totalSupply).toString()) / 100
        : 0;
      
      // Calculate top 5 delegate concentration
      const top5Concentration = topDelegates.slice(0, 5).reduce((sum, d) => sum + d.percentage, 0);
      
      // Prepare final data
      const analyticsData = {
        blockNumber: currentBlock,
        timestamp: Date.now(),
        delegations: directDelegations,
        topDelegates: topDelegates.slice(0, 20), // Limit to top 20
        totalSupply: totalSupplyFormatted,
        totalDelegated: ethers.utils.formatEther(totalDelegated),
        percentageDelegated,
        top5Concentration,
        uniqueDelegatesCount: delegateVotingPowers.size,
        uniqueDelegatorsCount: directDelegations.length,
        network: NETWORK_NAME
      };
      
      // Final exit check before updating state
      if (abortSignal?.aborted) return;
      
      // Update cache
      updateCache(analyticsData);
      
      // Update state
      safeSetDelegationData(analyticsData);
      safeSetBlockNumber(currentBlock);
      safeSetLastUpdated(new Date());
      safeSetLoading(false);
    } catch (error) {
      console.error("Error loading delegation analytics:", error);
      // Only update state if not aborted
      if (!abortSignal?.aborted) {
        safeSetError(`Failed to load delegation data: ${error.message}`);
        safeSetLoading(false);
      }
    }
  }, [contracts, contractsReady, provider, updateCache, safeSetDelegationData, safeSetBlockNumber, safeSetLastUpdated, safeSetLoading, safeSetError]);
  
  // Try to fetch from API first, fall back to contract calls
  const fetchDelegationData = useCallback(async (abortSignal) => {
    // Check cache first
    const cachedData = getCachedData();
    if (cachedData && !abortSignal?.aborted) {
      safeSetDelegationData(cachedData);
      safeSetBlockNumber(cachedData.blockNumber);
      safeSetLastUpdated(new Date(cachedData.timestamp));
      safeSetLoading(false);
      return;
    }
    
    // Early exit if aborted
    if (abortSignal?.aborted) return;
    
    // Try API first if available
    if (apiAvailable) {
      try {
        safeSetLoading(true);
        
        // Create an AbortController to set a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // Merge our component's abort signal with the timeout signal
        const combinedSignal = abortSignal 
          ? { aborted: abortSignal.aborted || controller.signal.aborted } 
          : controller.signal;
        
        // Early exit if already aborted
        if (combinedSignal.aborted) {
          clearTimeout(timeoutId);
          return;
        }
        
        const response = await fetch(`${process.env.REACT_APP_API_GATEWAY_URL}/delegations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.REACT_APP_API_KEY || ''
          },
          signal: controller.signal
        }).catch(() => ({ ok: false }));
        
        clearTimeout(timeoutId);
        
        // Early exit if aborted during fetch
        if (abortSignal?.aborted) return;
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.blockNumber && !abortSignal?.aborted) {
            updateCache(data);
            safeSetDelegationData(data);
            safeSetBlockNumber(data.blockNumber);
            safeSetLastUpdated(new Date());
            safeSetLoading(false);
            return;
          }
        }
        
        // Early exit if aborted
        if (abortSignal?.aborted) return;
        
        // If we got here, the API request didn't succeed
        await loadDelegationDataFromContracts(abortSignal);
      } catch (error) {
        // Early exit if aborted
        if (abortSignal?.aborted) return;
        
        // Silently fall back to contract calls
        await loadDelegationDataFromContracts(abortSignal);
      }
    } else {
      // API not available, use contract calls
      await loadDelegationDataFromContracts(abortSignal);
    }
  }, [apiAvailable, getCachedData, updateCache, loadDelegationDataFromContracts, safeSetDelegationData, safeSetBlockNumber, safeSetLastUpdated, safeSetLoading]);
  
  // Skip API availability check (to prevent connection errors in console)
  useEffect(() => {
    // For this implementation, we'll skip the API check and use contracts directly
    safeSetApiAvailable(false);
    
    // You can uncomment the below if you actually have an API endpoint later
    /*
    const checkApiAvailability = async () => {
      if (process.env.REACT_APP_API_GATEWAY_URL) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(`${process.env.REACT_APP_API_GATEWAY_URL}/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.REACT_APP_API_KEY || ''
            },
            signal: controller.signal
          }).catch(() => ({ ok: false }));
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            safeSetApiAvailable(true);
          } else {
            safeSetApiAvailable(false);
          }
        } catch (error) {
          safeSetApiAvailable(false);
        }
      } else {
        safeSetApiAvailable(false);
      }
    };
    
    checkApiAvailability();
    */
  }, [safeSetApiAvailable]);
  
  // Load data when component mounts or contracts change
  useEffect(() => {
    // Create an AbortController for this effect
    const abortController = new AbortController();
    
    // Call fetchDelegationData with the abort signal
    fetchDelegationData(abortController);
    
    // Cleanup function that runs when component unmounts or dependencies change
    return () => {
      // Signal all async operations to abort
      abortController.abort();
      // Mark component as unmounted
      isMounted.current = false;
    };
  }, [fetchDelegationData]);
  
  // Top Delegates list component
  const TopDelegatesList = useMemo(() => {
    if (!delegationData || !delegationData.topDelegates) return null;
    
    return (
      <div className="space-y-1">
        {delegationData.topDelegates.slice(0, 10).map((delegate, index) => (
          <DelegateListItem 
            key={index}
            delegate={delegate}
            index={index}
            formatVotingPower={formatVotingPower}
          />
        ))}
      </div>
    );
  }, [delegationData, formatVotingPower]);
  
  // Voting Power Distribution visualization
  const VotingPowerDistribution = useMemo(() => {
    if (!delegationData || !delegationData.topDelegates || delegationData.topDelegates.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-6">
        <div className="flex items-center text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
          Voting Power Distribution
        </div>
        {delegationData.topDelegates.slice(0, 5).map((delegate, index) => (
          <div key={index} className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                {formatAddress(delegate.address)}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {delegate.percentageFormatted}
              </span>
            </div>
            <ProgressBar 
              value={delegate.percentage * 100} 
              max={100} 
              color={index === 0 ? "primary" : index === 1 ? "info" : "default"}
            />
          </div>
        ))}
        
        {/* Show "others" category */}
        {delegationData.topDelegates.length > 5 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400">
                Others ({delegationData.uniqueDelegatesCount - 5} delegates)
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {formatPercentage(
                  1 - delegationData.topDelegates.slice(0, 5).reduce((sum, d) => sum + d.percentage, 0)
                )}
              </span>
            </div>
            <ProgressBar 
              value={100 - delegationData.topDelegates.slice(0, 5).reduce((sum, d) => sum + (d.percentage * 100), 0)} 
              max={100} 
              color="secondary"
            />
          </div>
        )}
      </div>
    );
  }, [delegationData]);
  
  // Network health metrics
  const NetworkMetrics = useMemo(() => {
    if (!delegationData) return null;
    
    return (
      <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
        <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">
          <Network className="w-4 h-4 inline mr-1" /> Network Health
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Top 5 Delegate Concentration:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {formatPercentage(delegationData.top5Concentration)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">
              Active Delegates:
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {delegationData.uniqueDelegatesCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">
              Active Delegators:
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {delegationData.uniqueDelegatorsCount}
            </span>
          </div>
        </div>
      </div>
    );
  }, [delegationData]);
  
  // Main rendering
  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 text-rose-500" />
            <div>{error}</div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                const abortController = new AbortController();
                fetchDelegationData(abortController);
              }}
              className="px-3 py-1 text-xs bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 rounded hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors"
            >
              <RefreshCw className="w-3 h-3 inline mr-1" />
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400 mb-4"></div>
          <div className="text-slate-500 dark:text-slate-400">Loading delegation data...</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Using consistent blockchain data from {NETWORK_NAME}
          </div>
        </div>
      )}
      
      {/* Main content when data is loaded */}
      {!loading && delegationData && (
        <>
          {/* Global Stats Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox 
                label="Total Delegated" 
                value={`${formatVotingPower(delegationData.totalDelegated)} JST`}
                iconColor="text-indigo-500"
              />
              <StatBox 
                label="% of Supply Delegated" 
                value={formatPercentage(delegationData.percentageDelegated)}
                iconColor="text-indigo-500"
              />
              <StatBox 
                label="Total Delegates" 
                value={delegationData.uniqueDelegatesCount}
                iconColor="text-purple-500"
              />
              <StatBox 
                label="Top 5 Concentration" 
                value={formatPercentage(delegationData.top5Concentration)}
                iconColor="text-blue-500"
              />
            </div>
          </div>

          {/* Main grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Delegation Overview */}
            <DataCard title="Delegation Overview" >
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-6">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Delegation Distribution
                </h4>
                <ProgressBar 
                  value={delegationData.percentageDelegated * 100} 
                  max={100} 
                  color="primary" 
                  height={10}
                />
                <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              {VotingPowerDistribution}
              {NetworkMetrics}
            </DataCard>
            
            {/* Top Delegates */}
            <DataCard title="Top Delegates by Voting Power" >
              {TopDelegatesList}
              
              <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <div>
                  <Users className="w-4 h-4 inline mr-1 text-slate-400" />
                  Total Unique Delegators: {delegationData.uniqueDelegatorsCount}
                </div>
                <div>
                  <Award className="w-4 h-4 inline mr-1 text-slate-400" />
                  Total Unique Delegates: {delegationData.uniqueDelegatesCount}
                </div>
              </div>
            </DataCard>
          </div>
          
          {/* Data quality indicator */}
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              last updated: {formatDate(lastUpdated)}
            </div>
           
            <div>
              {NETWORK_NAME} block #{blockNumber || 'Unknown'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalDelegationComponent;