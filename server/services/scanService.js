import { getDatabase } from '../db.js';

const db = getDatabase();

/**
 * Save scan data to database
 * @param {Object} scanData - Parsed scan data object
 * @param {string} fileName - Optional filename
 */
export function saveScanData(scanData, fileName = null) {
  const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const scanName = fileName || `Scan ${new Date().toLocaleString()}`;
  const scanInfo = scanData.scanInfo || {};

  // Start transaction
  const transaction = db.transaction(() => {
    // Insert scan metadata
    db.prepare(`
      INSERT INTO scans (
        id, name, filename, folder_id, scanner, args, start_time, start_time_str,
        version, xmloutputversion, scope_type, scope_display, scope_note,
        scope_file, scope_discovered_count, scope_full_targets, total_hosts, total_ports
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      scanId,
      scanName,
      fileName,
      null, // folder_id - can be set later
      scanInfo.scanner || 'unknown',
      scanInfo.args || '',
      scanInfo.start || '',
      scanInfo.startstr || '',
      scanInfo.version || '',
      scanInfo.xmloutputversion || '',
      scanInfo.scope?.type || '',
      scanInfo.scope?.display || '',
      scanInfo.scope?.note || null,
      scanInfo.scope?.file || null,
      scanInfo.scope?.discoveredCount || null,
      scanInfo.scope?.fullTargets ? JSON.stringify(scanInfo.scope.fullTargets) : null,
      scanData.totalHosts || 0,
      scanData.totalPorts || 0
    );

    // Insert hosts
    scanData.hosts.forEach((host) => {
      const hostResult = db.prepare(`
        INSERT INTO hosts (
          scan_id, status_state, status_reason, status_reason_ttl,
          os_name, os_accuracy, uptime_seconds, uptime_lastboot, distance_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        scanId,
        host.status?.state || null,
        host.status?.reason || null,
        host.status?.reason_ttl || null,
        host.os?.name || null,
        host.os?.accuracy || null,
        host.uptime?.seconds || null,
        host.uptime?.lastboot || null,
        host.distance?.value || null
      );

      const hostId = hostResult.lastInsertRowid;

      // Insert addresses
      host.addresses.forEach((addr) => {
        db.prepare(`
          INSERT INTO addresses (host_id, addr, addrtype)
          VALUES (?, ?, ?)
        `).run(hostId, addr.addr, addr.addrtype);
      });

      // Insert hostnames
      host.hostnames.forEach((hostname) => {
        db.prepare(`
          INSERT INTO hostnames (host_id, name, type)
          VALUES (?, ?, ?)
        `).run(hostId, hostname.name, hostname.type);
      });

      // Insert ports
      host.ports.forEach((port) => {
        const portResult = db.prepare(`
          INSERT INTO ports (
            host_id, protocol, portid, state_state, state_reason, state_reason_ttl,
            service_name, service_product, service_version, service_extrainfo,
            service_method, service_conf
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          hostId,
          port.protocol,
          port.portid,
          port.state?.state || null,
          port.state?.reason || null,
          port.state?.reason_ttl || null,
          port.service?.name || null,
          port.service?.product || null,
          port.service?.version || null,
          port.service?.extrainfo || null,
          port.service?.method || null,
          port.service?.conf || null
        );

        const portId = portResult.lastInsertRowid;

        // Insert scripts
        port.scripts.forEach((script) => {
          db.prepare(`
            INSERT INTO scripts (port_id, script_id, output, raw_output)
            VALUES (?, ?, ?, ?)
          `).run(
            portId,
            script.id,
            script.output || null,
            script.rawOutput || null
          );
        });
      });
    });
  });

  transaction();

  // Return the saved scan metadata
  return db.prepare('SELECT * FROM scans WHERE id = ?').get(scanId);
}

/**
 * Get scan data with all hosts, ports, etc.
 */
export function getScanData(scanId) {
  const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(scanId);
  if (!scan) return null;

  const hosts = db.prepare('SELECT * FROM hosts WHERE scan_id = ?').all(scanId);

  const hostsWithData = hosts.map((host) => {
    const addresses = db.prepare('SELECT * FROM addresses WHERE host_id = ?').all(host.id);
    const hostnames = db.prepare('SELECT * FROM hostnames WHERE host_id = ?').all(host.id);
    const ports = db.prepare('SELECT * FROM ports WHERE host_id = ?').all(host.id);

    const portsWithScripts = ports.map((port) => {
      const scripts = db.prepare('SELECT * FROM scripts WHERE port_id = ?').all(port.id);
      return {
        protocol: port.protocol,
        portid: port.portid,
        state: port.state_state ? {
          state: port.state_state,
          reason: port.state_reason,
          reason_ttl: port.state_reason_ttl,
        } : null,
        service: (port.service_name || port.service_product) ? {
          name: port.service_name,
          product: port.service_product,
          version: port.service_version,
          extrainfo: port.service_extrainfo,
          method: port.service_method,
          conf: port.service_conf,
        } : null,
        scripts: scripts.map((s) => ({
          id: s.script_id,
          output: s.output,
          rawOutput: s.raw_output,
        })),
      };
    });

    return {
      addresses: addresses.map((a) => ({
        addr: a.addr,
        addrtype: a.addrtype,
      })),
      status: host.status_state ? {
        state: host.status_state,
        reason: host.status_reason,
        reason_ttl: host.status_reason_ttl,
      } : null,
      hostnames: hostnames.map((h) => ({
        name: h.name,
        type: h.type,
      })),
      ports: portsWithScripts,
      os: host.os_name ? {
        name: host.os_name,
        accuracy: host.os_accuracy,
      } : null,
      uptime: host.uptime_seconds ? {
        seconds: host.uptime_seconds,
        lastboot: host.uptime_lastboot,
      } : null,
      distance: host.distance_value ? {
        value: host.distance_value,
      } : null,
    };
  });

  return {
    id: scan.id,
    name: scan.name,
    filename: scan.filename,
    folderId: scan.folder_id,
    scanInfo: {
      scanner: scan.scanner,
      args: scan.args,
      start: scan.start_time,
      startstr: scan.start_time_str,
      version: scan.version,
      xmloutputversion: scan.xmloutputversion,
      scope: {
        type: scan.scope_type,
        display: scan.scope_display,
        note: scan.scope_note,
        file: scan.scope_file,
        discoveredCount: scan.scope_discovered_count,
        fullTargets: scan.scope_full_targets ? JSON.parse(scan.scope_full_targets) : null,
      },
    },
    hosts: hostsWithData,
    totalHosts: scan.total_hosts,
    totalPorts: scan.total_ports,
    created_at: scan.created_at,
    updated_at: scan.updated_at,
  };
}

/**
 * Delete scan and all its data
 */
export function deleteScanData(scanId) {
  // Cascade delete will handle all related records
  const result = db.prepare('DELETE FROM scans WHERE id = ?').run(scanId);
  return result.changes > 0;
}

