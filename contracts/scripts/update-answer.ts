import { abi as MailboxAbi } from '@hyperlane-xyz/core/artifacts/contracts/Mailbox.sol/Mailbox.json';
import { abi as InterchainGasPaymasterAbi } from '@hyperlane-xyz/core/artifacts/contracts/igps/InterchainGasPaymaster.sol/InterchainGasPaymaster.json';
import { chainIdToMetadata, hyperlaneContractAddresses } from '@hyperlane-xyz/sdk';
import { utils } from '@hyperlane-xyz/utils';
import { ethers } from 'hardhat';

import { AGGREGATOR_ADDRESS, DESTINATION_DOMAIN, FEED_ADDRESS, apiFetch } from './utils';

async function main() {
  const [signer] = await ethers.getSigners();
  const chainId = await signer.getChainId();

  const latestRoundId = await apiFetch(`/latest_round_id/${FEED_ADDRESS}`).then(x => x.json());
  console.log('[update-answer] latestRoundId', latestRoundId);

  const addresses = hyperlaneContractAddresses[chainIdToMetadata[chainId].name];

  const mailbox = await ethers.getContractAt(MailboxAbi, addresses.mailbox);
  const igp = await ethers.getContractAt(
    InterchainGasPaymasterAbi,
    addresses.interchainGasPaymaster
  );

  const receipt = await mailbox
    .dispatch(DESTINATION_DOMAIN, utils.addressToBytes32(AGGREGATOR_ADDRESS), latestRoundId)
    .then(x => x.wait());

  const event = receipt.events.find(x => x.event === 'DispatchId');
  const messageId = event.args.messageId;
  console.log('[update-answer] dispatched', messageId);

  const gasQuote = await igp.quoteGasPayment(DESTINATION_DOMAIN, 350_000);
  await igp
    .payForGas(messageId, DESTINATION_DOMAIN, 350_000, await signer.getAddress(), {
      value: gasQuote
    })
    .then(x => x.wait());
  console.log('[update-answer] gas paid');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
