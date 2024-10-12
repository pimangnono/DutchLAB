import DutchAuctionFactory from '../abis/DutchAuctionFactory.json';
import DutchAuction from '../abis/DutchAuction.json';
import TokenFactory from '../abis/TokenFactory.json';
import Token from '../abis/Token.json';
import SubmarineABI from '../abis/Submarine.json';

const abiDecoder = require('abi-decoder');
export const ethers = require('ethers');
export const provider = new ethers.providers.Web3Provider(window.ethereum);
export const signer = provider.getSigner();

export function getDutchAuctionFactoryContract() {
  const contract = new ethers.Contract(
    process.env.REACT_APP_DUTCH_AUCTION_FACTORY_ADDRESS,
    DutchAuctionFactory,
    signer,
  );
  return contract;
}

export function getDutchAuctionContract(address) {
  const contract = new ethers.Contract(address, DutchAuction, signer);
  return contract;
}

export function getTokenFactoryContract() {
  const contract = new ethers.Contract(
    process.env.REACT_APP_TOKEN_FACTORY_ADDRESS,
    TokenFactory,
    signer,
  );
  return contract;
}

export function getTokenContract(address) {
  const contract = new ethers.Contract(address, Token, signer);
  return contract;
}

export function getSubmarineContract(address) {
  const contract = new ethers.Contract(address, SubmarineABI, signer);
  return contract;
}

export function decodeTransactionData(abi, tx_data) {
  abiDecoder.addABI(abi);
  const decoded = abiDecoder.decodeMethod(tx_data);
  return decoded;
}

export function decodeTransctionLogs(abi, tx_logs) {
  abiDecoder.addABI(abi);
  const decoded = abiDecoder.decodeLogs(tx_logs);
  return decoded;
}

export function exportTokenToMetaMask(tokenAdd, tokenTicker) {
  window.ethereum.request({
    method: 'wallet_watchAsset',
    params: {
      type: 'ERC20',
      options: {
        address: tokenAdd,
        symbol: tokenTicker,
        decimals: 18,
      },
    },
  });
}
