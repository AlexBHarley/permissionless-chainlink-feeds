import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-contract-sizer';

import { SolcUserConfig } from 'hardhat/types';

import * as dotenv from 'dotenv';
dotenv.config();

const DEFAULT_PRIVATE_KEY =
    process.env.MNEMONIC || '1000000000000000000000000000000000000000000000000000000000000000';

const DEFAULT_COMPILER_SETTINGS: SolcUserConfig = {
    version: '0.8.15',
    settings: {
        optimizer: {
            enabled: true,
            runs: 1_000_000
        },
        metadata: {
            bytecodeHash: 'none'
        }
    }
};

module.exports = {
    networks: {
        hardhat: {
            // chainId: 137,
            // forking: {
            //   url: `https://polygon-rpc.com`,
            //   blockNumber: 27081600 // hardcode block number to increase performance of the local cache
            // },
            allowUnlimitedContractSize: true,
            loggingEnabled: false,
            accounts: {
                count: 100
            }
        },
        eth: {
            url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID_PROJECT}`,
            chainId: 1,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        ropsten: {
            url: `https://ropsten.infura.io/v3/${process.env.INFURA_ID_PROJECT}`,
            chainId: 3,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        rinkeby: {
            url: `https://rinkeby.infura.io/v3/${process.env.INFURA_ID_PROJECT}`,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        goerli: {
            url: `https://goerli.infura.io/v3/${process.env.INFURA_ID_PROJECT}`,
            chainId: 5,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        kovan: {
            url: `https://kovan.infura.io/v3/${process.env.INFURA_ID_PROJECT}`,
            chainId: 42,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        bscTest: {
            url: `https://data-seed-prebsc-2-s3.binance.org:8545`,
            chainId: 97,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        bsc: {
            url: `https://bsc-dataseed.binance.org/`,
            chainId: 56,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        polygonMumbai: {
            url: `https://rpc-mumbai.maticvigil.com`,
            chainId: 80001,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        polygon: {
            url: `https://polygon-rpc.com`,
            chainId: 137,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        avalanche: {
            url: `https://api.avax.network/ext/bc/C/rpc`,
            chainId: 43114,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        fantom: {
            url: `https://rpc.ftm.tools/`,
            chainId: 250,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        arbitrum: {
            url: `https://arb1.arbitrum.io/rpc`,
            chainId: 42161,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        },
        aurora: {
            url: `https://mainnet.aurora.dev`,
            chainId: 1313161554,
            accounts: [`0x${DEFAULT_PRIVATE_KEY}`]
        }
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
            arbitrumTestnet: process.env.ARBITRUM_API_KEY
        }
        //apiKey: `${process.env.AURORA_API_KEY}`,
    },
    solidity: {
        compilers: [DEFAULT_COMPILER_SETTINGS]
    },
    contractSizer: {
        alphaSort: false,
        disambiguatePaths: true,
        runOnCompile: false
    },
    typechain: {
        outDir: 'typechain',
        target: 'ethers-v5'
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === 'true',
        noColors: true,
        outputFile: 'reports/gas_usage/summary.txt'
    }
};
