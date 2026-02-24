# 🚀 Step-by-Step: Deploy & Run SupplyChain.io Locally (CMD)

Use this guide to run the project on **another system** or **locally via Command Prompt (CMD)**.  
Includes **fixes** for common setup errors (e.g. Hardhat `_assert.js`, PowerShell `&&`).

---

## 📋 Prerequisites

| Requirement | Check |
|-------------|--------|
| **Node.js** (v16+) | `node -v` |
| **npm** | `npm -v` |
| **MetaMask** (optional, for blockchain features) | [metamask.io](https://metamask.io) |

---

## Step 1: Get the Project on the New System

**Option A – Clone from Git**
```cmd
git clone <your-repo-url>
cd Supplychain.io-main
```

**Option B – Copy project folder**
- Copy the full `Supplychain.io-main` folder (e.g. to `C:\Projects\Supplychain.io-main`).
- Open **CMD** and go to that folder:
```cmd
cd /d C:\Projects\Supplychain.io-main
```
Use your actual path instead of `C:\Projects\Supplychain.io-main`.

---

## Step 2: Install Dependencies (Phase 1)

Run these in **CMD** (one after the other).  
Use `&&` to chain commands; that works in CMD (and avoids PowerShell issues).

### 2.1 Smart contracts (fixes Hardhat / `_assert.js` errors)

```cmd
cd /d <PROJECT_ROOT>\smart-contracts
```

Replace `<PROJECT_ROOT>` with your project path (e.g. `C:\Projects\Supplychain.io-main`).

**Clean install (recommended – avoids "Cannot find module './_assert.js'"):**
```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
```

If `rmdir` says "directory not found", that’s fine – just run `npm install`.

### 2.2 Server

```cmd
cd /d <PROJECT_ROOT>\server
npm install
```

### 2.3 Client

```cmd
cd /d <PROJECT_ROOT>\client
npm install
```

---

## Step 3: Run the Project (4 CMD Windows)

Open **4 separate CMD windows**. Order matters.

### Terminal 1 – Blockchain node (Hardhat)

```cmd
cd /d <PROJECT_ROOT>\smart-contracts
npx hardhat node
```

- Leave this **running**.
- Wait until you see: `Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/`
- You’ll see **Accounts** and **Private Key** for each – keep Terminal 1 open for MetaMask setup later.

### Terminal 2 – Deploy contract

**Wait ~5–10 seconds** after Terminal 1 shows the JSON-RPC message, then run:

```cmd
cd /d <PROJECT_ROOT>\smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```

- Success looks like: `SupplyChain deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3` (address may differ).

**If the address is different** from what’s in the client:
1. Open `client\src\utils\constants.js`.
2. Set `contractAddress` to the **exact** address from the deploy output.
3. Save the file.

### Terminal 3 – Backend server

```cmd
cd /d <PROJECT_ROOT>\server
node index.js
```

- Success: `Server running on port 5001`

### Terminal 4 – Frontend

```cmd
cd /d <PROJECT_ROOT>\client
npm run dev
```

- Success: `Local: http://localhost:5173/`
- Open **http://localhost:5173/** in your browser.

---

## Step 4: MetaMask (Optional – for create/transfer/track)

1. **Add network**
   - MetaMask → Network dropdown → Add network → Add manually.
   - **Network name:** `Localhost Hardhat`
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency:** `ETH` → Save.

2. **Import test account**
   - In **Terminal 1**, copy the **Account #0** **Private Key**.
   - MetaMask → Account icon → Import Account → paste key.

3. **Demo login**
   - e.g. `manufacturer` / `pass` (see `server\data\db.json` for other users).

---

## 📌 Quick reference – all commands (replace `<PROJECT_ROOT>`)

**Install (run once):**
```cmd
cd /d <PROJECT_ROOT>\smart-contracts
rmdir /s /q node_modules
del package-lock.json
npm install

cd /d <PROJECT_ROOT>\server
npm install

cd /d <PROJECT_ROOT>\client
npm install
```

**Run (4 CMD windows):**
```cmd
:: Terminal 1
cd /d <PROJECT_ROOT>\smart-contracts
npx hardhat node

:: Terminal 2 (after Terminal 1 is ready)
cd /d <PROJECT_ROOT>\smart-contracts
npx hardhat run scripts/deploy.js --network localhost

:: Terminal 3
cd /d <PROJECT_ROOT>\server
node index.js

:: Terminal 4
cd /d <PROJECT_ROOT>\client
npm run dev
```

---

## 🔧 Troubleshooting

### 1. `Cannot find module './_assert.js'` (Hardhat / ethers)

- **Cause:** Corrupted or incompatible `node_modules` in `smart-contracts` (often with `@noble/hashes` / ethers).
- **Fix:** Clean reinstall in `smart-contracts`:
  ```cmd
  cd /d <PROJECT_ROOT>\smart-contracts
  rmdir /s /q node_modules
  del package-lock.json
  npm install
  ```
  Then run `npx hardhat node` again.

### 2. `'&&' is not a valid statement separator` (PowerShell)

- **Cause:** You’re in **PowerShell**, not CMD. The guide uses CMD-style `&&`.
- **Fix:** Use **Command Prompt (cmd.exe)** and run the commands as written, or run each command **one by one** (without `&&`) in PowerShell.

### 3. `cd` doesn’t change drive (e.g. `C:` → `D:`)

- **Cause:** Plain `cd D:\path` doesn’t switch drive in CMD.
- **Fix:** Use `cd /d D:\path` (the `/d` flag switches drive).

### 4. "Nonce too high" in MetaMask

- **Cause:** Hardhat node was restarted; MetaMask still has old nonces.
- **Fix:** MetaMask → Settings → Advanced → **Clear activity tab data**.  
  Then use the network and accounts again.

### 5. Contract not loaded / invalid product / wrong network

- Ensure MetaMask is on **Localhost 8545** (Chain ID **31337**).
- Ensure `client\src\utils\constants.js` → `contractAddress` matches the deploy output **exactly**.
- Redeploy (Terminal 2) if you restarted the Hardhat node (Terminal 1).

### 6. Login or upload fails (e.g. "User not found", fetch error)

- Backend must be running: **Terminal 3** → `node index.js` → `Server running on port 5001`.
- Frontend calls `http://localhost:5001`; ensure nothing else uses port 5001.

### 7. Products gone after restarting PC / closing terminals

- **Expected.** The Hardhat chain runs in memory. Restart Terminals 1–4, deploy again (Terminal 2), and optionally re‑seed data.

### 8. Port 5173, 5001, or 8545 already in use

- Stop the other process using that port, or change:
  - **Frontend:** port in `client\vite.config.js` (dev server).
  - **Backend:** `PORT` in `server\index.js` or `.env` (default 5001).
  - **Hardhat:** port in `smart-contracts\hardhat.config.js` (default 8545).  
  If you change backend or Hardhat ports, update the client and MetaMask config accordingly.

---

## ✅ Checklist before first run

- [ ] Node.js 16+ installed
- [ ] Project folder on machine (clone or copy)
- [ ] Dependencies installed in `smart-contracts`, `server`, `client`
- [ ] **Smart-contracts:** clean reinstall if you ever saw `_assert.js` error
- [ ] **Terminal 1:** `npx hardhat node` running, JSON-RPC message visible
- [ ] **Terminal 2:** Contract deployed; `contractAddress` in `constants.js` updated if needed
- [ ] **Terminal 3:** `node index.js` → server on port 5001
- [ ] **Terminal 4:** `npm run dev` → frontend on http://localhost:5173/
- [ ] (Optional) MetaMask: Localhost 8545 added, test account imported

---

**Summary:** Use **CMD**, not PowerShell, for these commands. Do the **smart-contracts clean install** if you hit Hardhat/ethers errors. Run the **4 processes** in order and keep Terminals 1–4 open while using the app.
