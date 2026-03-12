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
})

export const CONTRACT_ADDRESS = activeNetwork.contractAddress
