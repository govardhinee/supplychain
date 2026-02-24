@echo off
echo Starting SupplyChain.io locally...

echo Starting Blockchain Node (Terminal 1)...
start "Terminal 1 - Blockchain Node" cmd /k "cd smart-contracts && npx hardhat node"

echo Waiting for 10 seconds to allow the node to start before deploying the contract...
timeout /t 10 /nobreak >nul

echo Deploying Smart Contract (Terminal 2)...
start "Terminal 2 - Deploy Contract" cmd /k "cd smart-contracts && npx hardhat run scripts/deploy.js --network localhost"

echo Starting Backend Server (Terminal 3)...
start "Terminal 3 - Backend Server" cmd /k "cd server && node index.js"

echo Starting Frontend (Terminal 4)...
start "Terminal 4 - Frontend" cmd /k "cd client && npm run dev"

echo All 4 terminals have been launched!
echo NOTE: Ensure you check Terminal 2 output to update the contract address in client/src/utils/constants.js if needed.
