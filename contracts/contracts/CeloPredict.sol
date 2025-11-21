// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CeloPredict
 * @dev Soccer score prediction market on Celo blockchain
 */
contract CeloPredict is ReentrancyGuard, Ownable {
    
    // Structs
    struct Match {
        uint256 id;
        string homeTeam;
        string awayTeam;
        uint256 kickoffTime;
        uint256 prizePool;
        bool resultsSubmitted;
        uint8 finalHomeScore;
        uint8 finalAwayScore;
        bool prizesDistributed;
    }
    
    struct Prediction {
        address predictor;
        uint8 homeScore;
        uint8 awayScore;
        uint256 amount;
        uint256 timestamp;
    }
    
    // State variables
    uint256 public matchCounter;
    uint256 public entryFee = 0.5 ether; // 0.5 cUSD
    uint256 public platformFeePercent = 5; // 5% platform fee
    
    mapping(uint256 => Match) public matches;
    mapping(uint256 => Prediction[]) public matchPredictions;
    mapping(uint256 => mapping(address => bool)) public hasPredicted;
    mapping(address => uint256) public userWinnings;
    
    // Events
    event MatchCreated(uint256 indexed matchId, string homeTeam, string awayTeam, uint256 kickoffTime);
    event PredictionPlaced(uint256 indexed matchId, address indexed predictor, uint8 homeScore, uint8 awayScore, uint256 amount);
    event ResultsSubmitted(uint256 indexed matchId, uint8 homeScore, uint8 awayScore);
    event PrizesDistributed(uint256 indexed matchId, uint256 totalWinners, uint256 prizePerWinner);
    event WinningsClaimed(address indexed user, uint256 amount);
    
    constructor() Ownable(msg.sender) {
        matchCounter = 0;
    }
    
    /**
     * @dev Create a new match for predictions
     */
    function createMatch(
        string memory _homeTeam,
        string memory _awayTeam,
        uint256 _kickoffTime
    ) external onlyOwner {
        require(_kickoffTime > block.timestamp, "Kickoff must be in future");
        
        matchCounter++;
        matches[matchCounter] = Match({
            id: matchCounter,
            homeTeam: _homeTeam,
            awayTeam: _awayTeam,
            kickoffTime: _kickoffTime,
            prizePool: 0,
            resultsSubmitted: false,
            finalHomeScore: 0,
            finalAwayScore: 0,
            prizesDistributed: false
        });
        
        emit MatchCreated(matchCounter, _homeTeam, _awayTeam, _kickoffTime);
    }
    
    /**
     * @dev Place a prediction for a match
     */
    function predictMatch(
        uint256 _matchId,
        uint8 _homeScore,
        uint8 _awayScore
    ) external payable nonReentrant {
        Match storage matchData = matches[_matchId];
        
        require(matchData.id != 0, "Match does not exist");
        require(block.timestamp < matchData.kickoffTime, "Predictions closed");
        require(!hasPredicted[_matchId][msg.sender], "Already predicted");
        require(msg.value == entryFee, "Incorrect entry fee");
        require(_homeScore <= 20 && _awayScore <= 20, "Invalid scores");
        
        // Add to prize pool
        matchData.prizePool += msg.value;
        
        // Record prediction
        matchPredictions[_matchId].push(Prediction({
            predictor: msg.sender,
            homeScore: _homeScore,
            awayScore: _awayScore,
            amount: msg.value,
            timestamp: block.timestamp
        }));
        
        hasPredicted[_matchId][msg.sender] = true;
        
        emit PredictionPlaced(_matchId, msg.sender, _homeScore, _awayScore, msg.value);
    }
    
    /**
     * @dev Submit final match results (owner only)
     */
    function submitResult(
        uint256 _matchId,
        uint8 _homeScore,
        uint8 _awayScore
    ) external onlyOwner {
        Match storage matchData = matches[_matchId];
        
        require(matchData.id != 0, "Match does not exist");
        require(block.timestamp >= matchData.kickoffTime, "Match not started");
        require(!matchData.resultsSubmitted, "Results already submitted");
        
        matchData.finalHomeScore = _homeScore;
        matchData.finalAwayScore = _awayScore;
        matchData.resultsSubmitted = true;
        
        emit ResultsSubmitted(_matchId, _homeScore, _awayScore);
        
        // Automatically distribute prizes
        _distributePrizes(_matchId);
    }
    
    /**
     * @dev Internal function to distribute prizes to winners
     */
    function _distributePrizes(uint256 _matchId) internal {
        Match storage matchData = matches[_matchId];
        
        require(matchData.resultsSubmitted, "Results not submitted");
        require(!matchData.prizesDistributed, "Prizes already distributed");
        
        Prediction[] memory predictions = matchPredictions[_matchId];
        
        // Find all winners
        address[] memory winners = new address[](predictions.length);
        uint256 winnerCount = 0;
        
        for (uint256 i = 0; i < predictions.length; i++) {
            if (predictions[i].homeScore == matchData.finalHomeScore &&
                predictions[i].awayScore == matchData.finalAwayScore) {
                winners[winnerCount] = predictions[i].predictor;
                winnerCount++;
            }
        }
        
        if (winnerCount > 0) {
            // Calculate platform fee
            uint256 platformFee = (matchData.prizePool * platformFeePercent) / 100;
            uint256 totalPrize = matchData.prizePool - platformFee;
            uint256 prizePerWinner = totalPrize / winnerCount;
            
            // Distribute to winners
            for (uint256 i = 0; i < winnerCount; i++) {
                userWinnings[winners[i]] += prizePerWinner;
            }
            
            emit PrizesDistributed(_matchId, winnerCount, prizePerWinner);
        }
        
        matchData.prizesDistributed = true;
    }
    
    /**
     * @dev Claim accumulated winnings
     */
    function claimWinnings() external nonReentrant {
        uint256 amount = userWinnings[msg.sender];
        require(amount > 0, "No winnings to claim");
        
        userWinnings[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit WinningsClaimed(msg.sender, amount);
    }
    
    /**
     * @dev Get all predictions for a match
     */
    function getMatchPredictions(uint256 _matchId) 
        external 
        view 
        returns (Prediction[] memory) 
    {
        return matchPredictions[_matchId];
    }
    
    /**
     * @dev Get match details
     */
    function getMatch(uint256 _matchId) 
        external 
        view 
        returns (Match memory) 
    {
        return matches[_matchId];
    }
    
    /**
     * @dev Get prize pool for a match
     */
    function getPrizePool(uint256 _matchId) 
        external 
        view 
        returns (uint256) 
    {
        return matches[_matchId].prizePool;
    }
    
    /**
     * @dev Get user's predictions across all matches
     */
    function getUserPredictions(address _user) 
        external 
        view 
        returns (uint256[] memory matchIds, Prediction[] memory predictions) 
    {
        uint256 totalMatches = matchCounter;
        uint256 predictionCount = 0;
        
        // Count predictions
        for (uint256 i = 1; i <= totalMatches; i++) {
            if (hasPredicted[i][_user]) {
                predictionCount++;
            }
        }
        
        // Populate arrays
        matchIds = new uint256[](predictionCount);
        predictions = new Prediction[](predictionCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalMatches; i++) {
            if (hasPredicted[i][_user]) {
                matchIds[index] = i;
                
                // Find the prediction
                Prediction[] memory matchPreds = matchPredictions[i];
                for (uint256 j = 0; j < matchPreds.length; j++) {
                    if (matchPreds[j].predictor == _user) {
                        predictions[index] = matchPreds[j];
                        break;
                    }
                }
                index++;
            }
        }
        
        return (matchIds, predictions);
    }
    
    /**
     * @dev Update entry fee (owner only)
     */
    function setEntryFee(uint256 _newFee) external onlyOwner {
        entryFee = _newFee;
    }
    
    /**
     * @dev Update platform fee percentage (owner only)
     */
    function setPlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 10, "Fee too high");
        platformFeePercent = _newFeePercent;
    }
    
    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Get all active matches
     */
    function getActiveMatches() external view returns (Match[] memory) {
        uint256 activeCount = 0;
        
        // Count active matches
        for (uint256 i = 1; i <= matchCounter; i++) {
            if (!matches[i].resultsSubmitted) {
                activeCount++;
            }
        }
        
        // Populate array
        Match[] memory activeMatches = new Match[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= matchCounter; i++) {
            if (!matches[i].resultsSubmitted) {
                activeMatches[index] = matches[i];
                index++;
            }
        }
        
        return activeMatches;
    }
}
