import "FloatsTabManager"

// This transaction is intended to be called by a decentralized cron (Forte)
// Alternatively, it can be called by anyone willing to pay the gas to clean up.
transaction(merchantID: String) {

    prepare(signer: auth(Storage) &Account) {
        
        // 1. Ask the contract which active claims have expired for this tab
        let expiredAddresses = FloatsTabManager.getExpiredClaims(merchantID: merchantID)

        if expiredAddresses.length == 0 {
            log("No expired claims to sweep for merchant: ".concat(merchantID))
            return 
        }

        // 2. Loop through the expired addresses and tell the contract to reclaim the locked funds
        // Notice we don't need to read the User's storage at all! The contract handles it internally.
        for address in expiredAddresses {
            FloatsTabManager.sweepExpiredFloat(merchantID: merchantID, claimerAddress: address)
            log("Swept expired float for address: ".concat(address.toString()))
        }
        
        log("Sweep complete for merchant: ".concat(merchantID))
    }

    execute {
    }
}
