import { expect } from "chai";
import { Signer } from "ethers";
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
    aggregator = (await ethers.deployContract(
      "ChainlinkAggregator",
      [...constructor.data, await owner.getAddress()],
      owner
    )) as ChainlinkAggregator;
  });

  it("only owner can setConfig", async () => {
    await expect(
      random.sendTransaction({ to: aggregator.address, data: setConfig.data })
    ).to.revertedWith("Only callable by owner");
  });

  it("setConfig works", async () => {
    await owner.sendTransaction({
      to: aggregator.address,
      data: setConfig.data,
    });
    expect(await aggregator.s_signers("0")).to.eql(
      "0x080D263FAA8CBd848f0b9B24B40e1f23EA06b3A3"
    );
    expect(await aggregator.s_signers(1)).to.eql(
      "0xCdEf689d3098A796F840A26f383CE19F4f023B5B"
    );
    expect(await aggregator.s_signers(2)).to.eql(
      "0xb7bEA3A5d410F7c4eC2aa446ae4236F6Eed6b16A"
    );

    const { latestEpochAndRound, threshold, latestAggregatorRoundId } =
      await aggregator.s_hotVars();
    expect(latestEpochAndRound).to.eql(0);
    expect(threshold).to.eql(10);
    expect(latestAggregatorRoundId).to.eql(0);
  });

  it("verifies and records round data", async () => {
    await aggregator.verify(transmit.data, "0x");

    const { roundId, answer, answeredInRound } =
      await aggregator.latestRoundData();
    expect(roundId).to.eql(ethers.BigNumber.from(1));
    expect(answer).to.eql(ethers.BigNumber.from(191082886000));
    expect(answeredInRound).to.eql(ethers.BigNumber.from(1));

    const { latestEpochAndRound, threshold, latestAggregatorRoundId } =
      await aggregator.s_hotVars();
    expect(latestEpochAndRound).to.eql(9978630);
    expect(threshold).to.eql(10);
    expect(latestAggregatorRoundId).to.eql(1);
  });
});
