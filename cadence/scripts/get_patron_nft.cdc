import "PatronageNFT"

// Struct for easy frontend JSON parsing
access(all) struct NFTData {
    access(all) let tier: UInt8
    access(all) let totalFunded: UFix64
    access(all) let floatsRedeemed: UInt64

    init(tier: UInt8, totalFunded: UFix64, floatsRedeemed: UInt64) {
        self.tier = tier
        self.totalFunded = totalFunded
        self.floatsRedeemed = floatsRedeemed
    }
}

access(all) fun main(sponsorAddress: Address, merchantID: String): NFTData? {
    let sponsorAccount = getAccount(sponsorAddress)
    
    if let collection = sponsorAccount.capabilities.get<&{PatronageNFT.CollectionPublic}>(/public/PatronageNFTCollection).borrow() {
        if let nft = collection.findNFTByMerchant(merchantID: merchantID) {
            return NFTData(
                tier: nft.tier,
                totalFunded: nft.totalFunded,
                floatsRedeemed: nft.floatsRedeemed
            )
        }
    }
    
    return nil
}
