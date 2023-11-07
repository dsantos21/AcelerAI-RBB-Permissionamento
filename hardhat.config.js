require("@nomicfoundation/hardhat-toolbox");
require('@nomiclabs/hardhat-truffle5');

const dotenv = require('dotenv');

dotenv.config();

/* The adress used when sending transactions to the node */
var address = process.env.BESU_NODE_PERM_ACCOUNT;

/* The private key associated with the address above */
var privateKey = process.env.BESU_NODE_PERM_KEY;
if (privateKey === undefined) {
  // Apenas para validar o valor da configuração da rede Besu, que é verificado mesmo quando não usada (ex: testes).
  privateKey = '0000000000000000000000000000000000000000000000000000000000000000';
}

/* The network chain id */
var chainId = Number(process.env.CHAIN_ID);

/* The endpoint of the Ethereum node */
var endpoint = process.env.BESU_NODE_PERM_ENDPOINT;
if (endpoint === undefined) {
  endpoint = "http://127.0.0.1:8545";
}

module.exports = {
  networks: {
    hardhat: {
      chainId: 1337
    },
    besu: {
      url: endpoint,
      accounts: [privateKey],
      chainId: chainId,
      from: address,
      //gasPrice: 0, // não usar valor 0, mas sim "auto" (default)
    }
  },

  solidity: "0.5.9",
};
