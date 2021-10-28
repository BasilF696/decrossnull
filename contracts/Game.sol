//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Game {
    using Address for address payable;
    using SafeERC20 for IERC20;

    address payable public crossUser;
    address payable public nullUser;
    address public betToken;
    uint256 public betAmount;

    event Received(address user, address token, uint256 amount, uint256 time);

    constructor(
        address payable _crossUser,
        address _betToken,
        uint256 _betAmount
    ) payable {
        crossUser = _crossUser;
        betToken = _betToken;
        betAmount = _betAmount;
        if (betToken == address(0)) {
            require(
                msg.value == betAmount,
                "CrossNull: Insuffience bet amount"
            );
        }
    }

    function join() external payable {
        nullUser = payable(msg.sender);
        if (betToken == address(0)) {
            require(msg.value == betAmount, "GameFactory: Invalid bet amount");
        } else {
            IERC20(betToken).safeTransferFrom(
                msg.sender,
                address(this),
                betAmount
            );
        }
    }

    function payReward() internal {}
}
