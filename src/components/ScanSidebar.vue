<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed, 'mobile-open': isMobileOpen }">
    <div v-if="isMobileOpen" class="mobile-overlay" @click="$emit('close-mobile')"></div>
    <div class="sidebar-header">
      <div class="logo-section">
        <div class="logo-icon">🔍</div>
        <h2 v-if="!isCollapsed" class="logo-text">PV</h2>
      </div>
      <button class="collapse-btn" @click="toggleCollapse">
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
          :class="{ rotated: isCollapsed }"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
    </div>

    <div class="sidebar-content">
      <div class="action-buttons">
        <button class="add-scan-btn" @click="$emit('add-scan')">
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
          <span v-if="!isCollapsed">Add Scan</span>
        </button>
        <button v-if="!isCollapsed" class="add-folder-btn" @click="showCreateFolder = true">
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
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>New Folder</span>
        </button>
      </div>

      <!-- Create Folder Dialog -->
      <div v-if="showCreateFolder" class="create-folder-dialog">
        <input
          v-model="newFolderName"
          type="text"
          placeholder="Folder name..."
          class="folder-input"
          @keyup.enter="createFolder"
          @keyup.esc="cancelCreateFolder"
        />
        <div class="folder-actions">
          <button @click="createFolder" class="confirm-btn">Create</button>
          <button @click="cancelCreateFolder" class="cancel-btn">Cancel</button>
        </div>
      </div>

      <!-- Folders and Scans -->
      <div 
        v-if="organizedItems.length > 0" 
        class="items-list"
        @dragover.prevent="handleRootDragOver"
        @dragleave="handleRootDragLeave"
        @drop.prevent="handleRootDrop"
        :class="{ 'drag-over-root': dragOverRoot }"
      >
        <div
          v-for="item in organizedItems"
          :key="item.id"
          class="item-wrapper"
        >
          <!-- Folder -->
          <div
            v-if="item.type === 'folder'"
            class="folder-item"
            :class="{ 
              expanded: expandedFolders.has(item.id),
              'drag-over': dragOverFolderId === item.id
            }"
            @dragover.prevent="handleFolderDragOver($event, item.id)"
            @dragleave="handleFolderDragLeave"
            @drop.prevent="handleFolderDrop($event, item.id)"
          >
            <div
              class="folder-header"
              @click="toggleFolder(item.id)"
            >
              <svg
                class="folder-icon"
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
                <path
                  v-if="expandedFolders.has(item.id)"
                  d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                ></path>
                <path
                  v-else
                  d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                ></path>
              </svg>
              <div v-if="!isCollapsed" class="folder-info">
                <div class="folder-name">{{ item.name }}</div>
                <div class="folder-meta">{{ item.scanCount || 0 }} scan{{ (item.scanCount || 0) !== 1 ? 's' : '' }}</div>
              </div>
              <button
                v-if="!isCollapsed"
                class="delete-btn"
                @click.stop="$emit('delete-folder', item.id)"
                title="Delete folder"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="m19 6-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
                </svg>
              </button>
            </div>
            <div v-if="expandedFolders.has(item.id) && item.scans" class="folder-scans">
              <div
                v-for="scan in item.scans"
                :key="scan.id"
                class="scan-item nested"
                :class="{ active: scan.id === activeScanId }"
                draggable="true"
                @dragstart="handleDragStart($event, scan.id)"
                @dragend="handleDragEnd"
                @click="$emit('select-scan', scan.id)"
              >
                <div class="scan-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                </div>
                <div class="scan-info">
                  <div class="scan-name">{{ scan.name }}</div>
                  <div class="scan-meta">
                    {{ scan.total_hosts || 0 }} hosts · {{ scan.total_ports || 0 }} ports
                  </div>
                </div>
                <button
                  class="delete-btn"
                  @click.stop="$emit('delete-scan', scan.id)"
                  title="Delete scan"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="m19 6-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Scan (not in folder) -->
          <div
            v-else
            class="scan-item"
            :class="{ active: item.id === activeScanId }"
            draggable="true"
            @dragstart="handleDragStart($event, item.id)"
            @dragend="handleDragEnd"
            @click="$emit('select-scan', item.id)"
          >
            <div class="scan-icon">
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </div>
              <div v-if="!isCollapsed" class="scan-info">
              <div class="scan-name">{{ item.name }}</div>
              <div class="scan-meta">
                {{ item.total_hosts || 0 }} hosts · {{ item.total_ports || 0 }} ports
              </div>
            </div>
            <button
              v-if="!isCollapsed"
              class="delete-btn"
              @click.stop="$emit('delete-scan', item.id)"
              title="Delete scan"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path
                  d="m19 6-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"
                ></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!isCollapsed" class="empty-state">
        <p>No scans yet</p>
        <p class="hint">Upload your first scan to get started</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  scans: {
    type: Array,
    required: true,
  },
  folders: {
    type: Array,
    default: () => [],
  },
  activeScanId: {
    type: String,
    default: null,
  },
  isMobileOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['add-scan', 'select-scan', 'delete-scan', 'delete-folder', 'create-folder', 'move-scan', 'close-mobile']);

const isCollapsed = ref(false);
const expandedFolders = ref(new Set());
const showCreateFolder = ref(false);
const newFolderName = ref('');
const draggedScanId = ref(null);
const dragOverFolderId = ref(null);
const dragOverRoot = ref(false);

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function toggleFolder(folderId) {
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId);
  } else {
    expandedFolders.value.add(folderId);
  }
}

const organizedItems = computed(() => {
  const items = [];
  
  // Add folders with their scans
  props.folders.forEach((folder) => {
    const folderScans = props.scans.filter((scan) => scan.folder_id === folder.id);
    items.push({
      ...folder,
      type: 'folder',
      scans: folderScans,
      scanCount: folderScans.length,
    });
  });
  
  // Add scans not in folders
  const scansWithoutFolders = props.scans.filter((scan) => !scan.folder_id);
  scansWithoutFolders.forEach((scan) => {
    items.push({
      ...scan,
      type: 'scan',
    });
  });
  
  return items;
});

async function createFolder() {
  if (!newFolderName.value.trim()) {
    return;
  }
  
  emit('create-folder', newFolderName.value.trim());
  newFolderName.value = '';
  showCreateFolder.value = false;
}

function cancelCreateFolder() {
  newFolderName.value = '';
  showCreateFolder.value = false;
}

function handleDragStart(event, scanId) {
  draggedScanId.value = scanId;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', scanId);
  // Add visual feedback
  if (event.target) {
    event.target.style.opacity = '0.5';
  }
}

function handleDragEnd(event) {
  draggedScanId.value = null;
  dragOverFolderId.value = null;
  // Reset visual feedback
  if (event.target) {
    event.target.style.opacity = '1';
  }
}

function handleFolderDragOver(event, folderId) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  dragOverFolderId.value = folderId;
  // Auto-expand folder on drag over
  if (!expandedFolders.value.has(folderId)) {
    expandedFolders.value.add(folderId);
  }
}

function handleFolderDragLeave(event) {
  // Only clear if we're actually leaving the folder (not just moving to a child)
  const relatedTarget = event.relatedTarget;
  if (!relatedTarget || !event.currentTarget.contains(relatedTarget)) {
    dragOverFolderId.value = null;
  }
}

function handleFolderDrop(event, folderId) {
  event.preventDefault();
  event.stopPropagation();
  const scanId = draggedScanId.value || event.dataTransfer.getData('text/plain');
  
  if (scanId && scanId !== folderId) {
    // Don't move if scan is already in this folder
    const scan = props.scans.find(s => s.id === scanId);
    if (scan && scan.folder_id !== folderId) {
      emit('move-scan', scanId, folderId);
    }
  }
  
  draggedScanId.value = null;
  dragOverFolderId.value = null;
  dragOverRoot.value = false;
}

function handleRootDragOver(event) {
  // Only show root drop zone if not over a folder
  if (!dragOverFolderId.value) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    dragOverRoot.value = true;
  }
}

function handleRootDragLeave(event) {
  const relatedTarget = event.relatedTarget;
  if (!relatedTarget || !event.currentTarget.contains(relatedTarget)) {
    dragOverRoot.value = false;
  }
}

function handleRootDrop(event) {
  event.preventDefault();
  const scanId = draggedScanId.value || event.dataTransfer.getData('text/plain');
  
  if (scanId) {
    const scan = props.scans.find(s => s.id === scanId);
    // Only move if scan is currently in a folder
    if (scan && scan.folder_id) {
      emit('move-scan', scanId, null);
    }
  }
  
  draggedScanId.value = null;
  dragOverFolderId.value = null;
  dragOverRoot.value = false;
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 280px;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.logo-text {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.collapse-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.collapse-btn svg.rotated {
  transform: rotate(180deg);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-scan-btn,
.add-folder-btn {
  width: 100%;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.add-folder-btn {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%);
  border: 1px solid rgba(99, 102, 241, 0.4);
  box-shadow: none;
}

.add-scan-btn:hover,
.add-folder-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.add-scan-btn:active,
.add-folder-btn:active {
  transform: translateY(0);
}

.create-folder-dialog {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.folder-input {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.5rem;
  color: white;
  font-size: 0.875rem;
  outline: none;
}

.folder-input:focus {
  border-color: rgba(99, 102, 241, 0.5);
}

.folder-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.folder-actions {
  display: flex;
  gap: 0.5rem;
}

.confirm-btn,
.cancel-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn {
  background: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.4);
}

.confirm-btn:hover {
  background: rgba(99, 102, 241, 0.4);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 100px;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.items-list.drag-over-root {
  background: rgba(99, 102, 241, 0.1);
  border: 2px dashed rgba(99, 102, 241, 0.4);
}

.item-wrapper {
  display: flex;
  flex-direction: column;
}

.folder-item {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.folder-item.drag-over {
  background: rgba(99, 102, 241, 0.2);
  border: 2px dashed rgba(99, 102, 241, 0.6);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  position: relative;
}

.folder-header:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
}

.folder-icon {
  color: rgba(245, 158, 11, 0.8);
  flex-shrink: 0;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-meta {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.folder-scans {
  margin-left: 1.5rem;
  margin-top: 0.25rem;
  padding-left: 0.75rem;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.scan-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  position: relative;
}

.scan-item[draggable="true"] {
  cursor: grab;
}

.scan-item[draggable="true"]:active {
  cursor: grabbing;
}

.scan-item.nested {
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.03);
}

.scan-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
}

.scan-item.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.scan-icon {
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.scan-item.active .scan-icon {
  color: #a5b4fc;
}

.scan-info {
  flex: 1;
  min-width: 0;
}

.scan-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scan-meta {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.delete-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0;
}

.scan-item:hover .delete-btn,
.folder-header:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: rgba(255, 255, 255, 0.5);
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.empty-state .hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
}

/* Scrollbar styling */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.mobile-overlay {
  display: none;
}

@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
    backdrop-filter: blur(4px);
  }
}
</style>
