// src/utils/walletConnectConfig.js

/**
 * WalletConnect Project ID
 * If you're using WalletConnect, you need to register at https://cloud.walletconnect.com/
 * and obtain a project ID. It can also be set through environment variables.
 */
export const WALLET_CONNECT_PROJECT_ID = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || 
                                        process.env.WALLET_CONNECT_PROJECT_ID || 
                                        'f11adfc48c8acb17d113a5897f96b179'; // Replace with your default project ID
                                        
export const handleWalletConnectSession = (session) => {
  if (!session) return null;
  
  try {
    // Extract account info from the session
    const namespaces = session.namespaces;
    const eip155 = namespaces.eip155;
    
    if (!eip155) return null;
    
    // Get first account from accounts array
    const accounts = eip155.accounts || [];
    
    if (accounts.length === 0) return null;
    
    // Format: "eip155:1:0x123..." -> split and take the address part
    const firstAccount = accounts[0].split(':').pop();
    
    // Get chain ID
    const chainId = parseInt(accounts[0].split(':')[1], 10);
    
    return {
      address: firstAccount,
      chainId
    };
  } catch (error) {
    console.error("Error parsing WalletConnect session:", error);
    return null;
  }
};

/**
 * Detects available wallet providers in the browser environment
 * @returns {Object} An object containing detection functions for different wallet providers
 */
export const detectWallets = () => {
  // Log browser environment for debugging
  console.log("Detecting wallet providers in browser environment");
  
  /**
   * Check if MetaMask is available
   * @returns {boolean} True if MetaMask is available
   */
  const isMetaMaskAvailable = () => {
    if (!window.ethereum) return false;
    
    // If we have providers array, we need to check individually
    if (window.ethereum.providers) {
      return window.ethereum.providers.some(provider => provider.isMetaMask);
    }
    
    // Otherwise check if the main window.ethereum is MetaMask
    return !!window.ethereum.isMetaMask;
  };
  
  /**
   * Check if Coinbase Wallet is available
   * @returns {boolean} True if Coinbase Wallet is available
   */
  const isCoinbaseWalletAvailable = () => {
    if (!window.ethereum) return false;
    
    // If we have providers array, we need to check individually
    if (window.ethereum.providers) {
      return window.ethereum.providers.some(provider => provider.isCoinbaseWallet);
    }
    
    // Otherwise check if the main window.ethereum is Coinbase Wallet
    return !!window.ethereum.isCoinbaseWallet;
  };
  
  /**
   * Check if Trust Wallet is available
   * @returns {boolean} True if Trust Wallet is available
   */
  const isTrustWalletAvailable = () => {
    if (!window.ethereum) return false;
    
    // If we have providers array, we need to check individually
    if (window.ethereum.providers) {
      return window.ethereum.providers.some(
        provider => provider.isTrust || provider.isTrustWallet
      );
    }
    
    // Otherwise check if the main window.ethereum is Trust Wallet
    return !!window.ethereum.isTrust || !!window.ethereum.isTrustWallet;
  };
  
  /**
   * Get provider by type
   * @param {string} type - 'metamask', 'coinbase', 'trust', etc.
   * @returns {Object|null} The provider object or null if not found
   */
  const getProviderByType = (type) => {
    if (!window.ethereum) return null;
    
    // If we have multiple providers, find the one matching the type
    if (window.ethereum.providers) {
      switch (type) {
        case 'metamask':
          return window.ethereum.providers.find(p => p.isMetaMask);
        case 'coinbase':
          return window.ethereum.providers.find(p => p.isCoinbaseWallet);
        case 'trustwallet':
          return window.ethereum.providers.find(p => p.isTrust || p.isTrustWallet);
        default:
          return null;
      }
    }
    
    // Otherwise, check if the main provider matches
    if (type === 'metamask' && window.ethereum.isMetaMask) {
      return window.ethereum;
    } else if (type === 'coinbase' && window.ethereum.isCoinbaseWallet) {
      return window.ethereum;
    } else if (type === 'trustwallet' && (window.ethereum.isTrust || window.ethereum.isTrustWallet)) {
      return window.ethereum;
    }
    
    // Fall back to the main provider
    return window.ethereum;
  };
  
  /**
   * Check if any wallet is available
   * @returns {boolean} True if any wallet is available
   */
  const isAnyWalletAvailable = () => {
    return isMetaMaskAvailable() || isCoinbaseWalletAvailable() || isTrustWalletAvailable();
  };
  
  /**
   * Get all available wallet types
   * @returns {Array<string>} Array of available wallet types
   */
  const getAvailableWalletTypes = () => {
    const wallets = [];
    
    if (isMetaMaskAvailable()) wallets.push('metamask');
    if (isCoinbaseWalletAvailable()) wallets.push('coinbase');
    if (isTrustWalletAvailable()) wallets.push('trustwallet');
    
    // WalletConnect is always available as it doesn't require installation
    wallets.push('walletconnect');
    
    return wallets;
  };
  
  /**
   * Debug info for all available providers
   * @returns {Object} Debug information about detected providers
   */
  const getProviderDebugInfo = () => {
    if (!window.ethereum) {
      return { available: false, message: 'No Ethereum provider detected' };
    }
    
    const info = {
      available: true,
      hasMultipleProviders: !!window.ethereum.providers,
      providers: []
    };
    
    if (window.ethereum.providers) {
      // Multiple providers
      window.ethereum.providers.forEach((provider, index) => {
        info.providers.push({
          index,
          isMetaMask: !!provider.isMetaMask,
          isCoinbaseWallet: !!provider.isCoinbaseWallet,
          isTrustWallet: !!(provider.isTrust || provider.isTrustWallet)
        });
      });
    } else {
      // Single provider
      info.providers.push({
        index: 0,
        isMetaMask: !!window.ethereum.isMetaMask,
        isCoinbaseWallet: !!window.ethereum.isCoinbaseWallet,
        isTrustWallet: !!(window.ethereum.isTrust || window.ethereum.isTrustWallet)
      });
    }
    
    return info;
  };
  
  // Run basic detection on initialization
  const debugInfo = getProviderDebugInfo();
  console.log("Wallet detection results:", debugInfo);
  
  return {
    isMetaMaskAvailable,
    isCoinbaseWalletAvailable,
    isTrustWalletAvailable,
    isAnyWalletAvailable,
    getProviderByType,
    getAvailableWalletTypes,
    getProviderDebugInfo
  };
};

/**
 * Get WalletConnect configuration
 * @param {Object} options - Additional configuration options
 * @returns {Object} WalletConnect configuration object
 */
export const getWalletConnectConfig = (options = {}) => {
  return {
    projectId: options.projectId || WALLET_CONNECT_PROJECT_ID,
    showQrModal: options.showQrModal !== false, // Default to true
    chains: options.chains || [1], // Default to Ethereum mainnet
    metadata: {
      name: 'JustDAO',
      description: 'Decentralized Governance Platform',
      url: window.location.origin,
      icons: [`${window.location.origin}/logo.png`],
      ...options.metadata
    },
    rpcMap: {
      1: 'https://mainnet.infura.io/v3/your-infura-id',
      // Add other networks as needed
      ...options.rpcMap
    },
    enableExplorer: options.enableExplorer !== false, // Default to true
    explorerRecommendedWalletIds: options.explorerRecommendedWalletIds,
    optionalChains: options.optionalChains || [],
    qrModalOptions: options.qrModalOptions || {},
    // Add any other WalletConnect initialization options
    ...options
  };
};

/**
 * Handle wallet connection errors
 * @param {Error} error - The error object
 * @param {string} walletType - The type of wallet that encountered the error
 * @returns {Object} Standardized error object with message and code
 */
export const handleWalletError = (error, walletType) => {
  console.error(`Error connecting to ${walletType}:`, error);
  
  // Default error object
  const standardError = {
    message: error.message || `Failed to connect with ${walletType}`,
    code: error.code || 'UNKNOWN_ERROR',
    originalError: error,
    walletType
  };
  
  // Process specific error types
  if (error.code === 4001) {
    standardError.message = 'Connection rejected by user';
    standardError.code = 'USER_REJECTED';
  } else if (error.code === -32002) {
    standardError.message = 'Connection request already pending';
    standardError.code = 'REQUEST_PENDING';
  } else if (walletType === 'metamask' && !detectWallets().isMetaMaskAvailable()) {
    standardError.message = 'MetaMask not installed';
    standardError.code = 'WALLET_NOT_INSTALLED';
  } else if (walletType === 'coinbase' && !detectWallets().isCoinbaseWalletAvailable()) {
    standardError.message = 'Coinbase Wallet not installed';
    standardError.code = 'WALLET_NOT_INSTALLED';
  } else if (walletType === 'trustwallet' && !detectWallets().isTrustWalletAvailable()) {
    standardError.message = 'Trust Wallet not installed';
    standardError.code = 'WALLET_NOT_INSTALLED';
  } else if (error.message?.includes('wallet_addEthereumChain')) {
    standardError.message = 'Failed to add network to wallet';
    standardError.code = 'ADD_CHAIN_ERROR';
  }
  
  return standardError;
};

/**
 * Utility to check if the browser is mobile
 * @returns {boolean} True if the browser is on a mobile device
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default {
  detectWallets,
  WALLET_CONNECT_PROJECT_ID,
  getWalletConnectConfig,
  handleWalletError,
  isMobileDevice
};