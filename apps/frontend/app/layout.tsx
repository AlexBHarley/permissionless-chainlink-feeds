"use client";

import "@rainbow-me/rainbowkit/styles.css";
import "../styles/globals.css";

import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "react-query";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import {
  arbitrum,
  arbitrumGoerli,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  polygon,
  polygonMumbai,
  sepolia,
} from "wagmi/chains";

import { publicProvider } from "wagmi/providers/public";
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
  appName: "Permissionless Chainlink Feeds",
  projectId: "permissionless-fhainlink-feeds",
  chains,
});
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="max-w-screen-md mx-auto">
          <QueryClientProvider client={queryClient}>
            <WagmiConfig config={wagmiConfig}>
              <RainbowKitProvider chains={chains}>
                <Navigation>{children}</Navigation>
              </RainbowKitProvider>
            </WagmiConfig>
          </QueryClientProvider>
          <Toaster />
        </main>
      </body>
    </html>
  );
}
