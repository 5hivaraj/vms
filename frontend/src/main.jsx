import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadKioskConfig } from './config/kioskConfig';
import { configureApi } from './api/axios';
import { initCapacitorApp } from './capacitorInit';
import './index.css';

const bootstrap = async () => {
  await initCapacitorApp();
  const config = await loadKioskConfig();
  configureApi(config.apiBaseUrl);

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

bootstrap();
