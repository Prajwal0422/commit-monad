import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

// ─── Monad Testnet ─────────────────────────────────────────────────────────────
// Official Monad Testnet chain definition
// https://docs.monad.xyz/developer-essentials/network-information
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

// ─── Wagmi Config ──────────────────────────────────────────────────────────────
// Uses createConfig directly instead of RainbowKit's getDefaultConfig.
// getDefaultConfig always bootstraps WalletConnect/Reown, which requires a
// valid project ID and makes network requests we don't need for MetaMask-only.
//
// injected() covers MetaMask and any other browser-injected wallet (Rabby,
// Coinbase Wallet extension, etc.) — easy to extend later by adding more
// connectors from wagmi/connectors without touching the rest of the stack.
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(), // MetaMask + any browser-injected wallet
  ],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
  ssr: false,
});
