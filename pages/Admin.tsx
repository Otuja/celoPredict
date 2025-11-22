import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Shield,
  Trophy,
  Clock,
  AlertTriangle,
  Wallet,
  Download,
  RefreshCw,
} from "lucide-react";
import { Match } from "../types";
import { useBlockchain } from "../contexts/BlockchainContext";
import { getReadOnlyContract, refillContract } from "../services/blockchain";

interface AdminProps {
  matches: Match[];
  platformFees: string;
  onCreateMatch: (home: string, away: string, kickoff: string) => void;
  onSettleMatch: (id: string, home: string, away: string) => void;
  onWithdrawFees: () => void;
}

interface SettlementRowProps {
  match: Match;
  onSettle: (id: string, h: string, a: string) => void;
}

// Sub-component to handle individual settlement form state
const SettlementRow: React.FC<SettlementRowProps> = ({ match, onSettle }) => {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = Number(match.kickoffTime) - now;
      setTimeLeft(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [match.kickoffTime]);

  // We add a 15 second buffer to ensure block time has definitely passed
  // This prevents the "Match not started" revert error
  const canSettle = timeLeft < -15;

  return (
    <div className="p-4 bg-black/50 border border-gray-800 rounded-xl">
      <div className="text-sm font-bold text-white mb-3 flex justify-between items-center">
        <span>
          {match.homeTeam} vs {match.awayTeam}
        </span>
        <div className="flex items-center gap-2">
          {!canSettle ? (
            <span className="text-[10px] font-mono text-celo-gold bg-yellow-900/20 px-2 py-1 rounded animate-pulse">
              {timeLeft > 0
                ? `Starts in ${timeLeft}s`
                : "Waiting for Block Time..."}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-celo-green bg-green-900/20 px-2 py-1 rounded">
              Ready to Settle
            </span>
          )}
          <span className="text-gray-500 text-xs bg-gray-900 px-2 py-1 rounded">
            ID: {match.id}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <input
            type="number"
            placeholder="-"
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="w-12 h-10 bg-gray-800 border border-gray-700 rounded-lg text-center text-white focus:border-celo-green outline-none"
          />
          <span className="text-[10px] text-gray-500 mt-1">Home</span>
        </div>
        <span className="text-gray-500 font-bold mb-3">:</span>
        <div className="flex flex-col items-center">
          <input
            type="number"
            placeholder="-"
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="w-12 h-10 bg-gray-800 border border-gray-700 rounded-lg text-center text-white focus:border-celo-green outline-none"
          />
          <span className="text-[10px] text-gray-500 mt-1">Away</span>
        </div>
        <button
          onClick={() => onSettle(match.id, home, away)}
          disabled={!canSettle || !home || !away}
          className={`flex-1 h-10 rounded-lg text-xs font-bold ml-2 transition-all mb-3
                        ${
                          !canSettle
                            ? "bg-gray-800 text-gray-500 cursor-wait"
                            : !home || !away
                            ? "bg-gray-800 text-gray-500"
                            : "bg-celo-green text-black hover:bg-emerald-400 shadow-lg shadow-celo-green/20"
                        }`}
        >
          {!canSettle ? "WAIT..." : "SETTLE"}
        </button>
      </div>
    </div>
  );
};

const Admin: React.FC<AdminProps> = ({
  matches,
  platformFees,
  onCreateMatch,
  onSettleMatch,
  onWithdrawFees,
}) => {
  const { currentAccount } = useBlockchain();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [isRefilling, setIsRefilling] = useState(false);

  const [newHomeTeam, setNewHomeTeam] = useState("");
  const [newAwayTeam, setNewAwayTeam] = useState("");
  const [newKickoff, setNewKickoff] = useState("");

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const contract = getReadOnlyContract();
        const owner = await contract.owner();
        // Case insensitive check
        if (
          currentAccount &&
          owner.toLowerCase() === currentAccount.toLowerCase()
        ) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
          console.warn(
            `Current account ${currentAccount} is not owner ${owner}`
          );
        }
      } catch (e) {
        console.error("Failed to check owner", e);
      }
    };
    if (currentAccount) checkOwner();
  }, [currentAccount]);

  const handleCreate = () => {
    if (!newHomeTeam || !newAwayTeam || !newKickoff) return;
    onCreateMatch(newHomeTeam, newAwayTeam, newKickoff);
    setNewHomeTeam("");
    setNewAwayTeam("");
    setNewKickoff("");
  };

  const handleRefill = async () => {
    setIsRefilling(true);
    try {
      await refillContract();
      alert("Injected 0.5 CELO Liquidity!");
    } catch (e) {
      alert("Refill Failed. Check console.");
    } finally {
      setIsRefilling(false);
    }
  };

  const setTimeFromNow = (minutes: number) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    // Format to YYYY-MM-DDThh:mm for datetime-local input
    const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setNewKickoff(localIso);
  };

  const pendingMatches = matches.filter(
    (m) => !m.resultsSubmitted && m.homeTeam !== "Liquidity"
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 pt-8 pb-32">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Admin Console</h2>
        <div className="px-2 py-1 bg-red-900/30 border border-red-900 rounded text-[10px] text-red-400 uppercase font-bold tracking-wider">
          Hackathon Mode
        </div>
      </div>

      {isOwner === false && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-6 flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-red-200">
            <strong>Warning:</strong> Your current wallet (
            {currentAccount?.slice(0, 6)}...) is not the contract owner.
            <br />
            Transactions like 'Create Match' or 'Settle' will revert.
          </div>
        </div>
      )}

      {/* Platform Earnings (Business Model) */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 rounded-3xl border border-gray-700 mb-6 shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white">
              <Wallet size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">
                Contract Balance (TVL)
              </div>
              <div className="text-lg font-bold text-white">
                {parseFloat(platformFees).toFixed(4)} CELO
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onWithdrawFees}
              disabled={isOwner === false || parseFloat(platformFees) === 0}
              className="flex-1 px-4 py-2 bg-white text-black text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Withdraw
            </button>
            <button
              onClick={handleRefill}
              disabled={isRefilling}
              className="flex-1 px-4 py-2 bg-gray-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isRefilling ? "animate-spin" : ""}
              />
              {isRefilling ? "Refilling..." : "Refill +0.5 CELO"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Create Match */}
        <div className="bg-[#1A1A1A] p-5 rounded-3xl border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-celo-green/10 rounded-full blur-xl -mr-5 -mt-5" />
          <h3 className="font-bold mb-4 flex items-center gap-2 text-white relative z-10">
            <PlusCircle className="text-celo-green" size={20} /> Create Match
          </h3>
          <div className="space-y-3 relative z-10">
            <div className="flex gap-3">
              <input
                placeholder="Home Team"
                className="flex-1 min-w-0 bg-black border border-gray-700 p-3 rounded-xl focus:border-celo-green outline-none text-sm text-white"
                value={newHomeTeam}
                onChange={(e) => setNewHomeTeam(e.target.value)}
              />
              <input
                placeholder="Away Team"
                className="flex-1 min-w-0 bg-black border border-gray-700 p-3 rounded-xl focus:border-celo-green outline-none text-sm text-white"
                value={newAwayTeam}
                onChange={(e) => setNewAwayTeam(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 ml-1 flex justify-between">
                <span>Kickoff Time</span>
                <span className="text-celo-green font-bold">Quick Set:</span>
              </label>
              <div className="flex gap-2 mb-1 overflow-x-auto pb-2 no-scrollbar">
                <button
                  onClick={() => setTimeFromNow(1)}
                  className="flex-shrink-0 flex items-center gap-1 bg-gray-800 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  <Clock size={12} className="text-celo-green" /> +1 Min
                </button>
                <button
                  onClick={() => setTimeFromNow(2)}
                  className="flex-shrink-0 flex items-center gap-1 bg-gray-800 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  <Clock size={12} className="text-celo-green" /> +2 Min
                </button>
                <button
                  onClick={() => setTimeFromNow(5)}
                  className="flex-shrink-0 flex items-center gap-1 bg-gray-800 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  <Clock size={12} className="text-celo-green" /> +5 Min
                </button>
              </div>
              <input
                type="datetime-local"
                className="w-full bg-black border border-gray-700 p-3 rounded-xl focus:border-celo-green outline-none text-sm text-white"
                value={newKickoff}
                onChange={(e) => setNewKickoff(e.target.value)}
              />
            </div>
            <button
              onClick={handleCreate}
              className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-gray-200 mt-2 shadow-lg shadow-white/5"
            >
              Publish to Blockchain
            </button>
          </div>
        </div>

        {/* Settlements */}
        <div className="bg-[#1A1A1A] p-5 rounded-3xl border border-gray-800">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
            <Shield className="text-celo-green" size={20} /> Pending Results
          </h3>
          <div className="space-y-3">
            {pendingMatches.length === 0 && (
              <div className="text-gray-500 text-sm text-center py-8 flex flex-col items-center gap-2">
                <Trophy size={24} className="opacity-20" />
                <span>All matches have been settled.</span>
              </div>
            )}
            {pendingMatches.map((m) => (
              <SettlementRow key={m.id} match={m} onSettle={onSettleMatch} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
