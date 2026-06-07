export function renderFeatureCardCarousel(cardsHtml: string): string {
  return `
    <div class="feature-card-carousel">
      <p class="feature-card-carousel__hint">Swipe to explore</p>
      <div class="feature-card-carousel__track">
        ${cardsHtml}
      </div>
    </div>
  `
}
