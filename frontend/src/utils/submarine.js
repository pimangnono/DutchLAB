import SubmarineFactoryABI from '../abis/SubmarineFactory.json';
import RevealABI from '../abis/Reveal.json';
import { ethers, provider, signer, decodeTransctionLogs } from './contract';
import { convertEthToWei } from './utils';

const subFactoryAddress = process.env.REACT_APP_SUB_FACTORY_ADDRESS;
const revealAddress = process.env.REACT_APP_REVEAL_ADDRESS;

export const createSubmarineContract = async (currentPrice) => {
  console.log('Creating Submarine contract...');
  const signerAdd = await signer.getAddress();
  // Connect to Factory as signer
  const factoryContract = new ethers.Contract(subFactoryAddress, SubmarineFactoryABI, signer);
  console.log(factoryContract);
  // Create submarine contract with the owner as sender
  currentPrice = convertEthToWei(currentPrice);
  const contractCreateTx = await factoryContract.createSubContract(signerAdd, currentPrice);
  console.log(contractCreateTx);
  // Print out submarine transaction receipt
  const txReceipt = await contractCreateTx.wait();
  console.log('Submarine contract creation TX : ', txReceipt);
  // Sleep 5s to allow for transaction to be mined
  const txLogs = decodeTransctionLogs(SubmarineFactoryABI, txReceipt.logs);

  const submarineAddress = txLogs[0].events.find((e) => e.name === 'submarine').value;
  console.log(submarineAddress);
  return submarineAddress;
};

export const sendEthertoSubmarine = async (submarineAddress, amountETH) => {
  console.log('Sending funds to Submaring contract...');

  // Show current Submarine Contract balance
  const submarineBalance = ethers.utils.formatEther(await provider.getBalance(submarineAddress));
  console.log('Initial balance on Submarine contract ETH: ', submarineBalance);

  // Convert ethereum into wei
  console.log(amountETH);
  const amountWei = ethers.utils.parseEther(amountETH);
  console.log(amountWei);

  // Build Transaction
  const tx = {
    to: submarineAddress,
    value: amountWei,
  };

  // Send Transaction
  const txSend = await signer.sendTransaction(tx);
  await txSend.wait();
};

export const getSubmarineBalance = async (submarineAddress) => {
  console.log('Checking funds on Submarine contract...');

  // Show balance of submarine transaction
  const balance = await provider.getBalance(submarineAddress);
  const humanBalance = ethers.utils.formatEther(balance);
  return humanBalance;
};

export const executeTransaction = async (submarineAddess, dutchAuctionAddress) => {
  console.log('Performing swap...');
  // Connect to reveal contract
  const revealContractSigner = new ethers.Contract(revealAddress, RevealABI, signer);

  // Execute swap
  const swapTx = await revealContractSigner.revealExecution(submarineAddess, dutchAuctionAddress);
  await swapTx.wait();
};
