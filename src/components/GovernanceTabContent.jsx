import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Vote, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  BarChart4, 
  Landmark, 
  Gavel, 
  FileCheck, 
  UserCheck, 
  PanelLeftClose, 
  FolderCog, 
  BarChart2, 
  Star, 
  Users, 
  TimerOff, 
  TimerReset, 
  FileBarChart, 
  RefreshCcw,
  Shield,
  BookOpen,
  ListChecks,
  Hourglass,
  FileQuestion,
  CalendarCheck,
  Building,
  Building2,
  CircleDollarSign,
  BadgeHelp,
  FlaskConical,
  GraduationCap,
  LucideVerified,
  Stethoscope,
  Workflow,
  BarChartHorizontal,
  ArrowUp,
  Lightbulb,
  FileCog2,
  Info,
  Briefcase,
  BadgeCheck,
  ClipboardCheck,
  GitPullRequestDraft,
  MessageSquare,
  Layers,
  Network,
  User,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Repeat,
  Lock,
  Coins,
  StepForward,
  CircleDot,
  FileDigit,
  Code,
  Wallet,
  Settings,
  Archive,
  VoteIcon
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { useBlockchainData } from '../contexts/BlockchainDataContext';
import { useDAOStats } from '../hooks/useDAOStats';
import { ethers } from 'ethers';

// Motion Component for adding subtle animations - refined for more elegant interaction
const MotionCard = ({ children, className = "" }) => {
  return (
    <div 
      className={`transform transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
};

// Tooltip component
const Tooltip = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center cursor-help"
      >
        {children}
        {showTooltip && (
          <div className="absolute z-10 w-64 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-100 -top-2 -translate-y-full left-1/2 -translate-x-1/2 dark:bg-gray-700">
            {text}
            <div className="absolute w-2 h-2 bg-gray-900 rotate-45 -translate-y-1/2 left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 dark:bg-gray-700"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Badge component
const Badge = ({ text, type = "default" }) => {
  const colors = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    primary: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
  };
  
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colors[type]}`}>
      {text}
    </span>
  );
};

// Expandable section component with improved hover effects
const ExpandableSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 hover:from-gray-100 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-indigo-900/20 transition-all duration-300 focus:outline-none"
      >
        <div className="flex items-center">
          {Icon && <Icon className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400" />}
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
};

// Featured box with gradient border
const GradientBorderBox = ({ title, icon: Icon, children, className = "", accentColor = "indigo" }) => {
  const gradientClasses = {
    indigo: "from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400",
    blue: "from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400",
    green: "from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400",
    amber: "from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400"
  };
  
  return (
    <div className={`relative rounded-lg overflow-hidden p-0.5 ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${gradientClasses[accentColor]} opacity-100`}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-md p-5">
        <div className="flex items-center space-x-3 mb-4">
          {Icon && <Icon className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

// Main Governance Tab component
const GovernanceTabContent = () => {
  // Fetch on-chain data using hooks
  const { contracts, isConnected } = useWeb3();
  const { daoStats } = useBlockchainData();
  const [governanceData, setGovernanceData] = useState({
    votingDuration: 7,
    quorum: 500000,
    proposalCreationThreshold: 10000,
    proposalStake: 50000,
    canceledRefundPercentage: 75,
    defeatedRefundPercentage: 50,
    expiredRefundPercentage: 25
  });
  const [pendingProposals, setPendingProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch governance data from contracts
  useEffect(() => {
    let isMounted = true; // Flag to track if component is mounted
    
    const fetchGovernanceData = async () => {
      if (!isConnected || !contracts.governance) return;
      
      try {
        if (isMounted) {
          setIsLoading(true);
        }
        
        // Fetch parameters from governance contract
        const govParams = await contracts.governance.govParams();
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Format data for display - convert from wei to ETH
          setGovernanceData({
            votingDuration: Number(govParams.votingDuration) / 86400, // Convert seconds to days
            quorum: Number(ethers.utils.formatEther(govParams.quorum)),
            proposalCreationThreshold: Number(ethers.utils.formatEther(govParams.proposalCreationThreshold)),
            proposalStake: Number(ethers.utils.formatEther(govParams.proposalStake)),
            canceledRefundPercentage: Number(govParams.canceledRefundPercentage),
            defeatedRefundPercentage: Number(govParams.defeatedRefundPercentage),
            expiredRefundPercentage: Number(govParams.expiredRefundPercentage)
          });
        }

        // Fetch pending proposals
        if (contracts.timelock && isMounted) {
          const pendingTxs = await contracts.timelock.getPendingTransactions();
          const formattedProposals = await Promise.all(
            pendingTxs.map(async (txHash) => {
              const tx = await contracts.timelock.getTransaction(txHash);
              return {
                target: tx[0], // Target address
                value: Number(ethers.utils.formatEther(tx[1])), // ETH value
                eta: new Date(Number(tx[3]) * 1000).toLocaleDateString(), // Execution time
                ready: Date.now() / 1000 > Number(tx[3]) // Ready to execute
              };
            })
          );
          
          // Only update state if component is still mounted
          if (isMounted) {
            setPendingProposals(formattedProposals);
          }
        }
      } catch (error) {
        console.error("Error fetching governance data:", error);
      } finally {
        // Only update state if component is still mounted
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchGovernanceData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [isConnected, contracts]);

  // Format addresses for display
  const formatAddress = (address) => {
    if (!address) return '-';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-800 via-indigo-700 to-purple-800 shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 800 800">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <rect width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative p-8 sm:p-10 overflow-hidden">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2 text-white space-y-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Community-Driven Justice</h1>
              <p className="text-lg text-indigo-100">
                JustDAO empowers token holders to collectively determine legal aid funding priorities, select qualified providers, and transparently allocate resources to maximize impact in underserved communities.
              </p>
              
              {/* Visual pattern replacement for the three labels */}
              <div className="grid grid-cols-3 gap-2 pt-4">
                <div className="h-2 bg-indigo-400/70 dark:bg-indigo-500/80 rounded-full"></div>
                <div className="h-2 bg-purple-400/70 dark:bg-purple-500/80 rounded-full"></div>
                <div className="h-2 bg-blue-400/70 dark:bg-blue-500/80 rounded-full"></div>
              </div>
            </div>
            
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-white/15 backdrop-blur-md rounded-lg p-5 flex flex-col">
                <span className="text-indigo-200 font-medium mb-1 text-sm">Active Voting Period</span>
                <span className="text-white text-3xl font-bold">{governanceData.votingDuration.toFixed(0)}</span>
                <span className="text-indigo-200 mt-1">days</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-lg p-5 flex flex-col">
                <span className="text-indigo-200 font-medium mb-1 text-sm">Quorum Requirement</span>
                <span className="text-white text-3xl font-bold">{governanceData.quorum.toFixed(2)}</span>
                <span className="text-indigo-200 mt-1">JST tokens</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-lg p-5 flex flex-col">
                <span className="text-indigo-200 font-medium mb-1 text-sm">Proposal Threshold</span>
                <span className="text-white text-3xl font-bold">{governanceData.proposalCreationThreshold.toFixed(2)}</span>
                <span className="text-indigo-200 mt-1">JST minimum</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-lg p-5 flex flex-col">
                <span className="text-indigo-200 font-medium mb-1 text-sm">Proposal Stake</span>
                <span className="text-white text-3xl font-bold">{governanceData.proposalStake.toFixed(2)}</span>
                <span className="text-indigo-200 mt-1">JST required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Two-part ecosystem overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MotionCard>
          <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-6 h-full">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 p-2 mr-3">
                <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">On-Chain Governance</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The JustDAO smart contract system provides the secure, transparent backbone for all governance decisions, enabling verifiable voting, fund allocation, and execution.
            </p>
            
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Proposal & Voting</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Token-based voting system with proposal creation, deliberation periods, and transparent vote tallying.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <Hourglass className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Security Timelock</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Multi-tiered timelock system with risk-appropriate delays that provides crucial security for fund management.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <Landmark className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Treasury Management</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Secure management of community funds with transaction visibility, approvals, and fiduciary oversight.
                </p>
              </div>
            </div>
          </div>
        </MotionCard>
        
        <MotionCard>
          <div className="bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/20 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-6 h-full">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/50 p-2 mr-3">
                <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Companion Forum</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The forum serves as JustDAO's public square for proposal discussion, due diligence, and community interaction before on-chain governance actions.
            </p>
            
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <FileQuestion className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Proposal Discussion</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Off-chain vetting of proposals to ensure quality, transparency, and community alignment before voting.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Provider Evaluation</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Community assessment of legal aid provider applications and performance based on metrics and impact.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <BarChart4 className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Progress Tracking</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Regular updates and quarterly reports on funded legal aid initiatives to ensure accountability.
                </p>
              </div>
            </div>
          </div>
        </MotionCard>
      </div>
      
      {/* Governance Process Flow */}
      <ExpandableSection 
        title="Governance Workflow" 
        icon={Workflow}
        defaultOpen={true}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="relative">
            {/* Flow line with endpoint - subtle, non-searchlight animation */}
            <div className="absolute left-3 top-[30px] bottom-[15px] w-0.5 bg-indigo-400/30 dark:bg-indigo-500/30 rounded-full">
              <div className="h-full w-full bg-gradient-to-b from-indigo-400 via-purple-400 to-indigo-400 dark:from-indigo-500 dark:via-purple-500 dark:to-indigo-500 rounded-full animate-pulse" style={{animationDuration: '4s'}}></div>
            </div>       
            <div className="absolute left-3 bottom-0 transform translate-x-[-50%] translate-y-[50%]">
              <div className="w-6 h-6 rounded-full bg-indigo-400 dark:bg-indigo-500 flex items-center justify-center shadow-md">
                <CircleDot className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <div className="space-y-10 py-4 pb-8">
              <div className="relative pl-14">
                {/* Icon moved to top of flow indicator */}
                <div className="absolute left-3 top-0 transform translate-x-[-50%]">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-400 dark:border-indigo-500 flex items-center justify-center shadow-md">
                    <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. Service Provider Application</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Pro bono attorneys and legal aid organizations apply to become approved service providers in the forum, submitting detailed qualifications and capacity metrics.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Providers must submit clear information about their expertise, track record, 
                    legal focus areas (e.g., consumer protection, foreclosure defense), and quarterly reporting capabilities.
                  </p>
                </div>
              </div>
              
              <div className="relative pl-14">
                <div className="absolute left-3 top-0 transform translate-x-[-50%]">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-400 dark:border-blue-500 flex items-center justify-center shadow-md">
                    <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. Community Review</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  The DAO forum enables deep due diligence on providers and funding requests, with legal experts and stakeholders weighing in before formal proposals.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    This critical step allows thorough vetting, preventing bad-faith requests or low-priority cases from receiving funding, and building community consensus before on-chain voting.
                  </p>
                </div>
              </div>
              
              <div className="relative pl-14">
                <div className="absolute left-3 top-0 transform translate-x-[-50%]">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 border-2 border-purple-400 dark:border-purple-500 flex items-center justify-center shadow-md">
                    <FileQuestion className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. Proposal Creation</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Token holders with at least {governanceData.proposalCreationThreshold.toLocaleString()} JST submit on-chain proposals 
                  specifying providers, funding amounts, and governance changes.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Proposers stake {governanceData.proposalStake.toLocaleString()} JST tokens when submitting, which are returned based on proposal outcome. The system supports multiple proposal types including funding allocations, governance changes, and provider registration.
                  </p>
                </div>
              </div>
              
              <div className="relative pl-14">
                <div className="absolute left-3 top-0 transform translate-x-[-50%]">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/50 border-2 border-green-400 dark:border-green-500 flex items-center justify-center shadow-md">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4. Token-Based Voting</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  During the {governanceData.votingDuration.toFixed(0)}-day voting period, token holders vote FOR, AGAINST, or ABSTAIN on each proposal, with votes weighted by token holdings.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Proposals must meet a quorum of {governanceData.quorum.toLocaleString()} JST and receive more FOR than AGAINST votes to pass. Voting power is determined at the block when the proposal was created (snapshot mechanism).
                  </p>
                </div>
              </div>
              
              <div className="relative pl-14">
                <div className="absolute left-3 top-0 transform translate-x-[-50%]">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 border-2 border-amber-400 dark:border-amber-500 flex items-center justify-center shadow-md">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5. Timelock Protection</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Successful proposals enter a timelock period based on risk level, providing a security window for community review before execution.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    The system implements a multi-tiered timelock with different waiting periods (from days to weeks) based on the transaction's risk profile, allowing emergency intervention if necessary.
                  </p>
                </div>
              </div>
              
              <div className="relative pl-14">
                <div className="absolute left-3 top-0 transform translate-x-[-50%]">
                  <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 border-2 border-cyan-400 dark:border-cyan-500 flex items-center justify-center shadow-md">
                    <Coins className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">6. Fund Distribution</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Upon execution, approved funds are dispuresed on-chain or with off-chain assets managed by fiduciaries who ensure proper disbursement to legal aid providers.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Fiduciaries implement community-approved funding decisions in a legally accountable way, executing off-chain payments. They don't control the DAO but serve as stewards of the treasury.
                  </p>
                </div>
              </div>
              
              <div className="relative pl-14">
                <div className="absolute left-3 top-0 transform translate-x-[-50%]">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-400 dark:border-indigo-500 flex items-center justify-center shadow-md">
                    <BarChart4 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7. Progress Tracking & Accountability</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Funded legal aid providers submit regular progress updates and quarterly reports on case metrics and impact.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Updates are shared both on-chain and in the forum to maintain public accountability. The community can approve additional funding or address concerns through governance if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ExpandableSection>
      
      {/* Proposal Types */}
      <GradientBorderBox title="Proposal Types" icon={ListChecks} accentColor="blue" className="w-full">
        <div className="text-gray-600 dark:text-gray-300 mb-5">
          <p>The JustDAO governance system supports multiple specialized proposal types for different governance actions, each with specific execution logic and validation requirements:</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Contract Interaction */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 p-2">
                  <Code className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Contract Interaction</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Execute arbitrary functions on approved target contracts with validated function selectors.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <strong>Use case:</strong> Complex protocol interactions, function calls to approved admin interfaces
              </div>
            </div>
          </div>
          
          {/* Treasury Transfer */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-900/20 border-b border-green-100 dark:border-green-900/30">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-2">
                  <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Treasury Transfer</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Transfer JST tokens from the treasury to a specified recipient, typically legal aid providers.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <strong>Use case:</strong> Direct funding of approved legal aid initiatives and operations
              </div>
            </div>
          </div>
          
          {/* External Token Transfer */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-900/20 border-b border-purple-100 dark:border-purple-900/30">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/50 p-2">
                  <CircleDollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">External Token Transfer</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Transfer non-JST ERC20 tokens from the treasury to specified recipients.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <strong>Use case:</strong> Distributing stablecoin payments, managing diversified treasury assets
              </div>
            </div>
          </div>
          
          {/* Governance Parameter Update */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20 border-b border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-2">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Governance Parameter Update</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Modify governance parameters like voting duration, quorum requirements, or proposal thresholds.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <strong>Use case:</strong> System optimization, adjusting participation requirements
              </div>
            </div>
          </div>
          
          {/* Token Issuance/Consolidation */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-900/20 border-b border-amber-100 dark:border-amber-900/30">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-2">
                  <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Token Issuance/Consolidation</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Create new JST tokens or remove tokens from circulation to manage token supply.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <strong>Use case:</strong> Treasury expansion, controlled supply management
              </div>
            </div>
          </div>
          
          {/* Binding Community Vote */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-gradient-to-r from-cyan-50 to-cyan-100/50 dark:from-cyan-900/30 dark:to-cyan-900/20 border-b border-cyan-100 dark:border-cyan-900/30">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-cyan-100 dark:bg-cyan-900/50 p-2">
                  <VoteIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Binding Community Vote</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              Represent a binding community decision on proposals without the need for executing code.              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <strong>Use case:</strong> Directing fiduciaries, strategic proposals, ecosystem collaborations
              </div>
            </div>
          </div>
        </div>
      </GradientBorderBox>
      
      {/* Stake & Refund Mechanics */}
      <ExpandableSection title="Stake & Refund Mechanics" icon={Repeat}>
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300">
            JustDAO implements an innovative stake-and-refund system for proposal creation that incentivizes quality submissions while deterring spam or low-effort proposals.
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 hover:from-gray-100 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-indigo-900/20 transition-all duration-300 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">How Proposal Staking Works</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start mb-6">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-full p-2 mr-4 mt-1">
                  <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Stake Requirement</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    When creating a proposal, the proposer must stake {governanceData.proposalStake.toLocaleString()} JST tokens, which are held in the governance contract until the proposal's lifecycle completes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start mb-6">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-full p-2 mr-4 mt-1">
                  <ArrowUpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Refund Conditions</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    The amount of tokens returned to the proposer depends on the proposal's outcome. This creates economic alignment between proposers and the DAO's interests.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-full p-2 mr-4 mt-1">
                  <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Security Benefits</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    This mechanism prevents governance spam, encourages well-researched proposals, and creates accountability for proposal quality. It's a critical defense mechanism against governance attacks.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 p-5 rounded-lg border border-green-100 dark:border-green-900/30 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-green-800 dark:text-green-300">Successful Execution</h3>
                <Badge text="100% Refund" type="success" />
              </div>
              <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                Proposals that pass voting and execute successfully receive a complete return of staked tokens.
              </p>
              <div className="flex items-center text-xs text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>Automatic refund upon execution</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 p-5 rounded-lg border border-amber-100 dark:border-amber-900/30 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-amber-800 dark:text-amber-300">Canceled</h3>
                <Badge text={`${governanceData.canceledRefundPercentage}% Refund`} type="warning" />
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                Proposals canceled by the proposer receive a partial refund of the staked amount.
              </p>
              <div className="flex items-center text-xs text-amber-600 dark:text-amber-500">
                <StepForward className="h-4 w-4 mr-1" />
                <span>Claim required via transaction</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 p-5 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-red-800 dark:text-red-300">Defeated</h3>
                <Badge text={`${governanceData.defeatedRefundPercentage}% Refund`} type="danger" />
              </div>
              <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                Proposals that fail to achieve quorum or receive more AGAINST than FOR votes receive a reduced refund.
              </p>
              <div className="flex items-center text-xs text-red-600 dark:text-red-500">
                <StepForward className="h-4 w-4 mr-1" />
                <span>Claim required via transaction</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800 dark:text-gray-300">Expired</h3>
                <Badge text={`${governanceData.expiredRefundPercentage}% Refund`} type="default" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Proposals that pass but aren't executed within the timelock grace period receive a partial refund.
              </p>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-500">
                <StepForward className="h-4 w-4 mr-1" />
                <span>Claim required via transaction</span>
              </div>
            </div>
          </div>
        </div>
      </ExpandableSection>
      
      {/* Security & Access Control */}
      <ExpandableSection title="Security & Access Control" icon={Shield}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Governance Roles</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors duration-300">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Admin Role</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    System administrators can manage contract configurations, update security settings, and handle emergency situations. Multiple admins are required to prevent single points of failure.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors duration-300">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Guardian Role</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Guardians have limited intervention rights for emergency situations. They can cancel proposals and pause the contract to prevent exploits, but cannot execute proposals or modify governance parameters.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors duration-300">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Fiduciary Managers</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Off-chain stewards who implement community-approved funding decisions. They execute payments to legal aid providers and ensure proper fund use without direct control over the DAO.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <Network className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Permission Controls</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors duration-300">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Whitelisted Functions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The system restricts which function selectors can be called via governance proposals, preventing exploitation of dangerous or unauthorized functions.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors duration-300">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Approved Targets</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Only pre-approved contract addresses can be targeted by governance proposals, preventing arbitrary calls to potentially malicious contracts.
                  </p>
                </div>
              </div>
              
            </div>
            
          </div>
          
          <div className="space-y-6">
            
            
          </div>
        </div>
      </ExpandableSection>
      
    {/* Enhanced Legal Aid Governance Section - Sleeker header with darker icon */}
<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden">
  <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-indigo-50 dark:from-amber-900/30 dark:to-indigo-900/30">
    <div className="flex items-center">
      <div className="flex-shrink-0 mr-4">
        <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-indigo-600 dark:from-amber-600 dark:to-indigo-700 rounded-lg shadow-md flex items-center justify-center">
          <Gavel className="h-6 w-6 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-400">
        Governance Boundaries
      </h2>
    </div>
  </div>
  
  <div className="p-6">
    <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
      The intersection of blockchain governance and legal aid presents unique challenges that require specific governance constraints:
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gradient-to-br from-white to-amber-50/20 dark:from-gray-800 dark:to-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/20 p-5 shadow-sm transition-all transform hover:-translate-y-1 hover:shadow-md duration-300">
        <div className="flex items-center mb-4">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 mr-3">
            <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-amber-800 dark:text-amber-300">Party Independence</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Voting on funding allocations does <strong>not create fiduciary relationships</strong> between token holders and legal aid recipients, the DAO, or any of its service providers.
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-white to-amber-50/20 dark:from-gray-800 dark:to-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/20 p-5 shadow-sm transition-all transform hover:-translate-y-1 hover:shadow-md duration-300">
        <div className="flex items-center mb-4">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 mr-3">
            <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-amber-800 dark:text-amber-300">Professional Autonomy</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Governance participants must respect <strong>attorney independence</strong> and cannot attempt to influence case strategies or decisions.
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-white to-amber-50/20 dark:from-gray-800 dark:to-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/20 p-5 shadow-sm transition-all transform hover:-translate-y-1 hover:shadow-md duration-300">
        <div className="flex items-center mb-4">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 mr-3">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-amber-800 dark:text-amber-300">Client Protection</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All legal services data shared with governance participants is <strong>anonymized and aggregated</strong> to protect client confidentiality.
        </p>
      </div>
    </div>
    
    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-5 border border-amber-100 dark:border-amber-800/20">
      <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-4 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        Key Governance Constraints
      </h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-start">
          <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 mr-3 mt-0.5 text-xs font-bold">1</div>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            The DAO structure <strong>intentionally prevents</strong> token holders from directing specific case activities or selecting individual clients.
          </p>
        </div>
        
        <div className="flex items-start">
          <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 mr-3 mt-0.5 text-xs font-bold">2</div>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Token holders from jurisdictions with <strong>restrictions on legal service funding</strong> must ensure compliance with their local regulations.
          </p>
        </div>
        
        <div className="flex items-start">
          <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 mr-3 mt-0.5 text-xs font-bold">3</div>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            The selection of legal aid providers follows strict <strong>non-discrimination principles</strong> and cannot be influenced by political motivations.
          </p>
        </div>
        
        <div className="flex items-start">
          <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 mr-3 mt-0.5 text-xs font-bold">4</div>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Governance decisions <strong>cannot override ethical obligations</strong> of attorneys or require actions contrary to professional responsibility rules.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>


{/* Call to Action - With links opening in new windows */}
<div className="bg-gradient-to-br from-indigo-100/70 to-purple-100/70 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg p-8 shadow-sm border border-indigo-200 dark:border-indigo-800/50">
  <div className="text-center max-w-3xl mx-auto">
    <h3 className="text-2xl font-bold text-indigo-800 dark:text-indigo-300 mb-3">
      Join the Governance Community
    </h3>
    <p className="text-gray-700 dark:text-gray-300 mb-6">
      Participate in shaping the future of decentralized legal aid by joining forum discussions, creating proposals, and casting votes that direct resources to underserved communities.
    </p>
    
    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
      <a href="/voting" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition-colors inline-block">
        Explore Active Proposals
      </a>
      <a href="https://testforum.example.com" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md shadow-sm transition-colors inline-block">
        Join Forum Discussion
      </a>
    </div>
  </div>
</div>
    </div>
  );
};

export default GovernanceTabContent;