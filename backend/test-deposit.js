const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function simulateDeposit() {
  console.log("1. Simulating a $50.00 'Funder' Deposit...");

  // In the real app, this happens when the user clicks 'Pay $50' on the Vue frontend Stripe Checkout
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 5000, 
    currency: 'usd',
    payment_method: 'pm_card_visa', // Stripe testing magic card
    confirm: true,
    return_url: 'http://localhost:3000/success',
    metadata: {
      merchantID: 'OmarCoffee',
      flowAddress: '0x179b6b1cb6755e31' // The Funder's real flow address!
    }
  });

  console.log(`   ✅ Payment Intent Succeeded! ID: ${paymentIntent.id}`);
  console.log(`   ✅ Stripe is now firing the webhook to your local server! Watch Terminal 2!`);
}

simulateDeposit();
