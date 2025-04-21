import React from 'react';
import { Activity, CheckCircle, ThumbsUp, X, Ban, Clock, Award } from 'lucide-react';
import GovernanceParameters from './GovernanceParameters';
import { formatPercentage } from '../utils/formatters';

// Helper function for status colors
function getStatusColor(status) {
  switch (status) {
    case 'active':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 'succeeded':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'queued':
    case 'in timelock':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    case 'ready for execution':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
    case 'executed':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
    case 'defeated':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case 'canceled':
    case 'expired':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
}

const ProposalAnalyticsPage = ({ 
  proposalAnalytics, 
  govParams, 
  timelockAnalytics, 
  formatTimeDuration, 
  formatDuration, 
  formatTokenAmount, 
  threatLevelDelays 
}) => {
  if (!proposalAnalytics) {
    return (
      <div className="py-12 text-center text-slate-400 dark:text-slate-500">
        No proposal data available. Try refreshing the page or check your connection.
      </div>
    );
  }

  // Calculate grouped values for the proposal visualizations
  const positiveOutcomes = proposalAnalytics.succeededProposals + proposalAnalytics.executedProposals;
  const negativeOutcomes = proposalAnalytics.defeatedProposals + proposalAnalytics.canceledProposals + proposalAnalytics.expiredProposals;
  const totalPositiveNegative = positiveOutcomes + negativeOutcomes;
  const positivePercentage = totalPositiveNegative > 0 ? (positiveOutcomes / totalPositiveNegative) * 100 : 0;
  const negativePercentage = totalPositiveNegative > 0 ? (negativeOutcomes / totalPositiveNegative) * 100 : 0;

  return (
    <>
      <GovernanceParameters 
        govParams={govParams} 
        timelockAnalytics={timelockAnalytics} 
        formatTimeDuration={formatTimeDuration} 
        formatDuration={formatDuration} 
        formatTokenAmount={formatTokenAmount} 
        threatLevelDelays={threatLevelDelays} 
      />
      
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Proposal Statistics</h3>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Proposals</span>
              <span className="text-2xl font-medium text-slate-800 dark:text-slate-200">
                {proposalAnalytics.totalProposals}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active</span>
              <span className="text-2xl font-medium text-yellow-800 dark:text-yellow-300">
                {proposalAnalytics.activeProposals}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Success Rate</span>
              <span className="text-2xl font-medium text-green-800 dark:text-green-300">
                {formatPercentage(proposalAnalytics.successRate / 100)}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Voting Turnout</span>
              <span className="text-2xl font-medium text-blue-800 dark:text-blue-300">
                {formatPercentage(proposalAnalytics.avgVotingTurnout / 100)}
              </span>
            </div>
          </div>
          
          {/* Status visualization, grouping succeeded/executed and defeated/canceled/expired */}
          <div className="mb-8">
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
              Proposal Outcome Distribution
            </div>
            
            <div className="flex items-center mb-2">
              <div className="h-8 flex rounded-lg overflow-hidden w-full">
                <div 
                  className="bg-green-500 dark:bg-green-600 flex items-center justify-center"
                  style={{width: `${positivePercentage}%`}}
                >
                  <span className="text-white text-xs font-medium px-2">Successful</span>
                </div>
                <div 
                  className="bg-red-500 dark:bg-red-600 flex items-center justify-center"
                  style={{width: `${negativePercentage}%`}}
                >
                  <span className="text-white text-xs font-medium px-2">Failed</span>
                </div>
              </div>
              <div className="ml-4 text-sm font-medium text-slate-700 dark:text-slate-300 flex-shrink-0 whitespace-nowrap">
              </div>
            </div>
            
            <div className="text-xs text-slate-500 dark:text-slate-400 grid grid-cols-2 gap-8">
              <div>
                <span className="text-green-800 dark:text-green-300 font-medium">Successful proposals</span> include
                succeeded ({proposalAnalytics.succeededProposals}) and executed ({proposalAnalytics.executedProposals})
              </div>
              <div>
                <span className="text-red-800 dark:text-red-300 font-medium">Unsuccessful proposals</span> include
                defeated ({proposalAnalytics.defeatedProposals}), canceled ({proposalAnalytics.canceledProposals}) and 
                expired ({proposalAnalytics.expiredProposals})
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Detailed status breakdown list */}
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
              Proposal State Breakdown
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-center justify-between p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-purple-800 dark:text-purple-300">Executed</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-800 dark:text-purple-300 font-medium">
                      {proposalAnalytics.executedProposals}
                    </span>
                    <CheckCircle className="ml-2 h-4 w-4 text-purple-500 dark:text-purple-400" />
                  </div>
                </li>
                
                <li className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-green-800 dark:text-green-300">Succeeded</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-800 dark:text-green-300 font-medium">
                      {proposalAnalytics.succeededProposals}
                    </span>
                    <ThumbsUp className="ml-2 h-4 w-4 text-green-500 dark:text-green-400" />
                  </div>
                </li>
                
                <li className="flex items-center justify-between p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-yellow-800 dark:text-yellow-300">Active</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                      {proposalAnalytics.activeProposals}
                    </span>
                    <Activity className="ml-2 h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                  </div>
                </li>
              </ul>
            </div>
            
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
                Unsuccessful Proposals
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-red-800 dark:text-red-300">Defeated</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-red-800 dark:text-red-300 font-medium">
                      {proposalAnalytics.defeatedProposals}
                    </span>
                    <X className="ml-2 h-4 w-4 text-red-500 dark:text-red-400" />
                  </div>
                </li>
                
                <li className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-gray-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Canceled</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {proposalAnalytics.canceledProposals}
                    </span>
                    <Ban className="ml-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </li>
                
                <li className="flex items-center justify-between p-3 bg-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-gray-700 rounded-full mr-3"></div>
                    <span className="text-gray-800 dark:text-gray-200">Expired</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">
                      {proposalAnalytics.expiredProposals}
                    </span>
                    <Clock className="ml-2 h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance metrics */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Performance Metrics</h3>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Execution Rate</div>
              <div className="text-xl font-medium text-purple-800 dark:text-purple-300">
                {formatPercentage(proposalAnalytics.totalProposals > 0 ? 
                  (proposalAnalytics.executedProposals / proposalAnalytics.totalProposals) : 0)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {proposalAnalytics.executedProposals} of {proposalAnalytics.totalProposals} proposals implemented
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Average Turnout</div>
              <div className="text-xl font-medium text-blue-800 dark:text-blue-300">
                {formatPercentage(proposalAnalytics.avgVotingTurnout / 100)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Percentage of tokens participating in votes
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Queued Proposals</div>
              <div className="text-xl font-medium text-blue-800 dark:text-blue-300">
                {proposalAnalytics.queuedProposals}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Waiting for execution in timelock
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProposalAnalyticsPage;