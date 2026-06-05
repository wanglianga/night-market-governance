<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNightMarketStore } from '@/stores/nightMarket'
import {
  Wind,
  Volume2,
  Maximize2,
  Camera,
  Send,
  ChevronDown,
} from 'lucide-vue-next'
import type { RoadOccupationLevel } from '@/types'

const store = useNightMarketStore()

const selectedStallId = ref('')
const oilFumeValue = ref(0)
const noiseLevel = ref(0)
const roadOccupation = ref<RoadOccupationLevel>('none')
const submitted = ref(false)

const stallOptions = computed(() =>
  store.stalls.filter((s) => s.auditStatus === 'approved'),
)

const roadOptions: { value: RoadOccupationLevel; label: string; color: string }[] = [
  { value: 'none', label: '无占道', color: 'text-emerald-400' },
  { value: 'slight', label: '轻微占道', color: 'text-green-400' },
  { value: 'moderate', label: '中度占道', color: 'text-amber-400' },
  { value: 'severe', label: '严重占道', color: 'text-red-400' },
]

function oilFumeColor(val: number) {
  if (val <= 2) return 'text-emerald-400'
  if (val <= 4) return 'text-amber-400'
  return 'text-red-400'
}

function noiseColor(val: number) {
  if (val <= 55) return 'text-emerald-400'
  if (val <= 70) return 'text-amber-400'
  return 'text-red-400'
}

function submitInspection() {
  if (!selectedStallId.value) return
  store.addInspection({
    stallId: selectedStallId.value,
    oilFumeValue: oilFumeValue.value,
    roadOccupation: roadOccupation.value,
    noiseLevel: noiseLevel.value,
  })
  submitted.value = true
  setTimeout(() => {
    submitted.value = false
    oilFumeValue.value = 0
    noiseLevel.value = 0
    roadOccupation.value = 'none'
  }, 1500)
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <div class="bg-night-800 rounded-lg border border-night-700 p-5 space-y-5">
      <div>
        <label class="block text-xs text-night-400 mb-1.5">选择摊位</label>
        <div class="relative">
          <select
            v-model="selectedStallId"
            class="w-full px-3 py-2 bg-night-700 border border-night-600 rounded-md text-xs text-night-200 appearance-none focus:outline-none focus:border-blue-500/50"
          >
            <option value="">请选择摊位</option>
            <option v-for="s in stallOptions" :key="s.id" :value="s.id">
              {{ s.id }} - {{ s.name }} ({{ s.vendorName }})
            </option>
          </select>
          <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-night-500 pointer-events-none" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-night-700/50 rounded-lg p-4 border border-night-600/50">
          <div class="flex items-center gap-2 mb-3">
            <Wind class="w-4 h-4 text-blue-400" />
            <span class="text-xs font-medium text-night-300">油烟检测</span>
          </div>
          <div class="flex items-center gap-3 mb-2">
            <span :class="['text-2xl font-bold tabular-nums', oilFumeColor(oilFumeValue)]">
              {{ oilFumeValue.toFixed(1) }}
            </span>
            <span class="text-xs text-night-500">mg/m³</span>
          </div>
          <input
            type="range"
            v-model.number="oilFumeValue"
            min="0"
            max="10"
            step="0.1"
            class="w-full"
          />
          <div class="flex justify-between text-[10px] text-night-500 mt-1">
            <span>0</span>
            <span class="text-amber-400">2.0 标准</span>
            <span>10</span>
          </div>
        </div>

        <div class="bg-night-700/50 rounded-lg p-4 border border-night-600/50">
          <div class="flex items-center gap-2 mb-3">
            <Volume2 class="w-4 h-4 text-purple-400" />
            <span class="text-xs font-medium text-night-300">噪声检测</span>
          </div>
          <div class="flex items-center gap-3 mb-2">
            <span :class="['text-2xl font-bold tabular-nums', noiseColor(noiseLevel)]">
              {{ noiseLevel }}
            </span>
            <span class="text-xs text-night-500">dB</span>
          </div>
          <input
            type="range"
            v-model.number="noiseLevel"
            min="30"
            max="100"
            step="1"
            class="w-full"
          />
          <div class="flex justify-between text-[10px] text-night-500 mt-1">
            <span>30</span>
            <span class="text-amber-400">55dB 标准</span>
            <span>100</span>
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-3">
          <Maximize2 class="w-4 h-4 text-amber-400" />
          <span class="text-xs font-medium text-night-300">占道情况</span>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="opt in roadOptions"
            :key="opt.value"
            @click="roadOccupation = opt.value"
            :class="[
              'px-3 py-2 rounded-md text-xs font-medium transition-all border',
              roadOccupation === opt.value
                ? 'bg-night-600 border-night-500 text-night-200'
                : 'bg-night-700/50 border-night-600/50 text-night-400 hover:bg-night-700',
            ]"
          >
            <span :class="opt.color">{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-3">
          <Camera class="w-4 h-4 text-emerald-400" />
          <span class="text-xs font-medium text-night-300">现场照片</span>
        </div>
        <div class="border-2 border-dashed border-night-600 rounded-lg p-6 text-center">
          <Camera class="w-8 h-8 text-night-500 mx-auto mb-2" />
          <p class="text-xs text-night-400">点击或拖拽上传现场照片</p>
          <p class="text-[10px] text-night-500 mt-1">支持 JPG、PNG，单张不超过 5MB</p>
        </div>
      </div>

      <button
        @click="submitInspection"
        :disabled="!selectedStallId || submitted"
        :class="[
          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-medium transition-all',
          submitted
            ? 'bg-emerald-600 text-white'
            : selectedStallId
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-night-600 text-night-400 cursor-not-allowed',
        ]"
      >
        <CheckCircle2 v-if="submitted" class="w-4 h-4" />
        <Send v-else class="w-4 h-4" />
        {{ submitted ? '录入成功' : '提交巡查记录' }}
      </button>
    </div>

    <div v-if="store.inspections.length > 0" class="mt-4 bg-night-800 rounded-lg border border-night-700 p-4">
      <h4 class="text-xs font-medium text-night-300 mb-3">最近巡查记录</h4>
      <div class="space-y-2 max-h-[240px] overflow-y-auto">
        <div
          v-for="insp in [...store.inspections].reverse().slice(0, 10)"
          :key="insp.id"
          class="flex items-center gap-3 p-2 rounded-md bg-night-700/30"
        >
          <span class="text-[10px] text-night-500 whitespace-nowrap">{{ insp.createdAt }}</span>
          <span class="text-xs text-night-300">{{ store.stalls.find(s => s.id === insp.stallId)?.name || insp.stallId }}</span>
          <span :class="['text-xs font-medium ml-auto', oilFumeColor(insp.oilFumeValue)]">
            油烟 {{ insp.oilFumeValue.toFixed(1) }}
          </span>
          <span :class="['text-xs font-medium', noiseColor(insp.noiseLevel)]">
            噪声 {{ insp.noiseLevel }}dB
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
