import "FloatsTabManager"
import "PatronageNFT"

// This transaction is executed by the PROTOCOL TREASURY (Backend Server)
// when it receives a 'issuing_authorization.request' webhook from Stripe.
// It bypasses the need for the Patron's hardware wallet signature.
transaction(merchantID: String, claimerAddress: Address, spentAmount: UFix64) {

    prepare(signer: auth(Storage) &Account) {
        
        // 1. The Admin (Backend) consumes the float on behalf of the user
        FloatsTabManager.adminConsumeFloat(merchantID: merchantID, claimerAddress: claimerAddress, spentAmount: spentAmount)
        
        // 2. Log the redemption to level up the Active Sponsor's NFT Impact Score
        if let sponsorAddress = FloatsTabManager.activeSponsors[merchantID] {
            let sponsorAccount = getAccount(sponsorAddress)
            if let collectionCap = sponsorAccount.capabilities.get<&{PatronageNFT.CollectionPublic}>(/public/PatronageNFTCollection).borrow() {
                if let nft = collectionCap.findNFTByMerchant(merchantID: merchantID) {
                    PatronageNFT.logRedemption(collectionRef: collectionCap, nftID: nft.id)
                }
            }
        }
        
        log("Backend JIT Consumer Authorized: Successfully consumed Float at merchant: ".concat(merchantID))
    }

    execute {
    }
}
