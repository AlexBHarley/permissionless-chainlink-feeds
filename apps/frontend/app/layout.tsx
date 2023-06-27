"use client";

import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import {
  mainnet,
  goerli,
  sepolia,
  optimism,
  optimismGoerli,
  polygon,
  polygonMumbai,
  arbitrum,
  arbitrumGoerli,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
} from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { useRouter } from "next/navigation";
import { Navigation } from "../components/Navigation";

const { chains, publicClient } = configureChains(
  [
    mainnet,
    goerli,
    sepolia,
    optimism,
    optimismGoerli,
    polygon,
    polygonMumbai,
    arbitrum,
    arbitrumGoerli,
    avalanche,
    avalancheFuji,
    bsc,
    bscTestnet,
  ],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "ICA Demo",
  projectId: "ica-demo",
  chains,
});
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const route = useRouter();

  return (
    <html lang="en">
      <body>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains}>
            <main className="max-w-screen-md mx-auto">
              <div className="flex space-x-8">
                <Navigation />

                {children}
              </div>
            </main>
          </RainbowKitProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}
