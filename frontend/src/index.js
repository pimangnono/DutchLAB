import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { MetaMaskProvider } from '@metamask/sdk-react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Container } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
  palette: {
    mode: 'dark', // Set the theme to dark mode
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#ff4081',
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <MetaMaskProvider
          debug={true}
          sdkOptions={{
            logging: {
              developerMode: true,
            },
            dappMetadata: {
              name: 'Dutch Lab',
              url: window.location.host,
            },
          }}
        >
          <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Container disableGutters>
              <App />
            </Container>
          </ThemeProvider>
        </MetaMaskProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
