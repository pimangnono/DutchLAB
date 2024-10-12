// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const DutchAuctionFactory = await hre.ethers.getContractFactory(
    "DutchAuctionFactory",
  );
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const dutchAuctionFactory = await DutchAuctionFactory.deploy();
  const tokenFactory = await TokenFactory.deploy();

  await dutchAuctionFactory.waitForDeployment();
  await tokenFactory.waitForDeployment();
  
  // Deploy the Submarine related contracts
  const RevealContract = await hre.ethers.getContractFactory("Reveal");
  const deployedReveal = await RevealContract.deploy();
  await deployedReveal.waitForDeployment();

  const SubmarineFactory = await hre.ethers.getContractFactory("SubmarineFactory");
  const deployedSubFactory = await SubmarineFactory.deploy(deployedReveal.target);
  await deployedSubFactory.waitForDeployment();

  dutchAuctionAddress = dutchAuctionFactory.target;
  tokenAddress = tokenFactory.target;
  subFactoryAddress = deployedSubFactory.target;
  revealAddress = deployedReveal.target;

  console.log("DutchAuctionFactory deployed at:", dutchAuctionAddress);
  console.log("TokenFactory deployed at:", tokenAddress);
  console.log("SubmarineFactory deployed at:", subFactoryAddress);
  console.log("Reveal deployed at:", revealAddress);

  const outputPath = path.join(__dirname, "../../frontend/.env");
  const envVariables = `REACT_APP_DUTCH_AUCTION_FACTORY_ADDRESS=${dutchAuctionAddress}\nREACT_APP_TOKEN_FACTORY_ADDRESS=${tokenAddress}\nREACT_APP_SUB_FACTORY_ADDRESS=${subFactoryAddress}\nREACT_APP_REVEAL_ADDRESS=${revealAddress}`;

  // Write the contract addresses to the .env file
  fs.writeFileSync(outputPath, envVariables);

  console.log("Contract address written to frontend/.env");

  // Run the copyABIs.js script as a child process
  const copyABIsProcess = spawn("node", ["./scripts/copyABIs.js"]);

  // Handle output and errors from the child process
  copyABIsProcess.stdout.on("data", (data) => {
    console.log(`copyABIs.js output: ${data}`);
  });

  copyABIsProcess.stderr.on("data", (data) => {
    console.error(`copyABIs.js error: ${data}`);
  });

  // Wait for the child process to exit
  await new Promise((resolve, reject) => {
    copyABIsProcess.on("close", (code) => {
      if (code === 0) {
        console.log("copyABIs.js script completed successfully");
        resolve();
      } else {
        console.error(`copyABIs.js script exited with code ${code}`);
        reject(new Error(`copyABIs.js script exited with code ${code}`));
      }
    });
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
