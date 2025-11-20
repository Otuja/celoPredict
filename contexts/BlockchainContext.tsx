
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserBalance, getSigner, getEthereum } from '../services/blockchain';
import { IS_HACKATHON_MODE, CELO_CHAIN_ID } from '../constants';
import { ethers } from 'ethers';

interface BlockchainContextType {
  currentAccount: string | null;
  userBalance: string;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextType>({} as BlockchainContextType);

export const BlockchainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>("0.00");
  const [isConnecting, setIsConnecting] = useState(false);

  const refreshData = useCallback(async () => {
    if (currentAccount) {
      const balance = await getUserBalance(currentAccount);
      setUserBalance(balance);
    }
  }, [currentAccount]);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
        if (IS_HACKATHON_MODE) {
            // Hackathon Mode: Use Private Key
            const signer = await getSigner();
            const address = await signer.getAddress();
            setCurrentAccount(address);
            const balance = await getUserBalance(address);
            setUserBalance(balance);
        } else {
            // Production Mode: Use Browser Wallet
            const ethereum = getEthereum();
            if (!ethereum) {
                alert("Please install MetaMask or Valora!");
                return;
            }

            // Request Account
            // @ts-ignore
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            
            // Switch Chain
            try {
                // @ts-ignore
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${CELO_CHAIN_ID.toString(16)}` }],
                });
            } catch (switchError: any) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    // @ts-ignore
                    await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${CELO_CHAIN_ID.toString(16)}`,
                            chainName: 'Celo Sepolia Testnet',
                            nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
                            rpcUrls: ['https://forno.celo-sepolia.celo-testnet.org'],
                            blockExplorerUrls: ['https://celo-sepolia.blockscout.com']
                        }],
                    });
                }
            }

            setCurrentAccount(accounts[0]);
            const balance = await getUserBalance(accounts[0]);
            setUserBalance(balance);
        }
    } catch (error) {
        console.error("Failed to connect wallet", error);
    } finally {
        setIsConnecting(false);
    }
  };

  // Initialize
  useEffect(() => {
    if (IS_HACKATHON_MODE) {
        connectWallet();
    } else {
        // In production, check if already connected
        const checkConnection = async () => {
             const ethereum = getEthereum();
             // @ts-ignore
             if (ethereum && ethereum.selectedAddress) {
                 connectWallet();
             }
        }
        checkConnection();
    }
  }, []);

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
      connectWallet,
      refreshData
    }}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => useContext(BlockchainContext);
