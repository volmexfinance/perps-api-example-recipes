const { CHAIN_RELAYER_ID } = require("./helper");

require("dotenv").config();

console.log('environment', process.env.ENVIRONMENT)

// TODO: Add Volmex chain

module.exports = {
    'arbitrum-sepolia': {
        chainName: CHAIN_RELAYER_ID.ARBITRUMSEPOLIA,
        accountBalance: process.env.ARBITRUM_ACCOUNT_BALANCE,
        eviv: process.env.ARBITRUM_EVIV,
        bviv: process.env.ARBITRUM_BVIV,
        ethusd: process.env.ARBITRUM_ETHUSD,
        btcusd: process.env.ARBITRUM_BTCUSD,
        perpetualOracle: process.env.ARBITRUM_PERPETUAL_ORACLE,
        fundingRate: process.env.ARBITRUM_FUNDING_RATE,
        marketRegistry: process.env.ARBITRUM_MARKET_REGISTRY,
        matchingEngine: process.env.ARBITRUM_MATCHING_ENGINE,
        periphery: process.env.ARBITRUM_PERIPHERY,
        perpView: process.env.ARBITRUM_PERP_VIEW,
        positioning: process.env.ARBITRUM_POSITIONING,
        positioningConfig: process.env.ARBITRUM_POSITIONING_CONFIG,
        quoteToken: process.env.ARBITRUM_QUOTE_TOKEN,
        vault: process.env.ARBITRUM_VAULT,
        collateralManager: process.env.ARBITRUM_COLLATERAL_MANAGER,
        usdt: process.env.ARBITRUM_USDT,
        usdc: process.env.ARBITRUM_USDC,
        weth: process.env.ARBITRUM_WETH,
        jsonRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    },
    'base-sepolia': {
        chainName: CHAIN_RELAYER_ID.BASEGOERLI,
        accountBalance: process.env.BASE_ACCOUNT_BALANCE,
        eviv: process.env.BASE_EVIV,
        bviv: process.env.BASE_BVIV,
        ethusd: process.env.BASE_ETHUSD,
        btcusd: process.env.BASE_BTCUSD,
        perpetualOracle: process.env.BASE_PERPETUAL_ORACLE,
        fundingRate: process.env.BASE_FUNDING_RATE,
        marketRegistry: process.env.BASE_MARKET_REGISTRY,
        matchingEngine: process.env.BASE_MATCHING_ENGINE,
        periphery: process.env.BASE_PERIPHERY,
        perpView: process.env.BASE_PERP_VIEW,
        positioning: process.env.BASE_POSITIONING,
        positioningConfig: process.env.BASE_POSITIONING_CONFIG,
        quoteToken: process.env.BASE_QUOTE_TOKEN,
        vault: process.env.BASE_VAULT,
        collateralManager: process.env.BASE_COLLATERAL_MANAGER,
        usdt: process.env.BASE_USDT,
        usdc: process.env.BASE_USDC,
        weth: process.env.BASE_WETH,
        jsonRpcUrl: process.env.BASE_RPC_URL,
    }
}