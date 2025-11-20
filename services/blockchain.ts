
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, RPC_URL, HACKATHON_PRIVATE_KEY, IS_HACKATHON_MODE } from '../constants';

// Global Provider
const jsonProvider = new ethers.JsonRpcProvider(RPC_URL);

// --- WALLET HELPERS ---

export const getSigner = async () => {
  if (IS_HACKATHON_MODE) {
     if (!HACKATHON_PRIVATE_KEY) throw new Error("Hackathon mode enabled but no private key found.");
     // Create wallet and connect it to the provider immediately
     // This bypasses Metamask entirely
     const wallet = new ethers.Wallet(HACKATHON_PRIVATE_KEY, jsonProvider);
     return wallet;
  }

  // Production Mode (Not used for this Hackathon Demo)
  // @ts-ignore
  const ethereum = window.ethereum || window.celo;
  if (!ethereum) throw new Error("No wallet found.");
  
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  return signer;
};

export const getContract = async () => {
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

export const getReadOnlyContract = () => {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, jsonProvider);
};

export const getUserBalance = async (address: string) => {
    try {
        const balance = await jsonProvider.getBalance(address);
        return ethers.formatEther(balance);
    } catch (e) {
        console.error("Error fetching balance", e);
        return "0.0";
    }
};

export const getContractBalance = async () => {
    try {
        const balance = await jsonProvider.getBalance(CONTRACT_ADDRESS);
        return ethers.formatEther(balance);
    } catch (e) {
        console.error("Error fetching contract balance", e);
        return "0.0";
    }
}

export const formatTimestamp = (timestamp: string | number) => {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diff = Number(timestamp) * 1000 - now.getTime();
  
  if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
      return `Starts in ${minutes}m`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatCurrency = (wei: string) => {
  try {
    return parseFloat(ethers.formatEther(wei)).toFixed(2);
  } catch (e) {
    return "0.00";
  }
};
