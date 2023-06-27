import {
  InterchainGasPaymaster,
  TestInterchainGasPaymaster__factory,
} from "@hyperlane-xyz/core";
import { utils } from "@hyperlane-xyz/utils";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

import {
  ChainlinkAggregator,
  MockMailbox,
  MockMailbox__factory,
} from "../typechain";

import * as constructor from "./data/constructor";
import * as setConfig from "./data/set-config";
import * as transmit from "./data/transmit";

describe("ChainlinkAggregator", () => {
  let owner: Signer;
  let random: Signer;

  let aggregator: ChainlinkAggregator;
  let originMailbox: MockMailbox;
  let destinationMailbox: MockMailbox;
  let igp: InterchainGasPaymaster;

  const ORIGIN = 1;
  const DESTINATION = 2;

  before(async () => {
    [owner, random] = await ethers.getSigners();
    aggregator = (await ethers.deployContract(
      "ChainlinkAggregator",
      constructor.data,
      owner
    )) as ChainlinkAggregator;

    const mailboxFactory = new MockMailbox__factory(owner);
    originMailbox = await mailboxFactory.deploy(ORIGIN);
    destinationMailbox = await mailboxFactory.deploy(DESTINATION);

    await originMailbox.addRemoteMailbox(
      DESTINATION,
      destinationMailbox.address
    );
    await destinationMailbox.addRemoteMailbox(ORIGIN, originMailbox.address);

    const igpFactory = new TestInterchainGasPaymaster__factory(owner);
    igp = await igpFactory.deploy(await owner.getAddress());

    await aggregator.initialize(
      destinationMailbox.address,
      igp.address,
      aggregator.address, // ism
      await owner.getAddress()
    );
  });

  it("only owner can setConfig", async () => {
    await expect(
      random.sendTransaction({ to: aggregator.address, data: setConfig.data })
    ).to.revertedWith("Ownable: caller is not the owner");
  });

  it("only mailbox can verify", async () => {
    await expect(aggregator.verify("0x", "0x")).to.revertedWith("!mailbox");
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
    await originMailbox.dispatch(
      DESTINATION,
      utils.addressToBytes32(aggregator.address),
      transmit.data
    );
    await destinationMailbox.processNextInboundMessage(transmit.data, {
      gasLimit: 2_000_000,
    });

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
