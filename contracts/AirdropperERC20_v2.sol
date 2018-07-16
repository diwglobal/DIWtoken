pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC20.sol";


contract AirdropperERC20_v2 is Ownable {
  mapping(bytes32 => bool) public batches;

  function multiSend(ERC20 token, bytes32 batchId, address[] recipients, uint256[] amounts) external onlyOwner {
    require(recipients.length == amounts.length);
    require(!batches[batchId]);

    batches[batchId] = true;

    for (uint256 i = 0; i < recipients.length; i++) {
      token.transfer(recipients[i], amounts[i]);
    }
  }

  function withdraw(ERC20 token) external onlyOwner {
    uint256 balance = token.balanceOf(this);
    token.transfer(owner, balance);
  }
}