<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNightMarketStore } from '@/stores/nightMarket'
import {
  Shuffle,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  User,
  MapPin,
  Flame,
  ShieldCheck,
  ShieldAlert,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-vue-next'
import type { ExcludeReason, LotteryApplicant } from '@/types'

const store = useNightMarketStore()
const showAppealModal = ref(false)
const appealApplicant = ref<LotteryApplicant | null>(null)
const appealReason = ref('')
const appealDescription = ref('')
const expandedSections = ref({
  selected: true,
  waitlist: true,
  excluded: true,
  adjustments: true,
})

const selectedWithDetails = computed(() => {
  if (!store.lotteryResult) return []
  return store.lotteryResult.selected.map((s) => {
    const applicant = store.getApplicantById(s.applicantId)
    return { ...s, applicant }
  })
})

const HIGH_FUME_CATEGORIES = ['烧烤', '炸串', '铁板烧', '烤鱼', '麻辣烫']

function isHighFume(category: string): boolean {
  return HIGH_FUME_CATEGORIES.includes(category)
}

function getExcludeReasonLabel(reason: ExcludeReason): string {
  return store.excludeReasonLabels[reason] || reason
}

function getExcludeReasonIcon(reason: ExcludeReason) {
  const map: Record<ExcludeReason, any> = {
    license_expired: ShieldAlert,
    license_incomplete: ShieldAlert,
    gas_danger: Flame,
    violation_exceeded: AlertTriangle,
    high_fume_sensitive_area: XCircle,
  }
  return map[reason] || AlertTriangle
}

function startLottery() {
  store.performLottery()
}

function resetLottery() {
  store.resetLottery()
}

function openAppeal(applicant: LotteryApplicant) {
  appealApplicant.value = applicant
  appealReason.value = ''
  appealDescription.value = ''
  showAppealModal.value = true
}

function submitAppeal() {
  if (!appealApplicant.value || !appealReason.value) return
  store.submitAppeal({
    applicantId: appealApplicant.value.id,
    applicantName: appealApplicant.value.name,
    reason: appealReason.value,
    description: appealDescription.value,
  })
  showAppealModal.value = false
  appealApplicant.value = null
  appealReason.value = ''
  appealDescription.value = ''
}

function toggleSection(section: keyof typeof expandedSections.value) {
  expandedSections.value[section] = !expandedSections.value[section]
}

function categoryBadge(category: string) {
  if (isHighFume(category)) {
    return { text: category, cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
  }
  return { text: category, cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
}

function licenseBadge(status: string) {
  const map: Record<string, { text: string; cls: string }> = {
    complete: { text: '证照齐全', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    incomplete: { text: '证照不全', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    expired: { text: '证照过期', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }
  return map[status] || { text: status, cls: 'bg-night-600/50 text-night-400 border-night-600' }
}

function gasBadge(status: string) {
  const map: Record<string, { text: string; cls: string }> = {
    safe: { text: '燃气安全', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    warning: { text: '燃气预警', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    danger: { text: '燃气风险', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }
  return map[status] || { text: status, cls: 'bg-night-600/50 text-night-400 border-night-600' }
}

const positionMap = computed(() => {
  const map = new Map<string, { applicant?: LotteryApplicant; category?: string }>()
  if (store.lotteryResult) {
    for (const s of store.lotteryResult.selected) {
      const applicant = store.getApplicantById(s.applicantId)
      map.set(s.position, { applicant, category: applicant?.category })
    }
  }
  return map
})

const rows = computed(() => {
  const rowSet = new Set(store.stallPositions.map((p) => p.row))
  return Array.from(rowSet).sort()
})

function getPositionsByRow(row: string) {
  return store.stallPositions
    .filter((p) => p.row === row)
    .sort((a, b) => a.col - b.col)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-1 mb-3">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-semibold text-night-200">摊位抽签模拟</h2>
        <span class="text-[10px] text-night-500">
          共 {{ store.lotteryApplicants.length }} 位摊主报名
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="store.currentRole === 'street_staff'"
          @click="startLottery"
          :disabled="!!store.lotteryResult"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          :class="[
            store.lotteryResult
              ? 'bg-night-700 text-night-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-500',
          ]"
        >
          <Shuffle class="w-3.5 h-3.5" />
          开始抽签
        </button>
        <button
          v-if="store.lotteryResult && store.currentRole === 'street_staff'"
          @click="resetLottery"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-night-700 text-night-300 hover:bg-night-600 transition-colors"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          重置抽签
        </button>
      </div>
    </div>

    <div v-if="store.lotteryResult" class="flex items-center gap-4 px-1 mb-3 text-[10px]">
      <div class="flex items-center gap-1 text-night-400">
        <CheckCircle2 class="w-3 h-3 text-emerald-400" />
        抽中: {{ store.lotteryResult.selected.length }} 位
      </div>
      <div class="flex items-center gap-1 text-night-400">
        <Clock class="w-3 h-3 text-amber-400" />
        候补: {{ store.lotteryResult.waitlist.length }} 位
      </div>
      <div class="flex items-center gap-1 text-night-400">
        <XCircle class="w-3 h-3 text-red-400" />
        淘汰: {{ store.lotteryResult.excluded.length }} 位
      </div>
      <div class="text-night-500 ml-auto">
        抽签时间: {{ store.lotteryResult.drawAt }}
      </div>
    </div>

    <div class="flex-1 overflow-y-auto space-y-3 pr-1">
      <div v-if="!store.lotteryResult" class="flex flex-col items-center justify-center h-full text-night-400">
        <Shuffle class="w-12 h-12 mb-3 text-night-600" />
        <p class="text-sm mb-1">点击「开始抽签」执行摊位抽签</p>
        <p class="text-xs text-night-500">系统将根据经营品类、证照状态、违规记录等自动筛选和分配</p>
      </div>

      <template v-else>
        <div class="bg-night-900/50 rounded-lg border border-night-700">
          <button
            @click="toggleSection('selected')"
            class="w-full flex items-center justify-between px-3 py-2 text-left"
          >
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-400" />
              <span class="text-xs font-medium text-night-200">抽中摊位</span>
              <span class="text-[10px] text-night-500">({{ store.lotteryResult.selected.length }} 位)</span>
            </div>
            <component :is="expandedSections.selected ? ChevronUp : ChevronDown" class="w-4 h-4 text-night-500" />
          </button>
          <div v-show="expandedSections.selected" class="px-3 pb-3">
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-night-500 border-b border-night-700">
                    <th class="text-left py-2 px-2 font-medium">摊位号</th>
                    <th class="text-left py-2 px-2 font-medium">摊位名称</th>
                    <th class="text-left py-2 px-2 font-medium">经营品类</th>
                    <th class="text-left py-2 px-2 font-medium">摊主</th>
                    <th class="text-left py-2 px-2 font-medium">区域</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in selectedWithDetails"
                    :key="item.applicantId"
                    class="border-b border-night-700/50 hover:bg-night-700/30"
                  >
                    <td class="py-2 px-2">
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {{ item.position }}
                      </span>
                    </td>
                    <td class="py-2 px-2 text-night-200">{{ item.applicant?.name }}</td>
                    <td class="py-2 px-2">
                      <span
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border"
                        :class="categoryBadge(item.applicant?.category || '').cls"
                      >
                        {{ item.applicant?.category }}
                      </span>
                    </td>
                    <td class="py-2 px-2 text-night-300">{{ item.applicant?.vendorName }}</td>
                    <td class="py-2 px-2">
                      <span
                        v-if="item.nearResidential"
                        class="inline-flex items-center gap-1 text-[10px] text-amber-400"
                      >
                        <AlertTriangle class="w-3 h-3" />
                        靠近居民楼
                      </span>
                      <span v-else class="text-[10px] text-night-500">内部区域</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-4 p-3 bg-night-900 rounded border border-night-700">
              <div class="flex items-center gap-2 mb-2">
                <MapPin class="w-3.5 h-3.5 text-night-400" />
                <span class="text-xs font-medium text-night-300">摊位分布图</span>
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="row in rows"
                  :key="row"
                  class="flex items-center gap-1.5"
                >
                  <span class="w-6 text-[10px] text-night-500 text-right">{{ row }}排</span>
                  <div class="flex gap-1">
                    <div
                      v-for="pos in getPositionsByRow(row)"
                      :key="pos.position"
                      class="w-14 h-10 rounded border flex flex-col items-center justify-center text-[9px] relative"
                      :class="[
                        positionMap.has(pos.position)
                          ? isHighFume(positionMap.get(pos.position)?.category || '')
                            ? 'bg-orange-500/20 border-orange-500/40'
                            : 'bg-blue-500/20 border-blue-500/40'
                          : 'bg-night-800 border-night-700',
                      ]"
                    >
                      <span
                        v-if="pos.nearResidential"
                        class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"
                        title="靠近居民楼"
                      />
                      <span class="font-mono text-night-300">{{ pos.position }}</span>
                      <span
                        v-if="positionMap.get(pos.position)?.category"
                        class="text-night-400 truncate w-full text-center px-0.5"
                      >
                        {{ positionMap.get(pos.position)?.applicant?.name.slice(0, 4) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4 mt-2 pt-2 border-t border-night-700 text-[10px]">
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/40" />
                  <span class="text-night-400">普通品类</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/40" />
                  <span class="text-night-400">高油烟品类</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-2 h-2 rounded-full bg-amber-400" />
                  <span class="text-night-400">靠近居民楼</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="store.lotteryResult.adjustments.length > 0" class="bg-night-900/50 rounded-lg border border-night-700">
          <button
            @click="toggleSection('adjustments')"
            class="w-full flex items-center justify-between px-3 py-2 text-left"
          >
            <div class="flex items-center gap-2">
              <Info class="w-4 h-4 text-blue-400" />
              <span class="text-xs font-medium text-night-200">调整记录</span>
              <span class="text-[10px] text-night-500">({{ store.lotteryResult.adjustments.length }} 条)</span>
            </div>
            <component :is="expandedSections.adjustments ? ChevronUp : ChevronDown" class="w-4 h-4 text-night-500" />
          </button>
          <div v-show="expandedSections.adjustments" class="px-3 pb-3 space-y-2">
            <div
              v-for="adj in store.lotteryResult.adjustments"
              :key="adj.id"
              class="p-2 bg-blue-500/10 rounded border border-blue-500/20 text-xs"
            >
              <div class="flex items-center gap-2 mb-1">
                <User class="w-3 h-3 text-blue-400" />
                <span class="text-night-300">{{ store.getApplicantById(adj.applicantId)?.name }}</span>
                <span class="text-night-500">→</span>
                <span class="text-amber-400">{{ adj.fromPosition }}</span>
                <span class="text-night-500">→</span>
                <span class="text-emerald-400">{{ adj.toPosition }}</span>
              </div>
              <div class="text-night-400 text-[11px]">
                <span class="text-night-500">调整原因：</span>{{ adj.reason }}
              </div>
              <div class="text-night-500 text-[10px] mt-1">
                操作人：{{ adj.staffName }} · {{ adj.adjustedAt }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="store.lotteryResult.waitlist.length > 0" class="bg-night-900/50 rounded-lg border border-night-700">
          <button
            @click="toggleSection('waitlist')"
            class="w-full flex items-center justify-between px-3 py-2 text-left"
          >
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-amber-400" />
              <span class="text-xs font-medium text-night-200">候补名单</span>
              <span class="text-[10px] text-night-500">({{ store.lotteryResult.waitlist.length }} 位)</span>
            </div>
            <component :is="expandedSections.waitlist ? ChevronUp : ChevronDown" class="w-4 h-4 text-night-500" />
          </button>
          <div v-show="expandedSections.waitlist" class="px-3 pb-3">
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-night-500 border-b border-night-700">
                    <th class="text-left py-2 px-2 font-medium w-12">序号</th>
                    <th class="text-left py-2 px-2 font-medium">摊位名称</th>
                    <th class="text-left py-2 px-2 font-medium">经营品类</th>
                    <th class="text-left py-2 px-2 font-medium">摊主</th>
                    <th class="text-left py-2 px-2 font-medium">证照</th>
                    <th class="text-left py-2 px-2 font-medium">燃气</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(applicant, index) in store.lotteryResult.waitlist"
                    :key="applicant.id"
                    class="border-b border-night-700/50 hover:bg-night-700/30"
                  >
                    <td class="py-2 px-2 text-night-500">{{ index + 1 }}</td>
                    <td class="py-2 px-2 text-night-200">{{ applicant.name }}</td>
                    <td class="py-2 px-2">
                      <span
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border"
                        :class="categoryBadge(applicant.category).cls"
                      >
                        {{ applicant.category }}
                      </span>
                    </td>
                    <td class="py-2 px-2 text-night-300">{{ applicant.vendorName }}</td>
                    <td class="py-2 px-2">
                      <span
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border"
                        :class="licenseBadge(applicant.licenseStatus).cls"
                      >
                        {{ licenseBadge(applicant.licenseStatus).text }}
                      </span>
                    </td>
                    <td class="py-2 px-2">
                      <span
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border"
                        :class="gasBadge(applicant.gasCylinderStatus).cls"
                      >
                        {{ gasBadge(applicant.gasCylinderStatus).text }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-if="store.lotteryResult.excluded.length > 0" class="bg-night-900/50 rounded-lg border border-night-700">
          <button
            @click="toggleSection('excluded')"
            class="w-full flex items-center justify-between px-3 py-2 text-left"
          >
            <div class="flex items-center gap-2">
              <XCircle class="w-4 h-4 text-red-400" />
              <span class="text-xs font-medium text-night-200">未通过筛选</span>
              <span class="text-[10px] text-night-500">({{ store.lotteryResult.excluded.length }} 位)</span>
            </div>
            <component :is="expandedSections.excluded ? ChevronUp : ChevronDown" class="w-4 h-4 text-night-500" />
          </button>
          <div v-show="expandedSections.excluded" class="px-3 pb-3">
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-night-500 border-b border-night-700">
                    <th class="text-left py-2 px-2 font-medium">摊位名称</th>
                    <th class="text-left py-2 px-2 font-medium">经营品类</th>
                    <th class="text-left py-2 px-2 font-medium">摊主</th>
                    <th class="text-left py-2 px-2 font-medium">排除原因</th>
                    <th class="text-left py-2 px-2 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in store.lotteryResult.excluded"
                    :key="item.applicant.id"
                    class="border-b border-night-700/50 hover:bg-night-700/30"
                  >
                    <td class="py-2 px-2 text-night-200">{{ item.applicant.name }}</td>
                    <td class="py-2 px-2">
                      <span
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border"
                        :class="categoryBadge(item.applicant.category).cls"
                      >
                        {{ item.applicant.category }}
                      </span>
                    </td>
                    <td class="py-2 px-2 text-night-300">{{ item.applicant.vendorName }}</td>
                    <td class="py-2 px-2">
                      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                        <component :is="getExcludeReasonIcon(item.reason)" class="w-3 h-3" />
                        {{ getExcludeReasonLabel(item.reason) }}
                      </span>
                    </td>
                    <td class="py-2 px-2 text-right">
                      <button
                        @click="openAppeal(item.applicant)"
                        class="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] text-blue-400 hover:bg-blue-500/20 transition-colors"
                      >
                        <MessageSquare class="w-3 h-3" />
                        申诉
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="showAppealModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="showAppealModal = false"
    >
      <div class="bg-night-800 rounded-lg border border-night-700 w-full max-w-md mx-4">
        <div class="flex items-center justify-between px-4 py-3 border-b border-night-700">
          <h3 class="text-sm font-medium text-night-200">提交申诉</h3>
          <button
            @click="showAppealModal = false"
            class="text-night-500 hover:text-night-300 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="p-4 space-y-3">
          <div v-if="appealApplicant" class="p-2 bg-night-900 rounded text-xs">
            <div class="text-night-300 font-medium mb-1">{{ appealApplicant.name }}</div>
            <div class="text-night-500">摊主：{{ appealApplicant.vendorName }} · 品类：{{ appealApplicant.category }}</div>
          </div>
          <div>
            <label class="block text-xs text-night-400 mb-1">申诉原因</label>
            <select
              v-model="appealReason"
              class="w-full px-3 py-2 bg-night-900 border border-night-700 rounded text-xs text-night-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">请选择申诉原因</option>
              <option value="证照信息有误">证照信息有误</option>
              <option value="燃气检查结果已更新">燃气检查结果已更新</option>
              <option value="违规记录已清除">违规记录已清除</option>
              <option value="经营品类分类错误">经营品类分类错误</option>
              <option value="其他原因">其他原因</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-night-400 mb-1">详细说明</label>
            <textarea
              v-model="appealDescription"
              rows="3"
              placeholder="请详细说明申诉理由..."
              class="w-full px-3 py-2 bg-night-900 border border-night-700 rounded text-xs text-night-200 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-night-700">
          <button
            @click="showAppealModal = false"
            class="px-3 py-1.5 rounded text-xs text-night-400 hover:bg-night-700 transition-colors"
          >
            取消
          </button>
          <button
            @click="submitAppeal"
            :disabled="!appealReason"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            :class="[
              appealReason
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-night-700 text-night-500 cursor-not-allowed',
            ]"
          >
            <Send class="w-3.5 h-3.5" />
            提交申诉
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
