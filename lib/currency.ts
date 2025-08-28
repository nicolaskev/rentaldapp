// Currency conversion utilities
export const ETH_TO_IDR_RATE = 50000000 // 1 ETH = 50,000,000 IDR (example rate)

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ethToIDR(ethAmount: number): number {
  return ethAmount * ETH_TO_IDR_RATE
}

export function idrToETH(idrAmount: number): number {
  return idrAmount / ETH_TO_IDR_RATE
}

export function formatETH(amount: number): string {
  return `${amount.toFixed(6)} ETH`
}

export function weiToETH(weiAmount: string | number): number {
  return Number(weiAmount) / 1e18
}

export function ethToWei(ethAmount: number): string {
  return (ethAmount * 1e18).toString()
}
