const fcl = require('@onflow/fcl');

fcl.config({
  "accessNode.api": 'http://127.0.0.1:8888',
  "flow.network": 'emulator'
});

const CADENCE_GET_BALANCE = `
import FloatsTabManager from 0xf8d6e0586b0a20c7

access(all) fun main(merchantID: String): UFix64 {
    return FloatsTabManager.getBalance(merchantID: merchantID)
}
`;

async function checkBalance() {
  const merchantID = 'OmarCoffee';
  
  try {
    const balance = await fcl.query({
      cadence: CADENCE_GET_BALANCE,
      args: (arg, t) => [arg(merchantID, t.String)]
    });

    console.log(`🏦 Current Balance for ${merchantID}: $${balance}`);
  } catch (error) {
    console.error("Error reading balance:", error);
  }
}

checkBalance();
