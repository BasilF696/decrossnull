//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Game {
    using Address for address payable;
    using SafeERC20 for IERC20;

    enum Status {
        Void,
        Cross,
        Null
    }

    struct Point {
        int256 x;
        int256 y;
    }

    address payable public crossUser;
    address payable public nullUser;
    address public betToken;
    uint256 public betAmount;
    Status public whosNext;
    Status public winner;
    bool public isActive;
    mapping(int256 => mapping(int256 => Status)) public field;

    event Received(address user, address token, uint256 amount, uint256 time);
    event Winned(address user, address token, uint256 amount, uint256 time);

    /**
     * @dev Create game, join first user and place a bet
     * @param _crossUser
     */
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
        emit Received(_crossUser, _betToken, _betAmount, block.timestamp);
    }

    /**
     * @dev Join second user to game and place a bet
     */
    function join() external payable {
        nullUser = payable(msg.sender);
        if (betToken == address(0)) {
            require(msg.value == betAmount, "CrossNull: Invalid bet amount");
        } else {
            IERC20(betToken).safeTransferFrom(
                msg.sender,
                address(this),
                betAmount
            );
        }
        whosNext = Status.Cross;
        isActive = true;
        emit Received(msg.sender, betToken, betAmount, block.timestamp);
    }

    function step(int256 x, int256 y) external {
        require(isActive, "CrossNull: Game is not active");
        require(field[x][y] == Status.Void, "CrossNull: The cell is busy");
        if (whosNext == Status.Cross) {
            require(
                msg.sender == crossUser,
                "CrossNull: Current user must be Cross user"
            );
            field[x][y] = Status.Cross;
            if (checkWins(x, y, Status.Cross)) {
                isActive = false;
                winner = Status.Cross;
                emit Winned(msg.sender, betToken, betAmount, block.timestamp);
                payReward(crossUser);
            }
            whosNext = Status.Null;
        } else if (whosNext == Status.Null) {
            require(
                msg.sender == nullUser,
                "CrossNull: Current user must be Null user"
            );
            field[x][y] = Status.Null;
            if (checkWins(x, y, Status.Null)) {
                isActive = false;
                winner = Status.Null;
                emit Winned(msg.sender, betToken, betAmount, block.timestamp);
                payReward(nullUser);
            }
            whosNext = Status.Cross;
        } else {
            revert("CrossNull: Second user is not joined");
        }
    }

    function checkWins(
        int256 x,
        int256 y,
        Status status
    ) internal view returns (bool) {
        Point[4] memory delta = [
            Point(0, 1),
            Point(1, 0),
            Point(1, 1),
            Point(1, -1)
        ];
        for (uint256 i = 0; i < 4; i++) {
            uint256 oldResult = 0;
            uint256 result = 1;
            int256 curdX1 = delta[i].x;
            int256 curdX2 = delta[i].x;
            int256 curdY1 = delta[i].y;
            int256 curdY2 = delta[i].y;
            while (oldResult != result && result < 5) {
                oldResult = result;
                unchecked {
                    if (field[x + curdX1][y + curdY1] == status) {
                        result++;
                        curdX1 += delta[i].x;
                        curdY1 += delta[i].y;
                    }
                    if (field[x - curdX2][y - curdY2] == status) {
                        result++;
                        curdX2 += delta[i].x;
                        curdY2 += delta[i].y;
                    }
                }
            }
            if (result >= 5) {
                return true;
            }
        }
        return false;
    }

    function payReward(address payable _winner) internal {
        if (betToken == address(0)) {
            _winner.sendValue(2 * betAmount);
        } else {
            IERC20(betToken).transfer(_winner, 2 * betAmount);
        }
    }
}
