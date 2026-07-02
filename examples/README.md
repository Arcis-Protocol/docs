# Arcis Protocol — Integration Examples

## Universal Idle Capital Manager

**`arcis-x402-idle-capital.ts`** — Framework-agnostic TypeScript module.

Agent earns USDC → idle capital above threshold auto-deposits into Arcis vault (~3.2% APY) → auto-withdraws when agent needs funds for payments.

```ts
import { createIdleCapitalManager } from "./arcis-x402-idle-capital";

const manager = createIdleCapitalManager({
  privateKey: process.env.AGENT_KEY as `0x${string}`,
  depositThreshold: 100,   // Deposit when wallet has >$100
  reserveMinimum: 20,      // Keep $20 for gas + payments
  withdrawTrigger: 5,      // Withdraw when wallet drops below $5
});
```

### Supported Frameworks

| Framework | Integration |
|---|---|
| ElizaOS | Plugin — register as action |
| LangChain | Tool function call |
| CrewAI | Tool function call |
| OpenClaw | Direct import |
| Hermes | Direct import |
| Bankr | Bankr skill (see bankr.bot) |
| Virtuals | Agent wallet integration |
| OpenAI Agents | Function tool |
| Claude Agent SDK | MCP tool |
| AutoGPT | Plugin |
| Any MCP client | Connect to `mcp.arcis.money/mcp` |

### Config Options

| Option | Default | Description |
|---|---|---|
| `depositThreshold` | $100 | Deposit when wallet exceeds this |
| `reserveMinimum` | $20 | Always keep this much in wallet |
| `withdrawTrigger` | $5 | Withdraw when wallet drops below this |
| `withdrawAmount` | $50 | How much to withdraw per trigger |
| `intervalMs` | 60s | Check interval |
| `autoMode` | true | Auto deposit/withdraw on interval |

### Payment Rail Integrations

- **`xpay-idle-capital.ts`** — XPay (x402 facilitator) + Arcis. Agents earn USDC through XPay payments, idle capital auto-compounds in Arcis, auto-withdraws for the next payment. XPay = payment layer, Arcis = treasury layer.

### Other Examples

- **`elizaos-idle-capital.ts`** — ElizaOS-specific plugin
- **`langchain-monitor.py`** — Python LangChain integration
- **`claude-mcp-treasury.ts`** — Claude MCP treasury management

### Contract Addresses (Base Mainnet)

| Contract | Address |
|---|---|
| ArcisVault | `0x00325d9da832b38179ed2f0dabd4062d93e325a7` |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| AgentCredit | `0xdf31800e620f728297340d66acf5a306f07ce7a1` |
| ATIRouter | `0xd0c64f997ca9aa427f8834578bd7f0313f868e83` |

### Links

- [arcis.money](https://arcis.money)
- [Dashboard](https://arcis.money/dashboard)
- [MCP Server](https://mcp.arcis.money/mcp)
- [DeFiLlama](https://defillama.com/protocol/arcis-protocol)
