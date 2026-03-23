/**
 * depositRegistry.js
 * 
 * Bridges the async gap between frontend /api/wait-for-deposit and
 * the Stripe webhook handler (fires after Stripe processes the payment).
 * 
 * wait-for-deposit  → registers a pending promise for the paymentIntentId
 * webhooks/stripe   → resolves it with the txId once on-chain tx is sealed
 * wait-for-deposit  → awaits the promise, returns { txId } to the frontend
 * frontend          → uses fcl.tx(txId).subscribe() to react when SEALED
 */

const pendingDeposits = new Map(); // paymentIntentId → { resolve, reject, timeoutId }

const REGISTRY_TIMEOUT_MS = 60_000; // 60s timeout for deposits

function registerPendingDeposit(paymentIntentId) {
    cancelPendingDeposit(paymentIntentId);

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            pendingDeposits.delete(paymentIntentId);
            reject(new Error(`Deposit registry timed out for ${paymentIntentId} after ${REGISTRY_TIMEOUT_MS}ms`));
        }, REGISTRY_TIMEOUT_MS);

        pendingDeposits.set(paymentIntentId, { resolve, reject, timeoutId });
        console.log(`[DepositRegistry] Registered pending deposit for ${paymentIntentId}`);
    });
}

function resolvePendingDeposit(paymentIntentId, txId) {
    const entry = pendingDeposits.get(paymentIntentId);
    if (entry) {
        clearTimeout(entry.timeoutId);
        pendingDeposits.delete(paymentIntentId);
        entry.resolve({ txId });
        console.log(`[DepositRegistry] Resolved deposit for ${paymentIntentId} → txId: ${txId}`);
        return true;
    }
    return false;
}

function rejectPendingDeposit(paymentIntentId, error) {
    const entry = pendingDeposits.get(paymentIntentId);
    if (entry) {
        clearTimeout(entry.timeoutId);
        pendingDeposits.delete(paymentIntentId);
        entry.reject(error);
        console.log(`[DepositRegistry] Rejected deposit for ${paymentIntentId} → error: ${error.message}`);
        return true;
    }
    return false;
}

function cancelPendingDeposit(paymentIntentId) {
    const entry = pendingDeposits.get(paymentIntentId);
    if (entry) {
        clearTimeout(entry.timeoutId);
        pendingDeposits.delete(paymentIntentId);
    }
}

module.exports = { registerPendingDeposit, resolvePendingDeposit, rejectPendingDeposit, cancelPendingDeposit };
