"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useAccount, useChainId } from "wagmi";

export default function Page() {
  const { address } = useAccount();
  const chainId = useChainId();
  const router = useRouter();

  const onNext = () => {
    router.push("/deploy");
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 my-10">
      {!address ? (
        <div className="flex items-center justify-center">
          <ConnectButton />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <ConnectButton />
          </div>
        </div>
      )}

      <div>Welcome to the Permissionless Chainlink Feed Wizard</div>

      <button onClick={onNext}>Next</button>
    </div>
  );
}
