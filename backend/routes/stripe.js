const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

module.exports = router;
