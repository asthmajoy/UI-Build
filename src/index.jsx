import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Web3Provider } from './contexts/Web3Context';
import { AuthProvider } from './contexts/AuthContext';
import WalletConnectProvider from './components/WalletConnectProvider';

Object.defineProperty(window, 'web3', {
  get: function() {
    console.trace('Something is trying to access window.web3');
    return undefined;
  }
});

ReactDOM.render(
  <React.StrictMode>
        <WalletConnectProvider>
    <Web3Provider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Web3Provider>
    </WalletConnectProvider>

  </React.StrictMode>,
  document.getElementById('root')
); 