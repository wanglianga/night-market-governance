<script setup lang="ts">
import { computed } from 'vue'
import { useNightMarketStore } from '@/stores/nightMarket'
import {
  X,
  User,
  CreditCard,
  Clock,
  MapPin,
  Flame,
  FileCheck,
  AlertTriangle,
  MessageSquare,
  Wrench,
  CheckCircle2,
  Shuffle,
  Volume2,
} from 'lucide-vue-next'
import type { LicenseStatus, GasCylinderStatus } from '@/types'

const store = useNightMarketStore()

const stall = computed(() => store.selectedStall)
const complaints = computed(() => store.stallComplaints)
const rectifications = computed(() => store.stallRectifications)

function licenseLabel(s: LicenseStatus) {
  return { complete: '证照齐全', incomplete: '证照不全', expired: '证照过期' }[s]
}
function gasLabel(s: GasCylinderStatus) {
  return { safe: '安全', warning: '预警', danger: '风险' }[s]
}
function licenseColor(s: LicenseStatus) {
  return { complete: 'text-emerald-400', incomplete: 'text-amber-400', expired: 'text-red-400' }[s]
}
function gasColor(s: GasCylinderStatus) {
  return { safe: 'text-emerald-400', warning: 'text-amber-400', danger: 'text-red-400' }[s]
}

function complaintStatusBadge(status: string) {
  const map: Record<string, { text: string; cls: string }> = {
    pending: { text: '待处理', cls: 'bg-amber-500/20 text-amber-400' },
    processing: { text: '处理中', cls: 'bg-blue-500/20 text-blue-400' },
    resolved: { text: '已解决', cls: 'bg-emerald-500/20 text-emerald-400' },
  }
  return map[status] || { text: status, cls: 'bg-night-600 text-night-400' }
}

function rectStatusBadge(status: string) {
  const map: Record<string, { text: string; cls: string }> = {
    pending: { text: '待整改', cls: 'bg-amber-500/20 text-amber-400' },
    in_progress: { text: '整改中', cls: 'bg-orange-500/20 text-orange-400' },
    completed: { text: '已完成', cls: 'bg-emerald-500/20 text-emerald-400' },
  }
  return map[status] || { text: status, cls: 'bg-night-600 text-night-400' }
}
</script>

<template>
  <div
    v-if="stall"
    class="h-full flex flex-col bg-night-800 border-l border-night-700"
  >
    <div class="flex items-center justify-between px-4 py-3 border-b border-night-700">
      <h3 class="text-sm font-semibold text-night-200">{{ stall.name }}</h3>
      <button
        @click="store.selectStall(null)"
        class="p-1 rounded hover:bg-night-700 text-night-400 transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-xs">
          <User class="w-3.5 h-3.5 text-night-500" />
          <span class="text-night-400">摊主</span>
          <span class="text-night-200 ml-auto">{{ stall.vendorName }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <CreditCard class="w-3.5 h-3.5 text-night-500" />
          <span class="text-night-400">身份证</span>
          <span class="text-night-200 ml-auto font-mono">{{ stall.vendorIdCard }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <Clock class="w-3.5 h-3.5 text-night-500" />
          <span class="text-night-400">经营时段</span>
          <span class="text-night-200 ml-auto">{{ stall.businessHours }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <MapPin class="w-3.5 h-3.5 text-night-500" />
          <span class="text-night-400">位置</span>
          <span class="text-night-200 ml-auto">{{ stall.position || '未分配' }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <FileCheck class="w-3.5 h-3.5 text-night-500" />
          <span class="text-night-400">证照</span>
          <span :class="['ml-auto font-medium', licenseColor(stall.licenseStatus)]">
            {{ licenseLabel(stall.licenseStatus) }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <Flame class="w-3.5 h-3.5 text-night-500" />
          <span class="text-night-400">燃气瓶</span>
          <span :class="['ml-auto font-medium', gasColor(stall.gasCylinderStatus)]">
            {{ gasLabel(stall.gasCylinderStatus) }}
          </span>
        </div>
      </div>

      <div v-if="store.currentRole === 'street_staff' && stall.auditStatus === 'pending'" class="flex gap-2">
        <button
          @click="store.updateStallAudit(stall.id, 'approved')"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium transition-colors"
        >
          <CheckCircle2 class="w-3.5 h-3.5" />
          通过审核
        </button>
        <button
          @click="store.updateStallAudit(stall.id, 'rejected')"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-medium transition-colors"
        >
          <X class="w-3.5 h-3.5" />
          驳回
        </button>
      </div>

      <div v-if="store.currentRole === 'street_staff' && stall.auditStatus === 'approved' && !stall.position" class="flex gap-2">
        <button
          @click="store.assignStallPosition(stall.id)"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors"
        >
          <Shuffle class="w-3.5 h-3.5" />
          抽签分配位置
        </button>
      </div>

      <div class="border-t border-night-700 pt-3">
        <div class="flex items-center gap-1.5 mb-2">
          <MessageSquare class="w-3.5 h-3.5 text-amber-400" />
          <span class="text-xs font-medium text-night-200">投诉记录</span>
          <span v-if="complaints.length" class="text-[10px] text-night-500">({{ complaints.length }}条)</span>
        </div>
        <div v-if="complaints.length === 0" class="text-xs text-night-500 pl-5">暂无投诉</div>
        <div v-else class="space-y-2 pl-5">
          <div
            v-for="c in complaints"
            :key="c.id"
            class="p-2 rounded-md bg-night-700/50 border border-night-600/50"
          >
            <div class="flex items-center justify-between mb-1">
              <span :class="['text-[10px] px-1.5 py-0.5 rounded', complaintStatusBadge(c.status).cls]">
                {{ complaintStatusBadge(c.status).text }}
              </span>
              <div class="flex items-center gap-1">
                <span v-if="c.repeatCount >= 2" class="flex items-center gap-0.5 text-[10px] text-yellow-400">
                  <AlertTriangle class="w-3 h-3" />
                  重复{{ c.repeatCount }}次
                </span>
              </div>
            </div>
            <p class="text-[11px] text-night-300 leading-relaxed">{{ c.content }}</p>
            <div class="flex items-center justify-between mt-1.5">
              <span class="text-[10px] text-night-500">{{ c.createdAt }}</span>
              <div v-if="c.recordingUrl" class="flex items-center gap-0.5 text-[10px] text-blue-400">
                <Volume2 class="w-3 h-3" />
                录音
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-night-700 pt-3">
        <div class="flex items-center gap-1.5 mb-2">
          <Wrench class="w-3.5 h-3.5 text-orange-400" />
          <span class="text-xs font-medium text-night-200">整改记录</span>
        </div>
        <div v-if="rectifications.length === 0" class="text-xs text-night-500 pl-5">暂无整改</div>
        <div v-else class="space-y-2 pl-5">
          <div
            v-for="r in rectifications"
            :key="r.id"
            class="p-2 rounded-md bg-night-700/50 border border-night-600/50"
          >
            <div class="flex items-center justify-between mb-1">
              <span :class="['text-[10px] px-1.5 py-0.5 rounded', rectStatusBadge(r.status).cls]">
                {{ rectStatusBadge(r.status).text }}
              </span>
              <span class="text-[10px] text-night-500">{{ r.createdAt }}</span>
            </div>
            <p class="text-[11px] text-night-300 leading-relaxed">{{ r.description }}</p>
            <div v-if="r.status === 'completed'" class="text-[10px] text-night-500 mt-1">
              完成时间：{{ r.completedAt }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
