import FloatsTabManager from 0xFLOATS_TAB_MANAGER

access(all) fun main(tabID: String): Bool {
    if let tab = FloatsTabManager.tabs[tabID] {
        return tab.isActive
    }
    return false
}
