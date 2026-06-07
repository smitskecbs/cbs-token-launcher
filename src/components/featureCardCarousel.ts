export function renderFeatureCardCarousel(
  cardsHtml: string,
  options: { variant?: 'default' | 'stats' | 'cards' } = {},
): string {
  const variantClass =
    options.variant === 'stats'
      ? ' feature-card-carousel--stats'
      : options.variant === 'cards'
        ? ' feature-card-carousel--cards'
        : ''

  return `
    <div class="feature-card-carousel${variantClass}">
      <p class="feature-card-carousel__hint">Swipe to explore</p>
      <div class="feature-card-carousel__track">
        ${cardsHtml}
      </div>
    </div>
  `
}
