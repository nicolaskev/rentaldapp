"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  Wallet,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { PaymentStatus } from "@/components/payment-status";
import { ethers } from "ethers";
import {
  validatePayment,
  makePaymentOnBlockchain,
  validateNetwork,
} from "@/lib/web3";

interface LeaseAgreement {
  id: string;
  application_id: string;
  tenant_wallet: string;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rent: number;
  monthly_rent_idr: number;
  security_deposit: number;
  security_deposit_idr: number;
  status: string;
  rental_applications: {
    id: string;
    tenant_name: string;
    tenant_email: string;
    tenant_phone: string;
    duration: number;
    total_amount: number;
    total_amount_idr: number;
    is_paid: boolean;
    properties: {
      id: string;
      title: string;
      location: string;
      price_per_month_eth: number;
      landlords: {
        wallet_address: string;
      };
    };
    blockchain_id: number;
  };
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected, signer, provider } = useWallet();
  const [leaseAgreement, setLeaseAgreement] = useState<LeaseAgreement | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "processing" | "completed" | "failed"
  >("pending");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [validationLoading, setValidationLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [networkError, setNetworkError] = useState<string>("");

  const fixedPaymentAmount = leaseAgreement
    ? (
        leaseAgreement.rental_applications.properties.price_per_month_eth *
        leaseAgreement.rental_applications.duration
      ).toFixed(6)
    : "0";

  useEffect(() => {
    if (params.applicationId && address) {
      loadLeaseAgreement();
    }
  }, [params.applicationId, address]);

  useEffect(() => {
    if (isConnected && address && provider) {
      fetchUserBalance();
      validateCurrentNetwork();
    }
  }, [isConnected, address, provider]);

  useEffect(() => {
    if (leaseAgreement && signer && !validationError && !processing) {
      runInitialValidation();
    }
  }, [leaseAgreement, signer]);

  const fetchUserBalance = async () => {
    if (!provider || !address) {
      console.log("[v0] Cannot fetch balance: missing provider or address");
      return;
    }

    try {
      console.log("[v0] Fetching balance for address:", address);
      const balance = await provider.getBalance(address);
      const balanceETH = ethers.formatEther(balance);
      console.log("[v0] Balance fetched successfully:", balanceETH, "ETH");
      setUserBalance(balanceETH);
    } catch (error) {
      console.error("[v0] Error fetching user balance:", error);
      setUserBalance("0");
    }
  };

  const runInitialValidation = async () => {
    if (!signer || !leaseAgreement) return;

    setValidationLoading(true);

    try {
      await validateCurrentNetwork();
      await fetchUserBalance();
      await validatePaymentBeforeSubmit();
    } catch (error) {
      console.error("[v0] Initial validation error:", error);
    } finally {
      setValidationLoading(false);
    }
  };

  const loadLeaseAgreement = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/lease-agreements?application_id=${params.applicationId}`
      );
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const lease = result.data[0];
        setLeaseAgreement(lease);
      } else {
        throw new Error("Lease agreement not found");
      }
    } catch (error) {
      console.error("Error loading lease agreement:", error);
      toast({
        title: "Error",
        description: "Failed to load lease agreement details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePaymentBeforeSubmit = async () => {
    if (!signer || !leaseAgreement) return false;

    console.log("[v0] Starting payment validation...");

    const landlordAddress =
      leaseAgreement.rental_applications.properties.landlords.wallet_address;
    const useSmartContract =
      leaseAgreement.rental_applications.blockchain_id > 0;

    console.log("[v0] Validation parameters:", {
      amount: fixedPaymentAmount,
      landlordAddress,
      useSmartContract,
      blockchainId: leaseAgreement.rental_applications.blockchain_id,
      currentBalance: userBalance,
    });

    try {
      const validation = await validatePayment(
        signer,
        fixedPaymentAmount,
        landlordAddress,
        useSmartContract,
        leaseAgreement.rental_applications.blockchain_id
      );

      if (!validation.isValid) {
        console.log("[v0] Payment validation failed:", validation.error);
        setValidationError(validation.error || "Payment validation failed");
        return false;
      }

      console.log("[v0] Payment validation successful");
      setGasEstimate(validation.gasEstimate || null);
      setValidationError("");
      return true;
    } catch (error: any) {
      console.error("[v0] Payment validation error:", error);
      setValidationError(
        `Validation error: ${error.message || "Unknown error"}`
      );
      return false;
    }
  };

  const validateCurrentNetwork = async () => {
    if (!provider) return;

    try {
      const networkValidation = await validateNetwork(provider);
      if (!networkValidation.isValid) {
        setNetworkError(networkValidation.error || "Wrong network detected");
        console.log("[v0] Network validation failed:", networkValidation.error);
      } else {
        setNetworkError("");
        console.log(
          "[v0] Network validation successful - connected to Sepolia"
        );
      }
    } catch (error: any) {
      console.error("[v0] Network validation error:", error);
      setNetworkError("Failed to validate network connection");
    }
  };

  const handlePayment = async () => {
    if (!signer || !leaseAgreement || !address) return;

    if (networkError) {
      toast({
        title: "Network Error",
        description:
          networkError + " Please switch to Sepolia testnet in MetaMask.",
        variant: "destructive",
      });
      return;
    }

    console.log("[v0] === PAYMENT PROCESS START ===");
    console.log("[v0] Payment details:", {
      amount: fixedPaymentAmount,
      applicationId: leaseAgreement.application_id,
      blockchainId: leaseAgreement.rental_applications.blockchain_id,
      landlordAddress:
        leaseAgreement.rental_applications.properties.landlords.wallet_address,
    });

    const isValid = await validatePaymentBeforeSubmit();
    if (!isValid) {
      console.log("[v0] Payment validation failed, showing error to user");
      toast({
        title: "Payment Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setPaymentStatus("processing");
    setValidationError("");

    try {
      const landlordAddress =
        leaseAgreement.rental_applications.properties.landlords.wallet_address;

      let transactionHash = "";
      let paymentMethod = "direct";

      if (leaseAgreement.rental_applications.blockchain_id > 0) {
        try {
          console.log("[v0] Attempting smart contract payment...");
          const contractResult = await makePaymentOnBlockchain(
            signer,
            leaseAgreement.rental_applications.blockchain_id,
            fixedPaymentAmount
          );

          if (contractResult.success && contractResult.transactionHash) {
            transactionHash = contractResult.transactionHash;
            paymentMethod = "smart_contract";
            console.log(
              "[v0] Smart contract payment successful:",
              transactionHash
            );
          } else {
            throw new Error(
              contractResult.error || "Smart contract payment failed"
            );
          }
        } catch (contractError: any) {
          console.log(
            "[v0] Smart contract payment failed, falling back to direct transfer:",
            contractError.message
          );
        }
      }

      if (!transactionHash) {
        console.log("[v0] Using direct ETH transfer...");
        const amountInWei = ethers.parseEther(fixedPaymentAmount);

        toast({
          title: "Memproses Pembayaran",
          description: "Silakan konfirmasi transaksi di MetaMask...",
        });

        let gasLimit = gasEstimate
          ? gasEstimate + BigInt(10000)
          : BigInt(50000);

        if (gasLimit < BigInt(50000)) {
          gasLimit = BigInt(50000);
        }

        console.log(
          "[v0] Sending transaction with gas limit:",
          gasLimit.toString()
        );

        const tx = await signer.sendTransaction({
          to: landlordAddress,
          value: amountInWei,
          gasLimit: gasLimit,
        });

        setTransactionHash(tx.hash);
        transactionHash = tx.hash;

        console.log("[v0] Transaction sent:", tx.hash);

        toast({
          title: "Transaksi Dikirim",
          description: "Menunggu konfirmasi dari jaringan Sepolia...",
        });

        const receipt = (await Promise.race([
          tx.wait(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Transaction timeout after 5 minutes")),
              300000
            )
          ),
        ])) as any;

        if (!receipt || receipt.status !== 1) {
          throw new Error("Transaction failed or was reverted");
        }

        console.log("[v0] Transaction confirmed:", receipt.hash);
      }

      setPaymentStatus("completed");

      try {
        const transactionResponse = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application_id: leaseAgreement.application_id,
            tenant_wallet: address,
            landlord_wallet: landlordAddress,
            amount_eth: Number.parseFloat(fixedPaymentAmount),
            amount_idr: leaseAgreement.rental_applications.total_amount_idr,
            transaction_hash: transactionHash,
            payment_type: "rent",
            payment_method: paymentMethod,
          }),
        });

        const transactionResult = await transactionResponse.json();

        if (transactionResult.success) {
          console.log("[v0] Transaction recorded successfully in database");
          toast({
            title: "Pembayaran Berhasil!",
            description: `Payment sebesar ${fixedPaymentAmount} ETH telah dikonfirmasi menggunakan ${
              paymentMethod === "smart_contract"
                ? "smart contract"
                : "direct transfer"
            }.`,
          });
        } else {
          console.warn(
            "[v0] Failed to record transaction in database:",
            transactionResult.error
          );
          toast({
            title: "Pembayaran Berhasil!",
            description: `Payment sebesar ${fixedPaymentAmount} ETH telah dikonfirmasi, namun gagal dicatat di database.`,
          });
        }
      } catch (dbError) {
        console.error("[v0] Database recording error:", dbError);
        toast({
          title: "Pembayaran Berhasil!",
          description: `Payment sebesar ${fixedPaymentAmount} ETH telah dikonfirmasi.`,
        });
      }

      console.log("[v0] === PAYMENT PROCESS SUCCESS ===");
    } catch (error: any) {
      console.error("[v0] === PAYMENT PROCESS ERROR ===", error);
      setPaymentStatus("failed");

      let errorMessage = "Terjadi kesalahan saat memproses pembayaran";

      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        errorMessage = "Transaksi dibatalkan oleh user";
      } else if (error.code === "INSUFFICIENT_FUNDS" || error.code === -32000) {
        errorMessage =
          "Saldo ETH tidak mencukupi untuk transaksi dan gas fees. Dapatkan testnet ETH dari Sepolia faucet.";
      } else if (error.message?.includes("gas")) {
        errorMessage =
          "Gas fee tidak mencukupi atau estimasi gas gagal. Coba tingkatkan gas limit di MetaMask.";
      } else if (error.message?.includes("timeout")) {
        errorMessage =
          "Transaksi timeout. Silakan cek status di Etherscan atau coba lagi.";
      } else if (error.message?.includes("network")) {
        errorMessage =
          "Masalah koneksi jaringan. Pastikan Anda terhubung ke Sepolia testnet.";
      } else if (error.message?.includes("nonce")) {
        errorMessage =
          "Masalah nonce transaksi. Silakan reset MetaMask atau coba lagi.";
      } else if (error.message?.includes("reverted")) {
        errorMessage =
          "Transaksi ditolak oleh smart contract. Periksa kondisi pembayaran.";
      }

      toast({
        title: "Pembayaran Gagal",
        description: errorMessage,
        variant: "destructive",
      });

      if (
        retryCount < 2 &&
        (error.message?.includes("network") ||
          error.message?.includes("timeout") ||
          error.code === -32000 ||
          error.message?.includes("gas"))
      ) {
        setRetryCount(retryCount + 1);
        console.log("[v0] Scheduling retry", retryCount + 1, "in 3 seconds");
        setTimeout(() => {
          setPaymentStatus("pending");
          setProcessing(false);
        }, 3000);
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatETH = (amount: number) => {
    return `${amount.toFixed(6)} ETH`;
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Wallet Tidak Terhubung</h1>
          <p className="text-muted-foreground mb-6">
            Silakan hubungkan MetaMask wallet Anda untuk melakukan pembayaran.
          </p>
          <Link href="/">
            <Button>Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!leaseAgreement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Lease Agreement Tidak Ditemukan
          </h1>
          <Link href="/dashboard">
            <Button>Kembali ke Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (leaseAgreement.status !== "approved") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Lease Agreement Belum Disetujui
          </h1>
          <p className="text-muted-foreground mb-4">
            Lease agreement Anda masih menunggu persetujuan dari landlord.
          </p>
          <Link href="/dashboard">
            <Button>Kembali ke Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (leaseAgreement.rental_applications.is_paid) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pembayaran Sudah Selesai</h1>
          <p className="text-muted-foreground mb-4">
            Anda sudah melakukan pembayaran untuk sewa ini.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button>Kembali ke Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Sewa Properti Lain</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pembayaran untuk{" "}
                {leaseAgreement?.rental_applications.properties.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {networkError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-red-900">
                      Network Error
                    </h4>
                  </div>
                  <p className="text-sm text-red-800 mb-3">{networkError}</p>
                  <div className="bg-red-100 p-3 rounded border border-red-200">
                    <p className="text-sm text-red-800 font-medium mb-2">
                      🔧 Cara mengatasi:
                    </p>
                    <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
                      <li>Buka MetaMask wallet Anda</li>
                      <li>Klik dropdown network di bagian atas</li>
                      <li>Pilih "Sepolia Test Network"</li>
                      <li>Refresh halaman ini setelah berganti network</li>
                    </ol>
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={validateCurrentNetwork}
                      disabled={validationLoading}
                    >
                      {validationLoading
                        ? "Checking..."
                        : "🔄 Cek Network Lagi"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Detail Sewa</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Properti</Label>
                    <p className="font-medium">
                      {leaseAgreement?.rental_applications.properties.title}
                    </p>
                  </div>
                  <div>
                    <Label>Lokasi</Label>
                    <p className="font-medium">
                      {leaseAgreement?.rental_applications.properties.location}
                    </p>
                  </div>
                  <div>
                    <Label>Durasi</Label>
                    <p className="font-medium">
                      {leaseAgreement?.rental_applications.duration} bulan
                    </p>
                  </div>
                  <div>
                    <Label>Penyewa</Label>
                    <p className="font-medium">
                      {leaseAgreement?.rental_applications.tenant_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">
                      Jumlah Pembayaran
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-800">
                        Harga per bulan:
                      </span>
                      <span className="font-medium text-blue-900">
                        {formatETH(
                          leaseAgreement?.rental_applications.properties
                            .price_per_month_eth || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-800">Durasi:</span>
                      <span className="font-medium text-blue-900">
                        {leaseAgreement?.rental_applications.duration} bulan
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-blue-900">
                          Total ETH:
                        </span>
                        <span className="text-xl font-bold text-blue-900">
                          {fixedPaymentAmount} ETH
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-blue-800">
                          Setara dengan:
                        </span>
                        <span className="text-sm font-medium text-blue-800">
                          {formatIDR(
                            leaseAgreement?.rental_applications
                              .total_amount_idr || 0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-blue-800">
                          Saldo Anda:
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            Number.parseFloat(userBalance) <
                            Number.parseFloat(fixedPaymentAmount)
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {Number.parseFloat(userBalance).toFixed(6)} ETH
                        </span>
                      </div>
                      {gasEstimate && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-blue-800">
                            Estimasi Gas:
                          </span>
                          <span className="text-sm font-medium text-blue-800">
                            ~{ethers.formatEther(gasEstimate)} ETH
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">
                    ⚠️ Harga Fixed
                  </h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>
                      • Harga ETH untuk properti ini sudah ditetapkan dan tidak
                      dapat diubah
                    </li>
                    <li>
                      • Setiap properti memiliki harga ETH yang berbeda dan unik
                    </li>
                    <li>
                      • Pembayaran harus sesuai dengan jumlah yang tertera
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Informasi Pembayaran
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Pembayaran akan dikirim langsung ke landlord</li>
                    <li>• Transaksi akan dicatat di Sepolia testnet</li>
                    <li>• Pastikan Anda memiliki cukup ETH untuk gas fees</li>
                    <li>• Konfirmasi biasanya memakan waktu 1-2 menit</li>
                  </ul>
                </div>

                {validationError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-red-900">
                        Payment Validation Error
                      </h4>
                    </div>
                    <p className="text-sm text-red-800 mb-3">
                      {validationError}
                    </p>

                    {validationError.includes("Insufficient balance") && (
                      <div className="space-y-3">
                        <div className="bg-red-100 p-3 rounded border border-red-200">
                          <p className="text-sm text-red-800 font-medium mb-2">
                            💡 Cara mengatasi masalah ini:
                          </p>
                          <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
                            <li>
                              Dapatkan testnet ETH gratis dari faucet Sepolia
                            </li>
                            <li>
                              Tunggu beberapa menit hingga ETH masuk ke wallet
                            </li>
                            <li>Refresh halaman ini untuk validasi ulang</li>
                          </ol>
                        </div>

                        <div className="flex gap-2">
                          <a
                            href="https://sepoliafaucet.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                          >
                            🚰 Dapatkan ETH Gratis
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              fetchUserBalance();
                              runInitialValidation();
                            }}
                            disabled={validationLoading}
                          >
                            {validationLoading
                              ? "Validating..."
                              : "🔄 Cek Ulang Saldo"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {validationError.includes("testnet ETH") &&
                      !validationError.includes("Insufficient balance") && (
                        <div className="mt-2">
                          <a
                            href="https://sepoliafaucet.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            → Get free Sepolia ETH from faucet
                          </a>
                        </div>
                      )}
                  </div>
                )}

                {validationLoading && !validationError && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-800">
                        Memvalidasi pembayaran...
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handlePayment}
                  className="w-full"
                  disabled={
                    processing ||
                    !!validationError ||
                    !!networkError ||
                    validationLoading
                  }
                  size="lg"
                >
                  {processing
                    ? "Memproses..."
                    : validationLoading
                    ? "Memvalidasi..."
                    : networkError
                    ? "Network Error - Switch to Sepolia"
                    : retryCount > 0
                    ? `Coba Lagi (${
                        retryCount + 1
                      }/3) - Bayar ${fixedPaymentAmount} ETH`
                    : `Bayar ${fixedPaymentAmount} ETH`}
                </Button>

                {retryCount > 0 && (
                  <p className="text-sm text-center text-muted-foreground">
                    Percobaan ke-{retryCount + 1} dari 3
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <Label>Alamat Wallet Landlord</Label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                  {
                    leaseAgreement?.rental_applications.properties.landlords
                      .wallet_address
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PaymentStatus
            status={paymentStatus}
            transactionHash={transactionHash}
            amount={fixedPaymentAmount}
            currency="ETH"
          />

          {paymentStatus === "completed" && (
            <Card className="bg-green-50 border-green-200 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Pembayaran Berhasil!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-green-800">
                  Selamat! Pembayaran Anda telah berhasil dikonfirmasi. Anda
                  sekarang dapat:
                </p>
                <div className="flex gap-3">
                  <Link href="/dashboard">
                    <Button size="sm">Lihat Dashboard</Button>
                  </Link>
                  <Link href="/">
                    <Button size="sm" variant="outline">
                      Sewa Properti Lain
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentStatus === "pending" && (
            <div className="bg-yellow-50 border-yellow-200 border-2 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">
                Mohon Tunggu
              </h4>
              <p className="text-sm text-yellow-800">
                Pembayaran Anda sedang diproses...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
