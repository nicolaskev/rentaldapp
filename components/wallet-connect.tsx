"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { Wallet, LogOut } from "lucide-react"

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletConnect() {
  const { isConnected, address, connect, disconnect, loading } = useWallet()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
        <Button variant="outline" size="sm" onClick={disconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={connect} disabled={loading}>
      <Wallet className="h-4 w-4 mr-2" />
      {loading ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}
