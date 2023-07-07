import { expect } from "chai";
import { Signer, constants } from "ethers";
import { ethers } from "hardhat";

import { ChainlinkAggregator } from "../typechain";
import * as constructor from "./data/constructor";
import * as setConfig from "./data/set-config";
import * as transmit from "./data/transmit";

describe("ChainlinkAggregator", () => {
  let owner: Signer;
  let random: Signer;

  let aggregator: ChainlinkAggregator;

  before(async () => {
    [owner, random] = await ethers.getSigners();

    // Data for ETH/USD feed on Goerli
    // https://goerli.etherscan.io/address/0x9b0FC4bb9981e5333689d69BdBF66351B9861E62
    aggregator = (await ethers.deployContract(
      "ChainlinkAggregator",
      [...constructor.data, constants.AddressZero, ["http://localhost:3000"]],
      owner
    )) as ChainlinkAggregator;
  });

  it("only owner can setConfig", async () => {
    await expect(
      // @ts-expect-error
      aggregator.connect(random).setConfig(...setConfig.data)
    ).to.revertedWith("Only callable by owner");
  });

  it("setConfig works", async () => {
    // @ts-expect-error
    await aggregator.connect(owner).setConfig(...setConfig.data);
    expect(await aggregator.s_signers("0")).to.eql(
      "0x5206B45fA792a2cFecFF1399d5bAd18C2da4bcA1"
    );
    expect(await aggregator.s_signers(1)).to.eql(
      "0xE6B7fCaB90BA57D77d8Ef7c98223e8c3985A9dEC"
    );
    expect(await aggregator.s_signers(2)).to.eql(
      "0x8C7461eaEAa482202ce152ffF7a73D3a531E4656"
    );

    const { latestEpochAndRound, threshold, latestAggregatorRoundId } =
      await aggregator.s_hotVars();
    expect(latestEpochAndRound).to.eql(0);
    expect(threshold).to.eql(1);
    expect(latestAggregatorRoundId).to.eql(0);
  });

  it("verifies and records round data", async () => {
    await aggregator.verify(transmit.data, "0x");

    const { roundId, answer, answeredInRound } =
      await aggregator.latestRoundData();
    expect(roundId).to.eql(ethers.BigNumber.from(1));
    expect(answer).to.eql(ethers.BigNumber.from(186025000000));
    expect(answeredInRound).to.eql(ethers.BigNumber.from(1));
  });
});
