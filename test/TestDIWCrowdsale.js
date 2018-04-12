const expectThrow = require("../utils/expectThrow");
const { advanceToBlock } = require("../utils/advanceToBlock");
const { increaseTime, duration } = require("../utils/increaseTime");
const DIW = artifacts.require("DIW");
const DIWCrowdsale = artifacts.require("DIWCrowdsale");

const getNow = () => {
  return new Promise((resolve, reject) => {
    web3.eth.getBlockNumber((err, number) => {
      if (err) return reject(err);

      web3.eth.getBlock(number, (_err, _res) => {
        if (_err) return reject(_err);

        return resolve(_res.timestamp);
      });
    });
  });
};

const sendEther = ({ from, to, value }) => {
  return new Promise((resolve, reject) => {
    web3.eth.sendTransaction(
      {
        from,
        to,
        value
      },
      (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      }
    );
  });
};

contract("DIWCrowdsale", function(accounts) {
  const totalSupply = web3.toWei(1e9, "ether");
  const crowdsaleSupply = web3.toWei(1e9, "ether");
  const rate1 = 10500;
  const rate2 = 9500;
  const rate3 = 8500;
  const rate4 = 8000;

  const [owner, buyer1, buyer2] = accounts;
  const supplier = owner;
  const wallet = owner;
  let token;
  let crowdsale;

  beforeEach(async function() {
    const { startTime, endTime } = await (async () => {
      const startTime = await getNow().then(v => v + +duration.days(1));
      const endTime = startTime + +duration.days(28);

      return {
        startTime: Math.floor(startTime),
        endTime: Math.floor(endTime)
      };
    })();

    token = await DIW.new(owner, totalSupply);
    crowdsale = await DIWCrowdsale.new(
      startTime,
      endTime,
      rate1,
      wallet,
      token.address
    );

    await token.transfer(crowdsale.address, crowdsaleSupply);
    await increaseTime(duration.days(2));
  });

  it("buy tokens with 1 ether", async function() {
    await crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(1, "ether")
    });

    const buyer1TokenBalance = await token.balanceOf(buyer1);

    assert.isTrue(buyer1TokenBalance.equals(web3.toWei(rate1, "ether")));
  });

  it("change price", async function() {
    await crowdsale.changeRate(rate2);

    await crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(1, "ether")
    });

    const buyer1TokenBalance = await token.balanceOf(buyer1);

    assert.isTrue(buyer1TokenBalance.equals(web3.toWei(rate2, "ether")));
  });

  it("buy tokens when paused", async function() {
    await crowdsale.pause();

    await expectThrow(
      crowdsale.buyTokens(buyer1, {
        from: buyer1,
        value: web3.toWei(1, "ether")
      })
    );
  });

  it("buy tokens when unpaused", async function() {
    await crowdsale.pause();
    await crowdsale.unpause();

    crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(1, "ether")
    });

    const buyer1TokenBalance = await token.balanceOf(buyer1);

    assert.isTrue(buyer1TokenBalance.equals(web3.toWei(rate1, "ether")));
  });

  it("finish and burn", async function() {
    await increaseTime(duration.days(30));

    await expectThrow(
      crowdsale.buyTokens(buyer1, {
        from: buyer1,
        value: web3.toWei(1, "ether")
      })
    );

    const hasEnded = await crowdsale.hasEnded();
    assert.isTrue(hasEnded);

    await crowdsale.burnTokens();
    const crowdsaleTokenBalance = await token.balanceOf(crowdsale.address);
    assert.isTrue(crowdsaleTokenBalance.equals(0));
  });

  it("buy with less than 0.5 ether", async function() {
    await expectThrow(
      crowdsale.buyTokens(buyer1, {
        from: buyer1,
        value: web3.toWei(0.04, "ether")
      })
    );
  });
});
