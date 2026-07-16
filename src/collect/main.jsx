import React from 'react';
import ReactDOM from 'react-dom/client';
import CollectApp from './CollectApp.jsx';
import '../styles/tokens.css';
import '../styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CollectApp />
  </React.StrictMode>
);
