# Project in a Nutshell
Implement smart contracts on Ethereum and simple (minimally styled) front end webapp for a new token launch (STO/ICO) whose tokens are bid with Ether and distributed via a Dutch Auction over 20 minutes time.

# Background & Problem Statement
“Auction” in the most canonical connotation, might depict a scene in your mind where rich people are trying to purchase an expensive art collection with ever increasing higher bid, resulting in some news-worthy finalized clearing price. -- this is usually referred as “forward first-price auction”, ones that provide suppliers the opportunities to find the best price among interested buyers with ascending price tag.
In contrast with “first-price auction”, “Dutch auction” is another type of auction we often seen in a STO (Security Token Offering, whose unregulated predecessor known as ICO, initial coin offering). In a Dutch auction, there are few key important features:
  1. Everyone who buys the asset will get it at the same price per unit
  2. The price per unit is determined by the market
  3. The price starts high and descends over time
  4. 
One of the most prominent blockchain projects, Algorand, uses Dutch Auction to distribute its network token (i.e., native cryptocurrency on their chain). Please watch their explainer video on how Dutch Auction works (auxiliary blog post).

# Feature Requirement
Dutch Auction smart contracts should:
  • Firstly, define and implement your new token using the ERC20 standard
  • Implement Dutch auction logic in another contract(s)
  • Only elapse for 20 minutes, either all tokens get sold out at clearing price no lower than the reserved price, or only part of total token supply get sold with the remaining tokens burned by the auction contract
  • Be able to distribute the token minted to legitimate bidders at the end of the auction
  • (bonus) add tests to demonstrate the auction contract is resistant to reentry attack.
    ▫ What is reentry attack,
    ▫ hands-on practice on reentry.

# Tricky Points to Ponder
  • How to enforce auction duration/countdown clock in blockchain?
  • How to link/wrap your token contract with your auction contract?
  • How to “burn” the unsold tokens?
  • How to enforce successful bidder to pay Ether for the new token, (I.e., they can’t cancel the bid) and how to refund bids that are invalid?

## Table of Contents

- [dutch-auction](#dutch-auction)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Usage](#usage)

## Features

- React JavaScript Frontend w/ EthersJS
- Material UI styling
- Solidity (Hardhat) for contracts development
- Alchemy, Sepolia and Github Pages deployment

## Getting Started

### Prerequisites

- JS and Solidity knowledge
- An understanding of blockchain transactions

### Installation

1. Download Metamask [here](https://metamask.io/)

2. Start the node and deploy the contracts

```bash
# install contract dependencies
cd backend
npm install --force # some legacy deps

# start a local Hardhat node
npm run node

# create a new terminal
# deploy smart contracts
npm run deploy:local
```

3. Start the frontend

```bash
# install frontend dependencies
cd frontend
npm install

# start the frontend
# unix
npm run start
# windows
npm run start:windows
```

## Usage

### Here are the steps:

#### 1. Import account and add the following network to your Metamask wallet

![Add network](assets/add_network.png)

#### 2. Deploy token and create an auction

![Create auction](assets/create_auction.png)

#### 3. Start the auction

![Start auction](assets/start_auction.png)

#### 4. Change an account and place a bid

![Place bid](assets/place_bid.png)

#### 5. Once the place bid timing is over, reveal the bid to the auction

![Reveal bid](assets/reveal_bid.png)

#### 6. Once the reveal bid timing is over, distribute the tokens to bidders

![Distribute tokens](assets/distribute_tokens.png)
