# Decentralized Cross-Null Game

Cross-Null game for EVM-compatible blockchains on Solidity. The game takes place on a two-dimensional field with a torus topology and size 2^256-1 on both coordinate axes. The players' task is to place 5 of their marks on the field in a row in any direction horizontally, vertically or diagonally. The first player who fulfills the condition takes the prize in the form of bet tokens.

## Compile and deploy
To use contracts, you need to compile them and deploy the contract-game factory by executing the commands

```shell
npx hardhat compile
npx hardhat run scripts/deploy.js
```
After execution the script, a GameFactory contract will be created on the blockchain, through which you need to interact to create new games. The deployer is automatically assigned super-administrator, administrator, and upgrader rights. A super administrator can assign and revoke any rights for any address. The administrator has the right to set the addresses of tokens for receiving commissions and the size of the commission.
The upgrader has the right to update the factory contract

## Creating game
In order to create a game you need to perform a transaction by calling the factory contract function:
```solidity
factory.newGame(feeToken, betToken, betAmount);
```
where feeToken - commission token address, must be enabled by the contract administrator, the factory contract must be allowed to spend the required amount of user tokens;
betToken - bet token address, can have any value;
betAmount - bet amount, also the factory contract must be allowed to spend it. This function creates a game contract and sends betting tokens to it. The game contract remains inactive until the second player joins. The user who created the game is assigned the Cross symbol.

## Comission
When creating a game, commission tokens are debited from the user who created the game and sent to the commission wallet address. The factory contract administrator must determine in advance the tokens that are allowed to be accepted as commission by calling the function:

```solidity
factory.updateFeeToken(feeToken, enabled, fee);
```
where feeToken - address of fee token, if the address is zero, then the commission is accepted in the native currency; enabled - boolean permission flag; fee - commission amount for creating a game

## Joining a second player
In order for a second user to join, the game contract must be allowed to spend the user's bets tokens. After that it executes the join function on the game contract:
```solidity
game.join();
```
The user who joined to the game is assigned the Null symbol.

## Progress of the game
Players take turns making steps, the player with a cross starts steps first:
```solidity
game.step(x, y);
```
where x - x coordinate, and y - y coordinate from the range of values 0...2^256-1. After each step, the occurrence of a win is checked. If a win occurs, the entire bet amount is sent to the winning player, and the game becomes inactive
