const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { consumeFloatJIT } = require('../services/flow');

// This endpoint receives all webhooks from the Stripe Dashboard
router.post('/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Stripe requires the raw body to verify the cryptographic signature
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the specific "Tap to Pay" Virtual Card Authorization request
    if (event.type === 'issuing_authorization.request' || event.type === 'issuing_authorization.created') {
        const authorization = event.data.object;
        
        // 1. Get the requested amount in fiat cents (e.g. 1000 = $10.00)
        // pending_request may not exist on created events, so fallback to root amount
        const fiatAmount = (authorization.pending_request?.amount || authorization.amount) / 100;
        
        // 2. We identify the merchant by the Stripe Merchant ID or Name (simplifying for hackathon)
        const merchantID = authorization.merchant_data.name.replace(/\s+/g, ''); 
        
        // 3. ✨ MAGIC: Extract the User's Flow Wallet from the virtual card's metadata!
        const cardMetadata = authorization.card?.metadata || {};
        const patronFlowAddress = cardMetadata.flowAddress;

        if (!patronFlowAddress) {
            console.error("Authorization declined: Virtual card has no associated Flow Address.");
            return res.json({ approved: false });
        }

        try {
            console.log(`Stripe Issuing Request: ${patronFlowAddress} tapped card for $${fiatAmount} at ${merchantID}`);
            
            // 4. Trigger the Flow Blockchain JIT Consumption
            // If the user doesn't have an active receipt, this Cadence transaction will FAIL
            const txId = await consumeFloatJIT(merchantID, patronFlowAddress, fiatAmount);
            
            console.log(`Flow JIT Success! Transaction ID: ${txId}`);
            
            // 5. Reply to Stripe under 500ms: Approved! The fiat is now "owed" in Web3
            return res.json({ approved: true });

        } catch (error) {
            console.error(`Flow JIT Failed (Likely no receipt or expired): ${error.message}`);
            
            // Reply to Stripe: Declined! Insufficient Float Balance
            return res.json({ approved: false });
        }
    }

    // Fallback for other events
    res.json({ received: true });
});

module.exports = router;
