## Chainlink API Proxy

### Deployment

I want to deploy an ETH/USD price feed on rollup X.

1. Get aggregator address from https://data.chain.link
2. Get constructor arguments from Ethereum
3. Deploy contract on X
4. Get setConfig data from Ethereum
5. Call `setConfig` on X
6. Set offchain URL to `${API}/${aggregator_address}`

### Requesting a round

1. Want to relay a round (say 99) from Ethereum to rollup X

- can also just ask for the latest round

2. Send message to Mailbox
   {
   to: Aggregator,
   body: roundId
   }

3. Relayer picks up message, destined for Aggregator
4. Relayer asks ISM for offchain URL, passing round ID as calldata
5. Relayer asks API for information,
   POST `${API}/${aggregator_address}` { sender: A, data: roundId }
6. API responds with transmit data
7. Relayer calls `Mailbox.process` with message and metadata
