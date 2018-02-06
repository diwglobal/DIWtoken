pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/token/StandardToken.sol";
import "zeppelin-solidity/contracts/token/BurnableToken.sol";


contract DIW is StandardToken, BurnableToken {
  string public constant name = "DIW Token";
  string public constant symbol = "DIW";
  uint8 public constant decimals = 18;

  function DIW (address _supplier, uint256 _totalSupply) public {
    totalSupply = _totalSupply;
    balances[_supplier] = _totalSupply;
  }
}