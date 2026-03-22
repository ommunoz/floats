import FloatsTabManager from 0xFLOATS_TAB_MANAGER

// This transaction allows a user (or backend manager) to discard a Float Receipt.
// It is used for "Unclaiming" to return funds to the pool if a user changes their mind.
transaction() {

    prepare(signer: auth(Storage, Capabilities) &Account) {
        // --- BACKPACK UNWIRING ---
        // Remove the public link first
        signer.capabilities.unpublish(/public/FloatReceiptPublic)

        // Load the Receipt resource from storage
        if let receipt <- signer.storage.load<@FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim) {
            // Use the contract's discard function to cleanly handle both the registry and the resource
            FloatsTabManager.discardReceipt(receipt: <-receipt)
        }
    }

    execute {
    }
}
