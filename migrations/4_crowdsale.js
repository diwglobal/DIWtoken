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
  const startTime = 1525262400;
  const endTime = startTime + +duration.days(29);
  const rate = 10500;
  const wallet = keys.wallet;

  // --> crowdsale
  const crowdsale = await deploy(
    DIWCrowdsale,
    startTime,
    endTime,
    rate,
    wallet,
    contracts.DIW
  );

  // transfer ownership
  await crowdsale.transferOwnership(keys.supplier);
};

module.exports = start;
