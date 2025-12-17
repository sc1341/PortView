<template>
  <div class="grouped-hosts">
    <div
      v-for="(group, groupKey) in groups"
      :key="groupKey"
      class="group"
    >
      <div class="group-header" @click="toggleGroup(groupKey)">
        <div class="group-title">
          <span class="group-label">{{ groupLabel }}:</span>
          <span class="group-value">{{ groupKey }}</span>
          <span v-if="group.vendor" class="group-vendor">{{ group.vendor }}</span>
          <span v-else-if="group.portList" class="group-ports">{{ group.portList }}</span>
        </div>
        <div class="group-stats">
          <span class="host-count">{{ group.hosts.length }} host{{ group.hosts.length !== 1 ? 's' : '' }}</span>
          <svg
            class="expand-icon"
            :class="{ rotated: expandedGroups.has(groupKey) }"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      <div v-if="expandedGroups.has(groupKey)" class="group-content">
        <HostCard
          v-for="(host, index) in group.hosts"
          :key="index"
          :host="host"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import HostCard from './HostCard.vue';

const props = defineProps({
  groups: {
    type: Object,
    required: true,
  },
  groupLabel: {
    type: String,
    required: true,
  },
});

const expandedGroups = ref(new Set(Object.keys(props.groups)));

function toggleGroup(groupKey) {
  if (expandedGroups.value.has(groupKey)) {
    expandedGroups.value.delete(groupKey);
  } else {
    expandedGroups.value.add(groupKey);
  }
}
</script>

<style scoped>
.grouped-hosts {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
}

.group-header:hover {
  background: rgba(255, 255, 255, 0.08);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.group-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.group-value {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.group-vendor {
  font-size: 0.875rem;
  color: rgba(99, 102, 241, 0.9);
  background: rgba(99, 102, 241, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.group-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.host-count {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.expand-icon {
  color: rgba(255, 255, 255, 0.6);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.group-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 2000px;
  }
}
</style>

