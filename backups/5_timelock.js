const Deploy = require("../utils/Deploy");
const Keys = require("../keys");
const { duration } = require("../utils/increaseTime");
const TokenTimelock = artifacts.require("./TokenTimelock.sol");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const keys = Keys(network);
  const deploy = Deploy(deployer, network);
  const contracts = require(`../build/addresses-${network}.json`);
  const [owner] = accounts;

  // timelock
  const totalTimelockSupply = web3.toWei(8e7, "ether");
  const timelockSeconds = duration.years(1);
  const now = +new Date() / 1e3;
  const timelockEndTime = new web3.BigNumber(now).plus(timelockSeconds);

  // --> timelock
  const timelock = await deploy(
    TokenTimelock,
    contracts.DIW,
    keys.supplier,
    timelockEndTime
  );

  /*
    Procedure
    
      1. supplier transfers tokens to timelock contract
  */
};

module.exports = start;
