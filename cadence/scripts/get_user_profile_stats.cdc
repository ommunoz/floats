import "FloatsTabManager"

access(all) struct UserStats {
    access(all) let tabsBacked: UInt64
    access(all) let floatsGrabbed: UInt64

    init(tabsBacked: UInt64, floatsGrabbed: UInt64) {
        self.tabsBacked = tabsBacked
        self.floatsGrabbed = floatsGrabbed
    }
}

access(all) fun main(userAddress: Address): UserStats {
    var tabsBacked: UInt64 = 0
    var floatsGrabbed: UInt64 = 0

    let allTabs = FloatsTabManager.tabs.values

    for tab in allTabs {
        // Check if user funded this tab
        if tab.funders[userAddress] != nil {
            tabsBacked = tabsBacked + 1
        }

        // Add lifetime consumed floats
        let consumed = tab.lifetimeConsumedFloats[userAddress] ?? 0
        floatsGrabbed = floatsGrabbed + consumed

        // Include any currently active unconsumed float as "grabbed"
        if tab.activeFloats[userAddress] != nil {
            floatsGrabbed = floatsGrabbed + 1
        }
    }

    return UserStats(tabsBacked: tabsBacked, floatsGrabbed: floatsGrabbed)
}
