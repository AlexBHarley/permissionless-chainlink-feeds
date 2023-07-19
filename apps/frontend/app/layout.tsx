"use client";

import "@rainbow-me/rainbowkit/styles.css";
import "../styles/globals.css";

import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "react-query";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import * as wagmiChains from "wagmi/chains";
import { chainIdToMetadata } from "@hyperlane-xyz/sdk";
import { publicProvider } from "wagmi/providers/public";

import { Navigation } from "../components/Navigation";

const supportedChains = Object.values(wagmiChains).filter(
  (c) => !!chainIdToMetadata[c.id]
);

const { chains, publicClient } = configureChains(supportedChains, [
  publicProvider(),
]);

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
                <Toaster />
              </RainbowKitProvider>
            </WagmiConfig>
          </QueryClientProvider>
        </main>
      </body>
    </html>
  );
}
