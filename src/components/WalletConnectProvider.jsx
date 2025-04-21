import React from 'react';
import { WalletConnectModalSign } from '@walletconnect/modal-sign-react';
import { WALLET_CONNECT_PROJECT_ID } from '../utils/walletConnectConfig';

// WalletConnect provider wrapper component
const WalletConnectProvider = ({ children }) => {
  // Use your project ID from walletConnectConfig
  const projectId = WALLET_CONNECT_PROJECT_ID;
  
  return (
    <>
      {children}
      
      {/* Set up WalletConnectModalSign component */}
      <WalletConnectModalSign
        projectId={projectId}
        metadata={{
          name: 'JustDAO',
          description: 'Decentralized Governance Platform',
          url: window.location.origin,
          icons: [`${window.location.origin}/logo.png`]
        }}
      />
    </>
  );
};

export default WalletConnectProvider;