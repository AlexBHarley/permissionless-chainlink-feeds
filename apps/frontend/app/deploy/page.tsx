"use client";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import {
  chainIdToMetadata,
  hyperlaneContractAddresses,
} from "@hyperlane-xyz/sdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useQuery } from "react-query";
import {
  Address,
  useChainId,
  useContractReads,
  usePublicClient,
  useWalletClient,
} from "wagmi";

import EACAggregatorProxy from "../../abis/EACAggregatorProxy.json";
import { abi, bytecode } from "../../artifacts/ChainlinkAggregator.json";
import { Step } from "../../components/Step";
import { useContractStore } from "../../state/contract";

const CHAINS = Object.values(chainIdToMetadata);

const VERCEL_API_ENDPOINT =
  "https://permissionless-chainlink-feeds-frontend.vercel.app/api";

export default function Deploy() {
  const { origin, setOrigin, destination, setDestination, feed, setFeed } =
    useContractStore();

  const router = useRouter();
  const client = usePublicClient();
  const chainId = useChainId();

  const [api, setApi] = useState(
    `${VERCEL_API_ENDPOINT}/${chainId}/${feed}/round_data`
  );

  const constructorArguments = useQuery("constructor_arguments", () =>
    fetch(`/api/${origin}/${feed}/constructor_arguments`).then((x) => x.json())
  );

  const [loading, setLoading] = useState(false);

  const wallet = useWalletClient({ chainId: destination });

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

  const onDeploy = async () => {
    try {
      setLoading(true);

      if (chainId !== destination) {
        await wallet.data?.switchChain({ id: destination });
      }

      if (!description) {
        throw new Error("Price feed not found");
      }

      const hash = await wallet.data!.deployContract({
        abi,
        bytecode: bytecode as Address,
        args: [
          ...constructorArguments.data,
          // @ts-expect-error
          hyperlaneContractAddresses[chainIdToMetadata[destination].name]
            .mailbox,
          [api],
        ],
      });

      const receipt = await client.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      });
      toast.success("Contract deployed");
      router.push(`/${receipt.contractAddress}/initialise`);
    } catch (e: any) {
      toast.error(e.shortMessage ?? e.message);
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

  const description = aggregator.data?.every((x) => x.status === "success")
    ? `${aggregator.data[0].result}, latest result ${
        // @ts-expect-error
        aggregator.data[1].result[1] / BigInt(10 ** aggregator.data[2].result)
      }`
    : null;

  return (
    <Step
      onNext={onDeploy}
      onNextLabel="Deploy"
      onNextDisabled={false}
      loading={loading}
    >
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
              disabled={loading}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              onChange={(e) => onSelectOrigin(e.target.value)}
              value={chainIdToMetadata[origin].displayName}
            >
              {CHAINS.map((x) => (
                <option key={x.name}>{x.displayName}</option>
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
            <a
              href="https://data.chain.link/"
              className="text-blue-400 flex items-center"
              target="_blank"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4 inline" />
            </a>
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
                disabled={loading}
                value={feed}
              />
            </div>
            <div className="text-xs text-gray-700 mt-2">
              {description ||
                "No data found for this feed, double check the origin chain and contract addresss"}
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
              disabled={loading}
              value={chainIdToMetadata[destination].displayName}
            >
              {CHAINS.map((x) => (
                <option key={x.name}>{x.displayName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="332">
          <label
            htmlFor="api"
            className="flex items- space-x-2 text-sm font-medium leading-6 text-gray-900"
          >
            <div>API</div>
          </label>
          <div className="mt-2 w-full">
            <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
              <input
                type="text"
                name="api"
                id="api"
                disabled={loading}
                className="block flex-1 border-0 bg-transparent py-1.5 pl-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                placeholder="https://"
                onChange={(e) => setApi(e.target.value)}
                value={api}
              />
            </div>
            <div className="text-xs text-gray-700 mt-2">
              Change this if {"you're"} running your own Chainlink data API
            </div>
          </div>
        </div>
      </div>
    </Step>
  );
}
