// src/components/WalletSelector.js - Improvements to the existing component

import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { detectWallets, WALLET_CONNECT_PROJECT_ID } from '../utils/walletConnectConfig';
import { ethers } from 'ethers';

const WalletSelector = ({ onClose, connectWallet: externalConnectWallet }) => {
  // Get expanded context values
  const { 
    connectWallet: contextConnectWallet = () => Promise.resolve(false), 
    connectionError,
    isWalletAvailable,
    currentWalletType, // Get the current wallet type
    isConnected  // Get connection status
  } = useWeb3() || {};
  
  const [connecting, setConnecting] = useState(false);
  const [activeWallet, setActiveWallet] = useState(null);
  const [localError, setLocalError] = useState(null);
  const isMounted = useRef(true);
  
  // Track if this is a reconnection attempt
  const [isReconnecting, setIsReconnecting] = useState(!!currentWalletType);
  
  // Determine which connectWallet function to use
  const effectiveConnectWallet = typeof externalConnectWallet === 'function' 
    ? externalConnectWallet 
    : contextConnectWallet;
  
  // Get wallet detection helpers
  const { 
    isMetaMaskAvailable = () => false, 
    isTrustWalletAvailable = () => false, 
    isCoinbaseWalletAvailable = () => false 
  } = detectWallets ? detectWallets() : {};
  
  // Define wallet options
	  const wallets = [
	  {
		id: 'metamask',
		name: 'MetaMask',
		icon: resolveImagePath('metamask.svg'),
		description: 'Connect using MetaMask',
		isAvailable: isWalletAvailable ? () => isWalletAvailable('metamask') : isMetaMaskAvailable
	  },
	  {
		id: 'coinbase',
		name: 'Coinbase Wallet',
		icon: resolveImagePath('coinbase.svg'),
		description: 'Connect using Coinbase Wallet',
		isAvailable: isWalletAvailable ? () => isWalletAvailable('coinbase') : isCoinbaseWalletAvailable
	  },
	  {
		id: 'trustwallet',
		name: 'Trust Wallet',
		icon: resolveImagePath('trustwallet.svg'),
		description: 'Connect using Trust Wallet',
		isAvailable: isWalletAvailable ? () => isWalletAvailable('trustwallet') : isTrustWalletAvailable
	  },
	  {
		id: 'walletconnect',
		name: 'WalletConnect',
		icon: resolveImagePath('walletconnect.svg'),
		description: 'Connect using WalletConnect',
		isAvailable: () => true
	  }
	];
  
  // Filter available wallets
  const availableWallets = wallets.filter(wallet => {
    try {
      return typeof wallet.isAvailable === 'function' && wallet.isAvailable();
    } catch (e) {
      console.warn(`Error checking wallet ${wallet.id} availability:`, e);
      return false;
    }
  });
  
  // Always show MetaMask as an option
  if (!availableWallets.some(w => w.id === 'metamask')) {
    availableWallets.unshift({
      ...wallets[0],
      description: window.ethereum ? 'Connect using browser wallet' : 'Install MetaMask browser extension'
    });
  }
  
  // Check if user is already connected, and show a reconnection message
  useEffect(() => {
    if (isConnected && currentWalletType && isMounted.current) {
      setIsReconnecting(true);
      setLocalError(null);
      
      // Option to pre-select the current wallet type
      if (currentWalletType) {
        setActiveWallet(currentWalletType);
      }
    } else {
      setIsReconnecting(false);
    }
  }, [isConnected, currentWalletType]);
  
  useEffect(() => {
    isMounted.current = true;
    
    // Debug available wallets
    console.log("Available wallets:", availableWallets.map(w => w.id));
    
    // Handle escape key for modal close
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && onClose && !connecting) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      isMounted.current = false;
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose, connecting, availableWallets]);
  
  // Use the error from the context if available
  useEffect(() => {
    if (connectionError && isMounted.current) {
      setLocalError(connectionError);
    }
  }, [connectionError]);

  // Connect handler with proper error handling
  const handleConnect = async (walletType) => {
    // Don't proceed if already connecting
    if (connecting) return false;
    
    console.log(`🚀 ATTEMPTING to connect with ${walletType}...`);
    
    // Reset error state
    setLocalError(null);
    
    // Update state
    setConnecting(true);
    setActiveWallet(walletType);
    
    try {
      console.log(`Connecting to ${walletType}...`);
      
      // For WalletConnect, use the new approach
      if (walletType === 'walletconnect') {
        const result = await effectiveConnectWallet('walletconnect', {
          projectId: WALLET_CONNECT_PROJECT_ID
        });
        
        if (result && isMounted.current) {
          console.log(`Successfully connected to WalletConnect`);
          
          // Dispatch a global event for wallet connection
          window.dispatchEvent(new CustomEvent('wallet:connected', { 
            detail: { walletType, timestamp: Date.now() } 
          }));
          
          setTimeout(() => {
            if (isMounted.current && onClose) {
              onClose();
            }
          }, 300);
        } else if (isMounted.current) {
          setLocalError(`WalletConnect connection failed. Please try again.`);
          setConnecting(false);
          setActiveWallet(null);
        }
        
        return result;
     
    }
      // Attempt connection with timeout protection
      const connectionOptions = {};
      const result = await Promise.race([
        effectiveConnectWallet(walletType, connectionOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timed out')), 60000)
        )
    
      ]);
    
      
      console.log(`Connection result for ${walletType}:`, result);
      
      // Success - close the modal if component is still mounted
      if (result && isMounted.current) {
        console.log(`Successfully connected to ${walletType}`);
        
        // Dispatch a global event for wallet connection
        window.dispatchEvent(new CustomEvent('wallet:connected', { 
          detail: { walletType, timestamp: Date.now() } 
        }));
        
        // Close modal with slight delay to ensure state updates
        setTimeout(() => {
          if (isMounted.current && onClose) {
            onClose();
          }
        }, 300);
      } else if (isMounted.current) {
        // Connection returned false but no error
        setLocalError(`Failed to connect with ${walletType}. Please try again.`);
        setConnecting(false);
        setActiveWallet(null);
      }
      
      return result;
    } catch (error) {
      console.error(`Error connecting to ${walletType}:`, error);
      
      // Update error state if component is still mounted
      if (isMounted.current) {
        let errorMessage = error.message || `Failed to connect with ${walletType}`;
        
        // Special handling for common errors
        if (walletType === 'metamask' && !isMetaMaskAvailable()) {
          errorMessage = "MetaMask not detected. Please install the extension first.";
        } else if (error.message.includes('timed out')) {
          errorMessage = "Connection timed out. Please try again.";
        }
        
        setLocalError(errorMessage);
        setConnecting(false);
        setActiveWallet(null);
      }
      
      return false;
    }
  };

  // Handle backdrop click for modal close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose && !connecting) {
      onClose();
    }
  };
  

  
  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-indigo-950/80 dark:via-gray-900 dark:to-purple-950/80 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200/70 dark:border-gray-700/50 transform transition-all duration-300 ease-out scale-100 hover:scale-[1.02]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            {isReconnecting ? 'Reconnect Wallet' : 'Connect Wallet'}
          </h2>
          {onClose && !connecting && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
        
        {/* Status message for reconnection */}
        {isReconnecting && currentWalletType && (
          <div className="mb-4 p-4 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-xl text-sm">
            <p className="font-medium">You've disconnected your {currentWalletType} wallet</p>
            <p className="mt-1">Choose the same wallet or connect a different one.</p>
          </div>
        )}
        
        {/* Error message display */}
        {(localError || connectionError) && (
          <div className="mb-4 p-4 bg-red-50/80 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-800/50 flex items-center space-x-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="flex-1">{localError || connectionError}</span>
          </div>
        )}
        
        {/* Wallet options */}
        <div className="space-y-3 mb-4">
          {availableWallets.map(wallet => (
            <button
              key={wallet.id}
              onClick={() => !connecting && handleConnect(wallet.id)}
              disabled={connecting}
              className={`
                w-full flex items-center px-4 py-3.5 
                border border-gray-200/70 dark:border-gray-700/50 
                rounded-xl 
                transition-all duration-300 relative
                ${activeWallet === wallet.id 
                  ? 'bg-indigo-50/70 border-indigo-200/80 dark:bg-indigo-900/30 dark:border-indigo-800/50 shadow-md' 
                  : 'hover:bg-gray-50/70 hover:border-gray-300/80 dark:hover:bg-gray-700/30 dark:hover:border-gray-600/50'}
                ${connecting ? 'cursor-not-allowed ' + (activeWallet !== wallet.id ? 'opacity-50' : '') : ''}
                ${currentWalletType === wallet.id ? 'ring-2 ring-indigo-300 dark:ring-indigo-700' : ''}
                group
              `}
            >
              {/* Left accent */}
              <div className={`
                absolute left-0 top-[15%] bottom-[15%] w-1 rounded-full
                transition-all duration-300
                ${activeWallet === wallet.id || currentWalletType === wallet.id
                  ? 'bg-gradient-to-b from-indigo-300 via-indigo-500 to-purple-400 opacity-80' 
                  : 'bg-gray-300 dark:bg-gray-600 opacity-0 group-hover:opacity-30'}
              `}></div>
              
              {/* Wallet icon */}
              <div className="w-12 h-12 mr-4 flex-shrink-0 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200/50 dark:border-gray-600/30">
                <img 
                  src={wallet.icon} 
                  alt={wallet.name} 
                  className="w-7 h-7 object-contain" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = './images/default-wallet.svg';
                  }} 
                  loading="eager"
                />
              </div>
              
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800 dark:text-white">
                  {wallet.name}
                  {currentWalletType === wallet.id && (
                    <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">(previous)</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {wallet.description}
                </div>
              </div>
              
              {/* Loading spinner or arrow */}
              <div className="ml-2">
                {connecting && activeWallet === wallet.id ? (
                  <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
        
        {/* Help text */}
        <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          {connecting ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">
              {activeWallet === 'walletconnect' 
                ? "Scan QR code with your mobile wallet..." 
                : "Please approve the connection request in your wallet..."}
            </p>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
              
              <p>New to Ethereum?</p>
              <a 
                href="https://ethereum.org/en/wallets" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="
                  inline-flex items-center 
                  text-indigo-600 dark:text-indigo-400 
                  hover:text-indigo-800 dark:hover:text-indigo-300 
                  transition-colors duration-300 
                  group
                "
              >
                Learn more about wallets
                <svg 
                  className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7"></path>
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

  const resolveImagePath = (relativePath) => {
  return `${process.env.PUBLIC_URL || ''}/images/${relativePath}`;
};

export default WalletSelector;