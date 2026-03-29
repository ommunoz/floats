const express = require('express');
const router = express.Router();
const fcl = require('@onflow/fcl');
const { claimFloat, discardFloat } = require('../services/flow.js');
const path = require('path');
const fs = require('fs');
const { loadJsonData } = require('../lib/config');

// Claim a float from a tab
router.post('/claim', async (req, res) => {
    try {
        const { tabId, claimerAddress, amount } = req.body;
        
        if (!tabId || !claimerAddress || !amount) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Try environment variable or managed_keys.json via config utility
        const managedKeysPath = path.join(__dirname, '..', 'data', 'managed_keys.json');
        const managedKeys = loadJsonData('MANAGED_KEYS', managedKeysPath, {});
        
        const addr = fcl.withPrefix(claimerAddress);
        let privateKey = managedKeys[addr] || managedKeys[claimerAddress];
        
        // 2. Fallback to static flow.json accounts
        if (!privateKey) {
            const flowJsonPath = path.join(__dirname, '..', '..', 'flow.json');
            if (fs.existsSync(flowJsonPath)) {
                const flowJson = JSON.parse(fs.readFileSync(flowJsonPath, 'utf8'));
                for (const accountName in flowJson.accounts) {
                    const acc = flowJson.accounts[accountName];
                    if (acc.address === fcl.sansPrefix(claimerAddress)) {
                        privateKey = typeof acc.key === 'string' ? acc.key : acc.key.key;
                        break;
                    }
                }
            }
        }

        if (!privateKey) {
            console.error(`❌ Private key not found for address: ${claimerAddress}. Keys available:`, Object.keys(managedKeys));
            return res.status(404).json({ error: `Private key not found for address: ${claimerAddress}` });
        }

        const txId = await claimFloat(tabId, amount, claimerAddress, privateKey);
        
        res.json({ success: true, txId });
    } catch (error) {
        console.error("Claim API error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Discard (return) a float to the pool
router.post('/discard', async (req, res) => {
    try {
        const { tabId, claimerAddress } = req.body;
        
        if (!tabId || !claimerAddress) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Try environment variable or managed_keys.json via config utility
        const managedKeysPath = path.join(__dirname, '..', 'data', 'managed_keys.json');
        const managedKeys = loadJsonData('MANAGED_KEYS', managedKeysPath, {});

        const addr = fcl.withPrefix(claimerAddress);
        let privateKey = managedKeys[addr] || managedKeys[claimerAddress];

        // 2. Fallback to static flow.json accounts
        if (!privateKey) {
            const flowJsonPath = path.join(__dirname, '..', '..', 'flow.json');
            if (fs.existsSync(flowJsonPath)) {
                const flowJson = JSON.parse(fs.readFileSync(flowJsonPath, 'utf8'));
                for (const accountName in flowJson.accounts) {
                    const acc = flowJson.accounts[accountName];
                    if (acc.address === fcl.sansPrefix(claimerAddress)) {
                        privateKey = typeof acc.key === 'string' ? acc.key : acc.key.key;
                        break;
                    }
                }
            }
        }

        if (!privateKey) {
            return res.status(404).json({ error: `Private key not found for address: ${claimerAddress}` });
        }

        const txId = await discardFloat(claimerAddress, privateKey);
        
        res.json({ success: true, txId });
    } catch (error) {
        console.error("Discard API error details:", error);
        res.status(500).json({ 
            error: error.message || 'Internal server error during discard',
            details: error.toString()
        });
    }
});

module.exports = router;
