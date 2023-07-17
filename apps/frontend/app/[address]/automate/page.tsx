"use client";

import {
  AutomateSDK,
  GELATO_ADDRESSES,
  TaskTransaction,
  isAutomateSupported,
} from "@gelatonetwork/automate-sdk";
import {
  chainIdToMetadata,
  hyperlaneContractAddresses,
} from "@hyperlane-xyz/sdk";
import { Contract } from "ethers";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { parseEther } from "viem";
import {
  Address,
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
} from "wagmi";

import GelatoAutomate from "../../../artifacts/Gelato.json";
import { Link } from "../../../components/Link";
import { Step } from "../../../components/Step";
import { useDestinationChain } from "../../../hooks/use-destination-chain";
import { useOriginChain } from "../../../hooks/use-origin-chain";
import { useContractStore } from "../../../state/contract";
import { walletClientToSigner } from "../../../utils/wallet-to-signer";

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
  const originChain = useOriginChain();
  const destinationChain = useDestinationChain();

  const wallet = useWalletClient();

  const [loading, setLoading] = useState(false);

  const onDeploy = async () => {
    try {
      if (!isAutomateSupported(origin)) {
        console.log(`[gelato] network not supported (${chainId})`);
        return;
      }

      setLoading(true);

      const ethersSigner = walletClientToSigner(wallet.data!);
      const automate = new AutomateSDK(chainId, ethersSigner);

      const deployHash = await wallet.data!.deployContract({
        bytecode: GelatoAutomate.bytecode as Address,
        abi: GelatoAutomate.abi,
        args: [
          GELATO_ADDRESSES[chainId].automate,
          account.address,
          // @ts-expect-error
          hyperlaneContractAddresses[chainIdToMetadata[origin].name].mailbox,
          // @ts-expect-error
          hyperlaneContractAddresses[chainIdToMetadata[origin].name]
            .defaultIsmInterchainGasPaymaster,
          feed,
          destination,
          address,
        ],
      });

      const { contractAddress: automateAddress } =
        await client.waitForTransactionReceipt({
          hash: deployHash,
          timeout: 120_000,
        });
      toast.success("Automation contract deployed");

      const fundHash = await wallet.data!.sendTransaction({
        value: parseEther("0.1"),
        to: automateAddress!,
      });
      await client.waitForTransactionReceipt({
        hash: fundHash,
        timeout: 120_000,
      });
      toast.success("Automation contract funded");

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

      toast.success("Gelato task created");
      router.push(`/${address}/done`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Step
      onNext={onDeploy}
      onNextLabel="Deploy"
      onNextDisabled={false}
      loading={loading}
    >
      <div className="space-y-6 text-sm leading-6">
        <div className="">
          With your price feed setup and hopefully at least one round update
          relayed, the final step is to automate relays so as soon as rounds are
          published on {originChain.displayName}, they become available on{" "}
          {destinationChain.displayName}.
        </div>

        <div className="">
          For this {"we'll"} use{" "}
          <Link label="Gelato" link="https://gelato.network" />, a smart
          contract automation platform. All we need to do is deploy our
          automation contract, fund it with a little gas to pay for relays and
          then register the task with Gelato.
        </div>
      </div>
    </Step>
  );
}
