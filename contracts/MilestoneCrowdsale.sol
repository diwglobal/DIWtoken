pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "./DIW.sol";


contract MilestoneCrowdsale is Ownable, Pausable {
  using SafeMath for uint256;
  using SafeERC20 for DIW;

  // The token being sold
  DIW public token;

  // Stages
  enum Stages {
    Preparing,
    Started,
    Finished
  }

  // the stage in which the crowdsale is in
  Stages private stage;

  // seconds before ending
  uint256 public endSeconds;
  // end time
  uint256 public endTime;

  // milestones (priceTokenWei/priceWei) = (diw/eth)
  struct Milestone {
    uint256 amount;
    uint256 priceTokenWei;
    uint256 priceWei;
  }
  
  Milestone[] public milestones;

  // address where funds are collected
  address public wallet;

  // amount of raised money in wei
  uint256 public weiRaised = 0;

  // amount of tokens raised
  uint256 public weiTokensRaised = 0;

  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  function MilestoneCrowdsale(uint256 _endSeconds, address _wallet, address _token) public {
    require(_endSeconds >= 0);
    require(_wallet != address(0));
    require(_token != address(0));

    endSeconds = _endSeconds;
    wallet = _wallet;
    token = DIW(_token);

    stage = Stages.Preparing;
  }

  /**
  * @dev Check if input stage is the current stage, due to the fact that the crowdsale can reach max milestone,
  * or finish due to endTime, this always checks if it has finished, always use this to check the stage and not
  * stage variable.
  * @param _stage Expected stage.
  */
  function isStage(Stages _stage) public returns (bool) {
    bool finished = false;

    // check if is finished
    if (stage == Stages.Started) {
      bool hasMilestones = milestones.length > 0;
      bool reachedFinalMilestone = hasMilestones && weiTokensRaised >= milestones[milestones.length.sub(1)].amount;
      bool withinPeriod = now <= endTime;
      finished = reachedFinalMilestone || !withinPeriod;
    }

    // update stage if it has finished
    if (finished) stage = Stages.Finished;

    return _stage == stage;
  }

  modifier atStage(Stages _stage) {
    require(isStage(_stage));
    _;
  }

  /**
  * @dev Push new milestone to milestones.
  * @param amount The amount of the new milestone in wei.
  * @param priceTokenWei Price per token in wei but times 18 to increase precision.
  */
  function addMilestone (uint256 amount, uint256 priceTokenWei, uint256 priceWei) external onlyOwner atStage(Stages.Preparing) {
    require(amount > 0);
    require(priceTokenWei > 0);
    require(priceWei > 0);

    // new milestone amount must be larger than the previous milestone
    if (milestones.length > 0) require(milestones[milestones.length.sub(1)].amount < amount);

    milestones.push(Milestone(amount, priceTokenWei, priceWei));
  }

  /**
  * @dev Remove last milestone.
  */
  function removeMilestone () external onlyOwner atStage(Stages.Preparing) {
    require(milestones.length > 0);

    delete milestones[milestones.length.sub(1)];
    milestones.length--;
  }

  /**
  * @dev Get the amount of milestones.
  * @return An uint256 representing the amount of milestones.
  */
  function getMilestonesLength () public view returns (uint256) {
    return milestones.length;
  }

  /**
  * @dev Get active milestone index.
  * @return bool A bool represeting if milestone was found.
  * @return uint256 An uint256 representing the index within the milestones array.
  */
  function getCurrentMilestoneIndex () public view returns (bool, uint256) {
    uint256 length = milestones.length;

    if (length <= 0) {
      return (false, 0);
    }

    for (uint256 i = 0; i < length; i++) {
      if (weiTokensRaised < milestones[i].amount) {
        return (true, i);
      }
    }

    return (true, length.sub(1));
  }

  // fallback function can be used to buy tokens
  function () external payable {
    buyTokens(msg.sender);
  }

  function calculateTokens(uint256 _weiTokensRaised, uint256 weiAmount, uint256 tokensWeiAmount, uint256 index) internal returns (uint256) {
    if (index >= milestones.length) {
      return tokensWeiAmount;
    }

    Milestone storage currentMilestone = milestones[index];
    
    // get how many tokens left in current milestone
    uint256 tokensLeft = currentMilestone.amount.sub(_weiTokensRaised);

    // get how many tokens will be bought if current milestone is used
    uint256 tokensToBeBought = weiAmount.div(currentMilestone.priceWei).mul(currentMilestone.priceTokenWei);

    // tokensToBeBought bigger than whats left in the milestone
    bool biggerThanMilestone = tokensToBeBought >= tokensLeft;

    if (biggerThanMilestone) {
      uint256 weiUsed = tokensLeft.mul(currentMilestone.priceWei).div(currentMilestone.priceTokenWei);

      weiAmount = weiAmount.sub(weiUsed);
      tokensWeiAmount = tokensWeiAmount.add(tokensLeft);
      _weiTokensRaised = _weiTokensRaised.add(tokensLeft);

      return calculateTokens(_weiTokensRaised, weiAmount, tokensWeiAmount, index.add(1));
    } else {
      tokensWeiAmount = tokensWeiAmount.add(tokensToBeBought);

      return tokensWeiAmount;
    }
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public payable atStage(Stages.Started) {
    require(beneficiary != address(0));
    require(validPurchase());

    bool found;
    uint256 index;
    (found, index) = getCurrentMilestoneIndex();
    require(found);

    uint256 weiAmount = msg.value;
    uint256 tokensWeiAmount = calculateTokens(weiTokensRaised, weiAmount, 0, index);

    // update state
    weiRaised = weiRaised.add(weiAmount);
    weiTokensRaised = weiTokensRaised.add(tokensWeiAmount);

    // transfer
    token.safeTransfer(beneficiary, tokensWeiAmount);

    // log
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokensWeiAmount);

    forwardFunds();
  }

  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds() internal {
    wallet.transfer(msg.value);
  }

  /**
  * @return bool true if the transaction can buy tokens
  */
  function validPurchase() internal returns (bool) {
    bool ended = hasEnded();
    bool nonZeroPurchase = msg.value != 0;
    bool biggerThanMinimum = msg.value > 50000000000000000;
    
    return !paused && !ended && nonZeroPurchase && biggerThanMinimum;
  }

  /**
  * @return bool true if crowdsale event has ended
  */
  function hasEnded() public returns (bool) {
    return isStage(Stages.Finished);
  }

  /**
  * @dev Owner can start the crowdsale, initiating endTime.
  */
  function start () external onlyOwner atStage(Stages.Preparing) {
    require(milestones.length > 0);

    endTime = now.add(endSeconds);
    stage = Stages.Started;
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