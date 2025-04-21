import React, { useState, useEffect, useCallback } from 'react';

const MobileNavigation = ({ 
  activeTab, 
  setActiveTab, 
  securitySubtab, 
  setSecuritySubtab,
  userRoles,
  hasRole,
  ROLES
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Memoized tab click handler to prevent unnecessary re-renders
  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab);
    setIsOpen(false);
    
    // If security tab is selected, also set the default subtab
    if (tab === 'security') {
      setSecuritySubtab('emergency');
    }
  }, [setActiveTab, setSecuritySubtab]);
  
  // Close menu when clicking outside or escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.mobile-nav-container')) {
        setIsOpen(false);
      }
    };
    
    const handleEscapeKey = (event) => {
      if (isOpen && event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);
  
  // Navigation menu items with role-based conditional rendering
  const navigationItems = [
    { 
      name: 'Home', 
      tab: 'home', 
      alwaysVisible: true
    },
    { 
      name: 'Dashboard', 
      tab: 'dashboard', 
      alwaysVisible: true
    },
    { 
      name: 'Proposals', 
      tab: 'proposals', 
      alwaysVisible: true
    },
    { 
      name: 'Vote', 
      tab: 'vote', 
      alwaysVisible: true
    },
    { 
      name: 'Delegation', 
      tab: 'delegation', 
      alwaysVisible: true
    },
    { 
      name: 'Analytics', 
      tab: 'analytics', 
      alwaysVisible: true
    },
    { 
      name: 'Governance', 
      tab: 'governance', 
      visible: userRoles.isGovernance || hasRole(ROLES.GOVERNANCE_ROLE) || hasRole('governance')
    },
    { 
      name: 'Security', 
      tab: 'security', 
      visible: userRoles.isAdmin || userRoles.isGuardian || hasRole(ROLES.ADMIN_ROLE) || hasRole(ROLES.GUARDIAN_ROLE) || hasRole('admin') || hasRole('guardian')
    }
  ];
  
  return (
    <div className="mobile-nav-container sm:hidden flex items-center relative">
      {/* Active Tab Display with elegant underline - INCREASED TEXT SIZE */}
      <div className="group relative mr-3">
        <span className="text-lg font-medium text-indigo-600 dark:text-indigo-400 transition-all duration-300 ease-in-out">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </span>
        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></div>
      </div>
      
      {/* Modern Hamburger Button - INCREASED SIZE AND TOUCH AREA */}
      <button
        className="p-3 px-4 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 relative group"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle mobile menu"
      >
        {/* Background effect for better visibility */}
        <span className="absolute inset-0 rounded-lg bg-gray-100 dark:bg-gray-700 border border-transparent group-hover:border-indigo-500/30 dark:group-hover:border-indigo-400/30 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out"></span>
        
        {/* Dynamic icon based on menu state - INCREASED SIZE */}
        {isOpen ? (
          <svg
            className="w-6 h-6 transform rotate-0 hover:rotate-90 transition-all duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>
      
      {/* Dropdown Menu with full width styling - moved down to avoid blocking close button */}
      {isOpen && (
        <div 
          className="fixed left-0 right-0 top-20 z-50
          shadow-lg overflow-hidden 
          bg-white/95 dark:bg-gray-800/95 backdrop-blur-md 
          border-b border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out animate-fade-in"
        >
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 px-4 py-2">
            {navigationItems
              .filter(item => item.alwaysVisible || item.visible)
              .map((item) => (
                <div
                  key={item.tab}
                  className={`
                    relative my-1 py-3 px-3 cursor-pointer rounded-lg
                    transition-all duration-200
                    ${activeTab === item.tab 
                      ? 'bg-indigo-50/70 dark:bg-indigo-900/20' 
                      : 'hover:bg-gray-50/70 dark:hover:bg-gray-700/40'}
                  `}
                  onClick={() => handleTabClick(item.tab)}
                >
                  {/* Left accent for active item */}
                  <div className={`
                    absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
                    transition-all duration-200 ease-out
                    ${activeTab === item.tab 
                      ? 'bg-indigo-500 opacity-100' 
                      : 'bg-transparent opacity-0 group-hover:opacity-40 group-hover:bg-indigo-300 dark:group-hover:bg-indigo-600'}
                  `}></div>
                  
                  <div className="flex items-center justify-between">
                    {/* Text with elegant underline effect - INCREASED TEXT SIZE */}
                    <div className="relative group/text mt-1 pl-2">
                      <span className={`
                        font-medium text-base transition-all duration-200
                        ${activeTab === item.tab 
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}
                      `}>
                        {item.name}
                      </span>
                      
                      {/* Elegant underline effect */}
                      <div className={`
                        absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent
                        transition-all duration-200 ease-in-out
                        ${activeTab === item.tab 
                          ? 'opacity-100 scale-x-100' 
                          : 'opacity-0 scale-x-0 group-hover/text:opacity-70 group-hover/text:scale-x-100'}
                      `}></div>
                    </div>
                    
                    {/* Active indicator - subtle pulse animation */}
                    {activeTab === item.tab && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse mr-2"></div>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNavigation;