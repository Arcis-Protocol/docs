# Agent Treasury Interface (ATI) Specification

## Version 0.1.0 | RFC Draft

---

## Abstract

The Agent Treasury Interface (ATI) is an open standard that defines a minimal, universal interface for autonomous AI agents to interact with yield-bearing treasury protocols. ATI standardizes three core operations (deposit, withdraw, balance) so that any agent framework can integrate treasury management through a single, consistent interface regardless of the underlying yield strategy or chain.

---

## Motivation

AI agents operating on-chain hold idle capital between operations. A trading agent may have $50K in USDC sitting dormant between trades. A service agent collects fees that accumulate in its wallet. A content agent earns revenue that sits as raw tokens.

Today, each agent that wants to earn yield on idle capital must integrate directly with individual DeFi protocols. This requires bespoke code for each protocol, each chain, and each strategy. There is no standardized way for an agent to say "park my capital and earn yield" without understanding the specifics of Aave, Morpho, Ondo, or any other protocol.

ATI solves this by abstracting yield-bearing treasury management behind three functions.

---

## Specification

### Solidity Interface (EVM / Base)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAgentTreasuryInterface
/// @notice Minimal interface for agent treasury operations
/// @dev Compliant vaults MUST implement all three functions
/// @dev Vaults accept USDC and return yield-bearing share tokens (raUSDC)

interface IAgentTreasuryInterface {

    /// @notice Deposit USDC into the vault
    /// @param amount The amount of USDC to deposit (6 decimals)
    /// @return shares The number of raUSDC shares minted to the caller
    /// @dev MUST revert if amount is 0
    /// @dev MUST revert if vault deposit cap is reached
    /// @dev Caller MUST have approved the vault to spend `amount` USDC
    /// @dev MUST emit Deposit(agent, amount, shares)
    function deposit(uint256 amount) external returns (uint256 shares);

    /// @notice Withdraw USDC from the vault by redeeming shares
    /// @param shares The number of raUSDC shares to redeem
    /// @return amount The amount of USDC returned (principal + yield)
    /// @dev MUST revert if shares exceeds caller balance
    /// @dev MUST revert if vault has insufficient liquidity
    /// @dev MUST emit Withdraw(agent, shares, amount)
    function withdraw(uint256 shares) external returns (uint256 amount);

    /// @notice Query the current USDC value of an agent's position
    /// @param agent The address of the agent (or any holder)
    /// @return The current value in USDC (6 decimals) including accrued yield
    /// @dev MUST NOT revert for any valid address
    /// @dev MUST return 0 for addresses with no position
    function balance(address agent) external view returns (uint256);

    /// @notice Emitted on deposit
    event Deposit(address indexed agent, uint256 amount, uint256 shares);

    /// @notice Emitted on withdrawal
    event Withdraw(address indexed agent, uint256 shares, uint256 amount);
}
```

### Rust Interface (Solana)

```rust
use anchor_lang::prelude::*;

/// Agent Treasury Interface - Solana Program Interface
/// Minimal three-function interface for agent treasury operations

#[program]
pub mod agent_treasury_interface {
    use super::*;

    /// Deposit USDC into the vault
    /// Returns: number of raUSDC shares minted
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<u64> {
        // amount: USDC lamports (6 decimals)
        // Returns: raUSDC shares minted to agent
        require!(amount > 0, ATIError::ZeroAmount);
        // Implementation handles:
        // 1. Transfer USDC from agent to vault
        // 2. Calculate shares based on current exchange rate
        // 3. Mint raUSDC to agent
        // 4. Emit DepositEvent
        Ok(shares)
    }

    /// Withdraw USDC by redeeming raUSDC shares
    /// Returns: amount of USDC returned (principal + yield)
    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<u64> {
        require!(shares > 0, ATIError::ZeroShares);
        // Implementation handles:
        // 1. Burn raUSDC from agent
        // 2. Calculate USDC amount at current exchange rate
        // 3. Transfer USDC from vault to agent
        // 4. Emit WithdrawEvent
        Ok(amount)
    }

    /// Query current USDC value of agent position
    /// Returns: value in USDC lamports including accrued yield
    pub fn balance(ctx: Context<Balance>, agent: Pubkey) -> Result<u64> {
        // Read agent's raUSDC balance
        // Multiply by current exchange rate
        // Return USDC equivalent
        Ok(value)
    }
}

#[error_code]
pub enum ATIError {
    #[msg("Deposit amount must be greater than zero")]
    ZeroAmount,
    #[msg("Share amount must be greater than zero")]
    ZeroShares,
    #[msg("Insufficient shares")]
    InsufficientShares,
    #[msg("Vault capacity reached")]
    VaultCapReached,
    #[msg("Insufficient vault liquidity")]
    InsufficientLiquidity,
}
```

### TypeScript SDK (Agent Framework Integration)

```typescript
// @arcis/sdk - Agent Treasury Interface SDK
// For elizaOS, LangChain, CrewAI, AutoGPT, and any agent framework

interface ATIConfig {
  chain: 'base' | 'solana';
  vaultAddress: string;
  agentWallet: string | Keypair;
  rpcUrl?: string;
}

interface ATIClient {
  /**
   * Deposit USDC into the Arcis vault
   * @param amount - USDC amount (human-readable, e.g. "1000.00")
   * @returns Transaction hash and shares received
   */
  deposit(amount: string): Promise<{
    txHash: string;
    sharesReceived: string;
    newBalance: string;
  }>;

  /**
   * Withdraw USDC from the Arcis vault
   * @param shares - raUSDC shares to redeem, or "max" for full withdrawal
   * @returns Transaction hash and USDC amount received
   */
  withdraw(shares: string | 'max'): Promise<{
    txHash: string;
    usdcReceived: string;
    yieldEarned: string;
  }>;

  /**
   * Query current position value
   * @returns Current USDC value including accrued yield
   */
  balance(): Promise<{
    shares: string;
    usdcValue: string;
    yieldAccrued: string;
    apy: string;
  }>;
}

// Usage example
import { createATIClient } from '@arcis/sdk';

const treasury = createATIClient({
  chain: 'base',
  vaultAddress: '0x...',
  agentWallet: agentSigner,
});

// Agent parks idle capital
await treasury.deposit('10000.00');

// Agent checks position
const pos = await treasury.balance();
console.log(`Position: $${pos.usdcValue} (yield: $${pos.yieldAccrued})`);

// Agent needs capital for a trade
const { usdcReceived } = await treasury.withdraw('5000');
```

---

## Design Principles

**Minimal surface area.** Three functions. No configuration. No strategy selection. No parameter tuning. The vault handles all allocation decisions internally. Agents should not need to understand DeFi to earn yield.

**No human approval flows.** Every function is callable by a smart contract address without any UI interaction, multisig ceremony, or off-chain approval. If an agent can sign a transaction, it can use ATI.

**Instant settlement.** Deposits and withdrawals settle in the same transaction. No cooldown periods, no withdrawal queues, no lock-ups. Agents operate at machine speed and need instant liquidity.

**Composable output.** raUSDC is an ERC-20 token (SPL token on Solana) that can be used as collateral in lending protocols, transferred between agents, or held in any standard wallet. It is a first-class DeFi primitive.

**Chain-agnostic spec.** The interface is defined abstractly. Implementations exist on Base (Solidity) and Solana (Rust/Anchor). The TypeScript SDK abstracts chain differences so agent code does not need to change when deploying across chains.

---

## Exchange Rate Mechanics

raUSDC uses a share-based accounting model identical to ERC-4626.

```
exchangeRate = totalUSDCInVault / totalRaUSDCSupply
```

On deposit:
```
shares = depositAmount / exchangeRate
```

On withdraw:
```
usdcReturned = shares * exchangeRate
```

As the vault earns yield, `totalUSDCInVault` increases while `totalRaUSDCSupply` stays constant. This means each raUSDC share becomes worth more USDC over time. No rebasing. No claim transactions. Yield accrues automatically.

---

## Vault Strategy (v1)

The initial vault deploys a conservative allocation:

| Strategy | Allocation | Target APY | Risk |
|----------|-----------|-----------|------|
| Tokenized US Treasuries (Ondo USDY) | 40% | 4.5% | Low |
| Aave USDC lending (Base) | 30% | 3-5% | Low |
| Morpho optimized lending | 20% | 4-7% | Low-Med |
| Stable LP reserve (instant liquidity) | 10% | 2-3% | Low |

Rebalancing occurs when allocation drift exceeds 5% from targets or when yield differentials exceed 100bps between strategies.

The vault controller is a permissioned role initially (team multisig) with a governance transition path to Arcis token holder voting.

---

## ERC-8004 Integration (Agent Credit Module)

The Agent Credit module extends ATI with identity-aware lending. It reads an agent's ERC-8004 identity and reputation to adjust collateral requirements.

```solidity
interface IAgentCredit {

    /// @notice Borrow USDC against raUSDC collateral
    /// @param borrowAmount USDC to borrow
    /// @param collateralShares raUSDC shares to lock as collateral
    /// @dev Collateral ratio determined by agent's ERC-8004 reputation score
    /// @dev Higher reputation = lower collateral requirement
    function borrow(
        uint256 borrowAmount,
        uint256 collateralShares
    ) external returns (uint256 loanId);

    /// @notice Repay a loan and unlock collateral
    /// @param loanId The loan to repay
    function repay(uint256 loanId) external;

    /// @notice Get the collateral ratio for an agent based on reputation
    /// @param agent Address with an ERC-8004 identity NFT
    /// @return ratio Collateral ratio in basis points (e.g. 15000 = 150%)
    function getCollateralRatio(address agent) external view returns (uint256 ratio);
}
```

Reputation tiers (initial parameters, governance-adjustable):

| ERC-8004 Score | Collateral Ratio | Effective LTV |
|---------------|-----------------|---------------|
| No identity | 200% | 50% |
| Score 0-30 | 175% | 57% |
| Score 31-60 | 150% | 67% |
| Score 61-90 | 130% | 77% |
| Score 91-100 | 115% | 87% |

---

## Revenue Bond Interface (v1 Draft)

```solidity
interface IAgentRevenueBond {

    /// @notice Issue a revenue bond backed by agent cash flows
    /// @param agent The ERC-8004 verified agent issuing the bond
    /// @param principal Total capital raised
    /// @param couponBps Annual yield in basis points
    /// @param maturityBlocks Bond duration in blocks
    /// @param revenueSource Address of the agent's revenue-generating contract
    function issueBond(
        address agent,
        uint256 principal,
        uint256 couponBps,
        uint256 maturityBlocks,
        address revenueSource
    ) external returns (uint256 bondId);

    /// @notice Purchase bond tokens
    /// @param bondId The bond to purchase
    /// @param amount USDC to invest
    function purchase(uint256 bondId, uint256 amount) external returns (uint256 tokens);

    /// @notice Claim accrued coupon payments
    /// @param bondId The bond to claim from
    function claimCoupon(uint256 bondId) external returns (uint256 payout);
}
```

---

## Security Considerations

**Reentrancy.** All state-changing functions MUST use reentrancy guards. The deposit/withdraw pattern involves external token transfers that create reentrancy vectors.

**Oracle manipulation.** Vault exchange rates are calculated from internal accounting, not external oracles. No flash loan attack surface on the exchange rate itself. Underlying yield sources (Aave, Morpho) have their own oracle security assumptions.

**Vault cap.** v1 launches with a hard deposit cap ($1M initially, governance-adjustable). This limits maximum loss exposure during the early audit period.

**Withdrawal liquidity.** The 10% stable LP reserve ensures immediate withdrawal liquidity for normal operations. Large withdrawals (>50% of vault) may require multi-block settlement if underlying positions need unwinding.

**Agent identity spoofing.** The credit module requires a valid ERC-8004 identity NFT. Reputation scores are read from the on-chain validation registry. Sybil attacks on reputation are mitigated by ERC-8004's validator attestation model and minimum bond requirements.

---

## Roadmap

| Phase | Timeline | Deliverable |
|-------|----------|-------------|
| ATI v0.1 | Now | This spec. Open RFC. |
| Vault MVP | Weeks 1-6 | raUSDC on Base. Aave + USDY strategy. $1M cap. |
| SDK v1 | Weeks 3-8 | TypeScript SDK. elizaOS + Virtuals integration. |
| Credit v1 | Months 4-6 | ERC-8004 identity-aware lending. |
| Solana | Months 6-9 | Native Solana vault deployment. |
| Revenue Bonds | Months 9-12 | First agent revenue bond issuance. |

---

## Contributing

This is an open standard. We want feedback from agent builders, DeFi protocol teams, and anyone building at the intersection of AI and on-chain capital.

GitHub: github.com/arcis-protocol/ati-spec
Twitter: @arcis_protocol
