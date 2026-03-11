import "FloatsTabManager"

// This transaction is executed by the PROTOCOL TREASURY (Backend Server)
// when it receives a 'issuing_authorization.request' webhook from Stripe.
// It bypasses the need for the Patron's hardware wallet signature.
transaction(merchantID: String, claimerAddress: Address, spentAmount: UFix64) {

    prepare(signer: auth(Storage) &Account) {
        
        // 1. The Admin (Backend) consumes the float on behalf of the user
        FloatsTabManager.adminConsumeFloat(merchantID: merchantID, claimerAddress: claimerAddress, spentAmount: spentAmount)
        
        log("Backend JIT Consumer Authorized: Successfully consumed Float at merchant: ".concat(merchantID))
    }

    execute {
    }
}
