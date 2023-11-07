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

_to be continued_
