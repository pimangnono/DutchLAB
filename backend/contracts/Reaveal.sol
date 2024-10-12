// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Submarine swap
interface ISubmarine {
    function getOwner() external view returns (address);
}

interface IDutchAuction {
    function addSubmarineToList(address _submarine) external;
}

// Reveal Contract
contract Reveal {
    // Store factory
    mapping(address => address) private factories;

    // Store byteCode
    mapping(address => bytes32) private byteCodes;

    // Store Factory Plus Bytes
    function storeFactoryPlusBytes(
        address _owner,
        address _factory,
        bytes32 _byteCode
    ) external {
        factories[_owner] = _factory;
        byteCodes[_owner] = _byteCode;
    }

    // Reveal Execution
    function revealExecution(
        address submarineAddress,
        address dutchAuctionAdd
    ) public {
        // Get submaine contract owner
        address subOwner = ISubmarine(submarineAddress).getOwner();

        // Ensure owner of submarine contract is also the message sender
        require(subOwner == msg.sender, "Owner error");

        IDutchAuction(dutchAuctionAdd).addSubmarineToList(submarineAddress);
    }
}
