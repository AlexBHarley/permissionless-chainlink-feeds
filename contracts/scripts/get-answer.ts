import { ethers } from 'hardhat';

import { AGGREGATOR_ADDRESS } from './utils';

async function main() {
  const agg = await ethers.getContractAt('ChainlinkAggregator', AGGREGATOR_ADDRESS);
  console.log(await agg.latestRoundData());
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
