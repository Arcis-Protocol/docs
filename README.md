# Arcis Protocol — Documentation

Specifications, integration guides, and SDK examples for Arcis Protocol.

## Contents

| Document | Description |
|---|---|
| `ATI.md` | Agent Treasury Interface v1.1 — the standard |
| `INTEGRATION.md` | Integration guide — 10 agent frameworks + CUSTOS |
| `DISTRIBUTION.md` | Distribution playbook — 80+ listing targets |
| `examples/` | Working SDK examples for ElizaOS, LangChain, Claude MCP |

## ATI Standard

```
deposit(uint256 amount)    → uint256 shares
withdraw(uint256 shares)   → uint256 amount
balance(address agent)     → uint256 value
asset()                    → address token
totalAssets()              → uint256 tvl
maxDeposit(address agent)  → uint256 max
```

Three functions. Any agent framework. The citadel has no gatekeepers.

## SDK Examples

| File | Framework | What It Does |
|---|---|---|
| `elizaos-idle-capital.ts` | ElizaOS | Deposits idle USDC above $100 into vault, withdraws for tasks |
| `langchain-monitor.py` | LangChain | 4 Arcis tools — vault status, position, credit, rates |
| `claude-mcp-treasury.ts` | Claude MCP | Natural language treasury management via 9 MCP tools |

## Supported Frameworks

ElizaOS · LangChain · CrewAI · OpenAI Agents · Claude Agent SDK · AutoGPT · Semantic Kernel · GOAT SDK · Native SDK · MCP

## Related Repos

| Repo | Description |
|---|---|
| [`core`](https://github.com/Arcis-Protocol/core) | Smart contracts — 17 contracts, 116 tests |
| [`sdk`](https://github.com/Arcis-Protocol/sdk) | `@arcisprotocol/sdk` |
| [`mcp`](https://github.com/Arcis-Protocol/mcp) | `@arcisprotocol/mcp` |
| [`custos`](https://github.com/Arcis-Protocol/custos) | CUSTOS — autonomous keeper agent |
| [`app`](https://github.com/Arcis-Protocol/app) | arcis.money |

---

*ARCIS · ATI v1.1 · MMXXVI*
