"use client";

import {
  chainIdToMetadata,
  hyperlaneContractAddresses,
} from "@hyperlane-xyz/sdk";
import { useEffect, useState } from "react";
import {
  Address,
  useAccount,
  useChainId,
  useContractReads,
  usePublicClient,
  useTransaction,
  useWalletClient,
} from "wagmi";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import OffchainAggregatorAbi from "../../abis/OffchainAggregator.json";
import { abi, bytecode } from "../../artifacts/ChainlinkAggregator.json";
import { useRouter } from "next/navigation";
import { useQuery } from "react-query";

const CHAINS = Object.values(chainIdToMetadata);

export default function Deploy() {
  const router = useRouter();
  const client = usePublicClient();
  const chainId = useChainId();
  const [feed, setFeed] = useState(
    "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"
  );

  const constructorData = useQuery("constructorData", () =>
    fetch(`/api/${origin}/${feed}/constructor_arguments`).then((x) => x.json())
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [origin, setOrigin] = useState(5);
  const [destination, setDestination] = useState(80001);

  const wallet = useWalletClient({ chainId: destination });

  const aggregator = useContractReads({
    contracts: [
      {
        // @ts-expect-error
        abi: OffchainAggregatorAbi,
        functionName: "description",
        args: [],
        address: feed as Address,
        chainId: origin,
      },
      {
        // @ts-expect-error
        abi: OffchainAggregatorAbi,
        functionName: "latestRoundData",
        args: [],
        address: feed as Address,
        chainId: origin,
      },
      {
        // @ts-expect-error
        abi: OffchainAggregatorAbi,
        functionName: "decimals",
        args: [],
        address: feed as Address,
        chainId: origin,
      },
    ],
    enabled: !!feed,
  });

  const onDeploy = async () => {
    try {
      if (chainId !== destination) {
        await wallet.data?.switchChain({ id: destination });
      }

      setLoading(true);
      setError(null);
      const a = await wallet.data!.deployContract({
        abi,
        bytecode: bytecode as Address,
        args: [
          ...constructorData.data,
          hyperlaneContractAddresses[chainIdToMetadata[destination].name]
            .mailbox,
        ],
      });

      const b = await client.waitForTransactionReceipt({ hash: a });

      router.push(`/${b.contractAddress}/initialise`);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const onSelectOrigin = (displayName: string) => {
    const c = CHAINS.find((x) => x.displayName === displayName);
    if (c) setOrigin(c.chainId);
  };

  const onSelectDestination = (displayName: string) => {
    const c = CHAINS.find((x) => x.displayName === displayName);
    if (c) setDestination(c.chainId);
  };

  const description = aggregator.data
    ? `${aggregator.data[0].result}, feed latest result ${
        // @ts-expect-error
        aggregator.data[1].result[1] / BigInt(10 ** aggregator.data[2].result)
      }`
    : null;

  return (
    <div className="space-y-10 divide-y divide-gray-900/10 w-full mt-10">
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <div className="space-y-6">
            <div className="332">
              <label
                htmlFor="origin"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Origin
              </label>
              <div className="mt-2">
                <select
                  id="origin"
                  name="origin"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  onChange={(e) => onSelectOrigin(e.target.value)}
                  value={chainIdToMetadata[origin].displayName}
                >
                  {CHAINS.map((x) => (
                    <option>{x.displayName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="332">
              <label
                htmlFor="feed"
                className="flex items- space-x-2 text-sm font-medium leading-6 text-gray-900"
              >
                <div>Feed address </div>
                <a href="https://data.chain.link/">
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 inline" />
                </a>{" "}
              </label>
              <div className="mt-2 w-full">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                  <input
                    type="text"
                    name="feed"
                    id="feed"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="0x..."
                    onChange={(e) => setFeed(e.target.value)}
                    value={feed}
                  />
                </div>
                <div className="text-sm text-gray-700 mt-2">
                  {description || "No data found for this feed"}
                </div>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="destination"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Destination
              </label>
              <div className="mt-2">
                <select
                  id="destination"
                  name="destination"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  onChange={(e) => onSelectDestination(e.target.value)}
                  value={chainIdToMetadata[destination].displayName}
                >
                  {CHAINS.map((x) => (
                    <option>{x.displayName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Back
          </button>
          <button
            onClick={onDeploy}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Deploy
          </button>
        </div>
      </div>
    </div>
  );
}
