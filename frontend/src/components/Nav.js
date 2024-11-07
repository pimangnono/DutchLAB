import React, { useState } from 'react';
import { useSDK } from '@metamask/sdk-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Button,
  Typography,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import './css/nav.css';
import logo from '../images/auction.png';

import { accountLinked, accountUnlinked } from '../actions/accountActions';
import { getCurrentAccount } from '../utils/utils';

const Nav = (props) => {
  const { handleOpenModal } = props;

  const accounts = useSelector((state) => state.accountsState.accounts);
  const currentAccount = getCurrentAccount(accounts);
  console.log(accounts);
  const { sdk } = useSDK();

  const mask = (str) => {
    return str.slice(0, 6) + '...' + str.slice(str.length - 6, str.length);
  };
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      let cur_account = accounts?.[0];
      dispatch(accountLinked(cur_account));
    } catch (err) {
      console.warn(`failed to connect..`, err);
    }
  };

  const handleConfirmDisconnect = async () => {
    try {
      await sdk?.disconnect();
      dispatch(accountUnlinked(currentAccount.account_id));
    } catch (err) {
      console.warn(`failed to disconnect..`, err);
    } finally {
      setOpen(false);
    }
  };

  const handleDisconnectClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Container disableGutters>
      <div className="nav">
        <div className="nav__group1">
          <div className="nav__image-container">
            <RouterLink to="/" className="nav__link">
              <img className="nav__icon" src={logo} alt="navicon" href="/" />
            </RouterLink>
            <Typography variant="h6">Dutch Lab</Typography>
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
              <Button onClick={handleDisconnectClick}>{mask(currentAccount.account_id)}</Button>
            )}
          </div>
        </div>
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="confirm-disconnect-dialog"
          aria-describedby="confirm-disconnect-description"
        >
          <DialogTitle id="confirm-disconnect-dialog">Confirm Disconnect</DialogTitle>
          <DialogContent>
            <DialogContentText id="confirm-disconnect-description">
              Are you sure you want to disconnect your account?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirmDisconnect} color="primary" autoFocus>
              Disconnect
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Container>
  );
};

export default Nav;
