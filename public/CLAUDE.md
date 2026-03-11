# BattleChain

BattleChain is a pre-mainnet L2 where protocols deploy their contracts under a Safe Harbor agreement and whitehats legally attack them for bounties. The goal is to find vulnerabilities before mainnet with real economic incentives — not just a static audit.

Full documentation: https://docs.battlechain.com/llms-full.txt

---

## Network

| Field | Value |
|-------|-------|
| Chain ID | `627` |
| RPC | `https://testnet.battlechain.com:3051` |
| Explorer | `https://explorer.testnet.battlechain.com` |
| Bridge | `https://portal.battlechain.com/bridge` (Sepolia → BattleChain) |

---

## Deployed Contracts (Testnet)

| Contract | Address |
|----------|---------|
| AttackRegistry (Proxy) | `0x9E62988ccA776ff6613Fa68D34c9AB5431Ce57e1` |
| SafeHarborRegistry (Proxy) | `0xCb2A561395118895e2572A04C2D8AB8eCA8d7E5D` |
| AgreementFactory (Proxy) | `0x0EbBEeB3aBeF51801a53Fdd1fb263Ac0f2E3Ed36` |
| BattleChainDeployer | `0x8f57054CBa2021bEE15631067dd7B7E0B43F17Dc` |
| MockRegistryModerator | `0x6C2DFbdF0714FC8CE065039911758b2821818745` |

---

## Workflow

1. **Deploy** contracts via `BattleChainDeployer` — this registers them with `AttackRegistry` automatically
2. **Create a Safe Harbor agreement** via `AgreementFactory` — defines scope, bounty terms, and recovery address
3. **Extend commitment window** — minimum 30 days (`agreement.extendCommitmentWindow(block.timestamp + 30 days)`)
4. **Adopt Safe Harbor** — `safeHarborRegistry.adoptSafeHarbor(agreementAddress)`
5. **Request attack mode** — `attackRegistry.requestUnderAttack(agreementAddress)` → state becomes `ATTACK_REQUESTED`
6. **Approve (testnet)** — call `approveAttack(agreementAddress)` on the `MockRegistryModerator` (`0x6C2DFbdF0714FC8CE065039911758b2821818745`) — permissionless, instant approval. On mainnet this is a controlled DAO action.
   ```bash
   cast send 0x6C2DFbdF0714FC8CE065039911758b2821818745 "approveAttack(address)" <agreementAddress> --account battlechain --rpc-url https://testnet.battlechain.com:3051 --legacy
   ```
   → state becomes `UNDER_ATTACK`
7. **Promote to production** — `attackRegistry.promote(agreementAddress)` → 3-day countdown, then `PRODUCTION`
8. **Deploy to mainnet**

---

## Contract States

| Value | State | Meaning |
|-------|-------|---------|
| `0` | `INACTIVE` | Not registered |
| `1` | `REGISTERED` | Deployed, no agreement yet |
| `2` | `ATTACK_REQUESTED` | Awaiting DAO approval |
| `3` | `UNDER_ATTACK` | Approved — whitehats can attack |
| `4` | `PROMOTING` | 3-day promotion countdown |
| `5` | `PRODUCTION` | Battle-tested, ready for mainnet |

---

## Critical Requirements

### Always use `--legacy`
BattleChain Testnet does not support EIP-1559. Every `forge script` call must include `--legacy` or the transaction will fail.

```bash
forge script script/Deploy.s.sol --rpc-url https://testnet.battlechain.com:3051 --account battlechain --broadcast --legacy
```

### Gas estimation
Forge estimates gas locally and consistently underestimates for BattleChain. If a transaction fails without a clear reason, retry with `-g 300` (3× gas multiplier) or `--skip-simulation`.

### Private keys
Never write a private key to a file or environment variable. Use Foundry's encrypted keystore:

```bash
# Import once
cast wallet import battlechain --interactive

# Use in scripts
forge script ... --account battlechain
```

The keystore lives at `~/.foundry/keystores/battlechain`. The user will be prompted for their password at signing time.

---

## Starter Repo

```bash
git clone https://github.com/Cyfrin/battlechain-starter
cd battlechain-starter
forge install
```

### Justfile commands

| Command | Action |
|---------|--------|
| `just setup` | Deploy MockToken + VulnerableVault, seed vault |
| `just create-agreement` | Create Safe Harbor agreement |
| `just request-attack-mode` | Submit for DAO review |
| `just check-state` | Poll agreement state (`2` = pending, `3` = open) |
| `just attack` | Execute reentrancy exploit and collect bounty |

### `.env` structure

```bash
SENDER_ADDRESS=0x...          # Your public wallet address — never the private key
TOKEN_ADDRESS=                # Set after: just setup
VAULT_ADDRESS=                # Set after: just setup
AGREEMENT_ADDRESS=            # Set after: just create-agreement
RECOVERY_ADDRESS=             # Set to your wallet address
```

---

## Rules

- **Never deploy directly to mainnet** without going through BattleChain first
- **Always use `BattleChainDeployer`** for deployments — direct deployment bypasses `AttackRegistry` registration
- **Read the docs** before writing deployment or agreement scripts: https://docs.battlechain.com/llms-full.txt
