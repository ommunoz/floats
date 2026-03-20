import * as fcl from '@onflow/fcl'

const network = import.meta.env.VITE_FLOW_NETWORK || 'testnet'

const networks = {
  emulator: {
    'flow.network': 'emulator',
    'accessNode.api': 'http://127.0.0.1:8888',
    contractAddress: '0xf8d6e0586b0a20c7',
  },
  testnet: {
    'flow.network': 'testnet',
    'accessNode.api': 'https://rest-testnet.onflow.org',
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '0xTBD',
  },
}

const activeNetwork = networks[network as keyof typeof networks] ?? networks.testnet

fcl.config({
  'flow.network': activeNetwork['flow.network'],
  'accessNode.api': activeNetwork['accessNode.api'],
  '0xFLOATS_TAB_MANAGER': activeNetwork.contractAddress,
  '0xFLOW_TOKEN': activeNetwork['flow.network'] === 'emulator' ? '0x0ae53cb6e3f42a79' : '0x7e60df042a9c0868',
  '0xFUNGIBLE_TOKEN': activeNetwork['flow.network'] === 'emulator' ? '0xee82856bf20e2aa6' : '0x9a0766d93b6608b7',
})

export const CONTRACT_ADDRESS = activeNetwork.contractAddress
