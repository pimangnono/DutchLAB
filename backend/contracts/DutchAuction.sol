// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import ERC20 standard contract from OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Define the DutchAuctionToken contract inheriting from ERC20
contract DutchAuctionToken is ERC20 {
    // Constructor to initialize the token details
    constructor(uint256 initialSupply) ERC20("DutchAuctionToken", "DAT") {
        _mint(msg.sender, initialSupply); // Mint the initial supply of tokens to the contract deployer
    }
}

// Define the DutchAuction contract
contract DutchAuction is ReentrancyGuard {
    // Declare state variables for auction management
    DutchAuctionToken public token; 
    address payable public owner; 
    uint256 public startPrice; 
    uint256 public reservePrice; 
    uint256 public priceDecrementRate; // Price decrement rate per second
    uint256 public startTime; // Auction start time
    uint256 public auctionDuration; // Auction duration in seconds
    uint256 public tokensAvailable; // Total tokens available for auction
    uint256 public tokensSold; 
    bool public auctionEnded; // Flag indicating if the auction has ended
    uint256 public withdrawTimeLock; // Time lock for withdrawal after auction ends
    uint256 public maxTokensPerBuyer; // Maximum tokens each buyer can purchase
    uint256 public minDecrementRate; // Minimum allowed price decrement rate
    uint256 public maxDecrementRate; // Maximum allowed price decrement rate

    mapping(address => uint256) public tokensPurchasedByBuyer; // Track tokens purchased by each buyer

    // Events to broadcast key actions during the auction
    event TokenPurchased(address buyer, uint256 amount, uint256 price);
    event AuctionEnded(uint256 tokensUnsold);
    event PriceDecrementRateUpdated(uint256 newPriceDecrementRate);

    // Constructor to initialize auction parameters
    constructor(
        address _owner,
        address _tokenAddress,
        uint256 _startPrice,
        uint256 _reservePrice,
        uint256 _priceDecrementRate,
        uint256 _auctionDuration,
        uint256 _tokensAvailable,
        uint256 _withdrawTimeLock,
        uint256 _maxTokensPerBuyer,
        uint256 _minDecrementRate,
        uint256 _maxDecrementRate
    ) {
        token = DutchAuctionToken(_tokenAddress); 
        owner = payable(_owner); //for testing
        //owner = payable(msg.sender); // Set the auction owner as the deployer of the contract
        startPrice = _startPrice; 
        reservePrice = _reservePrice; 
        priceDecrementRate = _priceDecrementRate; 
        auctionDuration = _auctionDuration; 
        tokensAvailable = _tokensAvailable; 
        startTime = block.timestamp; 
        withdrawTimeLock = _withdrawTimeLock; 
        maxTokensPerBuyer = _maxTokensPerBuyer; 
        minDecrementRate = _minDecrementRate;
        maxDecrementRate = _maxDecrementRate;
    }

    // Function to dynamically update the price decrement rate
    function updatePriceDecrementRate(uint256 newPriceDecrementRate) public {
        require(msg.sender == owner, "Only the owner can update the price decrement rate"); // Only the owner can update the rate
        require(!auctionEnded, "Cannot update price decrement rate after auction has ended"); // Ensure the auction is still ongoing
        require(
            newPriceDecrementRate >= minDecrementRate && newPriceDecrementRate <= maxDecrementRate,
            "New price decrement rate must be within allowed range"
        ); // Ensure the new decrement rate is within allowed limits

        priceDecrementRate = newPriceDecrementRate; // Update the price decrement rate
        emit PriceDecrementRateUpdated(newPriceDecrementRate); // Emit an event indicating the update
    }

    // Function to get the current price of the token
    function getCurrentPrice() public view returns (uint256) {
        uint256 elapsed = block.timestamp - startTime; // Calculate the elapsed time since auction start
        uint256 priceDrop = priceDecrementRate * elapsed; // Calculate the price drop using an linear model
        if (priceDrop >= startPrice) {
            return reservePrice;
        } else {
            return startPrice - priceDrop;
        }
    }

    // Function to buy tokens during the auction
    function buyTokens(uint256 amount) public payable nonReentrant {
        require(!auctionEnded, "Auction has ended"); // Ensure the auction is ongoing
        require(tokensSold + amount <= tokensAvailable, "Not enough tokens available"); // Ensure enough tokens are available
        require(tokensPurchasedByBuyer[msg.sender] + amount <= maxTokensPerBuyer, "Purchase exceeds maximum allowed tokens per buyer"); // Ensure buyer does not exceed max limit

        uint256 currentPrice = getCurrentPrice(); // Get the current token price
        uint256 cost = currentPrice * amount / 1 ether; // Calculate the total cost of tokens
        require(msg.value >= cost, "Not enough Ether sent"); // Ensure the buyer sends enough Ether

        // Effects
        tokensSold += amount; // Update the number of tokens sold
        tokensPurchasedByBuyer[msg.sender] += amount; // Update tokens purchased by the buyer

        // Interaction
        token.transfer(msg.sender, amount); // Transfer the tokens

        // Refund excess Ether if applicable
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost); // Refund extra Ether
        }

        emit TokenPurchased(msg.sender, amount, currentPrice); // Emit a purchase event

        // End auction if all tokens are sold
        if (tokensSold == tokensAvailable) {
            endAuction(); // Call endAuction to finalize auction
        }
    }

    // Function to manually or automatically end the auction
    function endAuction() public {
        require(msg.sender == owner || block.timestamp >= startTime + auctionDuration, "Only the owner can end the auction or auction duration must be over"); // Allow owner or end automatically after duration
        require(!auctionEnded, "Auction already ended"); // Ensure the auction has not already ended

        auctionEnded = true; // Mark the auction as ended
        emit AuctionEnded(tokensAvailable - tokensSold); // Emit an event indicating auction ended
    }

    // Function to allow the owner to withdraw collected Ether
    function withdraw() public {
        require(msg.sender == owner, "Only the owner can withdraw"); // Only the auction owner can withdraw the Ether
        require(auctionEnded, "Auction must be ended first"); // Ensure the auction has ended before withdrawal
        require(block.timestamp >= startTime + auctionDuration + withdrawTimeLock, "Withdrawal is locked"); // Ensure the withdrawal time lock has passed
        owner.transfer(address(this).balance); // Transfer the contract balance to the auction owner
    }
}
