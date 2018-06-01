(() => {
  // !! CHANGE THIS !!
  const { wallets, tokens } = require("./airdrops/outputs/2.json");
  // !! CHANGE THIS !!

  const tokenAddr = "0xa253be28580ae23548a4182d95bf8201c28369a8";
  const from = "0xa8c4f0a102b5a4c5f49997b59727625d9e3dbd84";

  if (!Array.isArray(wallets) || !Array.isArray(tokens)) throw Error("not arr");
  if (wallets.length !== tokens.length) throw Error("length wrong");

  contracts.AirdropperERC20.multiSend(tokenAddr, wallets, tokens, {
    from,
    gas: 7500000,
    gasPrice: Eth.toWei(1, "gwei").toString()
  })
    .then(console.log)
    .catch(console.error);
})();
