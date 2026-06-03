export function formatSupply(rawSupply: string, decimals: number): string {
  try {
    const supply = BigInt(rawSupply)

    if (decimals === 0) {
      return supply.toLocaleString('en-US')
    }

    const divisor = 10n ** BigInt(decimals)
    const whole = supply / divisor
    const fraction = supply % divisor
    const fractionStr = fraction
      .toString()
      .padStart(decimals, '0')
      .replace(/0+$/, '')

    const wholeFormatted = whole.toLocaleString('en-US')

    return fractionStr
      ? `${wholeFormatted}.${fractionStr}`
      : wholeFormatted
  } catch {
    return rawSupply
  }
}
