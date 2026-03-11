const fcl = require('@onflow/fcl');
const { SHA3 } = require('sha3');
const EC = require('elliptic').ec;

// Configure FCL for the Emulator
fcl.config({
  "accessNode.api": 'http://127.0.0.1:8888',
  "flow.network": 'emulator'
});

const ec = new EC('p256'); // Flow uses the NIST P-256 curve by default

const TREASURY_ADDRESS = '0xf8d6e0586b0a20c7'; // emulator-account

// Flow private keys strictly must be 32 bytes (64 hex characters) with no '0x' prefix.
// We clean the .env variable just in case.
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
    // The elliptic library's toArrayLike sometimes strips leading zeros resulting in 31-byte buffers
    // We must ensure they are strictly zero-padded to 32 bytes
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, "be", n);
    const s = sig.s.toArrayLike(Buffer, "be", n);
    
    return Buffer.concat([r, s]).toString("hex");
};

// The official Authorization Function that FCL requires to act on behalf of an account.
// This proves to the blockchain that we actually own the Treasury.
const authorizationFunction = async (account) => {
    return {
        ...account,
        tempId: `${TREASURY_ADDRESS}-0`,
        addr: fcl.sansPrefix(TREASURY_ADDRESS),
        keyId: 0, // In Flow, accounts can have multiple keys. The emulator-account defaults to keyId 0.
        signingFunction: async (signable) => {
            return {
                addr: fcl.withPrefix(TREASURY_ADDRESS),
                keyId: 0,
                // Pass the raw transaction bytes into our P-256 signer
                signature: signWithKey(TREASURY_PRIVATE_KEY, signable.message)
            };
        }
    };
};

// The raw Cadence transaction text
const CADENCE_CONSUME = `
import FloatsTabManager from 0xf8d6e0586b0a20c7

transaction(merchantID: String, claimerAddress: Address, spentAmount: UFix64) {
    prepare(signer: auth(Storage) &Account) {
        FloatsTabManager.adminConsumeFloat(merchantID: merchantID, claimerAddress: claimerAddress, spentAmount: spentAmount)
    }
}
`;

const CADENCE_DEPOSIT = `
import FloatsTabManager from 0xf8d6e0586b0a20c7
import FlowToken from 0x0ae53cb6e3f42a79
import FungibleToken from 0xee82856bf20e2aa6

transaction(merchantID: String, sponsorAddress: Address, amount: UFix64) {
    prepare(signer: auth(Storage, BorrowValue) &Account) {
        // Find the Treasury FlowToken Vault with proper Withdraw Entitlements
        let treasuryVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow Treasury FlowToken Vault with Withdraw entitlement")

        // Physically extract the exact USDC/FlowToken fiat amount required from the Treasury reserve
        let extractedFunds <- treasuryVault.withdraw(amount: amount) 

        // Hand the physical funds to the FloatsTabManager to instantly mint the available floats
        FloatsTabManager.deposit(
            merchantID: merchantID,
            paymentVault: <-extractedFunds,
            sponsorAddress: sponsorAddress
        )
    }
}
`;

// Execute the transaction using pure NodeJS and FCL (No CLI dependency!)
async function consumeFloatJIT(merchantID, claimerAddress, spentAmount) {
  
  const formattedAmount = spentAmount.toFixed(2);
  console.log(`Executing Cadence JIT Consume for ${merchantID}: $${formattedAmount} via pure Node.js Payload...`);

  try {
    const transactionId = await fcl.mutate({
      cadence: CADENCE_CONSUME,
      args: (arg, t) => [
        arg(merchantID, t.String),
        arg(claimerAddress, t.Address),
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
    console.log(`Transaction successfully sealed on-chain!`);

    return transactionId;
  } catch (error) {
    console.error("FCL Consume Failed:", error);
    throw new Error(error);
  }
}

// Executes a fiat deposit on the blockchain by programmatically withdrawing from the Treasury
async function depositToTab(merchantID, sponsorAddress, amountAmount) {
  
  const formattedAmount = amountAmount.toFixed(2);
  console.log(`Executing Cadence Deposit for ${merchantID}: $${formattedAmount} by ${sponsorAddress} via pure Node.js Payload...`);

  try {
    const transactionId = await fcl.mutate({
      cadence: CADENCE_DEPOSIT,
      args: (arg, t) => [
        arg(merchantID, t.String),
        arg(sponsorAddress, t.Address),
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
  depositToTab
};
