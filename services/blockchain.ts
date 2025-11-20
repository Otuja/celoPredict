
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, RPC_URL, HACKATHON_PRIVATE_KEY, CELO_CHAIN_ID } from '../constants';

// Global Provider for Read-Only access
const jsonProvider = new ethers.JsonRpcProvider(RPC_URL);

// State to track if user explicitly wants to use real wallet
let useRealWallet = false;

export const setWalletPreference = (enable: boolean) => {
    useRealWallet = enable;
};

// Check if running in MiniPay
export const isMiniPay = () => {
    // @ts-ignore
    return window.ethereum && window.ethereum.isMiniPay;
};

// --- NETWORK SWITCHING ---
export const switchToCeloSepolia = async () => {
    // @ts-ignore
    if (!window.ethereum) return;

    const hexChainId = "0x" + CELO_CHAIN_ID.toString(16);
    
    try {
        // @ts-ignore
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId }],
        });
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                // @ts-ignore
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: hexChainId,
                            chainName: 'Celo Sepolia Testnet',
                            nativeCurrency: {
                                name: 'CELO',
                                symbol: 'CELO',
                                decimals: 18,
                            },
                            rpcUrls: ['https://forno.celo-sepolia.celo-testnet.org'],
                            blockExplorerUrls: ['https://celo-sepolia.blockscout.com'],
                        },
                    ],
                });
            } catch (addError) {
                console.error("Failed to add Celo Sepolia", addError);
            }
        } else {
            console.error("Failed to switch network", switchError);
        }
    }
};

// --- 1. ADMIN SIGNER (ALWAYS PRIVATE KEY) ---
// This ensures Admin actions (Create, Settle) never fail
export const getAdminSigner = () => {
    if (!HACKATHON_PRIVATE_KEY) throw new Error("No Admin Private Key found.");
    return new ethers.Wallet(HACKATHON_PRIVATE_KEY, jsonProvider);
};

// --- 2. USER SIGNER (HYBRID) ---
export const getUserSigner = async () => {
    // @ts-ignore
    const injectedProvider = window.ethereum || window.celo;

    // MiniPay Auto-Detection: If inside MiniPay, always try to use it first
    if (isMiniPay() || (useRealWallet && injectedProvider)) {
        try {
            // Force Network Switch First
            if (!isMiniPay()) {
                await switchToCeloSepolia();
            }

            const provider = new ethers.BrowserProvider(injectedProvider);
            const signer = await provider.getSigner(); 
            return signer;
        } catch (e) {
            console.warn("Wallet connection failed. Falling back to Dev Wallet.");
            // Only reset preference if NOT in MiniPay (MiniPay users should retry)
            if (!isMiniPay()) {
                useRealWallet = false;
            }
        }
    }

    // Default: Dev Wallet (Silent, no popup)
    return getAdminSigner();
};

// --- CONTRACT HELPERS ---
export const getContract = async (asAdmin: boolean = false) => {
  const signer = asAdmin ? getAdminSigner() : await getUserSigner();
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

// --- LEADERBOARD CALCULATION ---
export interface LeaderboardEntry {
    address: string;
    wins: number;
    totalPredictions: number;
    totalWinnings: number; // In ETH/CELO (Approximate based on 0.5 entry fee calculation)
}

export const getGlobalLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    try {
        const contract = getReadOnlyContract();
        
        // 1. Get Total Match Count using the newly added matchCounter function
        // Using 'try/catch' because getting total matches is critical
        let totalMatches = 0;
        try {
             const count = await contract.matchCounter();
             totalMatches = Number(count);
        } catch (e) {
             console.warn("Could not fetch match counter, defaulting to active matches approach which might be incomplete.");
             // Fallback if matchCounter fails (though it shouldn't with correct ABI)
             const active = await contract.getActiveMatches();
             // This is imperfect but a safety net
             return []; 
        }

        if (totalMatches === 0) return [];

        // 2. Fetch ALL matches in parallel to find the settled ones
        const matchPromises = [];
        // Loop 1 to Total (Solidity ID starts at 1)
        for (let i = 1; i <= totalMatches; i++) {
            matchPromises.push(contract.getMatch(i).catch(() => null));
        }
        
        const allMatchesRaw = await Promise.all(matchPromises);
        const validMatches = allMatchesRaw.filter(m => m !== null);
        
        // Map to store user stats
        const userStats = new Map<string, { wins: number, preds: number, earnings: number }>();

        // 3. Filter for settled matches
        const settledMatches = validMatches.filter((m: any) => m.resultsSubmitted);

        for (const match of settledMatches) {
            const matchId = match.id;
            const finalHome = Number(match.finalHomeScore);
            const finalAway = Number(match.finalAwayScore);
            
            // Get predictions for this match
            const predictions = await contract.getMatchPredictions(matchId);
            
            // Calculate winners for this specific match to estimate prize share
            const winners = predictions.filter((p: any) => 
                Number(p.homeScore) === finalHome && Number(p.awayScore) === finalAway
            );
            
            const prizePool = Number(ethers.formatEther(match.prizePool));
            const platformFee = prizePool * 0.05;
            const distributable = prizePool - platformFee;
            const winAmount = winners.length > 0 ? distributable / winners.length : 0;

            for (const pred of predictions) {
                const user = pred.predictor;
                const isWin = Number(pred.homeScore) === finalHome && Number(pred.awayScore) === finalAway;
                
                const current = userStats.get(user) || { wins: 0, preds: 0, earnings: 0 };
                
                userStats.set(user, {
                    wins: current.wins + (isWin ? 1 : 0),
                    preds: current.preds + 1,
                    earnings: current.earnings + (isWin ? winAmount : 0)
                });
            }
        }

        // Convert to array and sort
        const leaderboard: LeaderboardEntry[] = Array.from(userStats.entries()).map(([addr, stats]) => ({
            address: addr,
            wins: stats.wins,
            totalPredictions: stats.preds,
            totalWinnings: stats.earnings
        }));

        // Sort by Wins, then Earnings
        leaderboard.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.totalWinnings - a.totalWinnings;
        });

        return leaderboard;

    } catch (e) {
        console.error("Error calculating leaderboard", e);
        return [];
    }
};

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

export const formatCurrency = (wei: string | number) => {
  try {
    // If already number (from leaderboard calc), just format
    if (typeof wei === 'number') return wei.toFixed(2);
    return parseFloat(ethers.formatEther(wei)).toFixed(2);
  } catch (e) {
    return "0.00";
  }
};
