// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3001;

// We need raw bodies for Stripe Webhook Signature Verification
app.use(express.raw({ type: 'application/json' }));
app.use(cors());

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Floats Backend is active' });
});

// Import the webhook router
const webhooks = require('./routes/webhooks.js');
app.use('/api', webhooks);

app.listen(port, () => {
    console.log(`Floats Treasury Server listening on port ${port}`);
});
