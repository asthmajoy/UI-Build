import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CoinsIcon,
  BarChart4,
  Users,
  TrendingUp,
  CircleDollarSign,
  Network,
  FileText,
  Shield,
  Scale,
  Lock,
  Unlock,
  History,
  Check,
  ChevronDown,
  ChevronRight,
  Gauge,
  Award,
  Activity,
  Layers,
  Focus,
  UserPlus,
  CreditCard,
  PieChart,
  Landmark,
  Repeat,
  AlertTriangle,
  ExternalLink,
  Info,
  ArrowRight,
  VoteIcon,
  LineChart,
  ArrowUpRight,
  Clock,
  GitBranch,
  LucideHelpingHand,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { useBlockchainData } from '../contexts/BlockchainDataContext';
import { useDAOStats } from '../hooks/useDAOStats';
import { ethers } from 'ethers';

// Collapsible component for expandable sections - with overflow handling
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-200 ${className}`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />}
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
        <button 
          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-transform duration-200"
          aria-expanded={isOpen}
          style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          type="button"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
      
      <div 
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight || 1000}px` : '0',
          opacity: isOpen ? 1 : 0 
        }}
      >
        <div className="p-6 pt-2 border-t border-gray-100 dark:border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
};

// Static card component for non-collapsible sections
const StaticCard = ({ title, icon: Icon, children, className = "", gradient = false, accentBorder = false }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border ${accentBorder ? 'border-l-4 border-l-indigo-500 dark:border-l-indigo-400' : 'border-gray-200 dark:border-gray-700'} shadow-sm overflow-hidden ${gradient ? 'bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20' : ''} ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          {Icon && <Icon className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />}
          <h3 className="font-medium text-xl text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

// Card component for token metrics - with responsive adjustments
const MetricCard = ({ title, value, icon: Icon, trend, trendValue, isLoading, className = "", iconColor = "text-indigo-500 dark:text-indigo-400" }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
      </div>
      
      {isLoading ? (
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      ) : (
        <div className="flex items-end">
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          
          {trend && (
            <div className={`ml-2 mb-1 flex items-center text-sm ${
              trend === 'up' ? 'text-green-500 dark:text-green-400' : 
              trend === 'down' ? 'text-red-500 dark:text-red-400' : 
              'text-gray-500 dark:text-gray-400'
            }`}>
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : trend === 'down' ? (
                <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
              ) : (
                <ArrowRight className="h-3 w-3 mr-1" />
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Process visualization component - steps in token/voting lifecycle - with improved responsive layout
const ProcessFlow = ({ steps }) => {
  return (
    <div className="space-y-6 relative">
      {/* Flow line with rounded caps */}
      <div className="absolute top-8 bottom-4 left-5 w-0.5 bg-indigo-200 dark:bg-indigo-800 ml-0.5 rounded-full"></div>
      <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-indigo-400 dark:bg-indigo-500 ml-px"></div>
      
      {steps.map((step, index, array) => {
        // Determine the icon color based on index for visual variety
        const iconColors = [
          "text-indigo-600 dark:text-indigo-400", 
          "text-purple-600 dark:text-purple-400", 
          "text-blue-600 dark:text-blue-400", 
          "text-teal-600 dark:text-teal-400"
        ];
        const iconColor = iconColors[index % iconColors.length];
        
        // Determine border colors
        const borderColors = [
          "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/50",
          "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/50",
          "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/50",
          "border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/50"
        ];
        const borderColor = borderColors[index % borderColors.length];
        
        return (
          <div key={index} className="relative pl-16">
            <div className={`absolute left-0 top-1 flex h-12 w-12 items-center justify-center rounded-full border ${borderColor}`}>
              {step.icon && <step.icon className={`h-5 w-5 ${iconColor}`} />}
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">{step.title}</h4>
              <p className="mt-1 text-gray-600 dark:text-gray-400">{step.description}</p>
              
              {step.details && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md border border-gray-100 dark:border-gray-800">
                  {step.details}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Copy Button component with visual feedback
const CopyButton = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);
  
  // Memoize the copy function to prevent unnecessary re-renders
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [textToCopy]);
  
  return (
    <button 
      className={`p-1.5 rounded transition-all duration-200 flex-shrink-0 ${
        copied 
          ? 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/50' 
          : 'bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/50'
      }`}
      onClick={handleCopy}
      type="button"
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
};

// TokenTabContent component with improved responsive design
const TokenTabContent = ({ navigateToAppSection }) => {
  // Get web3 and blockchain data contexts
  const { account, isConnected, connectWallet, provider, contracts } = useWeb3();
  const { userData, daoStats, refreshData, getVotingPowerDetails } = useBlockchainData();
  const daoTokenStats = useDAOStats();
  
  // Add mounted ref to prevent memory leaks
  const isMounted = useRef(true);
  
  // Local state
  const [tokenMetrics, setTokenMetrics] = useState({
    totalSupply: "0",
    maxSupply: "0",
    delegationRate: 0,
    activeHolders: 0,
    treasuryBalance: "0"
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [votingPowerDetails, setVotingPowerDetails] = useState(null);
  
  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Fetch token metrics from blockchain
  useEffect(() => {
    const fetchTokenMetrics = async () => {
      if (!isConnected || !contracts.justToken) {
        if (isMounted.current) setIsLoading(false);
        return;
      }
      
      try {
        if (isMounted.current) setIsLoading(true);
        
        // Get data from contracts
        const [maxSupply, totalSupply, currentSnapshotId] = await Promise.all([
          contracts.justToken.maxTokenSupply().catch(() => ethers.BigNumber.from(0)),
          contracts.justToken.totalSupply().catch(() => ethers.BigNumber.from(0)),
          contracts.justToken.getCurrentSnapshotId().catch(() => ethers.BigNumber.from(0))
        ]);
        
        // Check if still mounted before continuing
        if (!isMounted.current) return;
        
        // Try to get snapshot metrics if available
        let metrics = {
          activeHolders: 0,
          activeDelegates: 0,
          totalDelegated: "0",
          percentageDelegated: 0
        };
        
        try {
          const snapshotMetrics = await contracts.justToken.getSnapshotMetrics(currentSnapshotId);
          
          // Check if still mounted before continuing
          if (!isMounted.current) return;
          
          metrics = {
            activeHolders: snapshotMetrics[1].toString(),
            activeDelegates: snapshotMetrics[2].toString(),
            totalDelegated: ethers.utils.formatEther(snapshotMetrics[3]),
            percentageDelegated: (snapshotMetrics[4].toNumber() / 100).toFixed(2)
          };
        } catch (error) {
          console.error("Error fetching snapshot metrics:", error);
        }
        
        // Try to get treasury balance
        let treasuryBalance = "0";
        try {
          if (contracts.timelock?.address) {
            const balance = await contracts.justToken.balanceOf(contracts.timelock.address);
            
            // Check if still mounted before continuing
            if (!isMounted.current) return;
            
            treasuryBalance = ethers.utils.formatEther(balance);
          }
        } catch (error) {
          console.error("Error fetching treasury balance:", error);
        }
        
        // Final check if still mounted before updating state
        if (!isMounted.current) return;
        
        setTokenMetrics({
          totalSupply: ethers.utils.formatEther(totalSupply),
          maxSupply: ethers.utils.formatEther(maxSupply),
          delegationRate: metrics.percentageDelegated,
          activeHolders: metrics.activeHolders,
          activeDelegates: metrics.activeDelegates,
          totalDelegated: metrics.totalDelegated,
          treasuryBalance
        });
      } catch (error) {
        console.error("Error fetching token metrics:", error);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };
    
    fetchTokenMetrics();
  }, [isConnected, contracts, refreshData]);
  
  // Fetch voting power details for the connected account
  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!isConnected || !account) return;
      
      try {
        // Get detailed voting power info
        const details = await getVotingPowerDetails(account);
        
        // Check if still mounted before updating state
        if (isMounted.current) {
          setVotingPowerDetails(details);
        }
      } catch (error) {
        console.error("Error fetching account details:", error);
      }
    };
    
    fetchAccountDetails();
  }, [isConnected, account, getVotingPowerDetails]);
  
  // Format numbers for display
  const formatNumber = (value, decimals = 2) => {
    if (!value) return "0";
    
    const num = parseFloat(value);
    
    if (num === 0) return "0";
    if (num < 0.01) return "<0.01";
    
    return num.toLocaleString(undefined, {
      maximumFractionDigits: decimals
    });
  };
  
  // Token governance utility steps
  const tokenUtilitySteps = [
    {
      icon: VoteIcon,
      title: "Voting & Governance",
      description: "JST tokens represent rights within JustDAO's governance system.",
      details: "JST are ERC20 upgradeable tokens that grant holders the ability to propose, vote on, and influence key decisions within the DAO. Beyond governance, they also serve utility functions inside the DAO ecosystem. "
    },
    {
      icon: Users,
      title: "Delegation Mechanism",
      description: "Token holders can delegate their voting power to community representatives.",
      details: "Delegation locks your tokens but they remain in your wallet while your voting power is transferred to a delegate who you trust to vote on your behalf, increasing overall participation and expert involvement."
    },
    {
      icon: Shield,
      title: "Proposal Creation",
      description: "Token holders can create governance proposals that the community votes on.",
      details: "Creating a proposal requires holding a minimum threshold of tokens to prevent spam and ensure quality. Proposers stake tokens that are returned based on proposal outcome."
    },
    {
      icon: Landmark,
      title: "Treasury Management",
      description: "The DAO treasury is governed by token holders through voting.",
      details: "Funds in the treasury are allocated to legal aid providers based on community decisions, ensuring transparent and accountable distribution of resources."
    }
  ];
  
  return (
    // Added container with overflow control
    <div className="space-y-8 max-w-full overflow-x-hidden">
      {/* Token Overview Section */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">JST Token: <span className="text-indigo-600 dark:text-indigo-400">Enabling Legal Access</span></h2>
        <p className="mt-4 text-base md:text-lg text-gray-600 dark:text-gray-300">
          The <strong>JustToken (JST)</strong> is more than a governance token—it <em className="text-gray-700 dark:text-gray-300">funds legal empowerment</em>. By participating in JustDAO, token holders directly contribute to breaking down barriers in legal aid access, enabling community-driven justice through accountable mechanisms.
        </p>
      </div>
      
      {/* Token Metrics Grid - Improved responsive layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Supply"
          value={formatNumber(tokenMetrics.totalSupply)}
          icon={CoinsIcon}
          iconColor="text-purple-500 dark:text-purple-400"
          isLoading={isLoading}
        />
        <MetricCard
          title="Max Supply"
          value={formatNumber(tokenMetrics.maxSupply)}
          icon={PieChart}
          iconColor="text-blue-500 dark:text-blue-400"
          isLoading={isLoading}
        />
        <MetricCard
          title="Active Holders"
          value={formatNumber(tokenMetrics.activeHolders, 0)}
          icon={Users}
          iconColor="text-emerald-500 dark:text-emerald-400"
          isLoading={isLoading}
        />
        <MetricCard
          title="Delegation Rate"
          value={`${formatNumber(tokenMetrics.delegationRate)}%`}
          icon={GitBranch}
          iconColor="text-amber-500 dark:text-amber-400"
          isLoading={isLoading}
        />
      </div>
      
      {/* Token Acquisition Section - Improved responsive layout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-indigo-100 dark:border-indigo-900/30 mb-8">
        <div className="px-4 sm:px-7 py-6 sm:py-8 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 text-gray-800 dark:text-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0 mb-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shadow-sm flex-shrink-0">
              <CoinsIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold"><em>Democratize Justice, One Donation at a Time</em></h3>
          </div>
          <div className="space-y-5">
            <p className="text-base sm:text-lg">
              <strong>Immediate Impact:</strong> Donate ETH directly to our token contract and instantly mint JST tokens. Each contribution becomes a <em>vehicle for positive change</em>, supporting individuals who lack access to legal resources.
            </p>
            <div className="pt-5 border-t border-indigo-100 dark:border-indigo-900/30">
              <h4 className="font-semibold mb-3 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                Transparent Minting Process:
              </h4>
              <ul className="ml-6 list-disc space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Direct Contribution:</strong> Send any amount of ETH to our token contract</li>
                <li><strong>Instant Conversion:</strong> Receive JST tokens at a 1:1 ratio instantly</li>
                <li><strong>Zero Overhead:</strong> No gas-intensive minting process, just a simple transfer</li>
                <li><strong>Immediate Support:</strong> Your contribution immediately helps fund legal aid initiatives</li>
              </ul>
            </div>
			<div className="pt-3">
			  <div className="font-mono text-xs sm:text-sm bg-white/80 dark:bg-gray-800/80 p-3 rounded-md inline-flex items-center border border-indigo-100 dark:border-indigo-900/30 shadow-sm max-w-full overflow-x-auto">
				<div className="flex items-center">
				  <span className="mr-2 whitespace-nowrap">Contract:</span>
				  <span className="text-indigo-600 dark:text-indigo-400 mr-2 break-all">
					{process.env.REACT_APP_TOKEN_ADDRESS || "Could not load token address!"}
				  </span>
				  <CopyButton textToCopy={process.env.REACT_APP_TOKEN_ADDRESS || "Could not load token address!"} />
				</div>
			  </div>
			</div>
          </div>
        </div>
        <div className="bg-indigo-600 dark:bg-indigo-700 px-6 py-4">
          <div className="flex justify-between items-center text-white">
            <span className="text-sm px-3 py-1.5 bg-white/20 rounded-full font-medium">1 ETH = 1 JST</span>
          </div>
        </div>
      </div>
      
      {/* Token Utility Section */}
      <CollapsibleSection 
        title="Token Utility" 
        icon={Layers}
        defaultOpen={true}
      >
        <ProcessFlow steps={tokenUtilitySteps} />
      </CollapsibleSection>
      
      {/* Voting Power Mechanics Section */}
      <CollapsibleSection 
        title="Voting Power Mechanics" 
        icon={VoteIcon}
        className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400"
      >
        <div className="mb-5">
          <p className="text-gray-700 dark:text-gray-300">
            Understanding how voting works in <strong>JustDAO</strong> is important for effective participation. Your voting power is determined by smart contract calculations that accounts for both direct holdings, chain delegations, and transitive relationships.
          </p>
        </div>
        
        <ProcessFlow steps={[
          {
            icon: BarChart4,
            title: "Token Holding",
            description: "All JST holders can vote on proposals with any token amount.",
            details: "Unlike proposal creation which requires minimum token holdings, voting is accessible to everyone holding JST tokens. Every token (or fractional share) counts in the governance process."
          },
          {
            icon: GitBranch,
            title: "Delegation",
            description: "Voting power can flow from one address to another through delegation.",
            details: "When you delegate to someone, they receive your voting power. If they've delegated to someone else, your power flows through them to the final delegate."
          },
          {
            icon: Clock,
            title: "Snapshots",
            description: "Voting power is determined at specific blockchain points called snapshots.",
            details: "When a proposal is created, the system takes a snapshot of token balances and delegations. Your voting power for that proposal is fixed at that moment."
          },
          {
            icon: Award,
            title: "Effective Voting Power",
            description: "Your effective voting power combines your balance and incoming delegations.",
            details: "Total voting power = Your token balance + Tokens delegated to you (either directly or through transitive delegation chains)."
          }
        ]} />
      </CollapsibleSection>
      
      {/* Token Economics Section - Made non-collapsible */}
      <StaticCard 
        title="Token Economics" 
        icon={CircleDollarSign}
        iconColor="text-green-500 dark:text-green-400"
        className="mb-8"
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Token Supply</h4>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 dark:text-gray-300">Current Supply</span>
                <span className="text-gray-900 dark:text-white font-medium">{formatNumber(tokenMetrics.totalSupply)} JST</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-in-out"
                  style={{
                    width: `${Math.min(100, (parseFloat(tokenMetrics.totalSupply) / parseFloat(tokenMetrics.maxSupply)) * 100)}%`
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>0 JST</span>
                <span>{formatNumber(tokenMetrics.maxSupply)} JST</span>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              JST has a maximum supply of {formatNumber(tokenMetrics.maxSupply)} tokens, with {formatNumber(tokenMetrics.totalSupply)} currently in circulation. New tokens are minted when users contribute ETH to the <strong>JustDAO</strong> Token contract.
            </p>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Treasury Allocation</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Funds in the JustDAO treasury are allocated to legal aid initiatives through governance proposals. The treasury currently holds {formatNumber(tokenMetrics.treasuryBalance)} JST.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50/70 dark:from-purple-900/30 dark:to-indigo-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-900/30 shadow-sm">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Legal Aid</h5>
                <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">80%</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 dark:from-blue-900/30 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 shadow-sm">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Protocol Development</h5>
                <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">10%</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/30 shadow-sm">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operational Costs</h5>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400">10%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">What's it Worth?</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
            JST serves as a utility token within the JustDAO ecosystem, providing holders with participatory governance rights over the DAO's treasury and selection of initiatives aimed at expanding access to legal services.            </p>
            
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Voting Power</strong> proportional to holdings and delegation
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Social impact</strong> through directing resources to legal aid
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-purple-500 dark:text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Community participation</strong> in transformative legal empowerment
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Protocol upsides</strong> system upgrades benefit current JST holders  
                </span>
              </li>
            </ul>
          </div>
        </div>
      </StaticCard>
      
      {/* Legal Disclosure Section - Improved responsive layout */}
      <StaticCard 
        title="Token Disclosure" 
        icon={ShieldAlert}
        iconColor="text-orange-500 dark:text-orange-400"
        className="mb-12 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-800 dark:to-orange-900/10"
      >
        <div className="bg-white/80 dark:bg-gray-800/60 p-6 rounded-lg border border-orange-100 dark:border-orange-900/30 shadow-md mb-6">
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-lg">
              <h5 className="font-medium text-orange-700 dark:text-orange-300 mb-2">
                Token Nature
              </h5>
              <p className="text-sm">
              <strong>  Tokens in JustDAO are <em>purely symbolic</em>, they represent:</strong>
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                <li>No monetary value</li>
                <li>No investment potential</li>
                <li>No financial rights</li>
              </ul>
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg">
              <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                Regulatory Disclaimer
              </h5>
              <p className="text-sm">
                <strong> The legal status of tokens and DAOs is evolving, participants:</strong>
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                <li>Assume responsibility for compliance with applicable rules</li>
                <li>Acknowledge the potential for regulatory changes</li>
                <li>Understand jurisdiction-specific variations</li>
              </ul>
            </div>

            <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-lg">
              <h5 className="font-medium text-green-700 dark:text-green-300 mb-2">
                Participation Terms
              </h5>
              <p className="text-sm">
              <strong>Participation in JustDAO is:</strong>  
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                <li>Entirely voluntary</li>
                <li>Without expectation of benefit</li>
                <li>Not creating any legal obligations</li>
              </ul>
            </div>
          </div>

          <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-4 text-center">
            This is a community initiative with NO return financial benefit expectations.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 shadow-sm mb-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Voting Power</h4>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            All holders of JST tokens have governance rights proportional to their holdings:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white/80 dark:bg-gray-800/50 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0" />
                <h5 className="font-medium text-gray-900 dark:text-white">Proposal Creation</h5>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Requires holding a minimum of tokens to create a proposal. Proposals require a stake that is returned based on outcome.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/50 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
              <div className="flex items-center mb-2">
                <VoteIcon className="h-5 w-5 text-purple-500 dark:text-purple-400 mr-2 flex-shrink-0" />
                <h5 className="font-medium text-gray-900 dark:text-white">Voting</h5>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vote with your JST balance. Voting options are: FOR, AGAINST, and ABSTAIN. Quorum requirements ensure sufficient participation.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/50 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-2 flex-shrink-0" />
                <h5 className="font-medium text-gray-900 dark:text-white">Delegation</h5>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Token holders can delegate voting power while maintaining ownership, allowing for greater expertise without sacrificing token control.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/50 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 flex-shrink-0" />
                <h5 className="font-medium text-gray-900 dark:text-white">Treasury Management</h5>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Token holders collectively decide how treasury funds are allocated to support legal aid initiatives.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Long-Term Vision</h4>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            JustDAO aims to become a sustainable force for democratizing legal access. Our long-term plan includes:
          </p>
          
          <ul className="mt-4 space-y-5">
            <li className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3 mt-0.5 shadow-sm flex-shrink-0">
                <span className="text-blue-700 dark:text-blue-300 font-medium">1</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">Expanding Legal Aid Network</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Growing the network of supported legal aid providers across different jurisdictions and practice areas
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-3 mt-0.5 shadow-sm flex-shrink-0">
                <span className="text-purple-700 dark:text-purple-300 font-medium">2</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">Enhanced Impact Metrics</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Developing a standard impact tracking systems to measure and maximize effectiveness of funded initiatives
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mr-3 mt-0.5 shadow-sm flex-shrink-0">
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">3</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">Protocol Improvements</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Continuous enhancement of governance mechanisms, security features, and user experience
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center mr-3 mt-0.5 shadow-sm flex-shrink-0">
                <span className="text-teal-700 dark:text-teal-300 font-medium">4</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">Cross-Chain Integration</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Exploring partnerships with other legal-aid-focused initiatives and platforms
                </p>
              </div>
            </li>
          </ul>
        </div>
      </StaticCard>

      {/* Token Properties Section - with added padding above */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm mt-12">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Token <strong className="text-indigo-600 dark:text-indigo-400">Properties</strong></h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
              <span className="text-gray-800 dark:text-gray-200 font-bold"><b>Transitive Delegation</b></span>
            </h4>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Benefit from <strong className="text-indigo-600 dark:text-indigo-400">chain-based power flow</strong> with up to 8 delegation levels. 
              <i> Smart contract safeguards prevent circular delegations maximizing active community participation.</i>
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
              <span className="text-gray-800 dark:text-gray-200"><b>Snapshot Governance</b></span>
            </h4>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <strong className="text-indigo-600 dark:text-indigo-400">Time-bound voting rights</strong> preserve governance integrity through snapshot mechanics. 
              <i> Token balances and delegations are recorded at proposal creation for manipulation-resistant voting.</i>
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
              <span className="text-gray-800 dark:text-gray-200 font-bold"><b>Token-Locked Delegation</b></span>
            </h4>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Innovative <strong className="text-indigo-600 dark:text-indigo-400">token-locking mechanism</strong> ensures delegation commitment and prevents market manipulation.  
              <i> Delegate without transferring ownership, amplifying expert voices. </i>        
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
              <span className="text-gray-800 dark:text-gray-200 font-bold"><b>Timelocked Execution</b></span>
            </h4>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Multi-tiered <strong className="text-indigo-600 dark:text-indigo-400">security delay system</strong> with risk-based execution timeframes. 
              <i> Critical protocol changes require longer waiting periods, safeguarding legal aid resources.</i> 
            </p>
          </div>
        </div>
      </div>
      
      {/* Call-to-Action Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 shadow-sm border border-indigo-100 dark:border-indigo-900/30 mb-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-2">
            Join the Legal Empowerment Movement
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            By acquiring JST tokens, you're not just joining a growing legal organization—you're supporting equitable access to legal resources and empowering underserved communities.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition-colors"
                type="button"
              >
                Connect Wallet
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigateToAppSection('governance')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-md shadow-sm transition-colors"
                  type="button"
                >
                  Explore Governance
                </button>
               <button
			  onClick={() => {
				const tokenAddress = process.env.REACT_APP_TOKEN_ADDRESS || "Could not load token address!";
				window.open(`https://etherscan.io/address/${tokenAddress}`, '_blank');
			  }}
			  className="px-6 py-3 border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md shadow-sm transition-colors flex items-center"
			  type="button"
			>
			  View Token Contract
			  <ExternalLink className="h-4 w-4 ml-2" />
				</button>			
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenTabContent;