
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  prizePool: string;
  resultsSubmitted: boolean;
  finalHomeScore: number;
  finalAwayScore: number;
  prizesDistributed: boolean;
}

export interface Prediction {
  predictor: string;
  homeScore: number;
  awayScore: number;
  amount: string;
  timestamp: string;
}

export enum PageView {
  HOME = 'HOME',
  MY_BETS = 'MY_BETS',
  WALLET = 'WALLET',
  LEADERBOARD = 'LEADERBOARD',
  ADMIN = 'ADMIN'
}

export interface ContractError extends Error {
  reason?: string;
  code?: string;
}

export enum TxStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
