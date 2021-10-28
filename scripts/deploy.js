const { ethers, upgrades } = require("hardhat");
const dotenv = require('dotenv');
const fs = require('fs');
const stringify = require('dotenv-stringify');

async function main() {
  dotenv.config();
  const accounts = await ethers.getSigners();
  const sender = accounts[0].address;
  console.log("Sender address: ", sender);

  const network = hre.network.name;
  const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`))
  for (const k in envConfig) { process.env[k] = envConfig[k]; }
  console.log("Deploying...");
  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const game_factory = await upgrades.deployProxy(GameFactory, [sender], { initializer: 'initialize' });
  await game_factory.deployed();
  envConfig["GAME_FACTORY"] = game_factory.address;
  console.log("Game factory has been deployed to:", game_factory.address);

  fs.writeFileSync(`.env-${network}`, stringify(envConfig));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
