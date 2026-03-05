import "FloatsTabManager"

transaction(merchantID: String, spentAmount: UFix64) {

    prepare(signer: auth(Storage) &Account) {
        
        // 1. Borrow first to safely check without moving
        let receiptRef = signer.storage.borrow<&FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim)
            ?? panic("Could not load FloatReceipt resource. You do not have an active claim.")
            
        // Basic sanity check to save gas before calling the contract
        if receiptRef.merchantID != merchantID {
            panic("Merchant ID mismatch! This Receipt cannot be used here.")
        }

        // 2. Now extract it since we know it's the right one
        let receipt <- signer.storage.load<@FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim)!
        
        // Call the contract to actually consume the Float lock under the hood
        // If this panics (e.g. because it's expired), the entire transaction reverts 
        // and the receipt is put back in user's storage automatically.
        FloatsTabManager.consumeFloat(receipt: <-receipt, spentAmount: spentAmount)
        
        log("Successfully consumed Float at merchant: ".concat(merchantID))
    }

    execute {
    }
}
