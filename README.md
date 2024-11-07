<img width="537" alt="image" src="https://github.com/user-attachments/assets/acf10de9-d567-464b-ab58-150447490f58">

## Table of Contents

- [dutch-lab](#dutch-lab)
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
