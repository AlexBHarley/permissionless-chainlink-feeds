import { chainIdToMetadata } from "@hyperlane-xyz/sdk";
import { useContractStore } from "../state/contract";

export function useOriginChain() {
  const origin = useContractStore.useOrigin();
  return chainIdToMetadata[origin];
}
