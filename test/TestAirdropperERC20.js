const DIW = artifacts.require("DIW");
const AirdropperERC20 = artifacts.require("AirdropperERC20");

contract("AirdropperERC20", function(accounts) {
  const [owner, buyer1, buyer2, buyer3, buyer4, buyer5] = accounts;
  const supply = web3.toWei(1e9, "ether");
  const airdropperSupply = new web3.BigNumber(web3.toWei(100, "ether"));
  let token;
  let airdropper;

  beforeEach(async function() {
    token = await DIW.new(owner, supply);
    airdropper = await AirdropperERC20.new();

    await token.transfer(airdropper.address, airdropperSupply);
  });

  it("send all tokens to buyer1", async function() {
    await airdropper.multiSend(token.address, [buyer1], [airdropperSupply]);

    const buyer1Balance = await token.balanceOf(buyer1);

    assert.isTrue(buyer1Balance.equals(airdropperSupply));
  });

  it("send half tokens to buyer1", async function() {
    const amount = airdropperSupply.div(2);
    let buyer1Balance;
    let airdropperBalance;

    await airdropper.multiSend(token.address, [buyer1], [amount]);

    buyer1Balance = await token.balanceOf(buyer1);
    airdropperBalance = await token.balanceOf(airdropper.address);

    assert.isTrue(buyer1Balance.equals(amount));
    assert.isTrue(airdropperBalance.equals(amount));

    await airdropper.withdraw(token.address);

    airdropperBalance = await token.balanceOf(airdropper.address);

    assert.isTrue(airdropperBalance.equals(0));
  });

  it("send tokens to all buyers", async function() {
    const amount = airdropperSupply.div(5);

    await airdropper.multiSend(
      token.address,
      [
        buyer1,
        buyer2,
        buyer3,
        buyer4,
        buyer5
      ],
      [
        amount,
        amount,
        amount,
        amount,
        amount
      ]
    );

    buyer1Balance = await token.balanceOf(buyer1);
    buyer2Balance = await token.balanceOf(buyer2);
    buyer3Balance = await token.balanceOf(buyer3);
    buyer4Balance = await token.balanceOf(buyer4);
    buyer5Balance = await token.balanceOf(buyer5);
    airdropperBalance = await token.balanceOf(airdropper.address);

    assert.isTrue(buyer1Balance.equals(amount));
    assert.isTrue(buyer2Balance.equals(amount));
    assert.isTrue(buyer3Balance.equals(amount));
    assert.isTrue(buyer4Balance.equals(amount));
    assert.isTrue(buyer5Balance.equals(amount));
    assert.isTrue(airdropperBalance.equals(0));
  });

  it("send tokens to 4 buyers", async function() {
    const amount = airdropperSupply.div(5);
    let buyer1Balance;
    let airdropperBalance

    await airdropper.multiSend(
      token.address,
      [
        buyer1,
        buyer2,
        buyer3,
        buyer4
      ],
      [
        amount,
        amount,
        amount,
        amount
      ]
    );

    buyer1Balance = await token.balanceOf(buyer1);
    buyer2Balance = await token.balanceOf(buyer2);
    buyer3Balance = await token.balanceOf(buyer3);
    buyer4Balance = await token.balanceOf(buyer4);
    airdropperBalance = await token.balanceOf(airdropper.address);

    assert.isTrue(buyer1Balance.equals(amount));
    assert.isTrue(buyer2Balance.equals(amount));
    assert.isTrue(buyer3Balance.equals(amount));
    assert.isTrue(buyer4Balance.equals(amount));
    assert.isTrue(airdropperBalance.equals(amount));

    await airdropper.withdraw(token.address);

    airdropperBalance = await token.balanceOf(airdropper.address);

    assert.isTrue(airdropperBalance.equals(0));
  });
});
