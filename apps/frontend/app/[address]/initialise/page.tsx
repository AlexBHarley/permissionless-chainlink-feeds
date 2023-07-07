"use client";

import { chainIdToMetadata } from "@hyperlane-xyz/sdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useQuery } from "react-query";
import { Address, useChainId, usePublicClient, useWalletClient } from "wagmi";

import { abi } from "../../../artifacts/ChainlinkAggregator.json";
import { Step } from "../../../components/Step";
import { useContractStore } from "../../../state/contract";
import { Link } from "../../../components/Link";

export default function Initialise({
  params: { address },
}: {
  params: { address: string };
}) {
  const router = useRouter();
  const client = usePublicClient();
  const chainId = useChainId();

  const { origin, feed, destination } = useContractStore();

  const explorer = chainIdToMetadata[chainId]?.blockExplorers?.find(
    (x) => x.family === "etherscan"
  );
  const explorerLink = explorer ? `${explorer.url}/address/${address}` : null;

  const setConfigArguments = useQuery("set_config_arguments", () =>
    fetch(`/api/${origin}/${feed}/set_config_arguments`).then((x) => x.json())
  );

  const [loading, setLoading] = useState(false);

  const wallet = useWalletClient({ chainId: destination });

  const onInitialise = async () => {
    try {
      if (chainId !== destination) {
        await wallet.data?.switchChain({ id: destination });
      }

      setLoading(true);

      const hash = await wallet.data!.writeContract({
        abi,
        address: address as Address,
        functionName: "setConfig",
        args: [...setConfigArguments.data],
      });
      await client.waitForTransactionReceipt({ hash });
      router.push(`/${address}/trigger`);
    } catch (e: any) {
      toast.error(e.shortMessage ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Step
      onNext={onInitialise}
      onNextLabel="Initialise"
      onNextDisabled={false}
      loading={loading}
    >
      <div className="space-y-6 text-sm leading-6">
        <div className="">
          Your Chainlink feed has been deployed! You can take a look at it on
          the <Link label="explorer" link={explorerLink ?? ""} />.
        </div>
        <div className="">
          The next step is to initialise your contract with the Chainlink
          validator set, this will ensure your new Chainlink feed is just as
          secure as the original.
        </div>
      </div>
    </Step>
  );
}
