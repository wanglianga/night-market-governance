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

  const stalls = ref<Stall[]>([...seedStalls])
  const complaints = ref<Complaint[]>([...seedComplaints])
  const inspections = ref<Inspection[]>([...seedInspections])
  const rectifications = ref<Rectification[]>([...seedRectifications])

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
  }
}, {
  persist: true,
})
