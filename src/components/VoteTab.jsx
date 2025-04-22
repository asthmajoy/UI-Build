// src/components/VoteTab.jsx - Complete updated version
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ethers } from 'ethers';
import useGovernanceParams from '../hooks/useGovernanceParams';
import { PROPOSAL_TYPES } from '../utils/constants';
import { Clock, Check, X, X as XIcon, Calendar, Users, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PROPOSAL_STATES, VOTE_TYPES, THREAT_LEVELS } from '../utils/constants';
import { formatCountdown } from '../utils/formatters';
import Loader from './Loader';
import blockchainDataCache from '../utils/blockchainDataCache';
import { useWeb3 } from '../contexts/Web3Context';
import { useBlockchainData } from '../contexts/BlockchainDataContext';

// Component to handle async vote checking in the modal
const ModalVoteStatus = ({ proposalId, hasUserVoted, getUserVoteType, getVoteTypeText }) => {
  const { isConnected, account } = useWeb3();
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [userVoteType, setUserVoteType] = useState(null);
  const [checkingVote, setCheckingVote] = useState(true);

  const threatLevelTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const votingPowersLoadingRef = useRef(false);
  const previousProposalsRef = useRef([]);
  const loadTimeoutRef = useRef(null);
  
  useEffect(() => {
    let isMounted = true;
    const checkUserVote = async () => {
      try {
        if (!isMounted) return;
        setCheckingVote(true);
        
        // Try to get from cache first
        const cacheKey = `vote-check-${account}-${proposalId}`;
        const cachedResult = blockchainDataCache.get(cacheKey);
        
        if (cachedResult) {
          setUserHasVoted(cachedResult.hasVoted);
          if (cachedResult.hasVoted) {
            setUserVoteType(cachedResult.voteType);
          }
          setCheckingVote(false);
          return;
        }
        
        // Not in cache, need to check
        const hasVoted = await hasUserVoted(proposalId);
        if (!isMounted) return;
        
        setUserHasVoted(hasVoted);
        
        if (hasVoted) {
          const voteType = await getUserVoteType(proposalId);
          if (!isMounted) return;
          setUserVoteType(voteType);
          
          // Cache the result for future use
          blockchainDataCache.set(
            cacheKey, 
            { hasVoted, voteType }, 
            3600 // Cache for 1 hour
          );
        }
      } catch (err) {
        console.error(`Error checking modal vote for proposal ${proposalId}:`, err);
      } finally {
        if (isMounted) {
          setCheckingVote(false);
        }
      }
    };
    
    if (isConnected && account) {
      checkUserVote();
    } else {
      setCheckingVote(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [proposalId, isConnected, account, hasUserVoted, getUserVoteType]);

  if (checkingVote) {
    return (
	
      <div className="mt-5 text-center text-sm flex items-center justify-center">
        <Loader size="small" className="mr-2" />
        <span>Checking your vote...</span>
      </div>
	  
    );
  }
  
  if (!userHasVoted) {
    return null;
  }
  
  // Get color based on vote type
  let colorClass = "text-gray-600 dark:text-gray-400";
  if (userVoteType === 1) { // FOR
    colorClass = "text-green-600 dark:text-green-400";
  } else if (userVoteType === 0) { // AGAINST
    colorClass = "text-red-600 dark:text-red-400";
  }
  
  return (
    <div className="mt-5 text-center text-sm">
      <span className="text-gray-600 dark:text-gray-400">Your vote:</span> 
      <span className={`ml-1 font-medium ${colorClass}`}>
        {getVoteTypeText(userVoteType)}
      </span>
    </div>
  );
};

// Function to parse proposal descriptions and extract HTML content
function parseProposalDescription(rawDescription) {
  if (!rawDescription) {
    return { title: '', description: '', descriptionHtml: null };
  }
  
  // Check if the description contains HTML content
  const htmlMarkerIndex = rawDescription.indexOf('|||HTML:');
  
  if (htmlMarkerIndex !== -1) {
    // Extract HTML content
    const htmlContent = rawDescription.substring(htmlMarkerIndex + 8);
    
    // Extract the plain text portion
    const plainTextPortion = rawDescription.substring(0, htmlMarkerIndex).trim();
    
    // The title is typically the first line
    const firstLineBreak = plainTextPortion.indexOf('\n');
    const title = firstLineBreak !== -1 
      ? plainTextPortion.substring(0, firstLineBreak).trim() 
      : plainTextPortion.trim();
    
    // The description is everything after the first line, but before the HTML marker
    const description = firstLineBreak !== -1 
      ? plainTextPortion.substring(firstLineBreak).trim() 
      : '';
      
    return { title, description, descriptionHtml: htmlContent };
  }
  
  // If no HTML marker is found, handle it as plain text only
  const lines = rawDescription.split('\n');
  const title = lines[0] || '';
  const description = lines.length > 1 ? lines.slice(1).join('\n').trim() : '';
  
  return { title, description, descriptionHtml: null };
}

// Enhanced function to safely truncate HTML content while preserving formatting
function truncateHtml(html, maxLength = 200) {
  if (!html) return '';
  
  // Use a simpler truncation method for performance
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get the text content for length checking
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  // If the text is already short enough, return the original HTML
  if (textContent.length <= maxLength) {
    return html;
  }
  
  // Simple truncation that preserves the HTML structure
  let truncated = '';
  let charCount = 0;
  let done = false;
  
  function truncateNode(node) {
    if (done) return;
    
    if (node.nodeType === 3) { // Text node
      const remainingChars = maxLength - charCount;
      if (remainingChars <= 0) {
        done = true;
        return;
      }
      
      const text = node.textContent;
      if (charCount + text.length <= maxLength) {
        truncated += text;
        charCount += text.length;
      } else {
        truncated += text.substr(0, remainingChars) + '...';
        done = true;
      }
    } else if (node.nodeType === 1) { // Element node
      const tag = node.tagName.toLowerCase();
      
      // Skip irrelevant tags
      if (['script', 'style', 'iframe', 'object'].includes(tag)) {
        return;
      }
      
      truncated += `<${tag}>`;
      
      // Process children
      for (let i = 0; i < node.childNodes.length && !done; i++) {
        truncateNode(node.childNodes[i]);
      }
      
      truncated += `</${tag}>`;
    }
  }
  
  // Process top-level nodes
  for (let i = 0; i < tempDiv.childNodes.length && !done; i++) {
    truncateNode(tempDiv.childNodes[i]);
  }
  
  return truncated;
}

// Memory-optimized VoteData component
const VoteData = ({ proposalId, showDetailedInfo = false }) => {
  const { contracts, contractsReady } = useWeb3();
  const { getProposalVoteTotals } = useBlockchainData();
  
  const [voteData, setVoteData] = useState({
    yesVotes: 0,
    noVotes: 0,
    abstainVotes: 0,
    yesVoters: 0,
    noVoters: 0,
    abstainVoters: 0,
    totalVoters: 0,
    yesVotingPower: 0,
    noVotingPower: 0,
    abstainVotingPower: 0,
    totalVotingPower: 0,
    yesPercentage: 0,
    noPercentage: 0,
    abstainPercentage: 0,
    loading: true
  });
  
  // Use refs to track mounted state and timers
  const mountedRef = useRef(true);
  const timerRef = useRef(null);
  const lastRefreshRef = useRef(0);
  
  // Format token values for display
  const formatTokenAmount = useCallback((value) => {
    if (value === undefined || value === null) return '0';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0';
    
    if (numValue === 0) return '0';
    
    // Use more decimals for smaller values
    if (numValue < 0.01) return numValue.toFixed(5);
    if (numValue < 1) return numValue.toFixed(4);
    if (numValue < 10) return numValue.toFixed(3);
    if (numValue < 1000) return numValue.toFixed(2);
    
    return numValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, []);

  // Format token values to 5 decimal places
  const formatToFiveDecimals = useCallback((value) => {
    if (value === undefined || value === null) return "0.00000";
    
    // Handle string inputs
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // If it's NaN or not a number, return "0.00000"
    if (isNaN(numValue)) return "0.00000";
    
    // Return with exactly 5 decimal places
    return numValue.toFixed(5);
  }, []);
  
  // Check if a proposal is active
  const isProposalActive = useCallback(async (proposalId) => {
    try {
      if (!contractsReady || !contracts.governance) return false;
      
      const state = await contracts.governance.getProposalState(proposalId);
      return Number(state) === PROPOSAL_STATES.ACTIVE;
    } catch (err) {
      console.error(`Error checking if proposal ${proposalId} is active:`, err);
      return false;
    }
  }, [contractsReady, contracts.governance]);

  // Direct query method to always get fresh vote data from blockchain
  const fetchVoteData = useCallback(async (forceRefresh = false) => {
    if (!proposalId || !contractsReady || !contracts.governance) return;
    
    if (mountedRef.current) {
      setVoteData(prev => ({ ...prev, loading: true }));
    }
    
    try {
      console.log(`Fetching fresh vote data for proposal #${proposalId}`);
      lastRefreshRef.current = Date.now();
      
      // IMPORTANT: Use direct contract call, bypassing any caching mechanism
      // This ensures we always get fresh data from the blockchain
      const voteTotals = await contracts.governance.getProposalVoteTotals(proposalId);
      
      if (!mountedRef.current) return; // Stop if unmounted
      
      // Unpack and process vote data from contract
      const [forVotes, againstVotes, abstainVotes, totalVotingPower, voterCount] = voteTotals;
      
      // Format the values
      const formattedYesVotes = ethers.utils.formatEther(forVotes);
      const formattedNoVotes = ethers.utils.formatEther(againstVotes);
      const formattedAbstainVotes = ethers.utils.formatEther(abstainVotes);
      const formattedTotalVotingPower = ethers.utils.formatEther(totalVotingPower);
      const totalVotersCount = voterCount.toNumber();
      
      // Calculate percentages
      let yesPercentage = 0;
      let noPercentage = 0;
      let abstainPercentage = 0;
      
      if (!totalVotingPower.isZero()) {
        yesPercentage = parseFloat(forVotes.mul(10000).div(totalVotingPower)) / 100;
        noPercentage = parseFloat(againstVotes.mul(10000).div(totalVotingPower)) / 100;
        abstainPercentage = parseFloat(abstainVotes.mul(10000).div(totalVotingPower)) / 100;
      }
      
      // Now we need to properly distribute voter counts
      let yesVoters = 0;
      let noVoters = 0;
      let abstainVoters = 0;
      
      if (totalVotersCount > 0) {
        // Distribute based on relative voting power
        const totalVotes = parseFloat(formattedYesVotes) + 
                          parseFloat(formattedNoVotes) + 
                          parseFloat(formattedAbstainVotes);
                        
        // If we have votes, distribute the voters counts proportionally
        if (totalVotes > 0) {
          const yesRatio = parseFloat(formattedYesVotes) / totalVotes;
          const noRatio = parseFloat(formattedNoVotes) / totalVotes;
          const abstainRatio = parseFloat(formattedAbstainVotes) / totalVotes;
          
          // Distribute voters proportionally, rounding to nearest integer
          yesVoters = Math.round(yesRatio * totalVotersCount);
          noVoters = Math.round(noRatio * totalVotersCount);
          abstainVoters = Math.round(abstainRatio * totalVotersCount);
          
          // Make sure the sum equals the total
          const sum = yesVoters + noVoters + abstainVoters;
          if (sum !== totalVotersCount) {
            // Adjust the largest number to make it match
            if (yesVoters >= noVoters && yesVoters >= abstainVoters) {
              yesVoters += (totalVotersCount - sum);
            } else if (noVoters >= yesVoters && noVoters >= abstainVoters) {
              noVoters += (totalVotersCount - sum);
            } else {
              abstainVoters += (totalVotersCount - sum);
            }
          }
        }
        // If no votes but we have voters, make sure each type with non-zero power has at least 1 voter
        else {
          if (parseFloat(formattedYesVotes) > 0) yesVoters = 1;
          if (parseFloat(formattedNoVotes) > 0) noVoters = 1;
          if (parseFloat(formattedAbstainVotes) > 0) abstainVoters = 1;
        }
      }
      
      // Set the vote data with complete information
      if (mountedRef.current) {
        setVoteData({
          yesVotes: formattedYesVotes,
          noVotes: formattedNoVotes,
          abstainVotes: formattedAbstainVotes,
          totalVotingPower: formattedTotalVotingPower,
          totalVoters: totalVotersCount,
          yesVoters,
          noVoters,
          abstainVoters,
          yesPercentage,
          noPercentage,
          abstainPercentage,
          yesVotingPower: parseFloat(formattedYesVotes),
          noVotingPower: parseFloat(formattedNoVotes),
          abstainVotingPower: parseFloat(formattedAbstainVotes),
          loading: false,
          refreshTimestamp: Date.now()
        });
      }
    } catch (error) {
      console.error(`Error fetching vote data for proposal ${proposalId}:`, error);
      
      // Try fallback method using BlockchainDataContext
      try {
        console.log("Using fallback method from BlockchainDataContext");
        const contextData = await getProposalVoteTotals(proposalId);
        
        if (contextData && mountedRef.current) {
          // Convert BlockchainDataContext data to our format
          setVoteData({
            yesVotes: contextData.yesVotes || "0",
            noVotes: contextData.noVotes || "0",
            abstainVotes: contextData.abstainVotes || "0",
            totalVotingPower: contextData.totalVotingPower || "0",
            totalVoters: contextData.totalVoters || 0,
            yesVoters: contextData.totalVoters ? Math.round((contextData.yesPercentage / 100) * contextData.totalVoters) : 0,
            noVoters: contextData.totalVoters ? Math.round((contextData.noPercentage / 100) * contextData.totalVoters) : 0,
            abstainVoters: contextData.totalVoters ? Math.round((contextData.abstainPercentage / 100) * contextData.totalVoters) : 0,
            yesPercentage: contextData.yesPercentage || 0,
            noPercentage: contextData.noPercentage || 0,
            abstainPercentage: contextData.abstainPercentage || 0,
            yesVotingPower: parseFloat(contextData.yesVotes || "0"),
            noVotingPower: parseFloat(contextData.noVotes || "0"),
            abstainVotingPower: parseFloat(contextData.abstainVotes || "0"),
            loading: false,
            refreshTimestamp: Date.now()
          });
        }
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
        
        if (mountedRef.current) {
          setVoteData(prev => ({
            ...prev,
            loading: false
          }));
        }
      }
    }
  }, [proposalId, contractsReady, contracts, getProposalVoteTotals]);

 
  
    // Set up event listener for global refresh
    useEffect(() => {
      const handleGlobalRefresh = () => {
        console.log(`VoteData for proposal ${proposalId} received global refresh event`);
        fetchVoteData(true);
      };
      
      window.addEventListener('app:refresh', handleGlobalRefresh);
      
      return () => {
        window.removeEventListener('app:refresh', handleGlobalRefresh);
      };
    }, [proposalId, fetchVoteData]);
  
    // Initial data fetch and polling
    useEffect(() => {
      mountedRef.current = true;
      
      fetchVoteData();
      
      // Set up polling with appropriate interval based on proposal state
      const setupPolling = async () => {
        // Clear any existing timer first to prevent duplicates
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        const active = await isProposalActive(proposalId);
        
        // Only poll active proposals, with a much longer interval
        if (active && mountedRef.current) {
          timerRef.current = setInterval(fetchVoteData, 30000); // Poll every 30 seconds
        }
      };
      
      setupPolling();
      
      // Clean up function
      return () => {
        mountedRef.current = false;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [proposalId, fetchVoteData, isProposalActive]);
  
    if (voteData.loading) {
      return (

        <div className="flex justify-center items-center py-4">
          <Loader size="small" className="mr-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading vote data...</span>
        </div>
      );
    }
    
    // Basic vote data display
    if (!showDetailedInfo) {
      return (
        <div>
          {/* Vote percentages */}
          <div className="grid grid-cols-3 gap-4 text-sm sm:text-base mb-3">
            <div className="text-green-600 dark:text-green-400 font-medium">Yes: {voteData.yesPercentage.toFixed(1)}%</div>
            <div className="text-red-600 dark:text-red-400 font-medium text-center">No: {voteData.noPercentage.toFixed(1)}%</div>
            <div className="text-gray-600 dark:text-gray-400 font-medium text-right">Abstain: {voteData.abstainPercentage.toFixed(1)}%</div>
          </div>
          
          {/* Vote bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="flex h-full">
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${voteData.yesPercentage}%` }}
              ></div>
              <div 
                className="bg-red-500 h-full" 
                style={{ width: `${voteData.noPercentage}%` }}
              ></div>
              <div 
                className="bg-gray-400 dark:bg-gray-500 h-full" 
                style={{ width: `${voteData.abstainPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Vote counts */}
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
            <div>{voteData.yesVoters || 0} voter{(voteData.yesVoters || 0) !== 1 && 's'}</div>
            <div className="text-center">{voteData.noVoters || 0} voter{(voteData.noVoters || 0) !== 1 && 's'}</div>
            <div className="text-right">{voteData.abstainVoters || 0} voter{(voteData.abstainVoters || 0) !== 1 && 's'}</div>
          </div>
          
          {/* Voting power section */}
          <div className="mt-5 border-t dark:border-gray-700 pt-4 text-sm text-gray-600 dark:text-gray-400">
            {/* Display voting power values */}
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <div>{formatToFiveDecimals(voteData.yesVotingPower)} JST</div>
              <div className="text-center">{formatToFiveDecimals(voteData.noVotingPower)} JST</div>
              <div className="text-right">{formatToFiveDecimals(voteData.abstainVotingPower)} JST</div>
            </div>
          </div>
          
          {/* Total voters count */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-right">
            Total voters: {voteData.totalVoters || 0}
          </div>
        </div>
      );
    }
  
    // Detailed version with voting power and totals
    return (
      <div>
        {/* Vote counts */}
        <h5 className="text-sm font-medium mb-3 dark:text-gray-300">Vote Counts</h5>
        
        <div className="grid grid-cols-3 gap-4 text-center mb-3">
          <div>
            <div className="text-green-600 dark:text-green-400 font-medium">
              {voteData.yesVoters || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Yes Votes</div>
          </div>
          <div>
            <div className="text-red-600 dark:text-red-400 font-medium">
              {voteData.noVoters || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">No Votes</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400 font-medium">
              {voteData.abstainVoters || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Abstain</div>
          </div>
        </div>
        
        {/* Percentage labels */}
        <div className="grid grid-cols-3 gap-4 text-center mb-3 text-xs text-gray-500 dark:text-gray-400">
          <div>Yes: {voteData.yesPercentage.toFixed(1)}%</div>
          <div>No: {voteData.noPercentage.toFixed(1)}%</div>
          <div>Abstain: {voteData.abstainPercentage.toFixed(1)}%</div>
        </div>
        
        {/* Vote bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="flex h-full">
            <div 
              className="bg-green-500 h-full" 
              style={{ width: `${voteData.yesPercentage}%` }}
            ></div>
            <div 
              className="bg-red-500 h-full" 
              style={{ width: `${voteData.noPercentage}%` }}
            ></div>
            <div 
              className="bg-gray-400 dark:bg-gray-500 h-full" 
              style={{ width: `${voteData.abstainPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Total voters count */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3 mb-5">
          Total voters: {voteData.totalVoters || 0}
        </div>
        
        {/* Voting power heading */}
        <h5 className="text-sm font-medium mt-5 mb-3 dark:text-gray-300">Voting Power Distribution</h5>
        
        {/* Voting power display */}
        <div className="grid grid-cols-3 gap-4 text-center mb-3">
          <div>
            <div className="text-green-600 dark:text-green-400 font-medium">{formatToFiveDecimals(voteData.yesVotingPower)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Yes JST</div>
          </div>
          <div>
            <div className="text-red-600 dark:text-red-400 font-medium">{formatToFiveDecimals(voteData.noVotingPower)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">No JST</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400 font-medium">{formatToFiveDecimals(voteData.abstainVotingPower)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Abstain JST</div>
          </div>
        </div>
        
        {/* Total voting power */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
          Total voting power: {formatTokenAmount(voteData.totalVotingPower || 0)} JST
        </div>
      </div>
    );
  };

// Enhanced QuorumProgress component with consistent theme color

const QuorumProgress = ({ proposalId, quorum, showWarningIfNeeded = false, proposalState }) => {
  const { contracts, contractsReady } = useWeb3();
  const [progress, setProgress] = useState(0);
  const [voteCount, setVoteCount] = useState("0");
  const [loading, setLoading] = useState(true);
  // Add state to track if warning should be visible (for delayed display)
  const [warningVisible, setWarningVisible] = useState(false);
  
  // Add a ref to track the last refresh timestamp
  const lastRefreshRef = useRef(0);
  
  // Reference to track if component is mounted
  const mountedRef = useRef(true);
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  
  // Define formatNumberDisplay locally within the component
  const formatNumberDisplay = useCallback((value) => {
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
  }, []);
  
  const quorumValue = useMemo(() => {
    return ethers.utils.parseEther(quorum?.toString() || "0");
  }, [quorum]);
  
  // Check if a proposal is active
  const isProposalActive = useCallback(async (proposalId) => {
    try {
      if (!contractsReady || !contracts.governance) return false;
      
      const state = await contracts.governance.getProposalState(proposalId);
      return Number(state) === PROPOSAL_STATES.ACTIVE;
    } catch (err) {
      console.error(`Error checking if proposal ${proposalId} is active:`, err);
      return false;
    }
  }, [contractsReady, contracts.governance]);
  
  // Fetch quorum data directly from the contract WITHOUT caching
  // This ensures fresh data every time
  const fetchQuorumData = useCallback(async (forceRefresh = false) => {
    if (!contractsReady || !contracts.governance || !proposalId) return;
    
    try {
      if (mountedRef.current) {
        setLoading(true);
      }
      
      // Directly call the contract's getProposalVoteTotals function
      // without relying on any caching mechanism
      const [forVotes, againstVotes, abstainVotes] = 
        await contracts.governance.getProposalVoteTotals(proposalId);
      
      // Calculate total votes
      const totalVotes = forVotes.add(againstVotes).add(abstainVotes);
      
      // Convert to readable format for display
      const totalVotesFormatted = ethers.utils.formatEther(totalVotes);
      
      // Calculate progress
      const localQuorumValue = quorumValue.isZero() ? 
        ethers.utils.parseEther('1') : quorumValue; // prevent division by zero
      
      // Calculate percentage with BigNumber to avoid float precision issues
      let progressPercentage = totalVotes.mul(100).div(localQuorumValue);
      if (progressPercentage.gt(100)) {
        progressPercentage = ethers.BigNumber.from(100);
      }
      
      const progressValue = progressPercentage.toNumber();
      
      // Save the refresh timestamp
      lastRefreshRef.current = Date.now();
      
      if (mountedRef.current) {
        setProgress(progressValue);
        setVoteCount(totalVotesFormatted);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching quorum data:", err);
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [contractsReady, contracts.governance, proposalId, quorumValue]);
  
  useEffect(() => {
    if (mountedRef.current) {
      fetchQuorumData(true); // Force refresh when refreshKey changes
    }
  }, [fetchQuorumData, /* Add refreshKey here if passed as prop */]);// Enhanced QuorumProgress component with consistent theme color and quorum warning
  
  // Listen for global refresh events
  useEffect(() => {
    // Create the event listener
    const handleRefreshEvent = () => {
      console.log(`QuorumProgress ${proposalId} received refresh event`);
      fetchQuorumData(true); // Force refresh
    };
    
    // Register the event listener
    window.addEventListener('app:refresh', handleRefreshEvent);
    
    // Clean up
    return () => {
      window.removeEventListener('app:refresh', handleRefreshEvent);
    };
  }, [proposalId, fetchQuorumData]);
  
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchQuorumData();
    
    // Set up polling with appropriate frequency
    const setupPolling = async () => {
      // Clear any existing timer first to prevent duplicates
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      const isActive = await isProposalActive(proposalId);
      
      // Only poll active proposals, with a reduced frequency
      if (isActive && mountedRef.current) {
        timerRef.current = setInterval(fetchQuorumData, 30000); // 30 seconds polling - matching VoteData
      }
    };
    
    setupPolling();
    
    // Clean up function
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [proposalId, fetchQuorumData, isProposalActive]);
  
  // Fix for the delay effect which had an error in the condition
  useEffect(() => {
    // Only start the delay timer when loaded and conditions for showing the warning are met
    if (!loading && !warningVisible) {
      const isActive = proposalState === PROPOSAL_STATES.ACTIVE;
      const shouldShowWarning = !isActive && progress < 100;
      
      if (shouldShowWarning && showWarningIfNeeded) {
        // Clear any existing timer first
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
        }
        
        // Set a new timer to show the warning after a delay
        warningTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setWarningVisible(true);
          }
        }, 800); // 800ms delay - enough time for other UI elements to render
      }
    }
    
    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [loading, progress, proposalState, showWarningIfNeeded, PROPOSAL_STATES]);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, []);
  // Determine if we should show the quorum not met warning
  const showQuorumWarning = useMemo(() => {
    if (!showWarningIfNeeded) return false;
    
    // Show warning for any non-active proposal that didn't meet quorum
    // Including defeated proposals, as they might have been defeated due to insufficient quorum
    const isActive = proposalState === PROPOSAL_STATES.ACTIVE;
    
    return !isActive && progress < 100 && warningVisible;
  }, [showWarningIfNeeded, proposalState, progress, PROPOSAL_STATES, warningVisible]);
  
  return (
    <div>
      {/* Quorum progress bar with consistent theme color */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300 ease-in-out bg-indigo-500 dark:bg-indigo-600"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Vote count display */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
        {loading ? (
          <span className="flex items-center justify-end">
            <Loader size="tiny" className="mr-1" />
            Loading...
          </span>
        ) : (
          <span>
            {formatNumberDisplay(voteCount)} / {formatNumberDisplay(quorum)} JST ({progress}%)
            {progress >= 100 && ' ✓ Quorum reached'}
          </span>
        )}
      </div>
      
      {/* Quorum warning message - centered with width fitting content */}
      {showQuorumWarning && (
        <div className="mt-2 flex justify-center">
          <div className="py-1.5 px-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded text-xs inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-amber-700 dark:text-amber-400">
              Quorum not met: {formatNumberDisplay(voteCount)}/{formatNumberDisplay(quorum)} JST required
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Proposal Card Component - Modified to improve vote UI behavior
const ProposalCard = ({ 
  proposal, 
  votingPower, 
  castVote, 
  formatToFiveDecimals, 
  govParams, 
  hasUserVoted,
  getUserVoteType,
  getVoteTypeText,
  VOTE_TYPES,
  PROPOSAL_STATES,
  getProposalStateInfo,
  renderProposalDescription,
  setSelectedProposal,
  setShowModal,
  voting
}) => {
  const { isConnected, account } = useWeb3();
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [userVoteType, setUserVoteType] = useState(null);
  const [checkingVote, setCheckingVote] = useState(true);
  
  const stateInfo = getProposalStateInfo(proposal);
  
  // Use a ref to track if component is mounted
  const mountedRef = useRef(true);
  
  // Helper function to handle vote and update UI immediately
  const handleVote = async (voteType) => {
    try {
      // Send the vote transaction
      await castVote(proposal.id, voteType);
      
      // Update local state immediately
      setUserHasVoted(true);
      setUserVoteType(voteType);
      
      // Update cache
      const cacheKey = `user-vote-${account}-${proposal.id}`;
      blockchainDataCache.set(cacheKey, { 
        hasVoted: true, 
        voteType 
      }, 3600); // Cache for 1 hour
      
      // Trigger a global refresh event
      if (window && window.dispatchEvent) {
        console.log("Dispatching vote cast refresh event");
        const refreshEvent = new CustomEvent('app:refresh', { 
          detail: { timestamp: Date.now(), proposalId: proposal.id }
        });
        window.dispatchEvent(refreshEvent);
      }
    } catch (err) {
      console.error("Error casting vote:", err);
    }
  };
  
  // Check if the user has voted on this proposal with caching
  useEffect(() => {
    mountedRef.current = true;
    
    const checkUserVote = async () => {
      try {
        if (!mountedRef.current) return;
        
        setCheckingVote(true);
        
        // Try to get from cache first
        const cacheKey = `user-vote-${account}-${proposal.id}`;
        const cachedResult = blockchainDataCache.get(cacheKey);
        
        if (cachedResult) {
          setUserHasVoted(cachedResult.hasVoted);
          if (cachedResult.hasVoted) {
            setUserVoteType(cachedResult.voteType);
          }
          setCheckingVote(false);
          return;
        }
        
        // Not in cache, check from contract
        const hasVoted = await hasUserVoted(proposal.id);
        
        if (!mountedRef.current) return;
        
        setUserHasVoted(hasVoted);
        
        if (hasVoted) {
          const voteType = await getUserVoteType(proposal.id);
          
          if (!mountedRef.current) return;
          
          setUserVoteType(voteType);
          
          // Cache the result to prevent future blockchain queries
          // Cache for a longer time since votes can't be changed
          blockchainDataCache.set(cacheKey, { 
            hasVoted: true, 
            voteType 
          }, 3600); // Cache for 1 hour
        } else {
          // Cache negative result for a shorter time
          blockchainDataCache.set(cacheKey, { 
            hasVoted: false, 
            voteType: null 
          }, 300); // 5 minutes
        }
      } catch (err) {
        console.error(`Error checking vote for proposal ${proposal.id}:`, err);
      } finally {
        if (mountedRef.current) {
          setCheckingVote(false);
        }
      }
    };
    
    if (isConnected && account) {
      checkUserVote();
    } else {
      setCheckingVote(false);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [proposal.id, isConnected, account, hasUserVoted, getUserVoteType]);
  
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-xl font-medium mb-1 dark:text-white">{proposal.title}</h3>
          <p className="flex text-sm text-gray-500 dark:text-gray-400">Proposal #{proposal.id}</p>
        </div>
        <span className={`text-sm  ${stateInfo.color} px-3 py-1 rounded-full flex items-center`}>
          {proposal.state === PROPOSAL_STATES.ACTIVE ? (
            <>
              <Clock className="w-4 h-4 mr-1" />
              {formatCountdown(proposal.deadline)}
            </>
          ) : (
            stateInfo.label
          )}
        </span>
      </div>
      
      {/* Render proposal description with HTML support */}
      {renderProposalDescription(proposal, true, 200)}
      
      {/* Vote data display using the optimized VoteData component */}
      <div className="mb-6">
        <VoteData proposalId={proposal.id} />
      </div>
      
      {/* Always show quorum progress regardless of vote status */}
      {govParams.quorum > 0 && (
        <div className="mt-3 mb-5">
          <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
            <span className="font-medium">Quorum Progress</span>
          </div>
          
          {/* Enhanced QuorumProgress component */}
          <QuorumProgress proposalId={proposal.id} quorum={govParams.quorum} />
        </div>
      )}
      
      {checkingVote ? (
        <div className="flex items-center justify-center text-base text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Loader size="small" className="mr-2" />
          <span>Checking your vote status...</span>
        </div>
      ) : userHasVoted ? (
        <div className="flex items-center text-base text-gray-700 dark:text-gray-300 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="mr-2">You voted:</span>
          <span className="px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-medium">
            {getVoteTypeText(userVoteType)}
          </span>
        </div>
      ) : proposal.state === PROPOSAL_STATES.ACTIVE && (
        <div>
           <div className="mb-3 text-base text-gray-700 dark:text-gray-300 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
             Your voting power: <span className="font-medium">{formatToFiveDecimals(votingPower)} JST</span>
           </div>
           
           {/* Warning message if voting power appears low, but still allow voting */}
           {parseFloat(votingPower) <= 0 && (
             <div className="text-amber-700 dark:text-amber-400 text-sm border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-4">
               <span className="font-medium">Note:</span> Your vote may fail. It looks like you didn't hold any unlocked JST at the proposal's snapshot.
             </div>
           )}
           
           {/* Vote buttons - now more responsive with enhanced gradients */}
           <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6">
             <button 
               className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-1.5 sm:py-1.5 w-full rounded-lg text-sm shadow-sm hover:shadow-md dark:shadow-green-700/30 text-white py-3 sm:py-2 px-4 sm:px-2 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:from-emerald-300 hover:via-emerald-400 hover:to-emerald-500 dark:hover:from-emerald-400 dark:hover:via-emerald-500 dark:hover:to-emerald-600 transform hover:-translate-y-1"
               onClick={() => handleVote(VOTE_TYPES.FOR)}
               disabled={voting.processing}
             >
               <Check className="w-4 h-4 mr-2 flex-shrink-0" />
               <span className="truncate">Yes</span>
             </button>
             <button 
               className="w-full bg-gradient-to-r from-rose-500 via-rose-550 to-rose-600 dark:from-rose-600 dark:via-rose-650 dark:to-rose-700 text-white py-3 sm:py-2 px-4 sm:px-2 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:from-rose-400 hover:via-rose-600 hover:to-rose-600 dark:hover:from-rose-400 dark:hover:via-rose-500 dark:hover:to-rose-600 transform hover:-translate-y-1"
               onClick={() => handleVote(VOTE_TYPES.AGAINST)}
               disabled={voting.processing}
             >
               <X className="w-4 h-4 mr-2 flex-shrink-0" />
               <span className="truncate">No</span>
             </button>
             <button 
               className="w-full bg-gradient-to-r from-slate-500 via-slate-550 to-slate-600 dark:from-slate-600 dark:via-slate-650 dark:to-slate-700 text-white py-3 sm:py-2 px-4 sm:px-2 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:from-slate-300 hover:via-slate-400 hover:to-slate-500 dark:hover:from-slate-400 dark:hover:via-slate-500 dark:hover:to-slate-600 transform hover:-translate-y-1"
               onClick={() => handleVote(VOTE_TYPES.ABSTAIN)}
               disabled={voting.processing}
             >
               <span className="truncate">Abstain</span>
             </button>
           </div>
        </div>
     )}
   
   {/* View Full Details button - enhanced for mobile */}
   <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6 text-center">
      <button 
        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium px-3 py-1.5 border border-indigo-300 dark:border-indigo-600 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
        onClick={() => {
          setSelectedProposal(proposal);
          setShowModal(true);
        }}
      >
        View Full Details
      </button>
    </div>
    </div>
  );
};

// Main VoteTab component with performance optimizations
const VoteTab = ({ 
  proposals, 
  castVote, 
  hasVoted, 
  getVotingPower, 
  voting, 
  account,
  refreshKey,  // Added refreshKey prop
  jstBalance,  // Added jstBalance prop from JustDAO
  actualVotingPower // Added actualVotingPower prop from JustDAO
}) => {
  const { contracts, contractsReady, isConnected } = useWeb3();
  
  const [voteFilter, setVoteFilter] = useState('active');
  const [votingPowers, setVotingPowers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Replace govParams state with the hook
  const govParams = useGovernanceParams();
  
  // Track locally which proposals the user has voted on and how
  const [votedProposals, setVotedProposals] = useState({});
  
  // Track proposals that the user has voted on (separate from vote types)
  const [userVotedProposalIds, setUserVotedProposalIds] = useState(new Set());
  
  // Add state for tracking the current threat level display
  const [currentThreatLevel, setCurrentThreatLevel] = useState(THREAT_LEVELS.LOW);
  const [threatLevelDelays, setThreatLevelDelays] = useState({});
  const [autoScroll, setAutoScroll] = useState(true);
  
  
  // Use refs to track timers and mounted state
  const threatLevelTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const votingPowersLoadingRef = useRef(false);
  
  // Function to cycle through threat levels - using useCallback
  const cycleThreatLevel = useCallback((direction) => {
    setCurrentThreatLevel(prevLevel => {
      const levels = Object.values(THREAT_LEVELS);
      const currentIndex = levels.indexOf(prevLevel);
      
      if (direction === 'next') {
        return levels[(currentIndex + 1) % levels.length];
      } else {
        return levels[(currentIndex - 1 + levels.length) % levels.length];
      }
    });
  }, []);
  
  // Get threat level name from value - memoized
  const getThreatLevelName = useCallback((level) => {
    const keys = Object.keys(THREAT_LEVELS);
    const values = Object.values(THREAT_LEVELS);
    const index = values.indexOf(level);
    return keys[index];
  }, []);
  
  // Fetch threat level delays from the contract - with caching
  useEffect(() => {
    mountedRef.current = true;
    
    const fetchThreatLevelDelays = async () => {
      if (!contractsReady || !contracts.governance || !contracts.timelock) return;
      
      // Try to get from cache first
      const cacheKey = 'threat-level-delays';
      const cachedDelays = blockchainDataCache.get(cacheKey);
      
      if (cachedDelays && mountedRef.current) {
        setThreatLevelDelays(cachedDelays);
        return;
      }
      
      try {
        const delays = {};
        
        // Fetch delays for each threat level
        for (const [name, level] of Object.entries(THREAT_LEVELS)) {
          try {
            const delay = await contracts.timelock.getDelayForThreatLevel(level);
            delays[level] = delay ? delay.toNumber() : 0;
          } catch (error) {
            console.warn(`Couldn't fetch delay for threat level ${name}:`, error);
          }
        }
        
        // Cache the result - this data rarely changes
        blockchainDataCache.set(cacheKey, delays, 3600); // 1 hour cache
        
        if (mountedRef.current) {
          setThreatLevelDelays(delays);
        }
      } catch (error) {
        console.error("Error fetching threat level delays:", error);
      }
    };
    
    fetchThreatLevelDelays();
    
    return () => {
      mountedRef.current = false;
    };
  }, [contracts, contractsReady]);

  // Modified fetchVotingPowers to use actualVotingPower when available
  const fetchVotingPowers = useCallback(async () => {
    if (!getVotingPower || !proposals.length || !account || votingPowersLoadingRef.current) {
      return;
    }
    
    try {
      votingPowersLoadingRef.current = true;
      
      if (mountedRef.current) {
        setLoading(true);
      }
      
      // Use a local copy of the current state to avoid dependency
      const currentPowers = {};
      const newPowers = {};
      
      // If we have actualVotingPower passed from JustDAO, use it for all proposals
      if (actualVotingPower && parseFloat(actualVotingPower) > 0) {
        // Create a mapping of proposal IDs to the actual voting power
        const powerMap = {};
        proposals.forEach(proposal => {
          powerMap[proposal.id] = actualVotingPower;
        });
        
        if (mountedRef.current) {
          setVotingPowers(prev => ({
            ...prev,
            ...powerMap
          }));
          setLoading(false);
        }
        
        votingPowersLoadingRef.current = false;
        return;
      }
      
      // Check which proposals need their voting power fetched
      const proposalsToFetch = proposals.filter(proposal => {
        // Try to get from cache first
        const cacheKey = `votingPower-${account}-${proposal.snapshotId || "unknown"}`;
        const cachedPower = blockchainDataCache.get(cacheKey);
        
        if (cachedPower !== null) {
          currentPowers[proposal.id] = cachedPower;
          return false;
        }
        
        return true;
      });
      
      // Process proposals in smaller batches
      const batchSize = 3;
      
      for (let i = 0; i < proposalsToFetch.length; i += batchSize) {
        if (!mountedRef.current) break;
        
        const batch = proposalsToFetch.slice(i, i + batchSize);
        
        // Process each proposal in the batch
        const batchResults = await Promise.all(
          batch.map(async (proposal) => {
            try {
              // Ensure we have a valid snapshot ID before attempting to get voting power
              if (proposal.snapshotId && proposal.snapshotId !== undefined) {
                const power = await getVotingPower(proposal.snapshotId);
                
                // Cache the result with long TTL since snapshot data is historical
                const ttl = 86400 * 7; // 7 days
                blockchainDataCache.set(`votingPower-${account}-${proposal.snapshotId}`, power, ttl);
                
                return { id: proposal.id, power };
              } else {
                // Handle missing snapshot ID - try to get current voting power as fallback
                console.warn(`Proposal ${proposal.id} has no snapshot ID, using fallback`);
                const power = await getVotingPower(null); // Will use current snapshot
                return { id: proposal.id, power };
              }
            } catch (err) {
              console.error(`Error getting voting power for proposal ${proposal.id}:`, err);
              return { id: proposal.id, power: "0" };
            }
          })
        );
        
        // Update powers object with batch results
        batchResults.forEach(({ id, power }) => {
          newPowers[id] = power;
        });
        
        // Add a small delay between batches
        if (i + batchSize < proposalsToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Update state with both cached and newly fetched powers
      if (mountedRef.current) {
        setVotingPowers(prev => ({
          ...prev,
          ...currentPowers,
          ...newPowers
        }));
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching voting powers:", err);
      if (mountedRef.current) {
        setLoading(false);
      }
    } finally {
      votingPowersLoadingRef.current = false;
    }
  }, [getVotingPower, account, proposals, actualVotingPower]);

  // Initialize votedProposals from the proposals data - with optimization
  useEffect(() => {
    // Only process if needed
    if (!proposals.length) return;
    
    const voted = {};
    let hasChanges = false;
    
    proposals.forEach(proposal => {
      // Skip if we already have this proposal's vote
      if (votedProposals[proposal.id] !== undefined) {
        voted[proposal.id] = votedProposals[proposal.id];
        return;
      }
      
      if (proposal.hasVoted) {
        // Set default vote type to abstain if not specified
        let voteType = VOTE_TYPES.ABSTAIN;
        if (proposal.votedYes) voteType = VOTE_TYPES.FOR;
        if (proposal.votedNo) voteType = VOTE_TYPES.AGAINST;
        
        voted[proposal.id] = voteType;
        hasChanges = true;
      }
    });
    
    // Only update state if there are actually changes
    if (hasChanges) {
      setVotedProposals(prev => ({
        ...prev,
        ...voted
      }));
    }
  }, [proposals, VOTE_TYPES, votedProposals]);

  // Helper function to format time durations in a human-readable way
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

  // Check if user has voted on the proposal (directly check contract) - with caching
  const hasUserVoted = useCallback(async (proposalId) => {
    if (!isConnected || !account || !contractsReady || !contracts.governance) return false;
    
    try {
      // Try to get from cache first
      const cacheKey = `hasVoted-${account}-${proposalId}`;
      const cachedResult = blockchainDataCache.get(cacheKey);
      
      if (cachedResult !== null) {
        // If the user has voted, add to our tracked set of voted proposals
        if (cachedResult) {
          setUserVotedProposalIds(prev => new Set([...prev, proposalId]));
        }
        return cachedResult;
      }
      
      // Check directly from contract
      const voterInfo = await contracts.governance.proposalVoterInfo(proposalId, account);
      const hasVoted = !voterInfo.isZero();
      
      // Cache the result
      blockchainDataCache.set(cacheKey, hasVoted, 3600); // 1 hour cache
      
      // Update our tracking of which proposals the user has voted on
      if (hasVoted) {
        setUserVotedProposalIds(prev => new Set([...prev, proposalId]));
      }
      
      return hasVoted;
    } catch (err) {
      console.error(`Error checking if user has voted on proposal ${proposalId}:`, err);
      
      // Fallback to local state
      return votedProposals[proposalId] !== undefined;
    }
  }, [isConnected, account, contractsReady, contracts, votedProposals]);

  // FIX: Add a function to check all proposals for user votes
  const checkAllProposalsVotes = useCallback(async () => {
    if (!isConnected || !account || !contractsReady || !contracts.governance || !proposals.length) {
      return;
    }
    
    // To avoid too many requests, check in small batches
    const batchSize = 5;
    const votedIds = new Set([...userVotedProposalIds]);
    
    for (let i = 0; i < proposals.length; i += batchSize) {
      if (!mountedRef.current) break;
      
      const batch = proposals.slice(i, i + batchSize);
      
      // Check each proposal in parallel
      await Promise.all(
        batch.map(async (proposal) => {
          try {
            // Skip if we already know the user has voted on this proposal
            if (userVotedProposalIds.has(proposal.id)) return;
            
            const hasVoted = await hasUserVoted(proposal.id);
            if (hasVoted) {
              votedIds.add(proposal.id);
            }
          } catch (err) {
            console.error(`Error checking vote for proposal ${proposal.id}:`, err);
          }
        })
      );
      
      // Small delay between batches
      if (i + batchSize < proposals.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Update state with all voted proposals
    if (mountedRef.current) {
      setUserVotedProposalIds(votedIds);
    }
  }, [isConnected, account, contractsReady, contracts, proposals, hasUserVoted, userVotedProposalIds]);
  
  // Run vote check when proposals change or when the component mounts
  useEffect(() => {
    checkAllProposalsVotes();
  }, [proposals, checkAllProposalsVotes]);

  // Effect to handle refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      // Force refresh vote status for all proposals
      checkAllProposalsVotes();
    }
  }, [refreshKey, checkAllProposalsVotes]);
  
  // Get the vote type (directly check from events) - with caching
  const getUserVoteType = useCallback(async (proposalId) => {
    // First check our local state
    if (votedProposals[proposalId] !== undefined) {
      return votedProposals[proposalId];
    }
    
    if (!isConnected || !account || !contractsReady || !contracts.governance) {
      return null;
    }
    
    try {
      // Try to get from cache first
      const cacheKey = `voteType-${account}-${proposalId}`;
      const cachedType = blockchainDataCache.get(cacheKey);
      
      if (cachedType !== null) {
        return cachedType;
      }
      
      // Try to find vote cast events for this user on this proposal
      const filter = contracts.governance.filters.VoteCast(proposalId, account);
      const events = await contracts.governance.queryFilter(filter);
      
      if (events.length > 0) {
        // Use the most recent vote
        const latestVote = events[events.length - 1];
        const voteType = Number(latestVote.args.support);
        
        // Cache the result
        blockchainDataCache.set(cacheKey, voteType, 86400); // 24 hour cache (votes don't change)
        
        return voteType;
      }
    } catch (err) {
      console.error(`Error getting vote type for proposal ${proposalId}:`, err);
    }
    
    return null;
  }, [votedProposals, isConnected, account, contractsReady, contracts]);

  // Use memoization for filtered and sorted proposals
  const { filteredProposals, sortedProposals } = useMemo(() => {
    // Filter proposals based on vote status
    const filtered = proposals.filter(p => {
      // Safety check for null/undefined proposal
      if (!p) return false;
      
      // Check if we've locally voted on this proposal (from our tracking set or local state)
      const userHasVoted = userVotedProposalIds.has(p.id) || votedProposals[p.id] !== undefined;
      
      if (voteFilter === 'active') {
        // Only check if proposal is active
        return p.state === PROPOSAL_STATES.ACTIVE;
      } else if (voteFilter === 'voted') {
        // FIX: Check if proposal is in our tracked set of voted proposals
        return userHasVoted;
      }
      return true; // 'all' filter
    });
    
    // Sort by ID in descending order (newest first)
    const sorted = [...filtered].sort((a, b) => Number(b.id) - Number(a.id));
    
    return { filteredProposals: filtered, sortedProposals: sorted };
  }, [proposals, voteFilter, votedProposals, PROPOSAL_STATES.ACTIVE, userVotedProposalIds]);

  // Use memoization for pagination
  const { currentProposals, totalPages, indexOfFirstItem, indexOfLastItem } = useMemo(() => {
    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const current = sortedProposals.slice(indexOfFirstItem, indexOfLastItem);
    const total = Math.ceil(sortedProposals.length / itemsPerPage);
    
    return { 
      currentProposals: current, 
      totalPages: total, 
      indexOfFirstItem, 
      indexOfLastItem 
    };
  }, [sortedProposals, currentPage, itemsPerPage]);
  
  // Pagination navigation functions - using useCallback
  const goToPage = useCallback((pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  }, [totalPages]);
  
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);
  
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Submit vote with improved error handling and UI updates
  const submitVote = useCallback(async (proposalId, support) => {
    try {
      // Find the proposal in the list
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) {
        console.error("Proposal not found:", proposalId);
        return;
      }
      
      // Actually send the vote transaction to the blockchain
      const result = await castVote(proposalId, support);
      
      // Update the voted proposals state if successful
      setVotedProposals(prev => ({
        ...prev,
        [proposalId]: support
      }));
      
      // Add to our set of voted proposals
      setUserVotedProposalIds(prev => new Set([...prev, proposalId]));
      
      // Clear user vote caches to force refresh
      blockchainDataCache.delete(`hasVoted-${account}-${proposalId}`);
      blockchainDataCache.delete(`voteType-${account}-${proposalId}`);
      blockchainDataCache.delete(`user-vote-${account}-${proposalId}`);
      
      // Trigger global refresh event for other components to update
      if (window && window.dispatchEvent) {
        console.log("Dispatching vote cast refresh event");
        const refreshEvent = new CustomEvent('app:refresh', { 
          detail: { timestamp: Date.now(), proposalId }
        });
        window.dispatchEvent(refreshEvent);
      }
      
      return result;
    } catch (err) {
      console.error("Error submitting vote:", err);
      throw err;
    }
  }, [proposals, castVote, account]);

  // Enhanced function to render proposal description with proper rich text support
  const renderProposalDescription = useCallback((proposal, truncate = true, maxLength = 200) => {
    // Direct extraction of HTML content - don't rely on previous processing
    let descriptionHtml = null;
    let descriptionText = proposal.description || '';
    
    // Check if description contains HTML marker
    const htmlMarkerIndex = descriptionText.indexOf('|||HTML:');
    if (htmlMarkerIndex !== -1) {
      // Extract HTML content directly
      descriptionHtml = descriptionText.substring(htmlMarkerIndex + 8);
      // Get the plain text portion
      descriptionText = descriptionText.substring(0, htmlMarkerIndex).trim();
    }
    
    // Use the extracted HTML if available, otherwise use the original descriptionHtml property
    const htmlContent = descriptionHtml || proposal.descriptionHtml;
    
    if (htmlContent) {
      if (truncate) {
        // Simple styling for truncated view (non-expanded)
        return (
          <div 
            className="text-sm text-gray-700 dark:text-gray-300 mb-6"
            dangerouslySetInnerHTML={{ __html: truncateHtml(htmlContent, maxLength) }}
          />
        );
      } else {
        // Full prose styling for expanded view with dark mode support
        return (
          <div 
            className="prose prose-sm max-w-none mb-4 dark:prose-invert dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        );
      }
    } else {
      if (truncate) {
        return (
          <p className="text-gray-700 dark:text-gray-300 mb-6 text-base">
            {descriptionText.substring(0, maxLength)}
            {descriptionText.length > maxLength ? '...' : ''}
          </p>
        );
      } else {
        return (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
            {descriptionText}
          </p>
        );
      }
    }
  }, []);

  // Helper to convert vote type to text
  const getVoteTypeText = useCallback((voteType) => {
    if (voteType === VOTE_TYPES.FOR) return 'Yes';
    if (voteType === VOTE_TYPES.AGAINST) return 'No';
    if (voteType === VOTE_TYPES.ABSTAIN) return 'Abstain';
    return '';
  }, [VOTE_TYPES]);
  
  // Updated helper to get proposal type label with improved names
  const getProposalTypeLabel = useCallback((proposal) => {
    // Check if proposal has a typeLabel property
    if (proposal.typeLabel) {
      return proposal.typeLabel;
    }
    
    // Define the type labels mapping
    const typeLabels = {
      [PROPOSAL_TYPES.GENERAL]: "Contract Interaction",
      [PROPOSAL_TYPES.WITHDRAWAL]: "ETH Withdrawal",
      [PROPOSAL_TYPES.TOKEN_TRANSFER]: "Treasury Transfer",
      [PROPOSAL_TYPES.GOVERNANCE_CHANGE]: "Governance Parameter Update",
      [PROPOSAL_TYPES.EXTERNAL_ERC20_TRANSFER]: "External Token Transfer",
      [PROPOSAL_TYPES.TOKEN_MINT]: "Token Issuance",
      [PROPOSAL_TYPES.TOKEN_BURN]: "Token Consolidation",
      [PROPOSAL_TYPES.SIGNALING]: "Binding Community Vote"
    };
    
    // Return the type label based on the proposal type
    return typeLabels[proposal.type] || "Binding Community Vote";
  }, [PROPOSAL_TYPES]);
  
  // Helper to get proposal state label and color
  const getProposalStateInfo = useCallback((proposal) => {
    // Get actual state instead of relying on deadline
    const state = proposal.state;
    
    const stateLabels = {
      [PROPOSAL_STATES.ACTIVE]: { 
        label: "Active", 
        color: "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-200 shadow-sm" 
      },
      [PROPOSAL_STATES.CANCELED]: { 
        label: "Canceled", 
        color: "bg-gradient-to-r from-gray-50 to-gray-200 text-gray-800 border border-gray-200 dark:from-gray-800/40 dark:to-gray-700/40 dark:text-gray-300 shadow-sm" 
      },
      [PROPOSAL_STATES.DEFEATED]: { 
        label: "Defeated", 
        color: "bg-gradient-to-r from-red-50 to-red-100 text-red-800 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-200 shadow-sm" 
      },
      [PROPOSAL_STATES.SUCCEEDED]: { 
        label: "Succeeded", 
        color: "bg-gradient-to-r from-green-50 to-green-100 text-green-800 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-200 shadow-sm" 
      },
      [PROPOSAL_STATES.QUEUED]: { 
        label: "Queued", 
        color: "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300 shadow-sm" 
      },
      [PROPOSAL_STATES.EXECUTED]: { 
        label: "Executed", 
        color: "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-200 shadow-sm" 
      },
      [PROPOSAL_STATES.EXPIRED]: { 
        label: "Expired", 
        color: "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-800 border border-slate-200 dark:from-slate-800/40 dark:to-slate-700/40 dark:text-slate-300 shadow-sm" 
      }
    };
    
    return stateLabels[parseInt(state)] || { 
      label: "Unknown", 
      color: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 dark:from-gray-800/40 dark:to-gray-700/40 dark:text-gray-300 shadow-sm" 
    };
  }, [PROPOSAL_STATES]);

  // Format numbers for display
  const formatNumberDisplay = useCallback((value) => {
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
  }, []);
  
  // Format token values to 5 decimal places
  const formatToFiveDecimals = useCallback((value) => {
    if (value === undefined || value === null) return "0.00000";
    
    // Handle string inputs
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // If it's NaN or not a number, return "0.00000"
    if (isNaN(numValue)) return "0.00000";
    
    // Return with exactly 5 decimal places
    return numValue.toFixed(5);
  }, []);
  
  // Format date correctly
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return "Unknown";
    
    // Convert seconds to milliseconds if needed
    const dateValue = timestamp > 10000000000 ? timestamp : timestamp * 1000;
    
    try {
      return new Date(dateValue).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      // Clean up timers
      if (threatLevelTimerRef.current) {
        clearInterval(threatLevelTimerRef.current);
        threatLevelTimerRef.current = null;
      }
    };
  }, []);

  // Effect to load voting powers when proposals change
  useEffect(() => {
    if (isConnected && contractsReady && proposals.length > 0 && account) {
      fetchVotingPowers();
    }
  }, [isConnected, contractsReady, proposals, account, fetchVotingPowers]);

  // Rest of the component (UI rendering)
  return (
			<div >
		  <div className="relative w-full ">
			<div className="flex flex-col justify-between items-start gap-2 mb-6">
			  <div className="flex-grow space-y-1">
				<h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
				  Vote
				</h2>
				<p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
				  Review and vote on active proposals
				</p>
			  </div>
			</div>

			{/* Move the filter here, outside the flex row */}
			<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-7 w-full">
			  <div className="flex flex-wrap gap-3 justify-center items-center">
				{['active', 'voted', 'all'].map(filter => (
				  <button
					key={filter}
					className={`px-4 py-2 rounded-full text-sm ${
					  voteFilter === filter 
						? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 font-medium' 
						: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
					}`}
					onClick={() => {
					  setVoteFilter(filter);
					  setCurrentPage(1); // Reset to the first page on filter change
					}}
				  >
					{filter.charAt(0).toUpperCase() + filter.slice(1)}
				  </button>
				))}
			  </div>
			</div>
		  </div>


      
      {/* Voting cards */}
      <div className="space-y-8">
        {loading && currentProposals.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader size="large" text="Loading proposals..." />
          </div>
        ) : currentProposals.length > 0 ? (
          <>
            {currentProposals.map((proposal) => (
              <ProposalCard 
                key={proposal.id}
                proposal={proposal}
                votingPower={votingPowers[proposal.id] || actualVotingPower || "0"} // Use actualVotingPower as fallback
                castVote={submitVote}
                formatToFiveDecimals={formatToFiveDecimals}
                govParams={govParams}
                hasUserVoted={hasUserVoted}
                getUserVoteType={getUserVoteType}
                getVoteTypeText={getVoteTypeText}
                VOTE_TYPES={VOTE_TYPES}
                PROPOSAL_STATES={PROPOSAL_STATES}
                getProposalStateInfo={getProposalStateInfo}
                renderProposalDescription={renderProposalDescription}
                setSelectedProposal={setSelectedProposal}
                setShowModal={setShowModal}
                voting={voting}
              />
            ))}
            
            {/* Pagination controls */}
            {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-700/20">
            <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Showing proposals {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedProposals.length)} of {sortedProposals.length}
            </div>
            <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                    : 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600 hover:from-indigo-100 hover:to-indigo-200 dark:from-indigo-900/20 dark:to-indigo-800/20 dark:text-indigo-400 dark:hover:from-indigo-800/30 dark:hover:to-indigo-700/30'}`}
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Page numbers */}
                <div className="flex space-x-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    
                    // Logic to determine which page numbers to show
                    const shouldShowPage = 
                      pageNum === 1 || // Always show first page
                      pageNum === totalPages || // Always show last page
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1); // Show current and surrounding pages
                    
                    // Show ellipsis before and after skipped pages
                    const showPrevEllipsis = i === 1 && currentPage > 3;
                    const showNextEllipsis = i === totalPages - 2 && currentPage < totalPages - 2;
                    
                    if (shouldShowPage) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md dark:from-indigo-700 dark:to-indigo-800'
                              : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (showPrevEllipsis || showNextEllipsis) {
                      return (
                        <div key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400">
                          &hellip;
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${currentPage === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                    : 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600 hover:from-indigo-100 hover:to-indigo-200 dark:from-indigo-900/20 dark:to-indigo-800/20 dark:text-indigo-400 dark:hover:from-indigo-800/30 dark:hover:to-indigo-700/30'}`}
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md  w-full min-w-full mx-0 px-2 relative overflow-hidden" style={{width: '65vw', maxWidth: '65%', marginLeft: 5, marginRight: -60}}>
            No proposals found for this filter
          </div>
        )}
      </div>
      
      {/* Proposal Details Modal */}
      {showModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-4 border-b dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold dark:text-white">{selectedProposal.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Proposal #{selectedProposal.id}</p>
              </div>
              <button 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setShowModal(false)}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {/* Proposal type and status */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">
                  {getProposalTypeLabel(selectedProposal)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getProposalStateInfo(selectedProposal).color}`}>
                  {getProposalStateInfo(selectedProposal).label}
                </span>
              </div>
             
             {/* Proposal metadata */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <div className="dark:text-gray-300">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span> {formatDate(selectedProposal.createdAt)}
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <div className="dark:text-gray-300">
                    <span className="text-gray-600 dark:text-gray-400">Deadline:</span> {formatCountdown(selectedProposal.deadline)}
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <div className="dark:text-gray-300">
                    <span className="text-gray-600 dark:text-gray-400">Proposer:</span> {selectedProposal.proposer?.substring(0, 6)}...{selectedProposal.proposer?.slice(-4)}
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <BarChart2 className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <div className="dark:text-gray-300">
                    <span className="text-gray-600 dark:text-gray-400">Snapshot ID:</span>{" "}
                    {selectedProposal.snapshotId ? `#${selectedProposal.snapshotId}` : "N/A"}
                  </div>
                </div>
              </div>
              
              {/* Full description with proper HTML rendering */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded border dark:border-gray-700">
                  {renderProposalDescription(selectedProposal, false)}
                </div>
              </div>
              
              {/* Vote results */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Voting Results</h4>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded border dark:border-gray-700">
                  <VoteData proposalId={selectedProposal.id} showDetailedInfo={true} />
                 {/* Quorum progress */}
					{govParams.quorum > 0 && (
					  <div className="mt-4 mb-5">
						<h5 className="text-sm font-medium mb-2 dark:text-gray-300">Quorum Progress</h5>
						<QuorumProgress 
						  proposalId={selectedProposal.id} 
						  quorum={govParams.quorum} 
						  showWarningIfNeeded={true}
						  proposalState={selectedProposal.state}
						/>
					  </div>
					)}
                  
                  {/* Use ModalVoteStatus component to handle async vote checking */}
                  <ModalVoteStatus 
                    proposalId={selectedProposal.id}
                    hasUserVoted={hasUserVoted}
                    getUserVoteType={getUserVoteType}
                    getVoteTypeText={getVoteTypeText}
                  />
                </div>
              </div>
              
              {/* Additional proposal details */}
              {selectedProposal.actions && selectedProposal.actions.length > 0 && (
                <div className="mb-6"> 
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actions</h4>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border dark:border-gray-700">
                    <ul className="list-disc pl-5 text-sm dark:text-gray-300">
                      {selectedProposal.actions.map((action, i) => (
                        <li key={i} className="mb-1">{action}</li>
                      ))}</ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Transaction details if available */}
                  {selectedProposal.txHash && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Hash</h4>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border dark:border-gray-700 text-sm break-all dark:text-gray-300">
                        {selectedProposal.txHash}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t dark:border-gray-700 p-4 flex justify-end">
                  <button
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };
    
    export default VoteTab;
