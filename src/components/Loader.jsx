import React, { useState, useEffect } from 'react';

const Loader = ({ size = 'medium', text = 'Loading...' }) => {
  const [showRefreshMessage, setShowRefreshMessage] = useState(false);
  
  useEffect(() => {
    // Set a timer to show the refresh message after 8 seconds
    const timer = setTimeout(() => {
      setShowRefreshMessage(true);
    }, 40000);
    
    // Clean up the timer when component unmounts
    return () => clearTimeout(timer);
  }, []);
  
  let spinnerSize;
  
  switch (size) {
    case 'small':
      spinnerSize = 'h-6 w-6';
      break;
    case 'large':
      spinnerSize = 'h-16 w-16';
      break;
    case 'medium':
    default:
      spinnerSize = 'h-10 w-10';
      break;
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400 ${spinnerSize}`}></div>
      
      <div className="mt-2 text-center">
        <p className="text-gray-700 dark:text-gray-300">{text}</p>
        
        {showRefreshMessage && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Taking too long? Check your wallet provider then try refreshing your browser.
          </p>
        )}
      </div>
    </div>
  );
};

export default Loader;