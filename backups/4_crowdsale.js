const Deploy = require("../utils/Deploy");
const Keys = require("../keys");
const { duration } = require("../utils/increaseTime");
const MilestoneCrowdsale = artifacts.require("./MilestoneCrowdsale.sol");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const keys = Keys(network);
  const deploy = Deploy(deployer, network);
  const contracts = require(`../build/addresses-${network}.json`);

  // -> crowdsale info
  const crowdsaleSupply = web3.toWei(7e8, "ether");
  const crowdsaleSeconds = duration.days(10);
  
  // --> crowdsale
  const crowdsale = await deploy(
    MilestoneCrowdsale,
    crowdsaleSeconds,
    keys.supplier,
    contracts.DIW
  );

  // send crowdsaleSupply

  // add milestones and start
  // await crowdsale.addMilestone(web3.toWei(1e8, "ether"), web3.toWei(0.000085, "ether"), 1);
  // await crowdsale.addMilestone(web3.toWei(2e8, "ether"), web3.toWei(0.000095, "ether"), 1);
  // await crowdsale.addMilestone(web3.toWei(3e8, "ether"), web3.toWei(0.000105, "ether"), 1);
  // await crowdsale.addMilestone(web3.toWei(4e8, "ether"), web3.toWei(0.000115, "ether"), 1);
  // await crowdsale.addMilestone(web3.toWei(55e6, "ether"), web3.toWei(0.000120, "ether"), 1);
  // await crowdsale.addMilestone(web3.toWei(7e8, "ether"), web3.toWei(0.000125, "ether"), 1);

  // start
  // await crowdsale.start();

  // transfer ownership
  // await crowdsale.transferOwnership(keys.supplier);
};

module.exports = start;
