import { chainIdToMetadata } from "@hyperlane-xyz/sdk";
import { useContractStore } from "../state/contract";

export function useDestinationChain() {
  const origin = useContractStore.useDestination();
  return chainIdToMetadata[origin];
}
