import "FloatsTabManager"

// This transaction is executed by the PROTOCOL TREASURY (Backend Server)
// when it receives a 'issuing_authorization.request' webhook from Stripe.
// It bypasses the need for the Patron's hardware wallet signature.
transaction(tabID: String, claimerAddress: Address, spentAmount: UFix64) {

    prepare(signer: auth(Storage) &Account) {
        FloatsTabManager.adminConsumeFloat(tabID: tabID, claimerAddress: claimerAddress, spentAmount: spentAmount)
        log("Backend JIT Consumer Authorized: Successfully consumed Float at tab: ".concat(tabID))
    }

    execute {
    }
}
