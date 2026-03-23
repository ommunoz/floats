const fcl = require('@onflow/fcl');
const { SHA3 } = require('sha3');
const EC = require('elliptic').ec;
const { execSync } = require('child_process');
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ec = new EC('p256');
const projectRoot = path.resolve(__dirname, '..');
const outputsDir = path.join(__dirname, 'outputs');
if (!existsSync(outputsDir)) {
    mkdirSync(outputsDir, { recursive: true });
}

// --- Emulator Setup ---
const SERVICE_ADDR = 'f8d6e0586b0a20c7';
const SERVICE_KEY = (process.env.EMULATOR_PRIVATE_KEY || '').replace(/^0x/, '').trim();

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
    for (const [name, addr] of Object.entries(ALIASES)) {
        content = content.replace(new RegExp(`import\\s+"${name}"`, 'g'), `import ${name} from ${addr}`);
    }
    return content;
};

// --- Test Data Inputs ---
const tabsInputPath = path.join(__dirname, 'inputs', 'tabs.json');
const rawTabsData = readFileSync(tabsInputPath, 'utf-8');
const tabs = JSON.parse(rawTabsData);

const usersInputPath = path.join(__dirname, 'inputs', 'users.json');
const actorsMeta = JSON.parse(readFileSync(usersInputPath, 'utf-8')).filter(u => !u.isDemoUser);
const demoUsersMeta = JSON.parse(readFileSync(usersInputPath, 'utf-8')).filter(u => u.isDemoUser);

// --- Helpers ---










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

    // 1. Programmatically initialize Bot Actors
    console.log(`Step 1: Synchronizing & Funding Bot Actors...`);
    const bots = []; // These stay in-memory only
    const usersMap = { [fcl.withPrefix(SERVICE_ADDR)]: { name: "Service Account", isDemoUser: false, gender: "other" } };
    
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
        process.stdout.write(`  🌱 Preparing Bot ${meta.name}... `);
        
        const keyPair = ec.genKeyPair();
        const priv = keyPair.getPrivate('hex');
        const pub = keyPair.getPublic('hex').slice(2);
        
        try {
            const output = execSync(`flow accounts create --key ${pub} --network emulator`, { encoding: 'utf8', stdio: 'pipe' });
            const addrMatch = output.match(/0x[a-fA-F0-9]+/);
            if (!addrMatch) throw new Error("Could not parse address from CLI output");
            const addr = fcl.withPrefix(addrMatch[0]);

            const txId = await fcl.mutate({
                cadence: fundTx,
                args: (arg, t) => [arg(addr, t.Address), arg("1000.0", t.UFix64)],
                proposer: serviceAuth,
                payer: serviceAuth,
                authorizations: [serviceAuth],
                limit: 1000
            });
            await fcl.tx(txId).onceSealed();

            bots.push({ ...meta, addr, key: priv });
            usersMap[addr] = { name: meta.name, isDemoUser: false, gender: meta.gender, avatarUrl: meta.avatarUrl };
            console.log(`✅ [${addr}] ($1000 Loaded)`);
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }

    // 1b. Initialize Demo User
    console.log(`\nStep 1b: Synchronizing Demo User...`);
    const demoUserActors = [];
    const demoAdminKeys = {}; // These WILL be exported
    const demoManagedCards = {};

    for (const meta of demoUsersMeta) {
        process.stdout.write(`  🌟 Preparing Demo User ${meta.name}... `);
        
        const keyPair = ec.genKeyPair();
        const priv = keyPair.getPrivate('hex');
        const pub = keyPair.getPublic('hex').slice(2);
        
        try {
            const output = execSync(`flow accounts create --key ${pub} --network emulator`, { encoding: 'utf8', stdio: 'pipe' });
            const addrMatch = output.match(/0x[a-fA-F0-9]+/);
            if (!addrMatch) throw new Error("Could not parse address from CLI output");
            const addr = fcl.withPrefix(addrMatch[0]);

            // Fund demo user
            const txId = await fcl.mutate({
                cadence: fundTx,
                args: (arg, t) => [arg(addr, t.Address), arg("1000.0", t.UFix64)],
                proposer: serviceAuth,
                payer: serviceAuth,
                authorizations: [serviceAuth],
                limit: 1000
            });
            await fcl.tx(txId).onceSealed();

            // Issue Stripe Virtual Card for Demo User
            console.log(`\n  💳 Issuing Stripe Card for ${meta.name}...`);
            const cardholder = await stripe.issuing.cardholders.create({
              name: meta.name,
              email: `${meta.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              phone_number: '+18880000000',
              status: 'active',
              type: 'individual',
              billing: { address: { line1: '123 Test St', city: 'SF', state: 'CA', postal_code: '94111', country: 'US' } },
            });

            const card = await stripe.issuing.cards.create({
              cardholder: cardholder.id,
              type: 'virtual',
              currency: 'usd',
              metadata: { flowAddress: addr }
            });

            demoUserActors.push({ ...meta, addr, key: priv, stripeCardId: card.id });
            usersMap[addr] = { name: meta.name, isDemoUser: true, stripeCardId: card.id, gender: meta.gender, avatarUrl: meta.avatarUrl };
            demoAdminKeys[addr] = priv;
            demoManagedCards[addr] = card.id;
            console.log(`  ✅ Demo [${addr}] ($1000 Loaded + Card Issued: ${card.id})`);
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }

    // Export internal debug data to /seed/outputs/
    writeFileSync(path.join(outputsDir, 'users.json'), JSON.stringify(usersMap, null, 2));

    // 2. Initialize Merchant Tabs
    console.log(`\nStep 2: Initializing Merchant Tabs...`);
    const createTabTx = getCadence('transactions/create_tab.cdc');
    for (const tab of tabs) {
        try {
            process.stdout.write(`  🏠 ${tab.merchantName}... `);
            const txId = await fcl.mutate({
                cadence: createTabTx,
                args: (arg, t) => [arg(tab.id, t.String), arg(tab.merchantId, t.String)],
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
        // Exctract seed logic explicitly from the separate object
        if (!tab.seedData) continue;
        const toClaim = tab.seedData.grabsToSimulate || 0;
        const currentAvail = tab.seedData.fundsToSimulate || 0;
        
        if (toClaim === 0 && currentAvail === 0) continue;

        console.log(`  👉 Activity for ${tab.merchantName}:`);
        
        let actions = [];
        const totalNeeded = toClaim + currentAvail;
        let fundedSoFar = 0;

        while (fundedSoFar < totalNeeded) {
            const remaining = totalNeeded - fundedSoFar;
            const chunkSize = Math.min(remaining, Math.floor(Math.random() * 4) + 1);
            
            actions.push({ type: 'fund', count: chunkSize });
            fundedSoFar += chunkSize;

            if (actions.length % 2 === 0 && actions.filter(a => a.type === 'claim').length < toClaim) {
                actions.push({ type: 'claim' });
            }
        }

        const currentClaims = actions.filter(a => a.type === 'claim').length;
        for (let i = 0; i < (toClaim - currentClaims); i++) {
            const pos = Math.floor(Math.random() * (actions.length - 1)) + 1;
            actions.splice(pos, 0, { type: 'claim' });
        }

        for (const action of actions) {
            const actor = bots[Math.floor(Math.random() * bots.length)];
            const value = tab.floatValue.toFixed(8);

            try {
                if (action.type === 'fund') {
                    const amount = (action.count * tab.floatValue).toFixed(8);
                    process.stdout.write(`    💰 ${actor.name} funding $${parseFloat(amount).toFixed(0)}... `);
                    const txId = await fcl.mutate({
                        cadence: depositTx,
                        args: (arg, t) => [
                            arg(tab.id, t.String), 
                            arg(actor.addr, t.Address),
                            arg(amount, t.UFix64)
                        ],
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

    // 4. Clean Migration to Frontend
    console.log(`\nStep 4: Copying Artifacts to Frontend...`);
    const frontendDataDir = path.join(projectRoot, 'frontend', 'src', 'data');
    if (!existsSync(frontendDataDir)) {
        mkdirSync(frontendDataDir, { recursive: true });
    }

    // Sanitize the inputs to ensure the Frontend respects our architecture (removing seedData entirely)
    const sanitizedTabs = tabs.map(t => {
        const copy = { ...t };
        delete copy.seedData;
        return copy;
    });

    writeFileSync(path.join(frontendDataDir, 'tabs.json'), JSON.stringify(sanitizedTabs, null, 2));
    writeFileSync(path.join(frontendDataDir, 'users.json'), JSON.stringify(usersMap, null, 2));
    
    console.log(`  📦 Exported sanitized tabs.json to frontend`);
    console.log(`  📦 Exported consolidated users.json to frontend`);

    // 5. Clean Migration to Backend
    console.log(`\nStep 5: Exporting Backend Credentials (DEMO USER ONLY)...`);
    const backendDataDir = path.join(projectRoot, 'backend', 'data');
    if (!existsSync(backendDataDir)) {
        mkdirSync(backendDataDir, { recursive: true });
    }
    
    writeFileSync(path.join(outputsDir, 'managed_keys.json'), JSON.stringify(demoAdminKeys, null, 2));
    writeFileSync(path.join(outputsDir, 'managed_cards.json'), JSON.stringify(demoManagedCards, null, 2));

    writeFileSync(path.join(backendDataDir, 'managed_keys.json'), JSON.stringify(demoAdminKeys, null, 2));
    writeFileSync(path.join(backendDataDir, 'managed_cards.json'), JSON.stringify(demoManagedCards, null, 2));
    console.log(`  📦 Exported clean managed_keys.json and managed_cards.json to backend/data/`);

    console.log(`\n🎉 SEEDING COMPLETE. Demo is live and configured cleanly.`);
}

seed().catch(console.error);
