import { useState } from 'react'

import ethLogo from './assets/eth.png'
import suiLogo from './assets/sui.png'
import { Button, Input } from 'antd'
import BridgeButton from './components/BridgeButton';

import {
  ConnectButton as SuiConnectButton,
} from "@suiet/wallet-kit";
import '@suiet/wallet-kit/style.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function App() {
  const [ amountStr, setAmount ] = useState("");

  return (
    <div className='p-4 max-w-2xl m-auto'>
      <div className='mb-10 mt-6'>
        <div className='text-center text-2xl mb-3'>
          Sui Axelar USDC Bridge
        </div>

        <div className='text-center'>
          <a className='underline' href='https://community.axelar.network/t/does-axelar-have-a-testnet-faucet-for-developers/2295' target='_blank'>
            Click here for USDC faucet
          </a>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 relative mb-10 gap-6'>
        {/* Source Chain */}
        <div className='flex flex-col items-center'>
          <div className='text-xl mb-1'>
            From
          </div>

          <div className='text-xl mb-2'>
            Ethereum
          </div>

          <div className='mb-4'>
            <img src={ethLogo} className='rounded-full' style={{width: 64}}></img>
          </div>

          <div className='mb-2'>
            <Input 
              size="large" 
              placeholder="Bridge amount" 
              suffix="USDC"
              value={amountStr}
              onChange={(e: any) => setAmount(e.target.value)}
            />
          </div>

          <div>
            Balance: 500 USDC
          </div>
        </div>

        {/* Destination Chain */}
        <div className='flex flex-col items-center'>
          <div className='text-xl mb-1'>
            To
          </div>

          <div className='text-xl mb-2'>
            Sui
          </div>

          <div className='mb-4'>
            <img src={suiLogo} className='rounded-full' style={{width: 64}}></img>
          </div>

          <div className='text-xl mt-2 mb-3'>
            {amountStr} USDC
          </div>

          <div>
            Balance: 500 USDC
          </div>
        </div>
      </div>

      <div className='text-center mb-2'>
        Connect both wallets to bridge
      </div>

      <div className='flex flex-col md:flex-row items-center justify-center mb-2'>
        <div className='m-2'>
          <ConnectButton />
        </div>

        <div className='m-2'>
          <SuiConnectButton />
        </div>
      </div>

      <div className='flex justify-center mb-6'>
        <BridgeButton></BridgeButton>
      </div>
    </div>
  )
}

export default App
