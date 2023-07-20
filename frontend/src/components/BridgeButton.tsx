import { Button, Modal, Steps } from "antd"
import React, { useEffect, useState } from "react"

import {
  useAccountBalance,
  useWallet,
  SuiChainId,
  ErrorCode,
  formatSUI,
  addressEllipsis,
} from "@suiet/wallet-kit";
import { useAccount, useContractWrite, usePublicClient } from "wagmi";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";
import { BCS, getSuiMoveConfig } from "@mysten/bcs";

import ERC20ABI from "../abi/ERC20.json"
import SuiUSDCBridgeABI from "../abi/SuiUSDCBridge.json"
import { keccak256, parseEther } from "viem";
import useMessage from "antd/es/message/useMessage";
import { TransactionBlock } from "@mysten/sui.js";

const USDC_ADDRESS: `0x${string}` = '0x254d06f33bDc5b8ee05b2ea472107E300226659A'
const BRIDGE_ADDRESS: `0x${string}` = '0xEEFbA50a59D4fe84e88F6e1ff7aE11E9e47A6331'

const SUI_PACKAGE_ADDRESS = '0x17980b5cb73f1bf74b2ff98ead3d088e578397217a989b0985463a8e3b8a57f7'
const SUI_AXELAR_ID = '0x27c94b7d77d2c5935b3a325032639063ebddd622063654f757827c3c11feddc3'
const SUI_CHANNEL_ID = '0xf3d04f5458328114108759c73e09212f330632a149a664a01b2e50ff03b5b1bc'
const SUI_GATE_ID = '0x9ff0ca986a094bcd6dfe91ad1a6e9f6bf9ae3e00128edd35e3cc59dda09f9326'

const axelarSdk = new AxelarQueryAPI({
  environment: Environment.TESTNET,
});

// initialize the serializer with default Sui Move configurations
const bcs = new BCS(getSuiMoveConfig());

bcs.registerStructType("UnlockMessage", {
  recipient: BCS.ADDRESS,
  amount: BCS.U64,
  nonce: BCS.U64,
});

export default function BridgeButton({ amount }: { amount: number }) {
  const [ message ] = useMessage();

  const { address } = useAccount();
  const wallet = useWallet();
  const publicClient = usePublicClient();

  const [ showBridgeModal, setShowBridgeModal ] = useState(false);
  const [ step, setStep ] = useState(0)

  const [ isApproveLoading, setIsApproveLoading ] = useState(false)
  const [ isLockLoading, setIsLockLoading ] = useState(false)
  const [ isUnlockLoading, setIsUnlockLoading ] = useState(false)

  const { writeAsync: approveExecute } = useContractWrite({
    address: USDC_ADDRESS,
    abi: ERC20ABI,
    functionName: 'approve',
  })

  const { writeAsync: lockExecute } = useContractWrite({
    address: BRIDGE_ADDRESS,
    abi: SuiUSDCBridgeABI,
    functionName: 'bridge',
  })

  const [ nonce, setNonce ] = useState(0);
  const [ axelarTxHash, setAxelarTxHash ] = useState("");

  async function lock() {
    try {
      setIsLockLoading(true)

      const _nonce = Math.floor(Math.random() * 1000000000000000)
      setNonce(_nonce)
  
      const tx = await lockExecute({
        args: [
          "ethereum-2",
          wallet.address,
          amount * 1000000,
          _nonce,
        ],
        value: parseEther("0.03"),
      });
  
      setAxelarTxHash(tx.hash)
  
      await publicClient.waitForTransactionReceipt({
        hash: tx.hash
      })
  
      setStep(2)
    } catch(err) {
      console.error(err)
      message.error("Failed... Please check if you have enough USDC and gas on goerli and try again")
    } finally {
      setIsLockLoading(false)
    }
  }

  async function approve() {
    try {
      setIsApproveLoading(true)

      const tx = await approveExecute({
        args: [BRIDGE_ADDRESS, amount * 1000000],
      });
      await publicClient.waitForTransactionReceipt({
        hash: tx.hash
      })
  
      setStep(1)
      lock();
    } catch(err) {
      console.error(err)
      message.error("Failed... Please check if you have enough gas on goerli and try again")
    } finally {
      setIsApproveLoading(false)
    }
  }


  function createUnlockTxnBlock() {
    // define a programmable transaction block
    const txb = new TransactionBlock();
  
    // note that this is a devnet contract address
    const contractAddress = SUI_PACKAGE_ADDRESS;
    const contractModule = "messenger";
    const contractMethod = "submit_usdc_message";

    const tokenModule = "chomusdc";
    const tokenMethod = "mint";

    const message = bcs.ser("UnlockMessage", {
      recipient: wallet.address,
      amount: amount * 100,
      nonce: nonce,
    }).toBytes()

    const hash = keccak256(message)
  
    txb.moveCall({
      target: `${contractAddress}::${contractModule}::${contractMethod}`,
      arguments: [
        txb.object(SUI_AXELAR_ID),
        txb.pure(SUI_CHANNEL_ID),
        txb.pure(bcs.ser(BCS.STRING, "ethereum-2").toBytes()),
        txb.pure(bcs.ser(BCS.STRING, address).toBytes()),
        txb.pure(bcs.ser('vector<u8>', message).toBytes())
      ],
    });

    txb.moveCall({
      target: `${contractAddress}::${tokenModule}::${tokenMethod}`,
      arguments: [
        txb.object(SUI_GATE_ID),
        txb.object(SUI_AXELAR_ID),
        txb.pure(bcs.ser('vector<u8>', Uint8Array.from(Buffer.from(hash.substring(2), 'hex'))).toBytes()),
      ],
    });
  
    return txb;
  }

  async function unlock() {
    if (!wallet.connected) {
      message.warning("Please connect to wallet first")
      return;
    }

    try {
      setIsUnlockLoading(true)

      const txb = createUnlockTxnBlock();

      // call the wallet to sign and execute the transaction
      const res = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb as any,
      });
      console.log("USDC unlocked successfully!", res);

      message.success("Successfully bridged USDC from Goerli to SUI")

    } catch (err) {
      console.error(err)
      message.error("Failed... Please check if you have enough SUI gas fee and connected to SUI testnet")
    } finally {
      setIsUnlockLoading(false)
    }
  }

  useEffect(() => {
    if (step == 2) {
      setTimeout(() => setStep(3), 30000)
    } else if (step == 3) {
      setTimeout(() => {
        setStep(4)
        unlock()
      }, 5000)
    }
  }, [step])

  return (
    <div>
      <Button size="large" type="primary" disabled={!address || !wallet} onClick={() => {
        setShowBridgeModal(true)
      }}>
        Bridge
      </Button>

      <Modal title="Bridge" open={showBridgeModal} footer={null} maskClosable={false} onCancel={() => setShowBridgeModal(false)}>
        <Steps
          direction="vertical"
          current={step}
          items={[
            {
              title: 'Approve USDC',
              description: (
                <div>
                  <div>Approve USDC to bridge smart contract</div>
                  <div className="mt-1">
                    <Button type="primary" onClick={() => approve()} disabled={isApproveLoading || step != 0}>
                      Approve
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              title: 'Lock USDC',
              description: (
                <div>
                  <div>Lock USDC on Ethereum Goerli Testnet</div>
                  <div className="mt-1">
                    <Button type="primary" onClick={() => lock()} disabled={isLockLoading || step != 1}>
                      Lock & Bridge
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              title: 'Processing by Axelar',
              description: (
                <div>
                  <div>Axelar validators are validating the transaction</div>
                  {axelarTxHash && step == 2 &&
                    <div className="mt-1">
                      Tx Hash: <a className="underline hover:underline" href={"https://testnet.axelarscan.io/gmp/" + axelarTxHash} target="_blank">0xeaba3c65364255774cac33d7538fd07d008d515cc008184f5d99ecadaac6b9a4</a>
                    </div>
                  }
                </div>
              ),
            },
            {
              title: 'Approving on Sui chain',
              description: 'Axelar relayer approve message on Sui chain',
            },
            {
              title: 'Unlock USDC on Sui chain',
              description: (
                <div>
                  <div>Execute command on the move contract to unlock USDC</div>
                  <div className="mt-1">
                    <Button type="primary" onClick={() => unlock()} disabled={isUnlockLoading || step != 4}>
                      Unlock
                    </Button>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  )
}