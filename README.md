## Permissionless Chainlink Feeds

Powered by [Hyperlane](https://hyperlane.xyz), easily bring Chainlink price feed Oracles for any supported data feed to your EVM compatible blockchain.

### How does it work?

By deploying a slightly modified (simplified could be the correct term here) version of the Chainlink OffchainAggregator, we can replay transactions from any chain Chainlink operates on via Hyperlane to your chain. Crucially, and what makes this useful, is we only rely on the security of Chainlink oracles themselves.

### Getting started

As of 26.6.23 there doesn't exist a UI for easily deploying these price feeds, but if you're happy to run a few commands via the CLI you can get up and running in 5 minutes.

```
pnpm install
```

#### Chainlink API proxy

This service handles querying Chainlink specific data either from the chain itself or via an indexing provider like Etherscan or Moralis.

Firsts, setup your environment variables,

```
cd apps/api
cd .env.example .env
```

Run the service,

```
pnpm dev
```

#### Smart contracts

This will assume you want to replay the [ETH/USD](https://data.chain.link/) feed from Ethereum mainnet to Goerli, but feel free to switch up these variables as you see fit ([here](./contracts/scripts/utils.ts)).

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

### Next steps

To reliably receive Chainlink updates on your chain, you need some way of periodically triggering Hyperlane messages that encode the round ID you want to relay. Here's a couple options,

- Run a lightweight indexer that upon finding `NewTransmission` events, sends the origin chain message
- Setup a CRON job that queries for the latest round ID and upon finding a new one, sends the origin chain message
- Configure an onchain messaging system like [Gelato](https://gelato.network) or [Keeper](https://keep3r.network/) to periodically post the round data.
