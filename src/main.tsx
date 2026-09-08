/**
 * @team     ops
 * @owner    ops-lead
 * @public   no
 * @updated  2026-09-08
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
