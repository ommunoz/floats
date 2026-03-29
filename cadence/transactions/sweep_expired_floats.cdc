import "FloatsTabManager"

transaction(tabID: String) {
    prepare(signer: auth(Storage) &Account) {
        FloatsTabManager.sweepExpiredFloats(tabID: tabID)
        log("Swept expired floats for Tab: ".concat(tabID))
    }
    execute {
    }
}
