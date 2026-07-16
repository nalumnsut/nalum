import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from "@/components/theme-provider";


ReactDOM.createRoot(document.getElementById('root')!).render(
	<BrowserRouter>
		<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
			<App />
		</ThemeProvider>
	</BrowserRouter>

);
