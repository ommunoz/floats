/**
 * tapRegistry.js
 * 
 * Bridges the async gap between /api/simulate-tap (instant) and
 * the Stripe webhook handler (fires after Stripe processes the tap).
 * 
 * simulate-tap    → registers a pending promise for the address
 * webhooks/stripe → resolves it with the txId once on-chain tx is sealed
 * simulate-tap    → awaits the promise, returns { txId } to the frontend
 * frontend        → uses fcl.tx(txId).subscribe() to react when SEALED
 */

const pendingTaps = new Map(); // address → { resolve, reject, timeoutId }

const REGISTRY_TIMEOUT_MS = 45_000; // 45s: slightly more than the 30s frontend timeout

/**
 * Register a pending tap for a given Flow address.
 * Returns a Promise that resolves with { txId } or rejects on timeout.
 */
function registerPendingTap(flowAddress) {
    // Normalize to lowercase 0x-prefixed
    const addr = flowAddress.startsWith('0x') ? flowAddress.toLowerCase() : `0x${flowAddress}`.toLowerCase();

    // Cancel any existing pending tap for this address (e.g. double-click)
    cancelPendingTap(addr);

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            pendingTaps.delete(addr);
            reject(new Error(`Tap registry timed out for address ${addr} after ${REGISTRY_TIMEOUT_MS}ms`));
        }, REGISTRY_TIMEOUT_MS);

        pendingTaps.set(addr, { resolve, reject, timeoutId });
        console.log(`[TapRegistry] Registered pending tap for ${addr}`);
    });
}

/**
 * Called by the webhook handler after the on-chain tx seals.
 * Resolves the pending promise with the txId.
 */
function resolvePendingTap(flowAddress, txId) {
    const addr = flowAddress.startsWith('0x') ? flowAddress.toLowerCase() : `0x${flowAddress}`.toLowerCase();
    const entry = pendingTaps.get(addr);
    if (entry) {
        clearTimeout(entry.timeoutId);
        pendingTaps.delete(addr);
        entry.resolve({ txId });
        console.log(`[TapRegistry] Resolved tap for ${addr} → txId: ${txId}`);
        return true;
    }
    // No pending tap registered (e.g. real production tap, not simulated)
    return false;
}

/**
 * Cancels a pending tap — used to clean up on double-click or error.
 */
function cancelPendingTap(flowAddress) {
    const addr = flowAddress.startsWith('0x') ? flowAddress.toLowerCase() : `0x${flowAddress}`.toLowerCase();
    const entry = pendingTaps.get(addr);
    if (entry) {
        clearTimeout(entry.timeoutId);
        pendingTaps.delete(addr);
    }
}

/**
 * Rejects a pending tap immediately, propagating the error back to the frontend
 * without making it wait 30 seconds for a timeout.
 */
function rejectPendingTap(flowAddress, error) {
    const addr = flowAddress.startsWith('0x') ? flowAddress.toLowerCase() : `0x${flowAddress}`.toLowerCase();
    const entry = pendingTaps.get(addr);
    if (entry) {
        clearTimeout(entry.timeoutId);
        pendingTaps.delete(addr);
        entry.reject(error);
        console.log(`[TapRegistry] Rejected tap for ${addr} → error: ${error.message}`);
        return true;
    }
    return false;
}

module.exports = { registerPendingTap, resolvePendingTap, rejectPendingTap, cancelPendingTap };
