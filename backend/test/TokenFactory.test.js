/*
Testing method:
cd backend
npx hardhat test --config hardhat.config.local.js
*/

// Import necessary dependencies
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DutchAuction and DutchAuctionFactory", function () {
  async function deployContractsFixture() {
    // Deploy the DutchAuctionToken
    const [owner, buyer1, buyer2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    const Token = await ethers.getContractFactory("DutchAuctionToken", owner);
    const token = await Token.connect(owner).deploy(initialSupply);
    await token.waitForDeployment();
    console.log("Token deployed at:", token.target);

    // Deploy the DutchAuctionFactory
    const DutchAuctionFactory = await ethers.getContractFactory("DutchAuctionFactory", owner);
    const factory = await DutchAuctionFactory.connect(owner).deploy();
    await factory.waitForDeployment();
    console.log("Factory deployed at:", factory.target);

    return { factory, token, owner, buyer1, buyer2 };
  }

  describe("Factory Deployment", function () {
    it("Should deploy DutchAuctionFactory contract", async function () {
      const { factory } = await deployContractsFixture();
      expect(factory.target).to.be.properAddress;
    });

    it("Should create a new DutchAuction contract", async function () {
      const { factory, token, owner } = await deployContractsFixture();

      // Auction parameters
      const startPrice = ethers.parseEther("1");
      const reservePrice = ethers.parseEther("0.1");
      const priceDecrementRate = ethers.parseEther("0.01");
      const auctionDuration = 7 * 24 * 60 * 60; // 7 days
      const tokensAvailable = ethers.parseEther("100");
      const withdrawTimeLock = 3 * 24 * 60 * 60; // 3 days
      const maxTokensPerBuyer = ethers.parseEther("10");
      const minDecrementRate = ethers.parseEther("0.005");
      const maxDecrementRate = ethers.parseEther("0.02");

      // Call the factory to create a new DutchAuction
      const tx = await factory.connect(owner).createDutchAuction(
        token.target,
        startPrice,
        reservePrice,
        priceDecrementRate,
        auctionDuration,
        tokensAvailable,
        withdrawTimeLock,
        maxTokensPerBuyer,
        minDecrementRate,
        maxDecrementRate
      );

      await tx.wait();

      // Verify that an auction was created
      const auctionCount = await factory.getAuctionCount();
      console.log("Number of auctions:", auctionCount.toString());
      expect(auctionCount).to.equal(1);

      const auctionAddress = await factory.getAuction(0);
      console.log("Auction deployed at:", auctionAddress);
      expect(auctionAddress).to.be.properAddress;
    });
  });

  describe("DutchAuction Functionality", function () {
    it("Should deploy a DutchAuction and allow token purchase", async function () {
      const { factory, token, owner, buyer1 } = await deployContractsFixture();

      // Deploy an auction
      const startPrice = ethers.parseEther("1");
      const reservePrice = ethers.parseEther("0.1");
      const priceDecrementRate = ethers.parseEther("0.01");
      const auctionDuration = 7 * 24 * 60 * 60;
      const tokensAvailable = ethers.parseEther("100");
      const withdrawTimeLock = 3 * 24 * 60 * 60;
      const maxTokensPerBuyer = ethers.parseEther("10");
      const minDecrementRate = ethers.parseEther("0.005");
      const maxDecrementRate = ethers.parseEther("0.02");

      const tx = await factory.connect(owner).createDutchAuction(
        token.target,
        startPrice,
        reservePrice,
        priceDecrementRate,
        auctionDuration,
        tokensAvailable,
        withdrawTimeLock,
        maxTokensPerBuyer,
        minDecrementRate,
        maxDecrementRate
      );

      await tx.wait();
      const auctionAddress = await factory.getAuction(0);
      console.log("Auction deployed at:", auctionAddress);
      const DutchAuction = await ethers.getContractFactory("DutchAuction");
      const auction = DutchAuction.attach(auctionAddress);

      // Transfer some tokens to the auction
      await token.connect(owner).transfer(auctionAddress, tokensAvailable);

      // Buyer purchases tokens after the auction starts
      await ethers.provider.send("evm_increaseTime", [3600]); // Fast forward time by 1 hour
      await ethers.provider.send("evm_mine");

      const amountToBuy = ethers.parseEther("5");
      const currentPrice = await auction.getCurrentPrice();
      const totalCost = (currentPrice * amountToBuy) / ethers.parseEther("1");

      await auction.connect(buyer1).buyTokens(amountToBuy, {
        value: totalCost,
      });

      // Check buyer balance
      const buyerBalance = await token.balanceOf(buyer1.address);
      expect(buyerBalance).to.equal(amountToBuy);

      // Check remaining tokens in auction
      const tokensLeft = await token.balanceOf(auctionAddress);
      expect(tokensLeft).to.equal(tokensAvailable - amountToBuy);
    });

    it("Should end auction correctly and allow withdrawal by owner", async function () {
      const { factory, token, owner } = await deployContractsFixture();

      // Deploy an auction
      const startPrice = ethers.parseEther("1");
      const reservePrice = ethers.parseEther("0.1");
      const priceDecrementRate = ethers.parseEther("0.01");
      const auctionDuration = 7 * 24 * 60 * 60;
      const tokensAvailable = ethers.parseEther("100");
      const withdrawTimeLock = 3 * 24 * 60 * 60;
      const maxTokensPerBuyer = ethers.parseEther("10");
      const minDecrementRate = ethers.parseEther("0.005");
      const maxDecrementRate = ethers.parseEther("0.02");

      const tx = await factory.connect(owner).createDutchAuction(
        token.target,
        startPrice,
        reservePrice,
        priceDecrementRate,
        auctionDuration,
        tokensAvailable,
        withdrawTimeLock,
        maxTokensPerBuyer,
        minDecrementRate,
        maxDecrementRate
      );


      await tx.wait();
      const auctionAddress = await factory.getAuction(0);
      console.log("Auction deployed at:", auctionAddress);
      const DutchAuction = await ethers.getContractFactory("DutchAuction");
      const auction = DutchAuction.attach(auctionAddress);

      ////testing if owner matches auction creator ////
      console.log("Owner Address in Test:", owner.address);
      console.log("Owner Address in Contract:", await auction.owner());

      expect(await auction.owner()).to.equal(owner.address);
      /////////////////////////////////////////////////


      // Fast forward to end the auction duration
      await ethers.provider.send("evm_increaseTime", [auctionDuration]);
      await ethers.provider.send("evm_mine");

      // End the auction
      await auction.connect(owner).endAuction();

      // Fast forward to allow owner withdrawal
      await ethers.provider.send("evm_increaseTime", [withdrawTimeLock]);
      await ethers.provider.send("evm_mine");

      const ownerInitialBalance = await ethers.provider.getBalance(owner.address);



      // Withdraw funds as owner
      await auction.connect(owner).withdraw();

      // Check the owner’s balance to ensure they received the funds
      const ownerFinalBalance = await ethers.provider.getBalance(owner.address);

      // Define a delta to account for gas cost differences
      const delta = ethers.parseEther("0.01"); // Allow a small difference of 0.01 ether

      expect(ownerFinalBalance).to.be.closeTo(ownerInitialBalance, delta);
    });
  });
});
