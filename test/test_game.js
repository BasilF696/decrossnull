const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const BigNumber = require('bignumber.js');
BigNumber.config({ EXPONENTIAL_AT: 60 });
const Web3 = require('web3');
const { parseEther } = require("ethers/lib/utils");
const web3 = new Web3(hre.network.provider);

describe("Game Tests", function () {
  let accounts;
  let game_factory;
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const GameFactory = await ethers.getContractFactory("GameFactory");
    game_factory = await upgrades.deployProxy(GameFactory, [], { initializer: 'initialize' });
    await game_factory.deployed();
  });
  describe('Bridge: deploy', () => {
    it("Game: deploy", async function () {
    });
  });
});
