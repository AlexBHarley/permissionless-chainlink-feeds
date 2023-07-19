"use client";

import { Address, useContractReads } from "wagmi";

import EACAggregatorProxy from "../abis/EACAggregatorProxy.json";
import { useContractStore } from "../state/contract";

export function useAggregator() {
  const { origin, feed } = useContractStore();

  const aggregator = useContractReads({
    contracts: [
      {
        // @ts-expect-error
        abi: EACAggregatorProxy,
        functionName: "description",
        args: [],
        address: feed as Address,
        chainId: origin,
      },
      {
        // @ts-expect-error
        abi: EACAggregatorProxy,
        functionName: "latestRoundData",
        args: [],
        address: feed as Address,
        chainId: origin,
      },
      {
        // @ts-expect-error
        abi: EACAggregatorProxy,
        functionName: "decimals",
        args: [],
        address: feed as Address,
        chainId: origin,
      },
    ],
    enabled: !!feed,
  });

  return aggregator;
}
