// ═══════════════════════════════════════════════════
//  Claude × Arcis MCP — Natural Language Treasury
//
//  Configure Arcis MCP in Claude Desktop/Code, then
//  manage vault positions through natural language:
//
//  "What's the vault TVL?"
//  "Check my balance at 0x1234..."
//  "Deposit 500 USDC into the vault"
//  "Withdraw all my shares"
//  "What are the credit tiers?"
//
//  No code required. Claude calls the right MCP tool.
// ═══════════════════════════════════════════════════

// ── Step 1: Configure MCP ──

// Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json
// Claude Code: .mcp.json in your project root

const mcpConfig = {
  mcpServers: {
    arcis: {
      command: "npx",
      args: ["@arcisprotocol/mcp"],
    },
  },
};

// ── Step 2: Or use the remote server ──

// Claude.ai Custom Connector:
// Settings → Connectors → Add → paste your Vercel URL:
//   https://arcis-mcp.vercel.app/api/mcp

// ── Step 3: Talk to Claude ──

// Claude now has 9 Arcis tools available:
//
// READ TOOLS (no auth needed):
//   arcis_vault_status     → TVL, rate, supply, capacity
//   arcis_vault_balance    → agent position (shares + value)
//   arcis_preview_deposit  → shares preview for amount
//   arcis_credit_status    → pool, borrowed, utilization
//   arcis_credit_tiers     → reputation tier table
//   arcis_credit_health    → loan health check
//   arcis_contracts        → all deployed addresses
//
// WRITE TOOLS (requires private key):
//   arcis_deposit          → deposit USDC (auto-approval)
//   arcis_withdraw         → redeem raUSDC shares

// ── Example Conversations ──

const exampleConversations = [
  {
    human: "What's the current state of the Arcis vault?",
    claude: `The Arcis vault on Base Sepolia currently holds $11,250 USDC in TVL.
The exchange rate is 1.000000 USDC per raUSDC share. The vault has a
$10M deposit cap with $9,988,750 remaining capacity. All reserves
are liquid — no capital is deployed to yield strategies yet.`,
  },
  {
    human: "Check the position for 0xB390c9a4fB16389B6edd468f18AB2597bdf857db",
    claude: `That address holds 11,250 raUSDC shares worth $11,250 USDC.
They also have $488,750 USDC in their wallet — that's idle capital
earning zero yield. They could deposit up to $9,988,750 more.`,
  },
  {
    human: "What are the credit tiers?",
    claude: `Arcis uses 5 reputation tiers for credit lines:

Tier 0 (Unverified): 200% collateral, no rate discount
Tier 1 (Basic): 175% collateral, -50bps discount
Tier 2 (Established): 150% collateral, -100bps discount
Tier 3 (Trusted): 130% collateral, -150bps discount
Tier 4 (Elite): 110% collateral, -200bps discount

Higher tiers borrow more with less collateral at lower rates.`,
  },
  {
    human: "Deposit 1000 USDC into the vault",
    claude: `I'll need a private key to execute the deposit. You can provide it
with the arcis_deposit tool. This will:
1. Approve 1,000 USDC to the vault contract
2. Call deposit(1000000000) on the vault
3. Mint raUSDC shares to your address

Shall I proceed?`,
  },
];

// ── Programmatic Usage (Agent SDK) ──

// For agents that call Claude's API with MCP:
const apiCallWithMcp = {
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Check the Arcis vault TVL and credit utilization. If utilization is above 80%, alert me.",
    },
  ],
  // MCP server connected via Claude's tool system
  // Claude automatically discovers and calls the right Arcis tools
};

export { mcpConfig, exampleConversations, apiCallWithMcp };
