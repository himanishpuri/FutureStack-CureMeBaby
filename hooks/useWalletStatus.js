import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

/**
 * Hook for managing wallet connection status
 * @returns {Object} - Wallet status and information
 */
export const useWalletStatus = () => {
  const { signedAccountId, activeWalletId } = useWalletSelector();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  
  useEffect(() => {
    // Set login status based on NEAR wallet
    setIsLoggedIn(!!signedAccountId);
    
    if (signedAccountId) {
      // Check if connected via MetaMask
      setIsMetaMaskConnected(activeWalletId?.includes('ethereum'));
    }
  }, [signedAccountId, activeWalletId]);
  
  return {
    isLoggedIn,
    accountId: signedAccountId,
    isMetaMaskConnected,
    walletType: isMetaMaskConnected ? 'MetaMask (Ethereum)' : 'NEAR Native Wallet',
  };
}; 