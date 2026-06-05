<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useNightMarketStore } from '@/stores/nightMarket'
import {
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Camera,
  ZoomIn,
  X,
  ImageIcon,
} from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const store = useNightMarketStore()
const selectedStallId = ref('')
const showChart = ref(false)
const lightboxUrl = ref('')
const lightboxLabel = ref('')

const stallOptions = computed(() =>
  store.stalls.filter((s) => {
    const hasRect = store.rectifications.some((r) => r.stallId === s.id)
    const hasInsp = store.inspections.some((i) => i.stallId === s.id)
    return hasRect || hasInsp
  }),
)

const stallRectifications = computed(() => {
  if (!selectedStallId.value) return []
  return store.rectifications.filter((r) => r.stallId === selectedStallId.value)
})

const stallInspections = computed(() => {
  if (!selectedStallId.value) return []
  return store.inspections
    .filter((i) => i.stallId === selectedStallId.value)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})

const oilFumeChartData = computed(() => {
  if (stallInspections.value.length === 0) return null
  return {
    labels: stallInspections.value.map((i) => {
      const d = new Date(i.createdAt)
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`
    }),
    datasets: [
      {
        label: '油烟浓度 (mg/m³)',
        data: stallInspections.value.map((i) => i.oilFumeValue),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#1e293b',
        pointBorderWidth: 2,
      },
      {
        label: '标准线 (2.0 mg/m³)',
        data: stallInspections.value.map(() => 2.0),
        borderColor: '#f97316',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#94a3b8',
        font: { size: 11 },
      },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      borderColor: '#334155',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { color: '#1e293b' },
    },
    y: {
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { color: '#1e293b' },
      min: 0,
    },
  },
}

function rectStatusBadge(status: string) {
  const map: Record<string, { text: string; cls: string }> = {
    pending: { text: '待整改', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    in_progress: { text: '整改中', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    completed: { text: '已完成', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  }
  return map[status] || { text: status, cls: 'bg-night-600 text-night-400 border-night-600' }
}

function openLightbox(url: string, label: string) {
  lightboxUrl.value = url
  lightboxLabel.value = label
}

function closeLightbox() {
  lightboxUrl.value = ''
  lightboxLabel.value = ''
}

watch(selectedStallId, () => {
  showChart.value = false
  setTimeout(() => {
    if (stallInspections.value.length > 0) showChart.value = true
  }, 100)
})
</script>

<template>
  <div class="flex h-full gap-4 relative">
    <div class="w-[320px] flex flex-col shrink-0">
      <div class="bg-night-800 rounded-lg border border-night-700 p-4 mb-3">
        <label class="block text-xs text-night-400 mb-1.5">选择摊位</label>
        <select
          v-model="selectedStallId"
          class="w-full px-3 py-2 bg-night-700 border border-night-600 rounded-md text-xs text-night-200 appearance-none focus:outline-none focus:border-blue-500/50"
        >
          <option value="">请选择摊位</option>
          <option v-for="s in stallOptions" :key="s.id" :value="s.id">
            {{ s.id }} - {{ s.name }}
          </option>
        </select>
      </div>

      <div v-if="selectedStallId" class="flex-1 overflow-y-auto space-y-3">
        <h4 class="text-xs font-medium text-night-300 px-1 mb-2">整改记录</h4>
        <div
          v-for="r in stallRectifications"
          :key="r.id"
          class="bg-night-800 rounded-lg border border-night-700 p-3"
        >
          <div class="flex items-center justify-between mb-2">
            <span :class="['text-[10px] px-1.5 py-0.5 rounded border font-medium', rectStatusBadge(r.status).cls]">
              {{ rectStatusBadge(r.status).text }}
            </span>
            <span class="text-[10px] text-night-500">{{ r.createdAt }}</span>
          </div>
          <p class="text-[11px] text-night-300 leading-relaxed mb-3">{{ r.description }}</p>

          <div class="border-t border-night-700 pt-2">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="text-[10px] text-red-400/80 block mb-1.5 flex items-center gap-1">
                  <Camera class="w-3 h-3" />
                  整改前
                </span>
                <div
                  v-if="r.beforePhotos.length > 0"
                  class="relative group rounded-md overflow-hidden border border-night-600/50 cursor-pointer"
                  @click="openLightbox(r.beforePhotos[0], '整改前')"
                >
                  <img
                    :src="r.beforePhotos[0]"
                    alt="整改前"
                    class="w-full h-24 object-cover"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div v-else class="bg-night-700/50 rounded-md h-24 flex items-center justify-center border border-night-600/50">
                  <ImageIcon class="w-5 h-5 text-night-500" />
                </div>
              </div>
              <div>
                <span class="text-[10px] text-emerald-400/80 block mb-1.5 flex items-center gap-1">
                  <Camera class="w-3 h-3" />
                  整改后
                </span>
                <div
                  v-if="r.afterPhotos.length > 0"
                  class="relative group rounded-md overflow-hidden border border-emerald-500/30 cursor-pointer"
                  @click="openLightbox(r.afterPhotos[0], '整改后')"
                >
                  <img
                    :src="r.afterPhotos[0]"
                    alt="整改后"
                    class="w-full h-24 object-cover"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div v-else-if="r.status === 'completed'" class="bg-emerald-500/5 rounded-md h-24 flex items-center justify-center border border-emerald-500/20">
                  <div class="text-center">
                    <Camera class="w-5 h-5 text-emerald-500/50 mx-auto" />
                    <span class="text-[9px] text-emerald-500/50 block mt-1">已整改</span>
                  </div>
                </div>
                <div v-else class="bg-night-700/50 rounded-md h-24 flex items-center justify-center border border-night-600/50">
                  <div class="text-center">
                    <Camera class="w-5 h-5 text-night-500 mx-auto" />
                    <span class="text-[9px] text-night-500 block mt-1">待整改</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2 mt-3" v-if="r.status !== 'completed'">
            <button
              v-if="r.status === 'pending' && store.currentRole === 'inspector'"
              @click="store.updateRectificationStatus(r.id, 'in_progress')"
              class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-medium transition-colors"
            >
              <Loader2 class="w-3 h-3" />
              开始整改
            </button>
            <button
              v-if="r.status === 'in_progress' && store.currentRole === 'inspector'"
              @click="store.updateRectificationStatus(r.id, 'completed')"
              class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium transition-colors"
            >
              <CheckCircle2 class="w-3 h-3" />
              确认完成
            </button>
          </div>
        </div>

        <div v-if="stallRectifications.length === 0" class="text-xs text-night-500 text-center py-4">
          该摊位暂无整改记录
        </div>
      </div>
    </div>

    <div v-if="selectedStallId" class="flex-1 flex flex-col min-w-0">
      <div class="bg-night-800 rounded-lg border border-night-700 p-4 flex-1 flex flex-col">
        <div class="flex items-center gap-2 mb-4">
          <TrendingUp class="w-4 h-4 text-blue-400" />
          <span class="text-sm font-medium text-night-200">油烟趋势</span>
          <span v-if="stallInspections.length" class="text-[10px] text-night-500">
            ({{ stallInspections.length }}条记录)
          </span>
        </div>

        <div v-if="showChart && oilFumeChartData" class="flex-1 min-h-[280px]">
          <Line :data="oilFumeChartData" :options="chartOptions" />
        </div>
        <div v-else-if="stallInspections.length === 0" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <TrendingUp class="w-10 h-10 text-night-600 mx-auto mb-2" />
            <p class="text-xs text-night-500">暂无油烟检测数据</p>
          </div>
        </div>
      </div>

      <div v-if="stallInspections.length > 0" class="bg-night-800 rounded-lg border border-night-700 p-4 mt-3">
        <h4 class="text-xs font-medium text-night-300 mb-3">巡查数据明细</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-night-400">
                <th class="text-left px-3 py-1.5 font-medium">时间</th>
                <th class="text-left px-3 py-1.5 font-medium">油烟</th>
                <th class="text-left px-3 py-1.5 font-medium">噪声</th>
                <th class="text-left px-3 py-1.5 font-medium">占道</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="insp in [...stallInspections].reverse()"
                :key="insp.id"
                class="border-t border-night-700/50"
              >
                <td class="px-3 py-1.5 text-night-400">{{ insp.createdAt }}</td>
                <td class="px-3 py-1.5">
                  <span :class="insp.oilFumeValue > 2 ? 'text-red-400 font-medium' : 'text-emerald-400'">
                    {{ insp.oilFumeValue.toFixed(1) }} mg/m³
                  </span>
                </td>
                <td class="px-3 py-1.5">
                  <span :class="insp.noiseLevel > 55 ? 'text-amber-400' : 'text-emerald-400'">
                    {{ insp.noiseLevel }} dB
                  </span>
                </td>
                <td class="px-3 py-1.5">
                  <span :class="{
                    'text-emerald-400': insp.roadOccupation === 'none',
                    'text-green-400': insp.roadOccupation === 'slight',
                    'text-amber-400': insp.roadOccupation === 'moderate',
                    'text-red-400': insp.roadOccupation === 'severe',
                  }">
                    {{ { none: '无', slight: '轻微', moderate: '中度', severe: '严重' }[insp.roadOccupation] }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="!selectedStallId" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <ArrowLeftRight class="w-12 h-12 text-night-600 mx-auto mb-3" />
        <p class="text-sm text-night-500">请选择摊位查看整改对比和油烟趋势</p>
        <p class="text-xs text-night-600 mt-1">左侧选择有整改记录或巡查数据的摊位</p>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="lightboxUrl"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        @click.self="closeLightbox"
      >
        <div class="relative max-w-3xl max-h-[80vh] mx-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-night-300 font-medium">{{ lightboxLabel }}</span>
            <button
              @click="closeLightbox"
              class="p-1.5 rounded-full bg-night-700 hover:bg-night-600 text-night-300 transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <img
            :src="lightboxUrl"
            :alt="lightboxLabel"
            class="max-w-full max-h-[70vh] rounded-lg border border-night-600 shadow-2xl"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
