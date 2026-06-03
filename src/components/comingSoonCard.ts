/** Empty state when no upcoming launches are in the catalog */
export function renderComingSoonCard(): string {
  return `
    <article class="launch-card launch-card--placeholder">
      <div class="coming-soon-icon" aria-hidden="true">⏳</div>
      <h3>Coming Soon</h3>
      <p class="coming-soon-text">
        New CBS token launches will appear here.
        Check back for the next featured project.
      </p>
    </article>
  `
}
