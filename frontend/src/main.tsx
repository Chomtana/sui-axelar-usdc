import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import "@rainbow-me/rainbowkit/styles.css";

import './preflight.css'
import './index.css'

import {
  getDefaultWallets,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { goerli } from "viem/chains";

import { WalletProvider as SuiWalletProvider } from "@suiet/wallet-kit";
import { publicProvider } from 'wagmi/providers/public';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AntdAlertProvider } from './antd-alert.tsx';

const chain_configs = [goerli]

const { chains, publicClient } = configureChains(
  chain_configs as any,
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: ".town by Opti.Domains",
  projectId: "dd2a5d8744a5d72247899ef644bf8e1e",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <SuiWalletProvider autoConnect={true}>
          <AntdAlertProvider>
            <RouterProvider router={router} />
          </AntdAlertProvider>
        </SuiWalletProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>,
)
