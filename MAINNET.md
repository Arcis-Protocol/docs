# Arcis Protocol — Mainnet Launch Checklist

Every step to go live on Base mainnet, in order, with dependencies.

---

## Phase 0: Pre-Deploy (do first)

- [x] **Owner wallet: hardware wallet**
  - hardware wallet is the owner of all contracts (solo founder stage)
  - No multisig needed until you have independent co-signers
  - Contract-level protections (24h strategy timelock, emergencyWithdraw) protect depositors
  - Migrate to multisig later via `transferOwnership()` when team grows

- [x] **Fund deployer wallet with ETH on Base mainnet**
  - Send ~0.05 ETH to your hardware wallet address on Base
  - Bridge from Ethereum via bridge.base.org or use Coinbase direct
  - **Use your hardware wallet as deployer — never use the testnet deployer for mainnet**
  - The testnet deployer key is in chat history and should be considered compromised for real funds

- [ ] **Audit decision**
  - Option A: Launch without audit, cap deposits at $10K, audit after traction
  - Option B: Submit to Code4rena/Sherlock ($15-30K, 2-4 weeks)
  - Option C: Cantina private audit ($20-50K, 1-2 weeks)
  - Codebase is frozen and ready for any option

---

## Phase 1: Contract Deployment

Base mainnet USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
Base mainnet Aave V3 Pool: `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5`

- [x] **Deploy ArcisVault** — `0x00325d9da832b38179ed2f0dabd4062d93e325a7`
  ```bash
  forge script script/Deploy.s.sol --rpc-url https://mainnet.base.org \
    --broadcast --verify --etherscan-api-key $BASESCAN_KEY \
    --private-key <YOUR_ONEKEY_EXPORTED_KEY>
  ```
  Or with interactive signing: `--interactive` flag
  - Constructor: USDC address, deposit cap ($100K initial), fee (100 bps), multisig, reserve ratio (1000 bps)

- [x] **Deploy StrategyAllocator** — `0x7Fd5d7b49694858FCf143E0039e83cDB0196DD7A`
  - Constructor: vault address, 12-hour timelock

- [ ] **Deploy AgentCredit**
  - Constructor: vault address, identity registry, base rate (500 bps), multisig

- [x] **Deploy ATIRouter** — `0xd0c64f997ca9aa427f8834578bd7f0313f868e83`
  - Constructor: vault address, credit address

- [x] **Deploy StrategyAave** — `0x43626D6162Ccb12328B989BB228DaD2941F2F12a`
  - Constructor: vault address, Aave V3 Pool, USDC address
  - This is the first real yield source

- [ ] **Verify all contracts on Basescan**
  ```bash
  forge verify-contract <address> ArcisVault --chain base
  ```

- [ ] **Queue Aave strategy via timelock**
  ```bash
  # Call queueStrategy(aaveStrategyAddress, 7000) — 70% allocation
  # Wait 24 hours
  # Call executeStrategy()
  ```

---

## Phase 2: Configuration

- [ ] **Verify ownership on all contracts**
  - ArcisVault, AgentCredit, StrategyAllocator: owner = your deployer address
  - Verify on Basescan: each contract's `owner()` returns your hardware wallet
  - Future: `transferOwnership(multisigAddress)` when team grows

- [ ] **Set deposit cap** — start at $100K, increase after audit
- [ ] **Set per-agent cap** — $10K initial (prevents whale concentration)
- [ ] **Set fee recipient** — multisig address
- [ ] **Seed first deposit** — deposit $100-500 USDC from your wallet to prove it works
- [ ] **Verify exchange rate** — should be ~1.000000 after first deposit

---

## Phase 3: SDK / MCP / Dashboard Update

- [x] **Update SDK addresses** — mainnet in source
  - Edit `src/addresses.ts` with mainnet contract addresses
  - Add chain detection (Base mainnet vs Base Sepolia)
  - Bump version to 0.4.0
  - `npm publish --access public`

- [x] **Update MCP addresses** — mainnet in source
  - Edit route.ts and server.ts with mainnet addresses
  - Add CHAIN_ID env var for mainnet/testnet switching
  - Bump to 0.3.0
  - `npm publish --access public`

- [ ] **Deploy MCP to Vercel**
  - Import Arcis-Protocol/mcp at vercel.com/new
  - Set env vars for mainnet
  - Add as Claude.ai custom connector

- [x] **Update Dashboard** — mainnet addresses, RPC, chain ID
  - Switch RPC to Base mainnet (`https://mainnet.base.org`)
  - Update all contract addresses
  - Remove "Base Sepolia" testnet labels
  - Add mainnet badge

- [x] **Update Landing Page** — mainnet references
  - Remove any testnet references
  - Update architecture diagram if needed
  - Ensure all links point to mainnet explorer

---

## Phase 4: CUSTOS Deployment

- [ ] **Create Telegram bot**
  - Message @BotFather on Telegram
  - `/newbot` → name: "CUSTOS" → username: custos_arcis_bot
  - Save the bot token
  - `/setdescription` → "The keeper of the citadel. Protocol agent for Arcis."
  - `/setabouttext` → "Autonomous keeper agent. /status for live data."
  - Add bot to your Telegram group/channel
  - Get chat ID (message the bot, check getUpdates API)

- [ ] **Create X developer app for @custos0x**
  - Go to developer.x.com
  - Create project → create app
  - Set permissions: Read and Write
  - Generate OAuth 1.0a keys:
    - API Key
    - API Secret
    - Access Token
    - Access Token Secret
  - Save all 4 values

- [ ] **Update CUSTOS addresses**
  - Edit `src/config.ts` with mainnet contract addresses
  - Set chain to Base mainnet

- [ ] **Deploy CUSTOS to Railway**
  ```
  railway login
  railway init
  railway link
  ```
  - Set environment variables:
    ```
    CUSTOS_PRIVATE_KEY=0x...        # Funded keeper wallet (not the deployer)
    TELEGRAM_BOT_TOKEN=...          # From @BotFather
    TELEGRAM_CHAT_ID=...            # Your group/channel ID
    X_API_KEY=...                   # From developer.x.com
    X_API_SECRET=...
    X_ACCESS_TOKEN=...
    X_ACCESS_SECRET=...
    ```
  - Deploy: `railway up`
  - Verify CUSTOS is running: check Railway logs

- [ ] **Post pinned tweet from @custos0x**
  - Use the pinned tweet from SOCIAL.md

- [ ] **Fix bio typo** — "Harvests" not "Harvest", "Services" not "Serviced"

---

## Phase 5: Distribution (first week after launch)

- [ ] **Submit to DeFiLlama**
  - Requires TVL > $0 on mainnet
  - PR to github.com/DefiLlama/DefiLlama-Adapters
  - Category: Yield, Chain: Base

- [ ] **Submit MCP to directories**
  - mcp.so — submit form
  - glama.ai — submit form
  - smithery.ai — submit form
  - awesome-mcp-servers — GitHub PR

- [ ] **Apply to Base ecosystem**
  - base.org/ecosystem — submit project
  - Include: vault address, TVL, ATI standard

- [ ] **Set up Paragraph.xyz blog**
  - Claim @arcis handle
  - Publish thesis post: "Why AI Agents Need Financial Infrastructure"
  - Publish technical post: "The ATI Standard — Three Functions for Agent DeFi"

- [ ] **Publish launch announcement**
  - @ArcisProtocol: protocol announcement (institutional voice)
  - @custos0x: keeper status report (agent voice)
  - Telegram: community announcement

---

## Phase 6: Growth (weeks 2-4)

- [ ] **Deploy subgraph** to The Graph Studio
- [ ] **Add live CUSTOS dot** to landing page (green pulse when keeper is active)
- [ ] **Get @custos0x verified** on X (after enough history)
- [ ] **Deploy RevenueBondFactory** to mainnet
- [ ] **Increase deposit cap** after audit or traction ($100K → $1M)
- [ ] **Agent framework outreach** — ElizaOS, LangChain, CrewAI partnerships
- [ ] **CUSTOS on Virtuals** — deploy as tokenized agent after establishing operations

---

## Cost Estimate

| Item | Cost | Timeline |
|---|---|---|
| ETH for deployment | ~$5-10 | Day 1 |
| Owner: hardware wallet (no multisig) | $0 | Day 1 |
| Railway (CUSTOS hosting) | $5/month | Day 1 |
| Vercel (MCP hosting) | Free tier | Day 1 |
| Domain (arcis.money) | Already owned | — |
| Seed deposit | $100-500 | Day 1 |
| Audit (optional Phase 0) | $15-50K | 2-4 weeks |
| X Premium (@custos0x) | $8/month | Optional |
| **Total (no audit)** | **~$520** | **1-2 days** |
| **Total (with audit)** | **~$15-50K** | **2-5 weeks** |

---

## Critical Path (fastest to mainnet)

```
Day 1 morning:  Create Safe multisig + fund deployer
Day 1 afternoon: Deploy all contracts + verify on Basescan
Day 1 evening:  Queue Aave strategy (24h timelock starts)
Day 2 morning:  Transfer ownership to multisig
Day 2 afternoon: Execute strategy + seed first deposit
Day 2 evening:  Update SDK + MCP + dashboard addresses
Day 3 morning:  Deploy CUSTOS to Railway + MCP to Vercel
Day 3 afternoon: Post pinned tweet + submit to DeFiLlama
Day 3 evening:  LIVE
```

**You can be on mainnet in 3 days.** The 24-hour strategy timelock is the only hard delay.

---

## TODO: Post-Launch Enhancements

- [ ] Live CUSTOS status dot on landing page (green pulse)
- [ ] Live data in CUSTOS section card footers (replace static "4 keeper loops" with real TVL)
- [ ] Subgraph deployment for historical charts in dashboard
- [ ] Revenue bond UI in dashboard (deposit principal, claim coupons)
- [ ] Agent reputation dashboard (ERC-8004 tier lookup)

---

*Tres Functiones. Unum Foedus. The citadel awaits.*
