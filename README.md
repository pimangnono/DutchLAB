<img width="537" alt="image" src="https://github.com/user-attachments/assets/acf10de9-d567-464b-ab58-150447490f58">

## Overview 
  - [Overview](#overview)
  - [Features/Key Functions](#features)
  - [Setup Guide](#setup-guide)
    - [Installation](#installation)
  - [Instructions](#instructions)

## Features/Key Functions

**FrontEnd**
- ReactJS
- MaterialUI
  
**SmartContract**
- Solidity (Hardhat)

## Setup Guide

### Installation

1. Download Metamask

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

## Instructions

### Here are the steps:

#### 1.  Import Account and Add Network to Metamask.
Open your Metamask wallet, import the account using your private key, and add the specified local network to connect to your Ethereum node.
![Add network](assets/add_network.png)

#### 2.  Deploy Token and Create an Auction
Deploy the token contract and initialize an auction. This setup will allow other accounts to participate in bidding.

#### 3. Start the Auction
Start the auction to begin the countdown for the bidding period. Once started, users can begin placing bids within the specified timeframe

#### 4. Change Account and Place a Bid
Switch to a different account in Metamask, navigate to the auction interface, and place your bid. Ensure that your bid amount complies with the auction’s parameters.

#### 5. Reveal the Bid After the Bidding Period Ends
After the bidding period ends, each bidder should reveal their bid by interacting with the auction contract. Follow the prompts on the frontend to complete the reveal.

#### 6. Distribute Tokens to Bidders Once the Reveal Period Ends
Once the reveal period ends, the contract will allow token distribution to successful bidders based on their bid amounts and the auction rules.
