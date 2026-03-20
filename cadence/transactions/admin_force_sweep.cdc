import "FloatsTabManager"

transaction(tabID: String) {
    prepare(signer: auth(Storage) &Account) {
        FloatsTabManager.adminForceSweepAll(tabID: tabID)
        log("Force Swept all active claims for Tab: ".concat(tabID))
    }
    execute {
    }
}
