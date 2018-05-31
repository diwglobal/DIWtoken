pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./DIW.sol";


contract DIWCrowdsale is Pausable {
  using SafeMath for uint256;
  using SafeERC20 for DIW;

  // The token being sold
  DIW public token;

  // start and end timestamps where investments are allowed (both inclusive)
  uint256 public startTime;
  uint256 public endTime;

  // address where funds are collected
  address public wallet;

  // how many token units a buyer gets per wei
  uint256 public rate;

  // amount of raised money in wei
  uint256 public weiRaised;

  // amount of raised tokens in wei
  uint256 public weiTokensRaised;

  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  function DIWCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, address _token) public {
    require(_endTime >= _startTime);
    require(_rate > 0);
    require(_wallet != address(0));
    require(_token != address(0));

    startTime = _startTime;
    endTime = _endTime;
    rate = _rate;
    wallet = _wallet;
    token = DIW(_token);
  }

  // fallback function can be used to buy tokens
  function () external payable {
    buyTokens(msg.sender);
  }

  // change rate
  function changeRate(uint256 _rate) public onlyOwner {
    require(_rate > 0); 

    rate = _rate;
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be send
    uint256 tokens = weiAmount.mul(rate);

    // update state
    weiRaised = weiRaised.add(weiAmount);
    weiTokensRaised = weiTokensRaised.add(tokens);

    token.safeTransfer(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds() internal {
    wallet.transfer(msg.value);
  }

  // @return true if the transaction can buy tokens
  function validPurchase() internal view whenNotPaused returns (bool) {
    bool withinPeriod = now >= startTime && now <= endTime;
    bool biggerThanMinimum = msg.value >= 0.05 ether;

    return withinPeriod && biggerThanMinimum;
  }

  // @return true if crowdsale event has ended
  function hasEnded() public view returns (bool) {
    return now > endTime;
  }

  /**
  * @dev When crowdsale has ended, owner can burn the remaining tokens.
  */
  function burnTokens() external onlyOwner {
    require(hasEnded());

    uint256 amount = token.balanceOf(this);
    token.burn(amount);
  }
}
