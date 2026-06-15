<template>
  <div class="card">
    <div v-if="history && history.monthProgress" class="goal-section">
      <div class="goal-header">
        <h3 class="goal-title">🎯 本月目标</h3>
        <button class="goal-settings-btn" @click="$emit('open-goals')">
          ⚙️ 设置目标
        </button>
      </div>

      <div class="goal-stats">
        <div class="goal-stat-card primary">
          <div class="goal-stat-num">
            {{ history.monthProgress.answeredDays }}
            <span class="goal-stat-unit">/ {{ history.monthProgress.targetDays }}</span>
          </div>
          <div class="goal-stat-label">已完成天数</div>
        </div>
        <div class="goal-stat-card success">
          <div class="goal-stat-num">
            {{ history.monthProgress.progressPercent }}%
          </div>
          <div class="goal-stat-label">目标完成率</div>
        </div>
        <div class="goal-stat-card info">
          <div class="goal-stat-num">
            {{ history.monthProgress.metMinWordsDays }}
          </div>
          <div class="goal-stat-label">达标字数天数</div>
        </div>
      </div>

      <div class="goal-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: history.monthProgress.progressPercent + '%' }"
            :class="{ complete: history.monthProgress.progressPercent >= 100 }"
          ></div>
        </div>
        <div class="progress-hint">
          <span v-if="history.monthProgress.progressPercent < 100">
            还差 {{ history.monthProgress.targetDays - history.monthProgress.answeredDays }} 天完成本月目标
          </span>
          <span v-else class="complete-text">
            🎉 恭喜！本月目标已完成！
          </span>
        </div>
      </div>
    </div>

    <div v-if="history && history.stats" class="stats-panel">
      <div class="stat-card green">
        <div class="stat-num">{{ history.stats.answeredCount }}</div>
        <div class="stat-label">✓ 已回答天数</div>
      </div>
      <div class="stat-card red">
        <div class="stat-num">{{ history.stats.missedCount }}</div>
        <div class="stat-label">✗ 断更天数</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-num">
          {{ history.stats.totalDays > 0 ? Math.round(history.stats.answeredCount / history.stats.totalDays * 100) : 0 }}%
        </div>
        <div class="stat-label">📊 坚持率</div>
      </div>
    </div>

    <div class="calendar-header">
      <button class="nav-btn" @click="$emit('prev-month')">← 上月</button>
      <div class="calendar-title">
        {{ history?.year }}年 {{ history?.month }}月
      </div>
      <button class="nav-btn" @click="$emit('next-month')">下月 →</button>
    </div>

    <div class="calendar-grid">
      <div v-for="w in weekdays" :key="w" class="calendar-weekday">{{ w }}</div>
      <div
        v-for="(day, idx) in fullCalendar"
        :key="idx"
        class="calendar-day"
        :class="getDayClass(day)"
        @click="selectDay(day)"
      >
        <span v-if="day" class="day-num">{{ day.day }}</span>
      </div>
    </div>

    <div class="legend">
      <div class="legend-item">
        <div class="legend-box answered"></div>
        <span>已回答</span>
      </div>
      <div class="legend-item">
        <div class="legend-box missed"></div>
        <span>断更（应回答未答）</span>
      </div>
      <div class="legend-item">
        <div class="legend-box today"></div>
        <span>今天</span>
      </div>
      <div class="legend-item">
        <div class="legend-box empty-day"></div>
        <span>无记录</span>
      </div>
    </div>

    <div v-if="selectedDay" class="day-detail">
      <h4>📌 {{ formatFullDate(selectedDay.date) }}</h4>
      <div v-if="selectedDay.hasQuestion">
        <p class="q-text">❓ {{ selectedDay.question }}</p>
        <div v-if="selectedDay.answered && selectedDay.answer">
          <div class="answer-meta">
            <span class="word-badge">
              📝 {{ selectedDay.wordCount || 0 }} 字
            </span>
          </div>
          <p class="a-text">{{ selectedDay.answer }}</p>
        </div>
        <div v-else class="empty-note">这一天没有回答</div>
      </div>
      <div v-else class="empty-note">这一天还没有分配问题</div>
    </div>

    <div v-if="loading" class="empty-note">加载中...</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  history: Object,
  loading: Boolean
})

defineEmits(['prev-month', 'next-month', 'open-goals'])

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const selectedDay = ref(null)

const fullCalendar = computed(() => {
  if (!props.history?.calendar) return []
  const cal = [...props.history.calendar]
  const firstDay = cal[0]
  if (!firstDay) return cal
  const d = new Date(firstDay.date)
  const firstWeekday = d.getDay()
  for (let i = 0; i < firstWeekday; i++) {
    cal.unshift(null)
  }
  return cal
})

function getTodayStr() {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isPast(dateStr) {
  return dateStr < getTodayStr()
}

function getDayClass(day) {
  if (!day) return 'empty'
  const classes = []
  const todayStr = getTodayStr()
  if (day.date === todayStr) {
    classes.push('today')
  }
  if (day.answered) {
    classes.push('answered')
  } else if (day.hasQuestion && isPast(day.date)) {
    classes.push('missed')
  } else if (day.hasQuestion) {
    classes.push('has-question')
  }
  return classes.join(' ')
}

function selectDay(day) {
  if (day && day.hasQuestion) {
    selectedDay.value = day
  } else {
    selectedDay.value = null
  }
}

function formatFullDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
}

watch(() => props.history, () => {
  selectedDay.value = null
})
</script>

<style scoped>
.goal-section {
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.goal-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.goal-settings-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.goal-settings-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.goal-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.goal-stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 14px 10px;
  text-align: center;
}

.goal-stat-num {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.goal-stat-unit {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.8;
}

.goal-stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
  font-weight: 500;
}

.goal-progress {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px 14px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-fill.complete {
  background: linear-gradient(90deg, #ffe066, #ffd43b);
}

.progress-hint {
  font-size: 0.85rem;
  opacity: 0.9;
  text-align: center;
}

.complete-text {
  font-weight: 600;
}

.answer-meta {
  margin-bottom: 10px;
}

.word-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e9d8fd;
  color: #6b46c1;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
