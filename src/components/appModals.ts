import {
  attachManageLaunchModal,
  renderManageLaunchModal,
} from './manageLaunchModal'
import {
  attachSubmitLaunchModal,
  renderSubmitLaunchModal,
} from './submitLaunchModal'
import { getLaunchCatalog } from '../services/launchService'

export function renderAppModals(): string {
  return `
    ${renderSubmitLaunchModal()}
    ${renderManageLaunchModal()}
  `
}

export function attachAppModals(onCatalogChange: () => void): void {
  attachSubmitLaunchModal(onCatalogChange, getLaunchCatalog)
  attachManageLaunchModal(onCatalogChange)
}
