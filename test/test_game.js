const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const BigNumber = require('bignumber.js');
BigNumber.config({ EXPONENTIAL_AT: 60 });
const Web3 = require('web3');
const { parseEther } = require("ethers/lib/utils");
const web3 = new Web3(hre.network.provider);
const fee = parseEther("1");
const bet = parseEther("15");
const bet2 = parseEther("30");
const feebet = parseEther("16");

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
    await fee_token.transfer(cross_user.address, parseEther("1000"));

    bet_token = await TestToken.deploy();
    await bet_token.deployed();
    await bet_token.transfer(cross_user.address, parseEther("1000"));
    await bet_token.transfer(null_user.address, parseEther("1000"));

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

      let game_address = await game_factory.userGames(cross_user.address, 0);
      expect(
        await bet_token.balanceOf(game_address)
      ).to.equal(bet);
      expect(
        ((balance_after - balance_before) / 1e18).toFixed(9)
      ).to.equal((fee / 1e18).toFixed(9));

      const game = await ethers.getContractAt("Game", game_address);
      expect(
        await game.crossUser()
      ).to.equal(cross_user.address);
      expect(
        await game.nullUser()
      ).to.equal("0x0000000000000000000000000000000000000000");
      expect(
        await game.betAmount()
      ).to.equal(bet);
      expect(
        await game.betToken()
      ).to.equal(bet_token.address);
    });

    it("Step 2: Fee in native, bet in erc20: success", async function () {
      await bet_token.connect(cross_user).approve(game_factory.address, bet);

      let balance_before = await web3.eth.getBalance(fee_receiver.address);
      await game_factory.connect(cross_user).newGame("0x0000000000000000000000000000000000000000", bet_token.address, bet, { value: fee });
      let balance_after = await web3.eth.getBalance(fee_receiver.address);
      expect(
        ((balance_after - balance_before) / 1e18).toFixed(9)
      ).to.equal((fee / 1e18).toFixed(9));

      let game_address = await game_factory.userGames(cross_user.address, 0);
      expect(
        await bet_token.balanceOf(game_address)
      ).to.equal(bet);

      const game = await ethers.getContractAt("Game", game_address);
      expect(
        await game.crossUser()
      ).to.equal(cross_user.address);
      expect(
        await game.nullUser()
      ).to.equal("0x0000000000000000000000000000000000000000");
      expect(
        await game.betAmount()
      ).to.equal(bet);
      expect(
        await game.betToken()
      ).to.equal(bet_token.address);
    });

    it("Step 3: Fee in erc20, bet in native: success", async function () {
      await fee_token.connect(cross_user).approve(game_factory.address, fee);

      let balance_before = await fee_token.balanceOf(fee_receiver.address);
      await game_factory.connect(cross_user).newGame(fee_token.address, "0x0000000000000000000000000000000000000000", bet, { value: bet });
      let balance_after = await fee_token.balanceOf(fee_receiver.address);
      expect(
        ((balance_after - balance_before) / 1e18).toFixed(9)
      ).to.equal((fee / 1e18).toFixed(9));

      let game_address = await game_factory.userGames(cross_user.address, 0);
      expect(
        await web3.eth.getBalance(game_address)
      ).to.equal(bet);

      const game = await ethers.getContractAt("Game", game_address);
      expect(
        await game.crossUser()
      ).to.equal(cross_user.address);
      expect(
        await game.nullUser()
      ).to.equal("0x0000000000000000000000000000000000000000");
      expect(
        await game.betAmount()
      ).to.equal(bet);
      expect(
        await game.betToken()
      ).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Step 4: Fee and bet in native: success", async function () {
      let balance_before = await web3.eth.getBalance(fee_receiver.address);
      await game_factory.connect(cross_user).newGame("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", bet, { value: feebet });
      let balance_after = await web3.eth.getBalance(fee_receiver.address);
      expect(
        ((balance_after - balance_before) / 1e18).toFixed(9)
      ).to.equal((fee / 1e18).toFixed(9));

      let game_address = await game_factory.userGames(cross_user.address, 0);
      expect(
        await web3.eth.getBalance(game_address)
      ).to.equal(bet);

      const game = await ethers.getContractAt("Game", game_address);
      expect(
        await game.crossUser()
      ).to.equal(cross_user.address);
      expect(
        await game.nullUser()
      ).to.equal("0x0000000000000000000000000000000000000000");
      expect(
        await game.betAmount()
      ).to.equal(bet);
      expect(
        await game.betToken()
      ).to.equal("0x0000000000000000000000000000000000000000");
    });
  });

  describe('Game: join game', () => {
    let game1;
    let game2;
    let game3;
    let game4;
    beforeEach(async () => {
      await fee_token.connect(cross_user).approve(game_factory.address, fee);
      await bet_token.connect(cross_user).approve(game_factory.address, bet);
      await game_factory.connect(cross_user).newGame(fee_token.address, bet_token.address, bet);
      let game1_address = await game_factory.userGames(cross_user.address, 0);
      game1 = await ethers.getContractAt("Game", game1_address);

      await bet_token.connect(cross_user).approve(game_factory.address, bet);
      await game_factory.connect(cross_user).newGame("0x0000000000000000000000000000000000000000", bet_token.address, bet, { value: fee });
      let game2_address = await game_factory.userGames(cross_user.address, 1);
      game2 = await ethers.getContractAt("Game", game2_address);

      await fee_token.connect(cross_user).approve(game_factory.address, fee);
      await game_factory.connect(cross_user).newGame(fee_token.address, "0x0000000000000000000000000000000000000000", bet, { value: bet });
      let game3_address = await game_factory.userGames(cross_user.address, 2);
      game3 = await ethers.getContractAt("Game", game3_address);

      await game_factory.connect(cross_user).newGame("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", bet, { value: feebet });
      let game4_address = await game_factory.userGames(cross_user.address, 3);
      game4 = await ethers.getContractAt("Game", game4_address);
    });

    it("Step 1: Join to game 1: success", async function () {
      await bet_token.connect(null_user).approve(game1.address, bet);
      await game1.connect(null_user).join();

      expect(
        await game1.nullUser()
      ).to.equal(null_user.address);
      expect(
        await bet_token.balanceOf(game1.address)
      ).to.equal(bet2);
    });

    it("Step 2: Join to game 2: success", async function () {
      await bet_token.connect(null_user).approve(game2.address, bet);
      await game2.connect(null_user).join();

      expect(
        await game2.nullUser()
      ).to.equal(null_user.address);
      expect(
        await bet_token.balanceOf(game2.address)
      ).to.equal(bet2);
    });

    it("Step 3: Join to game 3: success", async function () {
      await game3.connect(null_user).join({ value: bet });

      expect(
        await game3.nullUser()
      ).to.equal(null_user.address);
      expect(
        await web3.eth.getBalance(game3.address)
      ).to.equal(bet2);
    });

    it("Step 4: Join to game 4: success", async function () {
      await game4.connect(null_user).join({ value: bet });

      expect(
        await game4.nullUser()
      ).to.equal(null_user.address);
      expect(
        await web3.eth.getBalance(game4.address)
      ).to.equal(bet2);
    });
  });

  describe('Game: step game', () => {
    let game;
    beforeEach(async () => {
      await fee_token.connect(cross_user).approve(game_factory.address, fee);
      await bet_token.connect(cross_user).approve(game_factory.address, bet);
      await game_factory.connect(cross_user).newGame(fee_token.address, bet_token.address, bet);
      let game_address = await game_factory.userGames(cross_user.address, 0);
      game = await ethers.getContractAt("Game", game_address);
      await bet_token.connect(null_user).approve(game.address, bet);
      await game.connect(null_user).join();
    });
    it("Step 1: Cross user is win", async function () {
      for (let i = 0; i < 4; i++) {
        await game.connect(cross_user).step(i + 1, i + 1);
        await game.connect(null_user).step(0, i);
      }
      let balance_before = await bet_token.balanceOf(cross_user.address);
      await game.connect(cross_user).step(5, 5);
      let balance_after = await bet_token.balanceOf(cross_user.address);

      expect(
        balance_after / 1e18 - balance_before / 1e18
      ).to.equal(30);
      expect(
        await game.isActive()
      ).to.equal(false);
      expect(
        await game.winner()
      ).to.equal(1);
    });
    it("Step 2: Null user is win", async function () {
      for (let i = 0; i < 4; i++) {
        await game.connect(cross_user).step(i + 1, i + 1);
        await game.connect(null_user).step(0, i);
      }
      await game.connect(cross_user).step(4, 5);
      let balance_before = await bet_token.balanceOf(null_user.address);
      await game.connect(null_user).step(0, 4);
      let balance_after = await bet_token.balanceOf(null_user.address);

      expect(
        balance_after / 1e18 - balance_before / 1e18
      ).to.equal(30);
      expect(
        await game.isActive()
      ).to.equal(false);
      expect(
        await game.winner()
      ).to.equal(2);
    });
  });
});
