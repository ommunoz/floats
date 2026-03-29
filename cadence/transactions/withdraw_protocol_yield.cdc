import "FloatsTabManager"
import "FungibleToken"
import "FlowToken"

// Withdraw the Treasury's earned protocol carry (yield only — never touches principal).
transaction(amount: UFix64) {
    
    let receiverRef: &{FungibleToken.Receiver}

    prepare(admin: auth(Storage, Capabilities) &Account) {
        // We assume the admin (Treasury) is receiving the Flow tokens
        self.receiverRef = admin.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow receiver reference to the admin's FlowToken Vault!")
    }

    execute {
        FloatsTabManager.withdrawProtocolYield(amount: amount, receiver: self.receiverRef)
        log("Successfully withdrew protocol yield (carry).")
    }
}
