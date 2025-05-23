// src/contexts/BlockchainDataContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './Web3Context';
import { ethers } from 'ethers';

// Helper function to create a manual vote data override for specific proposals
// Modify this object to include any proposals that need manual overrides
const manualVoteOverrides = {
  // Replace these IDs with your actual proposal IDs that need fixing
  // Format: 'proposalId': { voteData }
};

// Create the context
const BlockchainDataContext = createContext();

// Provider component
export const BlockchainDataProvider = ({ children }) => {
  // Get Web3 context
  const { 
    account, 
    isConnected, 
    provider, 
    contracts, 
    contractsReady, 
    refreshCounter,
    getContractByName
  } = useWeb3();
  
  // State for user data
  const [userData, setUserData] = useState({
    address: null,
    balance: "0",
    votingPower: "0",
    onChainVotingPower: "0", // Added on-chain voting power
    delegate: null,
    lockedTokens: "0",
    delegatedToYou: "0",
    delegators: [],
    hasVotedProposals: {},
    isSelfDelegated: true
  });
  
  // State for DAO statistics
  const [daoStats, setDaoStats] = useState({
    totalHolders: 0,
    circulatingSupply: "0",
    activeProposals: 0,
    totalProposals: 0,
    participationRate: 0,
    delegationRate: 0,
    proposalSuccessRate: 0
  });
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Counter for manual refreshes
  const [manualRefreshCounter, setManualRefreshCounter] = useState(0);
  
  // Fetch token balance for an address directly from the blockchain
  const getTokenBalance = useCallback(async (address) => {
    if (!address || !contractsReady || !contracts.justToken) {
      return "0";
    }
    
    try {
      const balance = await contracts.justToken.balanceOf(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return "0";
    }
  }, [contractsReady, contracts]);

  // Fetch delegation info for an address
  const getDelegationInfo = useCallback(async (address) => {
    if (!address || !contractsReady || !contracts.justToken) {
      return {
        currentDelegate: null,
        lockedTokens: "0",
        delegatedToYou: "0",
        delegators: []
      };
    }

    try {
      // Get delegation data from contract
      const tokenContract = contracts.justToken;
      
      // Get current delegate
      const currentDelegate = await tokenContract.getDelegate(address);
      
      // Get locked tokens
      const lockedTokens = await tokenContract.getLockedTokens(address);
      
      // Get tokens delegated to this address
      const delegatedToYou = await tokenContract.getDelegatedToAddress(address);
      
      // Get delegators list
      const delegatorAddresses = await tokenContract.getDelegatorsOf(address);
      
      // Get balance for each delegator
      const delegators = await Promise.all(
        delegatorAddresses.map(async (delegatorAddr) => {
          const balance = await getTokenBalance(delegatorAddr);
          return {
            address: delegatorAddr,
            balance
          };
        })
      );

      return {
        currentDelegate,
        lockedTokens: ethers.utils.formatEther(lockedTokens),
        delegatedToYou: ethers.utils.formatEther(delegatedToYou),
        delegators
      };
    } catch (error) {
      console.error("Error fetching delegation info:", error);
      return {
        currentDelegate: null,
        lockedTokens: "0",
        delegatedToYou: "0",
        delegators: []
      };
    }
  }, [contractsReady, contracts, getTokenBalance]);

  // Helper function to get proposal snapshot ID safely
const getProposalSnapshotId = useCallback(async (proposalId) => {
  if (!contractsReady || !contracts.governance || !contracts.justToken) {
    return 0;
  }

  try {
    // First attempt to use the contract state to get the snapshot ID
    // This approach avoids the "proposals is not a function" error
    
    // Check if proposal exists by checking its state (this won't throw if proposal exists)
    const state = await contracts.governance.getProposalState(proposalId);
    
    // Get current snapshot as fallback since we can't directly access the proposal's snapshot ID
    const currentSnapshotId = await contracts.justToken.getCurrentSnapshotId();
    console.log(`Using current snapshot ID ${currentSnapshotId} for proposal ${proposalId}`);
    
    return currentSnapshotId;
  } catch (error) {
    console.warn(`Error getting snapshot ID for proposal ${proposalId}:`, error);
    
    // If we can't get even the proposal state, use 0 as fallback
    return 0;
  }
}, [contractsReady, contracts]);

  // FIX: Enhanced getVotingPower function to fetch directly from blockchain and handle delegation correctly
  const getVotingPower = useCallback(async (address) => {
    if (!address || !contractsReady || !contracts.justToken) {
      return "0";
    }

    try {
      // Get the current snapshot ID
      const snapshotId = await contracts.justToken.getCurrentSnapshotId();
      
      // Get on-chain voting power directly from the contract
      const votingPower = await contracts.justToken.getEffectiveVotingPower(address, snapshotId);
      
      // Get delegation info to check if user has delegated
      const delegationInfo = await getDelegationInfo(address);
      
      // Check if the user has delegated to someone else (not self or zero address)
      const isSelfDelegated = delegationInfo.currentDelegate === address || 
                              delegationInfo.currentDelegate === ethers.constants.AddressZero;
      
      // If user has delegated to someone else, voting power should be 0
      if (!isSelfDelegated) {
        console.log(`User ${address} has delegated to ${delegationInfo.currentDelegate}, voting power is 0`);
        return "0";
      }
      
      // Format and return voting power for self-delegated users
      return ethers.utils.formatEther(votingPower);
    } catch (error) {
      console.error("Error getting on-chain voting power:", error);
      
      // Fallback to calculating it from delegation info if on-chain call fails
      try {
        // Get delegation info
        const delegationInfo = await getDelegationInfo(address);
        
        // Get user balance
        const balance = await getTokenBalance(address);
        
        // Check if self-delegated
        const isSelfDelegated = 
          delegationInfo.currentDelegate === address || 
          delegationInfo.currentDelegate === ethers.constants.AddressZero ||
          delegationInfo.currentDelegate === null;
        
        // If self-delegated, add delegated tokens to voting power
        // Otherwise, voting power is 0 (delegated away)
        let votingPower = "0";
        
        if (isSelfDelegated) {
          // Self-delegated - voting power is own balance + delegated to you
          const ownBalance = ethers.utils.parseEther(balance);
          const delegated = ethers.utils.parseEther(delegationInfo.delegatedToYou || "0");
          votingPower = ethers.utils.formatEther(ownBalance.add(delegated));
        } else {
          console.log(`User ${address} has delegated to ${delegationInfo.currentDelegate}, voting power is 0`);
          // Keep voting power as 0 since the user has delegated away
        }
        
        return votingPower;
      } catch (fallbackError) {
        console.error("Error in voting power fallback calculation:", fallbackError);
        return "0";
      }
    }
  }, [contractsReady, contracts, getDelegationInfo, getTokenBalance]);

  // ENHANCED: Improved function to handle getting all delegates in a transitive chain
  const getTransitiveDelegationChain = useCallback(async (startAddress, maxDepth = 10) => {
    if (!startAddress || !contractsReady || !contracts.justToken) {
      return [];
    }
    
    try {
      // Initialize chain and addresses we've seen to avoid cycles
      const chain = [];
      const seen = new Set();
      seen.add(startAddress.toLowerCase());
      
      let currentAddress = startAddress;
      let depth = 0;
      
      // Follow the delegation chain
      while (depth < maxDepth) {
        console.log(`Checking delegate for address: ${currentAddress} at depth ${depth}`);
        const delegate = await contracts.justToken.getDelegate(currentAddress);
        const delegateNormalized = delegate.toLowerCase();
        
        // If zero address or self-delegation, chain ends
        if (delegate === ethers.constants.AddressZero || 
            delegateNormalized === currentAddress.toLowerCase()) {
          console.log(`Chain ends at ${currentAddress} (self-delegated or zero address)`);
          break;
        }
        
        // Get balance for this step to track voting power flow
        const balance = await getTokenBalance(currentAddress);
        
        // Record this delegation step with balance information
        chain.push({
          from: currentAddress,
          to: delegate,
          fromBalance: balance,
          depth: depth
        });
        
        console.log(`Delegation link found: ${currentAddress} -> ${delegate} with balance ${balance}`);
        
        // Prevent cycles - if we've seen this address before, stop
        if (seen.has(delegateNormalized)) {
          console.log(`Delegation cycle detected at depth ${depth}:`, delegate);
          break;
        }
        
        // Mark as seen and continue to the next delegate
        seen.add(delegateNormalized);
        currentAddress = delegate;
        depth++;
      }
      
      console.log(`Complete delegation chain for ${startAddress}:`, chain);
      return chain;
    } catch (error) {
      console.error("Error getting transitive delegation chain:", error);
      return [];
    }
  }, [contractsReady, contracts, getTokenBalance]);
  
  // NEW: Function to calculate the total transitive voting power flowing through an address
  const calculateTransitiveVotingPower = useCallback(async (address) => {
    if (!address || !contractsReady || !contracts.justToken) {
      return "0";
    }
    
    try {
      // First, check if the address is self-delegated
      const delegate = await contracts.justToken.getDelegate(address);
      const isSelfDelegated = 
        delegate === address || 
        delegate === ethers.constants.AddressZero;
      
      // If not self-delegated, no voting power flows through this address
      if (!isSelfDelegated) {
        console.log(`Address ${address} is delegated to ${delegate}, no transitive power flows through`);
        return "0";
      }
      
      // Get direct delegators and their balances
      const delegatorAddresses = await contracts.justToken.getDelegatorsOf(address);
      let totalTransitiveVotingPower = ethers.BigNumber.from(0);
      
      // Get own balance
      const ownBalance = await contracts.justToken.balanceOf(address);
      totalTransitiveVotingPower = totalTransitiveVotingPower.add(ownBalance);
      
      console.log(`Own balance of ${address}: ${ethers.utils.formatEther(ownBalance)}`);
      
      // For each delegator, check if they're receiving delegations themselves (transitive flow)
      for (const delegator of delegatorAddresses) {
        const delegatorBalance = await contracts.justToken.balanceOf(delegator);
        
        // Include direct delegation
        totalTransitiveVotingPower = totalTransitiveVotingPower.add(delegatorBalance);
        console.log(`Direct delegator ${delegator} adds ${ethers.utils.formatEther(delegatorBalance)}`);
        
        // Check if this delegator receives delegations (transitive)
        const subDelegators = await contracts.justToken.getDelegatorsOf(delegator);
        
        // Only consider delegations from self-delegated accounts
        for (const subDelegator of subDelegators) {
          const subDelegate = await contracts.justToken.getDelegate(subDelegator);
          
          // Skip if the sub-delegator is delegated to someone other than the delegator
          // This prevents counting voting power that doesn't flow through the proper chain
          if (subDelegate.toLowerCase() !== delegator.toLowerCase()) {
            console.log(`Sub-delegator ${subDelegator} is delegated to ${subDelegate}, not to ${delegator}`);
            continue;
          }
          
          const subDelegatorBalance = await contracts.justToken.balanceOf(subDelegator);
          totalTransitiveVotingPower = totalTransitiveVotingPower.add(subDelegatorBalance);
          console.log(`Transitive delegator ${subDelegator} -> ${delegator} -> ${address} adds ${ethers.utils.formatEther(subDelegatorBalance)}`);
        }
      }
      
      const totalPower = ethers.utils.formatEther(totalTransitiveVotingPower);
      console.log(`Total transitive voting power for ${address}: ${totalPower}`);
      return totalPower;
    } catch (error) {
      console.error("Error calculating transitive voting power:", error);
      return "0";
    }
  }, [contractsReady, contracts]);

  // New function to get detailed voting power information
  const getVotingPowerDetails = useCallback(async (address) => {
    if (!address || !contractsReady || !contracts.justToken) {
      return {
        onChainVotingPower: "0",
        ownBalance: "0",
        delegatedToYou: "0",
        delegatedAway: "0", 
        currentDelegate: null,
        isSelfDelegated: true,
        source: "default"
      };
    }

    try {
      // Get current snapshot ID
      const snapshotId = await contracts.justToken.getCurrentSnapshotId();
      
      // Get delegation info
      const delegationInfo = await getDelegationInfo(address);
      
      // Get balance
      const balance = await getTokenBalance(address);
      
      // Get on-chain voting power
      const votingPower = await contracts.justToken.getEffectiveVotingPower(address, snapshotId);
      
      // Get the transitive delegation chain to check if power flows correctly
      const delegationChain = await getTransitiveDelegationChain(address);
      console.log("Delegation chain for", address, ":", delegationChain);
      
      // Check if self-delegated
      const isSelfDelegated = 
        delegationInfo.currentDelegate === address || 
        delegationInfo.currentDelegate === ethers.constants.AddressZero;
      
      // Calculate delegated away (only if not self-delegated)
      let delegatedAway = "0";
      if (!isSelfDelegated) {
        delegatedAway = balance; // if delegated, all tokens are delegated away
      }
      
      // Adjusted voting power - if not self-delegated, should be 0
      const adjustedVotingPower = isSelfDelegated ? 
        ethers.utils.formatEther(votingPower) : "0";
      
      return {
        onChainVotingPower: adjustedVotingPower,
        ownBalance: balance,
        delegatedToYou: delegationInfo.delegatedToYou,
        delegatedAway,
        currentDelegate: delegationInfo.currentDelegate,
        isSelfDelegated,
        delegationChain,
        source: "blockchain"
      };
    } catch (error) {
      console.error("Error getting detailed voting power:", error);
      return {
        onChainVotingPower: "0",
        ownBalance: "0",
        delegatedToYou: "0",
        delegatedAway: "0",
        currentDelegate: null,
        isSelfDelegated: true,
        source: "error"
      };
    }
  }, [contractsReady, contracts, getDelegationInfo, getTokenBalance, getTransitiveDelegationChain]);

  // Get user's voted proposals directly from blockchain events
  const getVotedProposals = useCallback(async () => {
    if (!contractsReady || !isConnected || !account || !contracts.governance) return {};
    
    try {
      // Use events to get all proposals the user has voted on
      const governance = contracts.governance;
      const filter = governance.filters.VoteCast(null, account);
      const events = await governance.queryFilter(filter);
      
      const votedProposals = {};
      for (const event of events) {
        try {
          const proposalId = event.args.proposalId.toString();
          const voteType = event.args.support;
          
          votedProposals[proposalId] = {
            type: Number(voteType),
            timestamp: (await event.getBlock()).timestamp
          };
        } catch (err) {
          console.warn("Error processing vote event:", err);
        }
      }
      
      return votedProposals;
    } catch (error) {
      console.error("Error fetching voted proposals:", error);
      return {};
    }
  }, [contractsReady, isConnected, account, contracts]);

  // Check if user has voted on a proposal
  const hasVoted = useCallback(async (proposalId) => {
    if (!isConnected || !account || !contractsReady || !contracts.governance) return false;
    
    try {
      // Check if we already know from userData
      if (userData.hasVotedProposals[proposalId]) {
        return true;
      }
      
      // If not, check directly from contract
      const voterInfo = await contracts.governance.proposalVoterInfo(proposalId, account);
      return !voterInfo.isZero();
    } catch (err) {
      console.error(`Error checking if user has voted on proposal ${proposalId}:`, err);
      return false;
    }
  }, [isConnected, account, contractsReady, contracts, userData.hasVotedProposals]);

  // Direct query method to get votes from events - most reliable for contracts with issues
  const directQueryVotes = useCallback(async (proposalId) => {
    if (!contractsReady || !isConnected || !contracts.governance) {
      return null;
    }
    
    try {
      console.log(`Direct query for votes on proposal ${proposalId}`);
      
      // First try to get the proposal details to make sure it exists
      try {
        await contracts.governance.getProposalState(proposalId);
      } catch (err) {
        console.error(`Proposal ${proposalId} doesn't exist or can't be accessed`);
        return null;
      }
      
      // Use VoteCast events - the most reliable method
      const filter = contracts.governance.filters.VoteCast(proposalId);
      const events = await contracts.governance.queryFilter(filter);
      console.log(`Found ${events.length} VoteCast events for proposal ${proposalId}`);
      
      // If no votes at all, return zeros
      if (events.length === 0) {
        return {
          yesVotes: "0",
          noVotes: "0",
          abstainVotes: "0",
          totalVotes: 0,
          totalVoters: 0,
          yesPercentage: 0,
          noPercentage: 0,
          abstainPercentage: 0,
          yesVotingPower: "0",
          noVotingPower: "0",
          abstainVotingPower: "0",
          totalVotingPower: "0",
          source: 'direct-query-no-votes'
        };
      }
      
      // Process each vote event
      const voters = new Map(); // Track unique voters and their latest vote
      let yesTotal = ethers.BigNumber.from(0);
      let noTotal = ethers.BigNumber.from(0);
      let abstainTotal = ethers.BigNumber.from(0);
      
      // Debug logging - show all events
      events.forEach((event, idx) => {
        try {
          console.log(`Vote event ${idx}: `, {
            voter: event.args.voter,
            support: event.args.support.toString(),
            power: ethers.utils.formatEther(event.args.votingPower)
          });
        } catch (err) {
          console.warn(`Error logging vote event ${idx}:`, err);
        }
      });
      
      // Process events to get vote totals
      for (const event of events) {
        try {
          const voter = event.args.voter.toLowerCase();
          const support = Number(event.args.support);
          const power = event.args.votingPower;
          
          // Update the voter map with the latest vote
          voters.set(voter, { support, power });
        } catch (err) {
          console.warn(`Error processing vote event:`, err);
        }
      }
      
      // Calculate totals from the unique voters' latest votes
      for (const [_, voteInfo] of voters.entries()) {
        const { support, power } = voteInfo;
        
        if (support === 1) { // Yes
          yesTotal = yesTotal.add(power);
        } else if (support === 0) { // No
          noTotal = noTotal.add(power);
        } else if (support === 2) { // Abstain
          abstainTotal = abstainTotal.add(power);
        }
      }
      
      // Calculate total voting power and percentages
      const totalVotingPower = yesTotal.add(noTotal).add(abstainTotal);
      let yesPercentage = 0;
      let noPercentage = 0;
      let abstainPercentage = 0;
      
      if (!totalVotingPower.isZero()) {
        yesPercentage = yesTotal.mul(100).div(totalVotingPower).toNumber();
        noPercentage = noTotal.mul(100).div(totalVotingPower).toNumber();
        abstainPercentage = abstainTotal.mul(100).div(totalVotingPower).toNumber();
      }
      
      console.log(`Vote totals from direct query:`, {
        yes: ethers.utils.formatEther(yesTotal),
        no: ethers.utils.formatEther(noTotal),
        abstain: ethers.utils.formatEther(abstainTotal),
        totalVoters: voters.size
      });
      
      return {
        yesVotes: ethers.utils.formatEther(yesTotal),
        noVotes: ethers.utils.formatEther(noTotal),
        abstainVotes: ethers.utils.formatEther(abstainTotal),
        totalVotes: voters.size,
        totalVoters: voters.size,
        yesPercentage,
        noPercentage,
        abstainPercentage,
        yesVotingPower: ethers.utils.formatEther(yesTotal),
        noVotingPower: ethers.utils.formatEther(noTotal),
        abstainVotingPower: ethers.utils.formatEther(abstainTotal),
        totalVotingPower: ethers.utils.formatEther(totalVotingPower),
        source: 'direct-query'
      };
    } catch (error) {
      console.error(`Error in directQueryVotes for proposal ${proposalId}:`, error);
      return null;
    }
  }, [contractsReady, isConnected, contracts]);

  // Get proposal vote totals directly from blockchain
  const getProposalVoteTotals = useCallback(async (proposalId) => {
    if (!contractsReady || !isConnected || !contracts.governance) {
      console.log('Cannot get vote totals - prerequisites not met');
      return {
        yesVotes: "0",
        noVotes: "0", 
        abstainVotes: "0",
        totalVoters: 0,
        yesPercentage: 0,
        noPercentage: 0,
        abstainPercentage: 0,
        yesVotingPower: "0",
        noVotingPower: "0",
        abstainVotingPower: "0",
        totalVotingPower: "0"
      };
    }
    
    try {
      console.log(`Fetching vote totals for proposal ${proposalId} using contract method`);
      
      // Call the contract method to get voting power values
      const [yesVotes, noVotes, abstainVotes, totalVotingPower, totalVoters] = 
        await contracts.governance.getProposalVoteTotals(proposalId);
      
      // Convert BigNumber values to strings
      const formattedYesVotes = ethers.utils.formatEther(yesVotes);
      const formattedNoVotes = ethers.utils.formatEther(noVotes);
      const formattedAbstainVotes = ethers.utils.formatEther(abstainVotes);
      const formattedTotalVotingPower = ethers.utils.formatEther(totalVotingPower);
      
      // Calculate percentages
      let yesPercentage = 0;
      let noPercentage = 0;
      let abstainPercentage = 0;
      
      if (!totalVotingPower.isZero()) {
        yesPercentage = parseFloat(yesVotes.mul(10000).div(totalVotingPower)) / 100;
        noPercentage = parseFloat(noVotes.mul(10000).div(totalVotingPower)) / 100;
        abstainPercentage = parseFloat(abstainVotes.mul(10000).div(totalVotingPower)) / 100;
      }
      
      console.log(`Vote data from contract for proposal ${proposalId}:`, {
        yes: formattedYesVotes,
        no: formattedNoVotes,
        abstain: formattedAbstainVotes,
        totalVoters: totalVoters.toNumber()
      });
      
      return {
        yesVotes: formattedYesVotes,
        noVotes: formattedNoVotes,
        abstainVotes: formattedAbstainVotes,
        totalVotingPower: formattedTotalVotingPower,
        totalVoters: totalVoters.toNumber(),
        yesPercentage,
        noPercentage,
        abstainPercentage,
        yesVotingPower: formattedYesVotes,
        noVotingPower: formattedNoVotes,
        abstainVotingPower: formattedAbstainVotes,
        source: 'contract-getter'
      };
    } catch (error) {
      console.error(`Error using getProposalVoteTotals contract method:`, error);
      
      // If the method fails, fall back to using events
      try {
        // Get all VoteCast events for this proposal
        const filter = contracts.governance.filters.VoteCast(proposalId);
        const events = await contracts.governance.queryFilter(filter);
        console.log(`Using events fallback: Found ${events.length} VoteCast events for proposal ${proposalId}`);
        
        if (events.length === 0) {
          return {
            yesVotes: "0",
            noVotes: "0", 
            abstainVotes: "0",
            totalVoters: 0,
            yesPercentage: 0,
            noPercentage: 0,
            abstainPercentage: 0,
            yesVotingPower: "0",
            noVotingPower: "0",
            abstainVotingPower: "0",
            totalVotingPower: "0",
            source: 'events-empty'
          };
        }
        
        // Process each vote event to calculate totals
        const voterVotes = new Map(); // address -> {voteType, power}
        let yesTotal = ethers.BigNumber.from(0);
        let noTotal = ethers.BigNumber.from(0);
        let abstainTotal = ethers.BigNumber.from(0);
        
        // Process all events and keep track of each voter's latest vote
        for (const event of events) {
          try {
            const voter = event.args.voter.toLowerCase();
            const support = Number(event.args.support);
            const votingPower = event.args.votingPower;
            
            // Update this voter's vote (overwrite previous votes by same address)
            voterVotes.set(voter, { support, votingPower });
          } catch (err) {
            console.warn("Error processing vote event:", err);
          }
        }
        
        // Now calculate totals based on latest vote for each voter
        for (const [, vote] of voterVotes.entries()) {
          if (vote.support === 0) { // Against
            noTotal = noTotal.add(vote.votingPower);
          } else if (vote.support === 1) { // For
            yesTotal = yesTotal.add(vote.votingPower);
          } else if (vote.support === 2) { // Abstain
            abstainTotal = abstainTotal.add(vote.votingPower);
          }
        }
        
        // Calculate total voting power
        const totalVotingPower = yesTotal.add(noTotal).add(abstainTotal);
        
        // Calculate percentages
        let yesPercentage = 0;
        let noPercentage = 0;
        let abstainPercentage = 0;
        
        if (!totalVotingPower.isZero()) {
          yesPercentage = parseFloat(yesTotal.mul(10000).div(totalVotingPower)) / 100;
          noPercentage = parseFloat(noTotal.mul(10000).div(totalVotingPower)) / 100;
          abstainPercentage = parseFloat(abstainTotal.mul(10000).div(totalVotingPower)) / 100;
        }
        
        // Format the values to strings
        const formattedYesVotes = ethers.utils.formatEther(yesTotal);
        const formattedNoVotes = ethers.utils.formatEther(noTotal);
        const formattedAbstainVotes = ethers.utils.formatEther(abstainTotal);
        const formattedTotalVotingPower = ethers.utils.formatEther(totalVotingPower);
        
        console.log(`Vote data from events for proposal ${proposalId}:`, {
          yes: formattedYesVotes,
          no: formattedNoVotes,
          abstain: formattedAbstainVotes,
          totalVoters: voterVotes.size
        });
        
        return {
          yesVotes: formattedYesVotes,
          noVotes: formattedNoVotes,
          abstainVotes: formattedAbstainVotes,
          totalVotingPower: formattedTotalVotingPower,
          totalVoters: voterVotes.size,
          yesPercentage,
          noPercentage,
          abstainPercentage,
          yesVotingPower: formattedYesVotes,
          noVotingPower: formattedNoVotes,
          abstainVotingPower: formattedAbstainVotes,
          source: 'events'
        };
      } catch (fallbackError) {
        console.error(`Error using events fallback for proposal ${proposalId}:`, fallbackError);
        
        // Return zeros as last resort
        return {
          yesVotes: "0",
          noVotes: "0", 
          abstainVotes: "0",
          totalVoters: 0,
          yesPercentage: 0,
          noPercentage: 0,
          abstainPercentage: 0,
          yesVotingPower: "0",
          noVotingPower: "0",
          abstainVotingPower: "0",
          totalVotingPower: "0",
          source: 'error'
        };
      }
    }
  }, [contractsReady, isConnected, contracts]);

  // Enhanced function to get detailed proposal vote information
  const getDetailedProposalVotes = useCallback(async (proposalId) => {
    if (!contractsReady || !isConnected || !contracts.governance) {
      return {
        yesVotes: "0",
        noVotes: "0",
        abstainVotes: "0",
        totalVotes: "0",
        totalVoters: 0,
        yesPercentage: 0,
        noPercentage: 0,
        abstainPercentage: 0,
        quorumReached: false,
        dataSource: 'none'
      };
    }
    
    try {
      console.log(`Fetching detailed vote data for proposal ${proposalId}`);
      
      // First check if we have a manual override
      if (manualVoteOverrides[proposalId]) {
        const override = manualVoteOverrides[proposalId];
        
        // Add quorum info to the override
        const govParams = await contracts.governance.govParams();
        const quorum = govParams.quorum;
        const totalVotingPower = ethers.utils.parseEther(override.totalVotingPower || "0");
        const quorumReached = quorum.gt(0) ? totalVotingPower.gte(quorum) : false;
        
        return {
          ...override,
          quorumReached,
          requiredQuorum: ethers.utils.formatEther(quorum),
          dataSource: 'manual-override'
        };
      }
      
      // Try direct query first (most reliable)
      try {
        const directQueryResults = await directQueryVotes(proposalId);
        if (directQueryResults) {
          // Get quorum value for comparison
          const govParams = await contracts.governance.govParams();
          const quorum = govParams.quorum;
          const totalVotingPower = ethers.utils.parseEther(directQueryResults.totalVotingPower);
          const quorumReached = quorum.gt(0) ? totalVotingPower.gte(quorum) : false;
          
          return {
            ...directQueryResults,
            quorumReached,
            requiredQuorum: ethers.utils.formatEther(quorum),
            dataSource: 'direct-query',
            totalVotes: directQueryResults.totalVotingPower
          };
        }
      } catch (directQueryError) {
        console.warn(`Direct query failed for detailed proposal ${proposalId}:`, directQueryError);
      }
      
      // Try different methods to get the most reliable data
      // Method 1: Direct contract call to getProposalVoteTotals if available
      try {
        const [yesVotes, noVotes, abstainVotes, totalVotingPower, totalVotersCount] = 
          await contracts.governance.getProposalVoteTotals(proposalId);
        
        // Get quorum value for comparison
        const govParams = await contracts.governance.govParams();
        const quorum = govParams.quorum;
        
        // Calculate total votes and percentages
        const totalVotes = yesVotes.add(noVotes).add(abstainVotes);
        const yesPercentage = totalVotes.gt(0) ? parseFloat(yesVotes.mul(100).div(totalVotes)) : 0;
        const noPercentage = totalVotes.gt(0) ? parseFloat(noVotes.mul(100).div(totalVotes)) : 0;
        const abstainPercentage = totalVotes.gt(0) ? parseFloat(abstainVotes.mul(100).div(totalVotes)) : 0;
        
        // Check if quorum is reached
        const quorumReached = totalVotes.gte(quorum);
        
        // Format values
        const formattedYesVotes = ethers.utils.formatEther(yesVotes);
        const formattedNoVotes = ethers.utils.formatEther(noVotes);
        const formattedAbstainVotes = ethers.utils.formatEther(abstainVotes);
        const formattedTotalVotes = ethers.utils.formatEther(totalVotes);
        
        return {
          yesVotes: formattedYesVotes,
          noVotes: formattedNoVotes,
          abstainVotes: formattedAbstainVotes,
          totalVotes: formattedTotalVotes,
          totalVoters: totalVotersCount.toNumber(),
          yesPercentage,
          noPercentage,
          abstainPercentage,
          quorumReached,
          dataSource: 'contract',
          rawYesVotes: yesVotes.toString(),
          rawNoVotes: noVotes.toString(),
          rawAbstainVotes: abstainVotes.toString(),
          rawTotalVotes: totalVotes.toString(),
          requiredQuorum: ethers.utils.formatEther(quorum),
          yesVotingPower: formattedYesVotes,
          noVotingPower: formattedNoVotes,
          abstainVotingPower: formattedAbstainVotes,
          totalVotingPower: formattedTotalVotes
        };
      } catch (directError) {
        console.warn(`Direct getProposalVoteTotals call failed for proposal ${proposalId}:`, directError);
      }
      
      // Continue with fallbacks as in the original code...
      // Method 2: Try to use VoteCast events
      try {
        const filter = contracts.governance.filters.VoteCast(proposalId);
        const events = await contracts.governance.queryFilter(filter);
        console.log(`Found ${events.length} VoteCast events for proposal ${proposalId}`);
        
        // Process events to calculate vote totals
        const voters = new Map(); // To track unique voters
        let yesVotes = ethers.BigNumber.from(0);
        let noVotes = ethers.BigNumber.from(0);
        let abstainVotes = ethers.BigNumber.from(0);
        
        for (const event of events) {
          try {
            const voter = event.args.voter.toLowerCase();
            const support = event.args.support.toNumber();
            const votingPower = event.args.votingPower;
            
            // Update the voter's most recent vote
            voters.set(voter, { support, votingPower });
          } catch (eventError) {
            console.warn("Error processing vote event:", eventError);
          }
        }
        
        // Tally up the votes
        for (const [, vote] of voters.entries()) {
          if (vote.support === 0) { // Against
            noVotes = noVotes.add(vote.votingPower);
          } else if (vote.support === 1) { // For
            yesVotes = yesVotes.add(vote.votingPower);
          } else if (vote.support === 2) { // Abstain
            abstainVotes = abstainVotes.add(vote.votingPower);
          }
        }
        
        // Get quorum value
        const govParams = await contracts.governance.govParams();
        const quorum = govParams.quorum;
        
        // Calculate totals and percentages
        const totalVotes = yesVotes.add(noVotes).add(abstainVotes);
        const yesPercentage = totalVotes.gt(0) ? parseFloat(yesVotes.mul(100).div(totalVotes)) : 0;
        const noPercentage = totalVotes.gt(0) ? parseFloat(noVotes.mul(100).div(totalVotes)) : 0;
        const abstainPercentage = totalVotes.gt(0) ? parseFloat(abstainVotes.mul(100).div(totalVotes)) : 0;
        
        // Check if quorum is reached
        const quorumReached = totalVotes.gte(quorum);
        
        // Format values
        const formattedYesVotes = ethers.utils.formatEther(yesVotes);
        const formattedNoVotes = ethers.utils.formatEther(noVotes);
        const formattedAbstainVotes = ethers.utils.formatEther(abstainVotes);
        const formattedTotalVotes = ethers.utils.formatEther(totalVotes);
        
        return {
          yesVotes: formattedYesVotes,
          noVotes: formattedNoVotes,
          abstainVotes: formattedAbstainVotes,
          totalVotes: formattedTotalVotes,
          totalVoters: voters.size,
          yesPercentage,
          noPercentage,
          abstainPercentage,
          quorumReached,
          dataSource: 'events',
          rawYesVotes: yesVotes.toString(),
          rawNoVotes: noVotes.toString(),
          rawAbstainVotes: abstainVotes.toString(),
          rawTotalVotes: totalVotes.toString(),
          requiredQuorum: ethers.utils.formatEther(quorum),
          yesVotingPower: formattedYesVotes,
          noVotingPower: formattedNoVotes,
          abstainVotingPower: formattedAbstainVotes,
          totalVotingPower: formattedTotalVotes
        };
      } catch (eventsError) {
        console.error(`Error getting vote data from events for proposal ${proposalId}:`, eventsError);
      }
      
      // If user has voted, use their vote data as absolute minimum
      if (account) {
        try {
          console.log(`Checking current user vote for detailed data on proposal ${proposalId}`);
          const filter = contracts.governance.filters.VoteCast(proposalId, account);
          const events = await contracts.governance.queryFilter(filter);
          
          if (events.length > 0) {
            // Use the most recent vote
            const latestEvent = events[events.length - 1];
            const support = latestEvent.args.support.toNumber();
            const votingPower = latestEvent.args.votingPower;
            
            // Create a result based just on this user's vote
            const yesVotes = support === 1 ? votingPower : ethers.BigNumber.from(0);
            const noVotes = support === 0 ? votingPower : ethers.BigNumber.from(0);
            const abstainVotes = support === 2 ? votingPower : ethers.BigNumber.from(0);
            
            // Get quorum value
            const govParams = await contracts.governance.govParams();
            const quorum = govParams.quorum;
            
            // Check if quorum is reached
            const quorumReached = votingPower.gte(quorum);
            
            console.log(`Found user vote for detailed proposal ${proposalId}:`, {
              support,
              power: ethers.utils.formatEther(votingPower)
            });
            
            return {
              yesVotes: ethers.utils.formatEther(yesVotes),
              noVotes: ethers.utils.formatEther(noVotes),
              abstainVotes: ethers.utils.formatEther(abstainVotes),
              totalVotes: ethers.utils.formatEther(votingPower),
              totalVoters: 1,
              yesPercentage: support === 1 ? 100 : 0,
              noPercentage: support === 0 ? 100 : 0,
              abstainPercentage: support === 2 ? 100 : 0,
              quorumReached: quorumReached,
              dataSource: 'user-vote-only',
              rawYesVotes: yesVotes.toString(),
              rawNoVotes: noVotes.toString(),
              rawAbstainVotes: abstainVotes.toString(),
              rawTotalVotes: votingPower.toString(),
              requiredQuorum: ethers.utils.formatEther(quorum),
              yesVotingPower: ethers.utils.formatEther(yesVotes),
              noVotingPower: ethers.utils.formatEther(noVotes),
              abstainVotingPower: ethers.utils.formatEther(abstainVotes),
              totalVotingPower: ethers.utils.formatEther(votingPower)
            };
          }
        } catch (userVoteError) {
          console.warn(`Error checking user vote for detailed proposal ${proposalId}:`, userVoteError);
        }
      }
      
      // If all methods fail, return zeros
      return {
        yesVotes: "0",
        noVotes: "0",
        abstainVotes: "0",
        totalVotes: "0",
        totalVoters: 0,
        yesPercentage: 0,
        noPercentage: 0,
        abstainPercentage: 0,
        quorumReached: false,
        dataSource: 'fallback'
      };
    } catch (error) {
      console.error(`Error in getDetailedProposalVotes for proposal ${proposalId}:`, error);
      return {
        yesVotes: "0",
        noVotes: "0",
        abstainVotes: "0",
        totalVotes: "0",
        totalVoters: 0,
        yesPercentage: 0,
        noPercentage: 0,
        abstainPercentage: 0,
        quorumReached: false,
        dataSource: 'error'
      };
    }
  }, [contractsReady, isConnected, contracts, directQueryVotes, account]);

  // IMPROVED: Calculate participation rate with more accurate method
  const calculateParticipationRate = useCallback(async () => {
    if (!contractsReady || !isConnected || !contracts.governance || !contracts.justToken) {
      console.log('Cannot calculate participation rate - prerequisites not met');
      return 0;
    }
    
    try {
      console.log("Calculating accurate participation rate...");
      
      // Get total supply to understand the total potential voting power
      const totalSupply = await contracts.justToken.totalSupply();
      console.log(`Total token supply: ${ethers.utils.formatEther(totalSupply)}`);
      
      // Track completed proposals and voting statistics
      let completedProposalCount = 0;
      let totalVotingPowerUsed = ethers.BigNumber.from(0);
      let cumulativeParticipationRate = 0;
      
      // Find the maximum proposal ID to iterate through
      const maxProposalId = 100; // You can adjust this based on your needs
      
      // Only consider completed proposals (Succeeded, Queued, Executed, Defeated, Expired)
      // These states have the following codes: 2 (Defeated), 3 (Succeeded), 4 (Queued), 5 (Executed), 6 (Expired)
      const relevantStates = [2, 3, 4, 5, 6];
      
      for (let proposalId = 0; proposalId < maxProposalId; proposalId++) {
        try {
          // Check if the proposal exists and what state it's in
          const state = await contracts.governance.getProposalState(proposalId);
          const stateNum = typeof state === 'object' && state.toNumber 
            ? state.toNumber() 
            : Number(state);
          
          // Skip proposals that are not in a completed state (active or canceled)
          if (!relevantStates.includes(stateNum)) {
            console.log(`Proposal #${proposalId}: Skipping state ${stateNum} (not completed)`);
            continue;
          }
          
          // Count this as a completed proposal
          completedProposalCount++;
          
          // Get the snapshot ID used for this proposal to determine eligible voters
          let snapshotId;
          
          snapshotId = await getProposalSnapshotId(proposalId);
          
          // Get voting totals for this proposal
          try {
            // Try to get the vote totals directly from the contract
            const [forVotes, againstVotes, abstainVotes, totalVotingPower, voterCount] = 
              await contracts.governance.getProposalVoteTotals(proposalId);
            
            // If total voting power is defined, use it
            if (totalVotingPower && !totalVotingPower.isZero()) {
              totalVotingPowerUsed = totalVotingPowerUsed.add(totalVotingPower);
              
              // Calculate total eligible voting power from the snapshot
              let totalEligiblePower;
              try {
                // Try to get the total voting power from the snapshot
                totalEligiblePower = await contracts.justToken.totalSupplyAt(snapshotId);
              } catch (error) {
                console.warn(`Error getting total supply at snapshot ${snapshotId}:`, error);
                // Fallback to using the current total supply
                totalEligiblePower = totalSupply;
              }
              
              // Calculate participation rate for this proposal
              const proposalParticipationRate = totalVotingPower.gt(0) && totalEligiblePower.gt(0)
                ? totalVotingPower.mul(100).div(totalEligiblePower).toNumber() / 100
                : 0;
              
              cumulativeParticipationRate += proposalParticipationRate;
              
              console.log(`Proposal #${proposalId}: Participation rate: ${proposalParticipationRate * 100}%`);
            } else {
              console.log(`Proposal #${proposalId}: No voting power data available`);
            }
          } catch (error) {
            console.warn(`Error getting vote totals for proposal ${proposalId}:`, error);
            
            // Fallback to using VoteCast events
            try {
              const filter = contracts.governance.filters.VoteCast(proposalId);
              const voteEvents = await contracts.governance.queryFilter(filter);
              
              if (voteEvents.length > 0) {
                let proposalVotingPower = ethers.BigNumber.from(0);
                const uniqueVoters = new Set();
                
                // Sum up the voting power from all votes
                for (const event of voteEvents) {
                  try {
                    const voter = event.args.voter.toLowerCase();
                    uniqueVoters.add(voter);
                    
                    const votingPower = event.args.votingPower || event.args.weight;
                    if (votingPower) {
                      proposalVotingPower = proposalVotingPower.add(votingPower);
                    }
                  } catch (e) {
                    console.warn("Error processing vote event:", e);
                  }
                }
                
                totalVotingPowerUsed = totalVotingPowerUsed.add(proposalVotingPower);
                
                // Calculate total eligible voting power from the snapshot
                let totalEligiblePower;
                try {
                  totalEligiblePower = await contracts.justToken.totalSupplyAt(snapshotId);
                } catch (error) {
                  totalEligiblePower = totalSupply;
                }
                
                // Calculate participation rate for this proposal
                const proposalParticipationRate = proposalVotingPower.gt(0) && totalEligiblePower.gt(0)
                  ? proposalVotingPower.mul(100).div(totalEligiblePower).toNumber() / 100
                  : 0;
                
                cumulativeParticipationRate += proposalParticipationRate;
                
                console.log(`Proposal #${proposalId}: Participation rate from events: ${proposalParticipationRate * 100}%`);
              }
            } catch (eventError) {
              console.warn(`Error getting vote events for proposal ${proposalId}:`, eventError);
            }
          }
        } catch (error) {
          // Skip proposals that don't exist or can't be accessed
          continue;
        }
      }
      
      // Calculate the average participation rate across all completed proposals
      let finalParticipationRate = 0;
      if (completedProposalCount > 0) {
        finalParticipationRate = cumulativeParticipationRate / completedProposalCount;
      }
      
      console.log(`Final participation rate calculation:
        - Total completed proposals: ${completedProposalCount}
        - Average participation rate: ${finalParticipationRate * 100}%`);
      
      return finalParticipationRate;
    } catch (error) {
      console.error("Error calculating participation rate:", error);
      return 0;
    }
  }, [contractsReady, isConnected, contracts]);

  // Get DAO statistics from blockchain - updated with improved participation rate
  const fetchDAOStats = useCallback(async () => {
    if (!contractsReady || !isConnected) {
      return {
        totalHolders: 0,
        circulatingSupply: "0",
        activeProposals: 0,
        totalProposals: 0,
        participationRate: 0,
        delegationRate: 0,
        proposalSuccessRate: 0
      };
    }

    try {
      // 1. Get total supply
      const totalSupply = await contracts.justToken.totalSupply();
      const circulatingSupply = ethers.utils.formatEther(totalSupply);
      
      // 2. Estimate holder count using Transfer events
      let totalHolders = 0;
      try {
        // Get Transfer events to estimate unique holders
        const filter = contracts.justToken.filters.Transfer();
        const blockNumber = await provider.getBlockNumber();
        const fromBlock = Math.max(0, blockNumber - 10000);
        
        const events = await contracts.justToken.queryFilter(filter, fromBlock);
        
        // Get unique addresses from transfer events
        const uniqueAddresses = new Set();
        
        for (const event of events) {
          if (event.args) {
            if (event.args.from !== ethers.constants.AddressZero) {
              uniqueAddresses.add(event.args.from.toLowerCase());
            }
            if (event.args.to !== ethers.constants.AddressZero) {
              uniqueAddresses.add(event.args.to.toLowerCase());
            }
          }
        }
        
        totalHolders = uniqueAddresses.size || 10; // Default to 10 if we can't determine
      } catch (error) {
        console.error("Error estimating holder count:", error);
        totalHolders = 10; // Fallback value
      }
      
      // 3. Count active and total proposals
      let activeProposals = 0;
      let totalProposals = 0;
      let proposalSuccessRate = 0;
      
      try {
        // Try to get proposal count directly
        if (typeof contracts.governance.getProposalCount === 'function') {
          totalProposals = (await contracts.governance.getProposalCount()).toNumber();
        } else {
          // Find highest valid proposal ID
          let highestId = 0;
          let testId = 0;
          let foundInvalid = false;
          
          while (!foundInvalid && testId < 100) {
            try {
              await contracts.governance.getProposalState(testId);
              highestId = testId;
              testId++;
            } catch (err) {
              foundInvalid = true;
            }
          }
          
          totalProposals = highestId + 1;
        }
        
        // Count active and successful proposals
        let successfulProposals = 0;
        
        for (let i = 0; i < totalProposals; i++) {
          try {
            const state = await contracts.governance.getProposalState(i);
            
            if (state === 0) { // Active state is usually 0
              activeProposals++;
            }
            
            // States 3, 4, 5 typically represent success states
            if (state === 3 || state === 4 || state === 5) {
              successfulProposals++;
            }
          } catch (err) {
            // Skip if error
          }
        }
        
        // Calculate success rate
        const completedProposals = totalProposals - activeProposals;
        proposalSuccessRate = completedProposals > 0 ? successfulProposals / completedProposals : 0;
      } catch (error) {
        console.error("Error counting proposals:", error);
      }
      
      // 4. Calculate improved participation rate
      const participationRate = await calculateParticipationRate();
      
      // 5. Estimate delegation rate
      let delegationRate = 0;
      
      try {
        // Try to get snapshot metrics if available
        if (typeof contracts.justToken.getCurrentSnapshotId === 'function') {
          const snapshotId = await contracts.justToken.getCurrentSnapshotId();
          
          if (typeof contracts.justToken.getSnapshotMetrics === 'function') {
            try {
              const metrics = await contracts.justToken.getSnapshotMetrics(snapshotId);
              
              // Extract metrics based on return type
              if (Array.isArray(metrics)) {
                // Array format - typically index 4 is delegation percentage
                delegationRate = metrics[4] ? parseFloat(metrics[4].toString()) / 10000 : 0;
              } else if (metrics && metrics.percentageDelegated) {
                // Object format
                delegationRate = parseFloat(metrics.percentageDelegated.toString()) / 10000;
              }
            } catch (err) {
              console.warn("Error getting snapshot metrics:", err);
            }
          }
        }
        
        // Estimate participation rate from VoteCast events (fallback method)
        if (delegationRate === 0) {
          try {
            // Try to calculate delegation rate from delegated tokens
            let delegatedTokens = ethers.BigNumber.from(0);
            let seenDelegates = new Set();
            
            // Check all known accounts
            for (let i = 0; i < 20; i++) { // Check a reasonable number of common addresses
              try {
                const testAddr = ethers.utils.getAddress(
                  ethers.utils.hexZeroPad(ethers.utils.hexlify(i + 1), 20)
                );
                
                const delegate = await contracts.justToken.getDelegate(testAddr);
                // Only count if delegated to someone else (not self)
                if (delegate !== testAddr && delegate !== ethers.constants.AddressZero && !seenDelegates.has(delegate)) {
                  seenDelegates.add(delegate);
                  
                  const tokensDelegated = await contracts.justToken.getDelegatedToAddress(delegate);
                  delegatedTokens = delegatedTokens.add(tokensDelegated);
                }
              } catch (err) {
                // Skip errors
              }
            }
            
            // Calculate percentage from total supply
            if (!totalSupply.isZero()) {
              delegationRate = parseFloat(delegatedTokens.mul(100).div(totalSupply)) / 100;
            }
          } catch (error) {
            console.error("Error estimating delegation rate:", error);
          }
        }
      } catch (error) {
        console.error("Error estimating delegation rate:", error);
      }
      
      // Format percentages
      const formattedParticipationRate = `${(participationRate * 100).toFixed(1)}%`;
      const formattedDelegationRate = `${(delegationRate * 100).toFixed(1)}%`;
      const formattedSuccessRate = `${(proposalSuccessRate * 100).toFixed(1)}%`;
      
      return {
        totalHolders,
        circulatingSupply,
        activeProposals,
        totalProposals,
        participationRate,
        delegationRate,
        proposalSuccessRate,
        formattedParticipationRate,
        formattedDelegationRate,
        formattedSuccessRate
      };
    } catch (error) {
      console.error("Error fetching DAO stats:", error);
      return {
        totalHolders: 0,
        circulatingSupply: "0",
        activeProposals: 0,
        totalProposals: 0,
        participationRate: 0,
        delegationRate: 0,
        proposalSuccessRate: 0,
        formattedParticipationRate: "0.0%",
        formattedDelegationRate: "0.0%",
        formattedSuccessRate: "0.0%"
      };
    }
  }, [contractsReady, isConnected, contracts, provider, calculateParticipationRate]);

  // FIX: Enhanced fetchUserData function to properly handle delegation status and unmounting
  const fetchUserData = useCallback(async (isMountedCheck = () => true) => {
    if (!contractsReady || !isConnected || !account) return;
    
    try {
      if (isMountedCheck()) setIsLoading(true);
      
      // Get balance
      const balance = await getTokenBalance(account);
      
      // Get delegation info
      const delegationInfo = await getDelegationInfo(account);
      
      // Get the transitive delegation chain
      const delegationChain = await getTransitiveDelegationChain(account);
      console.log("User's delegation chain:", delegationChain);
     // Get on-chain voting power directly from contract
let onChainVotingPower = "0";
try {
  // Check if the user is self-delegated first
  const isSelfDelegated = 
    delegationInfo.currentDelegate === account || 
    delegationInfo.currentDelegate === ethers.constants.AddressZero;
    
  if (isSelfDelegated) {
    // Only get effective voting power if self-delegated
    const snapshotId = await contracts.justToken.getCurrentSnapshotId();
    const votingPowerBN = await contracts.justToken.getEffectiveVotingPower(account, snapshotId);
    onChainVotingPower = ethers.utils.formatEther(votingPowerBN);
  } else {
    // If delegated to someone else, voting power is 0
    console.log(`User ${account} has delegated to ${delegationInfo.currentDelegate}, voting power is 0`);
    onChainVotingPower = "0";
  }
} catch (vpError) {
  console.error("Error getting on-chain voting power:", vpError);
  // Fall back to calculated voting power
  if (delegationInfo.currentDelegate === account || 
      delegationInfo.currentDelegate === ethers.constants.AddressZero) {
    // Self-delegated - calculate voting power 
    const ownBalanceBN = ethers.utils.parseEther(balance);
    const delegatedBN = ethers.utils.parseEther(delegationInfo.delegatedToYou);
    onChainVotingPower = ethers.utils.formatEther(ownBalanceBN.add(delegatedBN));
  } else {
    // If delegated to someone else, voting power is 0
    onChainVotingPower = "0";
  }
}
      
      // Calculate local voting power based on delegation status
      const isSelfDelegated = 
        delegationInfo.currentDelegate === account || 
        delegationInfo.currentDelegate === ethers.constants.AddressZero ||
        !delegationInfo.currentDelegate;
      
      // FIX: If not self-delegated, voting power should be 0
      const localVotingPower = isSelfDelegated ? 
        (parseFloat(balance) + parseFloat(delegationInfo.delegatedToYou)).toString() : 
        "0";
        
      // Get voted proposals
      const votedProposals = await getVotedProposals();
      
      // Update user data state only if component is still mounted
      if (isMountedCheck()) {
        setUserData({
          address: account,
          balance,
          votingPower: localVotingPower,      // Local calculation
          onChainVotingPower,                 // Direct from contract
          delegate: delegationInfo.currentDelegate,
          lockedTokens: delegationInfo.lockedTokens,
          delegatedToYou: delegationInfo.delegatedToYou,
          delegators: delegationInfo.delegators,
          hasVotedProposals: votedProposals,
          isSelfDelegated,
          delegationChain // Add the delegation chain for transitive delegation tracking
        });
      }
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (isMountedCheck()) setError("Failed to load user data from blockchain");
    } finally {
      if (isMountedCheck()) setIsLoading(false);
    }
  }, [
    contractsReady, 
    isConnected, 
    account, 
    getTokenBalance, 
    getDelegationInfo, 
    getVotedProposals,
    getTransitiveDelegationChain,
    contracts
  ]);

  // Function to manually refresh data
  const refreshData = useCallback(() => {
    setManualRefreshCounter(prev => prev + 1);
  }, []);

  // FIX: Load all data when connected and contracts ready with proper cleanup
  useEffect(() => {
    let isMounted = true; // Flag to track if component is mounted
    
    if (isConnected && contractsReady) {
      console.log("Loading blockchain data...");
      
      // Load all data with slight staggered timing to avoid overwhelming RPC
      const loadData = async () => {
        try {
          if (isMounted) setIsLoading(true);
          
          // Fetch user data first - passing isMounted check function
          if (isMounted) await fetchUserData(() => isMounted);
          
          // Small delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Fetch DAO stats and only update state if still mounted
          const stats = await fetchDAOStats();
          if (isMounted) setDaoStats(stats);
          
        } catch (error) {
          console.error("Error loading blockchain data:", error);
          if (isMounted) setError("Failed to load data from blockchain");
        } finally {
          if (isMounted) setIsLoading(false);
        }
      };
      
      loadData();
    }
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [
    isConnected, 
    contractsReady, 
    fetchUserData, 
    fetchDAOStats, 
    refreshCounter, 
    manualRefreshCounter,
    account
  ]);

  // Context value with added transitive delegation functions
  const value = {
    userData,
    daoStats,
    isLoading,
    error,
    refreshData,
    hasVoted,
    getVotingPower,
    getVotingPowerDetails,
    getProposalVoteTotals, 
    getDetailedProposalVotes,
    getTransitiveDelegationChain, // Export the chain function to help with delegation tracking
    calculateTransitiveVotingPower // NEW: Export the transitive voting power calculation
  };

  return (
    <BlockchainDataContext.Provider value={value}>
      {children}
    </BlockchainDataContext.Provider>
  );
};

// Custom hook to use the context
export const useBlockchainData = () => {
  const context = useContext(BlockchainDataContext);
  if (!context) {
    throw new Error('useBlockchainData must be used within a BlockchainDataProvider');
  }
  return context;
};
