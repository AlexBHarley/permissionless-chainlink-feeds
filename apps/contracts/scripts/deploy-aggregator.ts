import { ethers } from "hardhat";
import {
  chainIdToMetadata,
  hyperlaneContractAddresses,
} from "@hyperlane-xyz/sdk";

import { API_ENDPOINT, FEED_ADDRESS, ORIGIN_DOMAIN, apiFetch } from "./utils";

async function main() {
  const [signer] = await ethers.getSigners();

  const [constructorArguments, setConfigArguments]: [string[], string] =
    await Promise.all([
      apiFetch(`/${ORIGIN_DOMAIN}/${FEED_ADDRESS}/constructor_arguments`).then(
        (x) => x.json()
      ),
      apiFetch(`/${ORIGIN_DOMAIN}/${FEED_ADDRESS}/set_config_arguments`).then(
        (x) => x.json()
      ),
    ]);

  const aggregator = await ethers.deployContract("ChainlinkAggregator", [
    ...constructorArguments,
    ...setConfigArguments,
    hyperlaneContractAddresses[
      chainIdToMetadata[await signer.getChainId()].name
    ].mailbox,
    [`${API_ENDPOINT}/${ORIGIN_DOMAIN}/${FEED_ADDRESS}/round_data`],
    ORIGIN_DOMAIN,
  ]);
  const deploy = await aggregator.deployTransaction.wait();
  console.log("[Aggregator] deployed to", deploy.contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
