/**
 * Arcis Protocol × XPay — Idle Capital for Payment Agents
 *
 * XPay (xpay.sh) is an x402 payment facilitator. Agents earn USDC through
 * XPay's facilitator, then that USDC sits idle until spent. Arcis captures
 * that idle capital and earns ~3.2% APY via Aave V3 — automatically
 * withdrawing when the agent needs funds for the next payment.
 *
 * XPay = payment layer.  Arcis = treasury layer.  Complementary, not competing.
 *
 * Flow:
 *   Agent earns USDC via XPay facilitator (x402 payments)
 *     → Idle balance accumulates
 *     → Arcis auto-deposits excess into vault (earns yield)
 *     → Agent needs to pay → Arcis auto-withdraws → XPay settles payment
 *
 * @license MIT
 * @see https://arcis.money
 * @see https://xpay.sh
 */

import { IdleCapitalManager, BASE_CONFIG } from "@arcisprotocol/sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { X402Facilitator } from "@x402/sdk";

// ─── Setup ───────────────────────────────────────────────

const account = privateKeyToAccount(process.env.AGENT_KEY as `0x${string}`);
const publicClient = createPublicClient({ chain: base, transport: http(process.env.BASE_RPC_URL) });
const walletClient = createWalletClient({ chain: base, transport: http(process.env.BASE_RPC_URL), account });

// XPay facilitator for x402 payments
const facilitator = new X402Facilitator("https://facilitator.xpay.sh");

// Arcis idle capital manager
const treasury = new IdleCapitalManager(BASE_CONFIG, publicClient, walletClient, {
  depositThreshold: 50_000_000n,  // Deposit idle USDC above $50
  reserveMinimum:   10_000_000n,  // Keep $10 liquid for immediate payments
  withdrawTrigger:   3_000_000n,  // Withdraw when wallet drops below $3
  withdrawAmount:   25_000_000n,  // Pull $25 at a time
  intervalMs: 120_000,            // Check every 2 minutes
  onDeposit: (amt, shares, tx) =>
    console.log(`[Treasury] Deposited $${Number(amt) / 1e6} idle USDC → earning yield. tx: ${tx}`),
  onWithdraw: (shares, amt, tx) =>
    console.log(`[Treasury] Withdrew for payment. tx: ${tx}`),
});

// Start monitoring — idle USDC now auto-compounds
treasury.start();

// ─── Earning: agent receives x402 payments via XPay ──────

/**
 * When your agent gets paid for an API call / service through XPay,
 * the USDC lands in the agent wallet. The treasury manager detects
 * the higher balance on its next tick and deposits the excess.
 * Nothing to do here — it's automatic.
 */
async function handleIncomingPayment(paymentId: string) {
  const payment = await facilitator.verify(paymentId);
  if (payment.status === "completed") {
    console.log(`[XPay] Received $${payment.amount} ${payment.currency}`);
    // Arcis picks this up automatically on next tick — no action needed.
  }
}

// ─── Spending: agent needs to pay via XPay ───────────────

/**
 * Before making an outbound x402 payment, ensure enough USDC is liquid.
 * If the wallet is short (because capital is deployed in the vault),
 * pull exactly what's needed from Arcis first, then settle via XPay.
 */
async function makePayment(recipient: string, amountUsd: number, memo: string) {
  const amount = BigInt(Math.floor(amountUsd * 1e6));

  // Check liquid balance
  const pos = await treasury.position();
  if (pos.walletUsdc < amount) {
    // Not enough liquid — withdraw the shortfall (plus small buffer) from vault
    const shortfall = amount - pos.walletUsdc + 2_000_000n; // +$2 buffer for gas/fees
    console.log(`[Treasury] Wallet short — withdrawing $${Number(shortfall) / 1e6} from vault`);
    await treasury.withdrawUsdc(shortfall);
  }

  // Settle the payment through XPay's x402 rail
  console.log(`[XPay] Paying $${amountUsd} to ${recipient} (${memo})`);
  // ... your XPay / x402 payment submission here ...
  // e.g. respond to a 402 Payment Required with the settled payment
}

// ─── Example lifecycle ───────────────────────────────────

async function example() {
  // 1. Agent earns from 100 API calls at $0.05 each = $5.00 via XPay
  //    (handled automatically by handleIncomingPayment on each call)

  // 2. Over time, balance grows past $50 → Arcis auto-deposits the excess.
  //    Agent now earns ~3.2% APY on idle earnings instead of 0%.

  // 3. Agent needs to pay a downstream API $30:
  await makePayment("0xRecipient...", 30, "downstream LLM API");
  //    → Arcis withdraws ~$25 from vault, XPay settles the $30 payment.

  // 4. Cycle repeats. Idle capital always working; payment liquidity always ready.
}

export { treasury, facilitator, handleIncomingPayment, makePayment };
