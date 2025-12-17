<template>
  <div class="port-list">
    <div
      v-for="port in ports"
      :key="`${port.protocol}-${port.portid}`"
      class="port-item"
      :class="port.state?.state"
    >
      <div class="port-header">
        <div class="port-info">
          <span class="port-number">{{ port.portid }}/{{ port.protocol }}</span>
          <span class="port-state" :class="port.state?.state">
            {{ port.state?.state || 'unknown' }}
          </span>
        </div>
        <button
          v-if="port.scripts.length > 0"
          class="toggle-scripts"
          @click="toggleScripts(port.portid)"
        >
          {{ expandedScripts.has(port.portid) ? 'Hide' : 'Show' }} Scripts
          ({{ port.scripts.length }})
        </button>
      </div>

      <div v-if="port.service" class="service-info">
        <div class="service-name">
          <strong>{{ port.service.name }}</strong>
          <span v-if="port.service.product" class="product">
            {{ port.service.product }}
            <span v-if="port.service.version"> {{ port.service.version }}</span>
          </span>
        </div>
        <div v-if="port.service.extrainfo" class="extrainfo">
          {{ port.service.extrainfo }}
        </div>
        <div v-if="port.service.conf" class="confidence">
          Confidence: {{ port.service.conf }}/10
        </div>
      </div>

      <div
        v-if="expandedScripts.has(port.portid) && port.scripts.length > 0"
        class="scripts-section"
      >
        <div
          v-for="(script, idx) in port.scripts"
          :key="idx"
          class="script-item"
        >
          <div class="script-header">
            <span class="script-id">{{ script.id }}</span>
          </div>
          <div class="script-output">
            <pre>{{ script.rawOutput || script.output }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  ports: {
    type: Array,
    required: true,
  },
});

const expandedScripts = ref(new Set());

function toggleScripts(portid) {
  if (expandedScripts.value.has(portid)) {
    expandedScripts.value.delete(portid);
  } else {
    expandedScripts.value.add(portid);
  }
}
</script>

<style scoped>
.port-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.port-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.25rem;
  border-left: 4px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.port-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.port-item.open {
  border-left-color: rgba(16, 185, 129, 0.6);
  background: rgba(16, 185, 129, 0.05);
}

.port-item.closed {
  border-left-color: rgba(239, 68, 68, 0.6);
  background: rgba(239, 68, 68, 0.05);
}

.port-item.filtered {
  border-left-color: rgba(245, 158, 11, 0.6);
  background: rgba(245, 158, 11, 0.05);
}

.port-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.port-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.port-number {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.port-state {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.port-state.open {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.port-state.closed {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.port-state.filtered {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.toggle-scripts {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.4);
  padding: 0.5rem 0.875rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-scripts:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.4) 100%);
  border-color: rgba(99, 102, 241, 0.6);
  transform: translateY(-1px);
}

.service-info {
  margin-top: 0.75rem;
}

.service-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.service-name strong {
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
}

.product {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
}

.extrainfo {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8125rem;
  margin-top: 0.375rem;
  line-height: 1.5;
}

.confidence {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  margin-top: 0.375rem;
}

.scripts-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.script-item {
  margin-bottom: 0.75rem;
}

.script-item:last-child {
  margin-bottom: 0;
}

.script-header {
  margin-bottom: 0.5rem;
}

.script-id {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.75rem;
  color: #a5b4fc;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 4px;
  display: inline-block;
}

.script-output {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.script-output pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #d1d5db;
}
</style>
