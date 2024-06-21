const { ethers } = require("ethers");
const {
  ORDER_TYPE,
  CHAIN_RELAYER_ID,
  signOrder,
  sendOrderToRelayer,
  generateSalt,
  TRIGGER_PRICE,
  createRandomQuoteValue,
} = require("../utils/helper");
const { signInWithEthereum } = require("../utils/siwe-helper");
require("dotenv").config();

const baseAsset = process.env.ARBITRUM_EVIV; // ex: EVIV, BVIV, ETH, BTC
const quoteAsset = process.env.ARBITRUM_QUOTE_TOKEN; // ex: USDT

const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_URL);
const privateKey = process.env.PRIVATE_KEY;

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is missing in .env");
}

// short order

// buy order will receive 1 EVIV for at most 500 USDT
// if isShort = true, sell order will receive 10 EVIV for at least 500 USDT
const createOrder = async (signer, accessToken) => {
  const baseValue = ethers.utils.parseUnits("1"); // adds 18 zeros to 1
  const isShort = true;
  const quoteValue = createRandomQuoteValue(66, 1);
  const order = {
    // if orderType is ORDER_TYPE.ORDER then limitOrderTriggerPrice is optional.
    orderType: ORDER_TYPE.ORDER,
    deadline: String(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7), // 7 days
    trader: signer.address,
    baseAsset: {
      virtualToken: baseAsset,
      value: baseValue.toString(),
    },
    quoteAsset: {
      virtualToken: quoteAsset,
      value: quoteValue.toString(),
    },
    salt: await generateSalt(process.env.ARBITRUM_MATCHING_ENGINE, signer),
    limitOrderTriggerPrice: TRIGGER_PRICE.MIN_LIMIT,
    isShort: isShort,
  };
  const finalOrder = await signOrder(
    signer,
    order,
    process.env.ARBITRUM_POSITIONING
  );
  try {
    const response = await sendOrderToRelayer(
      finalOrder,
      CHAIN_RELAYER_ID.ARBITRUMSEPOLIA,
      accessToken
    );
    console.log("Order sent to relayer", response);
  } catch (e) {
    console.log("Error sending order to relayer", e);
    throw e;
  }
};

const access_token_cache = {}
const main = async () => {
  const signer = new ethers.Wallet(privateKey, provider)
  if (!access_token_cache[signer.address]) {
    const { access_token } = await signInWithEthereum(signer);
    access_token_cache[signer.address] = access_token
  }
  const accessToken = access_token_cache[signer.address]
  await createOrder(signer, accessToken)
};

main();
