import React, { useState } from 'react';
import './App.css';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import Home from './components/Home';
import Nav from './components/Nav';
import AuctionPage from './components/AuctionPage';
import CreateAuctionModal from './components/CreateAuction';

import { accountLinked } from './actions/accountActions';

function App() {
  const [openModal, setOpenModal] = useState(false);
  const dispatch = useDispatch();

  window.ethereum.on('accountsChanged', (accounts) => {
    let cur_account = accounts?.[0];
    dispatch(accountLinked(cur_account));
    // Reload current page
    window.location.reload();
  });

  window.ethereum.on('chainChanged', (chainId) => {
    console.log(chainId);
    window.location.reload();
  });

  return (
    <HashRouter>
      <Nav openModal={openModal} handleOpenModal={() => setOpenModal(true)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auctions/:auctionID" element={<AuctionPage />} />
      </Routes>
      <CreateAuctionModal openModal={openModal} handleCloseModal={() => setOpenModal(false)} />
    </HashRouter>
  );
}

export default App;
