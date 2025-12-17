<template>
  <div class="host-card" :class="{ expanded: isExpanded }">
    <div class="host-header" @click="toggleExpanded">
      <div class="host-info">
        <div class="host-addresses">
          <span
            v-for="addr in host.addresses"
            :key="addr.addr"
            class="address"
            :class="addr.addrtype"
          >
            {{ addr.addr }}
            <span v-if="addr.addrtype === 'mac' && getMacVendor(addr.addr)" class="mac-vendor">
              ({{ getMacVendor(addr.addr) }})
            </span>
          </span>
        </div>
        <div v-if="host.hostnames.length > 0" class="hostnames">
          <span
            v-for="hostname in host.hostnames"
            :key="hostname.name"
            class="hostname"
          >
            {{ hostname.name }}
          </span>
        </div>
      </div>
      <div class="host-stats">
        <span class="status-badge" :class="host.status?.state">
          {{ host.status?.state || 'unknown' }}
        </span>
        <span class="port-count">{{ host.ports.length }} port{{ host.ports.length !== 1 ? 's' : '' }}</span>
        <svg
          class="expand-icon"
          :class="{ rotated: isExpanded }"
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

    <div v-if="isExpanded" class="host-details">
      <div v-if="host.os" class="detail-section">
        <h4>Operating System</h4>
        <p>{{ host.os.name }} ({{ host.os.accuracy }}% accuracy)</p>
      </div>

      <div v-if="host.uptime" class="detail-section">
        <h4>Uptime</h4>
        <p>{{ formatUptime(host.uptime.seconds) }}</p>
      </div>

      <div v-if="host.distance" class="detail-section">
        <h4>Network Distance</h4>
        <p>{{ host.distance.value }} hops</p>
      </div>

      <div v-if="host.ports.length > 0" class="ports-section">
        <h4>Open Ports & Services</h4>
        <PortList :ports="host.ports" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PortList from './PortList.vue';
import { getMacVendor } from '../utils/macVendors.js';

const props = defineProps({
  host: {
    type: Object,
    required: true,
  },
});

const isExpanded = ref(false);

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}

function formatUptime(seconds) {
  if (!seconds) return 'Unknown';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.length > 0 ? parts.join(' ') : '< 1m';
}
</script>

<style scoped>
.host-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.host-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.host-card.expanded {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.host-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.host-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.host-info {
  flex: 1;
}

.host-addresses {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.address {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.address.ipv4 {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.address.ipv6 {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(147, 51, 234, 0.3) 100%);
  color: #c4b5fd;
  border: 1px solid rgba(147, 51, 234, 0.3);
}

.address.mac {
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.mac-vendor {
  font-size: 0.75rem;
  color: rgba(99, 102, 241, 0.9);
  margin-left: 0.5rem;
  font-weight: 500;
}

.hostnames {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.hostname {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.host-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  padding: 0.5rem 0.875rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.up {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge.down {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-badge.unknown {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.port-count {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.expand-icon {
  color: rgba(255, 255, 255, 0.6);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.host-details {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
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

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.detail-section p {
  margin: 0;
  color: white;
  font-size: 0.9375rem;
}

.ports-section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
</style>
