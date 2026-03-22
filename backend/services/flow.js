const fcl = require('@onflow/fcl');
const { SHA3 } = require('sha3');
const EC = require('elliptic').ec;
const fs = require('fs');
const path = require('path');

// Configure FCL for the Emulator
fcl.config({
  "accessNode.api": 'http://127.0.0.1:8888',
  "flow.network": 'emulator',
  "0xFLOATS_TAB_MANAGER": "0xf8d6e0586b0a20c7",
  "0xFLOW_TOKEN": "0x0ae53cb6e3f42a79",
  "0xFUNGIBLE_TOKEN": "0xee82856bf20e2aa6"
});

const ec = new EC('p256');

// Standard addresses for Emulator
const CONTRACT_ADDRESS = '0xf8d6e0586b0a20c7';
const FUNGIBLE_TOKEN_ADDRESS = '0xee82856bf20e2aa6';
const FLOW_TOKEN_ADDRESS = '0x0ae53cb6e3f42a79';

const TREASURY_ADDRESS = CONTRACT_ADDRESS; 
const TREASURY_PRIVATE_KEY = (process.env.EMULATOR_PRIVATE_KEY || '').replace(/^0x/, '').trim();

// Hash the message with SHA3-256 as required by Flow Emulator
const hashMsgHex = (msgHex) => {
    const sha = new SHA3(256);
    sha.update(Buffer.from(msgHex, "hex"));
    return sha.digest();
};

// Cryptographically sign the FCL message payload using the ECDSA private key
const signWithKey = (privateKey, msgHex) => {
    const key = ec.keyFromPrivate(Buffer.from(privateKey, "hex"));
    const sig = key.sign(hashMsgHex(msgHex));
    
    // Flow requires EXACTLY 64 bytes for the signature (32 for r, 32 for s)
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, "be", n);
    const s = sig.s.toArrayLike(Buffer, "be", n);
    
    return Buffer.concat([r, s]).toString("hex");
};

// The official Authorization Function that FCL requires to act on behalf of an account.
const authorizationFunction = async (account) => {
    return {
        ...account,
        tempId: `${TREASURY_ADDRESS}-0`,
        addr: fcl.sansPrefix(TREASURY_ADDRESS),
        keyId: 0,
        signingFunction: async (signable) => {
            return {
                addr: fcl.withPrefix(TREASURY_ADDRESS),
                keyId: 0,
                signature: signWithKey(TREASURY_PRIVATE_KEY, signable.message)
            };
        }
    };
};

// Auth function for specific users (Managed Wallets)
const createAuthFunction = (address, privateKey) => async (account) => {
    return {
        ...account,
        tempId: `${address}-0`,
        addr: fcl.sansPrefix(address),
        keyId: 0,
        signingFunction: async (signable) => {
            return {
                addr: fcl.withPrefix(address),
                keyId: 0,
                // Pass the raw transaction bytes into our P-256 signer
                signature: signWithKey(privateKey, signable.message)
            };
        }
    };
};

// Helper to load and prepare Cadence files from the backend/flow directory
const loadTransaction = (name) => {
    const filePath = path.join(__dirname, '..', 'flow', 'transactions', `${name}.cdc`);
    if (!fs.existsSync(filePath)) {
        console.warn(`Warning: Transaction file not found at ${filePath}. Ensure backend/flow/transactions/ exists.`);
        return "";
    }
    return fs.readFileSync(filePath, 'utf8')
        .replace(/0xFLOATS_TAB_MANAGER/g, CONTRACT_ADDRESS)
        .replace(/0xFUNGIBLE_TOKEN/g, FUNGIBLE_TOKEN_ADDRESS)
        .replace(/0xFLOW_TOKEN/g, FLOW_TOKEN_ADDRESS);
};

// Pre-load transactions on startup
const CADENCE_JIT_CONSUME = loadTransaction('jit_consume_float');
const CADENCE_CLAIM = loadTransaction('claim_float');
const CADENCE_DISCARD = loadTransaction('discard_float');
const CADENCE_DEPOSIT = loadTransaction('deposit_to_tab');

// Helper to get a managed user's private key
const getManagedKey = (address) => {
    const keysPath = path.join(__dirname, '..', 'data', 'managed_keys.json');
    if (!fs.existsSync(keysPath)) return null;
    const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
    const normalized = address.startsWith('0x') ? address : `0x${address}`;
    return keys[normalized] || keys[address] || null;
};

// Execute the JIT consume transaction signing as THE USER (managed wallet)
// This atomically: updates ledger + destroys receipt resource + emits FloatConsumed event
async function consumeFloatJIT(tabID, claimerAddress, spentAmount) {
  const formattedAmount = spentAmount.toFixed(8);
  console.log(`Executing JIT Consume for ${claimerAddress} at tab ${tabID} ($${formattedAmount})...`);

  const userKey = getManagedKey(claimerAddress);
  if (!userKey) {
    throw new Error(`No managed key found for address: ${claimerAddress}. Cannot sign JIT consume.`);
  }

  const userAuth = createAuthFunction(claimerAddress, userKey);

  try {
    const transactionId = await fcl.mutate({
      cadence: CADENCE_JIT_CONSUME,
      args: (arg, t) => [
        arg(tabID, t.String),
        arg(formattedAmount, t.UFix64)
      ],
      // User signs as authorizer (has access to their storage)
      // Treasury signs as payer (covers gas for the managed account)
      proposer: userAuth,
      payer: authorizationFunction,
      authorizations: [userAuth],
      limit: 999
    });

    console.log(`FCL Mutate returned txId: ${transactionId}`);
    console.log(`Waiting for blockchain to seal...`);
    await fcl.tx(transactionId).onceSealed();
    console.log(`JIT Consume sealed! FloatConsumed event emitted on-chain.`);

    return transactionId;
  } catch (error) {
    console.error("FCL JIT Consume Failed:", error);
    throw new Error(error);
  }
}


// Executes a claim on behalf of a managed user
async function claimFloat(tabID, amount, claimerAddress, claimerPrivateKey) {
  const formattedAmount = Number(amount).toFixed(8); // UFix64 requires 8 decimal precision
  console.log(`Executing Cadence Claim for ${tabID}: $${formattedAmount} by ${claimerAddress} via pure Node.js Payload...`);

  try {
    const authFn = createAuthFunction(claimerAddress, claimerPrivateKey);
    const transactionId = await fcl.mutate({
      cadence: CADENCE_CLAIM,
      args: (arg, t) => [
        arg(tabID, t.String),
        arg(formattedAmount, t.UFix64)
      ],
      proposer: authFn,
      payer: authFn,
      authorizations: [authFn],
      limit: 999
    });

    console.log(`FCL Mutate returned txId: ${transactionId}`);
    console.log(`Waiting for blockchain to seal...`);
    await fcl.tx(transactionId).onceSealed();
    console.log(`Claim transaction successfully sealed on-chain!`);

    return transactionId;
  } catch (error) {
    console.error("FCL Claim Failed:", error);
    throw new Error(error);
  }
}

// Executes a discard (return) on behalf of a managed user
async function discardFloat(claimerAddress, claimerPrivateKey) {
  console.log(`Executing Cadence Discard for ${claimerAddress} via pure Node.js Payload...`);

  try {
    const authFn = createAuthFunction(claimerAddress, claimerPrivateKey);
    const transactionId = await fcl.mutate({
      cadence: CADENCE_DISCARD,
      args: (arg, t) => [],
      proposer: authFn,
      payer: authFn,
      authorizations: [authFn],
      limit: 999
    });

    console.log(`FCL Mutate returned txId: ${transactionId}`);
    console.log(`Waiting for blockchain to seal...`);
    await fcl.tx(transactionId).onceSealed();
    console.log(`Discard transaction successfully sealed on-chain!`);

    return transactionId;
  } catch (error) {
    console.error("FCL Discard Failed:", error);
    throw new Error(error);
  }
}

// Executes a fiat deposit on the blockchain by programmatically withdrawing from the Treasury
async function depositToTab(tabID, funderAddress, amountAmount) {
  const formattedAmount = Number(amountAmount).toFixed(8); // UFix64 requires 8 decimal precision for safety
  console.log(`Executing Cadence Deposit for ${tabID}: $${formattedAmount} by ${funderAddress} via pure Node.js Payload...`);

  try {
    const transactionId = await fcl.mutate({
      cadence: CADENCE_DEPOSIT,
      args: (arg, t) => [
        arg(tabID, t.String),
        arg(funderAddress, t.Address),
        arg(formattedAmount, t.UFix64)
      ],
      proposer: authorizationFunction,
      payer: authorizationFunction,
      authorizations: [authorizationFunction],
      limit: 999
    });

    console.log(`FCL Mutate returned txId: ${transactionId}`);
    console.log(`Waiting for blockchain to seal...`);
    await fcl.tx(transactionId).onceSealed();
    console.log(`Deposit transaction successfully sealed on-chain!`);

    return transactionId;
  } catch (error) {
    console.error("FCL Deposit Failed:", error);
    throw new Error(error);
  }
}

module.exports = {
  consumeFloatJIT,
  claimFloat,
  discardFloat,
  depositToTab
};
