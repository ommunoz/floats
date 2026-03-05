access(all) contract PatronageNFT {

    // Total supply of NFTs minted
    access(all) var totalSupply: UInt64

    // The core Patronage NFT Resource
    access(all) resource NFT {
        access(all) let id: UInt64
        access(all) let merchantID: String
        access(all) let sponsorAddress: Address
        
        // Tier tracks total financial contribution (Deposit amount)
        access(all) var totalFunded: UFix64
        access(all) var tier: UInt8 

        // Impact tracks actual community response (Floats claimed/redeemed)
        access(all) var floatsRedeemed: UInt64

        init(id: UInt64, merchantID: String, sponsorAddress: Address) {
            self.id = id
            self.merchantID = merchantID
            self.sponsorAddress = sponsorAddress
            self.totalFunded = 0.0
            self.tier = 1 // 1: Bronze, 2: Silver, 3: Gold, 4: Platinum
            self.floatsRedeemed = 0
        }

        access(contract) fun addFunding(amount: UFix64) {
            self.totalFunded = self.totalFunded + amount
            self.recalculateTier()
        }

        access(contract) fun incrementRedeemed() {
            self.floatsRedeemed = self.floatsRedeemed + 1
        }

        access(contract) fun recalculateTier() {
            // Simple threshold logic for the MVP
            if self.totalFunded >= 500.0 {
                self.tier = 4 // Platinum
            } else if self.totalFunded >= 250.0 {
                self.tier = 3 // Gold
            } else if self.totalFunded >= 100.0 {
                self.tier = 2 // Silver
            } else {
                self.tier = 1 // Bronze
            }
        }
    }

    // Public interface to allow reading NFTs and passing them to admin functions
    access(all) resource interface CollectionPublic {
        access(all) fun deposit(token: @NFT)
        access(all) fun borrowNFT(id: UInt64): &NFT?
        access(all) fun findNFTByMerchant(merchantID: String): &NFT?
    }

    // A collection to hold a user's Patronage NFTs
    access(all) resource Collection: CollectionPublic {
        // dictionary of NFT id to NFT resource
        access(all) var ownedNFTs: @{UInt64: NFT}

        init() {
            self.ownedNFTs <- {}
        }

        // Add a new NFT to the collection
        access(all) fun deposit(token: @NFT) {
            self.ownedNFTs[token.id] <-! token
        }

        // Borrow a reference to a specific NFT
        access(all) fun borrowNFT(id: UInt64): &NFT? {
            return &self.ownedNFTs[id]
        }
        
        // Find an NFT by merchantID (since users likely only have 1 per merchant)
        access(all) fun findNFTByMerchant(merchantID: String): &NFT? {
            for key in self.ownedNFTs.keys {
                let ref = &self.ownedNFTs[key] as &NFT?
                if ref!.merchantID == merchantID {
                    return ref
                }
            }
            return nil
        }
    }

    // Public function to create a new empty collection
    access(all) fun createEmptyCollection(): @Collection {
        return <-create Collection()
    }

    // Admin function to mint a new NFT (restricted to contract/admin in prod)
    access(all) fun mintNFT(merchantID: String, sponsorAddress: Address): @NFT {
        let newNFT <- create NFT(id: self.totalSupply, merchantID: merchantID, sponsorAddress: sponsorAddress)
        self.totalSupply = self.totalSupply + 1
        return <-newNFT
    }
    
    // Admin functions to update existing NFTs (called by FloatsTabManager)
    access(all) fun updateFunding(collectionRef: &{CollectionPublic}, nftID: UInt64, amount: UFix64) {
        if let nftRef = collectionRef.borrowNFT(id: nftID) {
            nftRef.addFunding(amount: amount)
        }
    }

    access(all) fun logRedemption(collectionRef: &{CollectionPublic}, nftID: UInt64) {
        if let nftRef = collectionRef.borrowNFT(id: nftID) {
            nftRef.incrementRedeemed()
        }
    }

    init() {
        self.totalSupply = 0
    }
}
