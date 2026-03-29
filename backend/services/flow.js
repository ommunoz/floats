const fcl = require('@onflow/fcl');
const { SHA3 } = require('sha3');
const EC = require('elliptic').ec;
const fs = require('fs');
const path = require('path');
const { loadJsonData } = require('../lib/config');

// --- Network Config ---
const FLOW_NETWORK = process.env.FLOW_NETWORK || 'emulator';

const NETWORK_CONFIG = {
    emulator: {
        accessNode: 'http://127.0.0.1:8888',
        contractAddress: '0xf8d6e0586b0a20c7',
        fungibleToken:   '0xee82856bf20e2aa6',
        flowToken:       '0x0ae53cb6e3f42a79',
        treasuryAddress: '0xf8d6e0586b0a20c7',
        treasuryKey: () => (process.env.EMULATOR_PRIVATE_KEY || '').replace(/^0x/, '').trim(),
    },
    testnet: {
        accessNode: 'https://rest-testnet.onflow.org',
        contractAddress: '0x407c9218dcdf3589',
        fungibleToken:   '0x9a0766d93b6608b7',
        flowToken:       '0x7e60df042a9c0868',
        treasuryAddress: '0x407c9218dcdf3589',
        treasuryKey: () => {
            const pkeyPath = path.join(__dirname, '..', '..', 'floats-admin.pkey');
            if (fs.existsSync(pkeyPath)) return fs.readFileSync(pkeyPath, 'utf8').trim().replace(/^0x/, '');
            return (process.env.TESTNET_ADMIN_PRIVATE_KEY || '').replace(/^0x/, '').trim();
        },
    },
};

const NET = NETWORK_CONFIG[FLOW_NETWORK];
if (!NET) {
    throw new Error(`Unknown FLOW_NETWORK: "${FLOW_NETWORK}". Use "emulator" or "testnet".`);
}

const CONTRACT_ADDRESS    = NET.contractAddress;
const FUNGIBLE_TOKEN_ADDRESS = NET.fungibleToken;
const FLOW_TOKEN_ADDRESS  = NET.flowToken;
const TREASURY_ADDRESS    = NET.treasuryAddress;
const TREASURY_PRIVATE_KEY = NET.treasuryKey();

fcl.config({
    "accessNode.api": NET.accessNode,
    "flow.network":   FLOW_NETWORK,
    "0xFLOATS_TAB_MANAGER": CONTRACT_ADDRESS,
    "0xFLOW_TOKEN":         FLOW_TOKEN_ADDRESS,
    "0xFUNGIBLE_TOKEN":     FUNGIBLE_TOKEN_ADDRESS,
});

console.log(`[flow.js] Network: ${FLOW_NETWORK.toUpperCase()} | Contract: ${CONTRACT_ADDRESS}`);

const ec = new EC('p256');

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
            return {
                addr: fcl.withPrefix(TREASURY_ADDRESS),
                keyId: 0,
                signature: signWithKey(TREASURY_PRIVATE_KEY, signable.message)
            };
        }
    };
};

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
                signature: signWithKey(privateKey, signable.message)
            };
        }
    };
};

// Helper to load and resolve Cadence files from backend/flow/transactions/
const loadTransaction = (name) => {
    const filePath = path.join(__dirname, '..', 'flow', 'transactions', `${name}.cdc`);
    if (!fs.existsSync(filePath)) {
        console.warn(`Warning: Transaction file not found at ${filePath}.`);
        return "";
    }
    return fs.readFileSync(filePath, 'utf8')
        .replace(/0xFLOATS_TAB_MANAGER/g, CONTRACT_ADDRESS)
        .replace(/0xFUNGIBLE_TOKEN/g, FUNGIBLE_TOKEN_ADDRESS)
        .replace(/0xFLOW_TOKEN/g, FLOW_TOKEN_ADDRESS);
};

// Pre-load transactions on startup
const CADENCE_JIT_CONSUME = loadTransaction('jit_consume_float');
const CADENCE_CLAIM       = loadTransaction('claim_float');
const CADENCE_DISCARD     = loadTransaction('discard_float');
const CADENCE_DEPOSIT     = loadTransaction('deposit_to_tab');

// NEW: Local script load helper for queries
const loadScript = (name) => {
    const filePath = path.join(__dirname, '..', 'flow', 'scripts', `${name}.cdc`);
    return fs.readFileSync(filePath, 'utf8')
        .replace(/0xFLOATS_TAB_MANAGER/g, CONTRACT_ADDRESS);
};

const SCRIPT_GET_ACTIVE_FLOAT = loadScript('get_active_float');

async function checkFloatIsValid(claimerAddress) {
    try {
        const result = await fcl.query({
            cadence: SCRIPT_GET_ACTIVE_FLOAT,
            args: (arg, t) => [arg(claimerAddress, t.Address)]
        });
        return !!result;
    } catch (e) {
        console.error("❌ FCL Query failed for checkFloatIsValid:", e);
        return false;
    }
}

const getManagedKeys = () => {
    const keysPath = path.join(__dirname, '..', 'data', 'managed_keys.json');
    return loadJsonData('MANAGED_KEYS', keysPath, {});
};

async function consumeFloatJIT(tabID, claimerAddress, spentAmount) {
    const formattedAmount = spentAmount.toFixed(8);
    const managedKeys = getManagedKeys();
    const normalized = claimerAddress.startsWith('0x') ? claimerAddress : `0x${claimerAddress}`;
    const userKey = managedKeys[normalized] || managedKeys[claimerAddress] || null;

    console.log(`[flow.js] consumeFloatJIT: address=${claimerAddress}, normalized=${normalized}, keyFound=${!!userKey}, keysAvailable=${Object.keys(managedKeys).length}`);

    if (!userKey) throw new Error(`No managed key found for address: ${claimerAddress}`);

    // Submit the transaction but don't wait for the SEAL here
    const txId = await fcl.mutate({
        cadence: CADENCE_JIT_CONSUME,
        args: (arg, t) => [arg(tabID, t.String), arg(formattedAmount, t.UFix64)],
        proposer: authorizationFunction,
        payer: authorizationFunction,
        authorizations: [
            createAuthFunction(normalized, userKey)
        ],
        limit: 9999
    });

    console.log(`🌀 JIT Transaction Submitted: ${txId}. Approving Stripe now, sealing in background...`);

    // 🔥 Background Seal Watcher
    (async () => {
        try {
            await fcl.tx(txId).onceSealed();
            console.log(`✅ JIT Transaction Sealed: ${txId}`);
        } catch (e) {
            console.error(`❌ BACKGROUND SEAL FAILED for ${txId}:`, e.message);
        }
    })();

    return txId;
}

async function claimFloat(tabID, amount, claimerAddress, claimerPrivateKey) {
    const formattedAmount = Number(amount).toFixed(8);
    console.log(`Executing Claim for ${tabID}: $${formattedAmount} by ${claimerAddress}...`);

    const authFn = createAuthFunction(claimerAddress, claimerPrivateKey);
    const transactionId = await fcl.mutate({
        cadence: CADENCE_CLAIM,
        args: (arg, t) => [arg(tabID, t.String), arg(formattedAmount, t.UFix64)],
        proposer: authFn,
        payer: authFn,
        authorizations: [authFn],
        limit: 999
    });

    await fcl.tx(transactionId).onceSealed();
    console.log(`Claim sealed!`);
    return transactionId;
}

async function discardFloat(claimerAddress, claimerPrivateKey) {
    console.log(`Executing Discard for ${claimerAddress}...`);

    const authFn = createAuthFunction(claimerAddress, claimerPrivateKey);
    const transactionId = await fcl.mutate({
        cadence: CADENCE_DISCARD,
        args: (arg, t) => [],
        proposer: authFn,
        payer: authFn,
        authorizations: [authFn],
        limit: 999
    });

    await fcl.tx(transactionId).onceSealed();
    console.log(`Discard sealed!`);
    return transactionId;
}

async function depositToTab(tabID, funderAddress, amountAmount) {
    const formattedAmount = Number(amountAmount).toFixed(8);
    console.log(`Executing Deposit for ${tabID}: $${formattedAmount} by ${funderAddress}...`);

    const transactionId = await fcl.mutate({
        cadence: CADENCE_DEPOSIT,
        args: (arg, t) => [arg(tabID, t.String), arg(funderAddress, t.Address), arg(formattedAmount, t.UFix64)],
        proposer: authorizationFunction,
        payer: authorizationFunction,
        authorizations: [authorizationFunction],
        limit: 999
    });

    await fcl.tx(transactionId).onceSealed();
    console.log(`Deposit sealed!`);
    return transactionId;
}

module.exports = { consumeFloatJIT, claimFloat, discardFloat, depositToTab };
