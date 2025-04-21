
import React from 'react';
import { LineChart, Award, Users, RefreshCw, FileJson, AlertTriangle, ArrowUpRight, MapPin } from 'lucide-react';

const CurrentStatsPage = ({ 
  currentStatsData, 
  loadingCurrentStats, 
  error, 
  loadCurrentStatsData, 
  currentStatsLastUpdated,
  formatDollars 
}) => {
  if (loadingCurrentStats) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400 mb-4"></div>
        <div className="text-slate-500 dark:text-slate-400">Loading current stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 text-rose-500" />
          <div>{error}</div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={loadCurrentStatsData}
            className="px-3 py-1 text-xs bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 rounded hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors"
          >
            <RefreshCw className="w-3 h-3 inline mr-1" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentStatsData) {
    return (
      <div className="py-12 text-center text-slate-400 dark:text-slate-500">
        <FileJson className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No current stats data available</p>
        <button
          onClick={loadCurrentStatsData}
          className="mt-4 px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors inline-flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Load Data
        </button>
      </div>
    );
  }

  const {
    financialMetrics,
    governanceMetrics,
    communityMetrics,
    impactMetrics
  } = currentStatsData;

  return (
    <div className="space-y-8">
      
      {/* Financial & Treasury Metrics */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
          <LineChart className="h-5 w-5 text-emerald-500" />
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Financial & Treasury Metrics</h3>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Funds Distributed</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {financialMetrics?.totalFundsDistributed || "0"} ETH
              </span>
              {financialMetrics?.fundsDistributedTrend && (
                <div className="flex items-center mt-1 text-xs text-emerald-500 dark:text-emerald-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>{financialMetrics.fundsDistributedChange}%</span>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Estimated USD Value</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {formatDollars(financialMetrics?.estimatedUsdValue || 0)}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Treasury Growth Rate</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {financialMetrics?.treasuryGrowthRate || "0"}% MoM
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Token Circulation</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {financialMetrics?.circulatingSupply || "0"} JST
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                of {financialMetrics?.totalSupply || "0"} total
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">JST Token Contract</div>
            <div className="font-mono text-xs break-all text-slate-600 dark:text-slate-400">
              {financialMetrics?.tokenContract || "0xb0bCE9452329EC979CF7BA06801dDa070FF8b835"}
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 italic mt-1">
              ✨ Send ETH here to mint JST tokens - instant tokenization!
            </div>
          </div>
        </div>
      </div>

      {/* Governance Activity & Metrics */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-500" />
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Governance Activity & Metrics</h3>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active Initiatives</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {governanceMetrics?.activeInitiatives?.toString() || "0"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Success Rate</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {governanceMetrics?.successRate || "0%"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Proposals</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {governanceMetrics?.totalProposals || "0"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Avg. Execution</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {governanceMetrics?.avgExecutionTime || "0"} days
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Initiative Distribution
            </div>
            <div className="h-6 w-full flex rounded-lg overflow-hidden">
              <div 
                className="bg-blue-400 dark:bg-blue-600 flex items-center justify-center text-white text-xs" 
                style={{width: `${(governanceMetrics?.initiativeDistribution?.housing || 25)}%`}} 
              >
                Housing
              </div>
              <div 
                className="bg-purple-400 dark:bg-purple-600 flex items-center justify-center text-white text-xs" 
                style={{width: `${(governanceMetrics?.initiativeDistribution?.family || 25)}%`}} 
              >
                Family
              </div>
              <div 
                className="bg-green-400 dark:bg-green-600 flex items-center justify-center text-white text-xs" 
                style={{width: `${(governanceMetrics?.initiativeDistribution?.immigration || 25)}%`}} 
              >
                Immigration
              </div>
              <div 
                className="bg-amber-400 dark:bg-amber-600 flex items-center justify-center text-white text-xs" 
                style={{width: `${(governanceMetrics?.initiativeDistribution?.consumer || 25)}%`}} 
              >
                Consumer
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community & Impact Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Community & Delegation Metrics */}
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Community & Delegation Metrics</h3>
          </div>

          <div className="p-5 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-1">
                <div className="text-sm text-slate-500 dark:text-slate-400">Community Members</div>
                <div className="text-xl font-medium text-slate-800 dark:text-slate-200">
                  {communityMetrics?.totalMembers?.toString() || "0"}
                </div>
                {communityMetrics?.membershipTrend && (
                  <div className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span>+{communityMetrics.newMembersLastMonth} last month</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="text-sm text-slate-500 dark:text-slate-400">Participation Rate</div>
                <div className="text-xl font-medium text-slate-800 dark:text-slate-200">
                  {communityMetrics?.participationRate || "0%"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Token Distribution Equality</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Gini: {communityMetrics?.giniCoefficient || "0.0"}
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 flex">
                    <div className="w-2/5 h-full bg-green-500 dark:bg-green-600"></div>
                    <div className="w-3/5 h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 dark:from-green-600 dark:via-yellow-600 dark:to-red-600"></div>
                  </div>
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-black dark:bg-white" 
                    style={{ left: `${(parseFloat(communityMetrics?.giniCoefficient || 0.1) * 100)}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-black dark:bg-white"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Perfect Equality (0.0)</span>
                  <span>Complete Inequality (1.0)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Delegation Stability</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {communityMetrics?.delegationStabilityIndex || "0"}/10
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                    style={{ width: `${(parseInt(communityMetrics?.delegationStabilityIndex || 0) / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <div className="text-xs text-slate-500 dark:text-slate-400">Forum Posts</div>
                <div className="text-lg font-medium text-slate-800 dark:text-slate-200">{communityMetrics?.forumPosts || "0"}</div>
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <div className="text-xs text-slate-500 dark:text-slate-400">Discord Members</div>
                <div className="text-lg font-medium text-slate-800 dark:text-slate-200">{communityMetrics?.discordMembers || "0"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Metrics & Statistics */}
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Impact Metrics & Statistics</h3>
          </div>

          <div className="p-5 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-1">
                <div className="text-sm text-slate-500 dark:text-slate-400">Cases Resolved</div>
                <div className="text-xl font-medium text-slate-800 dark:text-slate-200">
                  {impactMetrics?.casesResolved?.total?.toString() || "0"}
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="text-sm text-slate-500 dark:text-slate-400">This Quarter</div>
                <div className="text-xl font-medium text-slate-800 dark:text-slate-200">
                  {impactMetrics?.casesResolved?.quarterly?.q3?.toString() || "0"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                {impactMetrics?.casesResolved?.byType?.housing || "0"} Housing
              </span>
              <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                {impactMetrics?.casesResolved?.byType?.family || "0"} Family Law
              </span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                {impactMetrics?.casesResolved?.byType?.immigration || "0"} Immigration
              </span>
              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">
                {impactMetrics?.casesResolved?.byType?.consumer || "0"} Consumer
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Monetary Benefit to Clients</div>
                  <div className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
                    {formatDollars(impactMetrics?.impactAssessment?.monetaryBenefit?.total || 0)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Immigration Cases</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {impactMetrics?.externalAnalysis?.immigrationBacklog?.description || "Not available"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentStatsPage;