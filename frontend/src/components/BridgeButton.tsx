import { Button } from "antd"
import React from "react"

import {
  useAccountBalance,
  useWallet,
  SuiChainId,
  ErrorCode,
  formatSUI,
  addressEllipsis
} from "@suiet/wallet-kit";

export default function BridgeButton() {
  return (
    <div>
      <Button size="large" type="primary">
        Bridge
      </Button>
    </div>
  )
}