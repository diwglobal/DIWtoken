const Deploy = require("../utils/Deploy");
const AirdropperERC20 = artifacts.require("./AirdropperERC20.sol");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const deploy = Deploy(deployer, network);
  const contracts = require(`../build/addresses-${network}.json`);

  // -> airdropper
  const airdropper = await deploy(AirdropperERC20);
};

module.exports = start;