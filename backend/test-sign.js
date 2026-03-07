const fcl = require('@onflow/fcl');
const { SHA3 } = require('sha3');
const EC = require('elliptic').ec;

fcl.config({
  "accessNode.api": 'http://127.0.0.1:8888',
  "flow.network": 'emulator'
});

require('dotenv').config();

const ec = new EC('p256');
const TREASURY_ADDRESS = 'f8d6e0586b0a20c7';
const TREASURY_PRIVATE_KEY = (process.env.EMULATOR_PRIVATE_KEY || '').replace(/^0x/, '').trim();

const hashMsgHex = (msgHex) => {
    const sha = new SHA3(256);
    sha.update(Buffer.from(msgHex, "hex"));
    return sha.digest();
};

const signWithKey = (privateKey, msgHex) => {
    const key = ec.keyFromPrivate(Buffer.from(privateKey, "hex"));
    const sig = key.sign(hashMsgHex(msgHex));
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, "be", n);
    const s = sig.s.toArrayLike(Buffer, "be", n);
    return Buffer.concat([r, s]).toString("hex");
};

const authorizationFunction = async (account) => {
    return {
        ...account,
        tempId: `${TREASURY_ADDRESS}-0`,
        addr: fcl.sansPrefix(TREASURY_ADDRESS),
        keyId: 0,
        signingFunction: async (signable) => {
            const signature = signWithKey(TREASURY_PRIVATE_KEY, signable.message);
            console.log(`Payload Message: ${signable.message}`);
            console.log(`Generated Signature: ${signature}`);
            return {
                addr: fcl.withPrefix(TREASURY_ADDRESS),
                keyId: 0,
                signature: signature
            };
        }
    };
};

async function testSign() {
  try {
    const transactionId = await fcl.mutate({
      cadence: `transaction { prepare(signer: auth(Storage) &Account) { log("Hello from FCL ECDSA!") } }`,
      proposer: authorizationFunction,
      payer: authorizationFunction,
      authorizations: [authorizationFunction],
      limit: 999
    });
    console.log(`Success! Transaction ID: ${transactionId}`);
  } catch (error) {
    console.error("FCL Transaction Failed:", error);
  }
}

testSign();
