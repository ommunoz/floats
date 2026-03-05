import "FloatsTabManager"

transaction(merchantID: String, amount: UFix64) {

    prepare(signer: auth(Storage) &Account) {
        
        // If the user already has a Receipt, let's see if the contract sweep will allow a new one
        if let receiptRef = signer.storage.borrow<&FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim) {
            
            // Try to sweep it first. If it's expired, the contract will eat it.
            // If it's not expired, this will panic and stop the double-claim.
            FloatsTabManager.sweepExpiredFloat(merchantID: merchantID, claimerAddress: signer.address)
            
            // If we didn't panic, it was expired and swept! We can now destroy our useless receipt.
            let uselessReceipt <- signer.storage.load<@FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim)
            destroy uselessReceipt

            log("Cleaned up an expired Receipt from a previous session.")
        }

        // Call the public contract method to mint the Receipt
        let newReceipt <- FloatsTabManager.claimFloat(merchantID: merchantID, amount: amount, claimerAddress: signer.address)

        // Save the minted Receipt to the user's account storage
        signer.storage.save(<-newReceipt, to: /storage/FloatReceiptClaim)
        
        log("Successfully claimed a Float for merchant: ".concat(merchantID))
    }

    execute {
    }
}
