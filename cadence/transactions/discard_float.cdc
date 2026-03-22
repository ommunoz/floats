import "FloatsTabManager"

transaction() {

    prepare(signer: auth(Storage) &Account) {
        
        // Load the Receipt resource from the specific storage path
        if let receipt <- signer.storage.load<@FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim) {
            
            // Pass the physical resource to the contract for destruction and registry cleanup
            // This handles returning funds if they are still there, or just destroying the "hollow" receipt.
            FloatsTabManager.discardReceipt(receipt: <-receipt)
            
            log("Successfully discarded the Float Receipt.")
        } else {
            // If the resource isn't there, there's nothing for the user to discard.
            // In a production app, we might check if a "zombie" record still exists in the contract,
            // but usually the receipt is the source of truth for the user's active state.
            log("No Receipt found in storage to discard.")
        }
    }

    execute {
    }
}
