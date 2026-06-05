<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNightMarketStore } from '@/stores/nightMarket'
import {
  Search,
  FileCheck,
  FileX,
  AlertTriangle,
  Flame,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Shuffle,
  ChevronRight,
} from 'lucide-vue-next'
import type { Stall, LicenseStatus, GasCylinderStatus, AuditStatus } from '@/types'

const store = useNightMarketStore()
const searchQuery = ref('')
const filterLicense = ref<LicenseStatus | ''>('')
const filterGas = ref<GasCylinderStatus | ''>('')
const filterAudit = ref<AuditStatus | ''>('')

const filteredStalls = computed(() => {
  return store.stalls.filter((s) => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (
        !s.name.toLowerCase().includes(q) &&
        !s.vendorName.toLowerCase().includes(q) &&
        !s.id.toLowerCase().includes(q)
      )
        return false
    }
    if (filterLicense.value && s.licenseStatus !== filterLicense.value) return false
    if (filterGas.value && s.gasCylinderStatus !== filterGas.value) return false
    if (filterAudit.value && s.auditStatus !== filterAudit.value) return false
    return true
  })
})

function licenseBadge(status: LicenseStatus) {
  const map = {
    complete: { text: '证照齐全', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    incomplete: { text: '证照不全', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    expired: { text: '证照过期', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }
  return map[status]
}

function gasBadge(status: GasCylinderStatus) {
  const map = {
    safe: { text: '燃气安全', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    warning: { text: '燃气预警', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    danger: { text: '燃气风险', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }
  return map[status]
}

function auditBadge(status: AuditStatus) {
  const map = {
    pending: { text: '待审核', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    approved: { text: '已通过', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    rejected: { text: '已驳回', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }
  return map[status]
}

function stallComplaintCount(stallId: string) {
  return store.complaints.filter((c) => c.stallId === stallId).length
}

function stallRepeatComplaintCount(stallId: string) {
  return store.complaints.filter((c) => c.stallId === stallId && c.repeatCount >= 2).length
}

function stallRectStatus(stallId: string) {
  const rects = store.rectifications.filter((r) => r.stallId === stallId)
  if (rects.some((r) => r.status === 'in_progress')) return 'in_progress'
  if (rects.some((r) => r.status === 'pending')) return 'pending'
  return 'none'
}

function rectBadge(status: string) {
  if (status === 'in_progress') return { text: '整改中', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
  if (status === 'pending') return { text: '待整改', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
  return { text: '正常', cls: 'bg-night-600/50 text-night-400 border-night-600' }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center gap-2 mb-3 px-1">
      <div class="relative flex-1">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-night-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索摊位名称、摊主、编号..."
          class="w-full pl-8 pr-3 py-1.5 bg-night-700 border border-night-600 rounded-md text-xs text-night-200 placeholder-night-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>
      <select
        v-model="filterLicense"
        class="px-2 py-1.5 bg-night-700 border border-night-600 rounded-md text-xs text-night-300 focus:outline-none focus:border-blue-500/50"
      >
        <option value="">全部证照</option>
        <option value="complete">证照齐全</option>
        <option value="incomplete">证照不全</option>
        <option value="expired">证照过期</option>
      </select>
      <select
        v-model="filterGas"
        class="px-2 py-1.5 bg-night-700 border border-night-600 rounded-md text-xs text-night-300 focus:outline-none focus:border-blue-500/50"
      >
        <option value="">全部燃气</option>
        <option value="safe">燃气安全</option>
        <option value="warning">燃气预警</option>
        <option value="danger">燃气风险</option>
      </select>
      <select
        v-model="filterAudit"
        class="px-2 py-1.5 bg-night-700 border border-night-600 rounded-md text-xs text-night-300 focus:outline-none focus:border-blue-500/50"
      >
        <option value="">全部审核</option>
        <option value="pending">待审核</option>
        <option value="approved">已通过</option>
        <option value="rejected">已驳回</option>
      </select>
    </div>

    <div class="flex-1 overflow-auto rounded-lg border border-night-700">
      <table class="w-full text-xs">
        <thead class="sticky top-0 z-10">
          <tr class="bg-night-800 text-night-400">
            <th class="text-left px-3 py-2 font-medium">编号</th>
            <th class="text-left px-3 py-2 font-medium">摊位名</th>
            <th class="text-left px-3 py-2 font-medium">摊主</th>
            <th class="text-left px-3 py-2 font-medium">品类</th>
            <th class="text-left px-3 py-2 font-medium">证照</th>
            <th class="text-left px-3 py-2 font-medium">燃气</th>
            <th class="text-left px-3 py-2 font-medium">时段</th>
            <th class="text-left px-3 py-2 font-medium">位置</th>
            <th class="text-left px-3 py-2 font-medium">投诉</th>
            <th class="text-left px-3 py-2 font-medium">整改</th>
            <th class="text-left px-3 py-2 font-medium">审核</th>
            <th class="text-left px-3 py-2 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="stall in filteredStalls"
            :key="stall.id"
            :class="[
              'border-t border-night-700/50 cursor-pointer transition-colors',
              store.selectedStallId === stall.id
                ? 'bg-blue-500/10 hover:bg-blue-500/15'
                : 'hover:bg-night-700/50',
            ]"
            @click="store.selectStall(stall.id)"
          >
            <td class="px-3 py-2 text-night-400 font-mono">{{ stall.id }}</td>
            <td class="px-3 py-2 text-night-200 font-medium">{{ stall.name }}</td>
            <td class="px-3 py-2 text-night-300">{{ stall.vendorName }}</td>
            <td class="px-3 py-2 text-night-300">{{ stall.category }}</td>
            <td class="px-3 py-2">
              <span
                :class="['inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium', licenseBadge(stall.licenseStatus).cls]"
              >
                {{ licenseBadge(stall.licenseStatus).text }}
              </span>
            </td>
            <td class="px-3 py-2">
              <span
                :class="['inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium', gasBadge(stall.gasCylinderStatus).cls]"
              >
                {{ gasBadge(stall.gasCylinderStatus).text }}
              </span>
            </td>
            <td class="px-3 py-2 text-night-400 whitespace-nowrap">{{ stall.businessHours }}</td>
            <td class="px-3 py-2">
              <span v-if="stall.position" class="text-night-300">{{ stall.position }}</span>
              <span v-else class="text-night-500">未分配</span>
            </td>
            <td class="px-3 py-2">
              <span v-if="stallRepeatComplaintCount(stall.id) > 0" class="text-yellow-400 font-medium">
                {{ stallComplaintCount(stall.id) }}次
                <AlertTriangle class="w-3 h-3 inline" />
              </span>
              <span v-else-if="stallComplaintCount(stall.id) > 0" class="text-night-300">
                {{ stallComplaintCount(stall.id) }}次
              </span>
              <span v-else class="text-night-500">-</span>
            </td>
            <td class="px-3 py-2">
              <span
                :class="['inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium', rectBadge(stallRectStatus(stall.id)).cls]"
              >
                {{ rectBadge(stallRectStatus(stall.id)).text }}
              </span>
            </td>
            <td class="px-3 py-2">
              <span
                :class="['inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium', auditBadge(stall.auditStatus).cls]"
              >
                {{ auditBadge(stall.auditStatus).text }}
              </span>
            </td>
            <td class="px-3 py-2">
              <div class="flex items-center gap-1" v-if="store.currentRole === 'street_staff'">
                <button
                  v-if="stall.auditStatus === 'pending'"
                  @click.stop="store.updateStallAudit(stall.id, 'approved')"
                  class="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                  title="通过审核"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                </button>
                <button
                  v-if="stall.auditStatus === 'pending'"
                  @click.stop="store.updateStallAudit(stall.id, 'rejected')"
                  class="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                  title="驳回"
                >
                  <XCircle class="w-3.5 h-3.5" />
                </button>
                <button
                  v-if="stall.auditStatus === 'approved' && !stall.position"
                  @click.stop="store.assignStallPosition(stall.id)"
                  class="p-1 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                  title="抽签分配"
                >
                  <Shuffle class="w-3.5 h-3.5" />
                </button>
              </div>
              <ChevronRight v-else class="w-3.5 h-3.5 text-night-500" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
