import { useState } from 'react';
import { ConnectWallet } from '../components/ConnectWallet';
import { NetworkId } from '../config';
import { useSubscription } from '../hooks/useSubscription';
import { useWalletStatus } from '../hooks/useWalletStatus';

// Contract address - can be changed to any deployed contract
const SUBSCRIPTION_CONTRACT = 'smartcontract6.testnet';

export default function MetaMaskTest() {
  const [showSpinner, setShowSpinner] = useState(false);
  
  // Use our custom hooks
  const { 
    isLoggedIn, 
    accountId, 
    isMetaMaskConnected, 
    walletType 
  } = useWalletStatus();
  
  const { 
    isSubscribed, 
    subscriptionPrice, 
    subscriptionExpiry, 
    loading, 
    error, 
    subscribe, 
    checkSubscriptionStatus 
  } = useSubscription(SUBSCRIPTION_CONTRACT);
  
  // Handle subscription
  const handleSubscribe = async () => {
    if (!accountId) {
      alert("Please connect your wallet first");
      return;
    }
    
    // Check if using MetaMask and show warning
    if (isMetaMaskConnected) {
      alert("MetaMask is connected, but direct contract calls may not work correctly. For best results, use a NEAR native wallet like MyNearWallet.");
    }
    
    setShowSpinner(true);
    
    try {
      await subscribe();
      alert("Successfully subscribed!");
    } catch (error) {
      // Error is already handled in the hook
      alert(error.message);
    } finally {
      setShowSpinner(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Subscription Demo</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <ConnectWallet />
        
        {isMetaMaskConnected && (
          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <p className="text-yellow-700">
              ⚠️ You're connected via MetaMask. For best results with NEAR contracts, we recommend using a NEAR native wallet like MyNearWallet.
            </p>
          </div>
        )}
      </div>
      
      {isLoggedIn && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Subscription Status</h2>
          
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Checking subscription status...</span>
            </div>
          ) : (
            <div className="mb-6">
              {isSubscribed ? (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                  <p className="text-green-700 font-medium">✅ You have an active subscription!</p>
                  {subscriptionExpiry !== 'N/A' && (
                    <p className="text-green-600">Expires on: {subscriptionExpiry}</p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                  <p className="text-yellow-700 font-medium">❌ You are not subscribed</p>
                  <p className="text-yellow-600">Subscribe now to access premium features</p>
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="font-medium text-blue-800 mb-2">Subscription Information</p>
                <p className="text-blue-700">Price: {subscriptionPrice} NEAR / month</p>
                <p className="text-sm text-blue-600 mt-1">
                  {isSubscribed ? 'Extend your subscription by another month' : 'Get access to premium features today'}
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                  <p className="text-red-700">⚠️ {error}</p>
                </div>
              )}
              
              <button 
                onClick={handleSubscribe} 
                className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors ${(showSpinner || loading) ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={showSpinner || loading}
              >
                {(showSpinner || loading) ? 'Processing...' : isSubscribed ? 'Extend Subscription' : 'Subscribe Now'}
              </button>
              
              <div className="mt-4 bg-gray-50 p-3 rounded text-gray-600 text-sm">
                <p>Note: This will send {subscriptionPrice} NEAR to the subscription contract.</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {isLoggedIn && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Technical Information</h3>
          <p className="mb-2"><span className="font-medium">Contract Address:</span> {SUBSCRIPTION_CONTRACT}</p>
          <p className="mb-2"><span className="font-medium">Network:</span> {NetworkId}</p>
          <p className="mb-2"><span className="font-medium">Connected Account:</span> {accountId}</p>
          <p className="mb-2"><span className="font-medium">Wallet Type:</span> {walletType}</p>
          <p className="mb-2"><span className="font-medium">Subscription Status:</span> {isSubscribed ? 'Active' : 'Not Subscribed'}</p>
          
          <button
            onClick={checkSubscriptionStatus}
            className="mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1 px-3 rounded text-sm transition-colors"
          >
            Refresh Status
          </button>
        </div>
      )}
    </div>
  );
} 