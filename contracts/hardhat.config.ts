import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";

import { chainMetadata, objMap } from "@hyperlane-xyz/sdk";

import { SolcUserConfig } from "hardhat/types";

import * as dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";

const DEFAULT_COMPILER_SETTINGS: SolcUserConfig = {
  version: "0.8.16",
  settings: {
    viaIR: true,
    optimizer: {
      enabled: true,
      runs: 200,
    },
    metadata: {
      bytecodeHash: "none",
    },
  },
};

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: "",
        blockNumber: 37251544,
      },
      allowUnlimitedContractSize: true,
      loggingEnabled: false,
      accounts: {
        count: 100,
      },
    },
    ...objMap(chainMetadata, (_chain, cc) => ({
      url: cc.publicRpcUrls[0].http,
      accounts: [PRIVATE_KEY],
      name: cc.name,
    })),
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      ropsten: process.env.ETHERSCAN_API_KEY,
      rinkeby: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      kovan: process.env.ETHERSCAN_API_KEY,
      // binance smart chain
      bsc: process.env.BSCSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
      // fantom mainnet
      opera: process.env.FANTOMSCAN_API_KEY,
      ftmTestnet: process.env.FANTOMSCAN_API_KEY,
      // polygon
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      // avalanche
      avalanche: process.env.AVALANCHE_API_KEY,
      avalancheFujiTestnet: process.env.AVALANCHE_API_KEY,
      // arbitrum
      arbitrumOne: process.env.ARBITRUM_API_KEY,
      arbitrumTestnet: process.env.ARBITRUM_API_KEY,
    },
  },
  solidity: {
    compilers: [DEFAULT_COMPILER_SETTINGS],
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: true,
    runOnCompile: false,
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    noColors: true,
    outputFile: "reports/gas_usage/summary.txt",
  },
};
