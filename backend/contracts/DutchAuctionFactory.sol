// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./DutchAuction.sol";

// Define the DutchAuctionFactory contract
contract DutchAuctionFactory {
    address[] public auctions; // Array to store addresses of deployed auctions

    // Event to broadcast new auction deployments
    event AuctionCreated(address auctionAddress);

    // Function to create a new DutchAuction
    function createDutchAuction(
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
    ) public {
        // Deploy a new DutchAuction contract
        DutchAuction newAuction = new DutchAuction(
            msg.sender, // Set the creator as the owner
            _tokenAddress,
            _startPrice,
            _reservePrice,
            _priceDecrementRate,
            _auctionDuration,
            _tokensAvailable,
            _withdrawTimeLock,
            _maxTokensPerBuyer,
            _minDecrementRate,
            _maxDecrementRate
        );
        auctions.push(address(newAuction)); // Add the new auction's address to the array
        emit AuctionCreated(address(newAuction)); // Emit an event to announce the new auction
    }

    // Function to get the number of auctions deployed
    function getAuctionCount() public view returns (uint256) {
        return auctions.length;
    }

    // Function to get the address of a deployed auction by index
    function getAuction(uint256 index) public view returns (address) {
        require(index < auctions.length, "Index out of bounds");
        return auctions[index];
    }
}
