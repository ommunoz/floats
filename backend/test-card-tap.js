const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createAndTap() {
  console.log("1. Creating a fresh Stripe Cardholder...");
  const cardholder = await stripe.issuing.cardholders.create({
    name: 'Hackathon Tester',
    email: 'tester@example.com',
    phone_number: '+18880000000',
    status: 'active',
    type: 'individual',
    billing: { address: { line1: '123 Test St', city: 'SF', state: 'CA', postal_code: '94111', country: 'US' } },
  });

  console.log("2. Issuing a Virtual Card with Flow Metadata...");
  const card = await stripe.issuing.cards.create({
    cardholder: cardholder.id,
    type: 'virtual',
    currency: 'usd',
    metadata: {
      flowAddress: '0x179b6b1cb6755e31' // Your exact emulator-account!
    }
  });

  console.log(`   ✅ Card Issued! ID: ${card.id}`);

  console.log("3. Simulating a $1.00 Card Tap at 'OmarCoffee'...");
  const auth = await stripe.testHelpers.issuing.authorizations.create({
    amount: 100, // $1.00 in cents
    currency: 'usd',
    card: card.id, // We pass our specific metadata card!
    merchant_data: {
      name: 'OmarCoffee',
      category: 'fast_food_restaurants', // Stripe strictly requires text enums, not MCC integers
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
    }
  });
  
  console.log(`   ✅ Authorization sent to Visa/Stripe network! Watch your Server terminal!`);
}

createAndTap();
