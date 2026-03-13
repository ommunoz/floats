const fcl = require('@onflow/fcl');
const { SHA3 } = require('sha3');
const EC = require('elliptic').ec;
const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ec = new EC('p256');
const projectRoot = path.resolve(__dirname, '..');

// --- Emulator Setup ---
const SERVICE_ADDR = 'f8d6e0586b0a20c7';
const SERVICE_KEY = (process.env.EMULATOR_PRIVATE_KEY || '').replace(/^0x/, '').trim();

// Contract Addresses on Emulator
const ALIASES = {
    "FloatsTabManager": fcl.withPrefix(SERVICE_ADDR),
    "FungibleToken": "0xee82856bf20e2aa6",
    "FlowToken": "0x0ae53cb6e3f42a79"
};

fcl.config({
  "accessNode.api": 'http://127.0.0.1:8888',
  "flow.network": 'emulator'
});

const getCadence = (filename) => {
    let content = readFileSync(path.join(projectRoot, 'cadence', filename), 'utf8');
    // Replace import "Name" with import Name from 0xAddr
    // We only target the quoted versions to avoid recursion (the result has no quotes)
    for (const [name, addr] of Object.entries(ALIASES)) {
        content = content.replace(new RegExp(`import\\s+"${name}"`, 'g'), `import ${name} from ${addr}`);
    }
    return content;
};

// --- Test Data ---
const tabsPath = path.join(projectRoot, 'frontend', 'src', 'data', 'tabs.json');
const tabs = JSON.parse(readFileSync(tabsPath, 'utf-8'));

const actorsMeta = [
  { name: 'Omar Muñoz', isDemoUser: true },
  { name: 'Sarah Chen' },
  { name: 'Marcus Aurelius' },
  { name: 'Bastian Schwein' },
  { name: 'Toby Flenderson' },
  { name: 'Elena Gilbert' }
];

// --- FCL Signing Helpers ---
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

const authz = (address, privateKey) => async (account) => {
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

const serviceAuth = authz(SERVICE_ADDR, SERVICE_KEY);

// --- Execution ---
async function seed() {
    console.log(`\n🌊 Floats Demo Seeding Engine`);
    console.log(`------------------------------`);

    // 1. Programmatically initialize Actors
    console.log(`Step 1: Synchronizing & Funding Actors...`);
    const actors = [];
    const nameMap = { [fcl.withPrefix(SERVICE_ADDR)]: "Service Account" };
    
    const fundTx = `
    import FungibleToken from 0xee82856bf20e2aa6
    import FlowToken from 0x0ae53cb6e3f42a79
    transaction(recipient: Address, amount: UFix64) {
        prepare(signer: auth(BorrowValue, FungibleToken.Withdraw) &Account) {
            let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)!
            let receiver = getAccount(recipient).capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver).borrow()!
            receiver.deposit(from: <- vault.withdraw(amount: amount))
        }
    }`;

    for (const meta of actorsMeta) {
        process.stdout.write(`  🌱 Preparing ${meta.name}... `);
        
        const keyPair = ec.genKeyPair();
        const priv = keyPair.getPrivate('hex');
        const pub = keyPair.getPublic('hex').slice(2);
        
        try {
            // A. Create account via CLI
            const output = execSync(`flow accounts create --key ${pub} --network emulator`, { encoding: 'utf8', stdio: 'pipe' });
            const addrMatch = output.match(/0x[a-fA-F0-9]+/);
            if (!addrMatch) throw new Error("Could not parse address from CLI output");
            const addr = fcl.withPrefix(addrMatch[0]);

            // B. Fund account via FCL
            const txId = await fcl.mutate({
                cadence: fundTx,
                args: (arg, t) => [arg(addr, t.Address), arg("1000.0", t.UFix64)],
                proposer: serviceAuth,
                payer: serviceAuth,
                authorizations: [serviceAuth],
                limit: 1000
            });
            await fcl.tx(txId).onceSealed();

            actors.push({ ...meta, addr, key: priv });
            nameMap[addr] = meta.name;
            console.log(`✅ [${addr}] ($1000 Loaded)`);
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }

    // Update frontend mappings
    const namesPath = path.join(projectRoot, 'frontend', 'src', 'data', 'names.json');
    writeFileSync(namesPath, JSON.stringify(nameMap, null, 2));

    // Export the primary demo user (Omar Muñoz) to be used by the frontend for Stripe Flow
    const demoUserActor = actors.find(a => a.isDemoUser);
    const demoUserPath = path.join(projectRoot, 'frontend', 'src', 'data', 'demo_user.json');
    writeFileSync(demoUserPath, JSON.stringify({
      address: demoUserActor.addr,
      name: demoUserActor.name
    }, null, 2));

    // 2. Initialize Merchant Tabs
    console.log(`\nStep 2: Initializing Merchant Tabs...`);
    const createTabTx = getCadence('transactions/create_tab.cdc');
    for (const tab of tabs) {
        try {
            process.stdout.write(`  🏠 ${tab.merchantName}... `);
            const txId = await fcl.mutate({
                cadence: createTabTx,
                args: (arg, t) => [arg(tab.id, t.String)],
                proposer: serviceAuth,
                payer: serviceAuth,
                authorizations: [serviceAuth],
                limit: 1000
            });
            await fcl.tx(txId).onceSealed();
            console.log(`✅`);
        } catch (e) {
            if (e.message.indexOf('Tab already exists') !== -1) console.log(`⏭️`);
            else console.log(`❌ ERROR: ${e.message}`);
        }
    }

    // 3. Generating Organic Activity
    console.log(`\nStep 3: Generating Organic Activity...`);
    const depositTx = getCadence('transactions/deposit_to_tab.cdc');
    const claimTx = getCadence('transactions/claim_float.cdc');
    const consumeTx = getCadence('transactions/consume_float.cdc');

    for (const tab of tabs) {
        const toClaim = tab.floatsGrabbed;
        const currentAvail = tab.floatsAvailable;
        
        if (toClaim === 0 && currentAvail === 0) continue;

        console.log(`  👉 Activity for ${tab.merchantName}:`);
        
        let actions = [];
        const totalNeeded = toClaim + currentAvail;
        let fundedSoFar = 0;

        // Spread the funding into many small random chunks instead of one or two big drops
        while (fundedSoFar < totalNeeded) {
            // Pick a small chunk size (1 to 5 floats, i.e., $5 to $25)
            const remaining = totalNeeded - fundedSoFar;
            const chunkSize = Math.min(remaining, Math.floor(Math.random() * 4) + 1);
            
            actions.push({ type: 'fund', count: chunkSize });
            fundedSoFar += chunkSize;

            // Interleave some claims
            if (actions.length % 2 === 0 && actions.filter(a => a.type === 'claim').length < toClaim) {
                actions.push({ type: 'claim' });
            }
        }

        // Fill in any remaining claims
        const currentClaims = actions.filter(a => a.type === 'claim').length;
        for (let i = 0; i < (toClaim - currentClaims); i++) {
            // Insert claims at random positions instead of just appending
            const pos = Math.floor(Math.random() * (actions.length - 1)) + 1;
            actions.splice(pos, 0, { type: 'claim' });
        }

        for (const action of actions) {
            const communityActors = actors.filter(a => !a.isDemoUser);
            const actor = communityActors[Math.floor(Math.random() * communityActors.length)];
            const value = tab.floatValue.toFixed(8);

            try {
                if (action.type === 'fund') {
                    const amount = (action.count * tab.floatValue).toFixed(8);
                    process.stdout.write(`    💰 ${actor.name} funding $${parseFloat(amount).toFixed(0)}... `);
                    const txId = await fcl.mutate({
                        cadence: depositTx,
                        args: (arg, t) => [arg(tab.id, t.String), arg(amount, t.UFix64)],
                        proposer: authz(actor.addr, actor.key),
                        payer: authz(actor.addr, actor.key),
                        authorizations: [authz(actor.addr, actor.key)],
                        limit: 1000
                    });
                    await fcl.tx(txId).onceSealed();
                    console.log(`✅`);
                } else {
                    process.stdout.write(`    🏷️  ${actor.name} claiming $${parseFloat(value).toFixed(0)}... `);
                    const actorAuth = authz(actor.addr, actor.key);
                    
                    const claimTxId = await fcl.mutate({
                        cadence: claimTx,
                        args: (arg, t) => [arg(tab.id, t.String), arg(value, t.UFix64)],
                        proposer: actorAuth,
                        payer: actorAuth,
                        authorizations: [actorAuth],
                        limit: 1000
                    });
                    await fcl.tx(claimTxId).onceSealed();

                    const consumeTxId = await fcl.mutate({
                        cadence: consumeTx,
                        args: (arg, t) => [arg(tab.id, t.String), arg(value, t.UFix64)],
                        proposer: actorAuth,
                        payer: actorAuth,
                        authorizations: [actorAuth],
                        limit: 1000
                    });
                    await fcl.tx(consumeTxId).onceSealed();
                    console.log(`✅`);
                }
            } catch (e) {
                console.log(`❌ ERROR: ${e.message}`);
            }
        }
    }

    console.log(`\n🎉 SEEDING COMPLETE. Demo is live and organic.`);
}

seed().catch(console.error);
