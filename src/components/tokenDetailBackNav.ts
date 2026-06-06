/** Prominent back navigation for token detail pages */
export function renderTokenDetailBackNav(): string {
  return `
    <a
      class="token-detail-back-nav"
      href="/"
      data-router-link
      aria-label="Back to CBS Token Launcher"
    >
      <span class="token-detail-back-nav__icon" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="token-detail-back-nav__text">
        ← Back to CBS Token Launcher
      </span>
    </a>
  `
}
