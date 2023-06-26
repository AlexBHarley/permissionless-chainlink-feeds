## Permissionless Chainlink Feeds

Powered by [Hyperlane](https://hyperlane.xyz), easily bring Chainlink price feed Oracles for any supported data feed to your EVM compatible blockchain.

### How does it work?

By deploying a slightly modified (simplified could be the correct term here) version of the [Chainlink OffchainAggregator](https://github.com/smartcontractkit/libocr/blob/master/contract/OffchainAggregator.sol), we can replay transactions from any chain Chainlink operates on via Hyperlane to your chain. Crucially, and what makes this useful, is we only need to rely on the security of Chainlink oracles themselves.

### Getting started

As of 26.6.23 there doesn't exist a UI for easily deploying these price feeds, but if you're happy to run a few commands via the CLI you can get up and running in 5 minutes.

```
➜  permissionless-chainlink git:(main) ✗ pnpm install
```

#### Chainlink API proxy

This service handles querying Chainlink specific data either from the chain itself or via an indexing provider like Etherscan or Moralis.

Firsts, setup your environment variables,

```
➜  permissionless-chainlink git:(main) ✗ cd apps/api
➜  api git:(main) ✗ cd .env.example .env
```

Run the service,

```
➜  api git:(main) ✗ pnpm dev
```

#### Smart contracts

This will assume you want to replay the [ETH/USD](https://data.chain.link/) feed from Goerli to Mumbai, but feel free to switch up these variables as you see fit ([here](./contracts/scripts/utils.ts)).

First we need to setup our environment variables,

```
➜  permissionless-chainlink git:(main) ✗ cd contracts
➜  contracts git:(main) ✗ cp .env.example .env
```

Then we can deploy the `ChainlinkAggregator`. This script will query initialisation variables from the API server you ran in the previous step, so make sure you've completed that before running this.

```
➜  contracts git:(main) ✗ pnpm hardhat run ./scripts/deploy-aggregator.ts --network mumbai
```

To test everything is working, we can relay the latest round data from Goerli to Mumbai,

```
➜  contracts git:(main) ✗ pnpm hardhat run ./scripts/update-answer.ts --network goerli
```

And finally query the latest round data on Mumbai,

```
➜  contracts git:(main) ✗ pnpm hardhat run ./scripts/get-answer.ts --network mumbai
[
  BigNumber { value: "1" },
  BigNumber { value: "188363730000" },
  BigNumber { value: "1687787078" },
  BigNumber { value: "1687787078" },
  BigNumber { value: "1" },
  roundId: BigNumber { value: "1" },
  answer: BigNumber { value: "188363730000" },
  startedAt: BigNumber { value: "1687787078" },
  updatedAt: BigNumber { value: "1687787078" },
  answeredInRound: BigNumber { value: "1" }
]
```

### Automation

If you're following along you will have seen we just manually triggered a round update and pushed it from Goerli to Mumbai. However we need prices to be up to date and don't want to be manually triggering these updates, so we can easily setup some kind of automation and have these round updates triggered whenever a new Chainlink update occurs.

There are of course many options available to us to automate these round updates, a few ideas that spring to mind include,

- Running a lightweight indexer that upon finding `NewTransmission` events, sends the origin chain message
- Setup a CRON job that queries for the latest round ID and upon finding a new one, sends the origin chain message
- Configure an onchain messaging system like [Gelato](https://gelato.network) or [Keeper](https://keep3r.network/) to periodically post the round data.

We've taken the time to configure a simple Gelato integration. So running the following command,

````
➜  contracts git:(main) ✗ pnpm hardhat run ./scripts/deploy-gelato.ts --network goerli```
````

Will deploy an instance of the `GelatoAutomate` contract and fund it with 1 GoerliETH.
