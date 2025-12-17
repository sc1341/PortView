<template>
  <div class="app">
    <ScanSidebar
      :scans="scans"
      :folders="folders"
      :active-scan-id="activeScanId"
      :is-mobile-open="sidebarMobileOpen"
      @add-scan="handleAddScan"
      @select-scan="selectScan"
      @delete-scan="deleteScan"
      @create-folder="createFolder"
      @delete-folder="deleteFolder"
      @move-scan="moveScanToFolder"
      @close-mobile="sidebarMobileOpen = false"
    />

    <div class="main-content" :class="{ 'sidebar-open': scans.length > 0 }">
      <header class="app-header">
        <button
          v-if="scans.length > 0"
          class="mobile-menu-btn"
          @click="sidebarMobileOpen = true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="header-content">
          <h1>
            <span class="gradient-text">PortView</span>
          </h1>
          <p class="subtitle">View and analyze nmap scan results</p>
        </div>
      </header>

      <div class="content-wrapper">
        <NmapUpload
          v-if="showUpload || scans.length === 0"
          @parsed="handleParsed"
          @close="showUpload = false"
        />

        <div v-if="loading && !currentScan" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading scans...</p>
        </div>

        <div v-if="error" class="error-banner">
          <p>{{ error }}</p>
          <button @click="loadData" class="retry-btn">Retry</button>
        </div>

        <div v-if="currentScan" class="scan-results">
          <div class="scan-header">
            <div class="scan-title-section">
              <h2 class="scan-title">{{ currentScan.name }}</h2>
              <div v-if="currentScan.scanInfo.startstr" class="scan-date">
                {{ formatDate(currentScan.scanInfo.startstr) }}
              </div>
              <div v-if="currentScan.scanInfo.scope" class="scan-scope">
                <span class="scope-label">Scope:</span>
                <span class="scope-value">{{ currentScan.scanInfo.scope.display }}</span>
                <span v-if="currentScan.scanInfo.scope.note" class="scope-note">
                  {{ currentScan.scanInfo.scope.note }}
                </span>
                <span v-if="currentScan.scanInfo.scope.type === 'file'" class="scope-warning">
                  ⚠️ Target file not accessible - showing discovered hosts only
                </span>
              </div>
              <div v-if="currentScan.scanInfo.scope?.fullTargets && currentScan.scanInfo.scope.fullTargets.length > 3 && currentScan.scanInfo.scope.type !== 'file'" class="scope-expandable">
                <button class="scope-toggle" @click="showFullScope = !showFullScope">
                  {{ showFullScope ? 'Hide' : 'Show' }} all targets
                </button>
                <div v-if="showFullScope" class="scope-full-list">
                  <div
                    v-for="(target, idx) in currentScan.scanInfo.scope.fullTargets"
                    :key="idx"
                    class="scope-target-item"
                  >
                    {{ target }}
                  </div>
                </div>
              </div>
              <div v-else-if="currentScan.scanInfo.scope?.type === 'file' && currentScan.scanInfo.scope.discoveredCount > 0" class="scope-expandable">
                <button class="scope-toggle" @click="showFullScope = !showFullScope">
                  {{ showFullScope ? 'Hide' : 'Show' }} discovered hosts
                </button>
                <div v-if="showFullScope" class="scope-full-list">
                  <div
                    v-for="(host, idx) in currentScan.hosts.slice(0, 50)"
                    :key="idx"
                    class="scope-target-item"
                  >
                    {{ host.addresses.find(a => a.addrtype === 'ipv4' || a.addrtype === 'ipv6')?.addr || 'Unknown' }}
                  </div>
                  <div v-if="currentScan.hosts.length > 50" class="scope-target-item scope-more">
                    ... and {{ currentScan.hosts.length - 50 }} more
                  </div>
                </div>
              </div>
            </div>
            <button class="add-another-btn" @click="showUpload = true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Another Scan
            </button>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon hosts">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-label">Hosts</div>
                <div class="stat-value">{{ currentScan.totalHosts }}</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon ports">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-label">Total Ports</div>
                <div class="stat-value">{{ currentScan.totalPorts }}</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon open">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-label">Open Ports</div>
                <div class="stat-value">{{ openPortsCount }}</div>
              </div>
            </div>
          </div>

          <div class="search-filters-card">
            <div class="search-box">
              <svg
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
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by IP, hostname, port, or service..."
                class="search-input"
              />
            </div>

            <div class="filters">
              <select v-model="statusFilter" class="filter-select">
                <option value="">All Statuses</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
              </select>

              <select v-model="portStateFilter" class="filter-select">
                <option value="">All Port States</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="filtered">Filtered</option>
              </select>

              <select v-model="groupBy" class="filter-select">
                <option value="">No Grouping</option>
                <option value="ports">Group by Ports</option>
                <option value="mac">Group by MAC Address</option>
              </select>

              <button
                v-if="hasActiveFilters"
                @click="clearFilters"
                class="clear-filters-btn"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div v-if="filteredHosts.length === 0" class="no-results">
            <div class="no-results-icon">🔍</div>
            <p>No hosts match your search criteria.</p>
          </div>

          <GroupedHosts
            v-else-if="groupBy === 'ports' && groupedByPorts"
            :groups="groupedByPorts"
            group-label="Port"
          />

          <GroupedHosts
            v-else-if="groupBy === 'mac' && groupedByMac"
            :groups="groupedByMac"
            group-label="MAC Address"
          />

          <div v-else class="hosts-list">
            <HostCard
              v-for="(host, index) in filteredHosts"
              :key="index"
              :host="host"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ScanSidebar from './components/ScanSidebar.vue';
import NmapUpload from './components/NmapUpload.vue';
import HostCard from './components/HostCard.vue';
import GroupedHosts from './components/GroupedHosts.vue';
import { getMacVendor, formatMacAddress } from './utils/macVendors.js';
import {
  fetchScans,
  fetchScan,
  createScan,
  deleteScan as deleteScanAPI,
  fetchFolders,
  createFolder as createFolderAPI,
  deleteFolder as deleteFolderAPI,
  moveScanToFolder as moveScanToFolderAPI,
} from './services/api.js';

const scans = ref([]);
const folders = ref([]);
const activeScanId = ref(null);
const currentScanData = ref(null);
const showUpload = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const portStateFilter = ref('');
const groupBy = ref('');
const sidebarMobileOpen = ref(false);
const showFullScope = ref(false);
const loading = ref(false);
const error = ref(null);

const currentScan = computed(() => {
  return currentScanData.value;
});

// Load scans and folders on mount
onMounted(async () => {
  await loadData();
});

async function loadData() {
  try {
    loading.value = true;
    error.value = null;
    
    // Load folders and scans in parallel
    const [scanList, folderList] = await Promise.all([
      fetchScans(),
      fetchFolders(),
    ]);
    
    scans.value = scanList;
    folders.value = folderList;
    
    // Load the first scan if available
    if (scanList.length > 0 && !activeScanId.value) {
      await selectScan(scanList[0].id);
    }
  } catch (err) {
    console.error('Failed to load data:', err);
    error.value = 'Failed to load data. Make sure the API server is running.';
  } finally {
    loading.value = false;
  }
}


async function handleParsed(data, fileName) {
  try {
    loading.value = true;
    error.value = null;
    
    const savedScan = await createScan(data, fileName);
    
    // Reload data and select the newly created scan
    await loadData();
    await selectScan(savedScan.id);
    
    showUpload.value = false;
    
    // Reset filters
    searchQuery.value = '';
    statusFilter.value = '';
    portStateFilter.value = '';
    groupBy.value = '';
  } catch (err) {
    console.error('Failed to save scan:', err);
    error.value = 'Failed to save scan. Please try again.';
  } finally {
    loading.value = false;
  }
}

function handleAddScan() {
  showUpload.value = true;
  sidebarMobileOpen.value = false;
}

async function selectScan(scanId) {
  try {
    loading.value = true;
    error.value = null;
    
    activeScanId.value = scanId;
    showUpload.value = false;
    sidebarMobileOpen.value = false;
    
    // Fetch full scan data
    const scanData = await fetchScan(scanId);
    if (scanData) {
      currentScanData.value = scanData;
    } else {
      // If scan not found, reload scans list
      await loadData();
    }
    
    // Reset filters when switching scans
    searchQuery.value = '';
    statusFilter.value = '';
    portStateFilter.value = '';
    groupBy.value = '';
    showFullScope.value = false;
  } catch (err) {
    console.error('Failed to load scan:', err);
    error.value = 'Failed to load scan. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function deleteScan(scanId) {
  try {
    loading.value = true;
    error.value = null;
    
    await deleteScanAPI(scanId);
    
    // Reload scans
    await loadData();
    
    // If deleted scan was active, select another or clear
    if (activeScanId.value === scanId) {
      if (scans.value.length > 0) {
        await selectScan(scans.value[0].id);
      } else {
        activeScanId.value = null;
        currentScanData.value = null;
      }
    }
  } catch (err) {
    console.error('Failed to delete scan:', err);
    error.value = 'Failed to delete scan. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function createFolder(name) {
  if (!name || !name.trim()) {
    error.value = 'Folder name cannot be empty';
    return;
  }
  
  try {
    loading.value = true;
    error.value = null;
    
    await createFolderAPI(name);
    
    // Reload folders and scans
    await loadData();
  } catch (err) {
    console.error('Failed to create folder:', err);
    const errorMsg = err.message || 'Failed to create folder. Please try again.';
    error.value = errorMsg;
  } finally {
    loading.value = false;
  }
}

async function deleteFolder(folderId) {
  try {
    loading.value = true;
    error.value = null;
    
    await deleteFolderAPI(folderId);
    
    // Reload folders and scans (scans may have been moved to root)
    await loadData();
  } catch (err) {
    console.error('Failed to delete folder:', err);
    error.value = 'Failed to delete folder. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function moveScanToFolder(scanId, folderId) {
  try {
    loading.value = true;
    error.value = null;
    
    await moveScanToFolderAPI(scanId, folderId);
    
    // Reload folders and scans
    await loadData();
  } catch (err) {
    console.error('Failed to move scan:', err);
    const errorMsg = err.message || 'Failed to move scan. Please try again.';
    error.value = errorMsg;
  } finally {
    loading.value = false;
  }
}

const openPortsCount = computed(() => {
  if (!currentScan.value) return 0;
  return currentScan.value.hosts.reduce((count, host) => {
    return (
      count +
      host.ports.filter((port) => port.state?.state === 'open').length
    );
  }, 0);
});

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value !== '' ||
    statusFilter.value !== '' ||
    portStateFilter.value !== '' ||
    groupBy.value !== ''
  );
});

// Group hosts by open ports
const groupedByPorts = computed(() => {
  if (!currentScan.value || groupBy.value !== 'ports') return null;
  
  const groups = {};
  
  filteredHosts.value.forEach((host) => {
    const openPorts = host.ports
      .filter((port) => port.state?.state === 'open')
      .map((port) => `${port.portid}/${port.protocol}`)
      .sort((a, b) => {
        const [portA] = a.split('/');
        const [portB] = b.split('/');
        return parseInt(portA) - parseInt(portB);
      })
      .join(', ');
    
    // Use "No open ports" for hosts without open ports
    const groupKey = openPorts || 'No open ports';
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        hosts: [],
        portList: openPorts || 'No open ports',
      };
    }
    
    groups[groupKey].hosts.push(host);
  });
  
  return groups;
});

// Group hosts by MAC address
const groupedByMac = computed(() => {
  if (!currentScan.value || groupBy.value !== 'mac') return null;
  
  const groups = {};
  
  filteredHosts.value.forEach((host) => {
    const macAddress = host.addresses.find((addr) => addr.addrtype === 'mac');
    
    if (!macAddress) return;
    
    const formattedMac = formatMacAddress(macAddress.addr);
    const vendor = getMacVendor(formattedMac);
    const macPrefix = formattedMac.split(':').slice(0, 3).join(':');
    
    // Group by MAC prefix (first 3 octets)
    if (!groups[macPrefix]) {
      groups[macPrefix] = {
        hosts: [],
        vendor: vendor,
        macPrefix: macPrefix,
      };
    }
    
    groups[macPrefix].hosts.push(host);
  });
  
  return groups;
});

const filteredHosts = computed(() => {
  if (!currentScan.value) return [];

  let hosts = [...currentScan.value.hosts];

  // Filter by status
  if (statusFilter.value) {
    hosts = hosts.filter(
      (host) => host.status?.state === statusFilter.value
    );
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    hosts = hosts.filter((host) => {
      // Search in addresses
      const matchesAddress = host.addresses.some((addr) =>
        addr.addr.toLowerCase().includes(query)
      );

      // Search in hostnames
      const matchesHostname = host.hostnames.some((hostname) =>
        hostname.name.toLowerCase().includes(query)
      );

      // Search in ports
      const matchesPort = host.ports.some(
        (port) =>
          port.portid.includes(query) ||
          port.service?.name?.toLowerCase().includes(query) ||
          port.service?.product?.toLowerCase().includes(query)
      );

      return matchesAddress || matchesHostname || matchesPort;
    });
  }

  // Filter by port state
  if (portStateFilter.value) {
    hosts = hosts
      .map((host) => ({
        ...host,
        ports: host.ports.filter(
          (port) => port.state?.state === portStateFilter.value
        ),
      }))
      .filter((host) => host.ports.length > 0);
  }

  return hosts;
});

function clearFilters() {
  searchQuery.value = '';
  statusFilter.value = '';
  portStateFilter.value = '';
  groupBy.value = '';
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
  position: relative;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.main-content {
  margin-left: 0;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
}

.main-content.sidebar-open {
  margin-left: 280px;
}

.app-header {
  padding: 3rem 2rem 2rem;
  text-align: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-menu-btn {
  position: absolute;
  left: 2rem;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 1024px) {
  .mobile-menu-btn {
    display: flex;
  }
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: gradientText 3s ease infinite;
}

@keyframes gradientText {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.125rem;
  font-weight: 400;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.7);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-banner {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fca5a5;
}

.error-banner p {
  margin: 0;
}

.retry-btn {
  background: rgba(239, 68, 68, 0.3);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: rgba(239, 68, 68, 0.4);
  border-color: rgba(239, 68, 68, 0.7);
}

.scan-results {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.scan-title-section {
  flex: 1;
}

.scan-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.scan-date {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.scan-scope {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
}

.scope-label {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  margin-right: 0.5rem;
}

.scope-value {
  color: white;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-weight: 500;
}

.scope-note {
  display: block;
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  font-style: italic;
}

.scope-warning {
  display: block;
  margin-top: 0.5rem;
  color: rgba(245, 158, 11, 0.9);
  font-size: 0.75rem;
  font-weight: 500;
}

.scope-more {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.scope-expandable {
  margin-top: 0.5rem;
}

.scope-toggle {
  background: transparent;
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scope-toggle:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.6);
}

.scope-full-list {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.scope-target-item {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.8);
  padding: 0.375rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.add-another-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  border-radius: 10px;
  color: #a5b4fc;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-another-btn:hover {
  background: rgba(99, 102, 241, 0.3);
  border-color: rgba(99, 102, 241, 0.6);
  transform: translateY(-2px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.hosts {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.stat-icon.ports {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.stat-icon.open {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.search-filters-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.search-box:focus-within {
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.search-box svg {
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: white;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.625rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
}

.filter-select:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.filter-select option {
  background: #1e293b;
  color: white;
}

.clear-filters-btn {
  padding: 0.625rem 1rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.clear-filters-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

.hosts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.no-results {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.5);
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-results p {
  font-size: 1.125rem;
}

@media (max-width: 1024px) {
  .main-content.sidebar-open {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .app-header h1 {
    font-size: 2rem;
  }

  .content-wrapper {
    padding: 0 1rem 2rem;
  }

  .scan-header {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    width: 100%;
  }

  .filter-select {
    flex: 1;
    min-width: 150px;
  }
}
</style>
