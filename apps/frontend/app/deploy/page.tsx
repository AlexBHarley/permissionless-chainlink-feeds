"use client";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import {
  chainIdToMetadata,
  hyperlaneContractAddresses,
} from "@hyperlane-xyz/sdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useQuery } from "react-query";
import {
  Address,
  useChainId,
  useNetwork,
  usePublicClient,
  useWalletClient,
} from "wagmi";

import { abi, bytecode } from "../../artifacts/ChainlinkAggregator.json";
import { Step } from "../../components/Step";
import { useAggregator } from "../../hooks/use-aggregator";
import { useContractStore } from "../../state/contract";

const VERCEL_API_ENDPOINT =
  "https://permissionless-chainlink-feeds-frontend.vercel.app/api";

export default function Deploy() {
  const { origin, setOrigin, destination, setDestination, feed, setFeed } =
    useContractStore();
  const { chains } = useNetwork();

  const router = useRouter();
  const client = usePublicClient();
  const chainId = useChainId();

  const [api, setApi] = useState("");

  useEffect(() => {
    setApi(`${VERCEL_API_ENDPOINT}/${origin}/${feed}/round_data`);
  }, [feed, origin]);

  const constructorArguments = useQuery("constructor_arguments", () =>
    fetch(`/api/${origin}/${feed}/constructor_arguments`).then((x) => x.json())
  );
  const setConfigArguments = useQuery("set_config_arguments", () =>
    fetch(`/api/${origin}/${feed}/set_config_arguments`).then((x) => x.json())
  );

  const [loading, setLoading] = useState(false);

  const wallet = useWalletClient({ chainId: destination });

  const aggregator = useAggregator();

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
          ...setConfigArguments.data,
          // @ts-expect-error
          hyperlaneContractAddresses[chainIdToMetadata[destination].name]
            .mailbox,
          [api],
          origin,
        ],
      });

      const receipt = await client.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
      });
      toast.success("Contract deployed");
      router.push(`/${receipt.contractAddress}/trigger`);
    } catch (e: any) {
      toast.error(e.shortMessage ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  const onSelectOrigin = (id: number) => {
    const c = chains.find((x) => x.id === id);
    if (c) setOrigin(c.id);
  };

  const onSelectDestination = (id: number) => {
    const c = chains.find((x) => x.id === id);
    if (c) setDestination(c.id);
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
      onNextDisabled={!constructorArguments.data || !setConfigArguments.data}
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
              onChange={(e) => onSelectOrigin(parseInt(e.target.value))}
              value={origin.toString()}
            >
              {chains.map((x) => (
                <option key={`origin-${x.id}`} value={x.id.toString()}>
                  {chainIdToMetadata[x.id].displayName}
                </option>
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
              onChange={(e) => onSelectDestination(parseInt(e.target.value))}
              disabled={loading}
              value={destination.toString()}
            >
              {chains.map((x) => (
                <option key={`destination-${x.id}`} value={x.id.toString()}>
                  {chainIdToMetadata[x.id].displayName}
                </option>
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
