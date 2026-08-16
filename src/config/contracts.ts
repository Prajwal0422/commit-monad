// ─── Contract configuration ───────────────────────────────────────────────────
// Single source of truth for all contract addresses and ABIs.
//
// CommitPool is deployed on Monad Testnet (chainId 10143):
//   address 0x4A2D4eb789FE86029C58F2fc604B1957C6D12b09
//   record  commitpool-contract/deployments/monadTestnet.json

import { CommitPoolAbi, COMMIT_POOL_ADDRESS, VERIFIER_ADDRESS } from '../contracts/CommitPool';

export const contracts = {
  commitPool: {
    address: COMMIT_POOL_ADDRESS,
    abi: CommitPoolAbi,
  },
} as const;

// Re-export for convenience so consumers can import from one place
export { CommitPoolAbi, COMMIT_POOL_ADDRESS, VERIFIER_ADDRESS };
