import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0x19750220d9639bCA977A03e1f310CF24B307dEb5";

export const CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "applicationId",
        type: "uint256",
      },
    ],
    name: "ApplicationApproved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "applicationId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "propertyId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "tenant",
        type: "address",
      },
    ],
    name: "ApplicationSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "applicationId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "tenant",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "PaymentMade",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "propertyId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "landlord",
        type: "address",
      },
    ],
    name: "PropertyListed",
    type: "event",
  },
  {
    inputs: [],
    name: "applicationCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "applications",
    outputs: [
      { internalType: "uint256", name: "propertyId", type: "uint256" },
      { internalType: "address", name: "tenant", type: "address" },
      { internalType: "uint256", name: "duration", type: "uint256" },
      { internalType: "uint256", name: "totalAmount", type: "uint256" },
      { internalType: "bool", name: "isApproved", type: "bool" },
      { internalType: "bool", name: "isPaid", type: "bool" },
      { internalType: "uint256", name: "applicationTime", type: "uint256" },
      { internalType: "string", name: "tenantName", type: "string" },
      { internalType: "string", name: "tenantEmail", type: "string" },
      { internalType: "string", name: "tenantPhone", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_applicationId", type: "uint256" },
    ],
    name: "approveApplication",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllProperties",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "landlord", type: "address" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "uint256", name: "pricePerMonth", type: "uint256" },
          { internalType: "bool", name: "isAvailable", type: "bool" },
          { internalType: "string", name: "imageUrl", type: "string" },
          { internalType: "string", name: "location", type: "string" },
        ],
        internalType: "struct PropertyRental.Property[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_applicationId", type: "uint256" },
    ],
    name: "getApplication",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "propertyId", type: "uint256" },
          { internalType: "address", name: "tenant", type: "address" },
          { internalType: "uint256", name: "duration", type: "uint256" },
          { internalType: "uint256", name: "totalAmount", type: "uint256" },
          { internalType: "bool", name: "isApproved", type: "bool" },
          { internalType: "bool", name: "isPaid", type: "bool" },
          { internalType: "uint256", name: "applicationTime", type: "uint256" },
          { internalType: "string", name: "tenantName", type: "string" },
          { internalType: "string", name: "tenantEmail", type: "string" },
          { internalType: "string", name: "tenantPhone", type: "string" },
        ],
        internalType: "struct PropertyRental.RentalApplication",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_landlord", type: "address" }],
    name: "getLandlordProperties",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_propertyId", type: "uint256" }],
    name: "getProperty",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "landlord", type: "address" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "uint256", name: "pricePerMonth", type: "uint256" },
          { internalType: "bool", name: "isAvailable", type: "bool" },
          { internalType: "string", name: "imageUrl", type: "string" },
          { internalType: "string", name: "location", type: "string" },
        ],
        internalType: "struct PropertyRental.Property",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_propertyId", type: "uint256" }],
    name: "getPropertyPayments",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "applicationId", type: "uint256" },
          { internalType: "address", name: "tenant", type: "address" },
          { internalType: "address", name: "landlord", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "string", name: "transactionHash", type: "string" },
        ],
        internalType: "struct PropertyRental.Payment[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_tenant", type: "address" }],
    name: "getTenantApplications",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "landlordProperties",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "uint256", name: "_pricePerMonth", type: "uint256" },
      { internalType: "string", name: "_imageUrl", type: "string" },
      { internalType: "string", name: "_location", type: "string" },
    ],
    name: "listProperty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_applicationId", type: "uint256" },
    ],
    name: "makePayment",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "properties",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "landlord", type: "address" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint256", name: "pricePerMonth", type: "uint256" },
      { internalType: "bool", name: "isAvailable", type: "bool" },
      { internalType: "string", name: "imageUrl", type: "string" },
      { internalType: "string", name: "location", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "propertyCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "propertyPayments",
    outputs: [
      { internalType: "uint256", name: "applicationId", type: "uint256" },
      { internalType: "address", name: "tenant", type: "address" },
      { internalType: "address", name: "landlord", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "string", name: "transactionHash", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_propertyId", type: "uint256" },
      { internalType: "uint256", name: "_duration", type: "uint256" },
      { internalType: "string", name: "_tenantName", type: "string" },
      { internalType: "string", name: "_tenantEmail", type: "string" },
      { internalType: "string", name: "_tenantPhone", type: "string" },
    ],
    name: "submitApplication",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "tenantApplications",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export const SEPOLIA_CHAIN_ID = "0x" + Number.parseInt("11155111").toString(16); // Convert to hex format for better compatibility

export async function connectWallet() {
  if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      console.log("[v0] Current network:", currentChainId);
      console.log("[v0] Target network:", SEPOLIA_CHAIN_ID);

      // Switch to Sepolia network with better error handling
      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        console.log("[v0] Switching to Sepolia testnet...");
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
          console.log("[v0] Successfully switched to Sepolia");
        } catch (switchError: any) {
          console.log(
            "[v0] Switch failed, attempting to add network:",
            switchError.code
          );
          if (switchError.code === 4902) {
            // Network not added to wallet
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: SEPOLIA_CHAIN_ID,
                  chainName: "Sepolia Test Network",
                  nativeCurrency: {
                    name: "SepoliaETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["https://sepolia.infura.io/v3/"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                },
              ],
            });
            console.log("[v0] Sepolia network added successfully");
          } else {
            throw new Error(
              `Failed to switch to Sepolia testnet. Please manually switch your MetaMask to Sepolia Test Network. Error: ${switchError.message}`
            );
          }
        }

        const newChainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        if (newChainId !== SEPOLIA_CHAIN_ID) {
          throw new Error(
            "Failed to switch to Sepolia testnet. Please manually switch your MetaMask to Sepolia Test Network."
          );
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const network = await provider.getNetwork();
      console.log(
        "[v0] Connected to network:",
        network.name,
        "Chain ID:",
        network.chainId.toString()
      );

      if (network.chainId.toString() !== "11155111") {
        throw new Error(
          `Wrong network detected. Expected Sepolia (11155111), got ${network.chainId.toString()}`
        );
      }

      return { provider, signer, address };
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  } else {
    throw new Error("MetaMask is not installed");
  }
}

export async function validateNetwork(
  provider: ethers.BrowserProvider
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();

    console.log(
      "[v0] Validating network - Current:",
      chainId,
      "Expected: 11155111"
    );

    if (chainId !== "11155111") {
      return {
        isValid: false,
        error: `Wrong network. Please switch to Sepolia Test Network. Current: ${
          network.name || chainId
        }`,
      };
    }

    return { isValid: true };
  } catch (error: any) {
    return {
      isValid: false,
      error: `Network validation failed: ${error.message}`,
    };
  }
}

// Utility functions for payment validation and gas estimation
export async function validatePayment(
  signer: ethers.Signer,
  amount: string,
  recipientAddress: string,
  useSmartContract = false,
  applicationId?: number
): Promise<{ isValid: boolean; error?: string; gasEstimate?: bigint }> {
  try {
    const provider = signer.provider;
    if (!provider) {
      return { isValid: false, error: "Provider not available" };
    }

    const networkValidation = await validateNetwork(
      provider as ethers.BrowserProvider
    );
    if (!networkValidation.isValid) {
      return { isValid: false, error: networkValidation.error };
    }

    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const amountWei = ethers.parseEther(amount);

    console.log("[v0] Payment validation started:", {
      amount,
      useSmartContract,
      applicationId,
      balance: ethers.formatEther(balance),
      recipientAddress,
    });

    let gasEstimate: bigint;

    if (useSmartContract && applicationId) {
      try {
        console.log("[v0] Estimating gas for smart contract payment...");
        const contract = getContract(signer);
        gasEstimate = await contract.makePayment.estimateGas(applicationId, {
          value: amountWei,
        });

        // Add 50% buffer for smart contract calls (increased from 20%)
        gasEstimate = gasEstimate + (gasEstimate * BigInt(50)) / BigInt(100);
        console.log(
          "[v0] Smart contract gas estimate (with 50% buffer):",
          gasEstimate.toString()
        );
      } catch (contractError: any) {
        console.log(
          "[v0] Smart contract gas estimation failed:",
          contractError.message
        );
        gasEstimate = BigInt(150000); // Higher base gas for complex operations
        console.log(
          "[v0] Using fallback gas estimate:",
          gasEstimate.toString()
        );
      }
    } else {
      try {
        gasEstimate = await provider.estimateGas({
          to: recipientAddress,
          value: amountWei,
        });
        // Add 20% buffer for direct transfers
        gasEstimate = gasEstimate + (gasEstimate * BigInt(20)) / BigInt(100);
        console.log(
          "[v0] Direct transfer gas estimate (with 20% buffer):",
          gasEstimate.toString()
        );
      } catch (gasError: any) {
        console.log(
          "[v0] Gas estimation failed, using fallback:",
          gasError.message
        );
        gasEstimate = BigInt(21000); // Standard ETH transfer gas
      }
    }

    let gasPrice: bigint;
    try {
      const feeData = await provider.getFeeData();
      gasPrice =
        feeData.gasPrice ||
        feeData.maxFeePerGas ||
        ethers.parseUnits("20", "gwei");
      console.log(
        "[v0] Gas price:",
        ethers.formatUnits(gasPrice, "gwei"),
        "gwei"
      );
    } catch (feeError) {
      console.log("[v0] Fee data fetch failed, using fallback gas price");
      gasPrice = ethers.parseUnits("25", "gwei"); // Higher fallback for testnet
    }

    const gasCost = gasEstimate * gasPrice;
    const totalCost = amountWei + gasCost;

    console.log("[v0] Payment validation details:", {
      amountETH: ethers.formatEther(amountWei),
      gasEstimateETH: ethers.formatEther(gasCost),
      totalCostETH: ethers.formatEther(totalCost),
      balanceETH: ethers.formatEther(balance),
      sufficient: balance >= totalCost,
    });

    if (balance < totalCost) {
      const shortfall = ethers.formatEther(totalCost - balance);
      const currentBalance = ethers.formatEther(balance);

      const errorMessage = `Insufficient balance. Need ${shortfall} more ETH for transaction and gas fees. Current balance: ${currentBalance} ETH. You can get testnet ETH from Sepolia faucet.`;

      console.log("[v0] Payment validation failed:", errorMessage);

      return {
        isValid: false,
        error: errorMessage,
        gasEstimate,
      };
    }

    console.log("[v0] Payment validation successful");
    return { isValid: true, gasEstimate };
  } catch (error: any) {
    console.error("[v0] Error validating payment:", error);
    return {
      isValid: false,
      error: `Payment validation failed: ${error.message || "Unknown error"}`,
    };
  }
}

export function getContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// Smart contract integration functions
export async function listPropertyOnBlockchain(
  signer: ethers.Signer,
  title: string,
  description: string,
  pricePerMonth: string,
  imageUrl: string,
  location: string
): Promise<{ success: boolean; blockchainId?: number; error?: string }> {
  try {
    const contract = getContract(signer);
    const priceInWei = ethers.parseEther(pricePerMonth);

    console.log("[v0] Listing property on blockchain:", {
      title,
      pricePerMonth,
      location,
    });

    const tx = await contract.listProperty(
      title,
      description,
      priceInWei,
      imageUrl,
      location
    );
    const receipt = await tx.wait();

    // Get the property ID from the event
    const propertyListedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "PropertyListed";
      } catch {
        return false;
      }
    });

    if (propertyListedEvent) {
      const parsed = contract.interface.parseLog(propertyListedEvent);
      const blockchainId = Number(parsed?.args?.propertyId || 0);
      console.log(
        "[v0] Property listed successfully with blockchain ID:",
        blockchainId
      );
      return { success: true, blockchainId };
    }

    return { success: false, error: "Failed to get blockchain ID from event" };
  } catch (error: any) {
    console.error("[v0] Error listing property on blockchain:", error);
    return { success: false, error: error.message };
  }
}

export async function submitApplicationOnBlockchain(
  signer: ethers.Signer,
  propertyId: number,
  duration: number,
  tenantName: string,
  tenantEmail: string,
  tenantPhone: string
): Promise<{ success: boolean; blockchainId?: number; error?: string }> {
  try {
    const contract = getContract(signer);

    console.log("[v0] Submitting application on blockchain:", {
      propertyId,
      duration,
      tenantName,
    });

    const tx = await contract.submitApplication(
      propertyId,
      duration,
      tenantName,
      tenantEmail,
      tenantPhone
    );
    const receipt = await tx.wait();

    // Get the application ID from the event
    const applicationSubmittedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "ApplicationSubmitted";
      } catch {
        return false;
      }
    });

    if (applicationSubmittedEvent) {
      const parsed = contract.interface.parseLog(applicationSubmittedEvent);
      const blockchainId = Number(parsed?.args?.applicationId || 0);
      console.log(
        "[v0] Application submitted successfully with blockchain ID:",
        blockchainId
      );
      return { success: true, blockchainId };
    }

    return { success: false, error: "Failed to get blockchain ID from event" };
  } catch (error: any) {
    console.error("[v0] Error submitting application on blockchain:", error);
    return { success: false, error: error.message };
  }
}

export async function approveApplicationOnBlockchain(
  signer: ethers.Signer,
  applicationId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const contract = getContract(signer);

    console.log("[v0] Approving application on blockchain:", applicationId);

    const tx = await contract.approveApplication(applicationId);
    await tx.wait();

    console.log("[v0] Application approved successfully on blockchain");
    return { success: true };
  } catch (error: any) {
    console.error("[v0] Error approving application on blockchain:", error);
    return { success: false, error: error.message };
  }
}

export async function makePaymentOnBlockchain(
  signer: ethers.Signer,
  applicationId: number,
  amount: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const contract = getContract(signer);
    const amountInWei = ethers.parseEther(amount);

    console.log("[v0] Making payment on blockchain:", {
      applicationId,
      amount,
    });

    const tx = await contract.makePayment(applicationId, {
      value: amountInWei,
    });
    const receipt = await tx.wait();

    console.log("[v0] Payment completed successfully on blockchain");
    return { success: true, transactionHash: receipt.hash };
  } catch (error: any) {
    console.error("[v0] Error making payment on blockchain:", error);
    return { success: false, error: error.message };
  }
}

export async function getBlockchainProperty(
  signer: ethers.Signer,
  propertyId: number
) {
  try {
    const contract = getContract(signer);
    const property = await contract.getProperty(propertyId);
    return {
      id: Number(property.id),
      landlord: property.landlord,
      title: property.title,
      description: property.description,
      pricePerMonth: ethers.formatEther(property.pricePerMonth),
      isAvailable: property.isAvailable,
      imageUrl: property.imageUrl,
      location: property.location,
    };
  } catch (error) {
    console.error("[v0] Error getting blockchain property:", error);
    return null;
  }
}

export async function getBlockchainApplication(
  signer: ethers.Signer,
  applicationId: number
) {
  try {
    const contract = getContract(signer);
    const application = await contract.getApplication(applicationId);
    return {
      propertyId: Number(application.propertyId),
      tenant: application.tenant,
      duration: Number(application.duration),
      totalAmount: ethers.formatEther(application.totalAmount),
      isApproved: application.isApproved,
      isPaid: application.isPaid,
      applicationTime: Number(application.applicationTime),
      tenantName: application.tenantName,
      tenantEmail: application.tenantEmail,
      tenantPhone: application.tenantPhone,
    };
  } catch (error) {
    console.error("[v0] Error getting blockchain application:", error);
    return null;
  }
}

// Comprehensive blockchain synchronization functions
export async function syncPropertyToBlockchain(
  signer: ethers.Signer,
  propertyId: string,
  propertyData: {
    title: string;
    description: string;
    pricePerMonth: string;
    imageUrl: string;
    location: string;
  }
): Promise<{
  success: boolean;
  blockchainId?: number;
  transactionHash?: string;
  error?: string;
}> {
  try {
    console.log("[v0] === PROPERTY BLOCKCHAIN SYNC START ===");
    console.log("[v0] Property ID:", propertyId);
    console.log("[v0] Property data:", propertyData);

    // Deploy to blockchain
    const blockchainResult = await listPropertyOnBlockchain(
      signer,
      propertyData.title,
      propertyData.description,
      propertyData.pricePerMonth,
      propertyData.imageUrl,
      propertyData.location
    );

    if (!blockchainResult.success) {
      throw new Error(blockchainResult.error || "Blockchain deployment failed");
    }

    console.log(
      "[v0] Blockchain deployment successful, blockchain ID:",
      blockchainResult.blockchainId
    );

    // Update database with blockchain ID
    const updateResponse = await fetch("/api/properties/blockchain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        property_id: propertyId,
        blockchain_id: blockchainResult.blockchainId,
      }),
    });

    const updateResult = await updateResponse.json();

    if (!updateResult.success) {
      console.warn(
        "[v0] Database update failed but blockchain deployment succeeded"
      );
      return {
        success: true,
        blockchainId: blockchainResult.blockchainId,
        error: "Blockchain deployment successful but database update failed",
      };
    }

    console.log("[v0] === PROPERTY BLOCKCHAIN SYNC SUCCESS ===");
    return {
      success: true,
      blockchainId: blockchainResult.blockchainId,
    };
  } catch (error: any) {
    console.error("[v0] === PROPERTY BLOCKCHAIN SYNC ERROR ===", error);
    return {
      success: false,
      error: error.message || "Unknown error during blockchain sync",
    };
  }
}

export async function syncApplicationToBlockchain(
  signer: ethers.Signer,
  applicationId: string,
  applicationData: {
    propertyBlockchainId: number;
    duration: number;
    tenantName: string;
    tenantEmail: string;
    tenantPhone: string;
  }
): Promise<{
  success: boolean;
  blockchainId?: number;
  transactionHash?: string;
  error?: string;
}> {
  try {
    console.log("[v0] === APPLICATION BLOCKCHAIN SYNC START ===");
    console.log("[v0] Application ID:", applicationId);
    console.log("[v0] Application data:", applicationData);

    // Submit to blockchain
    const blockchainResult = await submitApplicationOnBlockchain(
      signer,
      applicationData.propertyBlockchainId,
      applicationData.duration,
      applicationData.tenantName,
      applicationData.tenantEmail,
      applicationData.tenantPhone
    );

    if (!blockchainResult.success) {
      throw new Error(blockchainResult.error || "Blockchain submission failed");
    }

    console.log(
      "[v0] Blockchain submission successful, blockchain ID:",
      blockchainResult.blockchainId
    );

    // Update database with blockchain ID
    const updateResponse = await fetch("/api/rental-applications/blockchain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        application_id: applicationId,
        blockchain_id: blockchainResult.blockchainId,
      }),
    });

    const updateResult = await updateResponse.json();

    if (!updateResult.success) {
      console.warn(
        "[v0] Database update failed but blockchain submission succeeded"
      );
      return {
        success: true,
        blockchainId: blockchainResult.blockchainId,
        error: "Blockchain submission successful but database update failed",
      };
    }

    console.log("[v0] === APPLICATION BLOCKCHAIN SYNC SUCCESS ===");
    return {
      success: true,
      blockchainId: blockchainResult.blockchainId,
    };
  } catch (error: any) {
    console.error("[v0] === APPLICATION BLOCKCHAIN SYNC ERROR ===", error);
    return {
      success: false,
      error: error.message || "Unknown error during blockchain sync",
    };
  }
}

export async function syncApprovalToBlockchain(
  signer: ethers.Signer,
  applicationBlockchainId: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    console.log("[v0] === APPROVAL BLOCKCHAIN SYNC START ===");
    console.log("[v0] Application blockchain ID:", applicationBlockchainId);

    const result = await approveApplicationOnBlockchain(
      signer,
      applicationBlockchainId
    );

    if (!result.success) {
      throw new Error(result.error || "Blockchain approval failed");
    }

    console.log("[v0] === APPROVAL BLOCKCHAIN SYNC SUCCESS ===");
    return { success: true };
  } catch (error: any) {
    console.error("[v0] === APPROVAL BLOCKCHAIN SYNC ERROR ===", error);
    return {
      success: false,
      error: error.message || "Unknown error during blockchain approval sync",
    };
  }
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[v0] Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.log(`[v0] Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        console.log(`[v0] Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError!;
}
