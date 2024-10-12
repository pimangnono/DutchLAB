import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ethers } from 'ethers';
// MUI Components
import { Paper, Box, Typography, Divider, TextField, Button, Grid } from '@mui/material';

// Styling
import {
  auctionTitleContainerStyle,
  aunctionContentStyle,
  aunctionInfoAreaStyle,
  auctionLiveInfoStyle,
  bidAreaStyle,
  containerStyle,
  fieldStyle,
  paperStyle,
  headerTextSyle,
} from './css/auctionPage';

import { getDutchAuctionContract, getTokenContract } from '../utils/contract';
import {
  auctionStatusText,
  convertUnixTimeToMinutes,
  convertWeiToEth,
  getCurrentAccount,
} from '../utils/utils';
import LoadingDisplay from './LoadingDisplay';

import { accountBidded, accountRevealed } from '../actions/accountActions';
import {
  createSubmarineContract,
  executeTransaction,
  getSubmarineBalance,
  sendEthertoSubmarine,
} from '../utils/submarine';

const AuctionPage = () => {
  const [loading, setLoading] = useState(true);
  const currentTime = Math.floor(Date.now() / 1000);
  const currentURL = window.location.href;
  const splitParts = currentURL.split('/');
  const auctionAddress = splitParts[splitParts.length - 1];
  const accounts = useSelector((state) => state.accountsState.accounts);
  // console.log(accounts);
  const currentAccount = getCurrentAccount(accounts);
  const currentAccountAddress = currentAccount?.account_id;
  const currentAccountAuctions = currentAccount?.auctionsBidded;

  const dispatch = useDispatch();

  const [auction, setAuction] = useState({
    tokenAdd: '',
    tokenName: '',
    tokenTicker: '',
    sellerAdd: '',
    startedOn: 'NaN',
    tokenQty: '',
    startingPrice: '',
    reservePrice: 'NaN',
    currentPrice: 'NaN',
    placeBidTimeRemaining: 'NaN',
    revealAtTimeRemaining: 'NaN',
    status: 0,
  });
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function getAuctionInfo() {
      const dutchAuctionContract = getDutchAuctionContract(auctionAddress);

      // Token info
      const tokenAdd = await dutchAuctionContract.token();
      const tokenContract = getTokenContract(tokenAdd);
      const tokenName = await tokenContract.name();
      const tokenTicker = await tokenContract.symbol();

      // Auction info
      const seller = await dutchAuctionContract.seller();
      const tokenQty = convertWeiToEth(
        ethers.BigNumber.from(await dutchAuctionContract.tokenQty())._hex,
      );
      const startingPrice = convertWeiToEth(
        ethers.BigNumber.from((await dutchAuctionContract.startingPrice())._hex),
      );

      const reservePrice = convertWeiToEth(
        ethers.BigNumber.from((await dutchAuctionContract.getReservePrice())._hex),
      );

      const auctionStatus = await dutchAuctionContract.auctionStatusPred(currentTime);
      const newAuction = {
        ...auction,
        tokenAdd: tokenAdd,
        tokenName: tokenName,
        tokenTicker: tokenTicker,
        sellerAdd: seller,
        tokenQty: tokenQty,
        startingPrice: startingPrice,
        reservePrice: reservePrice,
        status: auctionStatus,
      };

      if (auctionStatus != 0) {
        const startAt = parseInt((await dutchAuctionContract.startAt())._hex);
        const startedOn = new Date(startAt * 1000).toLocaleString();
        newAuction.startedOn = startedOn;
      }

      if (auctionStatus == 1) {
        const revealAt = parseInt((await dutchAuctionContract.revealAt())._hex);
        const placeBidTimeRemaining = Math.max(revealAt - currentTime, 0);
        newAuction.placeBidTimeRemaining = convertUnixTimeToMinutes(placeBidTimeRemaining);

        const currentPrice = convertWeiToEth(
          ethers.BigNumber.from((await dutchAuctionContract.getPrice(currentTime))._hex),
        );
        newAuction.currentPrice = currentPrice;
      }

      if (auctionStatus === 2) {
        newAuction.currentPrice = reservePrice;
        newAuction.placeBidTimeRemaining = convertUnixTimeToMinutes(0);
        const endAt = parseInt((await dutchAuctionContract.endAt())._hex);
        const revealAtTimeRemaining = Math.max(endAt - currentTime, 0);
        newAuction.revealAtTimeRemaining = convertUnixTimeToMinutes(revealAtTimeRemaining);
      }

      if (auctionStatus === 3) {
        newAuction.revealAtTimeRemaining = convertUnixTimeToMinutes(0);
      }

      setAuction(newAuction);
    }
    setLoading(true);

    setInterval(() => {
      setCount(count + 1);
    }, 10000);

    getAuctionInfo();
    setLoading(false);
  }, [count]);

  const dutchAuctionContract = getDutchAuctionContract(auctionAddress);
  async function startAuction() {
    setLoading(true);
    const startAucTx = await dutchAuctionContract.startAuction();
    await startAucTx.wait();
    setLoading(false);
    window.location.reload();
  }

  const [bidAmount, setBidAmount] = useState();
  async function placeBid() {
    const submarineAddresss = await createSubmarineContract(auction.currentPrice);
    console.log(submarineAddresss);
    dispatch(accountBidded(currentAccountAddress, auctionAddress, submarineAddresss));
    await sendEthertoSubmarine(submarineAddresss, bidAmount);
    const submarineBalance = await getSubmarineBalance(submarineAddresss);
    console.log(submarineBalance);
  }

  async function revealSubmarine() {
    let submarineAddress = '';
    for (const auction of currentAccountAuctions) {
      if (auction.auctionAdd.toLowerCase() === auctionAddress.toLowerCase()) {
        submarineAddress = auction.submarineAdd;
        break;
      }
    }
    if (submarineAddress === '') {
      alert('Submarine address not found!');
      return;
    }
    console.log(submarineAddress);
    await executeTransaction(submarineAddress, auctionAddress);
    const submarineList = await dutchAuctionContract.getSubmarineList();
    console.log(submarineList);
    dispatch(accountRevealed(currentAccountAddress, auctionAddress));
  }

  const [enableBid, setEnableBid] = useState(true);
  const [enableReveal, setEnableReveal] = useState(false);
  const [revealedBid, setRevealedBid] = useState(false);
  useEffect(() => {
    //Loop through currentAccountAuctions to check if currentAccountAddress has bidded;
    let bidded = false;
    let revealed = false;
    console.log(currentAccountAuctions);
    if (currentAccountAuctions) {
      currentAccountAuctions.map((auction) => {
        if (auction.auctionAdd.toLowerCase() == auctionAddress.toLowerCase()) {
          bidded = true;
          if (auction.revealed === true) {
            revealed = true;
            setRevealedBid(true);
          }
        }
      });
    }
    const newEnableBid = Boolean(auction.status == 1 && !bidded && currentAccountAddress);
    const newEnableReveal = Boolean(
      auction.status === 2 && !revealed && currentAccountAddress && bidded,
    );
    setEnableBid(newEnableBid);
    setEnableReveal(newEnableReveal);
  }, [auction, accountBidded, accountRevealed, currentAccountAddress]);

  async function distributeToken() {
    const tokenAdd = await dutchAuctionContract.token();
    const tokenContract = getTokenContract(tokenAdd);
    await dutchAuctionContract.distributeToken();
    const balance = await tokenContract.balanceOf(currentAccountAddress);
    console.log(parseInt(balance._hex));
  }

  return (
    <div>
      {loading ? (
        <LoadingDisplay />
      ) : (
        <Box sx={containerStyle}>
          <Paper sx={paperStyle}>
            <Box sx={auctionTitleContainerStyle}>
              <Typography variant="h4" style={{ marginBottom: '1rem' }}>
                {auction.tokenName} - {auction.tokenTicker}
              </Typography>
              <Typography sx={headerTextSyle}>Seller Address: {auction.sellerAdd}</Typography>
              <Typography sx={headerTextSyle}>Token Address: {auction.tokenAdd}</Typography>
            </Box>
            <Divider variant="middle" flexItem />
            <Box sx={aunctionContentStyle}>
              <Box sx={aunctionInfoAreaStyle}>
                <Grid container>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>Status:</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auctionStatusText(auction.status)}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>Token Quantity ({auction.tokenTicker}):</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.tokenQty}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>
                      Starting Price (ETH/{auction.tokenTicker}):
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.startingPrice}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>
                      Reserve Price (ETH/{auction.tokenTicker}):
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.reservePrice}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider variant="middle" orientation="vertical" flexItem />

              <Box sx={auctionLiveInfoStyle}>
                <Grid container style={{ marginBottom: '3rem' }}>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>Started On:</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.startedOn}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>Place bid time remaining:</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.placeBidTimeRemaining}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>Reveal bid time remaining:</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.revealAtTimeRemaining}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>
                      Current Price (ETH/{auction.tokenTicker}):
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.currentPrice}</Typography>
                  </Grid>
                </Grid>
                <Box sx={bidAreaStyle}>
                  {!(currentAccountAddress == auction.sellerAdd.toLowerCase()) ? (
                    <>
                      {auction.status == 1 || auction.status == 0 ? (
                        <>
                          <TextField
                            label="ETH"
                            size="small"
                            style={{ width: '40%', marginRight: '1rem' }}
                            value={bidAmount}
                            disabled={!enableBid}
                            onChange={(e) => setBidAmount(e.target.value)}
                          />
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={placeBid}
                            disabled={!enableBid}
                            style={{ marginRight: '1rem' }}
                          >
                            Place bid
                          </Button>
                        </>
                      ) : null}
                      {auction.status == 2 ? (
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={revealSubmarine}
                          disabled={!enableReveal}
                        >
                          Reveal
                        </Button>
                      ) : null}
                      {auction.status == 3 || auction.status == 4 ? (
                        <Button
                          variant="contained"
                          color="secondary"
                          disabled={auction.status != 3 || !revealedBid}
                          onClick={distributeToken}
                        >
                          Distribute Token
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={startAuction}
                      disabled={auction.status != 0}
                    >
                      Start Auction
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </div>
  );
};

export default AuctionPage;
