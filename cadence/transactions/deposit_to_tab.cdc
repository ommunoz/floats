import "FloatsTabManager"
import "PatronageNFT"
import "FungibleToken"
import "FlowToken"

transaction(merchantID: String, amount: UFix64) {

    prepare(signer: auth(Storage, Capabilities) &Account) {
        
        // --- 1. Withdraw the physical tokens from the user's Flow wallet ---
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's FlowToken Vault!")
            
        let paymentVault <- vaultRef.withdraw(amount: amount)

        // --- 2. NFT Logic --- 
        // Check if the sponsor has a PatronageNFT Collection. If not, create and link one.
        if signer.storage.borrow<&PatronageNFT.Collection>(from: /storage/PatronageNFTCollection) == nil {
            signer.storage.save(<-PatronageNFT.createEmptyCollection(), to: /storage/PatronageNFTCollection)
            
            // Link the public interface so consumers can log redemptions
            signer.capabilities.unpublish(/public/PatronageNFTCollection)
            let cap = signer.capabilities.storage.issue<&PatronageNFT.Collection>(/storage/PatronageNFTCollection)
            signer.capabilities.publish(cap, at: /public/PatronageNFTCollection)
        }

        let collectionRef = signer.storage.borrow<&PatronageNFT.Collection>(from: /storage/PatronageNFTCollection)!

        // Check if they already have an NFT for this specific merchant.
        if let existingNFT = collectionRef.findNFTByMerchant(merchantID: merchantID) {
            PatronageNFT.updateFunding(collectionRef: collectionRef, nftID: existingNFT.id, amount: amount)
        } else {
            let newNFT <- PatronageNFT.mintNFT(merchantID: merchantID, sponsorAddress: signer.address)
            let initialId = newNFT.id
            collectionRef.deposit(token: <-newNFT)
            PatronageNFT.updateFunding(collectionRef: collectionRef, nftID: initialId, amount: amount)
        }

        // --- 3. Physical Token Deposit ---
        // Pass the paymentVault containing actual FlowTokens directly into the contract
        FloatsTabManager.deposit(merchantID: merchantID, paymentVault: <-paymentVault, sponsorAddress: signer.address)
    }

    execute {
        log("Deposited physical tokens to Tab and updated Patronage NFT for merchant: ".concat(merchantID))
    }
}
