import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  MapPin, 
  Home, 
  Briefcase, 
  Network, 
  BarChart4, 
  CircleDollarSign, 
  Landmark, 
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  Award,
  Target,
  AlertOctagon
} from 'lucide-react';
import MissionTabContent from '../components/MissionTabContent';
import TokenTabContent from '../components/TokenTabContent';
import GovernanceTabContent from '../components/GovernanceTabContent';
import SecurityTabContent from '../components/SecurityTabContent';

const JustDAOLandingPage = ({ onNavigateToMain }) => {
  // Function to navigate to specific app section
  const navigateToAppSection = (section) => {
    console.log(`Attempting to navigate to section: ${section}`);
    
    // First, try the prop-based navigation
    if (typeof onNavigateToMain === 'function') {
      console.log('Using onNavigateToMain for navigation');
      onNavigateToMain(section);
    }
    
    // Set the active tab directly
    setActiveTab(section);
    
    // Fallback navigation methods
    setTimeout(() => {
      // Try data-tab attribute
      const tabElement = document.querySelector(`[data-tab="${section}"]`);
      if (tabElement) {
        console.log(`Found tab element for ${section}`);
        tabElement.click();
        return;
      }
      
      // Try alternative selectors
      const alternativeSelectors = [
        `[data-tab="${section}-tab"]`,
        `button[aria-controls="${section}"]`,
        `a[href="#${section}"]`
      ];
      
      for (const selector of alternativeSelectors) {
        const fallbackElement = document.querySelector(selector);
        if (fallbackElement) {
          console.log(`Found fallback element with selector: ${selector}`);
          fallbackElement.click();
          return;
        }
      }
      
      console.error(`Could not find navigation target for section: ${section}`);
    }, 100);
  };

  const [activeTab, setActiveTab] = useState('mission');
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  // Dynamic zoom calculation based on viewport width
  const getZoomScale = () => {
    // Get current viewport width
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    
    // Scale based on viewport width - more zoom for smaller screens
    // Added 1.25 multiplier for all scales
    if (vw < 320) return 1.8 * 1.25;
    if (vw < 375) return 1.6 * 1.25;
    if (vw < 425) return 1.5 * 1.25;
    if (vw < 500) return 1.3 * 1.25;
    return 1.25 * 1.25; // Default zoom level with 1.25 multiplier
  };

  // Dynamic nav scaling based on the actual navigation width
  // Only starts scaling when buttons would overflow
  const getNavScale = () => {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    
    // First check if we're below sm: breakpoint (640px in Tailwind)
    // If not, don't scale at all
    if (vw >= 640) return 1;
    
    // Only start scaling when buttons would actually touch the edges
    // These breakpoints should be fine-tuned based on the actual content width
    // By default, don't scale until very narrow viewports
    if (vw >= 540) return 1; // Don't scale until needed
    if (vw < 540 && vw >= 500) return 0.95;
    if (vw < 500 && vw >= 460) return 0.9;
    if (vw < 460 && vw >= 420) return 0.85;
    if (vw < 420 && vw >= 380) return 0.8;
    if (vw < 380) return 0.75;
    
    return 1; // Default - no scaling
  };

  const [zoomScale, setZoomScale] = useState(1.25);
  const [navScale, setNavScale] = useState(1);

  // Update zoom scale and nav scale on resize
  useEffect(() => {
    const handleResize = () => {
      // Update the scale values
      setZoomScale(getZoomScale());
      setNavScale(getNavScale());
    };
    
    // Set initial values
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // No dependencies needed
  


  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section - Using SCOTUS.png for desktop and Small.png for mobile */}
      <div className="relative h-[35vh] md:h-[45vh] lg:h-[55vh] w-full overflow-hidden">
        {/* Desktop version with smooth transition */}
        <div className="absolute inset-0 hidden sm:block">
          <img 
            src="SCOTUS.png" 
            alt="Supreme Court" 
            className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-300 ease-out"
          />
          <div className="absolute inset-0 bg-indigo-900/10 dark:bg-indigo-950/20 transition-all duration-300 ease-out"></div>
        </div>

        {/* Mobile version with enhanced dynamic zoom effect and increased opacity */}
        <div className="absolute inset-0 sm:hidden">
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img 
              src="Small.png" 
              alt="Supreme Court Mobile" 
              className="absolute inset-0 w-full h-full object-cover object-right transform-gpu"
              style={{ 
                transform: `scale(${zoomScale})`, 
                transformOrigin: 'center 50%', /* Moved crop up slightly */
                transition: 'transform 0.3s ease-out'
              }}
            />
            <div 
              className="absolute inset-0 bg-indigo-900/20 dark:bg-indigo-950/30"
              style={{ 
                transform: `scale(${zoomScale})`, 
                transformOrigin: 'center 50%', /* Moved crop up slightly */
                transition: 'transform 0.3s ease-out, background-color 0.3s ease-out'
              }}
            ></div>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end h-full">
  <div className="pb-5">
    <div className="flex flex-row flex-wrap xs:flex-nowrap items-center gap-4">
      <h1 
        className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white flex-shrink-0" 
        style={{ textShadow: "0 0 2px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)" }}
      >
        JustDAO
      </h1>
      <div className="flex-shrink min-w-fit">
        <button
          onClick={() => setShowDisclaimerModal(true)}
          className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md text-black dark:text-white bg-amber-400 bg-opacity-80 dark:bg-amber-600 dark:bg-opacity-80 hover:bg-amber-500 dark:hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-colors whitespace-nowrap"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          Legal Disclaimer
        </button>
      </div>
    </div>
    <div className="mt-2 inline-block">
      <p 
        className="text-lg sm:text-xl text-white font-medium   px-1 py-0 rounded-full"
        style={{ 
          textShadow: "0 0 5px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)"
        }}
      >
        <strong>Community-Minded Justice</strong>
      </p>
    </div>
  </div>
</div>

        {/* Legal Disclaimer Modal */}
        {showDisclaimerModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out">
            <div 
              className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col w-full max-w-3xl max-h-[85vh] border border-gray-100 dark:border-slate-700 transform transition-all"
              aria-modal="true"
              role="dialog"
              aria-labelledby="modal-title"
            >
              <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-800">
                <h3 id="modal-title" className="text-xl font-semibold text-slate-900 dark:text-white">
                  Important Legal Disclaimer
                </h3>
                <button 
                  onClick={() => setShowDisclaimerModal(false)} 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-grow text-slate-700 dark:text-slate-300 space-y-5 text-base">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500 dark:border-red-400">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    <strong>JustDAO</strong> is not a law firm and does not provide legal services directly.
                  </p>
                </div>

                <p>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">JustDAO</span> is a <span className="italic">decentralized autonomous organization</span> that supports legal aid initiatives through <span className="font-medium">community-directed funding and governance</span>.
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">
                    Participation in <strong>JustDAO</strong> is subject to the following important limitations and risks:
                  </p>

                  <ol className="list-decimal pl-5 space-y-3 text-sm md:text-base ml-2">
                    <li className="pb-2">
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        JustDAO does not establish an attorney-client relationship with token holders, voters, or other governance participants.
                      </span>
                    </li>
                    <li className="pb-2">
                      Legal services are provided exclusively by independent legal aid providers selected by the DAO. <strong>JustDAO</strong> itself does not deliver or directly supervise these services.
                    </li>
                    <li className="pb-2">
                      Participation in DAO governance <span className="font-medium">does not constitute the practice of law</span>. 
                    </li>
                    <li className="pb-2">
                    All governance activity must comply with relevant laws and regulations. Governance decisions may have <span className="italic">real-world legal and policy implications</span>.
                    </li>
                    <li className="pb-2">
                      The DAO is structured to maintain a clear separation between governance decisions and the independent legal work performed by service providers.
                    </li>
                    <li className="pb-2">
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        JustDAO provides no warranties or guarantees
                      </span> regarding the quality, accuracy, or outcomes of services offered by funded providers.
                    </li>
                    <li className="pb-2">
                      Regulatory frameworks affecting DAOs, digital assets, and the funding of legal services are evolving and may impact <strong>JustDAO</strong>'s ability to operate.
                    </li>
                    <li className="pb-2">
                      There are technical risks inherent in DAO-based systems, including potential vulnerabilities in smart contracts, infrastructure failures, or security breaches.
                    </li>
                  </ol>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border-l-4 border-indigo-500 dark:border-indigo-400">
                  <p className="font-medium">
                    By participating in <span className="text-indigo-600 dark:text-indigo-400 font-semibold">JustDAO</span>, you acknowledge and accept these risks and limitations. If you require legal advice regarding your personal situation, please consult directly with a <span className="font-bold text-red-600 dark:text-red-400">licensed attorney</span>.
                  </p>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
                <button 
                  onClick={() => setShowDisclaimerModal(false)} 
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-200 shadow-sm"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      

      {/* Tabs Navigation - Updated to center below sm: breakpoint and scale only when needed */}
      <div className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-2 sm:px-7 lg:px-8 py-3">
          <nav className="w-full">
            {/* Use Tailwind classes for centering below sm: breakpoint to match Small.png exactly */}
            <div className="flex justify-start sm:justify-start items-center"
                 style={{
                   transform: navScale < 1 ? `scale(${navScale})` : 'scale(1)',
                   transformOrigin: 'center',
                   transition: 'transform 0.3s ease-out'
                 }}>
              {/* First group: Mission and Governance */}
              <div className="flex gap-2 md:gap-4">
                {/* Mission tab */}
                <button 
                  className={`
                    relative py-2 md:py-3 px-3 md:px-5 cursor-pointer 
                    text-center transition-all duration-300 
                    ${activeTab === 'mission' 
                      ? 'text-indigo-800 md:text-indigo-600 dark:text-indigo-200 md:dark:text-indigo-400' 
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
                  `}
                  onClick={() => setActiveTab('mission')}
                  data-tab="mission"
                  type="button"
                >
                  <span className="relative text-md md:text-base whitespace-nowrap">
                    Mission
                    <span 
                      className={`
                        absolute left-0 right-0 -bottom-1 h-0.5 transition-all duration-300
                        ${activeTab === 'mission' 
                          ? 'bg-gradient-to-r from-indigo-500/0 via-indigo-500 to-indigo-500/0 opacity-100' 
                          : 'bg-gray-300/50 dark:bg-gray-600/50 opacity-0 group-hover:opacity-100'}
                      `}
                    />
                  </span>
                </button>
                
                {/* Governance tab - moved before Token */}
                <button 
                  className={`
                    relative py-2 md:py-3 px-3 md:px-5 cursor-pointer 
                    text-center transition-all duration-300 
                    ${activeTab === 'governance' 
                      ? 'text-indigo-800 md:text-indigo-600 dark:text-indigo-200 md:dark:text-indigo-400' 
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
                  `}
                  onClick={() => setActiveTab('governance')}
                  data-tab="governance"
                  type="button"
                >
                  <span className="relative text-md md:text-base whitespace-nowrap">
                    Governance
                    <span 
                      className={`
                        absolute left-0 right-0 -bottom-1 h-0.5 transition-all duration-300
                        ${activeTab === 'governance' 
                          ? 'bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-100' 
                          : 'bg-gray-300/50 dark:bg-gray-600/50 opacity-0 group-hover:opacity-100'}
                      `}
                    />
                  </span>
                </button>
              
                {/* Token tab */}
                <button 
                  className={`
                    relative py-2 md:py-3 px-3 md:px-5 cursor-pointer 
                    text-center transition-all duration-300 
                    ${activeTab === 'token' 
                      ? 'text-indigo-800 md:text-indigo-600 dark:text-indigo-200 md:dark:text-indigo-400' 
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
                  `}
                  onClick={() => setActiveTab('token')}
                  data-tab="token"
                  type="button"
                >
                  <span className="relative text-md md:text-base whitespace-nowrap">
                    Token
                    <span 
                      className={`
                        absolute left-0 right-0 -bottom-1 h-0.5 transition-all duration-300
                        ${activeTab === 'token' 
                          ? 'bg-gradient-to-r from-purple-500/0 via-purple-500 to-purple-500/0 opacity-100' 
                          : 'bg-gray-300/50 dark:bg-gray-600/50 opacity-0 group-hover:opacity-100'}
                      `}
                    />
                  </span>
                </button>
                
                {/* Security tab */}
                <button 
                  className={`
                    relative py-2 md:py-3 px-3 md:px-5 cursor-pointer 
                    text-center transition-all duration-300 
                    ${activeTab === 'security' 
                      ? 'text-indigo-800 md:text-indigo-600 dark:text-indigo-200 md:dark:text-indigo-400' 
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}
                  `}
                  onClick={() => setActiveTab('security')}
                  data-tab="security"
                  type="button"
                >
                  <span className="relative text-md md:text-base whitespace-nowrap">
                    Security
                    <span 
                      className={`
                        absolute left-0 right-0 -bottom-1 h-0.5 transition-all duration-300
                        ${activeTab === 'security' 
                          ? 'bg-gradient-to-r from-teal-500/0 via-teal-500 to-teal-500/0 opacity-100' 
                          : 'bg-gray-300/50 dark:bg-gray-600/50 opacity-0 group-hover:opacity-100'}
                      `}
                    />
                  </span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
        <div className="w-full overflow-x-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">Loading on-chain data...</span>
            </div>
          ) : connectionError ? (
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Connection Error</h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'mission' && (
                <MissionTabContent 
                  navigateToAppSection={navigateToAppSection}
                />
              )}

              {/* Token Tab */}
              {activeTab === 'token' && (
                <div className="w-full overflow-x-hidden">
                  <TokenTabContent 
                    navigateToAppSection={navigateToAppSection}
                  />
                </div>
              )}
               
              {/* Governance Tab */}
              {activeTab === 'governance' && (
                <GovernanceTabContent 
                  navigateToAppSection={navigateToAppSection}
                />
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <SecurityTabContent 
                  navigateToAppSection={navigateToAppSection}
                />
              )}
            </>
          )}
        </div>
      </main>

     {/* Footer */}
<footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="md:flex md:items-center md:justify-between">
      <div className="flex items-center">
        <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">JustDAO</div>
        <p className="ml-3 text-gray-500 dark:text-gray-400">Decentralized Legal Aid Governance</p>
      </div>
      {/* Updated navigation with transition scaling */}
      <div className="mt-8 md:mt-0">
        <nav className="flex gap-6" style={{
          transform: navScale < 1 ? `scale(${navScale})` : 'scale(1)',
          transformOrigin: 'right center',
          transition: 'transform 0.3s ease-out'
        }}>
          <a href="#mission" onClick={() => setActiveTab('mission')} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 whitespace-nowrap">
            Mission
          </a>
          <a href="#token" onClick={() => setActiveTab('token')} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 whitespace-nowrap">
            Token
          </a>
          <a href="#governance" onClick={() => setActiveTab('governance')} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 whitespace-nowrap">
            Governance
          </a>
          <a href="#security" onClick={() => setActiveTab('security')} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 whitespace-nowrap">
            Security
          </a>
        </nav>
      </div>
    </div>
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 flex items-center justify-between">
      <p className="text-base text-gray-400">
      </p>
      {/* Enter App button only - removed connect wallet button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          console.log('Enter App button clicked');
          navigateToAppSection('dashboard');
          // Direct fallback if the function doesn't work
          const dashboardTab = document.querySelector('[data-tab="dashboard"]');
          if (dashboardTab) {
            setTimeout(() => {
              if (!document.querySelector('.dashboard-content')) {
                console.log('Direct fallback click for dashboard');
                dashboardTab.click();
              }
            }, 100);
          }
        }}
        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300"
      >
        Enter App
      </button>
    </div>
  </div>
</footer>
    </div>
  );
};

export default JustDAOLandingPage;