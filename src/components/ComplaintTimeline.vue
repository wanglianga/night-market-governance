<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNightMarketStore } from '@/stores/nightMarket'
import {
  Clock,
  Volume2,
  Wind,
  Car,
  AlertCircle,
  User,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Mic,
  Image,
} from 'lucide-vue-next'
import type {
  Complaint,
  ComplaintCategory,
  ComplaintRepeatType,
  ComplaintStatus,
} from '@/types'

const store = useNightMarketStore()
const searchQuery = ref('')
const filterCategory = ref<ComplaintCategory | ''>('')
const filterStatus = ref<ComplaintStatus | ''>('')
const expandedStalls = ref<Set<string>>(new Set())
const selectedComplaintId = ref<string | null>(null)

function toggleStall(stallId: string) {
  if (expandedStalls.value.has(stallId)) {
    expandedStalls.value.delete(stallId)
  } else {
    expandedStalls.value.add(stallId)
  }
}

function selectComplaint(complaintId: string) {
  selectedComplaintId.value = complaintId
  store.selectComplaint(complaintId)
}

const categoryConfig: Record<ComplaintCategory, { label: string; icon: any; color: string }> = {
  noise: { label: '噪声', icon: Volume2, color: 'text-purple-400 bg-purple-500/20' },
  oil_fume: { label: '油烟', icon: Wind, color: 'text-orange-400 bg-orange-500/20' },
  road_occupation: { label: '占道', icon: Car, color: 'text-cyan-400 bg-cyan-500/20' },
  other: { label: '其他', icon: AlertCircle, color: 'text-gray-400 bg-gray-500/20' },
}

const repeatTypeConfig: Record<ComplaintRepeatType, { label: string; icon: any; color: string }> = {
  single_resident_continuous: { label: '同一居民连续反馈', icon: User, color: 'text-yellow-400 bg-yellow-500/20' },
  multiple_residents_concentrated: { label: '多人集中投诉', icon: Users, color: 'text-red-400 bg-red-500/20' },
  recurrence_after_rectification: { label: '整改后复发', icon: RefreshCw, color: 'text-pink-400 bg-pink-500/20' },
  none: { label: '', icon: AlertCircle, color: '' },
}

const statusConfig: Record<ComplaintStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  processing: { label: '处理中', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  resolved: { label: '已解决', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
}

interface StallComplaintGroup {
  stallId: string
  stallName: string
  complaints: Complaint[]
  totalCount: number
  pendingCount: number
  noiseCount: number
  oilFumeCount: number
  roadOccupationCount: number
}

const groupedComplaints = computed<StallComplaintGroup[]>(() => {
  const groups = new Map<string, Complaint[]>()
  
  store.complaints.forEach((c) => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (
        !c.content.toLowerCase().includes(q) &&
        !c.summary.toLowerCase().includes(q) &&
        !c.recordingCaller.toLowerCase().includes(q)
      ) {
        return
      }
    }
    if (filterCategory.value && c.category !== filterCategory.value) return
    if (filterStatus.value && c.status !== filterStatus.value) return
    
    if (!groups.has(c.stallId)) {
      groups.set(c.stallId, [])
    }
    groups.get(c.stallId)!.push(c)
  })

  const result: StallComplaintGroup[] = []
  groups.forEach((complaints, stallId) => {
    const stall = store.stalls.find((s) => s.id === stallId)
    const sorted = [...complaints].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    result.push({
      stallId,
      stallName: stall?.name || stallId,
      complaints: sorted,
      totalCount: sorted.length,
      pendingCount: sorted.filter((c) => c.status === 'pending').length,
      noiseCount: sorted.filter((c) => c.category === 'noise').length,
      oilFumeCount: sorted.filter((c) => c.category === 'oil_fume').length,
      roadOccupationCount: sorted.filter((c) => c.category === 'road_occupation').length,
    })
  })

  return result.sort((a, b) => b.totalCount - a.totalCount)
})

function getStallName(stallId: string) {
  return store.stalls.find((s) => s.id === stallId)?.name || stallId
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div class="flex h-full">
    <div class="flex-1 flex flex-col min-w-0">
      <div class="flex items-center gap-2 mb-3 px-1">
        <div class="relative flex-1">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-night-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索投诉内容、摘要、来电人..."
            class="w-full pl-8 pr-3 py-1.5 bg-night-700 border border-night-600 rounded-md text-xs text-night-200 placeholder-night-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          v-model="filterCategory"
          class="px-2 py-1.5 bg-night-700 border border-night-600 rounded-md text-xs text-night-300 focus:outline-none focus:border-blue-500/50"
        >
          <option value="">全部类型</option>
          <option value="noise">噪声</option>
          <option value="oil_fume">油烟</option>
          <option value="road_occupation">占道</option>
          <option value="other">其他</option>
        </select>
        <select
          v-model="filterStatus"
          class="px-2 py-1.5 bg-night-700 border border-night-600 rounded-md text-xs text-night-300 focus:outline-none focus:border-blue-500/50"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
        </select>
      </div>

      <div class="flex-1 overflow-auto rounded-lg border border-night-700">
        <div v-if="groupedComplaints.length === 0" class="flex flex-col items-center justify-center h-48 text-night-500">
          <Filter class="w-8 h-8 mb-2 opacity-50" />
          <span class="text-xs">暂无符合条件的投诉</span>
        </div>

        <div v-else class="divide-y divide-night-700/50">
          <div
            v-for="group in groupedComplaints"
            :key="group.stallId"
            class="bg-night-800/50"
          >
            <button
              @click="toggleStall(group.stallId)"
              class="w-full flex items-center gap-3 px-4 py-3 hover:bg-night-700/30 transition-colors"
            >
              <component
                :is="expandedStalls.has(group.stallId) ? ChevronDown : ChevronRight"
                class="w-4 h-4 text-night-400 shrink-0"
              />
              <div class="flex-1 text-left">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-night-200">{{ group.stallName }}</span>
                  <span
                    v-if="group.pendingCount > 0"
                    class="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 rounded"
                  >
                    {{ group.pendingCount }} 待处理
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] text-night-500">共 {{ group.totalCount }} 条投诉</span>
                  <div class="flex gap-1">
                    <span v-if="group.noiseCount > 0" class="text-[10px] text-purple-400">
                      噪声 {{ group.noiseCount }}
                    </span>
                    <span v-if="group.oilFumeCount > 0" class="text-[10px] text-orange-400">
                      油烟 {{ group.oilFumeCount }}
                    </span>
                    <span v-if="group.roadOccupationCount > 0" class="text-[10px] text-cyan-400">
                      占道 {{ group.roadOccupationCount }}
                    </span>
                  </div>
                </div>
              </div>
            </button>

            <div v-if="expandedStalls.has(group.stallId)" class="border-t border-night-700/50">
              <div class="relative">
                <div class="absolute left-8 top-0 bottom-0 w-px bg-night-700"></div>

                <div
                  v-for="(complaint, idx) in group.complaints"
                  :key="complaint.id"
                  :class="[
                    'relative pl-10 pr-4 py-3 cursor-pointer transition-colors',
                    selectedComplaintId === complaint.id
                      ? 'bg-blue-500/10'
                      : 'hover:bg-night-700/30',
                    idx === group.complaints.length - 1 ? '' : 'border-b border-night-700/30',
                  ]"
                  @click="selectComplaint(complaint.id)"
                >
                  <div
                    :class="[
                      'absolute left-6 top-4 w-4 h-4 rounded-full border-2 bg-night-800 flex items-center justify-center',
                      complaint.status === 'pending'
                        ? 'border-amber-500'
                        : complaint.status === 'processing'
                        ? 'border-blue-500'
                        : 'border-emerald-500',
                    ]"
                  >
                    <div
                      :class="[
                        'w-1.5 h-1.5 rounded-full',
                        complaint.status === 'pending'
                          ? 'bg-amber-500'
                          : complaint.status === 'processing'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500',
                      ]"
                    ></div>
                  </div>

                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span
                          :class="[
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                            categoryConfig[complaint.category].color,
                          ]"
                        >
                          <component :is="categoryConfig[complaint.category].icon" class="w-3 h-3" />
                          {{ categoryConfig[complaint.category].label }}
                        </span>
                        <span
                          v-if="complaint.repeatType !== 'none'"
                          :class="[
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                            repeatTypeConfig[complaint.repeatType].color,
                          ]"
                          :title="repeatTypeConfig[complaint.repeatType].label"
                        >
                          <component :is="repeatTypeConfig[complaint.repeatType].icon" class="w-3 h-3" />
                          {{ repeatTypeConfig[complaint.repeatType].label }}
                        </span>
                        <span
                          :class="[
                            'inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium',
                            statusConfig[complaint.status].color,
                          ]"
                        >
                          {{ statusConfig[complaint.status].label }}
                        </span>
                      </div>

                      <p class="text-xs text-night-200 line-clamp-1 mb-1">{{ complaint.content }}</p>

                      <div class="flex items-center gap-3 text-[10px] text-night-500">
                        <span class="flex items-center gap-1">
                          <Clock class="w-3 h-3" />
                          {{ complaint.createdAt }}
                        </span>
                        <span v-if="complaint.recordingCaller" class="flex items-center gap-1">
                          <User class="w-3 h-3" />
                          {{ complaint.recordingCaller }}
                        </span>
                        <span v-if="complaint.recordingUrl" class="flex items-center gap-1 text-blue-400">
                          <Mic class="w-3 h-3" />
                          {{ formatDuration(complaint.recordingDuration) }}
                        </span>
                        <span v-if="complaint.photos.length > 0" class="flex items-center gap-1 text-emerald-400">
                          <Image class="w-3 h-3" />
                          {{ complaint.photos.length }}张
                        </span>
                      </div>
                    </div>

                    <div class="flex flex-col items-end gap-1 shrink-0">
                      <div class="flex items-center gap-1">
                        <span
                          v-if="complaint.assignedInspector"
                          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400"
                          title="已派单"
                        >
                          <Send class="w-3 h-3" />
                          已派单
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-night-600 text-night-400"
                          title="未派单"
                        >
                          <Send class="w-3 h-3" />
                          未派单
                        </span>
                        <span
                          v-if="complaint.reviewedAt"
                          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400"
                          title="已复查"
                        >
                          <Eye class="w-3 h-3" />
                          已复查
                        </span>
                      </div>
                      <div class="flex items-center gap-1">
                        <span
                          v-if="complaint.residentApproved === true"
                          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400"
                          title="居民认可"
                        >
                          <CheckCircle class="w-3 h-3" />
                          认可
                        </span>
                        <span
                          v-else-if="complaint.residentApproved === false"
                          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400"
                          title="居民不认可"
                        >
                          <XCircle class="w-3 h-3" />
                          不认可
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="store.selectedComplaint"
      class="w-[420px] flex flex-col bg-night-800 border-l border-night-700 ml-3"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-night-700">
        <h3 class="text-sm font-semibold text-night-200">投诉详情</h3>
        <button
          @click="selectComplaint(null); store.selectComplaint(null)"
          class="p-1 rounded hover:bg-night-700 text-night-400 transition-colors"
        >
          <XCircle class="w-4 h-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              :class="[
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                categoryConfig[store.selectedComplaint.category].color,
              ]"
            >
              <component :is="categoryConfig[store.selectedComplaint.category].icon" class="w-3.5 h-3.5" />
              {{ categoryConfig[store.selectedComplaint.category].label }}投诉
            </span>
            <span
              :class="[
                'inline-block px-2 py-0.5 rounded border text-xs font-medium',
                statusConfig[store.selectedComplaint.status].color,
              ]"
            >
              {{ statusConfig[store.selectedComplaint.status].label }}
            </span>
          </div>
          <div v-if="store.selectedComplaint.repeatType !== 'none'" class="flex items-center gap-2">
            <span
              :class="[
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                repeatTypeConfig[store.selectedComplaint.repeatType].color,
              ]"
            >
              <component :is="repeatTypeConfig[store.selectedComplaint.repeatType].icon" class="w-3.5 h-3.5" />
              {{ repeatTypeConfig[store.selectedComplaint.repeatType].label }}
            </span>
          </div>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-night-400">关联摊位</span>
            <span class="text-night-200 font-medium">
              {{ getStallName(store.selectedComplaint.stallId) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-night-400">投诉时间</span>
            <span class="text-night-200">{{ store.selectedComplaint.createdAt }}</span>
          </div>
          <div v-if="store.selectedComplaint.resolvedAt" class="flex justify-between">
            <span class="text-night-400">解决时间</span>
            <span class="text-emerald-400">{{ store.selectedComplaint.resolvedAt }}</span>
          </div>
        </div>

        <div class="border-t border-night-700 pt-3">
          <span class="text-xs text-night-400 block mb-2">投诉内容</span>
          <p class="text-xs text-night-200 leading-relaxed bg-night-700/50 p-3 rounded-md">
            {{ store.selectedComplaint.content }}
          </p>
        </div>

        <div v-if="store.selectedComplaint.summary" class="border-t border-night-700 pt-3">
          <span class="text-xs text-night-400 block mb-2">文字摘要</span>
          <p class="text-xs text-night-300 leading-relaxed bg-night-700/30 p-3 rounded-md border-l-2 border-blue-500">
            {{ store.selectedComplaint.summary }}
          </p>
        </div>

        <div
          v-if="store.selectedComplaint.recordingUrl"
          class="border-t border-night-700 pt-3"
        >
          <div class="flex items-center gap-1.5 mb-2">
            <Mic class="w-3.5 h-3.5 text-blue-400" />
            <span class="text-xs text-night-300 font-medium">投诉录音</span>
          </div>
          <div class="bg-night-700/50 p-3 rounded-md">
            <div class="flex items-center justify-between text-[10px] text-night-400 mb-2">
              <span>来电人：{{ store.selectedComplaint.recordingCaller || '匿名' }}</span>
              <span>{{ formatDuration(store.selectedComplaint.recordingDuration) }}</span>
            </div>
            <div class="h-1.5 bg-night-600 rounded-full overflow-hidden">
              <div class="h-full w-1/3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div
          v-if="store.selectedComplaint.photos.length > 0"
          class="border-t border-night-700 pt-3"
        >
          <div class="flex items-center gap-1.5 mb-2">
            <Image class="w-3.5 h-3.5 text-emerald-400" />
            <span class="text-xs text-night-300 font-medium">现场照片 ({{ store.selectedComplaint.photos.length }})</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="(photo, idx) in store.selectedComplaint.photos"
              :key="idx"
              class="aspect-video bg-night-700 rounded-md overflow-hidden"
            >
              <img :src="photo" alt="现场照片" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div class="border-t border-night-700 pt-3">
          <span class="text-xs text-night-400 block mb-2">处理状态</span>
          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-night-400">派单状态</span>
              <span v-if="store.selectedComplaint.assignedInspector" class="text-blue-400">
                已派给 {{ store.selectedComplaint.assignedInspector }}
              </span>
              <span v-else class="text-night-500">未派单</span>
            </div>
            <div v-if="store.selectedComplaint.assignedAt" class="flex items-center justify-between">
              <span class="text-night-400">派单时间</span>
              <span class="text-night-300">{{ store.selectedComplaint.assignedAt }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-night-400">复查状态</span>
              <span v-if="store.selectedComplaint.reviewedAt" class="text-emerald-400">
                已复查
              </span>
              <span v-else class="text-night-500">未复查</span>
            </div>
            <div v-if="store.selectedComplaint.reviewedAt" class="flex items-center justify-between">
              <span class="text-night-400">复查时间</span>
              <span class="text-night-300">{{ store.selectedComplaint.reviewedAt }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-night-400">居民认可</span>
              <span v-if="store.selectedComplaint.residentApproved === true" class="text-emerald-400">
                <CheckCircle class="w-3.5 h-3.5 inline mr-1" />
                已认可
              </span>
              <span v-else-if="store.selectedComplaint.residentApproved === false" class="text-red-400">
                <XCircle class="w-3.5 h-3.5 inline mr-1" />
                不认可
              </span>
              <span v-else class="text-night-500">未回访</span>
            </div>
          </div>
        </div>

        <div v-if="store.selectedComplaint.processingNotes" class="border-t border-night-700 pt-3">
          <span class="text-xs text-night-400 block mb-2">处理记录</span>
          <p class="text-xs text-night-300 leading-relaxed bg-night-700/30 p-3 rounded-md">
            {{ store.selectedComplaint.processingNotes }}
          </p>
        </div>

        <div v-if="store.selectedComplaint.followUpResult" class="border-t border-night-700 pt-3">
          <span class="text-xs text-night-400 block mb-2">回访结果</span>
          <p class="text-xs text-night-300 leading-relaxed bg-night-700/30 p-3 rounded-md border-l-2 border-emerald-500">
            {{ store.selectedComplaint.followUpResult }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
