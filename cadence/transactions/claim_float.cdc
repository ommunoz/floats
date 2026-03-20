import "FloatsTabManager"

transaction(tabID: String, amount: UFix64) {

    prepare(signer: auth(Storage, Capabilities) &Account) {
        
        // If the user already has a Receipt, handle the cleanup via the contract
        if let receiptRef = signer.storage.borrow<&FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim) {
            // Extract the old receipt
            let oldReceipt <- signer.storage.load<@FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim)!
            // Use the contract's discard function to cleanly return pending unspent funds back to the idle pool
            FloatsTabManager.discardReceipt(receipt: <-oldReceipt)
            log("Cleaned up an old Receipt from a previous session.")
        }

        // Call the public contract method to mint the new Data-Stamped Receipt
        let newReceipt <- FloatsTabManager.claimFloat(tabID: tabID, amount: amount, claimerAddress: signer.address)

        // Save the minted Receipt to the user's account storage
        signer.storage.save(<-newReceipt, to: /storage/FloatReceiptClaim)
        
        // --- NEW: THE PUBLIC UX LOCK ---
        // Expose the receipt data (amount, expiresAt) to the frontend without exposing the ability to withdraw it.
        signer.capabilities.unpublish(/public/FloatReceiptPublic) // cleanup old capability just in case
        let cap = signer.capabilities.storage.issue<&FloatsTabManager.FloatReceipt>(/storage/FloatReceiptClaim)
        signer.capabilities.publish(cap, at: /public/FloatReceiptPublic)

        log("Successfully claimed a Float for tab: ".concat(tabID))
    }

    execute {
    }
}
