<template>
  <div class="card">
    <span class="date-label">📅 {{ formatDate(data.date) }}</span>

    <div v-if="data.answered && meetsMinWords" class="status-badge status-answered">
      ✓ 今日已完成
    </div>
    <div v-else-if="data.answered && !meetsMinWords" class="status-badge status-partial">
      ⚠️ 已回答未达标
    </div>
    <div v-else class="status-badge status-unanswered">
      ⏰ 等待你的回答
    </div>

    <div v-if="data.monthProgress" class="month-progress-bar">
      <div class="progress-info">
        <span class="progress-label">🎯 本月目标</span>
        <span class="progress-text">
          {{ data.monthProgress.metMinWordsDays }} / {{ data.monthProgress.targetDays }} 天
          ({{ data.monthProgress.progressPercent }}%)
        </span>
      </div>
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: data.monthProgress.progressPercent + '%' }"
          :class="{ complete: data.monthProgress.progressPercent >= 100 }"
        ></div>
      </div>
      <div v-if="data.monthProgress.answeredDays > data.monthProgress.metMinWordsDays" class="progress-hint">
        💡 还有 {{ data.monthProgress.answeredDays - data.monthProgress.metMinWordsDays }} 天回答未达最低字数，可修改后计入目标
      </div>
    </div>

    <div class="question-text">
      {{ data.question.question }}
    </div>

    <div class="answer-header">
      <label class="answer-label">✍️ 我的回答：</label>
      <div class="word-count" :class="{ 'warning': !meetsMinWords && hasContent }">
        <span class="word-count-icon">{{ meetsMinWords ? '✅' : '📝' }}</span>
        <span>{{ currentWordCount }} 字</span>
        <span v-if="data.goals?.minWords > 0" class="word-target">
          / {{ data.goals.minWords }} 字目标
        </span>
      </div>
    </div>

    <textarea
      v-model="localAnswer"
      class="answer-textarea"
      placeholder="在这里写下你的思考和答案..."
      :disabled="submitting"
      @input="onInput"
    ></textarea>

    <div v-if="showWarning" class="word-warning">
      <span class="warning-icon">⚠️</span>
      <span>当前 {{ currentWordCount }} 字，未达到最低 {{ data.goals.minWords }} 字的目标。继续加油！</span>
    </div>

    <button
      class="submit-btn"
      :disabled="submitting || !localAnswer.trim()"
      @click="handleSubmit"
    >
      {{ submitting ? '保存中...' : '💾 保存回答' }}
    </button>

    <div v-if="data.answered && data.answer" class="displayed-answer">
      <h4>📝 已保存的回答：</h4>
      <p>{{ data.answer }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  todayData: Object,
  submitting: Boolean
})

const emit = defineEmits(['submit'])

const data = ref(props.todayData)
const localAnswer = ref('')

const currentWordCount = computed(() => {
  return localAnswer.value.trim().length
})

const hasContent = computed(() => {
  return localAnswer.value.trim().length > 0
})

const meetsMinWords = computed(() => {
  if (!props.todayData?.goals?.minWords) return true
  return currentWordCount.value >= props.todayData.goals.minWords
})

const showWarning = computed(() => {
  if (!props.todayData?.goals?.minWords) return false
  if (props.todayData.goals.minWords <= 0) return false
  if (!hasContent.value) return false
  return !meetsMinWords.value
})

watch(() => props.todayData, (newVal) => {
  if (newVal) {
    data.value = newVal
    localAnswer.value = newVal.answer || ''
  }
}, { immediate: true })

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
}

function onInput() {
}

function handleSubmit() {
  emit('submit', localAnswer.value)
}
</script>

<style scoped>
.month-progress-bar {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f6f9fc 0%, #edf2f7 100%);
  border-radius: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-label {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
}

.progress-text {
  font-weight: 600;
  color: #764ba2;
  font-size: 0.9rem;
}

.progress-track {
  height: 10px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-fill.complete {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.progress-hint {
  margin-top: 10px;
  font-size: 0.8rem;
  color: #718096;
  text-align: center;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.answer-label {
  font-size: 1rem;
  font-weight: 600;
  color: #4a5568;
  display: block;
  margin-bottom: 0;
}

.word-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #718096;
  font-weight: 500;
  padding: 6px 12px;
  background: #f7fafc;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.word-count.warning {
  color: #d69e2e;
  background: #fffbeb;
  border-color: #fbd38d;
}

.word-count-icon {
  font-size: 0.9rem;
}

.word-target {
  color: #a0aec0;
  font-size: 0.85rem;
}

.word-warning {
  margin-top: 12px;
  padding: 12px 16px;
  background: #fffbeb;
  border: 1px solid #fbd38d;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.9rem;
  color: #975a16;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.warning-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.status-partial {
  background: #fff3cd;
  color: #856404;
}
</style>
