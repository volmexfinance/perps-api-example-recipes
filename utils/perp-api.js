const { ethers } = require("ethers");
require("dotenv").config();


const {
  CHAIN_RELAYER_ID
} = require('./helper')
const getEVIVPrice = async () => {
  const indexDataEVIVRaw = await fetch(
    `https://rest-v1.volmex.finance/public/iv/history?symbol=EVIV&resolution=1&from=${Math.floor(
      new Date().getTime() / 1000 - 60 * 2
    )}&to=${Math.floor(new Date().getTime() / 1000)}`
  );
  const indexDataEVIV = await indexDataEVIVRaw.json();
  return indexDataEVIV.c[indexDataEVIV.c.length - 1];
};

const getBVIVPrice = async () => {
  const indexDataBVIVRaw = await fetch(
    `https://rest-v1.volmex.finance/public/iv/history?symbol=BVIV&resolution=1&from=${Math.floor(
      new Date().getTime() / 1000 - 60 * 2
    )}&to=${Math.floor(new Date().getTime() / 1000)}`
  );
  const indexDataBVIV = await indexDataBVIVRaw.json();
  return indexDataBVIV.c[indexDataBVIV.c.length - 1];
};
//https://perp-api-staging.volmex.finance/api/v1/perpetuals/markets/{chain}/{token}
const getPrice = async (asset, assetAddress, envVars) => {
  if (asset === "EVIV") {
    return Number(await getEVIVPrice())
  } else if (asset === "BVIV") {
    return Number(await getBVIVPrice());
  } else if (asset === "ETH") {
  } else if (asset === "BTC") {
  } else {
    throw new Error("Asset not supported");
  }
  const res = await fetch(
    `${process.env.PERPS_API_URL}/api/v1/perpetuals/markets/${envVars.chainName}/${assetAddress}`
  );
  const provider = new ethers.providers.JsonRpcProvider(envVars.jsonRpcUrl);
  const abi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "baseToken",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "twInterval",
          "type": "uint256"
        }
      ],
      "name": "getIndexPrice",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "indexPrice",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
  const accountBalance = new ethers.Contract(envVars.accountBalance, abi, provider);
  let indexPrice = 0;
  try {
    indexPrice = await accountBalance.getIndexPrice(assetAddress, 3600);
  } catch (e) {
    throw 'Cacher is probably down'
  }
  return ethers.utils.formatUnits(indexPrice, 6); // number
};

const getAssetAddress = (assetName, relayerChainId) => {
  if (relayerChainId === CHAIN_RELAYER_ID.ARBITRUMSEPOLIA) {
    switch (assetName) {
      case "EVIV":
        return process.env.ARBITRUM_EVIV;
      case "BVIV":
        return process.env.ARBITRUM_BVIV;
      case "ETH":
        return process.env.ARBITRUM_ETHUSD;
      case "BTC":
        return process.env.ARBITRUM_BTCUSD;
    }
  } else if (relayerChainId === CHAIN_RELAYER_ID.BASEGOERLI) {
    switch (assetName) {
      case "EVIV":
        return process.env.BASE_EVIV;
      case "BVIV":
        return process.env.BASE_BVIV;
      case "ETH":
        return process.env.BASE_ETHUSD;
      case "BTC":
        return process.env.BASE_BTCUSD;
    }
  }
};

const getOrders = async (traderAddress, chainRelayerId, accessToken) => {
  const response = await fetch(
    `${process.env.PERPS_API_URL}/api/v1/perpetuals/getOrders/${traderAddress}/${chainRelayerId}?filterByStatus=2,8`,
    {
      // const response = await fetch(`${RELAYER_URL}/insertOrder/${chainRelayerId}`, {
      method: "GET",
      headers: {
        // "Content-Type": "text/plain",
        Authorization: `Bearer ${accessToken}`,
      },
      //   body: JSON.stringify(order),
    }
  );
  if (!response.ok)
    throw new Error("Failed to send order" + (await response.text()));
  return await response.json();
};

/**
 * If BVIV is at 60, then there's $10k of liquidity 1.25% below the index price at 59.25, and $10k of liquidity 1.25% above the index price at 60.75
 *Following this example, there's $20k of liquidity 2% below the index price at 58.8, and $20k of liquidity 2% above the index price at 61.2
 * Finally, there's $50k of liquidity 3.75% below the index price...
 */

module.exports = {
  getOrders,
  getEVIVPrice,
  getBVIVPrice,
  getPrice,
  getAssetAddress
};
