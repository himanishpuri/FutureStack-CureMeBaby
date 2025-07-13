import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

// Contract address - can be passed as a parameter for flexibility
const DEFAULT_CONTRACT_ADDRESS = 'smartcontract6.testnet';

/**
 * Hook for managing subscription functionality
 * @param {string} contractId - The contract ID to interact with
 * @returns {Object} - Subscription functions and state
 */
export const useSubscription = (contractId = DEFAULT_CONTRACT_ADDRESS) => {
  const { signedAccountId, viewFunction, callFunction } = useWalletSelector();
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize subscription status when account changes
  useEffect(() => {
    if (signedAccountId) {
      checkSubscriptionStatus();
      getSubscriptionPrice();
    } else {
      // Reset states when wallet disconnects
      setIsSubscribed(false);
      setSubscriptionExpiry(null);
    }
  }, [signedAccountId, contractId]);

  /**
   * Get subscription price from contract
   */
  const getSubscriptionPrice = async () => {
    try {
      const price = await viewFunction({
        contractId,
        method: 'getSubscriptionPrice',
        args: {}
      });
      
      // Convert from yoctoNEAR to NEAR
      const priceInNear = (BigInt(price) / BigInt(10**24)).toString();
      setSubscriptionPrice(priceInNear);
      return priceInNear;
    } catch (error) {
      console.error("Error fetching subscription price:", error);
      setError("Could not fetch subscription price");
      return '1'; // Default fallback
    }
  };
  
  /**
   * Check if the current user is subscribed
   */
  const checkSubscriptionStatus = async () => {
    if (!signedAccountId) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if user is subscribed
      const status = await viewFunction({
        contractId,
        method: 'isSubscribed',
        args: { accountId: signedAccountId }
      });
      
      setIsSubscribed(status);
      
      // If subscribed, get expiry date
      if (status) {
        await getSubscriptionExpiry();
      }
      
      return status;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setError("Could not check subscription status");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get subscription expiry date
   */
  const getSubscriptionExpiry = async () => {
    if (!signedAccountId) return null;
    
    try {
      const expiry = await viewFunction({
        contractId,
        method: 'getSubscriptionExpiry',
        args: { accountId: signedAccountId }
      });
      
      if (expiry) {
        // Convert nanoseconds to milliseconds and create a date
        const expiryDate = new Date(Number(expiry) / 1000000);
        setSubscriptionExpiry(expiryDate.toLocaleString());
        return expiryDate;
      }
      return null;
    } catch (err) {
      console.error("Error fetching expiry:", err);
      return null;
    }
  };
  
  /**
   * Subscribe or extend subscription
   */
  const subscribe = async () => {
    if (!signedAccountId) {
      throw new Error("Please connect your wallet first");
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use a fixed amount of NEAR (1 NEAR) for subscription to avoid conversion issues
      const depositAmount = "1000000000000000000000000"; // 1 NEAR in yoctoNEAR
      
      // Call the subscribe method with attached deposit
      await callFunction({ 
        contractId, 
        method: 'subscribe',
        args: {},
        deposit: depositAmount
      });
      
      // Check subscription status after subscribing
      await checkSubscriptionStatus();
      
      return true;
    } catch (error) {
      console.error("Error subscribing:", error);
      
      // Extract the error message from the error object
      let errorMsg = "Failed to subscribe. See console for details.";
      
      if (error.message && error.message.includes("cannot read property 'keyPrefix'")) {
        errorMsg = "The subscription contract has not been initialized properly. Please contact the administrator.";
      } else if (error.message && error.message.includes("External transactions to internal accounts cannot include data")) {
        errorMsg = "MetaMask cannot directly call NEAR contracts. Please use a NEAR native wallet instead.";
      }
      
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Format expiry date to a readable string
  const formattedExpiry = subscriptionExpiry ? subscriptionExpiry : 'N/A';

  return {
    // State
    isSubscribed,
    subscriptionPrice,
    subscriptionExpiry: formattedExpiry,
    loading,
    error,
    
    // Functions
    subscribe,
    checkSubscriptionStatus,
    getSubscriptionPrice,
    getSubscriptionExpiry,
  };
}; 