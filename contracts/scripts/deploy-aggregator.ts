import {
  chainIdToMetadata,
  hyperlaneContractAddresses,
} from "@hyperlane-xyz/sdk";
import { ethers } from "hardhat";

import { API_ENDPOINT, FEED_ADDRESS, apiFetch } from "./utils";

async function main() {
  const [signer] = await ethers.getSigners();
  const chainId = await signer.getChainId();

  const [constructorArguments, setConfigData]: [string[], string] =
    await Promise.all([
      apiFetch(`/constructor_arguments/${FEED_ADDRESS}`).then((x) => x.json()),
      apiFetch(`/set_config_data/${FEED_ADDRESS}`).then((x) => x.text()),
    ]);

  const aggregator = await ethers.deployContract(
    "ChainlinkAggregator",
    constructorArguments
  );
  const deploy = await aggregator.deployTransaction.wait();
  console.log("[Aggregator] deployed to", deploy.contractAddress);

  const addresses = hyperlaneContractAddresses[chainIdToMetadata[chainId].name];
  const init = await aggregator.initialize(
    addresses.mailbox, // mailbox
    addresses.interchainGasPaymaster, // gas paymaster
    aggregator.address, // ism, itself in this case
    signer.address // owner, recommend setting this to a multi sig at the very least
  );
  await init.wait();
  console.log("[Aggregator] initialized");

  const setConfig = await signer.sendTransaction({
    to: aggregator.address,
    data: setConfigData,
  });
  await setConfig.wait();
  console.log("[Aggregator] setConfig");

  const setOffchainUrls = await aggregator.setOffchainUrls([
    `${API_ENDPOINT}/round_data/${FEED_ADDRESS}/{data}`,
  ]);
  await setOffchainUrls.wait();

  console.log("[Aggregator] setOffchainUrls");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
