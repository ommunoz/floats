import "FloatsTabManager"

// This transaction allows forcing a sweep of all active claims for a merchant, bypassing the timer
transaction(merchantID: String) {

    prepare(signer: auth(Storage) &Account) {
        // Just directly call our testing override
        FloatsTabManager.adminForceSweepAll(merchantID: merchantID)
        
        log("Force swept all floats for merchant: ".concat(merchantID))
    }

    execute {
    }
}
