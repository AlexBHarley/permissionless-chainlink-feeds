"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

import { Step } from "../components/Step";
import { Link } from "../components/Link";

export default function Page() {
  const { address } = useAccount();
  const router = useRouter();

  const onNext = () => {
    router.push("/deploy");
  };

  return (
    <Step onNext={onNext} onNextLabel="Next" onNextDisabled={!address}>
      <div className="space-y-4 text-sm leading-6">
        <div className="">
          Welcome to the Permissionless Chainlink Feed wizard. {"We'll"} be
          deploying a Chainlink price feed of your choice to an EVM compatible
          chain.
        </div>
        <div className="">
          If {"you'd"} like to checkout the source code for this wizard and the
          Chainlink price feed itself, take a look at the{" "}
          <Link
            label="GitHub repository"
            link="https://github.com/AlexBHarley/permissionless-chainlink-feeds"
          />
          .
        </div>
      </div>
      {!address && (
        <div className="text-sm">Connect your wallet to get started</div>
      )}
    </Step>
  );
}
