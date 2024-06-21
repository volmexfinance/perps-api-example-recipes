const { SiweMessage } =  require('siwe')
require("dotenv").config();

const domain = 'perpetuals.volmex.finance'
const origin = 'https://perpetuals.volmex.finance'

async function createSiweMessage(provider, address, statement) {
  const res = {
    text: async () => {
      while (true) {
        const a = String(Math.floor(Math.random() * 100_000_000))
        if (a.length === 8) return a
      }
    },
  }
  const message = new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId: (await provider.getNetwork()).chainId,
    nonce: await res.text(),
  })
  return message.prepareMessage()
}

async function signInWithEthereum(signer) {
  const provider = signer.provider

  const message = await createSiweMessage(provider, await signer.getAddress(), 'Sign in with Ethereum to the app.')
  const signature = await signer.signMessage(message)

  const res = await fetch(`${process.env.PERPS_API_URL}/api/v1/auth/eth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      credentials: "omit",
    },
    body: JSON.stringify({ message, signature }),
    credentials: 'omit',
  })
  return await res.json()
}

module.exports = {
    signInWithEthereum
}