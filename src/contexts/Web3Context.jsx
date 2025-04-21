// src/contexts/Web3Context.jsx
// Enhanced error handling and contract initialization with blockchain data support

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import JustTokenABI from '../config/abis/JustTokenUpgradeable.json';
import JustGovernanceABI from '../config/abis/JustGovernanceUpgradeable.json';
import JustTimelockABI from '../config/abis/JustTimelockUpgradeable.json';
import JustDAOHelperABI from '../config/abis/JustDAOHelperUpgradeable.json';
import { CONTRACT_ADDRESSES } from '../utils/constants.js';
import { detectWallets, WALLET_CONNECT_PROJECT_ID, handleWalletError } from '../utils/walletConnectConfig.js';
import { 
  useConnect, 
  useDisconnect as useWalletConnectDisconnect
} from '@walletconnect/modal-sign-react';

const Web3Context = createContext();

// Make sure this is exported as a named export
export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [networkId, setNetworkId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [contracts, setContracts] = useState({
    justToken: null,  // Changed naming to match BlockchainDataService expectations
    governance: null,
    timelock: null,
    analyticsHelper: null,
    daoHelper: null,
    securityManager: null // Additional reference for security settings
  });
  const [contractsReady, setContractsReady] = useState(false);
  const [contractErrors, setContractErrors] = useState({});
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [connectionError, setConnectionError] = useState(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [currentWalletType, setCurrentWalletType] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWalletConnectActive, setIsWalletConnectActive] = useState(false);
  
  // Expected network is Sepolia (chainId 11155111)
  const EXPECTED_NETWORK_ID = 11155111;
  const NETWORK_NAME = "Sepolia";
  
  // Use refs to store functions that need to access other functions
  // This prevents dependency cycles without hooks
  const functionsRef = useRef({});

  // WalletConnect v2 hooks
  const walletConnectConnect = useConnect({
    requiredNamespaces: {
      eip155: {
        methods: [
          'eth_sendTransaction',
          'eth_signTransaction', 
          'eth_sign',
          'personal_sign', 
          'eth_signTypedData'
        ],
        chains: [`eip155:${EXPECTED_NETWORK_ID}`], // Target Sepolia by default
        events: ['chainChanged', 'accountsChanged']
      }
    }
  });
  
  const walletConnectDisconnect = useWalletConnectDisconnect();
  
  // Function to debug contract addresses and ABIs
  function debugContractsInfo() {
    console.log("CONTRACT_ADDRESSES from constants:", CONTRACT_ADDRESSES);
    
    // Log ABI signatures for governance contract
    console.log("Governance ABI Methods:", 
      JustGovernanceABI.abi
        .filter(item => item.type === "function")
        .map(fn => `${fn.name}(${fn.inputs.map(i => i.type).join(',')}): ${fn.stateMutability}`)
    );
    
    // Log ABI signatures for DAOHelper contract
    console.log("DAOHelper ABI Methods:", 
      JustDAOHelperABI.abi
        .filter(item => item.type === "function")
        .map(fn => `${fn.name}(${fn.inputs.map(i => i.type).join(',')}): ${fn.stateMutability}`)
    );
    
    // Log current contract instances
    console.log("Current contract instances:", {
      governance: contracts.governance ? {
        address: contracts.governance.address,
        hasGetProposalState: typeof contracts.governance.getProposalState === 'function',
        hasGovParams: typeof contracts.governance.govParams === 'function'
      } : 'Not initialized',
      
      daoHelper: contracts.daoHelper ? {
        address: contracts.daoHelper.address,
        hasJustToken: typeof contracts.daoHelper.justToken === 'function',
        hasAdminRole: typeof contracts.daoHelper.ADMIN_ROLE === 'function'
      } : 'Not initialized',
      
      token: contracts.justToken ? {
        address: contracts.justToken.address,
        hasName: typeof contracts.justToken.name === 'function',
        hasBalance: typeof contracts.justToken.balanceOf === 'function'
      } : 'Not initialized',
      
      timelock: contracts.timelock ? {
        address: contracts.timelock.address,
        hasMinDelay: typeof contracts.timelock.minDelay === 'function'
      } : 'Not initialized'
    });
    
    // Check network information
    if (provider) {
      provider.getNetwork().then(network => {
        console.log("Connected to network:", {
          name: network.name,
          chainId: network.chainId
        });
      }).catch(error => {
        console.error("Error getting network:", error);
      });
    }
  }

  // Initialize contracts function
  functionsRef.current.initializeContracts = async (provider, signer) => {
    try {
      setContractsReady(false);
      const newContractErrors = {};
      const newContracts = {};
      
      console.log("Initializing contracts with addresses:", CONTRACT_ADDRESSES);
      
      // Initialize token contract
      try {
        const tokenContract = new ethers.Contract(
          CONTRACT_ADDRESSES.token,
          JustTokenABI.abi,
          signer
        );
        // Verify contract is accessible by calling a view function
        await tokenContract.name();
        newContracts.justToken = tokenContract; // Changed to justToken to match BlockchainDataService
        console.log("Token contract initialized successfully");
      } catch (error) {
        console.error("Error initializing token contract:", error);
        newContractErrors.token = error.message;
      }
      
      // Initialize governance contract
      try {
        const governanceContract = new ethers.Contract(
          CONTRACT_ADDRESSES.governance,
          JustGovernanceABI.abi,
          signer
        );
        // Verify contract works
        try {
          // Try to call a view function to verify
          await governanceContract.govParams();
        } catch (verifyError) {
          console.error("Error verifying governance contract:", verifyError);
          throw verifyError;
        }
        newContracts.governance = governanceContract;
        console.log("Governance contract initialized successfully");
      } catch (error) {
        console.error("Error initializing governance contract:", error);
        newContractErrors.governance = error.message;
      }
      
      // Initialize timelock contract
      try {
        const timelockContract = new ethers.Contract(
          CONTRACT_ADDRESSES.timelock,
          JustTimelockABI.abi,
          signer
        );
        // Verify contract works
        try {
          await timelockContract.minDelay();
        } catch (verifyError) {
          console.error("Error verifying timelock contract:", verifyError);
          throw verifyError;
        }
        newContracts.timelock = timelockContract;
        console.log("Timelock contract initialized successfully");
      } catch (error) {
        console.error("Error initializing timelock contract:", error);
        newContractErrors.timelock = error.message;
      }
      
      // Initialize DAO helper contract
      try {
        const daoHelperContract = new ethers.Contract(
          CONTRACT_ADDRESSES.daoHelper,
          JustDAOHelperABI.abi,
          signer
        );
        
        // Verify contract works by calling a view function
        try {
          // Call justToken() which is a public variable in the contract
          await daoHelperContract.justToken();
          // Alternative check if justToken fails
          if (!await daoHelperContract.justToken()) {
            // Try another view function as backup verification
            await daoHelperContract.ADMIN_ROLE();
          }
        } catch (verifyError) {
          console.error("Error verifying DAO helper contract:", verifyError);
          // Try a different function to verify if the first one failed
          try {
            await daoHelperContract.ADMIN_ROLE();
          } catch (secondVerifyError) {
            console.error("Failed secondary verification of DAO helper contract:", secondVerifyError);
            throw verifyError;
          }
        }
        
        newContracts.daoHelper = daoHelperContract;
        console.log("DAO helper contract initialized successfully");
      } catch (error) {
        console.error("Error initializing DAO helper contract:", error);
        newContractErrors.daoHelper = error.message;
      }
      
      // For security settings - governance contract also handles this
      newContracts.securityManager = newContracts.governance;
      
      // Set contracts object
      setContracts(newContracts);
      setContractErrors(newContractErrors);
      
      // Mark as ready if key contracts are available
      const isReady = newContracts.justToken && newContracts.governance && 
                      (newContracts.daoHelper || newContracts.timelock);
      setContractsReady(isReady);
      
      console.log("Contracts ready status:", isReady);
      if (!isReady) {
        console.warn("Some contracts failed to initialize:", newContractErrors);
      } else {
        // Call debug function
        debugContractsInfo();
      }
      
      // Set a refresh flag to trigger data reloads
      setRefreshCounter(prev => prev + 1);
      
      return isReady;
    } catch (error) {
      console.error("Error in contract initialization:", error);
      setContractErrors({global: error.message});
      setConnectionError("Failed to initialize contracts. Please check your connection.");
      setContractsReady(false);
      return false;
    }
  };
// Initialize with WalletConnect session
const initializeWithWalletConnect = async (accountAddress, chainId) => {
  try {
    // Get RPC URL from environment variables with fallbacks
    const rpcUrl = process.env.REACT_APP_SEPOLIA_RPC_URL || 
                  `https://rpc.ankr.com/eth_sepolia`; // Public fallback
    
    console.log("Initializing WalletConnect with Sepolia network");
    
    // Create a JSON-RPC provider with explicit network parameters
    const provider = new ethers.providers.JsonRpcProvider(
      rpcUrl,
      {
        name: 'sepolia',
        chainId: EXPECTED_NETWORK_ID
      }
    );
    
    // Verify the network connection
    const network = await provider.getNetwork();
    console.log("Connected to network:", network);
    
    // Store provider
    setProvider(provider);
    setNetworkId(network.chainId);
    setIsCorrectNetwork(network.chainId === EXPECTED_NETWORK_ID);
    
    // Create contracts with the provider (using provider as signer for read-only)
    console.log("Initializing contracts with WalletConnect provider");
    const success = await functionsRef.current.initializeContracts(provider, provider);
    
    return success;
  } catch (error) {
    console.error("Error initializing with WalletConnect:", error);
    setConnectionError(`Failed to initialize with WalletConnect: ${error.message}`);
    return false;
  }
};

  // Define handler functions and store in functionsRef
  functionsRef.current.handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User has disconnected all accounts
      setIsConnected(false);
      setAccount('');
      setContractsReady(false);
    } else {
      setAccount(accounts[0]);
      // Refresh contract data with new account
      if (provider) {
        const signer = provider.getSigner();
        setSigner(signer);
        functionsRef.current.initializeContracts(provider, signer);
      }
    }
  };

  functionsRef.current.handleChainChanged = (chainIdHex) => {
    const chainId = parseInt(chainIdHex, 16);
    // Reload the page when the chain changes
    setNetworkId(chainId);
    setIsCorrectNetwork(chainId === EXPECTED_NETWORK_ID);
    
    // If network changed, reinitialize contracts
    if (provider && isConnected) {
      const signer = provider.getSigner();
      setSigner(signer);
      functionsRef.current.initializeContracts(provider, signer);
    }
    
    console.log("Network changed to:", chainId);
  };

  // Check if wallet is already connected on page load
  useEffect(() => {
    const CheckConnection = async () => {
      if (window.ethereum) {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            // Get network info
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await web3Provider.getNetwork();
            const chainId = network.chainId;
            
            setAccount(accounts[0]);
            setProvider(web3Provider);
            setSigner(web3Provider.getSigner());
            setIsConnected(true);
            setNetworkId(chainId);
            setIsCorrectNetwork(chainId === EXPECTED_NETWORK_ID);
            
            // Initialize contracts
            if (chainId === EXPECTED_NETWORK_ID) {
              await functionsRef.current.initializeContracts(web3Provider, web3Provider.getSigner());
            }
            
            // Set up listeners
            window.ethereum.on('accountsChanged', functionsRef.current.handleAccountsChanged);
            window.ethereum.on('chainChanged', functionsRef.current.handleChainChanged);
            
            console.log("Connected to wallet:", accounts[0]);
            console.log("Network:", network.name, "ChainId:", chainId);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
          setConnectionError("Error connecting to wallet. Please try again.");
        }
      }
    };
    
    CheckConnection();
    
    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', functionsRef.current.handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', functionsRef.current.handleChainChanged);
      }
    };
  }, []); // No dependencies - this runs once on mount

  // Event listener for WalletConnect events
  useEffect(() => {
    const handleWalletConnectEvent = (event) => {
      if (event && event.detail) {
        const { type, data } = event.detail;
        
        if (type === 'session_update') {
          console.log('WalletConnect session updated:', data);
          
          // Handle session update
          if (data && data.accounts && data.accounts.length > 0) {
            // Extract account from session
            let address = data.accounts[0];
            // If account format is eip155:chainId:address, extract the address part
            if (address.includes(':')) {
              address = address.split(':').pop();
            }
            
            setAccount(address);
            setIsConnected(true);
            setCurrentWalletType('walletconnect');
            setIsWalletConnectActive(true);
            
            // Get chainId
            let chainId = 1; // Default to Ethereum Mainnet
            if (data.chainId) {
              chainId = parseInt(data.chainId.toString().split(':').pop(), 10);
            }
            
            setNetworkId(chainId);
            setIsCorrectNetwork(chainId === EXPECTED_NETWORK_ID);
          }
        }
        
        if (type === 'session_delete') {
          console.log('WalletConnect session deleted');
          if (currentWalletType === 'walletconnect') {
            setIsConnected(false);
            setAccount('');
            setCurrentWalletType(null);
            setIsWalletConnectActive(false);
          }
        }
      }
    };
    
    // Add event listener for custom WalletConnect events
    window.addEventListener('walletconnect:event', handleWalletConnectEvent);
    
    return () => {
      window.removeEventListener('walletconnect:event', handleWalletConnectEvent);
    };
  }, [currentWalletType]);

  async function switchToCorrectNetwork(provider = window.ethereum) {
    if (!provider) return false;
    
    try {
      // Try to switch to the Sepolia network
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + EXPECTED_NETWORK_ID.toString(16) }],
      });
      return true;
    } catch (error) {
      if (error.code === 4902) {
        // Network not added, let's add it
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x' + EXPECTED_NETWORK_ID.toString(16),
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/']
              }
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding Sepolia network:", addError);
          setConnectionError("Failed to add Sepolia network to your wallet.");
          return false;
        }
      }
      console.error("Error switching network:", error);
      setConnectionError("Failed to switch to Sepolia network.");
      return false;
    }
  }

  async function connectWallet(walletType = 'metamask', options = {}) {
    setConnectionError(null);
    setIsConnecting(true);
    
    try {
      console.log(`Connecting to wallet type: ${walletType}`);
      
      // Special case for WalletConnect v2
      if (walletType === 'walletconnect') {
        console.log("Connecting with WalletConnect v2...");
        try {
          // Connect using WalletConnect modal
          const session = await walletConnectConnect.connect();
          console.log("WalletConnect connection result:", session);
          
          if (session) {
            // Extract account and chainId from session
            let accounts = [];
            let chainId = 1;
            
            // Check the session structure
            if (session.namespaces && session.namespaces.eip155) {
              accounts = session.namespaces.eip155.accounts || [];
              chainId = parseInt(session.namespaces.eip155.chains?.[0]?.split(':')?.[1] || '1', 10);
            }
            
            if (accounts.length > 0) {
              // Extract account address (format: eip155:chainId:address)
              let address = accounts[0];
              if (address.includes(':')) {
                address = address.split(':').pop();
              }
              
              console.log(`WalletConnect connected to account: ${address} on chain ID: ${chainId}`);
              
              setAccount(address);
              setCurrentWalletType('walletconnect');
              setIsConnected(true);
              setIsWalletConnectActive(true);
              setNetworkId(chainId);
              setIsCorrectNetwork(chainId === EXPECTED_NETWORK_ID);
              
              // Initialize contract connections
              await initializeWithWalletConnect(address, chainId);
              
              // Dispatch a custom event for other components to react to
              window.dispatchEvent(new CustomEvent('walletconnect:connected', {
                detail: { address, chainId }
              }));
              
              setIsConnecting(false);
              return true;
            } else {
              throw new Error("No accounts received from WalletConnect");
            }
          } else {
            throw new Error("No valid session established with WalletConnect");
          }
        } catch (wcError) {
          console.error("WalletConnect error:", wcError);
          setConnectionError(`WalletConnect error: ${wcError.message || 'Connection failed'}`);
          setIsConnecting(false);
          return false;
        }
      }
      
      // Check for window.ethereum for non-WalletConnect wallets
      if (!window.ethereum) {
        throw new Error("No Ethereum provider detected. Please install a wallet extension.");
      }
      
      // Reset any previous errors
      setContractErrors({});
      
      // Get the appropriate provider based on wallet type
      let selectedProvider;
      if (window.ethereum.providers) {
        // Multiple providers available, find the requested one
        const walletsHelpers = detectWallets();
        selectedProvider = walletsHelpers.getProviderByType(walletType);
        
        if (!selectedProvider) {
          throw new Error(`${walletType} wallet not detected`);
        }
      } else {
        // Single provider
        selectedProvider = window.ethereum;
      }
      
      // Coinbase wallet specific handling
      if (walletType === 'coinbase') {
        // Try to explicitly connect to Coinbase if available
        if (!selectedProvider || !selectedProvider.isCoinbaseWallet) {
          console.log("Coinbase wallet not directly available, checking for separate providers");
          
          // Some environments have Coinbase Wallet as window.coinbaseWalletExtension
          if (window.coinbaseWalletExtension) {
            selectedProvider = window.coinbaseWalletExtension;
          }
          
          // If still not found, try loading CoinbaseWalletSDK if available
          if (!selectedProvider && window.CoinbaseWalletSDK) {
            try {
              const CoinbaseWalletSDK = window.CoinbaseWalletSDK;
              const coinbaseWallet = new CoinbaseWalletSDK({
                appName: 'JustDAO',
                appLogoUrl: `${window.location.origin}/logo.png`,
                darkMode: false
              });
              
              selectedProvider = coinbaseWallet.makeWeb3Provider(
                'https://mainnet.infura.io/v3/your-infura-id', 
                1 // Ethereum mainnet
              );
            } catch (sdkError) {
              console.error("Error initializing Coinbase SDK:", sdkError);
            }
          }
          
          if (!selectedProvider) {
            throw new Error("Coinbase Wallet not detected. Please install the extension.");
          }
        }
        
        // Set current wallet type for tracking
        setCurrentWalletType('coinbase');
      } else {
        // Set wallet type for other wallets
        setCurrentWalletType(walletType);
      }
      
      // Request account access
      const accounts = await selectedProvider.request({ method: 'eth_requestAccounts' });
      
      // Get network info
      const web3Provider = new ethers.providers.Web3Provider(selectedProvider);
      const network = await web3Provider.getNetwork();
      const chainId = network.chainId;
      
      // Check if we're on the correct network
      const correctNetwork = chainId === EXPECTED_NETWORK_ID;
      setIsCorrectNetwork(correctNetwork);
      
      // If not on correct network, prompt to switch
      if (!correctNetwork) {
        const networkSwitched = await switchToCorrectNetwork(selectedProvider);
        if (!networkSwitched) {
          setConnectionError(`Please switch to ${NETWORK_NAME} network to use this application.`);
          setIsConnecting(false);
          return false;
        }
      }
      
      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Provider.getSigner());
      setIsConnected(true);
      setNetworkId(chainId);
      
      // Initialize contracts
      const success = await functionsRef.current.initializeContracts(web3Provider, web3Provider.getSigner());
      
      // Set up listeners
      selectedProvider.on('accountsChanged', functionsRef.current.handleAccountsChanged);
      selectedProvider.on('chainChanged', functionsRef.current.handleChainChanged);
      
      console.log("Connected to:", accounts[0]);
      console.log("Network:", network.name, "ChainId:", chainId);
      
      setIsConnecting(false);
      return success;
    } catch (error) {
      console.error(`Error connecting to ${walletType} wallet:`, error);
      setConnectionError(`Failed to connect to ${walletType} wallet: ${error.message}`);
      setIsConnecting(false);
      return false;
    }
  }

  // New method for force contract refresh
  // This will trigger a refresh of the contract data
  async function refreshContractData() {
    try {
      if (!provider || !signer) {
        throw new Error("Provider or signer not available");
      }
      
      console.log("Forcing contract refresh...");
      const success = await functionsRef.current.initializeContracts(provider, signer);
      if (success) {
        console.log("Contract refresh successful");
      } else {
        console.warn("Contract refresh completed but some contracts were not initialized");
      }
      
      return success;
    } catch (error) {
      console.error("Error refreshing contract data:", error);
      return false;
    }
  }

  // Modified to also refresh contract data
  async function refreshData() {
    // First refresh contract connections if needed
    if (isConnected && provider && signer) {
      await refreshContractData();
    }
    
    // Then trigger a refresh of all data by incrementing the counter
    setRefreshCounter(prev => prev + 1);
  }

  // Dummy clearWalletData function (replace with your actual implementation if needed)
  function clearWalletData() {
    // Implement wallet data clearing logic if needed
  }

  const disconnectWallet = React.useCallback(async () => {
    console.log("DISCONNECTING WALLET - FULL CLEANUP PROCESS STARTING");
    
    try {
      setIsDisconnecting(true);
      
      // Store current provider and account for cleanup
      const currentProvider = provider;
      const previousAccount = account;
      const previousWalletType = currentWalletType;
      
      // First, clear wallet data in storage
      clearWalletData();
      
      // Handle WalletConnect v2 specific disconnection
      if (previousWalletType === 'walletconnect' && isWalletConnectActive) {
        try {
          await walletConnectDisconnect.disconnect();
          console.log("Disconnected from WalletConnect v2");
        } catch (wcError) {
          console.warn("Error disconnecting WalletConnect:", wcError);
        }
      }
      
      // Try wallet-specific disconnection methods
      if (previousWalletType) {
        try {
          // For WalletConnect, try to call disconnect on the provider
          if (previousWalletType === 'walletconnect' && currentProvider?.disconnect) {
            await currentProvider.disconnect();
            console.log("Called disconnect on WalletConnect provider");
          }
          
          // For Coinbase Wallet, try to call close on the provider
          if (previousWalletType === 'coinbase' && currentProvider?.close) {
            await currentProvider.close();
            console.log("Called close on Coinbase provider");
          }
          
          // For MetaMask or other injected wallets, we don't have a direct disconnect method
          // But we can try to clear the connection state
          if (window.ethereum) {
            // Remove listeners first to prevent reconnection
            window.ethereum.removeListener('accountsChanged', functionsRef.current.handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', functionsRef.current.handleChainChanged);
          }
        } catch (walletError) {
          console.warn("Error during provider-specific disconnect:", walletError);
          // Continue with disconnection despite this error
        }
      }
      
      // Now update application state
      setIsConnected(false);
      setAccount('');
      setSigner(null);
      setContracts({
        justToken: null,
        governance: null,
        timelock: null,
        analyticsHelper: null,
        daoHelper: null,
        securityManager: null
      });
      setContractsReady(false);
      setContractErrors({});
      setConnectionError(null);
      setCurrentWalletType(null);
      setIsWalletConnectActive(false);
      
      // Clear cached data in localStorage if any
      try {
        // Get all localStorage keys
        const localStorageKeys = Object.keys(localStorage);
        
        // Define patterns to match for wallet and connection data
        const patterns = [
          'wallet',
          'connect',
          'account',
          'web3',
          'ethereum',
          'provider',
          'WalletConnect',
          'walletlink',
          'coinbase'
        ];
        
        // Clear matching entries
        localStorageKeys.forEach(key => {
          if (patterns.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()))) {
            console.log(`Clearing storage: ${key}`);
            localStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        console.warn("Error clearing localStorage:", storageError);
      }
      
      // Dispatch a global event for wallet disconnection
      window.dispatchEvent(new CustomEvent('wallet:disconnected', { 
        detail: { 
          timestamp: Date.now(),
          account: previousAccount
        } 
      }));
      
      console.log("DISCONNECT PROCESS COMPLETED SUCCESSFULLY");
      
      // After a short delay, reset the disconnecting flag
      setTimeout(() => {
        setIsDisconnecting(false);
      }, 500);
      
      return true; // Always return true to indicate success
    } catch (error) {
      console.error("Error during disconnect process:", error);
      
      // Even if there was an error, we still want to reset our application state
      setIsConnected(false);
      setAccount('');
      setSigner(null);
      setContractsReady(false);
      
      // Reset the disconnecting flag
      setTimeout(() => {
        setIsDisconnecting(false);
      }, 500);
      
      return true; // Return true even in case of error, as we've reset app state
    }
  }, [provider, clearWalletData, currentWalletType, account, isWalletConnectActive, walletConnectDisconnect]);

  // Provide contract names for easier access
  const getContractByName = (name) => {
    switch(name) {
      case 'token':
      case 'justToken':
        return contracts.justToken;
      case 'governance':
        return contracts.governance;
      case 'timelock':
        return contracts.timelock;
      case 'analyticsHelper':
        return contracts.analyticsHelper;
      case 'daoHelper':
        return contracts.daoHelper;
      case 'securityManager':
        return contracts.securityManager;
      default:
        console.warn(`Unknown contract name: ${name}`);
        return null;
    }
  };

  // Check if contracts are initialized
  const isContractInitialized = (name) => {
    return !!getContractByName(name);
  };

  const value = {
    provider,
    signer,
    account,
    isConnected,
    networkId,
    isCorrectNetwork,
    contracts,
    contractsReady,
    contractErrors,
    refreshCounter,
    connectionError,
    currentWalletType,
    isConnecting,
    isDisconnecting,
    getContractByName,
    isContractInitialized,
    connectWallet,
    disconnectWallet,
    refreshData,
    refreshContractData,
    switchToCorrectNetwork
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}