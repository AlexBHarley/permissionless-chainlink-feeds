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
  AutomateSDK,
  isAutomateSupported,
  TaskTransaction,
  GELATO_ADDRESSES,
} from "@gelatonetwork/automate-sdk";
import {
  Address,
  useAccount,
  useChainId,
  useContractRead,
  usePublicClient,
  useWalletClient,
} from "wagmi";

import { decodeEventLog, numberToHex, EIP1193Provider, parseEther } from "viem";
import InterchainGasPaymasterAbi from "../../../abis/InterchainGasPaymaster.json";
import MailboxAbi from "../../../abis/Mailbox.json";
import { abi } from "../../../artifacts/ChainlinkAggregator.json";
import GelatoAutomate from "../../../artifacts/Gelato.json";
import { Spinner } from "../../../components/Spinner";
import { Step } from "../../../components/Step";
import { useContractStore } from "../../../state/contract";
import { walletClientToSigner } from "../../../utils/wallet-to-signer";
import { Contract } from "ethers";
import { Link } from "../../../components/Link";

export default function Automate({
  params: { address },
}: {
  params: { address: string };
}) {
  const router = useRouter();
  const client = usePublicClient();
  const chainId = useChainId();
  const account = useAccount();

  const { origin, feed, destination, setGelatoTaskId } = useContractStore();
  const wallet = useWalletClient();

  const [loading, setLoading] = useState(false);

  const { refetch: refetchLatestRoundId, data: latestRoundId } = useQuery(
    "constructor_arguments",
    () => fetch(`/api/${origin}/${feed}/latest_round_id`).then((x) => x.json())
  );

  const originHyperlaneAddresses =
    hyperlaneContractAddresses[chainIdToMetadata[origin].name];

  const quoteGasPayment = useContractRead({
    chainId: origin,
    address: originHyperlaneAddresses.defaultIsmInterchainGasPaymaster,
    functionName: "quoteGasPayment",
    args: [destination, 350_000],
    abi: InterchainGasPaymasterAbi,
  });

  const latestRoundData = useContractRead({
    chainId: destination,
    address: address as Address,
    functionName: "latestRoundData",
    args: [],
    abi,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchLatestRoundId();
    }, 10_000);
    return () => {
      clearInterval(interval);
    };
  }, [refetchLatestRoundId]);

  const onDeploy = async () => {
    if (!isAutomateSupported(origin)) {
      console.log(`[gelato] network not supported (${chainId})`);
      return;
    }

    const ethersSigner = walletClientToSigner(wallet.data!);
    const automate = new AutomateSDK(chainId, ethersSigner);

    const hash = await wallet.data!.deployContract({
      bytecode: GelatoAutomate.bytecode as Address,
      abi: GelatoAutomate.abi,
      value: parseEther("0.1"),
      args: [
        GELATO_ADDRESSES[chainId].automate,
        account.address,
        hyperlaneContractAddresses[chainIdToMetadata[origin].name].mailbox,
        hyperlaneContractAddresses[chainIdToMetadata[origin].name]
          .defaultIsmInterchainGasPaymaster,
        feed,
        destination,
        address,
      ],
    });

    const { contractAddress: automateAddress } =
      await client.waitForTransactionReceipt({ hash });

    const contract = new Contract(
      automateAddress!,
      GelatoAutomate.abi,
      ethersSigner
    );
    const selector = contract.interface.getSighash("relayRoundData(uint256)");
    const resolverData = contract.interface.getSighash("checker()");

    const { taskId, tx }: TaskTransaction = await automate.createTask({
      execAddress: automateAddress!,
      execSelector: selector,
      execAbi: JSON.stringify(GelatoAutomate.abi),
      resolverAddress: automateAddress!,
      resolverData: resolverData,
      resolverAbi: JSON.stringify(GelatoAutomate.abi),
      name: "Automated Chainlink Price Feed",
      dedicatedMsgSender: false,
      useTreasury: false,
    });

    setGelatoTaskId(taskId!);

    await tx.wait();
  };

  const onNext = () => {
    router.push(`/${address}/automate`);
  };

  // @ts-expect-error
  const latestAnswer = latestRoundData.data?.[1] !== BigInt(0);

  return (
    <Step
      onNext={onNext}
      onNextLabel="Next"
      onNextDisabled={false}
      loading={false}
    >
      <div className="space-y-6 text-sm leading-6">
        <div className="">
          With your price feed setup and hopefully at least one round update
          relayed, the final step is to automate relays so as soon as rounds are
          published on XXX, they become available on your chain.
        </div>

        <div className="">
          For this we'll use{" "}
          <Link label="Gelato" link="https://gelato.network" />, a smart
          contract automation platform. All we need to do is deploy our
          automation contract and fund it with a little gas to pay for relays.
        </div>

        <div className="">
          After triggering a round update it could take a couple minutes for the
          round data to land on your destination chain.
        </div>
      </div>
    </Step>
  );
}
