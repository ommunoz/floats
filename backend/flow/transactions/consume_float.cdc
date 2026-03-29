import FloatsTabManager from 0xFLOATS_TAB_MANAGER

transaction(tabID: String, spentAmount: UFix64) {

    prepare(signer: auth(Storage) &Account) {
        
        let receiptRef = signer.storage.borrow<&FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim)
            ?? panic("Could not load FloatReceipt resource. You do not have an active claim.")
            
        if receiptRef.tabID != tabID {
            panic("Tab ID mismatch! This Receipt cannot be used here.")
        }

        let receipt <- signer.storage.load<@FloatsTabManager.FloatReceipt>(from: /storage/FloatReceiptClaim)!
        FloatsTabManager.consumeFloat(receipt: <-receipt, spentAmount: spentAmount)
        
        log("Successfully consumed Float at tab: ".concat(tabID))
    }

    execute {
    }
}
