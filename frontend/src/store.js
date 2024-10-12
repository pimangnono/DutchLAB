import { combineReducers } from 'redux';
import { configureStore } from '@reduxjs/toolkit';
import { accountsReducer } from './reducers/accountReducer';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Create a persist configuration
const persistConfig = {
  key: 'root',
  storage,
};

const rootReducer = combineReducers({
  accountsState: accountsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({ reducer: persistedReducer });
export const persistor = persistStore(store);
