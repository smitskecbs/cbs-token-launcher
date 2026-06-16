import {
  attachLaunchProcessModal,
  renderLaunchProcessModal,
} from './launchProcessModal'
import {
  attachManageLaunchModal,
  renderManageLaunchModal,
} from './manageLaunchModal'
import {
  attachCreatePoolModal,
  renderCreatePoolModal,
} from './createPoolModal'
import {
  attachSubmitLaunchModal,
  renderSubmitLaunchModal,
} from './submitLaunchModal'
export function renderAppModals(): string {
  return `
    ${renderSubmitLaunchModal()}
    ${renderManageLaunchModal()}
    ${renderCreatePoolModal()}
    ${renderLaunchProcessModal()}
  `
}

export function attachAppModals(onCatalogChange: () => void): void {
  attachSubmitLaunchModal()
  attachManageLaunchModal(onCatalogChange)
  attachCreatePoolModal()
  attachLaunchProcessModal()
}
