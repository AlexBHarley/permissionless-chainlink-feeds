"use client";

import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useWindowSize } from "usehooks-ts";
import {
  Address,
  useAccount,
  useChainId,
  useContractRead,
  usePublicClient,
  useWalletClient,
} from "wagmi";

import { abi } from "../../../artifacts/ChainlinkAggregator.json";
import { Link } from "../../../components/Link";
import { Step } from "../../../components/Step";
import { useDestinationChain } from "../../../hooks/use-destination-chain";
import { useOriginChain } from "../../../hooks/use-origin-chain";
import { useContractStore } from "../../../state/contract";

export default function Done({
  params: { address },
}: {
  params: { address: string };
}) {
  const router = useRouter();
  const { width, height } = useWindowSize();

  const originChain = useOriginChain();
  const destinationChain = useDestinationChain();

  const { origin, gelatoTaskId } = useContractStore();

  const onNext = () => {
    router.push(`/`);
  };

  return (
    <>
      <Confetti width={width} height={height} />

      <Step
        onNext={onNext}
        onNextLabel="Start again"
        onNextDisabled={false}
        loading={false}
      >
        <div className="space-y-4 text-sm leading-6">
          <div className="">
            Congratulations! Your automated price feed between{" "}
            {originChain.displayName} and {destinationChain.displayName} is all
            setup.
          </div>

          <div className="">
            The Gelato automation will continue to post price feed updates until
            it runs out of funds. To top up or simply view the logs to make sure
            everything is working, take a look at the integration{" "}
            <Link
              label="here"
              link={`https://app.gelato.network/task/${gelatoTaskId}?chainId=${origin}`}
            />
            .
          </div>
        </div>
      </Step>
    </>
  );
}
