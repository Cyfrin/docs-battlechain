# BattleChain Bot Framework — Developer Guide

A complete toolkit for whitehat security researchers participating in BattleChain's safe harbor system. The framework covers the full attack lifecycle: deploying vulnerable test targets, registering a safe harbor agreement, activating attack mode, scanning for in-scope contracts, executing exploits, and distributing recovered funds.

---

## Table of Contents

1. [What Is the Bot Framework?](#1-what-is-the-bot-framework)
2. [Repository Structure](#2-repository-structure)
3. [The Whitehat Lifecycle](#3-the-whitehat-lifecycle)
4. [Writing a Custom Attack](#4-writing-a-custom-attack)
5. [The Three Reference Attacks](#5-the-three-reference-attacks)
6. [The Scanner](#6-the-scanner)
7. [Mempool Inspector (Standalone Tool)](#7-mempool-inspector-standalone-tool)
8. [Deployed Contract Addresses (Testnet)](#8-deployed-contract-addresses-testnet)
9. [Prerequisites & Setup](#9-prerequisites--setup)

---

## 1. What Is the Bot Framework?

The bot framework is an end-to-end toolkit for participating in BattleChain's whitehat safe harbor program. It handles every step from first deployment to final fund distribution.

**What it provides:**

- **Attack contract base class** (`AttackBase.sol`) — handles target validation, balance snapshotting, profit calculation, and fund distribution. Write an exploit by overriding a single function.
- **Three production-ready attack archetypes** — reentrancy drain, missing initializer guard, and oracle price manipulation, each implemented as a minimal subclass.
- **Vulnerable demo targets** — `VulnerableBank`, `VulnerableVault`, and `VulnerableLending` contracts for local and testnet testing.
- **TypeScript scanner bot** — scans the chain for UNDER_ATTACK agreements, fetches function signatures from 4byte.directory, and runs static + dynamic vulnerability detectors.
- **CLI scripts** — deploy, register, activate, attack, scan, watch, and reset with a single `npm run` command.

---

## 2. Repository Structure

```
battlechain-bot-framework/
├── src/
│   ├── AttackBase.sol          ← Extend this to write your own attack
│   ├── attacks/
│   │   ├── AttackBank.sol      ← Reentrancy drain
│   │   ├── AttackVault.sol     ← Missing initializer + tx.origin auth bypass
│   │   └── AttackLending.sol   ← Unprotected price oracle manipulation
│   ├── Oracle.sol              ← Chainlink + Uniswap V3 TWAP pricing
│   ├── FlashLoanProvider.sol   ← Unified flash loan interface (Aave / Balancer)
│   ├── Swapper.sol             ← Uniswap V2/V3 exact-in/out swap helpers
│   ├── TokenHelper.sol         ← Balance snapshots, safe transfers, WETH wrap/unwrap
│   └── test-targets/           ← VulnerableBank, VulnerableVault, VulnerableLending
├── script/
│   ├── DeployAndRegister.s.sol ← Forge broadcast: deploy targets + register agreement
│   └── ExecuteAttacks.s.sol    ← Forge broadcast: deploy + run all three attackers
├── battlechain-files/          ← Core BattleChain protocol contracts (Agreement, Registry)
└── bot/
    ├── src/
    │   ├── scanner/            ← findTargets, fetchDetails, runScan, watchTargets
    │   └── detectors/          ← ReentrancyDetector, AccessControlDetector,
    │                               UnprotectedWithdrawDetector
    └── scripts/                ← CLI commands: deploy, register, activate, attack, reset
```

---

## 3. The Whitehat Lifecycle

### Step 1 — Deploy vulnerable test targets

```bash
npm run testnet:deploy
```

Deploys `VulnerableBank`, `VulnerableVault`, and `VulnerableLending` via `BattleChainDeployer.deployCreate2()`. Each deploy uses a timestamp-derived salt so addresses are unique across runs. The resulting addresses are saved to `bot/scripts/.contract-addresses` for use by subsequent steps.

### Step 2 — Register an agreement

```bash
npm run testnet:register
```

Performs the full agreement registration flow in sequence:

1. Creates an `Agreement` contract via `AgreementFactory.create()`
2. Extends the commitment window (8 days)
3. Calls `AttackRegistry.authorizeAgreementOwner()` for each deployed contract
4. Calls `AttackRegistry.requestUnderAttack()` on the agreement
5. Calls `MockRegistryModerator.approveAttack()` — permissionless on testnet, transitions the agreement directly to `UNDER_ATTACK`

The agreement address is saved to `bot/scripts/.agreement-address`.

### Step 3 — Activate pending agreements (optional)

```bash
npm run testnet:activate
```

Scans `AgreementStateChanged` logs for any agreements still in `ATTACK_REQUESTED` (state 2) and calls `MockRegistryModerator.approveAttack()` on each. Useful if you registered an agreement through a separate path or want to approve agreements that were left pending. Skips if none are found.

### Step 4 — Scan and attack

```bash
npm run testnet:attack
```

Runs `scripts/execute-attacks.ts`, which:

1. Reads target addresses from `bot/scripts/.contract-addresses`
2. Deploys and executes `AttackBank`, `AttackVault`, and `AttackLending` via a `forge script` broadcast
3. Seeds each attacker contract with the minimum ETH required for the exploit
4. Calls `attacker.attack(target)` — the framework validates the target, snapshots balances, runs `_attack()`, and distributes recovered funds to the recovery address registered in the agreement

### Utilities

| Command | Description |
|---|---|
| `npm run testnet:reset` | Mark your agreements as `CORRUPTED` to remove them from scanner results |
| `npm run scan` | One-shot scan: print all UNDER_ATTACK agreements with detected vulnerabilities |
| `npm run watch` | Continuous dashboard: re-scan every 30 seconds |
| `npm run serve` | Start the scanner API (port 3001) and web dashboard UI |

---

## 4. Writing a Custom Attack

### The `AttackBase` interface

All attacks extend `AttackBase`. The base class handles:

- **Validation** — checks `AttackRegistry.isTopLevelContractUnderAttack(target)` and `agreement.isContractInScope(target)` before proceeding
- **Bounty terms** — reads `bountyPercentage` and `retainable` from the agreement
- **Recovery address** — parses the agreement's CAIP-2 chain details to find the asset recovery address for this chain
- **Snapshotting** — records ETH and token balances before the exploit runs
- **Distribution** — after `_attack()` returns, calculates profit deltas and splits funds between the whitehat and the recovery address

### Minimal pattern

Override `_attack(address target)` with your exploit logic. Any ETH or tokens transferred to `address(this)` during `_attack()` are automatically accounted for and distributed.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AttackBase } from "src/AttackBase.sol";

contract MyAttack is AttackBase {
    constructor(address registry) AttackBase(registry) {}

    function _attack(address target) internal override {
        // Your exploit here.
        // ETH and tokens sent to address(this) are tracked and distributed.
        ITarget(target).vulnerableFunction();
    }
}
```

The public entrypoint `attack(address target)` is defined in `AttackBase` and calls your `_attack()` internally:

```solidity
function attack(address target) external virtual returns (uint256 totalProfitValue) {
    _validTarget(target);   // validates + caches bounty terms + recovery address
    _snapshotAll();          // snapshot ETH + attackTokens balances
    _attack(target);         // your exploit
    totalProfitValue = _finalizeAttack(target); // calculate profit, distribute funds
}
```

### Token tracking

If your exploit recovers ERC-20 tokens in addition to ETH, register them before the snapshot:

```solidity
function _attack(address target) internal override {
    _addAttackToken(USDC);   // track USDC profit
    ITarget(target).drain();
}
```

### Alternative flow

For attacks where the exploit and distribution need to interleave (e.g. you need to repay a flash loan mid-attack), override `attack()` directly and call `_distributeAll(target)` when you are ready:

```solidity
function attack(address target) external override returns (uint256) {
    _validTarget(target);
    // ... custom flow ...
    _distributeAll(target);  // distributes current ETH + token balances
    return 0;
}
```

### Flash loans

Extend `FlashLoanProvider` and override `_onFlashLoan()`. The base handles the approval and repayment callback boilerplate.

### Swaps

`Swapper` exposes helpers for Uniswap V2/V3 exact-input and exact-output swaps. Import it alongside `AttackBase` or use it as a mixin.

### Price types

`AttackBase` inherits `Oracle`. By default, `priceType` is `PriceType.AUTO` — tries Chainlink first, falls back to Uniswap V3 TWAP. Override with `_setPriceType()` in your constructor if needed.

---

## 5. The Three Reference Attacks

### AttackBank — Reentrancy

**Vulnerability:** `withdrawMine()` sends ETH to `msg.sender` before zeroing `balances[msg.sender]`. The external call hands control to the attacker's `receive()` before the balance update, enabling repeated withdrawals.

**Exploit flow:**

1. Seed `AttackBank` with `target.balance / 10 + 1` ETH
2. Call `target.deposit{ value: _seed }()` to register a non-zero balance
3. Call `target.withdrawMine()` — the bank sends ETH and triggers `receive()`
4. In `receive()`, re-enter `withdrawMine()` up to `MAX_DEPTH = 100` times, draining `_seed` ETH per re-entry until the bank balance is exhausted

```solidity
receive() external payable override {
    if (_currentTarget != address(0) && _depth < MAX_DEPTH
        && address(_currentTarget).balance >= _seed) {
        _depth++;
        IVulnerableBank(_currentTarget).withdrawMine();
    }
}
```

### AttackVault — Missing Initializer Guard + `tx.origin` Auth

**Vulnerabilities:**
1. `initialize(address _owner)` has no "already initialized" guard — callable by anyone after deployment
2. `sweepFunds()` authenticates via `tx.origin == owner` instead of `msg.sender`

**Exploit flow:**

1. Call `target.initialize(tx.origin)` — sets the EOA running the script as owner (no re-init check)
2. Call `target.sweepFunds(payable(address(this)))` — `tx.origin` matches the newly set owner, funds are transferred

No ETH seeding required.

### AttackLending — Oracle Manipulation

**Vulnerability:** `setPrice(uint256)` has no access control. The lending contract uses this price directly in collateral valuation.

**Exploit flow:**

1. Call `target.setPrice(type(uint256).max)` — sets collateral price to `2²⁵⁶ - 1`
2. Call `target.deposit{ value: 1 }()` — registers 1 wei of collateral; at max price its USD value is astronomically large
3. Call `target.borrow(address(target).balance)` — collateral check passes, full pool is borrowed

The math: `collateralValue = (1 * type(uint256).max) / 1e18 ≈ 1.16 × 10⁵⁹` — vastly exceeds any realistic pool balance.

---

## 6. The Scanner

> **Quick lookup:** The [BattleChain block explorer](https://explorer.testnet.battlechain.com/agreements) lets you browse and filter agreements by state, including UNDER_ATTACK, without running anything locally. Use the scanner when you need vulnerability analysis — bytecode inspection, signature resolution, and detector output — not just agreement discovery.

The scanner locates UNDER_ATTACK agreements, identifies in-scope contracts, and runs three vulnerability detectors against each.

### Finding targets

`findAttackableTargets()` in `bot/src/scanner/findTargets.ts`:

1. Fetches all `AgreementStateChanged` events from block 0 to latest in 500-block chunks (with retry on 502s)
2. Builds a map of `agreement → latest state` (last log wins if multiple state transitions exist)
3. Returns agreements in state `3` (UNDER_ATTACK) or `4` (PROMOTION_REQUESTED)

### Per-contract analysis

`fetchAgreementDetails()` in `bot/src/scanner/fetchDetails.ts` reads the agreement's metadata and in-scope contract list in parallel, then for each contract:

1. Fetches ETH balance and bytecode
2. Resolves function selectors against [4byte.directory](https://www.4byte.directory/) to get human-readable signatures
3. Runs all three detectors in parallel; errors in individual detectors are caught and surfaced as low-confidence results

### Detectors

**ReentrancyDetector** (`detectors/reentrancy.ts`)

- Static: scans bytecode for `CALL` opcode (0xf1, 0xf0, 0xfa) appearing before `SSTORE` (0x55), skipping PUSH data
- Dynamic: simulates calls to functions whose names contain `withdraw`, `claim`, `redeem`, `send`, or `transfer`; flags those that don't revert with a reentrancy-guard error
- HIGH confidence when bytecode pattern matches, dynamic call succeeds, and contract has ETH balance
- MEDIUM confidence when pattern matches but dynamic test is inconclusive

**AccessControlDetector** (`detectors/accessControl.ts`)

- Scans for functions matching admin keywords: `initialize`, `init`, `setup`, `setowner`, `mint`, `pause`, `unpause`, `upgrade`, `sweep`, `admin`, `setprice`, `setfee`, `setmoderator`
- Simulates each candidate call from the bot address
- HIGH confidence when call succeeds (no revert) — the admin function has no access control
- MEDIUM confidence when call reverts but not with an ownership/auth error message

**UnprotectedWithdrawDetector** (`detectors/unprotectedWithdraw.ts`)

- Scans for functions matching: `withdraw`, `drain`, `sweep`, `pull`, `rescue`, `claim`
- Simulates each candidate call
- HIGH confidence when call succeeds and the contract holds ETH
- MEDIUM confidence when call succeeds but no ETH balance, or when revert is not an auth check

---

## 7. Mempool Inspector (Standalone Tool)

`battlechain-mempool/` is a standalone React + Hono app that provides live visibility into the BattleChain mempool and recent block activity. It lives outside the bot framework and has its own `package.json`.

**Start it:**

```bash
cd battlechain-mempool
npm install
npm run dev
```

The API runs on port 3002. The React UI opens via Vite on its default dev port.

**API endpoints:**

| Endpoint | Description |
|---|---|
| `GET /api/mempool` | All currently pending transactions, sorted by time seen. Includes hash, sender, nonce, gas price (wei + Gwei), value, and 4-byte selector. |
| `POST /api/mempool/rescan` | Re-runs the full seed sequence against the node and returns the updated pending set. Useful for surfacing stuck transactions that predate the filter subscription. |
| `GET /api/blocks?count=N` | Last N confirmed blocks (max 20) with full transaction lists and per-block gas stats. |
| `GET /api/gas` | Current gas price and 10-block fee history with p10/p50/p90 priority fee percentiles. |
| `GET /api/tx/:hash` | Fetch a single transaction by hash. If the transaction is still pending, it is injected into the in-memory accumulator so it appears in the mempool view. |
| `GET /api/address/:addr` | Pending nonce vs confirmed nonce for an address. The `stuck` field is `true` when `pendingNonce > latestNonce`, indicating an unconfirmed transaction is blocking the queue. |

**How pending transaction tracking works:**

On startup the server tries to seed the mempool via the best available node method, attempting in order: `txpool_content` → `eth_pendingTransactions` → `parity_pendingTransactions` → `eth_getBlockByNumber("pending")`. It then subscribes via `eth_newPendingTransactionFilter` and polls every 3 seconds for new hashes, fetching full transaction details in batches of 50. If the filter expires or the node restarts, it recreates the filter automatically.

Confirmed transactions are pruned each cycle by comparing against the latest block — but only if the latest block is less than 60 seconds old. If the chain is stalled, pruning is skipped so stuck transactions remain visible rather than disappearing from the view.

**When to use it:**

- Verifying that your attack transaction reached the mempool and has the correct gas price
- Checking whether an address has a stuck nonce blocking subsequent transactions
- Inspecting what other transactions are competing in the same block

---

## 8. Deployed Contract Addresses (Testnet)

```
RPC URL:               https://testnet.battlechain.com:3051
Chain ID:              627
CAIP-2 ID:             eip155:627

AttackRegistry:        0x9E62988ccA776ff6613Fa68D34c9AB5431Ce57e1
AgreementFactory:      0x0EbBEeB3aBeF51801a53Fdd1fb263Ac0f2E3Ed36
SafeHarborRegistry:    0xCb2A561395118895e2572A04C2D8AB8eCA8d7E5D
BattleChainDeployer:   0x8f57054CBa2021bEE15631067dd7B7E0B43F17Dc
MockRegistryModerator: 0x6C2DFbdF0714FC8CE065039911758b2821818745

MockUSDC:              0x33a2F3219E467BCcd7B05477918cf4295D84A1D3
```

`MockRegistryModerator` is permissionless on the testnet — any account can call `approveAttack()` to transition an agreement from `ATTACK_REQUESTED` to `UNDER_ATTACK`. This eliminates the manual moderation step for local development and testing.

---

## 9. Prerequisites & Setup

**Requirements:**

- [Foundry](https://getfoundry.sh/) (`forge`, `cast`)
- Node.js 18+ and npm
- A funded testnet wallet

**Environment:**

Create `bc-hackathon/.env` (one directory above `battlechain-bot-framework/`):

```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

The scripts load this file automatically via a relative path traversal (`../../../.env`).

**Install dependencies:**

```bash
cd battlechain-bot-framework/bot
npm install
```

**Full testnet run:**

```bash
npm run testnet:deploy    # deploy VulnerableBank, VulnerableVault, VulnerableLending
npm run testnet:register  # create agreement, authorize contracts, activate UNDER_ATTACK
npm run testnet:attack    # deploy attackers, execute exploits, distribute funds
```

**Monitor:**

```bash
npm run scan   # one-shot: list all UNDER_ATTACK agreements with vulnerability scores
npm run watch  # continuous: refresh every 30 seconds
npm run serve  # scanner API on :3001 + web dashboard UI
```
