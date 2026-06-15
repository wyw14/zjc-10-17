<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>🎯 写作目标设置</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">📅</span>
            本月目标回答天数
          </label>
          <div class="input-wrapper">
            <input
              type="number"
              v-model.number="localTargetDays"
              class="form-input"
              min="0"
              max="31"
              :disabled="saving"
            />
            <span class="input-suffix">天</span>
          </div>
          <p class="form-hint">设置本月想要完成回答的天数目标</p>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">✍️</span>
            单次最低字数
          </label>
          <div class="input-wrapper">
            <input
              type="number"
              v-model.number="localMinWords"
              class="form-input"
              min="0"
              :disabled="saving"
            />
            <span class="input-suffix">字</span>
          </div>
          <p class="form-hint">每次回答的最低字数要求，未达标会提醒但不阻止保存</p>
        </div>

        <div v-if="goals" class="goal-preview">
          <div class="preview-title">💡 设置提示</div>
          <div class="preview-item">
            <span>按每月 {{ goals.targetDays }} 天计算</span>
            <span>平均每 {{ Math.round(30 / goals.targetDays) }} 天回答一次</span>
          </div>
          <div class="preview-item">
            <span>每次最低 {{ goals.minWords }} 字</span>
            <span>约 {{ Math.round(goals.minWords / 50) }} 句话</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')" :disabled="saving">
          取消
        </button>
        <button class="btn btn-primary" @click="handleSave" :disabled="saving">
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  goals: Object,
  saving: Boolean
})

const emit = defineEmits(['close', 'save'])

const localTargetDays = ref(20)
const localMinWords = ref(100)

watch(() => props.goals, (newVal) => {
  if (newVal) {
    localTargetDays.value = newVal.targetDays ?? 20
    localMinWords.value = newVal.minWords ?? 100
  }
}, { immediate: true, deep: true })

function handleSave() {
  emit('save', {
    targetDays: localTargetDays.value,
    minWords: localMinWords.value
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f7fafc;
  color: #4a5568;
}

.modal-body {
  padding: 28px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 10px;
  font-size: 0.95rem;
}

.label-icon {
  font-size: 1.1rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 14px 50px 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #764ba2;
  box-shadow: 0 0 0 4px rgba(118, 75, 162, 0.1);
}

.form-input:disabled {
  background: #f7fafc;
  cursor: not-allowed;
}

.input-suffix {
  position: absolute;
  right: 16px;
  color: #a0aec0;
  font-weight: 500;
  pointer-events: none;
}

.form-hint {
  margin: 8px 0 0 0;
  font-size: 0.85rem;
  color: #718096;
}

.goal-preview {
  margin-top: 28px;
  padding: 20px;
  background: linear-gradient(135deg, #f6f9fc 0%, #edf2f7 100%);
  border-radius: 12px;
  border-left: 4px solid #764ba2;
}

.preview-title {
  font-weight: 600;
  color: #764ba2;
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.9rem;
  color: #4a5568;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.btn {
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-family: inherit;
}

.btn-secondary {
  background: white;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.btn-secondary:hover {
  border-color: #cbd5e0;
  background: #f7fafc;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(118, 75, 162, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(118, 75, 162, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}
</style>
