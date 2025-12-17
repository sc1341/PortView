<template>
  <div class="nmap-upload">
    <div class="upload-card">
      <div
        class="upload-area"
        :class="{ 'drag-over': isDragging, 'has-file': file }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".xml,text/xml"
          @change="handleFileSelect"
          style="display: none"
        />
        <div class="upload-content">
          <div class="upload-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 v-if="!file">Drop nmap XML file here</h3>
          <h3 v-else>{{ file.name }}</h3>
          <p v-if="!file">or click to browse</p>
          <p v-else class="file-info">Click to select a different file</p>
        </div>
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { parseNmapXML } from '../utils/nmapParser.js';

const emit = defineEmits(['parsed', 'close']);

const fileInput = ref(null);
const file = ref(null);
const isDragging = ref(false);
const error = ref(null);

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event) {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    processFile(selectedFile);
  }
}

function handleDrop(event) {
  isDragging.value = false;
  const droppedFile = event.dataTransfer.files[0];
  if (droppedFile) {
    processFile(droppedFile);
  }
}

function processFile(fileToProcess) {
  error.value = null;
  
  if (!fileToProcess.name.endsWith('.xml')) {
    error.value = 'Please select an XML file';
    return;
  }

  file.value = fileToProcess;
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const xmlContent = e.target.result;
      const parsedData = parseNmapXML(xmlContent);
      emit('parsed', parsedData, fileToProcess.name);
      file.value = null; // Reset after successful parse
    } catch (err) {
      error.value = `Error parsing XML: ${err.message}`;
      file.value = null;
    }
  };

  reader.onerror = () => {
    error.value = 'Error reading file';
    file.value = null;
  };

  reader.readAsText(fileToProcess);
}
</script>

<style scoped>
.nmap-upload {
  margin-bottom: 2rem;
}

.upload-card {
  max-width: 600px;
  margin: 0 auto;
}

.upload-area {
  border: 3px dashed rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 4rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.upload-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-area:hover::before {
  opacity: 1;
}

.upload-area:hover {
  border-color: rgba(99, 102, 241, 0.5);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.upload-area.drag-over {
  border-color: rgba(99, 102, 241, 0.8);
  background: rgba(99, 102, 241, 0.1);
  transform: scale(1.02);
}

.upload-area.has-file {
  border-color: rgba(16, 185, 129, 0.6);
  background: rgba(16, 185, 129, 0.1);
}

.upload-content {
  position: relative;
  z-index: 1;
}

.upload-icon {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
  color: rgba(99, 102, 241, 0.8);
  transition: all 0.3s ease;
}

.upload-area:hover .upload-icon {
  color: #a5b4fc;
  transform: scale(1.1);
}

.upload-area.has-file .upload-icon {
  color: rgba(16, 185, 129, 0.8);
}

.upload-content h3 {
  margin: 0.5rem 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.upload-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

.file-info {
  color: rgba(16, 185, 129, 0.9);
  font-weight: 500;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border-radius: 12px;
  border-left: 4px solid rgba(239, 68, 68, 0.6);
  backdrop-filter: blur(10px);
}
</style>

