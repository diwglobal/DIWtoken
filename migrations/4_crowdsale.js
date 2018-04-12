const Deploy = require("../utils/Deploy");
const Keys = require("../keys");
const { duration } = require("../utils/increaseTime");
const DIWCrowdsale = artifacts.require("./DIWCrowdsale.sol");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const keys = Keys(network);
  const deploy = Deploy(deployer, network);
  const contracts = require(`../build/addresses-${network}.json`);

  // -> crowdsale info
  const crowdsaleSupply = web3.toWei(7e8, "ether");
  const startTime = 1525348800;
  const endTime = startTime + +duration.days(28);
  const rate = 10500;
  const wallet = keys.supplier;

  // --> crowdsale
  const crowdsale = await deploy(
    DIWCrowdsale,
    startTime,
    endTime,
    rate,
    wallet,
    keys.supplier,
    contracts.DIW
  );

  // transfer ownership
  await crowdsale.transferOwnership(keys.supplier);
};

module.exports = start;
