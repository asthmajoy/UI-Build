import React, { useState, useEffect } from 'react';
import { WalletConnectModalSign } from '@walletconnect/modal-sign-react';
import { getWalletConnectConfig } from '../utils/walletConnectConfig';

const WalletConnectProvider = ({ children }) => {
  const [isWalletConnectReady, setIsWalletConnectReady] = useState(false);
  const [walletConnectError, setWalletConnectError] = useState(null);

  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        // Generate WalletConnect configuration
        const walletConnectConfig = getWalletConnectConfig({
          // Optional: Add more specific configuration
          showQrModal: true,
          enableExplorer: true,
          chains: [1], // Ethereum mainnet
          metadata: {
            name: 'JustDAO',
            description: 'Decentralized Governance Platform',
            url: window.location.origin,
            icons: [`${window.location.origin}/logo.png`]
          }
        });

        // Validation for Project ID
        if (!walletConnectConfig.projectId) {
          throw new Error('WalletConnect Project ID is missing');
        }

        // Set ready state after successful configuration
        setIsWalletConnectReady(true);
      } catch (error) {
        console.error('WalletConnect initialization error:', error);
        setWalletConnectError(error);
        setIsWalletConnectReady(false);
      }
    };

    initWalletConnect();
  }, []);

  // Error boundary for WalletConnect
  if (walletConnectError) {
    return (
      <div className="wallet-connect-error bg-red-50 p-4 rounded-lg">
        <h3 className="text-red-600 font-bold">WalletConnect Initialization Failed</h3>
        <p className="text-red-500 mt-2">
          Could not initialize WalletConnect. Please check your configuration.
        </p>
        <details className="mt-2 text-sm text-gray-600">
          <summary>Error Details</summary>
          <pre>{walletConnectError.message}</pre>
        </details>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {isWalletConnectReady && (
        <WalletConnectModalSign
          projectId={getWalletConnectConfig().projectId}
          metadata={{
            name: 'JustDAO',
            description: 'Decentralized Governance Platform',
            url: window.location.origin,
            icons: [`${window.location.origin}/logo.png`]
          }}
          onInitError={(err) => {
            console.error('WalletConnect init error:', err);
            setWalletConnectError(err);
          }}
        />
      )}
    </>
  );
};

export default WalletConnectProvider;