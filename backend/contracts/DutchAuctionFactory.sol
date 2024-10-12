// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./DutchAuction.sol";

contract DutchAuctionFactory {
    address[] public auctions;
    uint256 public auctionCount;
    event AuctionDe(address tokenAddress);

    event AuctionDeployed(address indexed auctionAddress);

    function deployAuction(
        address _token,
        uint _qty,
        uint _startPrice,
        uint _discountRate
    ) public returns (address) {
        auctionCount += 1;
        DutchAuction dutchAuction = new DutchAuction(
            msg.sender,
            _startPrice,
            _discountRate,
            _token,
            _qty,
            auctionCount
        );
        auctions.push(address(dutchAuction));
        emit AuctionDeployed(address(dutchAuction));
        return address(dutchAuction);
    }
}
