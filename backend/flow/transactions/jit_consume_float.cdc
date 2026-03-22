import FloatsTabManager from 0xFLOATS_TAB_MANAGER

// This transaction is executed by the BACKEND signing as the MANAGED USER.
// It physically loads and destroys the @FloatReceipt from the user's storage,
// calling consumeFloat() which atomically updates the ledger AND destroys the resource.
// This prevents zombie receipts and makes the on-chain state the single source of truth.
transaction(tabID: String, spentAmount: UFix64) {

    prepare(signer: auth(Storage) &Account) {
        // Load the receipt from the user's storage. If it's not there, panic —
        // this should never happen for a valid, non-expired tap.
        let receipt <- signer.storage.load<@FloatsTabManager.FloatReceipt>(
            from: /storage/FloatReceiptClaim
        ) ?? panic("No FloatReceipt found in user storage. Cannot consume.")

        // Atomically: update ledger + destroy resource + emit FloatConsumed event
        FloatsTabManager.consumeFloat(receipt: <-receipt, spentAmount: spentAmount)

        log("JIT Consume complete. Receipt destroyed. Event emitted.")
    }

    execute {}
}
