<p align="center">
  <br />
  <strong>A R C I S &nbsp; P R O T O C O L</strong>
  <br />
  <em>Documentation</em>
  <br />
  <br />
  <a href="https://arcis.money">arcis.money</a>
  &nbsp;·&nbsp;
  <a href="https://arcis.money/dashboard">Dashboard</a>
  &nbsp;·&nbsp;
  <a href="https://arcis.money/protocol.json">Agent Config</a>
  &nbsp;·&nbsp;
  <a href="https://t.me/arcisprotocol">Telegram</a>
</p>

---

Financial infrastructure for autonomous AI agents — yield-bearing vaults, identity-aware credit, and revenue bonds. Deployed on Base.

## Contents

| Document | Description |
|---|---|
| [Positioning](./Arcis_Positioning_Doc.md) | Market analysis, competitive landscape, product thesis |
| [ATI Specification v1.1](./ATI_Specification_v1.1.md) | The Agent Treasury Interface standard — `deposit()`, `withdraw()`, `balance()` |
| [Architecture](./ARCHITECTURE.md) | Contract architecture, deployment order, security model |
| [Deployments](./DEPLOYMENTS.md) | All deployed contract addresses with explorer links |
| [Security](./SECURITY.md) | Slither static analysis report and audit status |
| [Integration Guide](./INTEGRATION.md) | How to connect any agent framework (TWAK, elizaOS, LangChain, CrewAI) |
| [Pitch Deck](./PITCH_DECK.md) | Problem, solution, market, traction, architecture, ask |
| [Brand Kit](./BRAND_KIT.md) | Color system, typography, AI generation prompts for brand assets |
| [Distribution Playbook](./DISTRIBUTION.md) | Every platform, directory, and listing for Arcis |

## Protocol Stack

| Repo | Description | Status |
|---|---|---|
| [`core`](https://github.com/Arcis-Protocol/core) | Smart contracts — Foundry, 24 contracts, 90 tests | ✓ Deployed |
| [`sdk`](https://github.com/Arcis-Protocol/sdk) | TypeScript SDK — `@arcisprotocol/sdk`, vault + credit + bonds | ✓ Complete |
| [`cli`](https://github.com/Arcis-Protocol/cli) | Terminal interface — TUI for vault operations | ✓ Complete |
| [`mcp`](https://github.com/Arcis-Protocol/mcp) | MCP Server — connect any AI agent in one tool call | ✓ Complete |
| [`app`](https://github.com/Arcis-Protocol/app) | Landing page + dashboard — arcis.money | ✓ Live |
| [`docs`](https://github.com/Arcis-Protocol/docs) | Protocol documentation (this repo) | ✓ Current |
| [`monitor`](https://github.com/Arcis-Protocol/monitor) | On-chain monitoring + Telegram alerts | ✓ Complete |

## Quick Start

**For agents** — read [`protocol.json`](https://arcis.money/protocol.json), call `deposit()`.

**For developers** — install the SDK:
```bash
npm install @arcisprotocol/sdk
```

**For terminal** — use the CLI:
```bash
git clone https://github.com/Arcis-Protocol/cli.git
cd cli && npm install
npx tsx src/index.ts vault status
```

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|---|---|
| ArcisVault (raUSDC) | [`0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d`](https://base-sepolia.blockscout.com/address/0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d) |
| AgentCredit | [`0x019540E33a0292a9DDE36bD9Ef11774d5A1Ce6FC`](https://base-sepolia.blockscout.com/address/0x019540E33a0292a9DDE36bD9Ef11774d5A1Ce6FC) |
| ATIRouter | [`0x0281e7D37683c585325004F84e0b94170c78d5B4`](https://base-sepolia.blockscout.com/address/0x0281e7D37683c585325004F84e0b94170c78d5B4) |

See [DEPLOYMENTS.md](./DEPLOYMENTS.md) for the full list including all 7 contracts.

---

[Telegram](https://t.me/arcisprotocol) · [X](https://x.com/ArcisProtocol) · [arcis.money](https://arcis.money)

*Arcis Protocol · MMXXVI*
