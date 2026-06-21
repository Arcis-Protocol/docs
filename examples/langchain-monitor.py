"""
═══════════════════════════════════════════════════
  LangChain × Arcis — Position Monitor Agent

  A LangChain agent that monitors its Arcis vault
  position, checks credit health, and makes decisions
  about deposits, withdrawals, and borrowing.
═══════════════════════════════════════════════════
"""

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from web3 import Web3

# ── Config ──
RPC_URL = "https://sepolia.base.org"
VAULT = "0xa8eF658E125C7f6D7aFa9B6b8035b66b32CBE98d"
CREDIT = "0x019540E33a0292a9DDE36bD9Ef11774d5A1Ce6FC"

w3 = Web3(Web3.HTTPProvider(RPC_URL))

# ── Minimal ABIs ──
VAULT_ABI = [
    {"name": "totalAssets", "type": "function", "inputs": [], "outputs": [{"type": "uint256"}], "stateMutability": "view"},
    {"name": "exchangeRate", "type": "function", "inputs": [], "outputs": [{"type": "uint256"}], "stateMutability": "view"},
    {"name": "balance", "type": "function", "inputs": [{"name": "agent", "type": "address"}], "outputs": [{"type": "uint256"}], "stateMutability": "view"},
    {"name": "balanceOf", "type": "function", "inputs": [{"name": "", "type": "address"}], "outputs": [{"type": "uint256"}], "stateMutability": "view"},
    {"name": "paused", "type": "function", "inputs": [], "outputs": [{"type": "bool"}], "stateMutability": "view"},
    {"name": "maxDeposit", "type": "function", "inputs": [{"name": "agent", "type": "address"}], "outputs": [{"type": "uint256"}], "stateMutability": "view"},
]

CREDIT_ABI = [
    {"name": "lendingPool", "type": "function", "inputs": [], "outputs": [{"type": "uint256"}], "stateMutability": "view"},
    {"name": "totalBorrowed", "type": "function", "inputs": [], "outputs": [{"type": "uint256"}], "stateMutability": "view"},
    {"name": "getEffectiveRate", "type": "function", "inputs": [{"name": "agent", "type": "address"}], "outputs": [{"type": "uint256"}], "stateMutability": "view"},
]

vault = w3.eth.contract(address=VAULT, abi=VAULT_ABI)
credit = w3.eth.contract(address=CREDIT, abi=CREDIT_ABI)


# ── LangChain Tools ──

@tool
def vault_status() -> str:
    """Get current Arcis vault status: TVL, exchange rate, pause state."""
    tvl = vault.functions.totalAssets().call()
    rate = vault.functions.exchangeRate().call()
    paused = vault.functions.paused().call()
    return (
        f"Vault TVL: ${tvl / 1e6:,.2f} USDC\n"
        f"Exchange Rate: {rate / 1e18:.6f} USDC/raUSDC\n"
        f"Status: {'PAUSED' if paused else 'Active'}"
    )


@tool
def agent_position(agent_address: str) -> str:
    """Check an agent's vault position: shares held and USDC value."""
    shares = vault.functions.balanceOf(agent_address).call()
    value = vault.functions.balance(agent_address).call()
    max_dep = vault.functions.maxDeposit(agent_address).call()
    return (
        f"Agent: {agent_address}\n"
        f"raUSDC Shares: {shares / 1e6:,.2f}\n"
        f"Position Value: ${value / 1e6:,.2f} USDC\n"
        f"Max Additional Deposit: ${max_dep / 1e6:,.2f}"
    )


@tool
def credit_status() -> str:
    """Get Arcis credit module status: pool size, borrowed, utilization."""
    pool = credit.functions.lendingPool().call()
    borrowed = credit.functions.totalBorrowed().call()
    total = pool + borrowed
    util = (borrowed / total * 100) if total > 0 else 0
    return (
        f"Lending Pool: ${pool / 1e6:,.2f} USDC\n"
        f"Total Borrowed: ${borrowed / 1e6:,.2f} USDC\n"
        f"Utilization: {util:.1f}%"
    )


@tool
def borrowing_rate(agent_address: str) -> str:
    """Get the current borrowing rate for an agent based on reputation and utilization."""
    rate = credit.functions.getEffectiveRate(agent_address).call()
    return f"Effective borrowing rate for {agent_address}: {rate / 100:.2f}% APR"


# ── Agent Setup ──

def create_arcis_agent():
    """Create a LangChain agent with Arcis monitoring tools."""
    llm = ChatOpenAI(model="gpt-4o", temperature=0)

    tools = [vault_status, agent_position, credit_status, borrowing_rate]

    prompt = """You are a DeFi treasury monitoring agent for Arcis Protocol.

    You monitor vault positions, credit health, and interest rates.
    Report data clearly and concisely. Flag any concerning trends:
    - Vault paused
    - Utilization above 85%
    - Exchange rate declining
    - Position value dropping

    Available tools: vault_status, agent_position, credit_status, borrowing_rate
    """

    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True)


# ── Usage ──
if __name__ == "__main__":
    agent = create_arcis_agent()

    # Example queries the agent can handle:
    result = agent.invoke({"input": "Check the vault status and tell me if anything looks concerning."})
    print(result["output"])

    # result = agent.invoke({"input": "What's my position at 0x1234...? Should I deposit more?"})
    # result = agent.invoke({"input": "What's the current borrowing rate? Is it worth taking a loan?"})
