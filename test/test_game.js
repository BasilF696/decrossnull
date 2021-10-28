const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const BigNumber = require('bignumber.js');
BigNumber.config({ EXPONENTIAL_AT: 60 });
const Web3 = require('web3');
const { parseEther } = require("ethers/lib/utils");
const web3 = new Web3(hre.network.provider);
const fee = parseEther("1");
const bet = parseEther("10");

describe("Game Tests", function () {
  let proj_owner;
  let fee_receiver;
  let cross_user;
  let null_user;
  let game_factory;
  let fee_token;
  let bet_token;

  beforeEach(async () => {
    [proj_owner, fee_receiver, cross_user, null_user] = await ethers.getSigners();

    const TestToken = await ethers.getContractFactory("TestToken");
    fee_token = await TestToken.deploy();
    await fee_token.deployed();
    await fee_token.transfer(cross_user.address, fee);

    bet_token = await TestToken.deploy();
    await bet_token.deployed();
    await bet_token.transfer(cross_user.address, bet);
    await bet_token.transfer(null_user.address, bet);

    const GameFactory = await ethers.getContractFactory("GameFactory");
    game_factory = await upgrades.deployProxy(GameFactory, [fee_receiver.address], { initializer: 'initialize' });
    await game_factory.deployed();

    await game_factory.updateFeeToken(fee_token.address, true, fee);
    await game_factory.updateFeeToken("0x0000000000000000000000000000000000000000", true, fee);
  });

  describe('GameFactory: deploy', () => {
    it("Step 1: Should be set feeReceiver and roles for sender", async function () {
      expect(
        await game_factory.feeReceiver()
      ).to.equal(fee_receiver.address);
      expect(
        await game_factory.hasRole(await game_factory.DEFAULT_ADMIN_ROLE(), proj_owner.address)
      ).to.equal(true);
      expect(
        await game_factory.hasRole(await game_factory.ADMIN_ROLE(), proj_owner.address)
      ).to.equal(true);
      expect(
        await game_factory.hasRole(await game_factory.UPGRADER_ROLE(), proj_owner.address)
      ).to.equal(true);
      expect(
        await game_factory.getRoleAdmin(await game_factory.UPGRADER_ROLE())
      ).to.equal(await game_factory.ADMIN_ROLE());
    });
  });

  describe('GameFactory: create game', () => {
    it("Step 1: Fee and bet in erc20 tokens: success", async function () {
      await fee_token.connect(cross_user).approve(game_factory.address, fee);
      await bet_token.connect(cross_user).approve(game_factory.address, bet);

      let balance_before = await fee_token.balanceOf(fee_receiver.address);
      await game_factory.connect(cross_user).newGame(fee_token.address, bet_token.address, bet);
      let balance_after = await fee_token.balanceOf(fee_receiver.address);
      let game = await game_factory.userGames(cross_user.address, 0);
      expect(
        await bet_token.balanceOf(game)
      ).to.equal(bet);
      expect(
        ((balance_after - balance_before) / 1e18).toFixed(9)
      ).to.equal((fee / 1e18).toFixed(9));
    });

    it("Step 2: Fee in native, bet in erc20: success", async function () {
      await bet_token.connect(cross_user).approve(game_factory.address, bet);

      let balance_before = await web3.eth.getBalance(fee_receiver.address);
      await game_factory.connect(cross_user).newGame("0x0000000000000000000000000000000000000000", bet_token.address, bet, { value: fee });
      let balance_after = await web3.eth.getBalance(fee_receiver.address);
      expect(
        ((balance_after - balance_before) / 1e18).toFixed(9)
      ).to.equal((fee / 1e18).toFixed(9));

      let game = await game_factory.userGames(cross_user.address, 0);
      expect(
        await bet_token.balanceOf(game)
      ).to.equal(bet);
    });

    it("Step 3: Fee in erc20, bet in native: success", async function () {
      await fee_token.connect(cross_user).approve(game_factory.address, fee);

      let balance_before = await fee_token.balanceOf(fee_receiver.address);
      await game_factory.connect(cross_user).newGame(fee_token.address, "0x0000000000000000000000000000000000000000", bet, { value: bet });
      let balance_after = await fee_token.balanceOf(fee_receiver.address);
      expect(
        ((balance_after - balance_before) / 1e18).toFixed(9)
      ).to.equal((fee / 1e18).toFixed(9));

      let game = await game_factory.userGames(cross_user.address, 0);
      expect(
        await web3.eth.getBalance(game)
      ).to.equal(bet);
    });
  });
});
