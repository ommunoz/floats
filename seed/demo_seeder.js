const fcl = require('@onflow/fcl');
const { SHA3 } = require('sha3');
const EC = require('elliptic').ec;
const { execSync } = require('child_process');
const { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, readdirSync } = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ec = new EC('p256');
const projectRoot = path.resolve(__dirname, '..');
const outputsDir = path.join(__dirname, 'outputs');
const logosInputDir = path.join(__dirname, 'inputs', 'merchant-logos');
if (!existsSync(outputsDir)) {
    mkdirSync(outputsDir, { recursive: true });
}

// --- Network Config ---
const FLOW_NETWORK = process.env.FLOW_NETWORK || 'emulator';
const IS_TESTNET = FLOW_NETWORK === 'testnet';

const flowJsonPath = path.join(projectRoot, 'flow.json');
const flowJson = JSON.parse(readFileSync(flowJsonPath, 'utf8'));

const getNetworkConfig = (network) => {
    const isTestnet = network === 'testnet';
    const cliSigner = isTestnet ? 'floats-admin' : 'emulator-account';
    
    const accountConfig = flowJson.accounts[cliSigner];
    if (!accountConfig) {
        console.error(`❌ Account "${cliSigner}" not found in flow.json.`);
        process.exit(1);
    }

    const serviceAddr = accountConfig.address.replace(/^0x/, '');
    
    let serviceKey = '';
    const envKey = isTestnet ? process.env.TESTNET_ADMIN_PRIVATE_KEY : process.env.EMULATOR_PRIVATE_KEY;
    if (accountConfig.key && accountConfig.key.type === 'file') {
        const pkeyPath = path.join(projectRoot, accountConfig.key.location);
        if (existsSync(pkeyPath)) {
            serviceKey = readFileSync(pkeyPath, 'utf8').trim().replace(/^0x/, '');
        }
    }
    if (!serviceKey && envKey) {
        serviceKey = envKey.replace(/^0x/, '').trim();
    }

    const getAlias = (contractName) => {
        const c = flowJson.contracts[contractName];
        if (c && c.aliases && c.aliases[network]) {
            return c.aliases[network].replace(/^0x/, '');
        }
        return '';
    };

    let FloatsTabManagerAddr = '';
    if (flowJson.deployments && flowJson.deployments[network]) {
        for (const [acc, contracts] of Object.entries(flowJson.deployments[network])) {
            if (contracts.includes('FloatsTabManager')) {
                FloatsTabManagerAddr = flowJson.accounts[acc].address.replace(/^0x/, '');
                break;
            }
        }
    }

    return {
        accessNode: isTestnet ? 'https://rest-testnet.onflow.org' : 'http://127.0.0.1:8888',
        serviceAddr: serviceAddr,
        serviceKey: serviceKey,
        FloatsTabManager: FloatsTabManagerAddr || serviceAddr,
        FungibleToken: getAlias('FungibleToken'),
        FlowToken: getAlias('FlowToken'),
        botFundAmount: isTestnet ? '0.5' : '1000.0',
        cliNetwork: network,
        cliSigner: cliSigner,
    };
};

if (FLOW_NETWORK !== 'emulator' && FLOW_NETWORK !== 'testnet') {
    console.error(`❌ Unknown FLOW_NETWORK: "${FLOW_NETWORK}". Use "emulator" or "testnet".`);
    process.exit(1);
}

const NET = getNetworkConfig(FLOW_NETWORK);

const SERVICE_ADDR = NET.serviceAddr;
const SERVICE_KEY = NET.serviceKey;

const ALIASES = {
    "FloatsTabManager": fcl.withPrefix(NET.FloatsTabManager),
    "FungibleToken": fcl.withPrefix(NET.FungibleToken),
    "FlowToken": fcl.withPrefix(NET.FlowToken),
};

fcl.config({
    "accessNode.api": NET.accessNode,
    "flow.network": FLOW_NETWORK,
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
    console.log(`🌐 Network: ${FLOW_NETWORK.toUpperCase()}`);
    console.log(`🏛️  Service Account: 0x${SERVICE_ADDR}\n`);

    if (IS_TESTNET && !SERVICE_KEY) {
        console.error('❌ TESTNET_ADMIN_PRIVATE_KEY is not set in seed/.env');
        process.exit(1);
    }

    const fundTx = `
    import FungibleToken from ${fcl.withPrefix(NET.FungibleToken)}
    import FlowToken from ${fcl.withPrefix(NET.FlowToken)}
    transaction(recipient: Address, amount: UFix64) {
        prepare(signer: auth(BorrowValue, FungibleToken.Withdraw) &Account) {
            let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)!
            let receiver = getAccount(recipient).capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver).borrow()!
            receiver.deposit(from: <- vault.withdraw(amount: amount))
        }
    }`;

    // 1. Programmatically synchronize or initialize Bot Actors
    console.log(`Step 1: Synchronizing Bot Actors...`);
    const bots = [];
    const usersMap = { [fcl.withPrefix(SERVICE_ADDR)]: { name: "Service Account", isDemoUser: false, gender: "other" } };

    const botKeysPath = path.join(projectRoot, 'seed', 'outputs', `bot_keys_${FLOW_NETWORK}.json`);
    let savedBots = {};
    if (IS_TESTNET && existsSync(botKeysPath)) {
        savedBots = JSON.parse(readFileSync(botKeysPath, 'utf8'));
    }

    const newSavedBots = { ...savedBots };

    for (const meta of actorsMeta) {
        process.stdout.write(`  🌱 Checking Bot ${meta.name}... `);

        // Try to reuse existing account credentials to save time/funds
        if (savedBots[meta.name]) {
            const bot = savedBots[meta.name];
            bots.push({ ...meta, addr: bot.addr, key: bot.key });
            usersMap[bot.addr] = { name: meta.name, isDemoUser: false, gender: meta.gender, avatarUrl: meta.avatarUrl };
            console.log(`✅ [${bot.addr}] (Reused)`);
            continue;
        }

        const keyPair = ec.genKeyPair();
        const priv = keyPair.getPrivate('hex');
        const pub = keyPair.getPublic('hex').slice(2);

        try {
            const output = execSync(
                `flow accounts create --key ${pub} --network ${NET.cliNetwork} --signer ${NET.cliSigner}`,
                { encoding: 'utf8', stdio: 'pipe', cwd: projectRoot }
            );
            const addrMatch = output.match(/0x[a-fA-F0-9]+/);
            if (!addrMatch) throw new Error("Could not parse address from CLI output");
            const addr = fcl.withPrefix(addrMatch[0]);

            // Just a tiny storage deposit so they exist
            const txId = await fcl.mutate({
                cadence: fundTx,
                args: (arg, t) => [arg(addr, t.Address), arg(NET.botFundAmount, t.UFix64)],
                proposer: serviceAuth,
                payer: serviceAuth,
                authorizations: [serviceAuth],
                limit: 1000
            });
            await fcl.tx(txId).onceSealed();

            const botEntry = { addr, key: priv };
            bots.push({ ...meta, ...botEntry });
            newSavedBots[meta.name] = botEntry;
            usersMap[addr] = { name: meta.name, isDemoUser: false, gender: meta.gender, avatarUrl: meta.avatarUrl };
            console.log(`✅ [${addr}] (Created)`);
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }

    // Save the new state for next run
    if (!existsSync(path.dirname(botKeysPath))) mkdirSync(path.dirname(botKeysPath), { recursive: true });
    writeFileSync(botKeysPath, JSON.stringify(newSavedBots, null, 2));

    // 1b. Initialize or Synchronize Demo User
    console.log(`\nStep 1b: Synchronizing Demo User...`);
    const demoUserSettingsPath = path.join(projectRoot, 'seed', 'outputs', `demo_user_${FLOW_NETWORK}.json`);
    let savedDemo = {};
    if (IS_TESTNET && existsSync(demoUserSettingsPath)) {
        savedDemo = JSON.parse(readFileSync(demoUserSettingsPath, 'utf8'));
    }

    const demoUserActors = [];
    const demoAdminKeys = {};
    const demoManagedCards = {};

    for (const meta of demoUsersMeta) {
        process.stdout.write(`  🌟 Preparing Demo User ${meta.name}... `);
        
        if (savedDemo[meta.name]) {
            const d = savedDemo[meta.name];
            demoUserActors.push({ ...meta, addr: d.addr, key: d.key });
            demoAdminKeys[d.addr] = d.key;
            demoManagedCards[d.addr] = d.cardId;
            usersMap[d.addr] = { name: meta.name, isDemoUser: true, stripeCardId: d.cardId, gender: meta.gender, avatarUrl: meta.avatarUrl };
            console.log(`✅ [${d.addr}] (Reused + Card: ${d.cardId})`);
            continue;
        }

        const keyPair = ec.genKeyPair();
        const priv = keyPair.getPrivate('hex');
        const pub = keyPair.getPublic('hex').slice(2);

        try {
            const output = execSync(
                `flow accounts create --key ${pub} --network ${NET.cliNetwork} --signer ${NET.cliSigner}`,
                { encoding: 'utf8', stdio: 'pipe', cwd: projectRoot }
            );
            const addrMatch = output.match(/0x[a-fA-F0-9]+/);
            if (!addrMatch) throw new Error("Could not parse address from CLI output");
            const addr = fcl.withPrefix(addrMatch[0]);

            const txId = await fcl.mutate({
                cadence: fundTx,
                args: (arg, t) => [arg(addr, t.Address), arg(NET.botFundAmount, t.UFix64)],
                proposer: serviceAuth,
                payer: serviceAuth,
                authorizations: [serviceAuth],
                limit: 1000
            });
            await fcl.tx(txId).onceSealed();

            console.log(`\n    💳 Issuing Stripe Card for ${meta.name}...`);
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

            savedDemo[meta.name] = { addr, key: priv, cardId: card.id };
            demoUserActors.push({ ...meta, addr, key: priv });
            demoAdminKeys[addr] = priv;
            demoManagedCards[addr] = card.id;
            usersMap[addr] = { name: meta.name, isDemoUser: true, stripeCardId: card.id, gender: meta.gender, avatarUrl: meta.avatarUrl };
            console.log(`    ✅ [${addr}] (Created + Card: ${card.id})`);
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }
    writeFileSync(demoUserSettingsPath, JSON.stringify(savedDemo, null, 2));

    writeFileSync(path.join(outputsDir, `users_${FLOW_NETWORK}.json`), JSON.stringify(usersMap, null, 2));

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

    // 3. Generating Organic Activity (PARALLEL ENGINE)
    console.log(`\nStep 3: Generating Organic Activity (Parallel Engine Activated)...`);
    const depositTx = getCadence('transactions/fund_tab.cdc');
    const claimTx = getCadence('transactions/claim_float.cdc');
    const consumeTx = getCadence('transactions/consume_float.cdc');

    for (const tab of tabs) {
        if (!tab.seedData) continue;
        const toClaim = tab.seedData.grabsToSimulate || 0;
        const currentAvail = tab.seedData.fundsToSimulate || 0;
        if (toClaim === 0 && currentAvail === 0) continue;

        console.log(`\n  🏎️  Starting High-Speed Simulation for ${tab.merchantName}:`);

        // --- 1. Interleaved Logic for Natural History ---
        let actions = [];
        const toFund = toClaim + currentAvail;
        let fundedSoFar = 0;
        while (fundedSoFar < toFund) {
            const chunkSize = Math.min(toFund - fundedSoFar, Math.floor(Math.random() * 4) + 1);
            actions.push({ type: 'fund', count: chunkSize });
            fundedSoFar += chunkSize;
            // Interleave a claim every couple of fundings for the "vibe"
            if (actions.length % 2 === 0 && actions.filter(a => a.type === 'claim').length < toClaim) {
                actions.push({ type: 'claim' });
            }
        }
        // Fill remaining claims
        const currentClaimsCount = actions.filter(a => a.type === 'claim').length;
        for (let i = 0; i < (toClaim - currentClaimsCount); i++) {
            actions.splice(Math.floor(Math.random() * actions.length), 0, { type: 'claim' });
        }

        // --- 2. Parallel Batching Logic ---
        console.log(`    📦 Simulating community activity in parallel streams...`);
        for (let i = 0; i < actions.length; i += 5) {
            const batch = actions.slice(i, i + 5);
            await Promise.all(batch.map(async (action, index) => {
                const actor = bots[index % bots.length];
                const value = tab.floatValue.toFixed(8);
                const actorAuth = authz(actor.addr, actor.key);

                try {
                    if (action.type === 'fund') {
                        const amount = (action.count * tab.floatValue).toFixed(8);
                        const fundTx = await fcl.mutate({
                            cadence: depositTx,
                            args: (arg, t) => [arg(tab.id, t.String), arg(actor.addr, t.Address), arg(amount, t.UFix64)],
                            proposer: actorAuth,
                            payer: serviceAuth,
                            authorizations: [serviceAuth],
                            limit: 1000
                        });
                        await fcl.tx(fundTx).onceSealed();
                        console.log(`      ✅  ${actor.name} funded $${parseFloat(amount).toFixed(0)}`);
                    } else {
                        // Tiny delay for claims in the same batch to prevent race conditions
                        await new Promise(r => setTimeout(r, 1000));
                        const claimTxId = await fcl.mutate({
                            cadence: claimTx,
                            args: (arg, t) => [arg(tab.id, t.String), arg(value, t.UFix64)],
                            proposer: actorAuth,
                            payer: serviceAuth,
                            authorizations: [actorAuth],
                            limit: 1000
                        });
                        await fcl.tx(claimTxId).onceSealed();

                        await fcl.mutate({
                            cadence: consumeTx,
                            args: (arg, t) => [arg(tab.id, t.String), arg(value, t.UFix64)],
                            proposer: actorAuth,
                            payer: serviceAuth,
                            authorizations: [actorAuth],
                            limit: 1000
                        }).then(tx => fcl.tx(tx).onceSealed());
                        
                        console.log(`      ✅  ${actor.name} grabbed a $${parseFloat(value).toFixed(0)} float`);
                    }
                } catch (e) {
                    console.error(`      ❌ Activity failed for ${actor.name}: ${e.message}`);
                }
            }));
        }
    }

    // 4. Clean Migration to Frontend
    console.log(`\nStep 4: Copying Artifacts to Frontend...`);
    const frontendDataDir = path.join(projectRoot, 'frontend', 'src', 'data');
    if (!existsSync(frontendDataDir)) {
        mkdirSync(frontendDataDir, { recursive: true });
    }

    const frontendPublicLogosDir = path.join(projectRoot, 'frontend', 'public', 'merchant-logos');
    if (existsSync(logosInputDir)) {
        mkdirSync(frontendPublicLogosDir, { recursive: true });
        cpSync(logosInputDir, frontendPublicLogosDir, { recursive: true });
        const copied = readdirSync(frontendPublicLogosDir);
        console.log(`  🖼️  Copied ${copied.length} merchant logo(s) to frontend/public/merchant-logos/`);
    } else {
        console.log(`  ⚠️  No merchant-logos folder found, skipping logo copy`);
    }

    const sanitizedTabs = tabs.map(t => {
        const copy = { ...t };
        delete copy.seedData;
        const logoFile = path.join(logosInputDir, `${t.id}.png`);
        copy.merchantLogo = existsSync(logoFile)
            ? `/merchant-logos/${t.id}.png`
            : `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(t.id)}`;
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

    writeFileSync(path.join(outputsDir, `managed_keys_${FLOW_NETWORK}.json`), JSON.stringify(demoAdminKeys, null, 2));
    writeFileSync(path.join(outputsDir, `managed_cards_${FLOW_NETWORK}.json`), JSON.stringify(demoManagedCards, null, 2));

    writeFileSync(path.join(backendDataDir, 'managed_keys.json'), JSON.stringify(demoAdminKeys, null, 2));
    writeFileSync(path.join(backendDataDir, 'managed_cards.json'), JSON.stringify(demoManagedCards, null, 2));
    console.log(`  📦 Exported clean managed_keys.json and managed_cards.json to backend/data/`);

    console.log(`\n🎉 SEEDING COMPLETE. Demo is live and configured cleanly.`);
}

seed().catch(console.error);
