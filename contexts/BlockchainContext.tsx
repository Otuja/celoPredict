
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserBalance, getUserSigner } from '../services/blockchain';
import { ethers } from 'ethers';

interface BlockchainContextType {
  currentAccount: string | null;
  userBalance: string;
  isConnected: boolean;
  isConnecting: boolean;
  isDevWallet: boolean; // True if using fallback key, False if using MetaMask
  connectWallet: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextType>({} as BlockchainContextType);

export const BlockchainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>("0.00");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDevWallet, setIsDevWallet] = useState(false);

  const refreshData = useCallback(async () => {
    if (currentAccount) {
      const balance = await getUserBalance(currentAccount);
      setUserBalance(balance);
    }
  }, [currentAccount]);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
        const signer = await getUserSigner();
        const address = await signer.getAddress();
        
        // Determine connection type
        // @ts-ignore
        const hasInjectedProvider = !!(window.ethereum || window.celo);
        // Check if the returned signer is actually a BrowserProvider signer
        const isBrowserSigner = signer.provider instanceof ethers.BrowserProvider;
        
        // Logic: It's a real wallet ONLY IF an injected provider exists AND we are using it
        const usingRealWallet = hasInjectedProvider && isBrowserSigner;
        
        setIsDevWallet(!usingRealWallet);
        setCurrentAccount(address);
        
        const balance = await getUserBalance(address);
        setUserBalance(balance);
    } catch (error) {
        console.error("Failed to connect wallet", error);
    } finally {
        setIsConnecting(false);
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    connectWallet();
  }, []);

  // Listen for account changes (Only relevant for Real Wallets)
  useEffect(() => {
     // @ts-ignore
     if (window.ethereum && !isDevWallet) {
         // @ts-ignore
         window.ethereum.on('accountsChanged', (accounts: string[]) => {
             if (accounts.length > 0) {
                 setCurrentAccount(accounts[0]);
                 refreshData();
             } else {
                 // User disconnected wallet, fallback to Dev Wallet
                 connectWallet();
             }
         });
         
         // @ts-ignore
         window.ethereum.on('chainChanged', () => {
             window.location.reload();
         });
     }
  }, [isDevWallet, refreshData]);

  // Polling for balance updates
  useEffect(() => {
    if(!currentAccount) return;
    const interval = setInterval(() => {
        refreshData();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentAccount, refreshData]);

  return (
    <BlockchainContext.Provider value={{
      currentAccount,
      userBalance,
      isConnected: !!currentAccount,
      isConnecting,
      isDevWallet,
      connectWallet,
      refreshData
    }}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => useContext(BlockchainContext);
