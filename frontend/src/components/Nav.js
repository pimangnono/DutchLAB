import React from 'react';
import { useSDK } from '@metamask/sdk-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
// Material UI Componeents
import { Button } from '@mui/material';
// Files
import './css/nav.css';
import logo from '../images/nav-bar-banner.png';

import { accountLinked, accountUnlinked } from '../actions/accountActions';
import { getCurrentAccount } from '../utils/utils';

const Nav = (props) => {
  const { handleOpenModal } = props;

  const accounts = useSelector((state) => state.accountsState.accounts);
  const currentAccount = getCurrentAccount(accounts);
  console.log(accounts);
  const { sdk } = useSDK();

  const dispatch = useDispatch();

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      let cur_account = accounts?.[0];
      dispatch(accountLinked(cur_account));
    } catch (err) {
      console.warn(`failed to connect..`, err);
    }
  };

  const disconnect = async () => {
    try {
      await sdk?.disconnect();
      dispatch(accountUnlinked(currentAccount.account_id));
    } catch (err) {
      console.warn(`failed to disconnect..`, err);
    }
  };

  return (
    <div className="nav">
      <div className="nav__group1">
        <div className="nav__image-container">
          <RouterLink to="/">
            <img className="nav__icon" src={logo} alt="navicon" href="/" />
          </RouterLink>
        </div>

        <div className="nav__buttons">
          <RouterLink to="/" style={{ textDecoration: 'none' }}>
            <Button>Home</Button>
          </RouterLink>
          <Button onClick={handleOpenModal}>Create Auction</Button>
        </div>
      </div>

      <div className="nav__group2">
        <div className="nav__account">
          {!currentAccount ? (
            <Button onClick={connect}>Link your wallet</Button>
          ) : (
            <Button onClick={disconnect}>{currentAccount.account_id}</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Nav;
