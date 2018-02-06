const Migrations = artifacts.require("./Migrations.sol");
const Deploy = require("../utils/Deploy");

const start = async (deployer, network, accounts) => {
  if (network === "develop") return;

  const deploy = Deploy(deployer, network);
  const migrations = await deploy(Migrations);
};

module.exports = start;
