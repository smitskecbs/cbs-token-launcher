import { getCurrentRoute } from '../router'
import { renderRoute } from './renderRoute'

/** Re-render the current route after local launch catalog changes */
export function handleCatalogChange(): void {
  renderRoute(getCurrentRoute())
}
