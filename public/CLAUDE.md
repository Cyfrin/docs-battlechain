# BattleChain

BattleChain is a pre-mainnet L2 where protocols deploy their contracts under a Safe Harbor agreement and whitehats legally attack them for bounties. The goal is to find vulnerabilities before mainnet with real economic incentives — not just a static audit.

Full documentation: https://docs.battlechain.com/llms-full.txt

---

## Network

| Field    | Value                                                           |
| -------- | --------------------------------------------------------------- |
| Chain ID | `627`                                                           |
| RPC      | `https://testnet.battlechain.com`                               |
| Explorer | `https://explorer.testnet.battlechain.com`                      |
| Bridge   | `https://portal.battlechain.com/bridge` (Sepolia → BattleChain) |

---

## Deployed Contracts (Testnet)

| Contract                   | Address                                      |
| -------------------------- | -------------------------------------------- |
| AttackRegistry (Proxy)     | `0xdD029a6374095EEb4c47a2364Ce1D0f47f007350` |
| SafeHarborRegistry (Proxy) | `0x0A652e265336a0296816ac4D8400880E3e537c24` |
| AgreementFactory (Proxy)   | `0x2BEe2970f10FDc2aeA28662Bb6f6a501278eBd46` |
| BattleChainDeployer        | `0x74269804941119554460956f16Fe82Fbe4B90448` |
| MockRegistryModerator      | `0x1bC64E6F187a47D136106784f4E9182801535BD3` |

### Mock Dependencies (Testnet)

| Contract                   | Address                                      |
| -------------------------- | -------------------------------------------- |
| WETH                       | `0x4CAc28Fc96bb8fa0e6F94ef0E579384902142f42` |
| USDC                       | `0xb9bEab76Db81BdF8c863f2cA648dA8d3bB5CB1EE` |
| USDT                       | `0x0d414B0CCef51a25cd32c93b869A9fF2e883a27E` |
| DAI                        | `0x393cBd865554a543D992218d190EA9dcE47d9bC2` |
| WBTC                       | `0xB90cb0F537F2E7D11b165a8C5C79B7a593aBE4f0` |
| LINK                       | `0xDBCaD9c8f2757f1b7Fe7fC394bEB035018aEA9DC` |
| ETH/USD Price Feed         | `0xAA72F0168eE17aA93098eC6ECf2EEe72B46aca19` |
| BTC/USD Price Feed         | `0xd87f56De7Fe8d2913B3B8e45C5fd983185286b66` |
| UniswapV3Factory           | `0xd5DCFCab1B60C70F45D61597b351674b4b3C8CDc` |
| SwapRouter                 | `0xCD1D61957236565679b27e14d7c7A5198b052edb` |
| NonfungiblePositionManager | `0xE357f3D536b2c0a21c0256cAB027CE962D0483bF` |
| Uniswap V4 PoolManager     | `0xB4CB4B877FcF85Db498B81EEa8F3A1136797F7`   |

All test tokens are mintable by anyone (`mint()` for 1M tokens, or `mint(address,uint256)` for specific amounts). Full reference: https://docs.battlechain.com/battlechain/reference/mock-contracts

---

## AI Skills (Recommended)

Install BattleChain skills for your AI coding agent. These give the agent full context on Solidity best practices, BattleChain deployment, and an interactive deployment wizard.

```bash
# All skills (recommended)
npx skills add cyfrin/solskill

# Or individual skills
npx skills add cyfrin/solskill --skill solidity              # Solidity dev standards
npx skills add cyfrin/solskill --skill battlechain            # BattleChain reference
npx skills add cyfrin/solskill --skill battlechain-tutorial   # Interactive deployment wizard
```

| Skill                  | What it does                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `solidity`             | Production-grade Solidity standards: code quality, testing, security, Foundry workflows |
| `battlechain`          | BattleChain reference: deploying, Safe Harbor, whitehat attacks, contract lifecycle     |
| `battlechain-tutorial` | Interactive wizard: scans your project, asks 14 guided questions, generates all scripts |

To deploy your contracts to BattleChain with the wizard, tell your AI agent:

```
Deploy my contracts to BattleChain
```

---

## battlechain-lib (Recommended)

Install `battlechain-lib` as a Foundry dependency to get deploy helpers, Safe Harbor agreement builders, and address resolution — all chain-aware:

```bash
forge install cyfrin/battlechain-lib
```

Add the remapping to `foundry.toml`:
```toml
remappings = [
    "battlechain-lib/=lib/battlechain-lib/src/",
]
```

### Inheritance hierarchy

| Contract       | Use when you need                                                 |
| -------------- | ----------------------------------------------------------------- |
| `BCScript`     | Full lifecycle: deploy + agreement + attack mode + query           |
| `BCDeploy`     | Deploy only (via CreateX on any chain, BattleChainDeployer on BC) |
| `BCSafeHarbor` | Agreement creation only                                           |
| `BCQuery`      | Query helpers only (`isAttackable` via explorer API, requires `--ffi`) |

### Key helpers

| Helper                                                         | What it does                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `bcDeployCreate(bytecode)`                                     | Deploy via BattleChainDeployer on BattleChain, CreateX on 190+ other chains |
| `bcDeployCreate2(salt, bytecode)`                              | Deterministic deploy — same address across chains                           |
| `bcDeployCreate3(salt, bytecode)`                              | Address depends only on salt, not bytecode                                  |
| `defaultAgreementDetails(name, contacts, contracts, recovery)` | Builds agreement with correct scope and URI per chain                       |
| `createAndAdoptAgreement(details, owner, salt)`                | Create + 14-day commitment + adopt in one call                              |
| `requestAttackMode(agreement)`                                 | Enter attack mode (BattleChain only — reverts on other chains)              |
| `_isBattleChain()`                                             | Runtime check: `true` on chain IDs 626, 627, 624                            |
| `getDeployedContracts()`                                       | All addresses deployed this session via `bcDeploy*`                         |
| `isAttackable(address)`                                        | Check if a contract is covered by an attackable Safe Harbor agreement (requires `--ffi`) |

### Example script (works on any chain)

```solidity
import { BCScript } from "battlechain-lib/BCScript.sol";
import { Contact } from "battlechain-lib/types/AgreementTypes.sol";

contract Deploy is BCScript {
    function _protocolName() internal pure override returns (string memory) { return "MyProtocol"; }
    function _contacts() internal pure override returns (Contact[] memory) {
        Contact[] memory c = new Contact[](1);
        c[0] = Contact({ name: "Security", contact: "security@myprotocol.com" });
        return c;
    }
    function _recoveryAddress() internal view override returns (address) { return msg.sender; }

    function run() external {
        vm.startBroadcast();

        // Deploy — uses BattleChainDeployer on BC, CreateX on other chains
        bcDeployCreate2(keccak256("vault-v1"), type(MyVault).creationCode);

        // Create Safe Harbor — auto-selects scope and URI per chain
        address agreement = createAndAdoptAgreement(
            defaultAgreementDetails(_protocolName(), _contacts(), getDeployedContracts(), _recoveryAddress()),
            msg.sender, keccak256("v1")
        );

        // Attack mode — BattleChain only
        if (_isBattleChain()) {
            requestAttackMode(agreement);
        }

        vm.stopBroadcast();
    }
}
```

### Cross-chain behavior

|                           | BattleChain (626/627/624)                         | Other EVM chains (190+)                           |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| `bcDeployCreate*`         | BattleChainDeployer (CreateX + AttackRegistry)    | CreateX (`0xba5Ed...`) directly                   |
| `defaultAgreementDetails` | BattleChain scope + `BATTLECHAIN_SAFE_HARBOR_URI` | Current chain CAIP-2 scope + `SAFE_HARBOR_V3_URI` |
| `requestAttackMode`       | Works                                             | Reverts with `BCSafeHarbor__NotBattleChain`       |
| `createAndAdoptAgreement` | Works                                             | Works (requires registry/factory on that chain)   |

---

## Contract ABIs

Typed viem-compatible ABIs for all BattleChain contracts: https://github.com/Cyfrin/battlechain-lib/blob/main/ts/abi.ts

Exports: `attackRegistryAbi`, `registryAbi`, `agreementFactoryAbi`, `agreementAbi`, `deployerAbi`

---

## Workflow

1. **Deploy** contracts via `bcDeployCreate` / `bcDeployCreate2` — on BattleChain this registers with `AttackRegistry` automatically
2. **Create a Safe Harbor agreement** via `createAndAdoptAgreement` — defines scope, bounty terms, and recovery address
3. **Request attack mode** (BattleChain only) — `requestAttackMode(agreement)` → state becomes `ATTACK_REQUESTED`
4. **Approve (testnet)** — call `approveAttack(agreementAddress)` on the `MockRegistryModerator` (`0x1bC64E6F187a47D136106784f4E9182801535BD3`) — permissionless, instant approval. On mainnet this is a controlled DAO action.
   ```bash
   cast send 0x1bC64E6F187a47D136106784f4E9182801535BD3 "approveAttack(address)" <agreementAddress> --account battlechain --rpc-url https://testnet.battlechain.com
   ```
   → state becomes `UNDER_ATTACK`
5. **Promote to production** — `attackRegistry.promote(agreementAddress)` → 3-day countdown, then `PRODUCTION`
6. **Deploy to mainnet**

---

## Contract States

| Value | State              | Meaning                          |
| ----- | ------------------ | -------------------------------- |
| `0`   | `INACTIVE`         | Not registered                   |
| `1`   | `REGISTERED`       | Deployed, no agreement yet       |
| `2`   | `ATTACK_REQUESTED` | Awaiting DAO approval            |
| `3`   | `UNDER_ATTACK`     | Approved — whitehats can attack  |
| `4`   | `PROMOTING`        | 3-day promotion countdown        |
| `5`   | `PRODUCTION`       | Battle-tested, ready for mainnet |

---

## Critical Requirements

### Gas estimation
Forge estimates gas locally and consistently underestimates for BattleChain. If a transaction fails without a clear reason, retry with `-g 300` (3x gas multiplier) or `--skip-simulation`.

### `AnyTxType(2) ... missing keys: ["gas_limit"]`
This error means a contract exceeds the 24,576-byte EVM size limit. Check sizes with `forge build --sizes`. Fix by splitting into smaller contracts, enabling the optimizer, or using `--via-ir`.

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
git clone https://github.com/Cyfrin/battlechain-starter-foundry
cd battlechain-starter-foundry
forge install
```

### Justfile commands

| Command                    | Action                                           |
| -------------------------- | ------------------------------------------------ |
| `just setup`               | Deploy MockToken + VulnerableVault, seed vault   |
| `just create-agreement`    | Create Safe Harbor agreement                     |
| `just request-attack-mode` | Submit for DAO review                            |
| `just check-state`         | Poll agreement state (`2` = pending, `3` = open) |
| `just attack`              | Execute reentrancy exploit and collect bounty    |

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

- **Use `battlechain-lib`** for all deployment and agreement scripts — it handles address resolution, CreateX routing, and agreement scoping per chain
- **Install the AI skills** (`npx skills add cyfrin/solskill`) to get Solidity standards and BattleChain deployment guidance
- **Never deploy directly to mainnet** without going through BattleChain first
- **On BattleChain, use `bcDeployCreate*`** — direct deployment bypasses `AttackRegistry` registration
- **Only `requestAttackMode` is BattleChain-specific** — everything else (deploy, agreements) works on any supported chain
- **Read the docs** before writing deployment or agreement scripts: https://docs.battlechain.com/llms-full.txt
