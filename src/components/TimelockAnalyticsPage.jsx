import React from 'react';
import { Clock } from 'lucide-react';
import GovernanceParameters from './GovernanceParameters';

const TimelockAnalyticsPage = ({ 
  timelockAnalytics, 
  govParams, 
  formatTimeDuration, 
  formatDuration, 
  formatTokenAmount, 
  threatLevelDelays 
}) => {
  if (!timelockAnalytics) {
    return (
      <div className="py-12 text-center text-slate-400 dark:text-slate-500">
        No timelock data available
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
            <div className="w-3 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded mr-2"></div>
            <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Timelock Configuration</h3>
          </div>
          
          <div className="p-5">
            <div className="flex flex-col space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Minimum Delay</span>
                  <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                    {formatDuration(timelockAnalytics.minDelay)}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Grace Period</span>
                  <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                    {formatDuration(timelockAnalytics.gracePeriod)}
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Delay Configuration</div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-24 text-xs font-medium text-slate-600 dark:text-slate-400">Min</div>
                    <div className="flex-1 mx-2">
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                          style={{ width: `${(timelockAnalytics.minDelay / timelockAnalytics.maxDelay) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-24 text-xs text-right text-slate-600 dark:text-slate-400">
                      {formatDuration(timelockAnalytics.minDelay)}
                    </div>
                  </li>
                  
                  <li className="flex items-center">
                    <div className="w-24 text-xs font-medium text-slate-600 dark:text-slate-400">Grace</div>
                    <div className="flex-1 mx-2">
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 dark:bg-sky-400 rounded-full"
                          style={{ width: `${(timelockAnalytics.gracePeriod / timelockAnalytics.maxDelay) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-24 text-xs text-right text-slate-600 dark:text-slate-400">
                      {formatDuration(timelockAnalytics.gracePeriod)}
                    </div>
                  </li>
                  
                  <li className="flex items-center">
                    <div className="w-24 text-xs font-medium text-slate-600 dark:text-slate-400">Max</div>
                    <div className="flex-1 mx-2">
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-500 dark:bg-slate-400 rounded-full"
                          style={{ width: `100%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-24 text-xs text-right text-slate-600 dark:text-slate-400">
                      {formatDuration(timelockAnalytics.maxDelay)}
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-4 rounded-lg shadow-sm">
                  <div className="h-10 w-10 flex items-center justify-center bg-yellow-100 dark:bg-yellow-800/40 rounded-lg mr-3">
                    <Clock className="h-5 w-5 text-yellow-800 dark:text-yellow-200" />
                  </div>
                  <div>
                    <div className="text-xs text-yellow-800 dark:text-yellow-200">Pending Transactions</div>
                    <div className="text-lg font-medium text-yellow-900 dark:text-yellow-100">
                      {timelockAnalytics.pendingTransactions}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <div className="h-10 w-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-800/40 rounded-lg mr-3">
                    <div className="h-4 w-4 bg-indigo-500 dark:bg-indigo-400 rounded"></div>
                  </div>
                  <div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">Executor Threshold</div>
                    <div className="text-lg font-medium text-indigo-900 dark:text-indigo-200">
                      {formatTokenAmount(timelockAnalytics.executorThreshold)} JST
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
            <div className="w-3 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded mr-2"></div>
            <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Threat Level Delays</h3>
          </div>
          
          <div className="p-5">
            <div className="flex flex-col space-y-6">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Tiered Security Delays
                </div>
                
                <ul className="space-y-4">
                  <li>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">Low Threat</span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formatDuration(timelockAnalytics.lowThreatDelay)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                        style={{ width: `${(timelockAnalytics.lowThreatDelay / timelockAnalytics.highThreatDelay) * 100}%` }}
                      ></div>
                    </div>
                  </li>
                  
                  <li>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">Medium Threat</span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formatDuration(timelockAnalytics.mediumThreatDelay)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 dark:bg-yellow-400 rounded-full"
                        style={{ width: `${(timelockAnalytics.mediumThreatDelay / timelockAnalytics.highThreatDelay) * 100}%` }}
                      ></div>
                    </div>
                  </li>
                  
                  <li>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-rose-500 mr-2"></div>
                        <span className="text-sm text-rose-600 dark:text-rose-400">High Threat</span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formatDuration(timelockAnalytics.highThreatDelay)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 dark:bg-rose-400 rounded-full"
                        style={{ width: `100%` }}
                      ></div>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-5">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Security Impact</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  High threats require <span className="text-red-800 dark:text-red-200 font-medium">{formatDuration(timelockAnalytics.highThreatDelay)}</span> delay
                  which is <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {Math.round(timelockAnalytics.highThreatDelay / timelockAnalytics.lowThreatDelay)}x
                  </span> longer than low threats (<span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatDuration(timelockAnalytics.lowThreatDelay)}
                  </span>).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timelock Information */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
          <div className="w-3 h-8 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded mr-2"></div>
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Timelock Information</h3>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l"></div>
              <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Timelock Purpose</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The timelock mechanism adds a security layer to governance operations by enforcing a mandatory delay between 
                proposal approval and execution. 
              </p>
            </div>
            
            <div className="rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l"></div>
              <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Threat Level System</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Threat levels provide flexible security by scaling timelock delays based on perceived risk. High-risk actions 
                that could significantly impact the protocol must wait longer, while low-risk actions may be 
                executed more quickly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TimelockAnalyticsPage;