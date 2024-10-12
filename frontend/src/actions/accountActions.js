export const accountLinked = (account_id) => {
  return {
    type: 'ACCOUNT_LINKED',
    payload: account_id,
  };
};

export const accountUnlinked = (account_id) => {
  return {
    type: 'ACCOUNT_UNLINKED',
    payload: account_id,
  };
};

export const accountBidded = (account_id, auctionAdd, submarineAdd) => {
  return {
    type: 'ACCOUNT_BIDDED',
    payload: {
      account_id: account_id,
      auctionAdd: auctionAdd,
      submarineAdd: submarineAdd,
    },
  };
};

export const accountRevealed = (account_id, auctionAdd) => {
  return {
    type: 'ACCOUNT_REVEALED',
    payload: {
      account_id: account_id,
      auctionAdd: auctionAdd,
    },
  };
};
