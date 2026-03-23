const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const fs = require('fs');
const { registerPendingTap, cancelPendingTap } = require('../lib/tapRegistry');
const { registerPendingDeposit, cancelPendingDeposit } = require('../lib/depositRegistry');

router.post('/wait-for-deposit', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        if (!paymentIntentId) return res.status(400).json({ error: 'Missing paymentIntentId' });

        const depositPromise = registerPendingDeposit(paymentIntentId);
        const { txId } = await depositPromise;
        
        res.json({ success: true, txId });
    } catch (error) {
        cancelPendingDeposit(req.body?.paymentIntentId || '');
        res.status(500).json({ error: error.message });
    }
});

router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, merchantID, flowAddress } = req.body;

        if (!amount || !merchantID || !flowAddress) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // amount in cents
            currency: 'usd',
            // Allow the test mode checkout to be simplified
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                merchantID: merchantID,
                flowAddress: flowAddress
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Demo endpoint to simulate a physical NFC tap from the Virtual Card
router.post('/simulate-tap', async (req, res) => {
    try {
        const { merchantID, flowAddress, amount } = req.body;

        if (!merchantID || !flowAddress) {
            return res.status(400).json({ error: 'Missing required parameters (merchantID, flowAddress)' });
        }

        const centsAmount = amount ? Math.round(amount * 100) : 500; // default $5.00

        // 1. Check if we already have a pre-issued card for this user (data/managed_cards.json)
        const managedCardsPath = path.join(__dirname, '..', 'data', 'managed_cards.json');
        let cardId = null;

        if (fs.existsSync(managedCardsPath)) {
            const managedCards = JSON.parse(fs.readFileSync(managedCardsPath, 'utf8'));
            // Normalize address search (try with and without 0x)
            const addr = flowAddress.startsWith('0x') ? flowAddress : `0x${flowAddress}`;
            const altAddr = flowAddress.replace(/^0x/, '');
            cardId = managedCards[addr] || managedCards[altAddr];
            
            if (cardId) {
                console.log(`   ✅ Found pre-issued Card ID: ${cardId} for user ${addr}`);
            }
        }

        // 2. If no card found, fallback to on-demand creation (legacy behavior)
        if (!cardId) {
            console.log("   ⚠️  No pre-issued card found. Creating temporary cardholder/card...");
            const cardholder = await stripe.issuing.cardholders.create({
                name: 'Hackathon Tester',
                email: 'tester@example.com',
                phone_number: '+18880000000',
                status: 'active',
                type: 'individual',
                billing: { address: { line1: '123 Test St', city: 'SF', state: 'CA', postal_code: '94111', country: 'US' } },
            });

            const card = await stripe.issuing.cards.create({
                cardholder: cardholder.id,
                type: 'virtual',
                currency: 'usd',
                metadata: { flowAddress: flowAddress }
            });
            cardId = card.id;
        }

        console.log(`Simulating a $${(centsAmount/100).toFixed(2)} Card Tap at '${merchantID}'...`);

        // Register the pending tap BEFORE firing the Stripe auth,
        // so the webhook can resolve it even if it arrives very fast.
        const tapPromise = registerPendingTap(flowAddress);

        const auth = await stripe.testHelpers.issuing.authorizations.create({
            amount: centsAmount,
            currency: 'usd',
            card: cardId,
            merchant_data: {
                name: merchantID, 
                category: 'fast_food_restaurants',
                city: 'San Francisco',
                state: 'CA',
                country: 'US',
            }
        });

        console.log(`   ✅ Authorization sent to Stripe network. Waiting for webhook to seal on-chain...`);

        // Block until the webhook handler resolves this with a real txId.
        // The registry has its own 45s timeout which will reject if nothing arrives.
        const { txId } = await tapPromise;

        console.log(`   ✅ On-chain tx sealed: ${txId}`);
        res.json({ success: true, txId });
    } catch (error) {
        cancelPendingTap(req.body?.flowAddress || '');
        console.error("Tap simulation failed:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
