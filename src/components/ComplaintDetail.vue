<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNightMarketStore } from '@/stores/nightMarket'
import {
  Search,
  AlertTriangle,
  Volume2,
  VolumeX,
  CheckCircle2,
  Loader2,
  X,
  Pause,
  Play,
  Mic,
} from 'lucide-vue-next'
import type { ComplaintStatus } from '@/types'

const store = useNightMarketStore()
const searchQuery = ref('')
const filterStatus = ref<ComplaintStatus | ''>('')

const playingRecordingId = ref<string | null>(null)
const recordingProgress = ref<Record<string, number>>({})

function toggleRecording(complaintId: string) {
  if (playingRecordingId.value === complaintId) {
    playingRecordingId.value = null
    return
  }
  playingRecordingId.value = complaintId
  if (!(complaintId in recordingProgress.value)) {
    recordingProgress.value[complaintId] = 0
  }
  simulateProgress(complaintId)
}

function simulateProgress(complaintId: string) {
  const step = () => {
    if (playingRecordingId.value !== complaintId) return
    const current = recordingProgress.value[complaintId] || 0
    if (current >= 100) {
      recordingProgress.value[complaintId] = 0
      playingRecordingId.value = null
      return
    }
    recordingProgress.value[complaintId] = current + 2
    setTimeout(step, 200)
  }
  setTimeout(step, 200)
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const filteredComplaints = computed(() => {
  return store.complaints
    .filter((c) => {
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        if (
          !c.content.toLowerCase().includes(q) &&
          !c.stallId.toLowerCase().includes(q)
        )
          return false
      }
      if (filterStatus.value && c.status !== filterStatus.value) return false
      return true
    })
    .sort((a, b) => {
      if (a.repeatCount !== b.repeatCount) return b.repeatCount - a.repeatCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
})

const selectedComplaint = computed(() => store.selectedComplaint)

const complaintStallName = computed(() => {
  if (!selectedComplaint.value) return ''
  const s = store.stalls.find((st) => st.id === selectedComplaint.value!.stallId)
  return s ? s.name : ''
})

function statusBadge(status: ComplaintStatus) {
  const map = {
    pending: { text: '待处理', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    processing: { text: '处理中', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    resolved: { text: '已解决', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  }
  return map[status]
}

function getStallName(stallId: string) {
  return store.stalls.find((s) => s.id === stallId)?.name || stallId
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
            placeholder="搜索投诉内容..."
            class="w-full pl-8 pr-3 py-1.5 bg-night-700 border border-night-600 rounded-md text-xs text-night-200 placeholder-night-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
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
        <table class="w-full text-xs">
          <thead class="sticky top-0 z-10">
            <tr class="bg-night-800 text-night-400">
              <th class="text-left px-3 py-2 font-medium">摊位</th>
              <th class="text-left px-3 py-2 font-medium">投诉内容</th>
              <th class="text-left px-3 py-2 font-medium">录音</th>
              <th class="text-left px-3 py-2 font-medium">重复</th>
              <th class="text-left px-3 py-2 font-medium">状态</th>
              <th class="text-left px-3 py-2 font-medium">时间</th>
              <th class="text-left px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredComplaints"
              :key="c.id"
              :class="[
                'border-t border-night-700/50 cursor-pointer transition-colors',
                store.selectedComplaintId === c.id
                  ? 'bg-blue-500/10 hover:bg-blue-500/15'
                  : 'hover:bg-night-700/50',
                c.repeatCount >= 3 ? 'bg-yellow-500/5' : '',
              ]"
              @click="store.selectComplaint(c.id)"
            >
              <td class="px-3 py-2 text-night-200">{{ getStallName(c.stallId) }}</td>
              <td class="px-3 py-2 text-night-300 max-w-[250px] truncate">{{ c.content }}</td>
              <td class="px-3 py-2">
                <span v-if="c.recordingUrl" class="flex items-center gap-1 text-blue-400">
                  <Mic class="w-3 h-3" />
                  {{ formatDuration(c.recordingDuration) }}
                </span>
                <span v-else class="text-night-500">无</span>
              </td>
              <td class="px-3 py-2">
                <span
                  v-if="c.repeatCount >= 2"
                  class="flex items-center gap-0.5 text-yellow-400 font-medium"
                >
                  <AlertTriangle class="w-3 h-3" />
                  {{ c.repeatCount }}次
                </span>
                <span v-else class="text-night-500">{{ c.repeatCount }}次</span>
              </td>
              <td class="px-3 py-2">
                <span
                  :class="['inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium', statusBadge(c.status).cls]"
                >
                  {{ statusBadge(c.status).text }}
                </span>
              </td>
              <td class="px-3 py-2 text-night-400 whitespace-nowrap">{{ c.createdAt }}</td>
              <td class="px-3 py-2">
                <button
                  v-if="store.currentRole === 'street_staff' && c.status === 'pending'"
                  @click.stop="store.updateComplaintStatus(c.id, 'processing')"
                  class="p-1 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                  title="开始处理"
                >
                  <Loader2 class="w-3.5 h-3.5" />
                </button>
                <button
                  v-if="store.currentRole === 'street_staff' && c.status === 'processing'"
                  @click.stop="store.updateComplaintStatus(c.id, 'resolved')"
                  class="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                  title="标记解决"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="selectedComplaint"
      class="w-[400px] flex flex-col bg-night-800 border-l border-night-700 ml-3"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-night-700">
        <h3 class="text-sm font-semibold text-night-200">投诉详情</h3>
        <button
          @click="store.selectComplaint(null)"
          class="p-1 rounded hover:bg-night-700 text-night-400 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs text-night-400">关联摊位</span>
          <span class="text-xs text-night-200 font-medium">{{ complaintStallName }}</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-night-400">投诉状态</span>
          <span :class="['text-xs px-1.5 py-0.5 rounded border', statusBadge(selectedComplaint.status).cls]">
            {{ statusBadge(selectedComplaint.status).text }}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-night-400">重复投诉</span>
          <span
            :class="[
              'text-xs font-medium',
              selectedComplaint.repeatCount >= 2 ? 'text-yellow-400' : 'text-night-300',
            ]"
          >
            {{ selectedComplaint.repeatCount }}次
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-night-400">投诉时间</span>
          <span class="text-xs text-night-300">{{ selectedComplaint.createdAt }}</span>
        </div>

        <div v-if="selectedComplaint.resolvedAt" class="flex items-center justify-between">
          <span class="text-xs text-night-400">解决时间</span>
          <span class="text-xs text-emerald-400">{{ selectedComplaint.resolvedAt }}</span>
        </div>

        <div class="border-t border-night-700 pt-3">
          <span class="text-xs text-night-400 block mb-2">投诉内容</span>
          <p class="text-xs text-night-200 leading-relaxed bg-night-700/50 p-3 rounded-md">
            {{ selectedComplaint.content }}
          </p>
        </div>

        <div
          v-if="selectedComplaint.recordingUrl"
          class="border-t border-night-700 pt-3"
        >
          <div class="flex items-center gap-1.5 mb-2">
            <Mic class="w-3.5 h-3.5 text-blue-400" />
            <span class="text-xs text-night-300 font-medium">投诉录音</span>
          </div>
          <div v-if="selectedComplaint.recordingCaller" class="flex items-center gap-1.5 mb-2">
            <span class="text-[10px] text-night-500">来电人：</span>
            <span class="text-[10px] text-night-300">{{ selectedComplaint.recordingCaller }}</span>
          </div>
          <div class="bg-night-700/50 p-3 rounded-md">
            <div class="flex items-center gap-3">
              <button
                @click="toggleRecording(selectedComplaint.id)"
                :class="[
                  'p-2 rounded-full transition-colors shrink-0',
                  playingRecordingId === selectedComplaint.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white',
                ]"
              >
                <Pause v-if="playingRecordingId === selectedComplaint.id" class="w-4 h-4" />
                <Play v-else class="w-4 h-4" />
              </button>
              <div class="flex-1 min-w-0">
                <div class="h-1.5 bg-night-600 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-500 rounded-full transition-all duration-200"
                    :style="{ width: (recordingProgress[selectedComplaint.id] || 0) + '%' }"
                  ></div>
                </div>
                <div class="flex items-center justify-between mt-1">
                  <span class="text-[10px] text-night-400">
                    {{
                      formatDuration(
                        Math.floor(
                          ((recordingProgress[selectedComplaint.id] || 0) / 100) *
                          selectedComplaint.recordingDuration,
                        ),
                      )
                    }}
                  </span>
                  <span class="text-[10px] text-night-500">
                    {{ formatDuration(selectedComplaint.recordingDuration) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 mt-2 pt-2 border-t border-night-600/50">
              <Volume2 class="w-3 h-3 text-night-500" />
              <div class="flex gap-px">
                <div
                  v-for="i in 20"
                  :key="i"
                  :class="[
                    'w-1 rounded-full transition-all',
                    playingRecordingId === selectedComplaint.id
                      ? i % 3 === 0 ? 'h-2 bg-blue-400' : i % 2 === 0 ? 'h-3 bg-blue-400' : 'h-1.5 bg-blue-400/60'
                      : 'h-1 bg-night-500',
                  ]"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="border-t border-night-700 pt-3"
        >
          <div class="flex items-center gap-1.5 mb-1">
            <VolumeX class="w-3.5 h-3.5 text-night-500" />
            <span class="text-xs text-night-500">暂无录音</span>
          </div>
          <p class="text-[10px] text-night-600">该投诉为文字投诉，未附带录音材料</p>
        </div>

        <div
          v-if="store.currentRole === 'street_staff' && selectedComplaint.status !== 'resolved'"
          class="border-t border-night-700 pt-3 flex gap-2"
        >
          <button
            v-if="selectedComplaint.status === 'pending'"
            @click="store.updateComplaintStatus(selectedComplaint.id, 'processing')"
            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors"
          >
            <Loader2 class="w-3.5 h-3.5" />
            开始处理
          </button>
          <button
            v-if="selectedComplaint.status === 'processing'"
            @click="store.updateComplaintStatus(selectedComplaint.id, 'resolved')"
            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium transition-colors"
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
            标记解决
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
