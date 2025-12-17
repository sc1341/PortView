/**
 * API Service for communicating with backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Fetch all scans (metadata only)
 */
export async function fetchScans() {
  const response = await fetch(`${API_BASE_URL}/scans`);
  if (!response.ok) {
    throw new Error('Failed to fetch scans');
  }
  return response.json();
}

/**
 * Fetch a single scan with all data
 */
export async function fetchScan(scanId) {
  const response = await fetch(`${API_BASE_URL}/scans/${scanId}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch scan');
  }
  return response.json();
}

/**
 * Create a new scan
 */
export async function createScan(parsedData, fileName = null) {
  const response = await fetch(`${API_BASE_URL}/scans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scanData: parsedData,
      fileName: fileName,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create scan');
  }

  return response.json();
}

/**
 * Update a scan (name, folder_id, etc.)
 */
export async function updateScan(scanId, updates) {
  const response = await fetch(`${API_BASE_URL}/scans/${scanId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Failed to update scan';
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Move a scan to a folder
 */
export async function moveScanToFolder(scanId, folderId) {
  return updateScan(scanId, { folderId });
}

/**
 * Delete a scan
 */
export async function deleteScan(scanId) {
  const response = await fetch(`${API_BASE_URL}/scans/${scanId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete scan');
  }

  return true;
}

// Folder API functions

/**
 * Fetch all folders
 */
export async function fetchFolders() {
  const response = await fetch(`${API_BASE_URL}/folders`);
  if (!response.ok) {
    throw new Error('Failed to fetch folders');
  }
  return response.json();
}

/**
 * Create a new folder
 */
export async function createFolder(name, parentId = null) {
  const response = await fetch(`${API_BASE_URL}/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, parentId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Failed to create folder';
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId) {
  const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete folder');
  }

  return true;
}

