
import React from 'react';
import { LineChart, PieChart, Percent, Users, Info, Check } from 'lucide-react';
import GovernanceParameters from './GovernanceParameters';
import { formatPercentage } from '../utils/formatters';

const TokenAnalyticsPage = ({ 
  tokenAnalytics, 
  govParams, 
  timelockAnalytics, 
  formatTimeDuration, 
  formatDuration, 
  formatTokenAmount, 
  threatLevelDelays 
}) => {
  if (!tokenAnalytics) {
    return (
      <div className="py-12 text-center text-slate-400 dark:text-slate-500">
        No token data available
      </div>
    );
  }
  
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
            <LineChart className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Token Distribution</h3>
          </div>
          
          <div className="p-5">
            <div className="flex flex-col space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Supply</span>
                  <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                    {formatTokenAmount(tokenAnalytics.totalSupply)} JST
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active Holders</span>
                  <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                    {tokenAnalytics.activeHolders.toString()}
                  </span>
                </div>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg">
                <div className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-4">
                  Token Supply Distribution
                </div>
                
                <div className="flex items-center mb-3">
                  <div className="h-8 w-full rounded-lg overflow-hidden flex">
                    <div 
                      className="bg-indigo-600 flex items-center"
                      style={{ width: `${tokenAnalytics.percentageDelegated}%` }}
                    >
                      <span className="text-white text-xs font-medium mx-auto">Delegated</span>
                    </div>
                    <div 
                      className="bg-indigo-300  flex items-center"
                      style={{ width: `${100 - tokenAnalytics.percentageDelegated}%` }}
                    >
                      <span className="text-gray-800 text-xs font-medium mx-auto">Non-delegated</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="text-lg font-semibold text-indigo-900 dark:text-indigo-200">
                    {formatPercentage(tokenAnalytics.percentageDelegated / 100)}
                    </div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">
                      Delegated
                    </div>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="text-lg font-semibold text-indigo-900 dark:text-indigo-200">
                      {formatPercentage((100 - tokenAnalytics.percentageDelegated) / 100)}
                    </div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">
                      Non-delegated
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Token Metrics</div>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Tokens per Holder</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {tokenAnalytics.activeHolders > 0 
                        ? formatTokenAmount(parseFloat(tokenAnalytics.totalSupply) / tokenAnalytics.activeHolders) 
                        : '0'} JST
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Total Delegated</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatTokenAmount(tokenAnalytics.totalDelegated)} JST
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Percentage Delegated</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatPercentage(tokenAnalytics.percentageDelegated / 100)}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-500" />
            <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Delegation Status</h3>
          </div>
          
          <div className="p-5">
            <div className="flex flex-col space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Delegated</span>
                  <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                    {formatTokenAmount(tokenAnalytics.totalDelegated)} JST
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active Delegates</span>
                  <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                    {tokenAnalytics.activeDelegates.toString()}
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Delegation Metrics</div>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Percent className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-slate-600 dark:text-slate-400">Tokens per Delegate</span>
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {tokenAnalytics.activeDelegates > 0 
                        ? formatTokenAmount(parseFloat(tokenAnalytics.totalDelegated) / tokenAnalytics.activeDelegates) 
                        : '0'} JST
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-slate-600 dark:text-slate-400">Delegate to Holder Ratio</span>
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {tokenAnalytics.activeHolders > 0 
                        ? `1:${(tokenAnalytics.activeHolders / tokenAnalytics.activeDelegates).toFixed(1)}` 
                        : '0:0'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Token Usage Information */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Token Utility & Information</h3>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Token Usage</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">Governance voting rights</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">Proposal creation when above threshold</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">Delegation of voting power</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">Timelock transaction execution (with minimum threshold)</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Token Information</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Symbol</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">JST</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Decimals</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">18</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Type</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">ERC20 Votes</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Mintable</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Yes (governance controlled)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TokenAnalyticsPage;