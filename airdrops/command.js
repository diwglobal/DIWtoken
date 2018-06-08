const [, , , , , network, target] = process.argv;
const path = require("path");
const web3Utils = require("web3-utils");

const DIW = artifacts.require("DIW");
const AirdropperERC20 = artifacts.require("AirdropperERC20_v2");
const Deployer = require("solidity-utils/helpers/Deployer");
const outputsDir = path.join(__dirname, "outputs", target);

if (!target) throw Error("invalid target");

module.exports = async callback => {
  const items = require(path.join(outputsDir, "output.json"));
  const deployer = Deployer({ network });
  const contractsAddr = deployer.getAddresses();
  const diw = await DIW.at(contractsAddr.DIW);
  const airdropper = await AirdropperERC20.at(contractsAddr.AirdropperERC20_v2);

  await Promise.all(
    items.map(async item => {
      const { id, batch } = item;

      const { addresses, amounts } = batch.reduce(
        (oldObj, data) => {
          const newObj = oldObj;

          newObj.addresses.push(data.address);
          newObj.amounts.push(data.amount);

          return newObj;
        },
        {
          addresses: [],
          amounts: []
        }
      );

      const airdropperAmount = await diw
        .balanceOf(contractsAddr.AirdropperERC20_v2)
        .then(v => v.toString());
      const sumAmounts = amounts.reduce((sum, v) => (sum += +v), 0);

      // console.log(airdropperAmount, sumAmounts);

      return airdropper
        .multiSend(contractsAddr.DIW, id, addresses, amounts)
        .then(v => console.log(id, v))
        .catch(v => console.error(id, v));
    })
  );

  callback("done");
};
