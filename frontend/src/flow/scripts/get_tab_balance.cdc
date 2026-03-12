import FloatsTabManager from 0xFLOATS_TAB_MANAGER

access(all) fun main(tabID: String): UFix64 {
  return FloatsTabManager.getBalance(merchantID: tabID)
}
