<template>
  <div class="container">
    <div class="header">
      <h1>💡 每日问答</h1>
      <p>每天一个问题，激发深度思考，记录成长轨迹</p>
    </div>

    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'today' }"
        @click="currentTab = 'today'"
      >
        今日问题
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'history' }"
        @click="currentTab = 'history'; loadHistory()"
      >
        历史记录
      </button>
      <button
        class="tab-btn settings-btn"
        @click="showGoalSettings = true"
        title="设置写作目标"
      >
        🎯 目标
      </button>
    </div>

    <div v-if="loading || !todayData" class="loading">加载中...</div>

    <TodayView
      v-else-if="currentTab === 'today'"
      :today-data="todayData"
      :submitting="submitting"
      @submit="submitAnswer"
    />

    <HistoryView
      v-else-if="currentTab === 'history'"
      :history="history"
      :loading="historyLoading"
      @prev-month="prevMonth"
      @next-month="nextMonth"
      @open-goals="showGoalSettings = true"
    />

    <GoalSettings
      :visible="showGoalSettings"
      :goals="goals"
      :saving="savingGoals"
      @close="showGoalSettings = false"
      @save="saveGoals"
    />

    <div v-if="toast.show" class="toast" :class="{ error: toast.isError }">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import TodayView from './components/TodayView.vue'
import HistoryView from './components/HistoryView.vue'
import GoalSettings from './components/GoalSettings.vue'

const currentTab = ref('today')
const loading = ref(false)
const submitting = ref(false)
const todayData = ref(null)
const history = ref(null)
const historyLoading = ref(false)
const goals = ref(null)
const showGoalSettings = ref(false)
const savingGoals = ref(false)

const toast = reactive({
  show: false,
  message: '',
  isError: false
})

function showToast(message, isError = false) {
  toast.message = message
  toast.isError = isError
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

async function loadToday() {
  loading.value = true
  try {
    const res = await fetch('/api/today')
    const json = await res.json()
    if (json.success) {
      todayData.value = json.data
      if (json.data.goals) {
        goals.value = json.data.goals
      }
    } else {
      showToast('加载失败', true)
    }
  } catch (e) {
    showToast('网络错误', true)
  } finally {
    loading.value = false
  }
}

async function submitAnswer(answer) {
  submitting.value = true
  try {
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer })
    })
    const json = await res.json()
    if (json.success) {
      showToast('回答已保存 ✓')
      await loadToday()
    } else {
      showToast(json.message || '保存失败', true)
    }
  } catch (e) {
    showToast('网络错误', true)
  } finally {
    submitting.value = false
  }
}

const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth() + 1)

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await fetch(`/api/history?year=${viewYear.value}&month=${viewMonth.value}`)
    const json = await res.json()
    if (json.success) {
      history.value = json.data
      if (json.data.goals) {
        goals.value = json.data.goals
      }
    }
  } catch (e) {
    showToast('加载历史失败', true)
  } finally {
    historyLoading.value = false
  }
}

function prevMonth() {
  if (viewMonth.value === 1) {
    viewMonth.value = 12
    viewYear.value--
  } else {
    viewMonth.value--
  }
  loadHistory()
}

function nextMonth() {
  if (viewMonth.value === 12) {
    viewMonth.value = 1
    viewYear.value++
  } else {
    viewMonth.value++
  }
  loadHistory()
}

async function saveGoals(newGoals) {
  savingGoals.value = true
  try {
    const res = await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGoals)
    })
    const json = await res.json()
    if (json.success) {
      goals.value = json.data
      showToast('目标设置已保存 ✓')
      showGoalSettings.value = false
      await Promise.all([
        loadToday(),
        currentTab.value === 'history' ? loadHistory() : Promise.resolve()
      ])
    } else {
      showToast(json.message || '保存失败', true)
    }
  } catch (e) {
    showToast('网络错误', true)
  } finally {
    savingGoals.value = false
  }
}

onMounted(() => {
  loadToday()
})
</script>

<style scoped>
.tabs {
  position: relative;
}

.settings-btn {
  background: rgba(255, 255, 255, 0.15);
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
