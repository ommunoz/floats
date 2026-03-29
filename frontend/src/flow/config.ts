import * as fcl from '@onflow/fcl'

const network = import.meta.env.VITE_FLOW_NETWORK || 'testnet'

const config = {
  emulator: {
    network: 'emulator',
    accessNode: 'http://127.0.0.1:8888',
    contract: '0xf8d6e0586b0a20c7',
    flowToken: '0x0ae53cb6e3f42a79',
    fungibleToken: '0xee82856bf20e2aa6'
  },
  testnet: {
    network: 'testnet',
    accessNode: 'https://rest-testnet.onflow.org',
    contract: import.meta.env.VITE_CONTRACT_ADDRESS || '0x407c9218dcdf3589',
    flowToken: '0x7e60df042a9c0868',
    fungibleToken: '0x9a0766d93b6608b7'
  }
}[network as 'emulator' | 'testnet'] || {
  network: 'testnet',
  accessNode: 'https://rest-testnet.onflow.org',
  contract: '0x407c9218dcdf3589',
  flowToken: '0x7e60df042a9c0868',
  fungibleToken: '0x9a0766d93b6608b7'
}

fcl.config({
  'flow.network': config.network,
  'accessNode.api': config.accessNode,
  '0xFLOATS_TAB_MANAGER': config.contract,
  '0xFLOW_TOKEN': config.flowToken,
  '0xFUNGIBLE_TOKEN': config.fungibleToken,
})

export const CONTRACT_ADDRESS = config.contract
