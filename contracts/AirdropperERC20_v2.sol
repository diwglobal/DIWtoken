pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC20.sol";


contract AirdropperERC20 is Ownable {
  mapping(uint256 => bool) private batches;

  function multiSend(address _tokenAddr, uint256 batchId, address[] recipients, uint256[] amounts) external onlyOwner {
    require(recipients.length == amounts.length);
    require(!batches[batchId]);

    for (uint256 i = 0; i < recipients.length; i++) {
      ERC20(_tokenAddr).transfer(recipients[i], amounts[i]);
    }

    batches[batchId] = true;
  }

  function withdraw (address _tokenAddr) external onlyOwner {
    ERC20 token = ERC20(_tokenAddr);

    uint256 balance = token.balanceOf(this);
    token.transfer(owner, balance);
  }
}