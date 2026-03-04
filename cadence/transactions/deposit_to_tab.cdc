import "FloatsTabManager"

transaction(merchantID: String, amount: UFix64) {

    prepare(signer: &Account) {
        // Contract-level authorization for MVP demo.
    }

    execute {
        FloatsTabManager.deposit(merchantID: merchantID, amount: amount)
        log("Deposited funds to Tab for merchant: ".concat(merchantID))
    }
}
