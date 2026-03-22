// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Floats Backend is active' });
});

// Webhook route needs raw body for Stripe signature verification
// All other routes use normal JSON parsing
const webhooks = require('./routes/webhooks.js');
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooks);

// All other API routes use standard JSON parsing
app.use(express.json());

const stripeRoutes = require('./routes/stripe.js');
const flowRoutes = require('./routes/flow.js');

app.use('/api', stripeRoutes);
app.use('/api', flowRoutes);

app.listen(port, () => {
    console.log(`Floats Treasury Server listening on port ${port}`);
});
