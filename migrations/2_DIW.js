const Deploy = require("../utils/Deploy");
const Keys = require("../keys");
const { duration } = require("../utils/increaseTime");
const DIW = artifacts.require("./DIW.sol");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const keys = Keys(network);
  const deploy = Deploy(deployer, network);

  // total supply
  const totalSupply = web3.toWei(1e9, "ether");

  // --> token
  const diw = await deploy(DIW, keys.supplier, totalSupply);
};

module.exports = start;
