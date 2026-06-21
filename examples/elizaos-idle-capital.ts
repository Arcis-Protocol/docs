// ═══════════════════════════════════════════════════
//  ElizaOS × Arcis — Idle Capital Management
//
//  This agent checks its USDC balance every 5 minutes.
//  When idle USDC exceeds $100, it deposits into the
//  Arcis vault to earn yield. When the agent needs USDC
//  for a task, it withdraws from the vault first.
// ═══════════════════════════════════════════════════

import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// ── Config ──
const VAULT = "0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d";
const USDC = "0x29440A12f15fe6bDf5F624f4eeEB298CCb782f05";
const IDLE_THRESHOLD = 100_000_000n; // $100 USDC (6 decimals)
const AGENT_KEY = process.env.AGENT_PRIVATE_KEY as `0x${string}`;

// ── ABIs ──
const VAULT_ABI = parseAbi([
  "function deposit(uint256 amount) returns (uint256 shares)",
  "function withdraw(uint256 shares) returns (uint256 amount)",
  "function balance(address agent) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function totalAssets() view returns (uint256)",
]);

const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// ── Clients ──
const client = createPublicClient({ chain: baseSepolia, transport: http() });
const account = privateKeyToAccount(AGENT_KEY);
const wallet = createWalletClient({ chain: baseSepolia, transport: http(), account });

// ── Actions ──

async function checkAndDeposit() {
  const usdcBalance = await client.readContract({
    address: USDC, abi: ERC20_ABI, functionName: "balanceOf", args: [account.address],
  });

  if (usdcBalance > IDLE_THRESHOLD) {
    // Deposit idle USDC into Arcis vault
    const depositAmount = usdcBalance - IDLE_THRESHOLD / 2n; // Keep $50 liquid

    await wallet.writeContract({
      address: USDC, abi: ERC20_ABI, functionName: "approve",
      args: [VAULT, depositAmount], chain: baseSepolia,
    });

    const hash = await wallet.writeContract({
      address: VAULT, abi: VAULT_ABI, functionName: "deposit",
      args: [depositAmount], chain: baseSepolia,
    });

    const usdc = (Number(depositAmount) / 1e6).toFixed(2);
    console.log(`[ARCIS] Deposited $${usdc} idle USDC. TX: ${hash}`);
  }
}

async function withdrawForTask(amountNeeded: bigint) {
  const usdcBalance = await client.readContract({
    address: USDC, abi: ERC20_ABI, functionName: "balanceOf", args: [account.address],
  });

  if (usdcBalance >= amountNeeded) return; // Already have enough

  // Need to withdraw from vault
  const deficit = amountNeeded - usdcBalance;
  const shares = await client.readContract({
    address: VAULT, abi: VAULT_ABI, functionName: "balanceOf", args: [account.address],
  });

  // Withdraw minimum needed (or all shares if not enough)
  const sharesToRedeem = shares; // Simplified — withdraw all, redeposit later
  const hash = await wallet.writeContract({
    address: VAULT, abi: VAULT_ABI, functionName: "withdraw",
    args: [sharesToRedeem], chain: baseSepolia,
  });

  console.log(`[ARCIS] Withdrew from vault for task. TX: ${hash}`);
}

async function getPosition() {
  const [shares, value, usdcBal] = await Promise.all([
    client.readContract({ address: VAULT, abi: VAULT_ABI, functionName: "balanceOf", args: [account.address] }),
    client.readContract({ address: VAULT, abi: VAULT_ABI, functionName: "balance", args: [account.address] }),
    client.readContract({ address: USDC, abi: ERC20_ABI, functionName: "balanceOf", args: [account.address] }),
  ]);

  return {
    vaultShares: Number(shares) / 1e6,
    vaultValue: Number(value) / 1e6,
    walletUSDC: Number(usdcBal) / 1e6,
    totalCapital: (Number(value) + Number(usdcBal)) / 1e6,
  };
}

// ── ElizaOS Integration ──
// Register these as ElizaOS actions:
//
// elizaos.registerAction("check_idle_capital", checkAndDeposit);
// elizaos.registerAction("withdraw_for_task", withdrawForTask);
// elizaos.registerAction("get_position", getPosition);
//
// Set a cron: every 5 minutes → check_idle_capital

export { checkAndDeposit, withdrawForTask, getPosition };
