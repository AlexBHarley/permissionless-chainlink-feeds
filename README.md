## Permissionless Chainlink Feeds

Powered by [Hyperlane](https://hyperlane.xyz), easily bring any [Chainlink](https://chain.link/) price feed to your EVM compatible blockchain.

### How does it work?

By deploying a slightly modified (simplified) version of the [Chainlink OffchainAggregator](https://github.com/smartcontractkit/libocr/blob/master/contract/OffchainAggregator.sol), we can replay transactions from any chain Chainlink operates on to your chain. Crucially, and what makes this useful, is we only need to rely on the security of Chainlink oracles themselves to secure these updates.

### Getting started

As of 26.6.23 there doesn't exist a UI for easily deploying these price feeds, but if you're happy to run a few commands via the CLI you can get up and running in 5 minutes. For testing purposes the following guide will setup a [ETH/USD](https://data.chain.link/) feed from Goerli to Mumbai, but feel free to alter these variables as you see fit ([here](./apps/contracts/scripts/utils.ts)).

We'll first get your dependencies installed by running,

```
➜  pnpm install
```

#### API and frontend

The API handles querying Chainlink specific data either from the chain itself or via an indexing provider like Etherscan or Moralis.

First, setup your environment variables,

```
➜  cd apps/frontend
➜  cd .env.example .env
```

And then run the service,

```
➜  pnpm dev
```

If you'd prefer to not run this service, you can rely on an already live one at https://permissionless-chainlink-feeds-frontend.vercel.app. Just make sure to replace the `API_ENDPOINT` variable in [apps/contracts/scripts/utils.ts](./apps/contracts/scripts/utils.ts) with this live URL.

#### Smart contracts

Again we need to first we need to setup our environment variables,

```
➜  cd app/contracts
➜  cp .env.example .env
```

Then we can deploy the `ChainlinkAggregator`. This script will query initialisation variables from the API server you ran in the previous step, so make sure you've got that running before deploying this.

```
➜  pnpm hardhat run ./scripts/deploy-aggregator.ts --network mumbai
```

To test everything is working, we can manually relay the latest round data from Goerli to Mumbai,

```
➜  pnpm hardhat run ./scripts/update-answer.ts --network goerli
```

And finally query the latest round data on Mumbai,

```
➜  pnpm hardhat run ./scripts/get-answer.ts --network mumbai
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

Triggering round updates manually as we've just done is great, but even better would be some kind of automated process to relay new round data as soon as its submitted on chain. There are of course many options available to us to automate these round updates, a few ideas that spring to mind include,

- Running a lightweight indexer that upon finding `NewTransmission` events, sends the origin chain message
- Setup a CRON job that queries for the latest round ID and upon finding a new one, sends the origin chain message
- Configure an onchain messaging system like [Gelato](https://gelato.network) or [Keeper](https://keep3r.network/) to periodically post the round data.

Configuring Gelato is one of the simplest ways to get started with on chain automation and they support many of the same networks that Hyperlane does. Running the following command,

```
➜  pnpm hardhat run ./scripts/deploy-gelato.ts --network goerli
```

Will deploy an instance of the `GelatoAutomate` contract and fund it with 1 GoerliETH. There will also be additional logging similar to this,

```
[gelato] deploying...
[gelato] deployed to: 0xF19C411808288e78Bb7C7DeC2b782217B0666838
[gelato] funded for interchain gas payments
Creating Task...
Task created, taskId: 0x630181458d62d420bfde1303320f15e931c7fbf0f4e26b3da42c8e9a01e4667a (tx hash: 0xe43fa116ac1e471d893d0f6ed1a57daef5854d8ddf18015855f4db344e1e627a)
> https://app.gelato.network/task/0x630181458d62d420bfde1303320f15e931c7fbf0f4e26b3da42c8e9a01e4667a?chainId=5
```

So you can navigate to the Gelato dashboard and monitor the automations status yourself.
