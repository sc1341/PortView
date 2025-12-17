/**
 * Extract scan scope from nmap arguments
 * @param {string} args - Nmap command line arguments
 * @param {Array} hosts - Parsed hosts array
 * @returns {Object} Scope information
 */
function extractScanScope(args, hosts) {
  if (!args) {
    // Fallback: extract from discovered hosts
    const ipAddresses = hosts
      .flatMap(host => host.addresses.filter(addr => addr.addrtype === 'ipv4' || addr.addrtype === 'ipv6'))
      .map(addr => addr.addr);
    
    return {
      type: 'discovered',
      targets: [...new Set(ipAddresses)].slice(0, 10), // Limit to 10 for display
      display: ipAddresses.length > 10 
        ? `${ipAddresses.length} discovered IPs (showing first 10)`
        : `${ipAddresses.length} discovered IP${ipAddresses.length !== 1 ? 's' : ''}`,
    };
  }

  // Check for -iL (input file list)
  // Note: We can't access the actual file contents, so we just show the filename
  const iLMatch = args.match(/-iL\s+(\S+)/);
  if (iLMatch) {
    const fileName = iLMatch[1];
    // Try to show discovered hosts as a fallback
    const ipAddresses = hosts
      .flatMap(host => host.addresses.filter(addr => addr.addrtype === 'ipv4' || addr.addrtype === 'ipv6'))
      .map(addr => addr.addr);
    
    const discoveredCount = [...new Set(ipAddresses)].length;
    
    return {
      type: 'file',
      file: fileName,
      display: `Targets from file: ${fileName}`,
      note: discoveredCount > 0 
        ? `${discoveredCount} host${discoveredCount !== 1 ? 's' : ''} discovered from file`
        : 'Target list loaded from file (no hosts discovered)',
      discoveredCount: discoveredCount,
    };
  }

  // Extract targets from command line (everything that's not a flag)
  const parts = args.split(/\s+/);
  const targets = [];
  let skipNext = false;
  
  for (let i = 0; i < parts.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    
    const part = parts[i];
    
    // Skip flags and their values
    if (part.startsWith('-')) {
      // Some flags take a value
      if (['-p', '-iL', '-iR', '-exclude', '-excludefile'].includes(part)) {
        skipNext = true;
      }
      continue;
    }
    
    // Skip 'nmap' command itself
    if (part === 'nmap' || part.includes('nmap')) {
      continue;
    }
    
    // This looks like a target
    if (part && !part.startsWith('-')) {
      targets.push(part);
    }
  }
  
  if (targets.length > 0) {
    return {
      type: 'command',
      targets: targets,
      display: targets.length > 3 
        ? `${targets.slice(0, 3).join(', ')}... (+${targets.length - 3} more)`
        : targets.join(', '),
      fullTargets: targets,
    };
  }
  
  // Fallback to discovered hosts
  return extractScanScope('', hosts);
}

/**
 * Nmap XML Parser
 * Parses nmap XML output and extracts structured data
 */

export function parseNmapXML(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format');
  }

  const hosts = [];
  const hostElements = xmlDoc.querySelectorAll('host');

  hostElements.forEach((hostEl) => {
    const host = {
      addresses: [],
      status: null,
      hostnames: [],
      ports: [],
      os: null,
      uptime: null,
      distance: null,
    };

    // Parse addresses
    const addressElements = hostEl.querySelectorAll('address');
    addressElements.forEach((addrEl) => {
      host.addresses.push({
        addr: addrEl.getAttribute('addr'),
        addrtype: addrEl.getAttribute('addrtype'),
      });
    });

    // Parse status
    const statusEl = hostEl.querySelector('status');
    if (statusEl) {
      host.status = {
        state: statusEl.getAttribute('state'),
        reason: statusEl.getAttribute('reason'),
        reason_ttl: statusEl.getAttribute('reason_ttl'),
      };
    }

    // Parse hostnames
    const hostnameElements = hostEl.querySelectorAll('hostname');
    hostnameElements.forEach((hostnameEl) => {
      host.hostnames.push({
        name: hostnameEl.getAttribute('name'),
        type: hostnameEl.getAttribute('type'),
      });
    });

    // Parse ports
    const portsEl = hostEl.querySelector('ports');
    if (portsEl) {
      const portElements = portsEl.querySelectorAll('port');
      portElements.forEach((portEl) => {
        const port = {
          protocol: portEl.getAttribute('protocol'),
          portid: portEl.getAttribute('portid'),
          state: null,
          service: null,
          scripts: [],
        };

        // Parse state
        const stateEl = portEl.querySelector('state');
        if (stateEl) {
          port.state = {
            state: stateEl.getAttribute('state'),
            reason: stateEl.getAttribute('reason'),
            reason_ttl: stateEl.getAttribute('reason_ttl'),
          };
        }

        // Parse service
        const serviceEl = portEl.querySelector('service');
        if (serviceEl) {
          port.service = {
            name: serviceEl.getAttribute('name'),
            product: serviceEl.getAttribute('product'),
            version: serviceEl.getAttribute('version'),
            extrainfo: serviceEl.getAttribute('extrainfo'),
            method: serviceEl.getAttribute('method'),
            conf: serviceEl.getAttribute('conf'),
          };
        }

        // Parse scripts
        const scriptElements = portEl.querySelectorAll('script');
        scriptElements.forEach((scriptEl) => {
          port.scripts.push({
            id: scriptEl.getAttribute('id'),
            output: scriptEl.getAttribute('output'),
            rawOutput: scriptEl.textContent.trim(),
          });
        });

        host.ports.push(port);
      });
    }

    // Parse OS information
    const osEl = hostEl.querySelector('os');
    if (osEl) {
      const osMatchEl = osEl.querySelector('osmatch');
      if (osMatchEl) {
        host.os = {
          name: osMatchEl.getAttribute('name'),
          accuracy: osMatchEl.getAttribute('accuracy'),
        };
      }
    }

    // Parse uptime
    const uptimeEl = hostEl.querySelector('uptime');
    if (uptimeEl) {
      host.uptime = {
        seconds: uptimeEl.getAttribute('seconds'),
        lastboot: uptimeEl.getAttribute('lastboot'),
      };
    }

    // Parse distance
    const distanceEl = hostEl.querySelector('distance');
    if (distanceEl) {
      host.distance = {
        value: distanceEl.getAttribute('value'),
      };
    }

    hosts.push(host);
  });

  // Parse scan info
  const args = xmlDoc.querySelector('nmaprun')?.getAttribute('args') || '';
  
  // Extract scan scope from arguments
  const scope = extractScanScope(args, hosts);
  
  const scanInfo = {
    scanner: xmlDoc.querySelector('nmaprun')?.getAttribute('scanner') || 'unknown',
    args: args,
    start: xmlDoc.querySelector('nmaprun')?.getAttribute('start') || '',
    startstr: xmlDoc.querySelector('nmaprun')?.getAttribute('startstr') || '',
    version: xmlDoc.querySelector('nmaprun')?.getAttribute('version') || '',
    xmloutputversion: xmlDoc.querySelector('nmaprun')?.getAttribute('xmloutputversion') || '',
    scope: scope,
  };

  return {
    scanInfo,
    hosts,
    totalHosts: hosts.length,
    totalPorts: hosts.reduce((sum, host) => sum + host.ports.length, 0),
  };
}

