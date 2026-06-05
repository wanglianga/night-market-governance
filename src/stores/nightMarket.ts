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
} from '@/types'
import { seedStalls, seedComplaints, seedInspections, seedRectifications } from '@/data/seed'

export const useNightMarketStore = defineStore('nightMarket', () => {
  const currentRole = ref<UserRole>('street_staff')
  const activeTab = ref<WorkTab>('stalls')
  const selectedStallId = ref<string | null>(null)
  const selectedComplaintId = ref<string | null>(null)

  const DATA_VERSION = 3

  const stalls = ref<Stall[]>([...seedStalls])
  const complaints = ref<Complaint[]>([...seedComplaints])
  const inspections = ref<Inspection[]>([...seedInspections])
  const rectifications = ref<Rectification[]>([...seedRectifications])

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
          } else {
            if (c.recordingDuration === undefined) c.recordingDuration = 0
            if (c.recordingCaller === undefined) c.recordingCaller = ''
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

  return {
    currentRole,
    activeTab,
    selectedStallId,
    selectedComplaintId,
    stalls,
    complaints,
    inspections,
    rectifications,
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
  }
}, {
  persist: true,
})
