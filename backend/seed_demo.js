const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const tabsPath = path.join(projectRoot, 'frontend', 'src', 'data', 'tabs.json');
const tabs = JSON.parse(readFileSync(tabsPath, 'utf-8'));

function run(cmd) {
  return execSync(cmd, { cwd: projectRoot, encoding: 'utf-8', stdio: 'pipe' });
}

console.log(`🌱 Seeding Floats Demo State on Flow Emulator...`);
console.log(`Found ${tabs.length} tabs.\n`);

// --- Step 1: Create all tabs on-chain ---
console.log(`Step 1: Creating tabs`);
for (const tab of tabs) {
  try {
    process.stdout.write(`  → ${tab.merchantName} (${tab.id})... `);
    run(`flow transactions send ./cadence/transactions/create_tab.cdc "${tab.id}" --signer emulator-account --network emulator`);
    console.log(`✅`);
  } catch (error) {
    if (error.stderr && error.stderr.includes('Tab already exists')) {
      console.log(`⏭️  already exists.`);
    } else {
      console.log(`❌\n  ${error.stderr || error.message}`);
      process.exit(1);
    }
  }
}

// --- Step 2: Fund tabs to match mock health states ---
console.log(`\nStep 2: Funding tabs`);
for (const tab of tabs) {
  if (tab.healthStatus === 'empty') {
    console.log(`  → ${tab.merchantName}: skipped (empty)`);
    continue;
  }

  // Deposit for BOTH currently available floats AND the ones we are about to simulate consuming
  const totalFloatsToSeed = tab.floatsAvailable + tab.floatsGrabbed;
  const amount = (totalFloatsToSeed * tab.floatValue).toFixed(1);

  try {
    process.stdout.write(`  → ${tab.merchantName}: depositing ${amount} FLOW... `);
    run(`flow transactions send ./cadence/transactions/deposit_to_tab.cdc "${tab.id}" ${amount} --signer emulator-account --network emulator`);
    console.log(`✅`);
  } catch (error) {
    console.log(`❌\n  ${error.stderr || error.message}`);
    process.exit(1);
  }
}

// --- Step 3: Simulate claims/redemptions ---
console.log(`\nStep 3: Simulating redemptions`);
for (const tab of tabs) {
  if (tab.floatsGrabbed === 0) {
    console.log(`  → ${tab.merchantName}: 0 grabs needed`);
    continue;
  }

  process.stdout.write(`  → ${tab.merchantName}: simulating ${tab.floatsGrabbed} redemptions... `);
  const floatValueStr = tab.floatValue.toFixed(1);
  
  try {
    for (let i = 0; i < tab.floatsGrabbed; i++) {
        run(`flow transactions send ./cadence/transactions/claim_float.cdc "${tab.id}" ${floatValueStr} --signer emulator-account --network emulator`);
        run(`flow transactions send ./cadence/transactions/consume_float.cdc "${tab.id}" ${floatValueStr} --signer emulator-account --network emulator`);
    }
    console.log(`✅`);
  } catch (error) {
    console.log(`❌\n  ${error.stderr || error.message}`);
    process.exit(1);
  }
}

console.log(`\n✅ Demo seeded and ready.\n`);
