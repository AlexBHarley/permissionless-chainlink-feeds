"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

import { classNames } from "../utils/classnames";

export default function Page() {
  const { address } = useAccount();
  const router = useRouter();

  const onNext = () => {
    router.push("/deploy");
  };

  return (
    <div className="flex flex-col text-sm space-y-4">
      <div>
        Welcome to the Permissionless Chainlink Feed wizard. We'll be deploying
        a Chainlink feed of your choice to another EVM compatible chain.
      </div>
      {!address && (
        <div className="text-sm">Connect your wallet to get started</div>
      )}
      <button
        className={classNames(
          `rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-4 ml-auto`,
          address && "bg-indigo-600 hover:bg-indigo-500",
          !address && "bg-indigo-400"
        )}
        disabled={!address}
        onClick={onNext}
      >
        Next
      </button>
    </div>
  );
}
