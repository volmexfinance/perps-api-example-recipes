const { ethers } = require("ethers");

require("dotenv").config();

const Types = {
  Asset: [
    { name: "virtualToken", type: "address" },
    { name: "value", type: "uint256" },
  ],
  Order: [
    { name: "orderType", type: "bytes4" },
    { name: "deadline", type: "uint64" },
    { name: "trader", type: "address" },
    { name: "baseAsset", type: "Asset" },
    { name: "quoteAsset", type: "Asset" },
    { name: "salt", type: "uint256" },
    { name: "limitOrderTriggerPrice", type: "uint128" },
    { name: "isShort", type: "bool" },
  ],
};

const ORDER_TYPE = {
  ORDER: "0xf555eb98",
  STOP_LOSS_INDEX_PRICE: "0x835d5c1e",
  STOP_LOSS_LAST_PRICE: "0xd9ed8042",
  STOP_LOSS_MARK_PRICE: "0xe144c7ec",
  TAKE_PROFIT_INDEX_PRICE: "0x67393efa",
  TAKE_PROFIT_LAST_PRICE: "0xc7dc86f6",
  TAKE_PROFIT_MARK_PRICE: "0xb6d64e04",
};

// Smart contracts make no distinction between limit orders and market orders but
// the UI uses a limitOrderTriggerPrice of 0 for ORDER_TYPE.ORDER to represent MARKET order.
const TRIGGER_PRICE_MIN_LIMIT = "0";
const TRIGGER_PRICE_MARKET = "1";
const TRIGGER_PRICE = {
  MIN_LIMIT: TRIGGER_PRICE_MIN_LIMIT,
  MARKET: TRIGGER_PRICE_MARKET
}

const generateSalt = async (matchingEngineAddr, signer) => {
  if (!matchingEngineAddr) throw new Error("matchingEngineAddr is required");
  const matchingEngine = new ethers.Contract(matchingEngineAddr, [
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "makerMinSalt",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ], signer);

  const minSalt = await matchingEngine.makerMinSalt(signer.address)
  const dateSalt = Date.now() * 1000
  return minSalt.add(ethers.BigNumber.from(dateSalt)).toString();
};

const signOrder = async (signer, presignedOrder, verifyingContractAddr) => {
  if (!verifyingContractAddr)
    throw new Error("verifyingContractAddr is required");
  const chainId = await signer.getChainId();
  const domain = {
    name: "V_PERP",
    version: "1",
    chainId: chainId,
    verifyingContract: verifyingContractAddr,
  };
  const order = presignedOrder;
  const signature = await signer._signTypedData(domain, Types, order);
  return {
    order_type: order.orderType,
    deadline: order.deadline,
    trader: order.trader,
    base_asset: {
      virtual_token: order.baseAsset.virtualToken,
      value: order.baseAsset.value,
    },
    quote_asset: {
      virtual_token: order.quoteAsset.virtualToken,
      value: order.quoteAsset.value,
    },
    salt: order.salt,
    trigger_price: order.limitOrderTriggerPrice,
    is_short: order.isShort,
    signature: signature,
  };
};


const CHAIN_RELAYER_ID = {
  ARBITRUMSEPOLIA: "ARB",
  BASEGOERLI: "BSG",
};

/**
 *
 * @param {*} order
 * @param {*} chainRelayerId RELAYER_TO_CHAINID
 * @returns
 */
const sendOrderToRelayer = async (order, chainRelayerId, accessToken) => {
  const response = await fetch(`${process.env.PERPS_API_URL}/api/v1/perpetuals/insertOrder/${chainRelayerId}`, {
    // const response = await fetch(`${RELAYER_URL}/insertOrder/${chainRelayerId}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error("Failed to send order" + await response.text());
  const orderId = await response.text();
  return orderId.split('"')[1];
};

const schedule = (cb, ms) => {
  cb()
  setInterval(() => cb(), ms)
}

function getAllowedMaxDecimals(basePrice) {
  const [basePriceInteger, basePriceDecimals] = basePrice.split('.')

  if (Number(basePriceInteger) === 0) {
    const decimalLeadingZeroesMatch = basePriceDecimals.match(/^0+/) || null
    const decimalLeadingZeroes = decimalLeadingZeroesMatch ? decimalLeadingZeroesMatch[0].length : 0
    const maxAllowedDecimals = 4 + decimalLeadingZeroes
    return maxAllowedDecimals
  } else if (basePriceInteger.length === 1) {
    return 3
  } else if (basePriceInteger.length >= 2 && basePriceInteger.length <= 4) {
    return 2
  } else if (basePriceInteger.length >= 5) {
    return 1
  }

  return 0
}

/**
 * converts order to values acceptable to perps api
 * @param {*} baseAmount 
 * @param {*} quoteAmount 
 * @returns 
 */
const getSafeBaseAndQuoteAmounts = (baseAmount, quoteAmount, baseToken, indexPrice) => {
  // @ts-ignore
  const priceDecimals = getAllowedMaxDecimals(ethers.utils.formatUnits(indexPrice, 6))
  const priceDecimalsZeros = ethers.utils.parseUnits('1', priceDecimals)
  const priceEPriceDecimals = ethers.BigNumber.from(quoteAmount).mul(ethers.utils.parseUnits('1', priceDecimals)).div(baseAmount)

  // @ts-ignore
  const minIncrementDecimals = getBaseTokenMinIncrement()
  const minIncrementDecimalsZeros = ethers.utils.parseUnits('1', minIncrementDecimals)
  const baseAmountSafe = ethers.BigNumber.from(baseAmount).div(minIncrementDecimalsZeros).mul(minIncrementDecimalsZeros)
  
  return {
    baseAmountSafe: baseAmountSafe.toString(),
    quoteAmountSafe: ethers.BigNumber.from(baseAmountSafe).mul(priceEPriceDecimals).div(priceDecimalsZeros).toString(),
  }
}

const getBaseTokenMinIncrement = (chainId) => {
  return 15
}

const createRandomQuoteValue = (price, spread) => {
  const random = Math.floor(Math.random() * 10000 * spread) + price * 10000;
  return ethers.utils.parseUnits((random / 10000).toFixed(1));
};

module.exports = {
  ORDER_TYPE,
  CHAIN_RELAYER_ID,
  TRIGGER_PRICE,
  signOrder,
  sendOrderToRelayer,
  generateSalt,
  getSafeBaseAndQuoteAmounts,
  createRandomQuoteValue,
  schedule
};
