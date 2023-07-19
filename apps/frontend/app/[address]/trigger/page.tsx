"use client";

import {
  chainIdToMetadata,
  hyperlaneContractAddresses,
} from "@hyperlane-xyz/sdk";
import { utils } from "@hyperlane-xyz/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useQuery } from "react-query";
import {
  Address,
  useChainId,
  useContractRead,
  usePublicClient,
  useWalletClient,
} from "wagmi";

import { decodeEventLog, numberToHex } from "viem";
import InterchainGasPaymasterAbi from "../../../abis/InterchainGasPaymaster.json";
import MailboxAbi from "../../../abis/Mailbox.json";
import { abi } from "../../../artifacts/ChainlinkAggregator.json";
import { Spinner } from "../../../components/Spinner";
import { Step } from "../../../components/Step";
import { useContractStore } from "../../../state/contract";
import { useOriginChain } from "../../../hooks/use-origin-chain";
import { useDestinationChain } from "../../../hooks/use-destination-chain";
import { Link } from "../../../components/Link";
import { useAggregator } from "../../../hooks/use-aggregator";

export default function Initialise({
  params: { address },
}: {
  params: { address: string };
}) {
  const router = useRouter();
  const client = usePublicClient();
  const chainId = useChainId();

  const { origin, feed, destination } = useContractStore();
  const wallet = useWalletClient();
  const originChain = useOriginChain();
  const destinationChain = useDestinationChain();

  const explorer = chainIdToMetadata[chainId]?.blockExplorers?.find(
    (x) => x.family === "etherscan"
  );
  const explorerLink = explorer ? `${explorer.url}/address/${address}` : null;

  const [loading, setLoading] = useState(false);

  const { data: latestRoundId } = useQuery("constructor_arguments", () =>
    fetch(`/api/${origin}/${feed}/latest_round_id`).then((x) => x.json())
  );

  const aggregator = useAggregator();

  const originHyperlaneAddresses =
    // @ts-expect-error
    hyperlaneContractAddresses[chainIdToMetadata[origin].name];

  const quoteGasPayment = useContractRead({
    chainId: origin,
    address: originHyperlaneAddresses.defaultIsmInterchainGasPaymaster,
    functionName: "quoteGasPayment",
    args: [destination, 350_000],
    abi: InterchainGasPaymasterAbi,
  });

  const { refetch: refetchLatestRoundData, data: latestRoundData } =
    useContractRead({
      chainId: destination,
      address: address as Address,
      functionName: "latestRoundData",
      args: [],
      abi,
    });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchLatestRoundData();
    }, 10_000);
    return () => {
      clearInterval(interval);
    };
  }, [refetchLatestRoundData]);

  const onTrigger = async () => {
    try {
      if (!wallet.data) {
        return;
      }

      if (wallet.data.chain.id !== origin) {
        await wallet.data.switchChain({ id: origin });
      }

      setLoading(true);

      const dispatch = await wallet.data.writeContract({
        address: originHyperlaneAddresses.mailbox,
        abi: MailboxAbi,
        functionName: "dispatch",
        args: [
          destination,
          utils.addressToBytes32(address),
          numberToHex(latestRoundId),
        ],
      });

      const dispatchReceipt = await client.waitForTransactionReceipt({
        hash: dispatch,
      });

      toast.success("Update dispatched");

      const messageId: string | undefined = dispatchReceipt.logs
        .map((log) => {
          const { eventName, args } = decodeEventLog({
            abi: MailboxAbi,
            data: log.data,
            topics: log.topics,
          });
          if (eventName === "DispatchId") {
            return (args as any).messageId;
          }
        })
        .filter(Boolean)
        .at(0);
      if (!messageId) {
        console.log("Missing message ID");
        return;
      }
      console.log({ messageId });

      console.log({ quoteGasPayment });

      const payForGas = await wallet.data.writeContract({
        address: originHyperlaneAddresses.defaultIsmInterchainGasPaymaster,
        abi: InterchainGasPaymasterAbi,
        functionName: "payForGas",
        args: [messageId, destination, 350_000, address],
        value: quoteGasPayment.data as bigint,
      });
      await client.waitForTransactionReceipt({
        hash: payForGas,
      });

      toast.success("Gas paid");
      console.log("[update-answer] gas paid");
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  };

  const onNext = () => {
    router.push(`/${address}/automate`);
  };

  // @ts-expect-error
  const latestAnswer = latestRoundData?.[1];

  const description =
    aggregator.data?.every((x) => x.status === "success") && latestAnswer
      ? `${
          // @ts-expect-error
          latestAnswer / BigInt(10 ** aggregator.data[2].result)
        }`
      : null;

  return (
    <Step
      onNext={onNext}
      onNextLabel="Next"
      onNextDisabled={false}
      loading={false}
    >
      <div className="space-y-4 text-sm leading-6">
        <div className="">
          Your Chainlink feed has been{" "}
          <Link label={`deployed and initialised`} link={explorerLink ?? ""} />{" "}
          on {destinationChain.displayName}!
        </div>
        <div className="">
          {"We're"} nearly there, almost everything is setup for your automated
          price feed. Before we setup said automation, {"let's"} quickly confirm
          that the integration is working by manually triggering a price update.
        </div>

        <div className="">
          Note that after triggering a round update on {originChain.displayName}{" "}
          it could take a couple minutes for the round data to land on{" "}
          {destinationChain.displayName}.
        </div>

        <div className="flex items-center justify-between">
          <div>
            {latestAnswer && latestAnswer !== BigInt(0) ? (
              <span>Latest round data: {description}</span>
            ) : (
              <span>No round data found yet</span>
            )}
          </div>

          <div>
            <button
              className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 flex items-center space-x-2"
              onClick={onTrigger}
            >
              <span>Trigger price update</span>
              {loading && <Spinner />}
            </button>
          </div>
        </div>
      </div>
    </Step>
  );
}
