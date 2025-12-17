import express from 'express';
import { getDatabase } from '../db.js';
import { saveScanData, getScanData, deleteScanData } from '../services/scanService.js';

const router = express.Router();
const db = getDatabase();

/**
 * GET /api/scans
 * Get all scans (metadata only)
 */
router.get('/', (req, res) => {
  try {
    const scans = db.prepare(`
      SELECT 
        id,
        name,
        filename,
        folder_id,
        scanner,
        args,
        start_time,
        start_time_str,
        version,
        scope_type,
        scope_display,
        scope_note,
        scope_file,
        scope_discovered_count,
        total_hosts,
        total_ports,
        created_at,
        updated_at
      FROM scans
      ORDER BY created_at DESC
    `).all();

    res.json(scans);
  } catch (error) {
    console.error('Error fetching scans:', error);
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

/**
 * GET /api/scans/:id
 * Get a single scan with all its data
 */
router.get('/:id', (req, res) => {
  try {
    const scanId = req.params.id;
    const scanData = getScanData(scanId);

    if (!scanData) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json(scanData);
  } catch (error) {
    console.error('Error fetching scan:', error);
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
});

/**
 * POST /api/scans
 * Create a new scan
 */
router.post('/', (req, res) => {
  try {
    const { scanData, fileName } = req.body;

    if (!scanData) {
      return res.status(400).json({ error: 'Scan data is required' });
    }

    const savedScan = saveScanData(scanData, fileName);
    res.status(201).json(savedScan);
  } catch (error) {
    console.error('Error saving scan:', error);
    res.status(500).json({ error: 'Failed to save scan' });
  }
});

/**
 * PUT /api/scans/:id
 * Update scan metadata (name, folder_id, etc.)
 */
router.put('/:id', (req, res) => {
  try {
    const scanId = req.params.id;
    const { name, folderId } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (folderId !== undefined) {
      updates.push('folder_id = ?');
      values.push(folderId || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(scanId);

    const sql = `UPDATE scans SET ${updates.join(', ')} WHERE id = ?`;
    const result = db.prepare(sql).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const updated = db.prepare('SELECT * FROM scans WHERE id = ?').get(scanId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating scan:', error);
    res.status(500).json({ error: 'Failed to update scan' });
  }
});

/**
 * DELETE /api/scans/:id
 * Delete a scan and all its data
 */
router.delete('/:id', (req, res) => {
  try {
    const scanId = req.params.id;
    deleteScanData(scanId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting scan:', error);
    res.status(500).json({ error: 'Failed to delete scan' });
  }
});

export default router;

