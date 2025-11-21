# CeloPredict Smart Contract Setup

## Quick Start

### 1. Install Dependencies
\`\`\`bash
cd contracts
npm install
\`\`\`

### 2. Configure Environment
\`\`\`bash
cp .env.example .env
# Add your PRIVATE_KEY to .env
\`\`\`

### 3. Compile Contract
\`\`\`bash
npm run compile
\`\`\`

### 4. Deploy to Sepolia Testnet
\`\`\`bash
npm run deploy:sepolia
\`\`\`

**Save the contract address!** You'll need it to configure the frontend.

### 5. Verify Contract (Optional)
After deployment, verify on Celoscan:
\`\`\`bash
npm run verify 0xYOUR_CONTRACT_ADDRESS
\`\`\`

## Contract Functions Reference

### Admin Functions
- `createMatch(homeTeam, awayTeam, kickoffTime)` - Create a new match
- `submitResult(matchId, homeScore, awayScore)` - Submit final score and auto-distribute prizes
- `setEntryFee(newFee)` - Update entry fee
- `setPlatformFee(percent)` - Update platform fee
- `withdrawPlatformFees()` - Withdraw accumulated fees

### User Functions
- `predictMatch(matchId, homeScore, awayScore)` - Place a prediction (payable, costs 0.5 cUSD)
- `claimWinnings()` - Claim accumulated winnings
- `getUserPredictions(address)` - Get user's predictions

### View Functions
- `getMatch(matchId)` - Get match details
- `getActiveMatches()` - Get all active matches
- `getPrizePool(matchId)` - Get current prize pool
- `getMatchPredictions(matchId)` - Get all predictions for a match
- `userWinnings(address)` - Get user's available winnings

## Key Details

- **Entry Fee:** 0.5 cUSD per prediction
- **Platform Fee:** 5% of prize pool
- **Max Score:** 20 goals per team
- **Network:** Celo Alfajores Testnet (44787)

## Gas Optimization

The contract uses:
- ReentrancyGuard for secure fund transfers
- Efficient storage patterns
- Batch processing where possible

## Security

- All predictions locked after match kickoff
- Automatic prize distribution upon result submission
- Access control on admin functions
- Safe fund transfer patterns

## Troubleshooting

**Deployment fails with "insufficient balance":**
- Get testnet cUSD from faucet: https://faucet.celo.org

**Contract address not found on Celoscan:**
- Wait 30 seconds for block confirmation
- Check on different explorer: https://explorer.celo.org

**Prediction fails with "Predictions closed":**
- Match has already started, can only predict before kickoff time
