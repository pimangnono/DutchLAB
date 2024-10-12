import React, { useState } from 'react';
import { Grid, TextField, Button, Paper, Modal, Typography } from '@mui/material';

import DutchAuctionFactory from '../abis/DutchAuctionFactory.json';
import TokenFactory from '../abis/TokenFactory.json';
import {
  getDutchAuctionFactoryContract,
  getTokenFactoryContract,
  getTokenContract,
  decodeTransctionLogs,
  exportTokenToMetaMask,
} from '../utils/contract';
import { modalStyle, modalContainterStyle } from './css/createAuction';
import { useNavigate } from 'react-router-dom';
import { convertEthToWei } from '../utils/utils';

const CreateAuctionModal = (props) => {
  const navigate = useNavigate();
  const { openModal, handleCloseModal } = props;
  const [formData, setFormData] = useState({
    tokenName: '',
    tokenTicker: '',
    tokenQty: '',
    startingPrice: '',
    discountRate: '',
  });
  const [enableDeployToken, setEnableDeployToken] = useState(false);

  const handleFormChange = (e) => {
    let { name, value } = e.target;
    let newFormData = { ...formData };
    newFormData[name] = value;
    setFormData(newFormData);
  };

  function resetFormData() {
    setFormData({
      tokenName: '',
      tokenTicker: '',
      tokenQty: '',
      startingPrice: '',
      discountRate: '',
    });
    setEnableDeployToken(false);
  }

  // Contract related functions
  const dutchAuctionFactoryContract = getDutchAuctionFactoryContract();
  const tokenFactoryContract = getTokenFactoryContract();

  async function deployToken() {
    const name = formData.tokenName;
    const ticker = formData.tokenTicker;
    let tokenQty = formData.tokenQty;
    if (!tokenQty || !name || !ticker) {
      alert('Please fill up all required fields first');
      return;
    }
    if (tokenQty <= 0) {
      alert('Token quantity has to be more than 0!');
      return;
    }
    tokenQty = convertEthToWei(formData.tokenQty);
    const deployTokenTX = await tokenFactoryContract.deployToken(name, ticker, tokenQty);
    const rc = await deployTokenTX.wait();
    const rcLogs = decodeTransctionLogs(TokenFactory, rc.logs);
    const tokenAdd = rcLogs[0].events.find((e) => e.name === 'tokenAddress').value;
    exportTokenToMetaMask(tokenAdd, ticker);
    setEnableDeployToken(false);
    return tokenAdd;
  }

  async function isTokenExist(name, ticker) {
    const tokenCount = await tokenFactoryContract.tokenCount();
    const tokenCountInt = parseInt(tokenCount._hex);
    for (let i = 0; i < tokenCountInt; i++) {
      const tokenAdd = await tokenFactoryContract.tokens(i);
      const tokenContract = getTokenContract(tokenAdd);
      const tokenName = await tokenContract.name();
      const tokenTicker = await tokenContract.symbol();
      if (tokenName === name && tokenTicker === ticker) {
        return { isExist: true, tokenAdd: tokenAdd };
      }
    }
    return { isExist: false, tokenAdd: null };
  }

  async function createAuction() {
    const { tokenName, tokenTicker, tokenQty, startingPrice, discountRate } = formData;
    const { isExist, tokenAdd } = await isTokenExist(tokenName, tokenTicker);
    if (!isExist) {
      setEnableDeployToken(true);
      return;
    }
    if (!tokenName || !tokenTicker || !tokenQty || !startingPrice || !discountRate) {
      alert('Please fill up all required fields');
      return;
    }
    if (tokenQty <= 0) {
      alert('Token quantity has to be more than 0!');
      return;
    }
    if (startingPrice < discountRate * 60 * 20) {
      alert('Starting price has to be higher to cover discount rate over 20 minutes!');
      return;
    }
    console.log(convertEthToWei(tokenQty));
    const deployAuctionTx = await dutchAuctionFactoryContract.deployAuction(
      tokenAdd,
      convertEthToWei(tokenQty),
      convertEthToWei(startingPrice),
      convertEthToWei(discountRate),
    );
    const rc = await deployAuctionTx.wait();
    const rcLogs = decodeTransctionLogs(DutchAuctionFactory, rc.logs);
    const auctionAdd = rcLogs[0].events.find((e) => e.name === 'auctionAddress').value;

    const tokenContract = getTokenContract(tokenAdd);
    const approveTx = await tokenContract.approve(auctionAdd, convertEthToWei(tokenQty));
    await approveTx.wait();
    handleCloseModal();
    resetFormData();
    navigate(`/auctions/${auctionAdd}`);
  }

  return (
    <Modal
      open={openModal}
      onClose={handleCloseModal}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      closeAfterTransition
      sx={modalContainterStyle}
    >
      <Paper sx={modalStyle}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Token Name"
              name="tokenName"
              value={formData.tokenName}
              onChange={handleFormChange}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Token Ticker"
              name="tokenTicker"
              value={formData.tokenTicker}
              onChange={handleFormChange}
              required
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Token Quantity"
              name="tokenQty"
              type="number"
              value={formData.tokenQty}
              onChange={handleFormChange}
              inputProps={{
                min: 10,
              }}
              required
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Starting Price (ETH)"
              name="startingPrice"
              type="number"
              value={formData.startingPrice}
              onChange={handleFormChange}
              inputProps={{
                min: 10,
              }}
              required
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Discount Rate (ETH)"
              name="discountRate"
              type="number"
              value={formData.discountRate}
              onChange={handleFormChange}
              inputProps={{
                min: 1,
              }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="red">
              {!enableDeployToken ? '' : 'Token not found! Please deploy the token first!'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              sx={{ float: 'right', marginLeft: '1rem' }}
              onClick={createAuction}
            >
              Create Auction
            </Button>
            <Button
              variant="contained"
              color="warning"
              disabled={!enableDeployToken}
              sx={{ float: 'right' }}
              onClick={deployToken}
            >
              Deploy Token
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Modal>
  );
};

export default CreateAuctionModal;
