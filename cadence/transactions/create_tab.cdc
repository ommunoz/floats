import "FloatsTabManager"

transaction(merchantID: String) {

    prepare(signer: &Account) {
        // Since we are using contract-level functions for the MVP, 
        // any signer acts as the admin in this demo setup.
        // Real-world would check an Admin resource for authorization.
    }

    execute {
        FloatsTabManager.createTab(merchantID: merchantID)
        log("Created new Tab for merchant: ".concat(merchantID))
    }
}
