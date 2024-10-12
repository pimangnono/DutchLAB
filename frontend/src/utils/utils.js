const { ethers } = require('ethers');

export function convertUnixTimeToMinutes(unix_time) {
  const minutes = Math.floor(unix_time / 60);
  const seconds = unix_time % 60;
  return `${minutes}m ${seconds}s`;
}

export function convertWeiToEth(wei) {
  return ethers.utils.formatEther(wei.toString());
}

export function convertEthToWei(eth) {
  return ethers.utils.parseEther(eth);
}

export function auctionStatusText(auctionStatus) {
  if (auctionStatus == 0) {
    return 'Not Started';
  } else if (auctionStatus == 1) {
    return 'Active';
  } else if (auctionStatus == 2) {
    return 'Revealing';
  } else if (auctionStatus == 3) {
    return 'Distributing';
  } else if (auctionStatus == 4) {
    return 'Ended';
  }
}

export function getCurrentAccount(accounts) {
  if (accounts == null || accounts.length == 0) {
    return null;
  }
  let currentAccount = null;
  accounts.map((account) => {
    if (account && account.loggedIn) {
      currentAccount = account;
    }
  });
  return currentAccount;
}
