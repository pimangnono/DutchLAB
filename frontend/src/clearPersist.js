const storage = require('redux-persist/lib/storage'); // defaults to localStorage for web

storage.default.removeItem('persist:root').then(() => {
  console.log('Persisted state has been removed');
});
