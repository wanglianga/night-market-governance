import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Stall,
  Complaint,
  Inspection,
  Rectification,
  UserRole,
  WorkTab,
  LicenseStatus,
  GasCylinderStatus,
  AuditStatus,
  ComplaintStatus,
  RectificationStatus,
  RoadOccupationLevel,
  LotteryApplicant,
  LotteryResult,
  StallPositionInfo,
  AssignedStall,
  ExcludeReason,
  Appeal,
  LotteryAdjustment,
} from '@/types'
import {
  seedStalls,
  seedComplaints,
  seedInspections,
  seedRectifications,
  seedLotteryApplicants,
  seedStallPositions,
  EXCLUDE_REASON_LABELS,
} from '@/data/seed'

export const useNightMarketStore = defineStore('nightMarket', () => {
  const currentRole = ref<UserRole>('street_staff')
  const activeTab = ref<WorkTab>('stalls')
  const selectedStallId = ref<string | null>(null)
  const selectedComplaintId = ref<string | null>(null)

  const DATA_VERSION = 5

  const stalls = ref<Stall[]>([...seedStalls])
  const complaints = ref<Complaint[]>([...seedComplaints])
  const inspections = ref<Inspection[]>([...seedInspections])
  const rectifications = ref<Rectification[]>([...seedRectifications])
  const lotteryApplicants = ref<LotteryApplicant[]>([...seedLotteryApplicants])
  const stallPositions = ref<StallPositionInfo[]>([...seedStallPositions])
  const lotteryResult = ref<LotteryResult | null>(null)
  const appeals = ref<Appeal[]>([])

  function migrateData() {
    const stored = localStorage.getItem('nightMarket')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      if (parsed._v === DATA_VERSION) return

      const seedComplaintMap = new Map<string, Complaint>(
        seedComplaints.map((c) => [c.id, c]),
      )
      const seedRectMap = new Map<string, Rectification>(
        seedRectifications.map((r) => [r.id, r]),
      )

      if (parsed.complaints) {
        for (const c of parsed.complaints) {
          const seed = seedComplaintMap.get(c.id)
          if (seed) {
            if (!c.recordingUrl && seed.recordingUrl) c.recordingUrl = seed.recordingUrl
            if (c.recordingDuration === undefined) c.recordingDuration = seed.recordingDuration
            if (c.recordingCaller === undefined) c.recordingCaller = seed.recordingCaller
            if (c.category === undefined) c.category = seed.category || 'other'
            if (c.summary === undefined) c.summary = seed.summary || ''
            if (c.callerPhone === undefined) c.callerPhone = seed.callerPhone || ''
            if (c.repeatType === undefined) c.repeatType = seed.repeatType || 'none'
            if (c.assignedInspector === undefined) c.assignedInspector = seed.assignedInspector || ''
            if (c.assignedAt === undefined) c.assignedAt = seed.assignedAt || ''
            if (c.reviewedAt === undefined) c.reviewedAt = seed.reviewedAt || ''
            if (c.residentApproved === undefined) c.residentApproved = seed.residentApproved || null
            if (c.photos === undefined) c.photos = seed.photos || []
            if (c.processingNotes === undefined) c.processingNotes = seed.processingNotes || ''
            if (c.followUpResult === undefined) c.followUpResult = seed.followUpResult || ''
          } else {
            if (c.recordingDuration === undefined) c.recordingDuration = 0
            if (c.recordingCaller === undefined) c.recordingCaller = ''
            if (c.category === undefined) c.category = 'other'
            if (c.summary === undefined) c.summary = ''
            if (c.callerPhone === undefined) c.callerPhone = ''
            if (c.repeatType === undefined) c.repeatType = 'none'
            if (c.assignedInspector === undefined) c.assignedInspector = ''
            if (c.assignedAt === undefined) c.assignedAt = ''
            if (c.reviewedAt === undefined) c.reviewedAt = ''
            if (c.residentApproved === undefined) c.residentApproved = null
            if (c.photos === undefined) c.photos = []
            if (c.processingNotes === undefined) c.processingNotes = ''
            if (c.followUpResult === undefined) c.followUpResult = ''
          }
        }
      }

      if (parsed.rectifications) {
        for (const r of parsed.rectifications) {
          const seed = seedRectMap.get(r.id)
          if (seed) {
            if ((!r.beforePhotos || r.beforePhotos.length === 0) && seed.beforePhotos.length > 0) {
              r.beforePhotos = [...seed.beforePhotos]
            }
            if ((!r.afterPhotos || r.afterPhotos.length === 0) && seed.afterPhotos.length > 0) {
              r.afterPhotos = [...seed.afterPhotos]
            }
          } else {
            if (!r.beforePhotos) r.beforePhotos = []
            if (!r.afterPhotos) r.afterPhotos = []
          }
        }
      }

      parsed._v = DATA_VERSION
      localStorage.setItem('nightMarket', JSON.stringify(parsed))
    } catch {
      localStorage.removeItem('nightMarket')
    }
  }

  migrateData()

  const statLicenseComplete = computed(
    () => stalls.value.filter((s) => s.licenseStatus === 'complete').length,
  )
  const statPendingAudit = computed(
    () => stalls.value.filter((s) => s.auditStatus === 'pending').length,
  )
  const statRectifying = computed(
    () => rectifications.value.filter((r) => r.status === 'in_progress').length,
  )
  const statGasRisk = computed(
    () => stalls.value.filter((s) => s.gasCylinderStatus === 'danger').length,
  )

  const selectedStall = computed(() =>
    stalls.value.find((s) => s.id === selectedStallId.value),
  )
  const selectedComplaint = computed(() =>
    complaints.value.find((c) => c.id === selectedComplaintId.value),
  )

  const stallComplaints = computed(() => {
    if (!selectedStallId.value) return []
    return complaints.value.filter((c) => c.stallId === selectedStallId.value)
  })

  const stallInspections = computed(() => {
    if (!selectedStallId.value) return []
    return inspections.value
      .filter((i) => i.stallId === selectedStallId.value)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  })

  const stallRectifications = computed(() => {
    if (!selectedStallId.value) return []
    return rectifications.value.filter((r) => r.stallId === selectedStallId.value)
  })

  const stallRepeatComplaints = computed(() => {
    if (!selectedStallId.value) return []
    return complaints.value.filter(
      (c) => c.stallId === selectedStallId.value && c.repeatCount >= 2,
    )
  })

  function setRole(role: UserRole) {
    currentRole.value = role
  }

  function setActiveTab(tab: WorkTab) {
    activeTab.value = tab
    selectedStallId.value = null
    selectedComplaintId.value = null
  }

  function selectStall(id: string | null) {
    selectedStallId.value = id
  }

  function selectComplaint(id: string | null) {
    selectedComplaintId.value = id
  }

  function updateStallAudit(id: string, status: AuditStatus) {
    const stall = stalls.value.find((s) => s.id === id)
    if (stall) stall.auditStatus = status
  }

  function assignStallPosition(id: string) {
    const stall = stalls.value.find((s) => s.id === id)
    if (stall) {
      const rows = ['A', 'B', 'C', 'D', 'E']
      const row = rows[Math.floor(Math.random() * rows.length)]
      const num = String(Math.floor(Math.random() * 15) + 1).padStart(2, '0')
      stall.position = `${row}-${num}`
      stall.auditStatus = 'approved'
    }
  }

  function updateComplaintStatus(id: string, status: ComplaintStatus) {
    const complaint = complaints.value.find((c) => c.id === id)
    if (complaint) {
      complaint.status = status
      if (status === 'resolved') {
        complaint.resolvedAt = new Date().toLocaleString('zh-CN')
      }
    }
  }

  function addInspection(data: {
    stallId: string
    oilFumeValue: number
    roadOccupation: RoadOccupationLevel
    noiseLevel: number
  }) {
    inspections.value.push({
      id: `I${String(inspections.value.length + 1).padStart(3, '0')}`,
      ...data,
      photos: [],
      createdAt: new Date().toLocaleString('zh-CN'),
    })
  }

  function updateRectificationStatus(id: string, status: RectificationStatus) {
    const rect = rectifications.value.find((r) => r.id === id)
    if (rect) {
      rect.status = status
      if (status === 'completed') {
        rect.completedAt = new Date().toLocaleString('zh-CN')
      }
    }
  }

  function updateStallLicense(id: string, status: LicenseStatus) {
    const stall = stalls.value.find((s) => s.id === id)
    if (stall) stall.licenseStatus = status
  }

  function updateStallGasCylinder(id: string, status: GasCylinderStatus) {
    const stall = stalls.value.find((s) => s.id === id)
    if (stall) stall.gasCylinderStatus = status
  }

  function resetAllData() {
    stalls.value = [...seedStalls]
    complaints.value = [...seedComplaints]
    inspections.value = [...seedInspections]
    rectifications.value = [...seedRectifications]
    currentRole.value = 'street_staff'
    activeTab.value = 'stalls'
    selectedStallId.value = null
    selectedComplaintId.value = null
    localStorage.removeItem('nightMarket')
  }

  function injectOldTestData() {
    const oldComplaints = seedComplaints.map((c) => ({
      id: c.id,
      stallId: c.stallId,
      content: c.content,
      recordingUrl: '',
      status: c.status,
      repeatCount: c.repeatCount,
      createdAt: c.createdAt,
      resolvedAt: c.resolvedAt,
    }))
    const oldRectifications = seedRectifications.map((r) => ({
      id: r.id,
      stallId: r.stallId,
      beforePhotos: [] as string[],
      afterPhotos: [] as string[],
      status: r.status,
      description: r.description,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    }))
    const oldStalls = seedStalls.map((s) => ({
      ...s,
      auditStatus: s.id === 'S002' ? 'approved' as AuditStatus : s.auditStatus,
      position: s.id === 'S002' ? 'B-11' : s.position,
    }))
    const oldData = {
      currentRole: 'street_staff',
      activeTab: 'stalls',
      selectedStallId: null,
      selectedComplaintId: null,
      stalls: oldStalls,
      complaints: oldComplaints,
      inspections: [...seedInspections],
      rectifications: oldRectifications,
      _v: 1,
    }
    localStorage.setItem('nightMarket', JSON.stringify(oldData))
  }

  const HIGH_FUME_CATEGORIES = ['烧烤', '炸串', '铁板烧', '烤鱼', '麻辣烫']
  const MAX_VIOLATIONS = 2

  const availablePositions = computed(() =>
    stallPositions.value.filter((p) => !p.occupied),
  )

  const pendingAppeals = computed(() =>
    appeals.value.filter((a) => a.status === 'pending'),
  )

  const excludeReasonLabels = EXCLUDE_REASON_LABELS

  function shuffleArray<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  function checkEligibility(applicant: LotteryApplicant): {
    eligible: boolean
    reason?: ExcludeReason
  } {
    if (applicant.licenseStatus === 'expired') {
      return { eligible: false, reason: 'license_expired' }
    }
    if (applicant.licenseStatus === 'incomplete') {
      return { eligible: false, reason: 'license_incomplete' }
    }
    if (applicant.gasCylinderStatus === 'danger') {
      return { eligible: false, reason: 'gas_danger' }
    }
    if (applicant.violationCount > MAX_VIOLATIONS) {
      return { eligible: false, reason: 'violation_exceeded' }
    }
    if (
      applicant.isHighFumeCategory &&
      applicant.nearResidentialArea
    ) {
      return { eligible: false, reason: 'high_fume_sensitive_area' }
    }
    return { eligible: true }
  }

  function getAdjacentPositions(position: StallPositionInfo): StallPositionInfo[] {
    const adjacent: StallPositionInfo[] = []
    const { row, col } = position
    const directions = [
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ]
    for (const dir of directions) {
      const adj = stallPositions.value.find(
        (p) => p.row === row && p.col === col + dir.dc,
      )
      if (adj) adjacent.push(adj)
    }
    return adjacent
  }

  function isHighFumeCategory(category: string): boolean {
    return HIGH_FUME_CATEGORIES.includes(category)
  }

  function performLottery(drawnBy: string = '街道工作人员'): LotteryResult {
    const excluded: { applicant: LotteryApplicant; reason: ExcludeReason }[] = []
    const eligible: LotteryApplicant[] = []

    for (const applicant of lotteryApplicants.value) {
      const check = checkEligibility(applicant)
      if (check.eligible) {
        eligible.push(applicant)
      } else if (check.reason) {
        excluded.push({ applicant, reason: check.reason })
      }
    }

    const shuffled = shuffleArray(eligible)
    const positions = [...stallPositions.value].map((p) => ({ ...p, occupied: false }))
    const selected: AssignedStall[] = []
    const waitlist: LotteryApplicant[] = []
    const adjustments: LotteryAdjustment[] = []

    for (const applicant of shuffled) {
      let assignedPos: StallPositionInfo | undefined

      if (isHighFumeCategory(applicant.category)) {
        assignedPos = positions.find((p) => !p.occupied && !p.nearResidential)
        if (!assignedPos) {
          assignedPos = positions.find((p) => !p.occupied)
        }
      } else {
        assignedPos = positions.find((p) => !p.occupied)
      }

      if (assignedPos) {
        assignedPos.occupied = true
        assignedPos.category = applicant.category

        selected.push({
          applicantId: applicant.id,
          position: assignedPos.position,
          row: assignedPos.row,
          col: assignedPos.col,
          nearResidential: assignedPos.nearResidential,
        })
      } else {
        waitlist.push(applicant)
      }
    }

    for (const assigned of selected) {
      const pos = positions.find((p) => p.position === assigned.position)
      if (!pos || !pos.category) continue

      if (isHighFumeCategory(pos.category) && pos.nearResidential) {
        const adjPositions = getAdjacentPositions(pos)
        const highFumeNeighbors = adjPositions.filter(
          (p) => p.category && isHighFumeCategory(p.category),
        )

        if (highFumeNeighbors.length >= 1) {
          const nonResidentialPos = positions.find(
            (p) => !p.occupied && !p.nearResidential,
          )
          if (nonResidentialPos) {
            nonResidentialPos.occupied = true
            nonResidentialPos.category = pos.category
            pos.occupied = false
            pos.category = undefined

            const oldPos = assigned.position
            assigned.position = nonResidentialPos.position
            assigned.row = nonResidentialPos.row
            assigned.col = nonResidentialPos.col
            assigned.nearResidential = nonResidentialPos.nearResidential

            adjustments.push({
              id: `ADJ${adjustments.length + 1}`,
              applicantId: assigned.applicantId,
              fromPosition: oldPos,
              toPosition: assigned.position,
              reason: '高油烟摊位集中于居民楼一侧，调整至非敏感区域',
              staffName: drawnBy,
              adjustedAt: new Date().toLocaleString('zh-CN'),
            })
          }
        }
      }
    }

    const result: LotteryResult = {
      id: `LOT${Date.now()}`,
      drawAt: new Date().toLocaleString('zh-CN'),
      drawnBy,
      selected,
      waitlist,
      excluded,
      adjustments,
    }

    lotteryResult.value = result

    for (const assigned of selected) {
      const pos = stallPositions.value.find((p) => p.position === assigned.position)
      if (pos) {
        pos.occupied = true
        const applicant = lotteryApplicants.value.find((a) => a.id === assigned.applicantId)
        pos.category = applicant?.category
      }
    }

    return result
  }

  function resetLottery() {
    lotteryResult.value = null
    for (const pos of stallPositions.value) {
      pos.occupied = false
      pos.category = undefined
    }
  }

  function submitAppeal(data: {
    applicantId: string
    applicantName: string
    reason: string
    description: string
  }) {
    appeals.value.push({
      id: `APL${appeals.value.length + 1}`,
      ...data,
      status: 'pending',
      submittedAt: new Date().toLocaleString('zh-CN'),
    })
  }

  function reviewAppeal(
    appealId: string,
    status: 'approved' | 'rejected',
    reviewNote: string,
    reviewer: string = '街道工作人员',
  ) {
    const appeal = appeals.value.find((a) => a.id === appealId)
    if (appeal) {
      appeal.status = status
      appeal.reviewNote = reviewNote
      appeal.reviewer = reviewer
      appeal.reviewedAt = new Date().toLocaleString('zh-CN')
    }
  }

  function getApplicantById(id: string): LotteryApplicant | undefined {
    return lotteryApplicants.value.find((a) => a.id === id)
  }

  function getSelectedApplicants(): { applicant: LotteryApplicant; position: string }[] {
    if (!lotteryResult.value) return []
    return lotteryResult.value.selected.map((s) => ({
      applicant: lotteryApplicants.value.find((a) => a.id === s.applicantId)!,
      position: s.position,
    }))
  }

  return {
    currentRole,
    activeTab,
    selectedStallId,
    selectedComplaintId,
    stalls,
    complaints,
    inspections,
    rectifications,
    lotteryApplicants,
    stallPositions,
    lotteryResult,
    appeals,
    statLicenseComplete,
    statPendingAudit,
    statRectifying,
    statGasRisk,
    selectedStall,
    selectedComplaint,
    stallComplaints,
    stallInspections,
    stallRectifications,
    stallRepeatComplaints,
    availablePositions,
    pendingAppeals,
    excludeReasonLabels,
    setRole,
    setActiveTab,
    selectStall,
    selectComplaint,
    updateStallAudit,
    assignStallPosition,
    updateComplaintStatus,
    addInspection,
    updateRectificationStatus,
    updateStallLicense,
    updateStallGasCylinder,
    resetAllData,
    injectOldTestData,
    performLottery,
    resetLottery,
    submitAppeal,
    reviewAppeal,
    getApplicantById,
    getSelectedApplicants,
  }
}, {
  persist: true,
})
