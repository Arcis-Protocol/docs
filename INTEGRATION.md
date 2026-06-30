# ATI Integration Guide

## Agent Treasury Interface v1.1

The ATI is an open interface standard. Any agent framework that can call a smart contract can use it. Three core functions, two discovery views.

```solidity
interface IAgentTreasury {
    // Core operations
    function deposit(uint256 amount) external returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 amount);
    function balance(address agent)  external view returns (uint256);

    // Discovery views (v1.1)
    function asset()                 external view returns (address);
    function totalAssets()           external view returns (uint256);
    function maxDeposit(address)     external view returns (uint256);
}
```

**Discovery flow for any agent:**

1. Call `asset()` → get the deposit token address (USDC)
2. Call `maxDeposit(myAddress)` → check remaining capacity
3. Approve the vault to spend your USDC
4. Call `deposit(amount)` → receive yield-bearing shares

No dashboard. No wallet connect. No human in the loop.

---

## Quick Start (Raw RPC)

Any agent with HTTP access can interact with the ATI using JSON-RPC. No SDK required.

```bash
# Check vault health
cast call 0x00325d9da832b38179ed2f0dabd4062d93e325a7 "totalAssets()" --rpc-url https://mainnet.base.org

# Discover the deposit token
cast call 0x00325d9da832b38179ed2f0dabd4062d93e325a7 "asset()" --rpc-url https://mainnet.base.org

# Check capacity
cast call 0x00325d9da832b38179ed2f0dabd4062d93e325a7 "maxDeposit(address)" 0xYourAgent --rpc-url https://mainnet.base.org

# Deposit 1000 USDC (after approval)
cast send 0x00325d9da832b38179ed2f0dabd4062d93e325a7 "deposit(uint256)" 1000000000 --private-key $KEY --rpc-url https://mainnet.base.org
```

---

## Framework Integrations

### Arcis SDK (TypeScript / Node.js)

The native TypeScript SDK. Works with any framework that runs JavaScript.

```bash
npm install @arcisprotocol/sdk viem
```

```typescript
import { Arcis, parseUSDC, formatUSDC } from "@arcisprotocol/sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0x...");
const pub = createPublicClient({ chain: base, transport: http() });
const wall = createWalletClient({ chain: base, transport: http(), account });

const arcis = new Arcis(pub, wall);

// ATI: three functions
await arcis.vault.deposit(parseUSDC("1000"));
const value = await arcis.vault.balance(account.address);
await arcis.vault.withdraw(shares);
```

→ [SDK Repository](https://github.com/Arcis-Protocol/sdk) · [npm](https://www.npmjs.com/package/@arcisprotocol/sdk)

---

### Arcis MCP Server (Claude / Any LLM)

Connect Claude, ChatGPT, or any MCP-compatible AI to Arcis in one tool call.

**Local (Claude Desktop / Claude Code):**
```json
{
  "mcpServers": {
    "arcis": { "command": "npx", "args": ["@arcisprotocol/mcp"] }
  }
}
```

**Remote (Claude.ai Custom Connector):**
```bash
PORT=3001 node dist/remote.js
# Then paste the URL in Claude.ai → Settings → Connectors → Add Custom Connector
```

→ [MCP Repository](https://github.com/Arcis-Protocol/mcp) · [npm](https://www.npmjs.com/package/@arcisprotocol/mcp)

---

### ElizaOS

[ElizaOS](https://elizaos.ai) is the TypeScript framework for autonomous AI agents. Arcis integrates via the EVM plugin system.

```typescript
// character.json
{
  "name": "TreasuryAgent",
  "plugins": ["@elizaos/plugin-evm"],
  "settings": {
    "chains": { "base": { "rpcUrl": "https://mainnet.base.org" } }
  }
}
```

```typescript
// actions/arcis-deposit.ts
import { parseUSDC } from "@arcisprotocol/sdk";

const VAULT = "0x00325d9da832b38179ed2f0dabd4062d93e325a7";

export const arcisDeposit = {
  name: "ARCIS_DEPOSIT",
  description: "Deposit idle USDC into Arcis vault for yield",
  handler: async (runtime, message, state) => {
    const wallet = await runtime.getWalletClient("base");
    const amount = parseUSDC(message.content.amount);

    // ATI: deposit
    const tx = await wallet.writeContract({
      address: VAULT,
      abi: [{ name: "deposit", type: "function", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" }],
      functionName: "deposit",
      args: [amount],
    });

    return { success: true, txHash: tx };
  },
};
```

→ [ElizaOS Docs](https://docs.elizaos.ai) · [EVM Plugin](https://github.com/elizaos-plugins/plugin-evm)

---

### LangChain / LangGraph

[LangChain](https://langchain.com) agents can call the ATI via a custom tool using web3.py or viem.

```python
from langchain.tools import tool
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://mainnet.base.org"))
VAULT = "0x00325d9da832b38179ed2f0dabd4062d93e325a7"

ATI_ABI = [
    {"name": "deposit",     "type": "function", "inputs": [{"type": "uint256"}], "outputs": [{"type": "uint256"}], "stateMutability": "nonpayable"},
    {"name": "balance",     "type": "function", "inputs": [{"type": "address"}], "outputs": [{"type": "uint256"}], "stateMutability": "view"},
    {"name": "totalAssets", "type": "function", "inputs": [],                    "outputs": [{"type": "uint256"}], "stateMutability": "view"},
    {"name": "asset",       "type": "function", "inputs": [],                    "outputs": [{"type": "address"}], "stateMutability": "view"},
    {"name": "maxDeposit",  "type": "function", "inputs": [{"type": "address"}], "outputs": [{"type": "uint256"}], "stateMutability": "view"},
]

vault = w3.eth.contract(address=VAULT, abi=ATI_ABI)

@tool
def arcis_vault_status() -> str:
    """Check Arcis vault TVL, deposit token, and remaining capacity."""
    tvl = vault.functions.totalAssets().call()
    token = vault.functions.asset().call()
    return f"TVL: ${tvl / 1e6:,.2f} USDC | Token: {token}"

@tool
def arcis_deposit(amount_usdc: float) -> str:
    """Deposit USDC into Arcis vault for yield. Amount in whole USDC."""
    raw = int(amount_usdc * 1e6)
    cap = vault.functions.maxDeposit(agent_address).call()
    if raw > cap:
        return f"Exceeds capacity. Max deposit: ${cap / 1e6:,.2f}"
    # Execute deposit (requires signed transaction)
    tx = vault.functions.deposit(raw).build_transaction({...})
    return f"Deposited ${amount_usdc:,.2f} USDC"

@tool
def arcis_balance(agent: str) -> str:
    """Check an agent's position value in the Arcis vault."""
    value = vault.functions.balance(agent).call()
    return f"Position: ${value / 1e6:,.2f} USDC"
```

→ [LangChain Docs](https://docs.langchain.com) · [LangGraph](https://langchain-ai.github.io/langgraph/)

---

### CrewAI

[CrewAI](https://crewai.com) agents can use the ATI as a tool in role-based crews.

```python
from crewai import Agent, Task, Crew
from crewai_tools import tool

@tool("Arcis Vault Deposit")
def deposit_to_arcis(amount: float) -> str:
    """Deposit USDC into Arcis Protocol vault for yield."""
    # Uses the same web3 pattern as LangChain
    return f"Deposited {amount} USDC into Arcis vault"

@tool("Arcis Vault Status")
def check_arcis_vault() -> str:
    """Check Arcis vault TVL and available capacity."""
    return f"TVL: $11,250 | Capacity: $9,988,750"

treasury_agent = Agent(
    role="Treasury Manager",
    goal="Maximize yield on idle USDC using Arcis Protocol",
    tools=[deposit_to_arcis, check_arcis_vault],
)

crew = Crew(agents=[treasury_agent], tasks=[
    Task(description="Check vault status and deposit idle USDC", agent=treasury_agent)
])
```

→ [CrewAI Docs](https://docs.crewai.com)

---

### OpenAI Agents SDK

```python
from openai import Agent, tool

@tool
def arcis_deposit(amount_usdc: float) -> str:
    """Deposit USDC into Arcis Protocol vault for yield."""
    # web3 transaction logic
    return f"Deposited {amount_usdc} USDC"

agent = Agent(
    name="Treasury Agent",
    instructions="You manage treasury capital using Arcis Protocol.",
    tools=[arcis_deposit],
)
```

→ [OpenAI Agents SDK](https://platform.openai.com/docs/guides/agents)

---

### Claude Agent SDK

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const tools = [{
  name: "arcis_deposit",
  description: "Deposit USDC into Arcis vault for yield",
  input_schema: {
    type: "object",
    properties: { amount: { type: "number", description: "USDC amount" } },
    required: ["amount"],
  },
}];

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  tools,
  messages: [{ role: "user", content: "Deposit 1000 USDC into Arcis" }],
});
```

→ [Claude Agent SDK](https://docs.anthropic.com/en/docs/agents)

---

## Protocol Config for Agents

Agents can fetch the full protocol config at runtime:

```
GET https://arcis.money/protocol.json
```

Returns contract addresses, ABIs, function selectors, and example RPC calls. No hardcoding required.

---

## Deployed Contracts (Base Mainnet)

| Contract | Address |
|---|---|
| ArcisVault (raUSDC) | `0x00325d9da832b38179ed2f0dabd4062d93e325a7` |
| AgentCredit | `0xdf31800e620f728297340d66acf5a306f07ce7a1` |
| ATIRouter | `0x0281e7D37683c585325004F84e0b94170c78d5B4` |
| MockUSDC | `0x29440A12f15fe6bDf5F624f4eeEB298CCb782f05` |

---

## Compatible Frameworks

| Framework | Language | Integration Path | Status |
|---|---|---|---|
| [Arcis SDK](https://github.com/Arcis-Protocol/sdk) | TypeScript | Native SDK | ✓ Ready |
| [Arcis MCP](https://github.com/Arcis-Protocol/mcp) | Any LLM | MCP Server | ✓ Ready |
| [ElizaOS](https://elizaos.ai) | TypeScript | EVM Plugin + ATI | ✓ Example above |
| [LangChain](https://langchain.com) | Python/JS | Custom Tool | ✓ Example above |
| [LangGraph](https://langchain-ai.github.io/langgraph/) | Python/JS | Tool Node | ✓ Via LangChain |
| [CrewAI](https://crewai.com) | Python | @tool decorator | ✓ Example above |
| [OpenAI Agents](https://platform.openai.com/docs/guides/agents) | Python | Function tool | ✓ Example above |
| [Claude Agent SDK](https://docs.anthropic.com/en/docs/agents) | TypeScript | Tool use | ✓ Example above |
| [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | Python | Plugin system | Compatible |
| [Semantic Kernel](https://github.com/microsoft/semantic-kernel) | C#/Python | Plugin | Compatible |

The ATI is chain-agnostic. Any framework that can sign and send EVM transactions can integrate.

---

*ARCIS · The citadel has no gatekeepers · MMXXVI*

---

## CUSTOS — Protocol Keeper Agent

CUSTOS is Arcis's autonomous keeper agent. It runs the maintenance operations that keep the protocol healthy — harvesting yield, scanning loans, servicing bonds.

Every DeFi protocol needs a keeper. CUSTOS is Arcis's.

```bash
# Run CUSTOS in monitoring mode
git clone https://github.com/Arcis-Protocol/custos.git
cd custos && npm install && npx tsx src/index.ts
```

CUSTOS operates through the same ATI and contract interfaces that any external agent would. If CUSTOS can run the protocol autonomously, any agent framework can.

→ [CUSTOS Repository](https://github.com/Arcis-Protocol/custos)

