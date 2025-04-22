import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Award, Users, RefreshCw, FileJson, AlertTriangle, 
         ArrowUpRight, MapPin, MessageSquare, Zap, Clock, TrendingUp,
         Check, ExternalLink, Database, BarChart, PieChart, UserCheck } from 'lucide-react';

// Reusable CopyButton component with visual feedback
const CopyButton = ({ textToCopy, className = "" }) => {
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
      } ${className}`}
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

const CurrentStatsPage = () => {
  const [currentStatsData, setCurrentStatsData] = useState(null);
  const [loadingCurrentStats, setLoadingCurrentStats] = useState(true);
  const [error, setError] = useState(null);
  const [currentStatsLastUpdated, setCurrentStatsLastUpdated] = useState(null);
  
  const formatDollars = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const loadCurrentStatsData = async () => {
    setLoadingCurrentStats(true);
    setError(null);
    
    // Define multiple possible paths to try
    const possiblePaths = [
      // Local relative paths
      '/my-react-app/data/current-stats.json',
      './data/current-stats.json',
      '../data/current-stats.json',
      'data/current-stats.json',
      
      // Try explicit HTTP URLs to XAMPP server (not HTTPS)
      'http://localhost/data/current-stats.json',
      'http://localhost/my-react-app/data/current-stats.json',
      'http://127.0.0.1/data/current-stats.json',
      'http://127.0.0.1/my-react-app/data/current-stats.json',
      
      // JSON file in current directory
      'current-stats.json'
    ];
    
    let lastError = null;
    
    // Try each path until we get a valid response
    for (const path of possiblePaths) {
      try {
        console.log(`Attempting to fetch stats from: ${path}`);
        
        const response = await fetch(path, {
          headers: {
            'Accept': 'application/json',
          },
          method: 'GET',
          cache: 'no-cache',
          // Explicitly allow cross-origin requests & mixed content (HTTP from HTTPS)
          mode: 'cors',
          credentials: 'same-origin'
        });
        
        if (!response.ok) {
          console.log(`Failed fetch from ${path}: ${response.status} ${response.statusText}`);
          continue; // Try next path
        }
        
        // Read the response as text first to check for HTML content
        const text = await response.text();
        
        // Check if we got HTML instead of JSON
        if (text.trim().startsWith('<')) {
          console.log(`Received HTML instead of JSON from ${path}`, text.substring(0, 100));
          continue; // Try next path
        }
        
        // Parse the JSON manually since we already consumed the response as text
        const data = JSON.parse(text);
        console.log(`Successfully loaded stats from: ${path}`);
        
        setCurrentStatsData(data);
        setCurrentStatsLastUpdated(new Date());
        setLoadingCurrentStats(false);
        
        // We succeeded, so return early
        return;
      } catch (err) {
        console.error(`Error fetching from ${path}:`, err);
        lastError = err;
        // Continue to try next path
      }
    }
    
    // Last resort: Try to load the data directly through XHR
    try {
      console.log("Attempting XHR request as final fallback");
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'http://localhost/my-react-app/data/current-stats.json', false); // Synchronous
      xhr.send();
      
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log("Successfully loaded stats via XHR");
        
        setCurrentStatsData(data);
        setCurrentStatsLastUpdated(new Date());
        setLoadingCurrentStats(false);
        return;
      }
    } catch (err) {
      console.error("XHR fallback failed:", err);
      // Move on to final fallback
    }
    
    // Emergency fallback: Use hardcoded sample data for a new organization
    console.log("All fetch attempts failed. Using fallback data.");
    const fallbackData = {
      "financialMetrics": {
        "totalFundsDistributed":"0",
        "estimatedUsdValue": 0,
        "treasuryGrowthRate": "0",
        "treasuryGrowthChange": "0",
        "fundsDistributedTrend": "up",
        "fundsDistributedChange": "0",
        "circulatingSupply": "0",
        "totalSupply": "0",
        "tokenContract": "0xb0bCE9452329EC979CF7BA06801dDa070FF8b835"
      },
      "governanceMetrics": {
        "activeInitiatives": 0,
         "avgCost": "0",
        "initiativeDistribution": {
          "housing": 0,
          "family": 0,
          "immigration": 0,
          "consumer": 0
        }
      },
      "communityMetrics": {
        "totalMembers": 0,
        "newMembersLastMonth": 0,
        "membershipTrend": "up",
        "participationRate": "0%",
        "delegationStabilityIndex": 0,
        "forumPosts": 0,
        "discordMembers": 0,
        "forumThreads": 0,
        "newThreadsLastMonth": 0,
        "activeForumUsers": 0,
        "forumEngagementRate": "0%",
        "mostActiveTopicTitle": "Community Onboarding Guide",
        "mostActiveTopicPosts": 0,
        "newPostsLastMonth": 0,
        "discordActiveUsers": 0
      },
      "impactMetrics": {
        "casesResolved": {
          "total": 0,
          "quarterly": {
            "q1": 0,
            "q2": 0,
            "q3": 0,
            "q4": 0
          },
          "byType": {
            "housing": 0,
            "family": 0,
            "immigration": 0,
            "consumer": 0
          }
        },
        "externalAnalysis": {
          "evictionCrisis": {
            "description": "Eviction filings have increased by 24% in target communities"
          },
          "immigrationBacklog": {
            "description": "Current immigration case backlog is 14 months on average"
          }
        },
        "impactAssessment": {
          "monetaryBenefit": {
            "total": 0,
            "average": 0
          },
          "clientSatisfaction": 0,
          "returnRate": 0,
          "volunteerHours": 0,
          "referralRate": 0,
          "communityPartners": 0
        }
      }
    };
    
    setCurrentStatsData(fallbackData);
    setCurrentStatsLastUpdated(new Date());
    setError(`Using demo data. Could not connect to server.`);
    setLoadingCurrentStats(false);
  };

  // Load data when component mounts
  useEffect(() => {
    loadCurrentStatsData();
  }, []);

  if (loadingCurrentStats) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400 mb-4"></div>
        <div className="text-slate-500 dark:text-slate-400">Loading current stats...</div>
      </div>
    );
  }

  if (error && !currentStatsData) {
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
	const tokenAddress =
	  financialMetrics?.tokenContract ||
	  process.env.REACT_APP_TOKEN_ADDRESS ||
	  "Could not load Token Address!";
  return (
    <div className="space-y-8">
      {/* Show warning if using fallback data */}
      {error && currentStatsData && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 text-amber-500" />
            <div>{error}</div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={loadCurrentStatsData}
              className="px-3 py-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
            >
              <RefreshCw className="w-3 h-3 inline mr-1" />
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* Last updated info */}
      {currentStatsLastUpdated && (
        <div className="flex items-center justify-end text-xs text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {currentStatsLastUpdated.toLocaleString()}
        </div>
      )}
      
      {/* Financial & Treasury Metrics */}
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-lg">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-slate-50 dark:from-emerald-900/20 dark:to-slate-800/50">
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Financial & Treasury Metrics</h3>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col transition-all hover:translate-y-[-2px]">
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

            <div className="flex flex-col transition-all hover:translate-y-[-2px]">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Estimated USD Value</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {formatDollars(financialMetrics?.estimatedUsdValue || 0)}
              </span>
            </div>

            <div className="flex flex-col transition-all hover:translate-y-[-2px]">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Treasury Growth Rate</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {financialMetrics?.treasuryGrowthRate || "0"}% MoM
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/70 dark:to-slate-700/40 rounded-lg p-4 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
		  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
			JST Token Contract
		  </div>
		  <div className="flex items-center">
			<div className="font-mono text-xs break-all text-slate-600 dark:text-slate-400 mr-2">
			  {tokenAddress}
			</div>
			<CopyButton textToCopy={tokenAddress} />
		  </div>
		  <div className="text-xs text-indigo-600 dark:text-indigo-400 italic mt-1">
			✨ Send ETH here to mint JST tokens - instant tokenization!
		  </div>
		</div>
        </div>
      </div>
      
      {/* Governance Activity & Metrics */}
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-lg">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-900/20 dark:to-slate-800/50">
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Program Metrics</h3>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col transition-all hover:translate-y-[-2px]">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active Initiatives</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {governanceMetrics?.activeInitiatives?.toString() || "0"}
              </span>
            </div>

         

         

            <div className="flex flex-col transition-all hover:translate-y-[-2px]">
              <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Avg. Initiative Expenditure</span>
              <span className="text-xl font-medium text-slate-800 dark:text-slate-200">
                {governanceMetrics?.avgCost || "0"} USD
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Initiative Distribution
            </div>
            <div className="h-6 w-full flex rounded-lg overflow-hidden">
              <div 
                className="bg-blue-400 dark:bg-blue-600 flex items-center justify-center text-white text-xs transition-all hover:brightness-110 overflow-hidden" 
                style={{width: `${(governanceMetrics?.initiativeDistribution?.housing || 25)}%`}} 
              >
                <span className="truncate px-1">Housing</span>
              </div>
              <div 
                className="bg-purple-400 dark:bg-purple-600 flex items-center justify-center text-white text-xs transition-all hover:brightness-110 overflow-hidden" 
                style={{width: `${(governanceMetrics?.initiativeDistribution?.family || 25)}%`}} 
              >
                <span className="truncate px-1">Family</span>
              </div>
              <div 
                className="bg-green-400 dark:bg-green-600 flex items-center justify-center text-white text-xs transition-all hover:brightness-110 overflow-hidden" 
                style={{width: `${(governanceMetrics?.initiativeDistribution?.immigration || 25)}%`}} 
              >
                <span className="truncate px-1">Immigration</span>
              </div>
              <div 
                className="bg-amber-400 dark:bg-amber-600 flex items-center justify-center text-white text-xs transition-all hover:brightness-110 overflow-hidden" 
                style={{width: `${(governanceMetrics?.initiativeDistribution?.consumer || 25)}%`}} 
              >
                <span className="truncate px-1">Consumer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community & Impact Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Community & Forum Metrics - Replaced Gini Coefficient with Forum Stats */}
        <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-lg">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-800/50">
            <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Community & Forum Metrics</h3>
          </div>

          <div className="p-5 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-1 transition-all hover:translate-y-[-2px]">
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

              <div className="flex-1 space-y-1 transition-all hover:translate-y-[-2px]">
                <div className="text-sm text-slate-500 dark:text-slate-400">Participation Rate</div>
                <div className="text-xl font-medium text-slate-800 dark:text-slate-200">
                  {communityMetrics?.participationRate || "0%"}
                </div>
              </div>
            </div>

            {/* Modern Forum Stats Cards - New Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/10 transition-all hover:shadow-md hover:translate-y-[-2px]">
                <MessageSquare className="h-5 w-5 text-blue-500 mb-2" />
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Total Threads</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {communityMetrics?.forumThreads || "0"}
                </div>
                <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 inline mr-1" />
                  <span>+{communityMetrics?.newThreadsLastMonth || "0"} this month</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-800 dark:to-purple-900/10 transition-all hover:shadow-md hover:translate-y-[-2px]">
                <MessageSquare className="h-5 w-5 text-purple-500 mb-2" />
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Total Posts</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {communityMetrics?.forumPosts || "0"}
                </div>
                <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 inline mr-1" />
                  <span>+{communityMetrics?.newPostsLastMonth || "0"} this month</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-800 dark:to-green-900/10 transition-all hover:shadow-md hover:translate-y-[-2px]">
                <Zap className="h-5 w-5 text-green-500 mb-2" />
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Active Users</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {communityMetrics?.activeForumUsers || "0"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  in the last 30 days
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-amber-50 dark:from-slate-800 dark:to-amber-900/10 transition-all hover:shadow-md hover:translate-y-[-2px]">
                <TrendingUp className="h-5 w-5 text-amber-500 mb-2" />
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Engagement Rate</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {communityMetrics?.forumEngagementRate || "0%"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  posts per active user
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1 p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700/50 border border-slate-200/80 dark:border-slate-700/50 transition-all hover:shadow-sm">
                <div className="text-xs text-slate-500 dark:text-slate-400">Most Active Topic</div>
                <a 
                  href="http://localhost/mybb/thread-1.html"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate flex items-center"
                >
                  {communityMetrics?.mostActiveTopicTitle || "None"}
                  <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                </a>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {communityMetrics?.mostActiveTopicPosts || "0"} posts
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Metrics & Statistics */}
        <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-lg">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-slate-50 dark:from-purple-900/20 dark:to-slate-800/50">
            <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Impact Metrics & Statistics</h3>
          </div>

          <div className="p-5 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-1 transition-all hover:translate-y-[-2px]">
                <div className="text-sm text-slate-500 dark:text-slate-400">Cases Resolved</div>
                <div className="text-xl font-medium text-slate-800 dark:text-slate-200">
                  {impactMetrics?.casesResolved?.total?.toString() || "0"}
                </div>
              </div>

              <div className="flex-1 space-y-1 transition-all hover:translate-y-[-2px]">
                <div className="text-sm text-slate-500 dark:text-slate-400">This Quarter</div>
                <div className="text-xl font-medium text-slate-800 dark:text-slate-200">
                  {impactMetrics?.casesResolved?.quarterly?.q2?.toString() || "0"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 text-xs font-medium transition-all hover:bg-blue-200 dark:hover:bg-blue-800/40">
                {impactMetrics?.casesResolved?.byType?.housing || "0"} Housing
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 text-xs font-medium transition-all hover:bg-purple-200 dark:hover:bg-purple-800/40">
                {impactMetrics?.casesResolved?.byType?.family || "0"} Family Law
              </span>
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 text-xs font-medium transition-all hover:bg-green-200 dark:hover:bg-green-800/40">
                {impactMetrics?.casesResolved?.byType?.immigration || "0"} Immigration
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 text-xs font-medium transition-all hover:bg-amber-200 dark:hover:bg-amber-800/40">
                {impactMetrics?.casesResolved?.byType?.consumer || "0"} Consumer
              </span>
            </div>

            {/* New Added Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800 dark:to-indigo-900/10 transition-all hover:shadow-md hover:translate-y-[-2px]">
                <UserCheck className="h-4 w-4 text-indigo-500 mb-1" />
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Client Satisfaction</div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {impactMetrics?.impactAssessment?.clientSatisfaction || "0"}%
                </div>
              </div>
              
          
              
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-800 dark:to-purple-900/10 transition-all hover:shadow-md hover:translate-y-[-2px]">
                <Clock className="h-4 w-4 text-purple-500 mb-1" />
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Pro Bono Hours</div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {impactMetrics?.impactAssessment?.volunteerHours || "0"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-900/10 rounded-lg border border-slate-200/80 dark:border-indigo-800/30 transition-all hover:shadow-md hover:translate-y-[-2px]">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shadow-sm">
                  <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Monetary Benefit to Clients</div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatDollars(impactMetrics?.impactAssessment?.monetaryBenefit?.total || 0)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-800 dark:to-green-900/10 rounded-lg border border-slate-200/80 dark:border-green-800/30 transition-all hover:shadow-md hover:translate-y-[-2px]">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-green-100 dark:bg-green-900/50 flex items-center justify-center shadow-sm">
                  <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Immigration Cases</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {impactMetrics?.externalAnalysis?.immigrationBacklog?.description || "Not available"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-amber-50 dark:from-slate-800 dark:to-amber-900/10 rounded-lg border border-slate-200/80 dark:border-amber-800/30 transition-all hover:shadow-md hover:translate-y-[-2px]">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shadow-sm">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Eviction Crisis</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {impactMetrics?.externalAnalysis?.evictionCrisis?.description || "Not available"}
                  </div>
                </div>
              </div>
              
              {/* New community partners card */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/10 rounded-lg border border-slate-200/80 dark:border-blue-800/30 transition-all hover:shadow-md hover:translate-y-[-2px]">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shadow-sm">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Community Partners</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {impactMetrics?.impactAssessment?.communityPartners || "0"}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Active collaborating organizations
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