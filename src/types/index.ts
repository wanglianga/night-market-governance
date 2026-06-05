export type LicenseStatus = 'complete' | 'incomplete' | 'expired'
export type GasCylinderStatus = 'safe' | 'warning' | 'danger'
export type AuditStatus = 'pending' | 'approved' | 'rejected'
export type RectificationStatus = 'pending' | 'in_progress' | 'completed'
export type ComplaintStatus = 'pending' | 'processing' | 'resolved'
export type RoadOccupationLevel = 'none' | 'slight' | 'moderate' | 'severe'

export interface Stall {
  id: string
  name: string
  vendorName: string
  vendorIdCard: string
  category: string
  licenseStatus: LicenseStatus
  gasCylinderStatus: GasCylinderStatus
  businessHours: string
  position: string
  auditStatus: AuditStatus
  createdAt: string
}

export interface Complaint {
  id: string
  stallId: string
  content: string
  recordingUrl: string
  recordingDuration: number
  recordingCaller: string
  status: ComplaintStatus
  repeatCount: number
  createdAt: string
  resolvedAt: string
}

export interface Inspection {
  id: string
  stallId: string
  oilFumeValue: number
  roadOccupation: RoadOccupationLevel
  noiseLevel: number
  photos: string[]
  createdAt: string
}

export interface Rectification {
  id: string
  stallId: string
  beforePhotos: string[]
  afterPhotos: string[]
  status: RectificationStatus
  description: string
  createdAt: string
  completedAt: string
}

export type UserRole = 'street_staff' | 'inspector'

export type WorkTab = 'stalls' | 'complaints' | 'inspection' | 'rectification' | 'lottery'

export type ExcludeReason =
  | 'license_expired'
  | 'license_incomplete'
  | 'gas_danger'
  | 'violation_exceeded'
  | 'high_fume_sensitive_area'

export interface LotteryApplicant {
  id: string
  name: string
  vendorName: string
  vendorIdCard: string
  category: string
  licenseStatus: LicenseStatus
  gasCylinderStatus: GasCylinderStatus
  violationCount: number
  isHighFumeCategory: boolean
  nearResidentialArea: boolean
  appliedAt: string
}

export interface AssignedStall {
  applicantId: string
  position: string
  row: string
  col: number
  nearResidential: boolean
}

export interface LotteryResult {
  id: string
  drawAt: string
  drawnBy: string
  selected: AssignedStall[]
  waitlist: LotteryApplicant[]
  excluded: {
    applicant: LotteryApplicant
    reason: ExcludeReason
  }[]
  adjustments: LotteryAdjustment[]
}

export interface LotteryAdjustment {
  id: string
  applicantId: string
  fromPosition: string
  toPosition: string
  reason: string
  staffName: string
  adjustedAt: string
}

export interface Appeal {
  id: string
  applicantId: string
  applicantName: string
  reason: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
  reviewNote?: string
}

export interface StallPositionInfo {
  position: string
  row: string
  col: number
  nearResidential: boolean
  occupied: boolean
  category?: string
}
