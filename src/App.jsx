// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './contexts/Web3Context';
import { useAuth } from './contexts/AuthContext';
import { BlockchainDataProvider } from './contexts/BlockchainDataContext';
import JustDAODashboard from './components/JustDAO.jsx';
import Loader from './components/Loader';
import WalletSelector from './components/WalletSelector';

function App() {
  const { 
    isConnected, 
    connectWallet, 
    contractsReady, 
    contracts,
    isConnecting,
    isDisconnecting, // New state from context
    account // We need to track the account to detect real disconnects
  } = useWeb3();
  
  const { loading: authLoading } = useAuth();
  const [blockchainProviderReady, setBlockchainProviderReady] = useState(false);
  
  // State for showing wallet selector in the welcome screen
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  
  // Track the previous connection state to detect changes
  const [wasConnected, setWasConnected] = useState(false);
  
  // Ensure we have actual contract objects before proceeding
  useEffect(() => {
    if (contractsReady && contracts) {
      console.log("Contracts status:", {
        contractsReady,
        contractKeys: Object.keys(contracts || {})
      });
      
      // Consider it ready even if contracts aren't fully available
      // Our BlockchainDataService will provide mock data in that case
      setBlockchainProviderReady(true);
    } else {
      setBlockchainProviderReady(false);
    }
  }, [contracts, contractsReady]);
  
  // Track connection state changes
  useEffect(() => {
    // If we were connected before but not anymore, show wallet selector
    if (wasConnected && !isConnected && !isDisconnecting) {
      console.log("Connection state changed: disconnected -> showing wallet selector");
      setShowWalletSelector(true);
    }
    
    // Update tracking state
    setWasConnected(isConnected);
  }, [isConnected, wasConnected, isDisconnecting]);

  // Show loading state while connecting or waiting for contracts
  if (isConnecting || isDisconnecting || (isConnected && (!blockchainProviderReady || authLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader 
          size="large" 
          text={
            isConnecting 
              ? "Connecting to wallet..." 
              : isDisconnecting 
                ? "Disconnecting wallet..." 
                : "Loading DAO data..."
          } 
        />
      </div>
    );
  }

  // Handle wallet connection
  const handleConnectClick = () => {
    setShowWalletSelector(true);
  };
  
  const closeWalletSelector = () => {
    setShowWalletSelector(false);
  };
  
  const handleWalletConnect = async (walletType) => {
    try {
      const success = await connectWallet(walletType);
      if (success) {
        setShowWalletSelector(false);
      }
      return success;
    } catch (error) {
      console.error(`Error in App connecting with ${walletType}:`, error);
      return false;
    }
  };

  return (
    <div className="App">
      {!isConnected ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                JustDAO
              </h1>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Connect your wallet to access the DAO dashboard
              </p>
            </div>
            
            <button
              onClick={handleConnectClick}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-medium"
            >
              Connect Wallet
            </button>
            
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              New to JustDAO? <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">Learn more</a> about our governance platform.
            </p>
          </div>
          
          {/* Wallet Selector Modal */}
          {showWalletSelector && (
            <WalletSelector 
              onClose={closeWalletSelector} 
              connectWallet={handleWalletConnect}
            />
          )}
        </div>
      ) : (
        <BlockchainDataProvider>
          <JustDAODashboard key={`dashboard-${blockchainProviderReady}-${account}`} />
        </BlockchainDataProvider>
      )}
    </div>
  );
}

export default App;