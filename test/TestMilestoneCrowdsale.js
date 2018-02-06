const expectThrow = require("../utils/expectThrow");
const { advanceToBlock } = require("../utils/advanceToBlock");
const { increaseTime, duration } = require("../utils/increaseTime");
const DIW = artifacts.require("DIW");
const MilestoneCrowdsale = artifacts.require("MilestoneCrowdsale");

contract("MilestoneCrowdsale", function(accounts) {
  const totalSupply = web3.toWei(10, "ether");
  const crowdsaleSupply = web3.toWei(10, "ether");
  const milestone1 = web3.toWei(9, "ether");
  const pricePerToken1 = 2;
  const pricePerWei1 = 1;
  const milestone2 = web3.toWei(10, "ether");
  const pricePerToken2 = 1;
  const pricePerWei2 = 2;
  const endSeconds = duration.days(1);

  const [owner, supplier, buyer1, buyer2] = accounts;
  let token;
  let crowdsale;

  beforeEach(async function() {
    token = await DIW.new(supplier, totalSupply);
    crowdsale = await MilestoneCrowdsale.new(endSeconds, owner, token.address);

    await token.transfer(crowdsale.address, crowdsaleSupply, {
      from: supplier
    });
  });

  it("stage: Preparing", async function() {
    // check stage
    const stage = await crowdsale.isStage.call(0);
    assert.isTrue(stage);

    // check if is ended
    const hasEnded = await crowdsale.hasEnded.call();
    assert.isFalse(hasEnded);

    // check milestones length
    const length = await crowdsale.getMilestonesLength();
    assert.isTrue(length.equals(0));

    // milestones index
    const [found, index] = await crowdsale.getCurrentMilestoneIndex();
    assert.isFalse(found);
    assert.isTrue(index.equals(0));

    // try to buy
    expectThrow(
      crowdsale.buyTokens(buyer1, {
        from: buyer1,
        value: web3.toWei(1, "ether")
      })
    );

    // try to remove milestone
    expectThrow(crowdsale.removeMilestone());

    // try to start
    expectThrow(crowdsale.start());

    // try to burn tokens
    expectThrow(crowdsale.burnTokens());
  });

  it("addMilestone: invalid pricePerToken", async function() {
    await expectThrow(crowdsale.addMilestone(0, pricePerToken1, pricePerWei1));
  });

  it("addMilestone: invalid milestone", async function() {
    await expectThrow(crowdsale.addMilestone(milestone1, 0, pricePerWei1));
    await expectThrow(crowdsale.addMilestone(milestone1, pricePerToken1, 0));
  });

  it("addMilestone: add 2 milestones, last invalid", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);

    await expectThrow(
      crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1)
    );
  });

  it("addMilestone: add 2", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);
    await crowdsale.addMilestone(milestone2, pricePerToken2, pricePerWei2);

    const length = await crowdsale.getMilestonesLength();
    assert.isTrue(length.equals(2));

    const [found, index] = await crowdsale.getCurrentMilestoneIndex();
    assert.isTrue(found);
    assert.isTrue(index.equals(0));
  });

  it("addMilestone: add 2 and then remove", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);
    await crowdsale.addMilestone(milestone2, pricePerToken2, pricePerWei2);

    await crowdsale.removeMilestone();

    const length = await crowdsale.getMilestonesLength();
    assert.isTrue(length.equals(1));

    const [found, index] = await crowdsale.getCurrentMilestoneIndex();
    assert.isTrue(found);
    assert.isTrue(index.equals(0));
  });

  it("stage: Started", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);
    await crowdsale.start();

    // check stage
    const stage = await crowdsale.isStage.call(1);
    assert.isTrue(stage);

    // try to add milestone
    await expectThrow(
      crowdsale.addMilestone(milestone2, pricePerToken2, pricePerWei2)
    );

    // check length
    const length = await crowdsale.getMilestonesLength();
    assert.isTrue(length.equals(1));

    // check index
    const [found, index] = await crowdsale.getCurrentMilestoneIndex();
    assert.isTrue(found);
    assert.isTrue(index.equals(0));

    // check milestone
    const [weiTokenAmount, pricePerToken] = await crowdsale.milestones(index);
    assert.isTrue(weiTokenAmount.equals(milestone1));
    assert.isTrue(pricePerToken.equals(pricePerToken1));
  });

  it("buyTokens below minimum", async function() {
    await crowdsale.addMilestone(milestone1, 1, 100);
    await crowdsale.start();

    await expectThrow(crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(0.05, "ether")
    }));
  });

  it("buyTokens", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);
    await crowdsale.addMilestone(milestone2, pricePerToken2, pricePerWei2);
    await crowdsale.start();

    await crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(4.5, "ether")
    });
    const balanceOfBuyer1_1 = await token.balanceOf(buyer1);
    assert.isTrue(balanceOfBuyer1_1.equals(web3.toWei(9, "ether")));

    await crowdsale.sendTransaction({
      from: buyer1,
      value: web3.toWei(2, "ether")
    });
    const balanceOfBuyer1_2 = await token.balanceOf(buyer1);
    assert.isTrue(balanceOfBuyer1_2.equals(web3.toWei(10, "ether")));
  });

  it("buyTokens: too late", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);
    await crowdsale.start();

    await increaseTime(duration.days(2));

    const hasEnded = await crowdsale.hasEnded.call();
    assert.isTrue(hasEnded);

    const stage = await crowdsale.isStage.call(2);
    assert.isTrue(stage);

    await expectThrow(
      crowdsale.buyTokens(buyer1, {
        from: buyer1,
        value: web3.toWei(1, "ether")
      })
    );
  });

  it("buyTokens: reached milestone", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);
    await crowdsale.start();

    await crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(4.5, "ether")
    });

    const hasEnded = await crowdsale.hasEnded.call();
    assert.isTrue(hasEnded);

    const stage = await crowdsale.isStage.call(2);
    assert.isTrue(stage);

    await expectThrow(
      crowdsale.buyTokens(buyer1, {
        from: buyer1,
        value: web3.toWei(0.1, "ether")
      })
    );
  });

  it("buyTokens: paused", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);
    await crowdsale.start();

    await crowdsale.pause();

    await expectThrow(
      crowdsale.buyTokens(buyer1, {
        from: buyer1,
        value: web3.toWei(0.1, "ether")
      })
    );
  });

  it("buyTokens: within 2 milestones", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);
    await crowdsale.addMilestone(milestone2, pricePerToken2, pricePerWei2);
    await crowdsale.start();

    await crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(6.5, "ether")
    });

    const balanceOfBuyer1 = await token.balanceOf(buyer1);
    assert.isTrue(balanceOfBuyer1.equals(web3.toWei(10, "ether")));
  });

  it("buyTokens: within 5 milestones", async function() {
    await crowdsale.addMilestone(web3.toWei(2, "ether"), 1, 1);
    await crowdsale.addMilestone(web3.toWei(4, "ether"), 1, 2);
    await crowdsale.addMilestone(web3.toWei(6, "ether"), 1, 1);
    await crowdsale.addMilestone(web3.toWei(8, "ether"), 2, 1);
    await crowdsale.addMilestone(web3.toWei(10, "ether"), 1, 1);
    await crowdsale.start();

    await crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(11, "ether")
    });

    const balanceOfBuyer1 = await token.balanceOf(buyer1);
    assert.isTrue(balanceOfBuyer1.equals(web3.toWei(10, "ether")));
  });

  it("buyTokens: within 4 milestones", async function() {
    await crowdsale.addMilestone(web3.toWei(2.5, "ether"), 2, 1);
    await crowdsale.addMilestone(web3.toWei(5, "ether"), 1, 1);
    await crowdsale.addMilestone(web3.toWei(7.5, "ether"), 1, 2);
    await crowdsale.addMilestone(web3.toWei(10, "ether"), 1, 1);
    await crowdsale.start();

    await crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(11.25, "ether")
    });

    const balanceOfBuyer1 = await token.balanceOf(buyer1);
    assert.isTrue(balanceOfBuyer1.equals(web3.toWei(10, "ether")));
  });

  it("buyTokens: 4 milestones", async function() {
    await crowdsale.addMilestone(web3.toWei(2.5, "ether"), 2, 1);
    await crowdsale.addMilestone(web3.toWei(5, "ether"), 1, 1);
    await crowdsale.addMilestone(web3.toWei(7.5, "ether"), 1, 2);
    await crowdsale.addMilestone(web3.toWei(10, "ether"), 1, 1);
    await crowdsale.start();

    await crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(1.25, "ether")
    });

    let balanceOfBuyer1 = await token.balanceOf(buyer1);
    assert.isTrue(balanceOfBuyer1.equals(web3.toWei(2.5, "ether")));

    await crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(7.5, "ether")
    });
    balanceOfBuyer1 = await token.balanceOf(buyer1);
    assert.isTrue(balanceOfBuyer1.equals(web3.toWei(7.5, "ether")));

    await crowdsale.buyTokens(buyer1, {
      from: buyer1,
      value: web3.toWei(2.5, "ether")
    });
    balanceOfBuyer1 = await token.balanceOf(buyer1);
    assert.isTrue(balanceOfBuyer1.equals(web3.toWei(10, "ether")));
  });

  it("burnTokens onlyOwner", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);
    await crowdsale.start();

    await increaseTime(duration.days(2));

    const hasEnded = await crowdsale.hasEnded.call();
    assert.equal(hasEnded, true);

    await expectThrow(crowdsale.burnTokens({
      from: buyer1
    }));
  });

  it("burnTokens", async function() {
    await crowdsale.addMilestone(milestone1, pricePerToken1, pricePerWei1);
    await crowdsale.start();

    await increaseTime(duration.days(2));

    const hasEnded = await crowdsale.hasEnded.call();
    assert.equal(hasEnded, true);

    await crowdsale.burnTokens();

    const balance = await token.balanceOf(crowdsale.address);
    assert.isTrue(balance.equals(0));
  });
});
