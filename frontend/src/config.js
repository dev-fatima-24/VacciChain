export const STELLAR_NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet';
export const HORIZON_URL = import.meta.env.VITE_HORIZON_URL || (STELLAR_NETWORK === 'mainnet' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org');
export const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || (STELLAR_NETWORK === 'mainnet' ? 'https://soroban-rpc.mainnet.stellar.org' : 'https://soroban-testnet.stellar.org');

export const STELLAR_EXPERT_TX_URL = STELLAR_NETWORK === 'mainnet' 
  ? 'https://stellar.expert/explorer/public/tx' 
  : 'https://stellar.expert/explorer/testnet/tx';

export const IS_TESTNET = STELLAR_NETWORK === 'testnet';
