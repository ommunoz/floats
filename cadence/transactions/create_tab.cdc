import "FloatsTabManager"

transaction(tabID: String, merchantID: String) {
    prepare(signer: auth(Storage) &Account) {
        FloatsTabManager.createTab(tabID: tabID, merchantID: merchantID)
        log("Created Tab: ".concat(tabID))
    }
    execute {
    }
}
