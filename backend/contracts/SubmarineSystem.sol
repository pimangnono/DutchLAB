// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Submarine Contract Interfaces
interface RevealInterface {
    function storeFactoryPlusBytes(
        address _owner,
        address _factory,
        bytes32 _byteCode
    ) external;
}

interface SubmarineInterface {
    function getOwner() external view returns (address);
}

interface DutchAuctionInterface {
    function addSubmarineToList(address _submarine) external;
}

// Submarine Contract
contract Submarine {
    address payable private owner;
    uint256 public timestamp = block.timestamp;
    uint256 public currentPrice;
    address private revealContractAddr;

    constructor(
        address payable _owner,
        address _revealContract,
        uint _currentPrice
    ) payable {
        owner = _owner;
        revealContractAddr = _revealContract;
        currentPrice = _currentPrice;
    }

    receive() external payable {}
    fallback() external payable {}

    function _checkOwner() private view {
        require(msg.sender == owner, "Not called by owner");
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    function sendToOwner(uint amount) external payable {
        require(amount <= address(this).balance, "Not enough balance");
        owner.transfer(amount);
    }

    function sendToAccount(address payable account, uint amount) external payable {
        require(amount <= address(this).balance, "Not enough balance");
        account.transfer(amount);
    }

    function _destroy() public payable {
        require(
            msg.sender == revealContractAddr,
            "Not allowed caller for destroy"
        );
        selfdestruct(owner);
    }
}

// Submarine 
contract SubmarineSystem {
    address private revealContractAddr;
    mapping(address => address) private submarines;

    constructor(address _revealContract) payable {
        revealContractAddr = _revealContract;
    }

    event SubmarineCreated(address indexed owner, address indexed submarine);

    function createSubContract(
        address payable _owner,
        uint _currentPrice
    ) public returns (address) {
        bytes32 byteCode = keccak256(
            abi.encodePacked(
                type(Submarine).creationCode,
                abi.encode(_owner, revealContractAddr, _currentPrice)
            )
        );

        Submarine sub = new Submarine(
            _owner,
            revealContractAddr,
            _currentPrice
        );

        RevealInterface(revealContractAddr).storeFactoryPlusBytes(
            _owner,
            address(this),
            byteCode
        );

        submarines[_owner] = address(sub);
        emit SubmarineCreated(_owner, address(sub));
        return address(sub);
    }

    function _getByteCode(address _owner) private view returns (bytes memory) {
        bytes memory bytecode = type(Submarine).creationCode;
        return abi.encodePacked(bytecode, abi.encode(_owner, revealContractAddr));
    }

    function getSubAddress() public view returns (address) {
        return submarines[msg.sender];
    }

    function getRevealContractAddress() public view returns (address) {
        return revealContractAddr;
    }
}

// Reveal Contract
contract Reveal {
    mapping(address => address) private factories;
    mapping(address => bytes32) private byteCodes;

    function storeFactoryPlusBytes(
        address _owner,
        address _factory,
        bytes32 _byteCode
    ) external {
        factories[_owner] = _factory;
        byteCodes[_owner] = _byteCode;
    }

    function revealExecution(
        address submarineAddress,
        address dutchAuctionAdd
    ) public {
        address subOwner = SubmarineInterface(submarineAddress).getOwner();
        require(subOwner == msg.sender, "Owner error");

        DutchAuctionInterface(dutchAuctionAdd).addSubmarineToList(submarineAddress);
    }
}
