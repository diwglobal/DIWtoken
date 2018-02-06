const Deploy = require("../utils/Deploy");
const { duration } = require("../utils/increaseTime");
const Keys = require("../keys");
const TokenVesting = artifacts.require("./TokenVesting.sol");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const keys = Keys(network);
  const deploy = Deploy(deployer, network);
  const contracts = require(`../build/addresses-${network}.json`);

  // -> vesting
  const totalVestSupply = web3.toWei(20e7, "ether");
  const vestingCliff = duration.months(2);  
  const vestingStart = new web3.BigNumber(+new Date() / 1e3).minus(vestingCliff);
  const vestingDuration = new web3.BigNumber(duration.years(1)).plus(vestingCliff);

  /*
    Procedure:

      1. supplier approves script
      2. script creates vesting contracts
      3. script transfers tokens to each vest contract

      // vesting contract example
      const vesting1 = await TokenVesting.new(
        keys.founder,
        vestingStart,
        vestingCliff,
        vestingDuration,
        false
      );
  */
};

module.exports = start;