require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-web3')
require('solidity-coverage')
require('hardhat-docgen')
require('@openzeppelin/hardhat-upgrades')
require('dotenv').config();
require('./tasks');

const chainIds = {
  hardhat: 31337,
  ethmainnet: 1,
  ethropsten: 3,
  ethrinkeby: 4,
  ethgoerli: 5,
  ethkovan: 42,
  bscmainnet: 56,
  bsctestnet: 97
};

let mnemonic;
if (!process.env.MNEMONIC) {
  throw new Error('Please set your MNEMONIC in a .env file');
} else {
  mnemonic = process.env.MNEMONIC;
}

let providerApiKey;
if (!process.env.PROVIDER_API_KEY) {
  throw new Error('Please set your INFURA_API_KEY in a .env file');
} else {
  providerApiKey = process.env.PROVIDER_API_KEY;
}

function createNetworkConfig(network) {
  let net_prefix = network.slice(0, 3);
  let net_postfix = network.slice(3);;
  let gas_price = 80000000000;
  if (net_prefix == "bsc") {
    gas_price = 5000000000;
  }
  const url = `https://speedy-nodes-nyc.moralis.io/${providerApiKey}/${net_prefix}/${net_postfix}`;
  return {
    accounts: { mnemonic: mnemonic },
    chainId: chainIds[network],
    gas: "auto",
    gasPrice: gas_price,
    url: url
  };
}

module.exports = {
  defaultNetwork: "dev",
  networks: {
    dev: {
      url: "http://127.0.0.1:8545/"
    },
    bscmainnet: createNetworkConfig('bscmainnet'),
    bsctestnet: createNetworkConfig('bsctestnet'),
    ethmainnet: createNetworkConfig('ethmainnet'),
    ethrinkeby: createNetworkConfig('ethrinkeby'),
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  mocha: {
    timeout: 20000
  },
  docgen: {
    path: './doc',
    clear: true,
    runOnCompile: true,
  }
}

