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
    bool public distributed = false; // Flag indicating if tokens have been distributed

    mapping(address => uint256) public tokensPurchasedByBuyer; // Track tokens purchased by each buyer
    address[] public buyers; // List of buyers to distribute tokens

    // Events to broadcast key actions during the auction
    event TokenPurchased(address buyer, uint256 amount, uint256 price);
    event AuctionEnded(uint256 tokensUnsold);
    event PriceDecrementRateUpdated(uint256 newPriceDecrementRate);
    event TokensDistributed();

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
        owner = payable(_owner); // Set the auction owner
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
        require(msg.sender == owner, "Only the owner can update the price decrement rate");
        require(!auctionEnded, "Cannot update price decrement rate after auction has ended");
        require(
            newPriceDecrementRate >= minDecrementRate &&
                newPriceDecrementRate <= maxDecrementRate,
            "New price decrement rate must be within allowed range"
        );

        priceDecrementRate = newPriceDecrementRate;
        emit PriceDecrementRateUpdated(newPriceDecrementRate);
    }

    // Function to get the current price of the token
    function getCurrentPrice() public view returns (uint256) {
        uint256 elapsed = block.timestamp - startTime;
        uint256 priceDrop = priceDecrementRate * elapsed;
        if (priceDrop >= startPrice) {
            return reservePrice;
        } else {
            return startPrice - priceDrop;
        }
    }

    // Function to buy tokens during the auction
    function buyTokens(uint256 amount) public payable nonReentrant {
        require(!auctionEnded, "Auction has ended");
        require(tokensSold + amount <= tokensAvailable, "Not enough tokens available");
        require(
            tokensPurchasedByBuyer[msg.sender] + amount <= maxTokensPerBuyer,
            "Purchase exceeds maximum allowed tokens per buyer"
        );

        uint256 currentPrice = getCurrentPrice();
        uint256 cost = (currentPrice * amount) / 1 ether;
        require(msg.value >= cost, "Not enough Ether sent");

        // Effects
        tokensSold += amount;
        tokensPurchasedByBuyer[msg.sender] += amount;
        buyers.push(msg.sender); // Add buyer to the list

        // Refund excess Ether if applicable
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit TokenPurchased(msg.sender, amount, currentPrice);

        if (tokensSold == tokensAvailable) {
            endAuction();
        }
    }

    // Function to manually or automatically end the auction
    function endAuction() public {
        require(
            msg.sender == owner || block.timestamp >= startTime + auctionDuration,
            "Only the owner can end the auction or auction duration must be over"
        );
        require(!auctionEnded, "Auction already ended");

        auctionEnded = true;
        emit AuctionEnded(tokensAvailable - tokensSold);
    }

    // Function to distribute tokens to buyers after the auction ends
    function distributeTokens() public nonReentrant {
        require(auctionEnded, "Auction has not ended yet");
        require(!distributed, "Tokens have already been distributed");

        for (uint256 i = 0; i < buyers.length; i++) {
            address buyer = buyers[i];
            uint256 amount = tokensPurchasedByBuyer[buyer];
            if (amount > 0) {
                token.transfer(buyer, amount); // Transfer tokens to each buyer
            }
        }

        distributed = true; // Mark tokens as distributed
        emit TokensDistributed();
    }

    // Function to allow the owner to withdraw collected Ether
    function withdraw() public {
        require(msg.sender == owner, "Only the owner can withdraw");
        require(auctionEnded, "Auction must be ended first");
        require(block.timestamp >= startTime + auctionDuration + withdrawTimeLock, "Withdrawal is locked");
        owner.transfer(address(this).balance);
    }
}