<script setup lang="ts">
import { useNightMarketStore } from '@/stores/nightMarket'
import { Shield, Eye } from 'lucide-vue-next'

const store = useNightMarketStore()
</script>

<template>
  <div class="flex items-center gap-1 bg-night-800 rounded-lg p-1">
    <button
      @click="store.setRole('street_staff')"
      :class="[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
        store.currentRole === 'street_staff'
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-night-400 hover:text-night-300 hover:bg-night-700',
      ]"
    >
      <Shield class="w-3.5 h-3.5" />
      街道工作人员
    </button>
    <button
      @click="store.setRole('inspector')"
      :class="[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
        store.currentRole === 'inspector'
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'text-night-400 hover:text-night-300 hover:bg-night-700',
      ]"
    >
      <Eye class="w-3.5 h-3.5" />
      现场巡查员
    </button>
  </div>
</template>
