import "YieldVault"

// Admin transaction to tune the YieldVault speed live during a demo
transaction(newFactor: UFix64) {
    prepare(signer: auth(Storage) &Account) {
        YieldVault.setAccelerator(newFactor: newFactor)
    }
    execute {
        log("Yield Accelerator tuned!")
    }
}
