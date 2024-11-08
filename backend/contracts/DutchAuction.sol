// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import "hardhat/console.sol" as Console;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function burn(address account, uint256 amount) external;
}

interface ISubmarine {
    function timestamp() external view returns (uint);
    function currentPrice() external view returns (uint);
    function getOwner() external view returns (address);
    function getBalance() external view returns (uint);
    function sendToOwner(uint amount) external payable;
    function sendToAccount(address payable account, uint amount) external payable;
}

function min(uint256 a, uint256 b) pure returns (uint256) {
    return a <= b ? a : b;
}

contract DutchAuction {
    uint public constant AUCTION_DURATION = 20 minutes;
    uint public constant REVEAL_DURATION = 10 minutes;

    IERC20 public immutable token;
    uint public immutable tokenQty;
    uint public immutable tokenId;

    address payable public immutable seller;
    uint public immutable startingPrice;
    uint public immutable discountRate;
    uint public startAt = 0;
    uint public revealAt = 0;
    uint public endAt = 0;
    bool distributed = false;
    bool private locked = false; // Prevent re-entrancy
    enum Status {
        NotStarted,
        Active,
        Revealing,
        Distributing,
        Ended
    }

    Status private status = Status.NotStarted;

    uint private tokenNetWorthPool;
    uint private currentBidNetWorthPool;
    address[] private submarineList;
    mapping(address => bool) private seenBidders;

    event AuctionCreated(address indexed _seller, address indexed _token, uint _qty, uint startPrice, uint discountRate);
    event StartOfAuction();
    event DepositTokens(address indexed _from, uint indexed _qty);
    event LogBid(address indexed _from, uint indexed _price);
    event EndCommitStage();
    event EndRevealStage();
    event EndDistributingStage();
    event SuccessfulBid(address indexed _bidder, uint _qtyAllocated, uint refund);

    modifier onlyNotSeller() {
        require(msg.sender != seller, "The seller cannot perform this action");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only the seller can perform this action");
        _;
    }

    modifier onlyNotStarted() {
        require(status == Status.NotStarted, "This auction has already started");
        _;
    }

    modifier onlyActive() {
        require(status == Status.Active, "This auction is no longer active");
        _;
    }

    modifier onlyRevealing() {
        require(status == Status.Revealing, "This auction is not in revealing stage");
        _;
    }

    modifier onlyDistributing() {
        require(status == Status.Distributing, "This auction is not in distributing stage");
        _;
    }

    modifier onlyEnded() {
        require(status == Status.Ended, "This auction is not ended");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Re-entrant call detected");
        locked = true;
        _;
        locked = false;
    }

    constructor(
        address _seller,
        uint _startingPrice,
        uint _discountRate,
        address _token,
        uint _tokenQty,
        uint _tokenId
    ) {
        seller = payable(_seller);
        startingPrice = _startingPrice;
        discountRate = _discountRate;

        require(
            _startingPrice >= _discountRate * AUCTION_DURATION,
            "Starting price is too low"
        );

        token = IERC20(_token);
        tokenQty = _tokenQty;
        tokenId = _tokenId;

        tokenNetWorthPool = (startingPrice * tokenQty) / 10 ** 18;

        emit AuctionCreated(seller, _token, tokenQty, startingPrice, discountRate);
    }

    function startAuction() external onlySeller onlyNotStarted {
        injectTokens();
        require(
            tokenQty == token.balanceOf(address(this)),
            "Not enough tokens injected"
        );
        startAt = block.timestamp;
        revealAt = block.timestamp + AUCTION_DURATION;
        endAt = revealAt + REVEAL_DURATION;
        status = Status.Active;
        emit StartOfAuction();
    }

    function injectTokens() internal onlySeller onlyNotStarted {
        // Check if enough allowance is provided for the contract to transfer tokens
        require(token.allowance(msg.sender, address(this)) >= tokenQty, "Not enough allowance for token transfer");
        token.transferFrom(msg.sender, address(this), tokenQty);
        emit DepositTokens(msg.sender, tokenQty);
    }

    function getPrice(uint time_now) public view returns (uint) {
        // Ensure that the input time is valid (not in the past)
        require(time_now >= startAt, "Invalid time input");

        if (status == Status.NotStarted) return startingPrice;
        if (status != Status.Active) {
            return getReservePrice();
        }
        uint timeElapsed = time_now - startAt;
        uint discount = discountRate * timeElapsed;
        uint currentPrice = startingPrice > discount ? startingPrice - discount : 0;

        // Ensure price does not fall below the reserve price
        uint reservePrice = getReservePrice();
        return currentPrice > reservePrice ? currentPrice : reservePrice;
    }

    function getReservePrice() public view returns (uint) {
        return startingPrice - AUCTION_DURATION * discountRate;
    }

    function distributeToken() public payable onlyRevealing nonReentrant {
        endRevealStage();
        uint currentTokenNetWorth = 0;
        uint currentBidNetWorth = 0;
        uint finalPrice = startingPrice;
        bool exceededWorth = false;

        // Find final price and refund to submarine owners
        for (uint i = 0; i < submarineList.length; i++) {
            ISubmarine submarine = ISubmarine(submarineList[i]);
            address bidder = submarine.getOwner();
            if (seenBidders[bidder]) {
                continue;
            }
            seenBidders[bidder] = true;
            uint submarineBalance = submarine.getBalance();
            currentTokenNetWorth = (submarine.currentPrice() * tokenQty) / 10 ** 18;
            currentBidNetWorth += submarineBalance;

            if (!exceededWorth) {
                finalPrice = submarine.currentPrice();
            } else {
                // Add error handling for external calls
                try submarine.sendToOwner(submarineBalance) {} catch {
                    //Console.log("Failed to send balance to submarine owner");
                }
                continue;
            }

            if (currentBidNetWorth >= currentTokenNetWorth) {
                uint refund = currentBidNetWorth - currentTokenNetWorth;
                // Add error handling for refund
                try submarine.sendToOwner(refund) {} catch {
                    //Console.log("Failed to refund to submarine owner");
                }
                exceededWorth = true;
            }
        }

        // Distribute tokens to bidders
        uint tokenQtyLeft = tokenQty;
        for (uint i = 0; i < submarineList.length && tokenQtyLeft > 0; i++) {
            ISubmarine submarine = ISubmarine(submarineList[i]);
            uint submarineBalance = submarine.getBalance();
            uint qty = (submarineBalance * 10 ** 18) / finalPrice;

            // Send token to bidder
            //Console.log("qty left %s", tokenQtyLeft);
            //Console.log("transfer %s to %s", qty, submarine.getOwner());
            token.transfer(submarine.getOwner(), min(qty, tokenQtyLeft));

            // Send ether to seller
            submarine.sendToAccount(
                seller,
                (min(qty, tokenQtyLeft) * finalPrice) / 10 ** 18
            );
            tokenQtyLeft -= qty;
        }

        // Refund tokens to seller
        if (tokenQtyLeft > 0) {
            token.burn(address(this), tokenQtyLeft);
        }

        endDistributingStage();
    }

    // Helper functions to manage stages and ensure orderly progress
    function endRevealStage() internal onlyRevealing {
        status = Status.Distributing;
        emit EndRevealStage();
    }

    function endDistributingStage() internal onlyDistributing {
        distributed = true;
        status = Status.Ended;
        emit EndDistributingStage();
    }

    function auctionStatusPred(uint time_now) public view returns (Status) {
        // function for polling
        Status predStatus;
        if (startAt == 0) {
            predStatus = Status.NotStarted;
        } else if (time_now >= startAt && time_now < revealAt) {
            predStatus = Status.Active;
        } else if (time_now >= revealAt && time_now < endAt) {
            predStatus = Status.Revealing;
        } else if (time_now >= endAt) {
            if (distributed) {
                predStatus = Status.Ended;
            } else {
                predStatus = Status.Distributing;
            }
        }
        return predStatus;
    }
}
