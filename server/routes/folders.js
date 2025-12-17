import express from 'express';
import { getDatabase } from '../db.js';

const router = express.Router();
const db = getDatabase();

/**
 * GET /api/folders
 * Get all folders
 */
router.get('/', (req, res) => {
  try {
    const folders = db.prepare(`
      SELECT 
        id,
        name,
        parent_id,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM scans WHERE folder_id = folders.id) as scan_count
      FROM folders
      ORDER BY name ASC
    `).all();

    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

/**
 * GET /api/folders/:id
 * Get a single folder with its scans
 */
router.get('/:id', (req, res) => {
  try {
    const folderId = req.params.id;
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const scans = db.prepare(`
      SELECT 
        id,
        name,
        filename,
        total_hosts,
        total_ports,
        created_at,
        updated_at
      FROM scans
      WHERE folder_id = ?
      ORDER BY created_at DESC
    `).all(folderId);

    res.json({ ...folder, scans });
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({ error: 'Failed to fetch folder' });
  }
});

/**
 * POST /api/folders
 * Create a new folder
 */
router.post('/', (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const folderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    db.prepare(`
      INSERT INTO folders (id, name, parent_id)
      VALUES (?, ?, ?)
    `).run(folderId, name.trim(), parentId || null);

    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    const errorMessage = error.message || 'Failed to create folder';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * PUT /api/folders/:id
 * Update folder name or parent
 */
router.put('/:id', (req, res) => {
  try {
    const folderId = req.params.id;
    const { name, parentId } = req.body;

    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({ error: 'Folder name cannot be empty' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (parentId !== undefined) {
      // Prevent circular references
      if (parentId === folderId) {
        return res.status(400).json({ error: 'Folder cannot be its own parent' });
      }
      updates.push('parent_id = ?');
      values.push(parentId || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(folderId);

    const sql = `UPDATE folders SET ${updates.join(', ')} WHERE id = ?`;
    const result = db.prepare(sql).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const updated = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

/**
 * DELETE /api/folders/:id
 * Delete a folder (scans will be moved to root)
 */
router.delete('/:id', (req, res) => {
  try {
    const folderId = req.params.id;

    // Check if folder exists
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Move scans to root (set folder_id to NULL)
    db.prepare('UPDATE scans SET folder_id = NULL WHERE folder_id = ?').run(folderId);

    // Delete folder (cascade will handle child folders)
    db.prepare('DELETE FROM folders WHERE id = ?').run(folderId);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;

