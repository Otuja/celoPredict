
// ==========================================
// CELOPREDICT - HACKATHON CONFIGURATION
// ==========================================

// Helper to safely access environment variables in Vite/Browser
const getEnv = (key: string, fallback: string | boolean): any => {
  try {
    // @ts-ignore
    return import.meta.env[key] || fallback;
  } catch (e) {
    return fallback;
  }
};

// 1. FORCE HACKATHON MODE (Bypasses MetaMask/Valora)
// set to TRUE for the Hackathon Demo so it works on all devices immediately
export const IS_HACKATHON_MODE = getEnv('VITE_IS_HACKATHON_MODE', true) === 'true' || getEnv('VITE_IS_HACKATHON_MODE', true) === true;

// 2. YOUR PRIVATE KEY (Corresponds to 0x9af1...)
// We try to read from .env first. If that fails (preview mode), we fall back to the hardcoded string.
export const HACKATHON_PRIVATE_KEY = getEnv('VITE_HACKATHON_PRIVATE_KEY', "");

// 3. SMART CONTRACT ADDRESS
export const CONTRACT_ADDRESS = getEnv('VITE_CONTRACT_ADDRESS', "0x3B4e4108d4e1099d334cE8800aab1a58be249319");

// 4. ADMIN WALLET ADDRESS
export const ADMIN_ADDRESS = getEnv('VITE_ADMIN_ADDRESS', "");

// ==========================================
// NETWORK CONFIGURATION
// ==========================================

export const CELO_CHAIN_ID = 42220; 
export const RPC_URL = getEnv('VITE_RPC_URL', "https://forno.celo.org");
export const BLOCK_EXPLORER = getEnv('VITE_BLOCK_EXPLORER', "https://celoscan.io");

export const ENTRY_FEE_DISPLAY = "0.2 CELO";

// ==========================================
// CONTRACT ABI
// ==========================================
export const CONTRACT_ABI = [
  // Write functions
  "function createMatch(string _homeTeam, string _awayTeam, uint256 _kickoffTime) external",
  "function predictMatch(uint256 _matchId, uint8 _homeScore, uint8 _awayScore) external payable",
  "function submitResult(uint256 _matchId, uint8 _homeScore, uint8 _awayScore) external",
  "function claimWinnings() external",
  "function withdrawPlatformFees() external",
  
  // Read functions
  "function matchCounter() external view returns (uint256)",
  "function matches(uint256) external view returns (uint256 id, string homeTeam, string awayTeam, uint256 kickoffTime, uint256 prizePool, bool resultsSubmitted, uint8 finalHomeScore, uint8 finalAwayScore, bool prizesDistributed)",
  "function getActiveMatches() external view returns (tuple(uint256 id, string homeTeam, string awayTeam, uint256 kickoffTime, uint256 prizePool, bool resultsSubmitted, uint8 finalHomeScore, uint8 finalAwayScore, bool prizesDistributed)[])",
  "function getUserPredictions(address _user) external view returns (uint256[] memory matchIds, tuple(address predictor, uint8 homeScore, uint8 awayScore, uint256 amount, uint256 timestamp)[] memory predictions)",
  "function getMatch(uint256 _matchId) external view returns (tuple(uint256 id, string homeTeam, string awayTeam, uint256 kickoffTime, uint256 prizePool, bool resultsSubmitted, uint8 finalHomeScore, uint8 finalAwayScore, bool prizesDistributed))",
  "function getMatchPredictions(uint256 _matchId) external view returns (tuple(address predictor, uint8 homeScore, uint8 awayScore, uint256 amount, uint256 timestamp)[])",
  "function userWinnings(address) external view returns (uint256)",
  "function owner() external view returns (address)",
  
  // Events
  "event MatchCreated(uint256 indexed matchId, string homeTeam, string awayTeam, uint256 kickoffTime)",
  "event PredictionPlaced(uint256 indexed matchId, address indexed predictor, uint8 homeScore, uint8 awayScore, uint256 amount)",
  "event ResultsSubmitted(uint256 indexed matchId, uint8 homeScore, uint8 awayScore)",
  "event WinningsClaimed(address indexed user, uint256 amount)"
];
