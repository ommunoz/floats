import "FloatsTabManager"
import "FungibleToken"
import "FlowToken"

transaction(merchantID: String, amount: UFix64) {

    prepare(signer: auth(Storage, Capabilities) &Account) {
        
        // --- 1. Withdraw the physical tokens from the user's Flow wallet ---
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's FlowToken Vault!")
            
        let paymentVault <- vaultRef.withdraw(amount: amount)

        // --- 2. Physical Token Deposit ---
        // Pass the paymentVault containing actual FlowTokens directly into the contract.
        // The contract internally updates the native merchantSponsors Leaderboard.
        FloatsTabManager.deposit(merchantID: merchantID, paymentVault: <-paymentVault, sponsorAddress: signer.address)
    }

    execute {
        log("Deposited physical tokens to Tab and updated Patronage NFT for merchant: ".concat(merchantID))
    }
}
