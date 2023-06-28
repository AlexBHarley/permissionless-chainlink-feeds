import { ethers } from "hardhat";

import { API_ENDPOINT, FEED_ADDRESS, ORIGIN_DOMAIN, apiFetch } from "./utils";

async function main() {
  const [signer] = await ethers.getSigners();

  const [constructorArguments, setConfigData]: [string[], string] =
    await Promise.all([
      apiFetch(`/${ORIGIN_DOMAIN}/${FEED_ADDRESS}/constructor_arguments`).then(
        (x) => x.json()
      ),
      apiFetch(`/${ORIGIN_DOMAIN}/${FEED_ADDRESS}/set_config_data`).then((x) =>
        x.json()
      ),
    ]);

  const aggregator = await ethers.deployContract("ChainlinkAggregator", [
    ...constructorArguments,
    await signer.getAddress(),
  ]);
  const deploy = await aggregator.deployTransaction.wait();
  console.log("[Aggregator] deployed to", deploy.contractAddress);

  const setConfig = await signer.sendTransaction({
    to: aggregator.address,
    data: setConfigData,
  });
  await setConfig.wait();
  console.log("[Aggregator] setConfig");

  const setOffchainUrls = await aggregator.setOffchainUrls([
    `${API_ENDPOINT}/${ORIGIN_DOMAIN}/${FEED_ADDRESS}/round_data`,
  ]);
  await setOffchainUrls.wait();

  console.log("[Aggregator] setOffchainUrls");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
