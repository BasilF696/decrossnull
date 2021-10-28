//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Game {
    using Address for address payable;
    using SafeERC20 for IERC20;

    address payable crossUser;
    address payable nullUser;
    address betToken;
    uint256 betAmount;

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
        require(msg.value == betAmount, "CrossNull: Invalid bet amount");
        if (crossUser == payable(0)) {
            crossUser = payable(msg.sender);
        } else if (nullUser == payable(0)) {
            nullUser = payable(msg.sender);
        } else {
            revert("CrossNull: Game is filled");
        }
    }

    function payReward() internal {}
}
