import "FloatsTabManager"
import "PatronageNFT"

transaction(merchantID: String, amount: UFix64) {

    prepare(signer: auth(Storage, Capabilities) &Account) {
        
        // 1. Check if the sponsor has a PatronageNFT Collection. If not, create and link one.
        if signer.storage.borrow<&PatronageNFT.Collection>(from: /storage/PatronageNFTCollection) == nil {
            signer.storage.save(<-PatronageNFT.createEmptyCollection(), to: /storage/PatronageNFTCollection)
            
            // Link the public interface so consumers can log redemptions
            signer.capabilities.unpublish(/public/PatronageNFTCollection)
            let cap = signer.capabilities.storage.issue<&PatronageNFT.Collection>(/storage/PatronageNFTCollection)
            signer.capabilities.publish(cap, at: /public/PatronageNFTCollection)
        }

        let collectionRef = signer.storage.borrow<&PatronageNFT.Collection>(from: /storage/PatronageNFTCollection)!

        // 2. Check if they already have an NFT for this specific merchant.
        if let existingNFT = collectionRef.findNFTByMerchant(merchantID: merchantID) {
            // If yes, just update the total funding amount (increases Tier)
            PatronageNFT.updateFunding(collectionRef: collectionRef, nftID: existingNFT.id, amount: amount)
        } else {
            // If no, mint a brand new one and deposit it
            let newNFT <- PatronageNFT.mintNFT(merchantID: merchantID, sponsorAddress: signer.address)
            // Immediately add the funding amount to set initial tier
            let initialId = newNFT.id
            collectionRef.deposit(token: <-newNFT)
            PatronageNFT.updateFunding(collectionRef: collectionRef, nftID: initialId, amount: amount)
        }

        // 3. Finally, deposit the funds to the Tab Manager and register as the active sponsor
        FloatsTabManager.deposit(merchantID: merchantID, amount: amount, sponsorAddress: signer.address)
        
        log("Deposited funds to Tab and updated Patronage NFT for merchant: ".concat(merchantID))
    }

    execute {
    }
}
