import { ethers } from 'hardhat';

import { utils } from '@hyperlane-xyz/utils';
import { chainIdToMetadata, hyperlaneContractAddresses } from '@hyperlane-xyz/sdk';
import { abi as MailboxAbi } from '@hyperlane-xyz/core/artifacts/contracts/Mailbox.sol/Mailbox.json';
import { AGGREGATOR_ADDRESS, DESTINATION_DOMAIN, FEED_ADDRESS, apiFetch } from './utils';

async function main() {
  const [signer] = await ethers.getSigners();
  const chainId = await signer.getChainId();

  const latestRoundId = await apiFetch(`/latest_round_id/${FEED_ADDRESS}`).then(x => x.json());
  console.log('latestRoundId', latestRoundId);

  const roundData = await apiFetch(`/round_data/${FEED_ADDRESS}/${latestRoundId}`).then(x =>
    x.text()
  );

  const addresses = hyperlaneContractAddresses[chainIdToMetadata[chainId].name];

  const mailbox = await ethers.getContractAt(MailboxAbi, addresses.mailbox);

  const tx = await mailbox.dispatch(
    DESTINATION_DOMAIN,
    utils.addressToBytes32(AGGREGATOR_ADDRESS),
    roundData
  );
  console.log(await tx.wait());

  // todo, pay for gas
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
