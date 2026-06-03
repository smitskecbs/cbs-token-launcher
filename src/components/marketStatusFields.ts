import { escapeHtml } from '../utils/html'

/** Market fields for token detail pages */
export function renderTokenDetailMarketFields(options: {
  tradingStatus: string
}): string {
  const tradingStatus = escapeHtml(options.tradingStatus)

  return `
    <div class="token-detail-row">
      <dt>Price</dt>
      <dd data-market-price>—</dd>
    </div>
    <div class="token-detail-row">
      <dt>Liquidity</dt>
      <dd data-market-liquidity>—</dd>
    </div>
    <div class="token-detail-row token-detail-row--full">
      <dt>Pair</dt>
      <dd class="market-pair-value" data-market-pair>—</dd>
    </div>
    <div class="token-detail-row">
      <dt>Trading Status</dt>
      <dd data-market-trading-status>${tradingStatus}</dd>
    </div>
  `
}

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
