<script setup lang="ts">
import { useNightMarketStore } from '@/stores/nightMarket'
import RoleSwitch from '@/components/RoleSwitch.vue'
import StatBar from '@/components/StatBar.vue'
import StallList from '@/components/StallList.vue'
import StallDetail from '@/components/StallDetail.vue'
import ComplaintDetail from '@/components/ComplaintDetail.vue'
import InspectionInput from '@/components/InspectionInput.vue'
import RectificationCompare from '@/components/RectificationCompare.vue'
import {
  Store,
  MessageSquare,
  ClipboardCheck,
  ArrowLeftRight,
  Moon,
} from 'lucide-vue-next'
import type { WorkTab } from '@/types'

const store = useNightMarketStore()

const tabs: { key: WorkTab; label: string; icon: any }[] = [
  { key: 'stalls', label: '摊位列表', icon: Store },
  { key: 'complaints', label: '投诉详情', icon: MessageSquare },
  { key: 'inspection', label: '巡查录入', icon: ClipboardCheck },
  { key: 'rectification', label: '整改对比', icon: ArrowLeftRight },
]
</script>

<template>
  <div class="h-screen flex flex-col bg-night-900">
    <header class="shrink-0 border-b border-night-700 bg-night-800/80 backdrop-blur-sm">
      <div class="flex items-center justify-between px-5 py-2.5">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <Moon class="w-5 h-5 text-blue-400" />
            <h1 class="text-sm font-bold text-night-200 tracking-wide">夜市治理工作台</h1>
          </div>
          <span class="text-[10px] text-night-500 border-l border-night-600 pl-3">
            城南街道 · 2025年夜市管理
          </span>
        </div>
        <RoleSwitch />
        <div class="flex items-center gap-1 ml-2">
          <button
            @click="store.resetAllData(); location.reload()"
            class="px-2 py-1 rounded text-[10px] text-night-500 hover:text-night-300 hover:bg-night-700 transition-colors"
            title="清除本地数据并重载"
          >
            重置数据
          </button>
          <button
            @click="store.injectOldTestData(); location.reload()"
            class="px-2 py-1 rounded text-[10px] text-night-500 hover:text-amber-400 hover:bg-night-700 transition-colors"
            title="注入旧版数据（无录音无照片）后重载，模拟升级"
          >
            模拟升级
          </button>
        </div>
      </div>

      <div class="px-5 pb-2.5">
        <StatBar />
      </div>
    </header>

    <nav class="shrink-0 flex items-center gap-1 px-5 pt-2 bg-night-900">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="store.setActiveTab(tab.key)"
        :class="[
          'flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all rounded-t-md border-b-2',
          store.activeTab === tab.key
            ? 'bg-night-800 text-blue-400 border-blue-400'
            : 'text-night-400 hover:text-night-300 border-transparent hover:bg-night-800/50',
        ]"
      >
        <component :is="tab.icon" class="w-3.5 h-3.5" />
        {{ tab.label }}
      </button>
    </nav>

    <main class="flex-1 overflow-hidden px-5 pb-4">
      <div class="h-full bg-night-800 rounded-b-lg border border-night-700 border-t-0 flex">
        <div
          :class="[
            'flex-1 overflow-hidden',
            store.activeTab === 'inspection' ? 'overflow-y-auto' : '',
          ]"
        >
          <StallList v-if="store.activeTab === 'stalls'" />
          <ComplaintDetail v-else-if="store.activeTab === 'complaints'" />
          <InspectionInput v-else-if="store.activeTab === 'inspection'" />
          <RectificationCompare v-else-if="store.activeTab === 'rectification'" />
        </div>

        <StallDetail
          v-if="store.activeTab === 'stalls' && store.selectedStallId"
          class="w-[340px] shrink-0"
        />
      </div>
    </main>
  </div>
</template>
