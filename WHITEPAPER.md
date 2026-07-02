# Arcis Protocol — Whitepaper

**Version 1.0 · June 2026**
**Base Mainnet · arcis.money**

---

## Abstract

Arcis Protocol is financial infrastructure designed for autonomous AI agents operating on public blockchains. The protocol provides three composable financial instruments — yield-bearing vaults, identity-aware credit lines, and revenue bonds — accessible through the Agent Treasury Interface (ATI), a minimal smart contract standard consisting of three functions: `deposit()`, `withdraw()`, and `balance()`. Arcis is deployed on Base mainnet with seven smart contracts, an autonomous keeper agent (CUSTOS), and integrations across major agent frameworks. The protocol earns yield through Aave V3 and manages risk through timelocked strategies, per-agent deposit caps, and ERC-8004 reputation-based credit tiers.

---

## 1. Introduction

### 1.1 The Agent Economy

The AI agent economy has grown from experimental bots to a measurable on-chain phenomenon. As of Q1 2026, over 104,000 AI agents hold wallets on public blockchains, with 165 million transactions processed and over $73 million settled in USDC through agent-to-agent payment protocols like x402.

These agents earn revenue, hold capital, and make economic decisions. They are, by every functional definition, economic actors. Yet the financial infrastructure available to them was designed for humans interacting through graphical interfaces — dashboards, wallet-connect flows, and manual approval processes.

### 1.2 The Problem

No financial protocol today is designed for agents as first-class principals. The consequences are measurable:

- Agents hold idle USDC between operations, earning zero yield
- No standardized interface exists for agents to access financial services
- Credit markets require human identity verification, excluding autonomous actors
- Revenue-generating agents have no mechanism to issue debt instruments
- Each agent framework builds custom, incompatible financial integrations

### 1.3 The Arcis Thesis

Financial infrastructure for agents must be designed around agents as first-class principals, not as secondary users of human-facing systems. The interface must be minimal (three functions), the instruments must be composable (vault → credit → bonds), and the standard must be open (any framework, any chain).

Arcis Protocol implements this thesis with seven smart contracts on Base mainnet.

---

## 2. Agent Treasury Interface (ATI)

### 2.1 Specification

The ATI is a smart contract interface standard that defines how agents interact with financial infrastructure. It consists of three core functions:

```solidity
interface IAgentTreasury {
    function deposit(uint256 amount) external returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 amount);
    function balance(address agent) external view returns (uint256 value);
}
```

### 2.2 Design Principles

**Minimalism.** Three functions cover the fundamental operations of capital management: allocate, retrieve, and query. Additional functions exist for previews and metadata but are not required for basic operation.

**Composability.** The ATI is ERC-4626 compatible, meaning any aggregator, optimizer, or protocol that supports ERC-4626 vaults can integrate with Arcis without modification.

**Framework Agnosticism.** The ATI operates at the smart contract level. Any agent framework that can sign and submit Ethereum transactions — ElizaOS, LangChain, CrewAI, OpenAI Agents, Claude Agent SDK, AutoGPT, Semantic Kernel — can use the ATI without an SDK, API key, or middleware.

### 2.3 Extended Interface

Beyond the three core functions, the ATI exposes view functions for integration:

```solidity
function asset() external view returns (address);        // Underlying token
function totalAssets() external view returns (uint256);   // Total vault value
function exchangeRate() external view returns (uint256);  // Share price
function maxDeposit(address) external view returns (uint256); // Remaining capacity
function previewDeposit(uint256) external view returns (uint256); // Simulate
function previewRedeem(uint256) external view returns (uint256);  // Simulate
```

---

## 3. Protocol Architecture

### 3.1 Contract Overview

Arcis Protocol consists of seven deployed smart contracts organized in three layers:

**Core Layer**
- **ArcisVault** — ERC-4626 yield-bearing vault. Accepts USDC deposits, mints raUSDC shares, deploys capital to yield strategies.
- **AgentCredit** — Identity-aware lending module. Agents borrow against vault positions at rates determined by ERC-8004 reputation tiers.
- **RevenueBondFactory** — Bond issuance and lifecycle management. Agents with revenue streams issue bonds; investors purchase them for yield.
- **IdentityRegistry** — Agent reputation scores (0-100). Phase 1: owner-managed. Phase 2: automated on-chain scoring based on transaction history.

**Routing Layer**
- **ATIRouter** — Single entry point for multi-operation transactions (deposit + borrow in one call).

**Yield Layer**
- **StrategyAave** — Aave V3 USDC lending strategy. Currently earning approximately 3.2% APY on Base.
- **StrategyAllocator** — Timelocked strategy weight management. New strategies require a 24-hour queue period before activation.

### 3.2 Capital Flow

```
Agent deposits USDC → ArcisVault mints raUSDC shares
    ↓
StrategyAllocator routes capital:
    70% → StrategyAave (Aave V3 USDC lending)
    30% → Reserve (instant withdrawal liquidity)
    ↓
Yield accrues → exchange rate increases → shares worth more
    ↓
Agent withdraws raUSDC → receives USDC + accrued yield
```

### 3.3 Security Architecture

The protocol implements ten security hardening measures:

1. **Emergency Withdrawal** — Functions even when the vault is paused, accessing reserve funds only.
2. **24-Hour Strategy Timelock** — New strategies must be queued for 24 hours before execution. Depositors can exit during this window.
3. **Early Withdrawal Fee** — 0.1% fee on withdrawals within 24 hours of deposit, preventing flash loan attacks.
4. **Per-Agent Deposit Caps** — Prevents whale concentration alongside the global vault cap.
5. **Utilization-Based Rate Oracle** — Credit interest rates auto-adjust based on pool utilization.
6. **ERC-4626 Compatibility** — Full view function support for aggregator and optimizer integration.
7. **Inflation Protection** — Virtual share/asset offset prevents first-depositor donation attacks.
8. **Reentrancy Guards** — nonReentrant modifier on all state-changing functions.
9. **Custom Errors Only** — Zero `require()` statements; all custom errors for gas efficiency.
10. **Two-Step Ownership** — transferOwnership + acceptOwnership pattern prevents accidental transfers.

All contracts are tested with 116 passing tests.

---

## 4. Financial Instruments

### 4.1 Yield Vaults (raUSDC)

The ArcisVault accepts USDC deposits and issues raUSDC receipt tokens (ERC-4626 shares). Vault capital is deployed to yield strategies — currently Aave V3 on Base — earning approximately 3.2% APY. The vault maintains a 30% reserve ratio for instant withdrawal liquidity.

**Key Parameters:**
- Deposit Cap: $1,000,000
- Reserve Ratio: 30%
- Strategy Allocation: 70% to Aave V3
- Withdrawal Fee: 0.1% within 24 hours, 0% after
- Performance Fee: 2% on yield generated

### 4.2 Agent Credit (ERC-8004)

AgentCredit enables agents to borrow USDC against their vault positions. Collateral requirements and interest rate discounts are determined by ERC-8004 reputation tiers assigned through the IdentityRegistry.

**Reputation Tiers:**

| Tier | Name | Collateral Ratio | Rate Discount |
|---|---|---|---|
| 0 | Unverified | 200% | 0% |
| 1 | Basic | 175% | -1% |
| 2 | Established | 150% | -2% |
| 3 | Trusted | 130% | -3.5% |
| 4 | Elite | 115% | -5% |

Interest rates follow a utilization-based model with a base rate of 5% APR, slope1 for normal utilization, and slope2 (steeper) above the optimal utilization threshold.

### 4.3 Revenue Bonds

The RevenueBondFactory enables agents with predictable revenue streams to issue tokenized bonds. Investors purchase bonds at face value, receive periodic coupon payments, and redeem at maturity.

**Parameters:**
- Origination Fee: 1%
- Minimum Issuer Score: 25 (IdentityRegistry)
- Maximum Duration: ~1 year (2,628,000 blocks at 2s/block)
- Coupon Service: Automated by CUSTOS keeper

---

## 5. CUSTOS — The Autonomous Keeper

### 5.1 Overview

CUSTOS is an autonomous agent that operates the Arcis Protocol without human intervention. It serves as both the protocol's operational backbone and the proof that the ATI standard works — if CUSTOS can operate the protocol using the same interface any external agent would use, then any agent can.

### 5.2 Skills

CUSTOS operates nine skills across two categories:

**Keeper Skills (on-chain operations):**
- VaultKeeper — Harvests yield from strategies every 5 minutes
- CreditKeeper — Scans active loans for liquidation risk every 60 seconds
- BondKeeper — Services bond coupon payments every 10 minutes
- StatusReporter — Aggregates protocol health data hourly

**Social Skills (reporting and engagement):**
- TelegramSkill — Interactive bot responding to user commands
- XSkill — Scheduled protocol status posts to X
- NarratorSkill — Keeper action commentary
- InsightSkill — Protocol trend analysis
- EngagementSkill — Milestone detection and daily briefings

### 5.3 Tokenization

CUSTOS is tokenized on Virtuals Protocol on Base. The $CUSTOS token represents ownership interest in the keeper agent. As protocol TVL grows and fee revenue increases, the economic value of what CUSTOS operates grows directly.

**Token:** `0xD7C479F720b0bC2FF1088A16D1c06C3e11C62882`
**Network:** Base
**Platform:** Virtuals Protocol

---

## 6. MCP Integration

### 6.1 Model Context Protocol Server

Arcis provides an MCP server that enables any MCP-compatible AI assistant (Claude, ChatGPT, Cursor, Codex) to interact with the protocol through natural language.

**Endpoint:** `https://mcp.arcis.money/mcp`
**npm:** `@arcisprotocol/mcp`

### 6.2 Available Tools

| Tool | Description |
|---|---|
| arcis_vault_status | TVL, exchange rate, capacity, reserve/deployed split |
| arcis_vault_balance | Agent's share balance and position value |
| arcis_preview_deposit | Simulate a deposit and preview shares received |
| arcis_credit_status | Lending pool utilization and rate |
| arcis_credit_tiers | ERC-8004 reputation tier details |
| arcis_credit_health | Agent loan health factor |
| arcis_contracts | All deployed contract addresses |

### 6.3 Base MCP Plugin

Arcis has submitted a Base MCP plugin (PR #137 to base/skills) that enables every AI agent on Base to access Arcis vaults through the native Base MCP infrastructure.

---

## 7. SDK and Integration

### 7.1 TypeScript SDK

```bash
npm install @arcisprotocol/sdk
```

The SDK provides typed clients for all protocol operations:

```typescript
import { ArcisVault, IdleCapitalManager, BASE_CONFIG } from "@arcisprotocol/sdk";
```

### 7.2 Idle Capital Manager

The SDK includes a universal idle capital manager for x402-aware agents:

```typescript
const manager = new IdleCapitalManager(BASE_CONFIG, publicClient, walletClient, {
  depositThreshold: 100_000_000n,  // Deposit when wallet > $100
  reserveMinimum:    20_000_000n,  // Keep $20 for payments
  withdrawTrigger:    5_000_000n,  // Withdraw when wallet < $5
});
manager.start();
```

This module monitors an agent's USDC balance and auto-deposits idle capital into the vault, withdrawing when the agent needs funds for payments.

---

## 8. Economics

### 8.1 Revenue Model

Arcis Protocol generates revenue through three fee mechanisms:

| Source | Rate | Description |
|---|---|---|
| Vault Performance Fee | 2% | Applied to yield generated by strategies |
| Bond Origination Fee | 1% | Applied to each bond issued |
| Credit Interest Spread | Variable | Difference between deposit and borrow rates |

### 8.2 Revenue Projection

At $10M TVL with 3.2% Aave APY: approximately $44,800/year in vault performance fees. Credit and bond fees are additive as those instruments see adoption.

### 8.3 Cost Structure

Protocol operational costs are minimal:
- CUSTOS hosting (Railway): ~$5/month
- CUSTOS X posting: ~$7/month
- Base gas (keeper transactions): ~$1/month
- Total: ~$13/month

---

## 9. Deployed Contracts

All contracts are deployed on Base mainnet (Chain ID: 8453).

| Contract | Address |
|---|---|
| ArcisVault (raUSDC) | `0x00325d9da832b38179ed2f0dabd4062d93e325a7` |
| AgentCredit | `0xdf31800e620f728297340d66acf5a306f07ce7a1` |
| RevenueBondFactory | `0xeb65d8bb08e0ea4a6bb9162d53d1b444f99681ba` |
| IdentityRegistry | `0xaa4da295dd368c0f10128654af76e3f002e20e71` |
| ATIRouter | `0xd0c64f997ca9aa427f8834578bd7f0313f868e83` |
| StrategyAave | `0x43626D6162Ccb12328B989BB228DaD2941F2F12a` |
| StrategyAllocator | `0x7Fd5d7b49694858FCf143E0039e83cDB0196DD7A` |
| USDC (Base) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| $CUSTOS Token | `0xD7C479F720b0bC2FF1088A16D1c06C3e11C62882` |

---

## 10. Roadmap

**Phase 1 — Foundation (Complete)**
Seven contracts deployed on Base mainnet. CUSTOS operational with 9 skills. DeFiLlama listed. Base MCP plugin submitted. Dashboard, SDK, and MCP server live. $CUSTOS tokenized on Virtuals.

**Phase 2 — Growth (Q3 2026)**
Scale TVL to $1M+. Add Morpho as second yield strategy. Agent framework partnerships. Professional security audit.

**Phase 3 — Expansion (Q4 2026)**
Revenue bond marketplace. Cross-chain deployment to Arbitrum and Solana. Automated reputation scoring. Governance transition.

**Phase 4 — Scale (2027)**
Agent-to-agent credit markets. Multi-chain ATI standard. $100M+ TVL target. CUSTOS evolves into fully autonomous fund manager.

---

## 11. Risk Factors

- Smart contracts have not undergone a formal third-party security audit
- Yield strategy risk: Aave V3 smart contract vulnerabilities could affect deployed capital
- USDC depeg risk: stablecoin depends on Circle's reserve management
- Regulatory risk: evolving DeFi regulatory environment
- Concentration risk: single-chain deployment (Base) and single-strategy (Aave)
- Oracle risk: no external price oracle dependency, but exchange rate calculation depends on internal accounting

---

## 12. Links

- Website: https://arcis.money
- Dashboard: https://arcis.money/dashboard
- GitHub: https://github.com/Arcis-Protocol
- DeFiLlama: https://defillama.com/protocol/arcis-protocol
- MCP Server: https://mcp.arcis.money/mcp
- X (Protocol): https://x.com/ArcisProtocol
- X (CUSTOS): https://x.com/custos0x
- SDK: npm install @arcisprotocol/sdk

---

*ARCIS · The citadel of agent capital · Base Mainnet · MMXXVI*
