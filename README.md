## Permissionless Chainlink Feeds

Powered by [Hyperlane](https://hyperlane.xyz), easily bring Chainlink price feed Oracles for any supported data feed to your EVM compatible blockchain.

### How does it work?

By deploying a slightly modified (simplified could be the correct term here) version of the Chainlink OffchainAggregator, we can replay transactions from any chain Chainlink operates on via Hyperlane to your chain, only relying on the underlying security of Chainlink oracles themselves.

### Getting started

As of 26.6.23 there doesn't exist a UI for easily deploying these price feeds, but if you're happy to run a few commands via the CLI you can get up and running in 5 minutes.

```
pnpm install
```

#### Offchain Chainlink API proxy

Setup your environment variables,

```
cd apps/api
cd .env.example .env
```

Run the service,

```
pnpm dev;
```

#### Contracts

This will assume you want to replay the ETH/USD feed from Ethereum mainnet to Goerli, but feel free to switch up these variables as you see fit ([here](./contracts/scripts/utils.ts)).

Setup your environment variables,

```
cd contracts
cp .env.example .env
```

Deploy the OffchainAggregator. This script will query initialisation variables from the API server you ran in the previous step, so make sure you've completed that before running this.

```
pnpm hardhat run ./scripts/deploy-aggregator.ts --network goerli
```

Relay the round data from Ethereum to Goerli,

```
pnpm hardhat run ./scripts/update-answer.ts --network ethereum
```

Query the latest round data on Goerli,

```
pnpm hardhat run ./scripts/get-answer.ts --network goerli
[
  BigNumber { value: "1" },
  BigNumber { value: "191082886000" },
  BigNumber { value: "1687687392" },
  BigNumber { value: "1687687392" },
  BigNumber { value: "1" },
  roundId: BigNumber { value: "1" },
  answer: BigNumber { value: "191082886000" },
  startedAt: BigNumber { value: "1687687392" },
  updatedAt: BigNumber { value: "1687687392" },
  answeredInRound: BigNumber { value: "1" }
]
```
