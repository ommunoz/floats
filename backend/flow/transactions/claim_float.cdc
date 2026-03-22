import FloatsTabManager from 0xFLOATS_TAB_MANAGER

// This transaction allows a user to claim an available Float from a Merchant Tab.
// It uses "Lazy Harvesting" logic: if the user has an existing receipt (even expired),
// it is automatically discarded to clear up the storage slot and registry.
transaction(tabID: String, amount: UFix64) {

    prepare(signer: auth(Storage, Capabilities) &Account) {
        // --- CLEANUP ---
        // If the user has a receipt (alive OR dead), we must clear it first
        if let receipt <- signer.storage.load<@FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim) {
            // Use the contract's discard function to clean up BOTH storage and registry
            FloatsTabManager.discardReceipt(receipt: <-receipt)
        }

        // --- CLAIM ---
        // Call the public contract method to mint the new Receipt
        let newReceipt <- FloatsTabManager.claimFloat(tabID: tabID, amount: amount, claimerAddress: signer.address)

        // Save the minted Receipt to the user's account storage
        signer.storage.save(<-newReceipt, to: /storage/FloatReceiptClaim)

        // --- BACKPACK WIRING ---
        // Unpublish any stale capability first (e.g. left over after a JIT consume
        // which destroys the resource but cannot remove the published capability).
        signer.capabilities.unpublish(/public/FloatReceiptPublic)

        // Issue a fresh public capability so scripts/frontend can see the receipt
        let cap = signer.capabilities.storage.issue<&FloatsTabManager.FloatReceipt>(/storage/FloatReceiptClaim)
        signer.capabilities.publish(cap, at: /public/FloatReceiptPublic)
    }

    execute {
    }
}
