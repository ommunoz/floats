const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { consumeFloatJIT, depositToTab } = require('../services/flow');
const { resolvePendingTap, rejectPendingTap } = require('../lib/tapRegistry');

// This endpoint receives all webhooks from the Stripe Dashboard
router.post('/stripe', async (req, res) => {
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

            // Notify any waiting simulate-tap request with the sealed txId
            resolvePendingTap(patronFlowAddress, txId);
            
            // Reply to Stripe: Approved!
            return res.json({ approved: true });

        } catch (error) {
            console.error(`Flow JIT Failed (Likely no receipt or expired): ${error.message}`);
            
            // Reject the pending tap instantly so the frontend knows the tap failed
            rejectPendingTap(patronFlowAddress, error);
            
            // Reply to Stripe: Declined! Insufficient Float Balance
            return res.json({ approved: false });
        }
    }

    // --- NEW: Handle Fiat Deposits from Funders ---
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        
        // Ensure this payment was actually meant for funding a tab (check metadata)
        const merchantID = paymentIntent.metadata?.merchantID;
        const funderAddress = paymentIntent.metadata?.flowAddress;
        
        if (merchantID && funderAddress) {
            const fiatAmount = paymentIntent.amount / 100;
            console.log(`Stripe Deposit Received: $${fiatAmount} from ${funderAddress} for ${merchantID}`);
            
            try {
                // Trigger the Flow Blockchain JIT Deposit
                const txId = await depositToTab(merchantID, funderAddress, fiatAmount);
                console.log(`Flow Deposit Success! Transaction ID: ${txId}`);
            } catch (error) {
                console.error(`Flow Deposit Failed: ${error.message}`);
                // In production, you would trigger a Stripe refund here if the blockchain minting failed
            }
        }
    }

    // Fallback for other events
    res.json({ received: true });
});

module.exports = router;
