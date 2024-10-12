const initialState = { accounts: [] };

export const accountsReducer = (state = initialState, action) => {
  let newAccounts = [];
  switch (action.type) {
    case 'ACCOUNT_LINKED': {
      let accountFound = false;
      // check if account_id already exists in state
      let newAccounts = [];
      if (state.accounts) {
        newAccounts = state.accounts.map((account) => {
          if (account) {
            if (account.account_id === action.payload) {
              accountFound = true;
              return { ...account, loggedIn: true };
            } else {
              return { ...account, loggedIn: false };
            }
          }
        });
        // add account_id to state
        if (!accountFound) {
          newAccounts.push({
            account_id: action.payload,
            loggedIn: true,
            auctionsBidded: [],
          });
        }
      } else {
        newAccounts = [
          {
            account_id: action.payload,
            loggedIn: true,
            auctionsBidded: [],
          },
        ];
      }
      return { ...state, accounts: newAccounts };
    }
    case 'ACCOUNT_UNLINKED':
      newAccounts = state.accounts.map((account) => {
        if (account && account.account_id === action.payload) {
          return { ...account, loggedIn: false };
        }
        return account;
      });
      return { ...state, accounts: newAccounts };
    case 'ACCOUNT_BIDDED': {
      newAccounts = state.accounts.map((account) => {
        if (account && account.account_id === action.payload.account_id) {
          const newAuctions = [
            ...account.auctionsBidded,
            {
              auctionAdd: action.payload.auctionAdd,
              submarineAdd: action.payload.submarineAdd,
              revealed: false,
            },
          ];
          return { ...account, auctionsBidded: newAuctions };
        }
        return account;
      });
      return { ...state, accounts: newAccounts };
    }
    case 'ACCOUNT_REVEALED': {
      newAccounts = state.accounts.map((account) => {
        if (account && account.account_id === action.payload.account_id) {
          const newAuctionsBidded = account.auctionsBidded.map((auction) => {
            if (auction.auctionAdd === action.payload.auctionAdd) {
              return { ...auction, revealed: true };
            }
            return auction;
          });
          return { ...account, auctionsBidded: newAuctionsBidded };
        }
        return account;
      });

      return { ...state, accounts: newAccounts };
    }
    default:
      return state;
  }
};
