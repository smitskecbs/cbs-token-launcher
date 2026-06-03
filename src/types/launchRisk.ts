export type LaunchRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type LaunchRiskCheckKind = 'positive' | 'warning'

export interface LaunchRiskCheck {
  id: string
  label: string
  kind: LaunchRiskCheckKind
  /** For positive checks: true = pass. For warnings: true = risk factor active */
  triggered: boolean
}

export interface LaunchRiskAssessment {
  riskLevel: LaunchRiskLevel | null
  positiveChecks: LaunchRiskCheck[]
  warningChecks: LaunchRiskCheck[]
  loaded: boolean
}
