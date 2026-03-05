import "YieldVault"

access(all) contract FloatsTabManager {
        
    // Dictionary mapping merchantID to their funded balance
    access(all) var merchantBalances: {String: UFix64}
    
    // Dictionary mapping merchantID to their active status
    access(all) var activeFlags: {String: Bool}

    // Dictionary tracking total accrued yield per merchant
    access(all) var merchantYields: {String: UFix64}

    // Single-sponsor tracking for the Hackathon MVP (FIFO assumption)
    access(all) var activeSponsors: {String: Address}

    // Registry tracking the actual locked funds for claimed floats
    // Structure: activeFloats[merchantID][claimerAddress] = FloatData
    access(all) var activeFloats: {String: {Address: FloatData}}

    // Struct to hold the actual value of a claimed Float inside the contract
    access(all) struct FloatData {
        access(all) let amount: UFix64
        access(all) let expiresAt: UFix64

        init(amount: UFix64, expiresAt: UFix64) {
            self.amount = amount
            self.expiresAt = expiresAt
        }
    }

    // Admin function to create a new Tab for a merchant
    // (For MVP, using contract level. Real world would use AuthAccount or Admin resource)
    access(all) fun createTab(merchantID: String) {
        pre {
            self.merchantBalances[merchantID] == nil: "Tab already exists for this merchantID"
        }
        // Initialize with 0.0 balance, set active, and initialize empty claims list
        self.merchantBalances[merchantID] = 0.0
        self.activeFlags[merchantID] = true
        self.activeFloats[merchantID] = {}
        self.merchantYields[merchantID] = 0.0
    }

    // Admin function to deposit funds into a merchant's Tab
    access(all) fun deposit(merchantID: String, amount: UFix64, sponsorAddress: Address) {
        pre {
            self.merchantBalances[merchantID] != nil: "Tab does not exist for this merchantID"
        }
        // Add the deposited amount to the existing balance and calculate yield
        self.updateTabBalanceAndYield(merchantID: merchantID, newBalance: self.merchantBalances[merchantID]! + amount)
        
        // Track the sponsor so consumers know who to credit for NFT Impact scores
        self.activeSponsors[merchantID] = sponsorAddress
    }

    // Admin function to toggle the active status of a Tab
    access(all) fun toggleActive(merchantID: String, active: Bool) {
        pre {
            self.activeFlags[merchantID] != nil: "Tab does not exist for this merchantID"
        }
        self.activeFlags[merchantID] = active
    }

    // Public read function to get the current balance of a merchant's Tab
    access(all) fun getBalance(merchantID: String): UFix64 {
        if let balance = self.merchantBalances[merchantID] {
            return balance
        }
        return 0.0
    }

    // Public read function to check if a merchant's Tab is active
    access(all) fun isActive(merchantID: String): Bool {
        if let active = self.activeFlags[merchantID] {
            return active
        }
        return false
    }

    // Helper function to update yield whenever the tab balance changes securely
    access(contract) fun updateTabBalanceAndYield(merchantID: String, newBalance: UFix64) {
        let accrued = YieldVault.updatePrincipal(merchantID: merchantID, newPrincipal: newBalance)
        if self.merchantYields[merchantID] != nil {
            self.merchantYields[merchantID] = self.merchantYields[merchantID]! + accrued
        } else {
            self.merchantYields[merchantID] = accrued
        }
        self.merchantBalances[merchantID] = newBalance
    }

    // The Receipt primitive: A non-valuable token proving the user initiated a claim
    access(all) resource FloatReceipt {
        access(all) let merchantID: String
        access(all) let claimerAddress: Address

        init(merchantID: String, claimerAddress: Address) {
            self.merchantID = merchantID
            self.claimerAddress = claimerAddress
        }
    }

    // Neighbor claims a Float from the Tab
    access(all) fun claimFloat(merchantID: String, amount: UFix64, claimerAddress: Address): @FloatReceipt {
        pre {
            self.activeFlags[merchantID] == true: "Tab is not active"
            self.merchantBalances[merchantID] != nil: "Tab does not exist"
            self.merchantBalances[merchantID]! >= amount: "Insufficient Tab balance"
            self.activeFloats[merchantID]![claimerAddress] == nil: "Neighbor already has an active claim for this merchant"
        }

        // 1. Deduct from the Tab balance (lock the funds)
        self.updateTabBalanceAndYield(merchantID: merchantID, newBalance: self.merchantBalances[merchantID]! - amount)

        // 2. Calculate Expiration
        let expiration = getCurrentBlock().timestamp + 900.0

        // 3. Store the actual value in the contract's registry
        let floatData = FloatData(amount: amount, expiresAt: expiration)
        self.activeFloats[merchantID]!.insert(key: claimerAddress, floatData)

        // 4. Mint and return the valueless Receipt resource to the user
        return <-create FloatReceipt(merchantID: merchantID, claimerAddress: claimerAddress)
    }

    // Consume or Expire a Float, returning unused funds to the Tab
    access(all) fun consumeFloat(receipt: @FloatReceipt, spentAmount: UFix64) {
        let merchantID = receipt.merchantID
        let claimerAddress = receipt.claimerAddress
        
        // Assert the FloatData exists in the contract (cannot be in pre-block safely in older Cadence)
        let floatData = self.activeFloats[merchantID]![claimerAddress] 
            ?? panic("No active float found for this receipt. It may have expired and been swept.")

        // Now run the safe pre-conditions on the loaded data
        // In Cadence 1.0, assertions are sometimes cleaner than strict pre-blocks when mixing with dict unwrapping 
        assert(spentAmount <= floatData.amount, message: "Cannot spend more than the Float's maxAmount")
        assert(floatData.expiresAt >= getCurrentBlock().timestamp, message: "Float is expired!")

        // Remove from the Active Floats registry
        self.activeFloats[merchantID]!.remove(key: claimerAddress)

        // Calculate unspent amount to return
        let unspent = floatData.amount - spentAmount

        // Return unspent amount to the merchant's Tab pool
        self.updateTabBalanceAndYield(merchantID: merchantID, newBalance: self.merchantBalances[merchantID]! + unspent)

        // Destroy the receipt
        destroy receipt
    }

    // Public method for Forte (or anyone) to sweep a specific expired float
    // Note: We don't need the user's Receipt to do this! We just clean up the contract's accounting.
    access(all) fun sweepExpiredFloat(merchantID: String, claimerAddress: Address) {
        
        if let floatData = self.activeFloats[merchantID]![claimerAddress] {
            
            if floatData.expiresAt < getCurrentBlock().timestamp {
                // Remove it from the registry
                self.activeFloats[merchantID]!.remove(key: claimerAddress)

                // Return the FULL locked amount back to the merchant's Tab
                self.updateTabBalanceAndYield(merchantID: merchantID, newBalance: self.merchantBalances[merchantID]! + floatData.amount)
            } else {
                panic("Float is not yet expired!")
            }
        }
        // If it's already nil, it was already swept or consumed.
        // We do NOT panic here, so that users can clean up dead Receipts in their wallets.
    }

    // For Hackathon/Testing: Admin can force sweep all floats without waiting for them to expire
    // In a real app, this would be protected by an AdminAuth resource. We keep it public for MVP.
    access(all) fun adminForceSweepAll(merchantID: String) {
        if let floats = self.activeFloats[merchantID] {
            for address in floats.keys {
                let amount = floats[address]!.amount
                // Remove it from the registry
                self.activeFloats[merchantID]!.remove(key: address)
                // Return the FULL locked amount back to the merchant's Tab
                self.updateTabBalanceAndYield(merchantID: merchantID, newBalance: self.merchantBalances[merchantID]! + amount)
            }
        }
    }

    // Public method for Forte to query expired addresses to sweep
    access(all) fun getExpiredClaims(merchantID: String): [Address] {
        let expired: [Address] = []
        if let floats = self.activeFloats[merchantID] {
            let now = getCurrentBlock().timestamp
            for address in floats.keys {
                if floats[address]!.expiresAt < now {
                    expired.append(address)
                }
            }
        }
        return expired
    }

    init() {
        self.merchantBalances = {}
        self.activeFlags = {}
        self.activeFloats = {}
        self.merchantYields = {}
        self.activeSponsors = {}
    }
}
