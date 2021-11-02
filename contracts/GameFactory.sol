//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./Game.sol";

contract GameFactory is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using AddressUpgradeable for address payable;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    struct TokenInfo {
        bool enabled;
        uint256 fee;
        uint256 received;
    }

    address payable public feeReceiver;

    mapping(address => TokenInfo) public feeTokens;
    mapping(address => Game[]) public userGames;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(address payable _feeReceiver) external initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(UPGRADER_ROLE, msg.sender);
        _setRoleAdmin(UPGRADER_ROLE, ADMIN_ROLE);
        feeReceiver = _feeReceiver;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    /**
     * @dev Create new Cross-Null game on torus size 2^255. The user who is the first to close 5 cells in a row wins.
     * @param feeToken Address of token for fee payment. If address is 0, then used native coin.
     * @param betToken Address of token for bet payment. If address is 0, then used native coin.
     * @param betAmount Amount of bet
     */
    function newGame(
        address feeToken,
        address betToken,
        uint256 betAmount
    ) external payable nonReentrant {
        require(
            feeTokens[feeToken].enabled,
            "GameFactory: This token is not enabled to pay fee"
        );
        feeTokens[feeToken].received += feeTokens[feeToken].fee;
        if (feeToken == address(0)) {
            require(
                msg.value >= feeTokens[feeToken].fee,
                "GameFactory: Insuffience fee amount"
            );
            feeReceiver.sendValue(feeTokens[feeToken].fee);
        } else {
            IERC20Upgradeable(feeToken).safeTransferFrom(
                msg.sender,
                feeReceiver,
                feeTokens[feeToken].fee
            );
        }
        Game game;
        if (betToken == address(0)) {
            game = new Game{value: betAmount}(
                payable(msg.sender),
                betToken,
                betAmount
            );
        } else {
            game = new Game(payable(msg.sender), betToken, betAmount);
            IERC20Upgradeable(betToken).safeTransferFrom(
                msg.sender,
                address(game),
                betAmount
            );
        }
        userGames[msg.sender].push(game);
    }

    function updateFeeToken(
        address feeToken,
        bool enabled,
        uint256 fee
    ) external onlyRole(ADMIN_ROLE) {
        feeTokens[feeToken].enabled = enabled;
        feeTokens[feeToken].fee = fee;
    }
}
