import hre from "hardhat";
import {
  AutomateSDK,
  isAutomateSupported,
  TaskTransaction,
  GELATO_ADDRESSES,
} from "@gelatonetwork/automate-sdk";
import { Contract, utils } from "ethers";
import {
  hyperlaneContractAddresses,
  chainIdToMetadata,
} from "@hyperlane-xyz/sdk";

import { abi as AutomateAbi } from "../artifacts/contracts/GelatoAutomate.sol/GelatoAutomate.json";
import {
  AGGREGATOR_ADDRESS,
  DESTINATION_DOMAIN,
  FEED_ADDRESS,
  ORIGIN_DOMAIN,
} from "./utils";

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const chainId = await signer.getChainId();

  if (!isAutomateSupported(chainId)) {
    console.log(`[gelato] network not supported (${chainId})`);
    return;
  }
  const automate = new AutomateSDK(chainId, signer);

  // Deploying contract
  const factory = await hre.ethers.getContractFactory("GelatoAutomate");
  console.log("[gelato] deploying...");

  const contract = await factory.deploy(
    GELATO_ADDRESSES[chainId].automate,
    await signer.getAddress(),
    hyperlaneContractAddresses[chainIdToMetadata[ORIGIN_DOMAIN].name].mailbox,
    hyperlaneContractAddresses[chainIdToMetadata[ORIGIN_DOMAIN].name]
      .interchainGasPaymaster,
    FEED_ADDRESS,
    DESTINATION_DOMAIN,
    AGGREGATOR_ADDRESS
  );
  await contract.deployed();
  console.log("[gelato] deployed to:", contract.address);

  await signer
    .sendTransaction({
      to: contract.address,
      value: utils.parseEther("1"),
    })
    .then((x) => x.wait());
  console.log("[gelato] funded for interchain gas payments");

  // Prepare Task data to automate
  const counter = new Contract(contract.address, AutomateAbi, signer);
  const selector = counter.interface.getSighash("relayRoundData(uint256)");
  const resolverData = counter.interface.getSighash("checker()");

  // Create task
  console.log("Creating Task...");
  const { taskId, tx }: TaskTransaction = await automate.createTask({
    execAddress: contract.address,
    execSelector: selector,
    execAbi: JSON.stringify(AutomateAbi),
    resolverAddress: contract.address,
    resolverData: resolverData,
    resolverAbi: JSON.stringify(AutomateAbi),
    name: "Automated Chainlink Price Feed",
    dedicatedMsgSender: false,
    useTreasury: false,
  });
  await tx.wait();
  console.log(`Task created, taskId: ${taskId} (tx hash: ${tx.hash})`);
  console.log(`> https://app.gelato.network/task/${taskId}?chainId=${chainId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
