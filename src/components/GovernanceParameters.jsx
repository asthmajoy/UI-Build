import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const GovernanceParameters = ({ govParams, timelockAnalytics, formatTimeDuration, formatDuration, formatTokenAmount, threatLevelDelays }) => {
  const [isGovExpanded, setIsGovExpanded] = useState(false);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm mb-6 overflow-hidden border border-slate-200 dark:border-slate-700">
      <div 
        onClick={() => setIsGovExpanded(!isGovExpanded)} 
        className="flex items-center justify-between px-5 py-3 cursor-pointer bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 transition-colors duration-300 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <div className="flex items-center">
          <div className={`relative w-3 h-3 ${isGovExpanded ? 'bg-indigo-500' : 'bg-slate-400'} rounded-full mr-3 transition-all duration-300 ${isGovExpanded ? 'animate-pulse' : ''}`}>
            {isGovExpanded && (
              <span className="absolute -inset-1 bg-indigo-500 rounded-full animate-ping opacity-75"></span>
            )}
          </div>
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Governance Parameters</h3>
          {govParams.loading && <div className="ml-2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-[spin_5s_linear_infinite]" />}
          </div>
        {isGovExpanded ? 
          <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" /> : 
          <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        }
      </div>

      {govParams.error && (
        <div className="text-sm text-rose-500 dark:text-rose-400 mt-1 px-5 py-2">
          {govParams.error}
        </div>
      )}

      {/* Collapsible content with improved table rows and dividers */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isGovExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="p-5">
          <div className="flex flex-col md:flex-row border rounded-lg overflow-visible">
            {/* Core Parameters */}
            <div className="flex-1 md:border-r dark:md:border-r-slate-700">
              <div className="h-full flex flex-col">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/30">
                  <h4 className="text-sm font-medium text-slate-800 dark:text-white flex items-center text-left md:text-center md:justify-center">
                    Core Parameters
                  </h4>
                </div>
                <div className="flex-grow p-3">
                  <ul className="space-y-0 text-sm divide-y divide-slate-100 dark:divide-slate-700/50">
                    <li className="flex justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                      <span className="text-slate-600 dark:text-slate-400 text-left">Quorum</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{govParams.formattedQuorum} JST</span>
                    </li>
                    <li className="flex justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                      <span className="text-slate-600 dark:text-slate-400 text-left">Voting Duration</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{govParams.formattedDuration}</span>
                    </li>
                    <li className="flex justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                      <span className="text-slate-600 dark:text-slate-400 text-left">Proposal Threshold</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{govParams.formattedThreshold} JST</span>
                    </li>
                    <li className="flex justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                      <span className="text-slate-600 dark:text-slate-400 text-left">Proposal Stake</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{govParams.formattedStake} JST</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Threat Levels */}
            <div className="flex-1 md:border-r dark:md:border-r-slate-700 border-t md:border-t-0 dark:border-t-slate-700">
              <div className="h-full flex flex-col">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/30">
                  <h4 className="text-sm font-medium text-slate-800 dark:text-white flex items-center text-left md:text-center md:justify-center">
                    Threat Levels
                  </h4>
                </div>
                <div className="flex-grow p-3">
                  <ul className="space-y-0 text-sm divide-y divide-slate-100 dark:divide-slate-700/50">
                    <li className="flex justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                      <span className="text-emerald-600 dark:text-emerald-400 text-left">
                        Low Threat
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{formatTimeDuration(threatLevelDelays[0] || 0)}</span>
                    </li>
                    <li className="flex justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                      <span className="text-amber-600 dark:text-amber-400 text-left">
                        Medium Threat
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{formatTimeDuration(threatLevelDelays[1] || 0)}</span>
                    </li>
                    <li className="flex justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                      <span className="text-rose-600 dark:text-rose-400 text-left">
                        High Threat
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{formatTimeDuration(threatLevelDelays[2] || 0)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

           {/* Refund Percentages */}
			<div className="flex-1 md:border-r dark:md:border-r-slate-700 border-t md:border-t-0 dark:border-t-slate-700 ">
			  <div className="h-full flex flex-col">
				<div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/30">
				  <h4 className="text-sm font-medium text-slate-800 dark:text-white flex items-center text-left md:text-center md:justify-center">
					Refund Percentages
				  </h4>
				</div>
				<div className="flex-grow p-3">
				  <ul className="space-y-2 text-sm">
					<li className="flex justify-between py-2 px-3 rounded-lg bg-red-100 dark:bg-red-900/40">
					  <span className="text-red-800 dark:text-red-300 text-left">
						Defeated
					  </span>
					  <span className="font-medium text-red-800 dark:text-red-300 text-right">{govParams.defeatedRefundPercentage}%</span>
					</li>
					<li className="flex justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600">
					  <span className="text-gray-700 dark:text-gray-300 text-left">
						Canceled
					  </span>
					  <span className="font-medium text-gray-700 dark:text-gray-300 text-right">{govParams.canceledRefundPercentage}%</span>
					</li>
					<li className="flex justify-between py-2 px-3 rounded-lg bg-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
					  <span className="text-gray-800 dark:text-gray-200 text-left">
						Expired
					  </span>
					  <span className="font-medium text-gray-800 dark:text-gray-200 text-right">{govParams.expiredRefundPercentage}%</span>
					</li>
				  </ul>
				</div>
			  </div>
			</div>

            {/* Timelock Configuration */}
            <div className="flex-1 border-t md:border-t-0 dark:border-t-slate-700">
              <div className="h-full flex flex-col">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30">
                  <h4 className="text-sm font-medium text-slate-800 dark:text-white flex items-center text-left md:text-center md:justify-center">
                    Timelock
                  </h4>
                </div>
                <div className="flex-grow p-3">
                  <ul className="space-y-0 text-sm divide-y divide-slate-100 dark:divide-slate-700/50">
                    <li className="flex justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                      <span className="text-slate-600 dark:text-slate-400 text-left">Min Delay</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                        {timelockAnalytics ? formatDuration(timelockAnalytics.minDelay) : "Loading..."}
                      </span>
                    </li>
                    <li className="flex justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                      <span className="text-slate-600 dark:text-slate-400 text-left">Grace Period</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                        {timelockAnalytics ? formatDuration(timelockAnalytics.gracePeriod) : "Loading..."}
                      </span>
                    </li>
                    <li className="flex justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded transition-colors">
                      <span className="text-slate-600 dark:text-slate-400 text-left">Executor Threshold</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                        {timelockAnalytics ? formatTokenAmount(timelockAnalytics.executorThreshold) : "Loading..."} JST
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="pb-2"></div> {/* Extra padding at the bottom to ensure visibility */}
        </div>
      </div>
    </div>
  );
};

export default GovernanceParameters;