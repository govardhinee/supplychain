# 📘 SupplyChain.io — Complete File & Execution Guide

This guide explains **every file** in the project and the **step‑by‑step execution process** when you run the app.

---

## 🗂️ Project Structure Overview

```
Supplychain.io-main/
├── .agent/workflows/          # Agent workflow docs (e.g. GitHub upload)
├── .github/workflows/         # CI config (GitHub Actions)
├── client/                    # React frontend (Vite)
├── server/                    # Express backend API
├── smart-contracts/           # Solidity + Hardhat
├── .gitignore
├── README.md
└── PROJECT_GUIDE.md           # This file
```

---

## 📁 File-by-File Explanation

### Root Level

| File | Purpose |
|------|---------|
| **README.md** | Setup instructions, 4-terminal run guide, MetaMask config, troubleshooting. |
| **.gitignore** | Excludes `node_modules/`, `.env`, `smart-contracts/artifacts`, `server/uploads/*`, `client/dist/`, etc. |
| **package-lock.json** | Lockfile (root; no root `package.json` in this repo). |

---

### `.github/workflows/ci.yml`

- **What it does**: GitHub Actions CI workflow.
- **Triggers**: On every `push` and `pull_request`.
- **Steps**: Checkout → Node 20 → `npm install` (root) → install deps in `contracts/` and `backend/` → run their tests.
- **Note**: Repo uses `smart-contracts/` and `server/`, not `contracts/` and `backend/`, so this workflow will fail until paths are updated.

---

### `smart-contracts/` (Blockchain Layer)

| File | Purpose |
|------|---------|
| **package.json** | Deps: Hardhat, Hardhat-Ethers, Ethers, dotenv. Scripts: `test` (placeholder). |
| **hardhat.config.js** | Solidity 0.8.28, `localhost` network (127.0.0.1:8545), artifacts output → `../client/src/artifacts`. |
| **contracts/SupplyChain.sol** | Main smart contract. Defines `Product`, `History`, `createProduct`, `transferProduct`, `getProduct`, `getHistory`, events. |
| **scripts/deploy.js** | Deploys `SupplyChain` to the configured network (e.g. localhost). Logs deployed contract address. |

**Execution role**: When you run `npx hardhat node` and then `npx hardhat run scripts/deploy.js --network localhost`, this layer starts the chain and deploys the contract. The frontend uses the ABI from `client/src/artifacts` and the deployed address from `constants.js`.

---

### `server/` (Backend API)

| File | Purpose |
|------|---------|
| **package.json** | Express, CORS, Multer, dotenv, Mongoose (unused; DB is JSON file). |
| **index.js** | Express app. Reads/writes `data/db.json`. Serves `uploads/` statically. **Routes**: `GET /`, `POST /api/register`, `POST /api/login`, `POST /api/upload` (multipart). |
| **data/db.json** | JSON “database”: `users` (id, username, password, role, walletAddress) and `products` (currently unused). Pre-seeded with manufacturer, warehouse, supplier, retailer. |
| **uploads/.gitkeep** | Keeps `uploads/` in git; actual uploads are ignored. |

**Execution role**: Run `node index.js` (or `node server/index.js` from root). Listens on `PORT` (default 5001). Handles login, register, and image upload. Frontend calls `http://localhost:5001` for these APIs.

---

### `client/` (Frontend)

#### Config & entry

| File | Purpose |
|------|---------|
| **package.json** | React 19, React Router DOM, Ethers, Framer Motion, qrcode.react, html5-qrcode. Vite, ESLint, etc. |
| **vite.config.js** | Vite config; uses `@vitejs/plugin-react`. |
| **eslint.config.js** | ESLint rules for the client. |
| **index.html** | Single `div#root`; loads `/src/main.jsx`. |
| **index.css** | Global styles: CSS variables, glass panels, inputs, buttons, scrollbar, animations. |

#### Source (`src/`)

| File | Purpose |
|------|---------|
| **main.jsx** | React root. Renders `BlockchainProvider` → `App` inside `#root`. |
| **App.jsx** | Router setup. Defines `ProtectedRoute` (not yet used). Routes: `/` → Landing, `/login` → Login, `/dashboard` → Dashboard, `/track` → TrackProduct. Renders `Navbar` on all routes. |
| **context/BlockchainContext.jsx** | React context. Holds MetaMask connection (`currentAccount`), contract instance, `currentUser` (from login). Exposes `connectWallet`, `loginUser`, `logoutUser`, etc. |
| **utils/constants.js** | Imports ABI from artifacts, exports `contractAddress` and `contractABI`. **Update `contractAddress`** after each new deploy. |
| **components/Navbar.jsx** | Top bar: logo, Dashboard/Track links, login state, Connect Wallet / address. |
| **pages/Landing.jsx** | Home (“Trust. Verified.”). Buttons: Login → `/login`, Track Product → `/track`. |
| **pages/Login.jsx** | Login form. `POST /api/login` → `loginUser` → redirect to `/dashboard`. Shows demo credentials. |
| **pages/Dashboard.jsx** | For logged-in users. Manufacturer: create product (name, batch, image) → upload image → `createProduct` on-chain, show QR. All roles: “My Inventory” (products owned by connected wallet), transfer form. Flow: Manufacturer→Warehouse→Supplier→Retailer→End User. |
| **pages/TrackProduct.jsx** | Track by Product ID or QR scan. Calls `getProduct` and `getHistory`, shows product info and supply-chain timeline. |

#### Artifacts (generated by Hardhat)

| Path | Purpose |
|------|---------|
| **artifacts/contracts/SupplyChain.sol/SupplyChain.json** | Compiled contract artifact. `constants.js` imports `abi` from here. |
| **artifacts/build-info/*.json** | Build metadata for Hardhat. |

**Execution role**: Run `npm run dev` in `client/`. Dev server (e.g. port 5173) serves the SPA. Users connect MetaMask, login via server, create/transfer products on-chain, and track via ID or QR.

---

## 🔄 End-to-End Execution Process

### Phase 1: Install dependencies

```bash
cd smart-contracts && npm install && cd ..
cd server && npm install && cd ..
cd client && npm install && cd ..
```

No root `package.json`; install only in these three folders.

---

### Phase 2: Run the system (4 terminals)

You run four processes. Order matters.

#### Terminal 1 — Blockchain node

```bash
cd smart-contracts
npx hardhat node
```

- Starts a local Ethereum node at `http://127.0.0.1:8545`.
- Prints pre-funded accounts and private keys (used for MetaMask).
- **Keep this running.**

#### Terminal 2 — Deploy contract

```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```

- Deploys `SupplyChain` to the local node.
- Prints something like: `SupplyChain deployed to: 0x...`
- **Copy this address** and update `client/src/utils/constants.js` → `contractAddress` if it’s different from what’s already there (e.g. first deploy often gives a fixed address).

#### Terminal 3 — Backend server

```bash
cd server
node index.js
```

- Express starts (default port 5001).
- Serves login/register/upload APIs and `uploads/`.
- Expect: `Server running on port 5001` (or your `PORT`).

#### Terminal 4 — Frontend

```bash
cd client
npm run dev
```

- Vite dev server starts (usually `http://localhost:5173`).
- Open that URL in the browser.

---

### Phase 3: MetaMask setup (one-time)

1. Add network: **Localhost Hardhat**  
   - RPC: `http://127.0.0.1:8545`  
   - Chain ID: `31337`  
   - Symbol: ETH  

2. Import **Account #0** (and optionally #1, #2, …) from Terminal 1 (private keys) into MetaMask. These match `db.json` roles (manufacturer, warehouse, etc.).

---

### Phase 4: User flow (execution path)

1. **Landing (`/`)**  
   - User sees “Trust. Verified.” and clicks **Login** or **Track Product**.

2. **Login (`/login`)**  
   - User submits username/password.  
   - Browser → `POST http://localhost:5001/api/login` with `{ username, password }`.  
   - Server reads `db.json`, checks credentials, returns `{ user }` (username, role, walletAddress).  
   - Frontend calls `loginUser(user)`, stores in context + `localStorage`, redirects to `/dashboard`.

3. **Dashboard (`/dashboard`)**  
   - **Connect Wallet**: MetaMask `eth_requestAccounts` → `currentAccount` set, contract initialized via `ethers.Contract(contractAddress, ABI, signer)`.  
   - **Manufacturer only**: Create product form → choose image → **Upload**: `POST /api/upload` (multipart) → server saves under `uploads/`, returns `imageUrl`.  
   - **Create**: `contract.createProduct(name, batchId, imageUrl)` → tx sent → Hardhat node processes it → new product on-chain. UI shows new ID and QR.  
   - **My Inventory**: Frontend calls `contract.productCount()` then `contract.getProduct(i)` for each `i`, filters by `currentOwner === currentAccount`, renders list.  
   - **Transfer**: User picks product, submits transfer form. App derives next role (e.g. Manufacturer→Warehouse), maps role to Hardhat address, calls `contract.transferProduct(id, nextOwner, status)`. Tx confirmed → product moves to next owner.

4. **Track Product (`/track`)**  
   - User enters Product ID or scans QR.  
   - Frontend calls `contract.getProduct(id)` and `contract.getHistory(id)`.  
   - Renders product details and timeline (Manufacturer → Warehouse → Supplier → Retailer → End User).

---

## 🔗 How the Pieces Connect

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (localhost:5173)                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Landing   │  │   Login     │  │  Dashboard / Track      │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────┐               │
│  │  BlockchainContext (MetaMask + Contract)      │               │
│  └───────────────┬───────────────────┬───────────┘               │
└──────────────────┼───────────────────┼───────────────────────────┘
                   │                   │
     HTTP          │                   │  JSON-RPC (ethers)
     :5001         │                   │  :8545
┌──────────────────▼──────┐   ┌────────▼──────────────────────────┐
│  Express (server)       │   │  Hardhat node (smart-contracts)    │
│  /api/login, /upload    │   │  SupplyChain contract              │
│  db.json, uploads/      │   │  createProduct, transferProduct,   │
└─────────────────────────┘   │  getProduct, getHistory            │
                              └────────────────────────────────────┘
```

- **Server**: Auth and image storage; no blockchain logic.  
- **Client**: All chain interaction via Ethers + MetaMask; all auth via server APIs.  
- **Hardhat node**: Persists chain state only while it’s running; restart clears it.

---

## ✅ Quick checklist before running

- [ ] Node.js 16+ installed  
- [ ] MetaMask installed  
- [ ] Dependencies installed in `smart-contracts`, `server`, `client`  
- [ ] Terminal 1: `npx hardhat node` running  
- [ ] Terminal 2: Contract deployed, `contractAddress` in `constants.js` correct  
- [ ] Terminal 3: `node index.js` (server) running  
- [ ] Terminal 4: `npm run dev` (client) running  
- [ ] MetaMask: Localhost 8545 added, demo accounts imported  

---

## 🐛 Common issues

| Issue | Likely cause | Fix |
|-------|----------------|-----|
| “Contract not loaded” / “Invalid product” | Wrong network or wrong address | MetaMask on Localhost 8545; `contractAddress` matches deploy output. |
| “User not found” / “Invalid credentials” | Wrong login | Use demo users from `db.json` (e.g. manufacturer / pass). |
| Upload or login fails | Server not running or CORS | Ensure server on 5001; CORS is enabled in `index.js`. |
| Nonce too high | Restarted node, MetaMask has old nonces | MetaMask → Settings → Advanced → Clear activity tab data. |
| Products gone after restart | Chain state in memory | Restart is expected; redeploy contract and optionally re-seed data. |

---

You now have a map of **every important file** and the **full execution process** from install → run → login → create → transfer → track.
