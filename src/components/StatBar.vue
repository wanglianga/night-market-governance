<script setup lang="ts">
import { useNightMarketStore } from '@/stores/nightMarket'
import { FileCheck, Clock, Wrench, Flame } from 'lucide-vue-next'

const store = useNightMarketStore()

const stats = [
  {
    label: '证照齐全',
    value: () => store.statLicenseComplete,
    total: () => store.stalls.length,
    icon: FileCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  {
    label: '待审核',
    value: () => store.statPendingAudit,
    total: () => store.stalls.length,
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
  {
    label: '整改中',
    value: () => store.statRectifying,
    total: () => store.rectifications.length,
    icon: Wrench,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
  },
  {
    label: '燃气风险',
    value: () => store.statGasRisk,
    total: () => store.stalls.length,
    icon: Flame,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
  },
]
</script>

<template>
  <div class="grid grid-cols-4 gap-3">
    <div
      v-for="stat in stats"
      :key="stat.label"
      :class="[
        'flex items-center gap-3 px-4 py-3 rounded-lg border',
        'bg-night-800 border-night-700',
        stat.border,
      ]"
    >
      <div :class="['p-2 rounded-md', stat.bg]">
        <component :is="stat.icon" :class="['w-4 h-4', stat.color]" />
      </div>
      <div>
        <div :class="['text-lg font-bold leading-tight', stat.color]">
          {{ stat.value() }}
        </div>
        <div class="text-[11px] text-night-400">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>
