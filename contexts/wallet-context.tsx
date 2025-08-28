"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { ethers } from "ethers";
import { connectWallet, validateNetwork } from "@/lib/web3";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  loading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [loading, setLoading] = useState(false);

  const connect = async () => {
    setLoading(true);
    try {
      const { provider, signer, address } = await connectWallet();

      const networkValidation = await validateNetwork(provider);
      if (!networkValidation.isValid) {
        throw new Error(networkValidation.error);
      }

      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setIsConnected(true);
      localStorage.setItem("walletConnected", "true");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error; // Re-throw to let components handle the error display
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setProvider(null);
    setSigner(null);
    localStorage.removeItem("walletConnected");
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (
        typeof window.ethereum !== "undefined" &&
        localStorage.getItem("walletConnected")
      ) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            await connect();
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      const ethereum = window.ethereum;

      if (ethereum.on) {
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length === 0) {
            disconnect();
          } else {
            connect();
          }
        };

        const handleChainChanged = () => {
          window.location.reload();
        };

        ethereum.on("accountsChanged", handleAccountsChanged);
        ethereum.on("chainChanged", handleChainChanged);

        // Cleanup function
        return () => {
          if (ethereum.removeListener) {
            ethereum.removeListener("accountsChanged", handleAccountsChanged);
            ethereum.removeListener("chainChanged", handleChainChanged);
          }
        };
      }
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        provider,
        signer,
        connect,
        disconnect,
        loading,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

// Type definitions (keep these as they are)
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: Array<any> }) => Promise<any>;
  on?: (eventName: string, callback: (...args: any[]) => void) => void;
  removeListener?: (
    eventName: string,
    callback: (...args: any[]) => void
  ) => void;
}

interface Window {
  ethereum?: EthereumProvider;
}
