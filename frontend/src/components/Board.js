import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

// MUI
import {
  Button,
  Box,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

// Styling
import {
  auctionTableStyle,
  boardStyle,
  paginationStyle,
  tableCellStyle,
  tableHeaderStyle,
  tableRowStyle,
} from './css/boardStyle';

// Components
import { getDutchAuctionFactoryContract, getDutchAuctionContract } from '../utils/contract';
import LoadingDisplay from './LoadingDisplay';
import { auctionStatusText, convertUnixTimeToMinutes, convertWeiToEth } from '../utils/utils';

const Board = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState(1);
  const [auncPerPage] = useState(10);
  const [auctions, setAuctions] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setPageNumber(1);
  }, []);

  // Pagination
  let lastAdIndex = pageNumber * auncPerPage;
  let firstAdIndex = lastAdIndex - auncPerPage;
  // Page numbers for buttons
  let pageNumbers = [];
  const num = Math.ceil(auctions.length / auncPerPage);
  if (num === 0) {
    pageNumbers = [1];
  } else {
    for (let i = 1; i <= num; i++) {
      pageNumbers.push(i);
    }
  }

  // When page number button is clicked
  const clickPageNumberButton = (num) => {
    setPageNumber(num);
  };

  const onRowClick = (address) => {
    navigate(`/auctions/${address}`);
  };
  const dutchAuctionFactoryContract = getDutchAuctionFactoryContract();

  useEffect(() => {
    async function getAuctions() {
      const auctionCount = parseInt((await dutchAuctionFactoryContract.auctionCount())._hex);
      let auctions = [];
      for (let i = 0; i < auctionCount; i++) {
        const currentTime = Math.floor(Date.now() / 1000);
        const auction_address = await dutchAuctionFactoryContract.auctions(i);
        const auctionContract = getDutchAuctionContract(auction_address);

        const auctionStatus = await auctionContract.auctionStatusPred(currentTime);
        console.log(auctionStatus);
        const auctionStartPrice = convertWeiToEth(
          ethers.BigNumber.from((await auctionContract.startingPrice())._hex),
        );
        const auctionReservePrice = convertWeiToEth(
          ethers.BigNumber.from((await auctionContract.getReservePrice())._hex),
        );

        let auction = {
          address: auction_address,
          startPrice: auctionStartPrice,
          currentPrice: 'NaN',
          remainingTime: 'NaN',
          status: auctionStatus,
          reservePrice: auctionReservePrice,
        };

        if (auctionStatus == 1) {
          const auctionCurrentPrice = convertWeiToEth(
            ethers.BigNumber.from((await auctionContract.getPrice(currentTime))._hex),
          );
          auction.currentPrice = auctionCurrentPrice;

          const auctionExpireAt = await auctionContract.revealAt();
          const auctionExpireAtInt = parseInt(auctionExpireAt._hex);
          const auctionRemainingTime = Math.max(0, auctionExpireAtInt - currentTime);
          auction.remainingTime = convertUnixTimeToMinutes(auctionRemainingTime);
        }

        auctions.push(auction);
      }
      setAuctions(auctions);
    }
    setLoading(true);

    setInterval(() => {
      setCount(count + 1);
    }, 10000);

    getAuctions();
    setLoading(false);
  }, [count]);

  return loading ? (
    <LoadingDisplay />
  ) : (
    <Box sx={boardStyle}>
      <Box sx={auctionTableStyle}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeaderStyle}>Auction</TableCell>
                <TableCell align="right" sx={tableHeaderStyle}>
                  Status
                </TableCell>
                <TableCell align="right" sx={tableHeaderStyle}>
                  Remaining Time
                </TableCell>
                <TableCell align="right" sx={tableHeaderStyle}>
                  Starting Price (ETH)
                </TableCell>
                <TableCell align="right" sx={tableHeaderStyle}>
                  Current Price (ETH)
                </TableCell>
                <TableCell align="right" sx={tableHeaderStyle}>
                  Reserve Price (ETH)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auctions.slice(firstAdIndex, lastAdIndex).map((auction) => {
                return (
                  <TableRow
                    key={auction.address}
                    sx={tableRowStyle}
                    onClick={() => onRowClick(auction.address)}
                  >
                    <TableCell sx={tableCellStyle}>{auction.address}</TableCell>
                    <TableCell align="right" sx={tableCellStyle}>
                      {auctionStatusText(auction.status)}
                    </TableCell>
                    <TableCell align="right" sx={tableCellStyle}>
                      {auction.remainingTime}
                    </TableCell>
                    <TableCell align="right" sx={tableCellStyle}>
                      {auction.startPrice}
                    </TableCell>
                    <TableCell align="right" sx={tableCellStyle}>
                      {auction.currentPrice}
                    </TableCell>
                    <TableCell align="right" sx={tableCellStyle}>
                      {auction.reservePrice}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box sx={paginationStyle}>
        <ButtonGroup variant="outlined" size="medium">
          <Button disabled={pageNumber === 1} onClick={() => clickPageNumberButton(pageNumber - 1)}>
            Prev
          </Button>
          {pageNumbers.map((num) => {
            return (
              <Button
                key={num}
                disabled={pageNumber === num}
                onClick={() => clickPageNumberButton(num)}
              >
                {num}
              </Button>
            );
          })}
          <Button
            disabled={pageNumber === pageNumbers[pageNumbers.length - 1]}
            onClick={() => clickPageNumberButton(pageNumber + 1)}
          >
            Next
          </Button>
        </ButtonGroup>
      </Box>
    </Box>
  );
};

export default Board;
