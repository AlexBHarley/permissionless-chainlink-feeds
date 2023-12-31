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
import { alchemyProvider } from "wagmi/providers/alchemy";

import { Navigation } from "../components/Navigation";

const supportedChains = Object.values(wagmiChains).filter(
  (c) => !!chainIdToMetadata[c.id]
);

const providers = [];
if (process.env["NEXT_PUBLIC_ALCHEMY_API_KEY"]) {
  providers.push(
    alchemyProvider({ apiKey: process.env["NEXT_PUBLIC_ALCHEMY_API_KEY"] })
  );
}
providers.push(publicProvider());

const { chains, publicClient } = configureChains(supportedChains, providers);

const { connectors } = getDefaultWallets({
  appName: "Permissionless Chainlink Feeds",
  projectId: "permissionless-chainlink-feeds",
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
