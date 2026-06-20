# Arcis Protocol — Agent Integration Guide

Three functions. Any framework. One interface.

```
deposit(uint256 amount)  → uint256 shares
withdraw(uint256 shares) → uint256 amount
balance(address agent)   → uint256 value
```

Every example below does the same thing: deposit idle USDC into a yield-bearing vault, check the position, withdraw when needed. The ATI doesn't care what framework your agent runs on.

---

## Quick Start (Raw viem)

The minimal integration. Works with any agent that has a private key.

```typescript
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.AGENT_KEY);
const client = createWalletClient({ chain: base, transport: http(), account });
const read = createPublicClient({ chain: base, transport: http() });

const VAULT = "0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d"; // Base Sepolia
const USDC  = "0x29440A12f15fe6bDf5F624f4eeEB298CCb782f05";

const abi = parseAbi([
  "function deposit(uint256 amount) returns (uint256 shares)",
  "function withdraw(uint256 shares) returns (uint256 amount)",
  "function balance(address agent) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// 1. Approve (once)
await client.writeContract({ address: USDC, abi, functionName: "approve",
  args: [VAULT, 2n ** 256n - 1n] });

// 2. Deposit 1000 USDC
const shares = await client.writeContract({ address: VAULT, abi,
  functionName: "deposit", args: [1000_000000n] });

// 3. Check position
const value = await read.readContract({ address: VAULT, abi,
  functionName: "balance", args: [account.address] });
console.log(`Position: ${Number(value) / 1e6} USDC`);

// 4. Withdraw all
await client.writeContract({ address: VAULT, abi,
  functionName: "withdraw", args: [shares] });
```

---

## Using @arcisprotocol/sdk

Handles approvals, previews, and formatting automatically.

```typescript
import { Arcis, parseUSDC, formatUSDC, BASE_SEPOLIA_CONFIG } from "@arcisprotocol/sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.AGENT_KEY);
const pub = createPublicClient({ chain: baseSepolia, transport: http() });
const wal = createWalletClient({ chain: baseSepolia, transport: http(), account });

const arcis = new Arcis(pub, wal, BASE_SEPOLIA_CONFIG);

// Deposit — approval handled automatically
const { shares } = await arcis.vault.deposit(parseUSDC("1000"));

// Check position
const value = await arcis.vault.balance(account.address);
console.log(formatUSDC(value)); // "$1,000.00"

// Check vault state
const state = await arcis.vault.state();
console.log(`TVL: ${formatUSDC(state.totalAssets)}`);

// Withdraw
await arcis.vault.withdraw(shares);
```

---

## Trust Wallet Agent Kit (TWAK)

TWAK agents execute transactions through Trust Wallet infrastructure. Use **Agent Wallet mode** for autonomous operation.

```typescript
import { TrustWalletAgentKit } from "@anthropic/trust-wallet-agent-kit";

const agent = new TrustWalletAgentKit({
  privateKey: process.env.AGENT_KEY,
  chain: "base",
});

const VAULT = "0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d";
const USDC  = "0x29440A12f15fe6bDf5F624f4eeEB298CCb782f05";

// Approve USDC for vault
await agent.executeTransaction({
  to: USDC,
  data: encodeFunctionData({
    abi: ["function approve(address,uint256)"],
    functionName: "approve",
    args: [VAULT, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"],
  }),
});

// Deposit into Arcis
await agent.executeTransaction({
  to: VAULT,
  data: encodeFunctionData({
    abi: ["function deposit(uint256) returns (uint256)"],
    functionName: "deposit",
    args: ["1000000000"], // 1000 USDC
  }),
});
```

TWAK's WalletConnect mode also works — the agent proposes the `deposit()` transaction and the user approves via Trust Wallet.

---

## Coinbase Agentic Wallets (CDP)

Coinbase Developer Platform agentic wallets on Base have native USDC access.

```typescript
import { CoinbaseAgenticWallet } from "@coinbase/agentkit";

const wallet = await CoinbaseAgenticWallet.create({
  network: "base-sepolia",
});

const VAULT = "0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d";

// Approve + Deposit in one flow
await wallet.invokeContract({
  contractAddress: "0x29440A12f15fe6bDf5F624f4eeEB298CCb782f05",
  method: "approve",
  args: { spender: VAULT, amount: "1000000000" },
});

await wallet.invokeContract({
  contractAddress: VAULT,
  method: "deposit",
  args: { amount: "1000000000" },
});

// Read position
const balance = await wallet.readContract({
  contractAddress: VAULT,
  method: "balance",
  args: { agent: wallet.address },
});
console.log(`Position: ${balance} USDC (raw)`);
```

---

## elizaOS

Add Arcis as a plugin action in your elizaOS agent.

```typescript
// plugins/arcis/deposit.ts
import { Action, IAgentRuntime } from "@ai16z/eliza";
import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { Arcis, parseUSDC, formatUSDC, BASE_SEPOLIA_CONFIG } from "@arcisprotocol/sdk";

export const arcisDeposit: Action = {
  name: "ARCIS_DEPOSIT",
  description: "Deposit idle USDC into Arcis yield vault",

  async handler(runtime: IAgentRuntime, message, state) {
    const amount = extractAmount(message.content); // your parsing logic
    const wallet = getAgentWallet(runtime); // your wallet setup

    const pub = createPublicClient({ chain: baseSepolia, transport: http() });
    const wal = createWalletClient({ chain: baseSepolia, transport: http(), account: wallet });
    const arcis = new Arcis(pub, wal, BASE_SEPOLIA_CONFIG);

    const { shares, txHash } = await arcis.vault.deposit(parseUSDC(amount));
    const value = await arcis.vault.balance(wallet.address);

    return `Deposited ${amount} USDC into Arcis vault.\n` +
           `Received ${shares} raUSDC shares.\n` +
           `Position value: ${formatUSDC(value)}\n` +
           `TX: ${txHash}`;
  },
};
```

---

## LangChain / LangGraph

Use as a tool in your LangChain agent.

```python
# Python agent using web3.py for the contract calls
from langchain.tools import tool
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://sepolia.base.org"))
VAULT = "0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d"

VAULT_ABI = [
    {"name": "deposit", "type": "function", "inputs": [{"name": "amount", "type": "uint256"}],
     "outputs": [{"name": "shares", "type": "uint256"}], "stateMutability": "nonpayable"},
    {"name": "withdraw", "type": "function", "inputs": [{"name": "shares", "type": "uint256"}],
     "outputs": [{"name": "amount", "type": "uint256"}], "stateMutability": "nonpayable"},
    {"name": "balance", "type": "function", "inputs": [{"name": "agent", "type": "address"}],
     "outputs": [{"type": "uint256"}], "stateMutability": "view"},
]

vault = w3.eth.contract(address=VAULT, abi=VAULT_ABI)

@tool
def arcis_deposit(amount_usdc: float) -> str:
    """Deposit USDC into Arcis yield vault. Returns shares received."""
    amount_raw = int(amount_usdc * 1e6)
    tx = vault.functions.deposit(amount_raw).build_transaction({...})
    # sign and send tx
    return f"Deposited {amount_usdc} USDC"

@tool
def arcis_balance(agent_address: str) -> str:
    """Check an agent's position value in the Arcis vault."""
    value = vault.functions.balance(agent_address).call()
    return f"Position: {value / 1e6:.2f} USDC"

@tool
def arcis_withdraw(shares: int) -> str:
    """Withdraw USDC from Arcis vault by redeeming raUSDC shares."""
    tx = vault.functions.withdraw(shares).build_transaction({...})
    return f"Withdrew {shares} shares"
```

---

## CrewAI

```python
from crewai import Agent, Task, Crew
from crewai_tools import tool

@tool("Arcis Deposit")
def arcis_deposit(amount_usdc: float) -> str:
    """Deposit USDC into the Arcis yield vault on Base."""
    # Same web3.py logic as LangChain example above
    return f"Deposited {amount_usdc} USDC into Arcis vault"

treasury_agent = Agent(
    role="Treasury Manager",
    goal="Maximize yield on idle USDC by depositing into Arcis vaults",
    backstory="You manage the treasury for an autonomous agent collective.",
    tools=[arcis_deposit, arcis_balance, arcis_withdraw],
)
```

---

## Contract Addresses

### Base Sepolia (Testnet)
| Contract | Address |
|---|---|
| ArcisVault (raUSDC) | `0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d` |
| AgentCredit | `0x019540E33a0292a9DDE36bD9Ef11774d5A1Ce6FC` |
| ATIRouter | `0x0281e7D37683c585325004F84e0b94170c78d5B4` |
| MockUSDC | `0x29440A12f15fe6bDf5F624f4eeEB298CCb782f05` |
| RPC | `https://sepolia.base.org` |

### Base Mainnet
Coming soon. Join the waitlist at [arcis.money](https://arcis.money).

---

## ATI Interface (Solidity)

```solidity
interface IAgentTreasury {
    function deposit(uint256 amount) external returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 amount);
    function balance(address agent) external view returns (uint256);
}
```

Every vault that implements this interface speaks the same language. Your agent integrates once and works with any ATI-compliant vault.

---

## CLI (Terminal Interface)

For developers testing integrations or monitoring vault state from the terminal:

```bash
git clone https://github.com/Arcis-Protocol/cli.git
cd cli && npm install

# Protocol overview
npx tsx src/index.ts status

# Vault operations
npx tsx src/index.ts vault status                          # TVL, rate, capacity
npx tsx src/index.ts vault balance 0xAgentAddress          # Check position
npx tsx src/index.ts vault deposit 1000 -k $AGENT_KEY      # Deposit USDC
npx tsx src/index.ts vault withdraw -a -k $AGENT_KEY       # Withdraw all

# Credit module
npx tsx src/index.ts credit tiers                          # Reputation tiers
npx tsx src/index.ts credit health 1                       # Check loan health

# Contract info
npx tsx src/index.ts contracts                             # All addresses + ATI spec
```

---

## Machine-Readable Protocol Config

Any agent can discover the protocol by fetching:

```
GET https://arcis.money/protocol.json
```

Returns contract addresses, ABIs, function selectors, network config, and example RPC calls. No authentication required.

---

*ARCIS · Of the Citadel · MMXXVI*
