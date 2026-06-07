export function renderFeatureCardCarousel(
  cardsHtml: string,
  options: { variant?: 'default' | 'stats' } = {},
): string {
  const variantClass =
    options.variant === 'stats' ? ' feature-card-carousel--stats' : ''

  return `
    <div class="feature-card-carousel${variantClass}">
      <p class="feature-card-carousel__hint">Swipe to explore</p>
      <div class="feature-card-carousel__track">
        ${cardsHtml}
      </div>
    </div>
  `
}
