import { escapeHtml } from '../utils/html'

/** Shared trading/pool/liquidity/pair/price fields for cards and detail pages */
export function renderMarketStatusFields(options: {
  tradingStatus: string
  poolStatus: string
  rowClass?: string
}): string {
  const tradingStatus = escapeHtml(options.tradingStatus)
  const poolStatus = escapeHtml(options.poolStatus)
  const rowClass = options.rowClass ?? 'launch-info-row'

  return `
    <div class="${rowClass}">
      <dt>Trading</dt>
      <dd data-market-trading-status>${tradingStatus}</dd>
    </div>
    <div class="${rowClass}">
      <dt>Pool</dt>
      <dd data-market-pool-status>${poolStatus}</dd>
    </div>
    <div class="${rowClass}">
      <dt>Price</dt>
      <dd data-market-price>—</dd>
    </div>
    <div class="${rowClass}">
      <dt>Liquidity</dt>
      <dd data-market-liquidity>—</dd>
    </div>
    <div class="${rowClass}">
      <dt>Main Pair</dt>
      <dd class="market-pair-value" data-market-pair>—</dd>
    </div>
  `
}
