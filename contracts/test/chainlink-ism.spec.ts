import {
  InterchainGasPaymaster,
  TestMailbox,
  TestInterchainGasPaymaster__factory,
  MockMailbox__factory,
  MockMailbox,
} from "@hyperlane-xyz/core";
import { expect } from "chai";
import { Signer, utils as ethersUtils } from "ethers";
import { ethers } from "hardhat";

import { ChainlinkAggregator } from "../typechain";

import * as constructor from "./data/constructor";
import * as setConfig from "./data/set-config";
import * as transmit from "./data/transmit";
import { utils } from "@hyperlane-xyz/utils";

// const [signer] = await ethers.getSigners();
// const mailboxFactory = new MockMailbox__factory(signer);
// const testRecipientFactory = new TestRecipient__factory(signer);
// const originMailbox = await mailboxFactory.deploy(ORIGIN_DOMAIN);
// const destinationMailbox = await mailboxFactory.deploy(DESTINATION_DOMAIN);
// await originMailbox.addRemoteMailbox(DESTINATION_DOMAIN, destinationMailbox.address);
// const recipient = await testRecipientFactory.deploy();

// const body = ethers.utils.toUtf8Bytes('This is a test message');

// await originMailbox.dispatch(DESTINATION_DOMAIN, utils.addressToBytes32(recipient.address), body);
// await destinationMailbox.processNextInboundMessage();

// const dataReceived = await recipient.lastData();
// expect(dataReceived).to.eql(ethers.utils.hexlify(body));

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
    expect(true).to.eql(true);
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

    const {
      latestConfigDigest,
      latestEpochAndRound,
      threshold,
      latestAggregatorRoundId,
    } = await aggregator.s_hotVars();
    // expect(latestConfigDigest).to.eql('0xab57ae8f0defe8c59d1ecdbaa38776d0');
    expect(latestEpochAndRound).to.eql(0);
    expect(threshold).to.eql(10);
    expect(latestAggregatorRoundId).to.eql(0);
  });

  it("verifies in JS", async () => {
    // await originMailbox.dispatch(
    //   DESTINATION,
    //   utils.addressToBytes32(aggregator.address),
    //   transmit.data
    // );
    // await destinationMailbox.processNextInboundMessage({ gasLimit: 2_000_000 });

    await aggregator.verify(transmit.data, "0x");
    console.log(await aggregator.latestRoundData());
    // expect(
    //   await ism.verify(
    //     metadata,
    //     utils.formatMessage(
    //       1, // version, unimportant
    //       1, // nonce, unimportant
    //       ORIGIN,
    //       Wallet.createRandom().address,
    //       1, // destination, unimportant
    //       Wallet.createRandom().address,
    //       report
    //     )
    //   )
    // ).to.eql(true);
  });
});
