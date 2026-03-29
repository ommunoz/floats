import "FloatsTabManager"
import "YieldVault"

access(all) struct TabData {
    access(all) let id: String
    access(all) let merchantID: String
    access(all) let totalFunded: UFix64
    access(all) let totalConsumed: UFix64
    access(all) let pendingAmount: UFix64
    access(all) let yieldAccrued: UFix64
    access(all) let activeFloats: &{Address: FloatsTabManager.FloatData}
    access(all) let funders: &{Address: FloatsTabManager.FunderStats}
    access(all) let history: &[FloatsTabManager.HistoryEvent]
    access(all) let redemptionCount: UInt64
    access(all) let isActive: Bool

    init(tab: &FloatsTabManager.Tab, liveYield: UFix64) {
        self.id = tab.id
        self.merchantID = tab.merchantID
        self.totalFunded = tab.totalFunded
        self.totalConsumed = tab.totalConsumed
        self.pendingAmount = tab.pendingAmount
        self.yieldAccrued = tab.yieldAccrued + liveYield
        self.activeFloats = tab.activeFloats
        self.funders = tab.funders
        self.history = tab.history
        self.redemptionCount = tab.redemptionCount
        self.isActive = tab.isActive
    }
}

access(all) fun main(tabID: String): TabData? {
    if let tab = FloatsTabManager.tabs[tabID] {
        let liveYield = YieldVault.calculateTabYield(tabID: tabID)
        return TabData(tab: tab, liveYield: liveYield)
    }
    return nil
}
