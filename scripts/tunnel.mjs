import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const urlFile = path.resolve('scratch/tunnel_url.txt');
fs.mkdirSync(path.resolve('scratch'), { recursive: true });

function startTunnel() {
  console.log('[TUNNEL] Starting Pinggy SSH tunnel on port 443...');
  const child = spawn('ssh', [
    '-p', '443',
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ServerAliveCountMax=3',
    '-R', '80:localhost:3000',
    'a.pinggy.io'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  let urlCaptured = false;

  const processOutput = (data) => {
    const text = data.toString();
    process.stdout.write(text);

    const matches = text.match(/https:\/\/[a-z0-9-]+\.(?:run\.pinggy-free\.link|free\.pinggy\.net)/gi);
    if (matches && matches.length > 0 && !urlCaptured) {
      urlCaptured = true;
      const primaryUrl = matches[0];
      fs.writeFileSync(urlFile, primaryUrl, 'utf8');
      console.log(`\n=========================================\n[TUNNEL ONLINE] ${primaryUrl}\n=========================================\n`);
    }
  };

  child.stdout.on('data', processOutput);
  child.stderr.on('data', processOutput);

  child.on('close', (code) => {
    console.log(`[TUNNEL] Process exited with code ${code}. Reconnecting in 5 seconds...`);
    urlCaptured = false;
    setTimeout(startTunnel, 5000);
  });

  child.on('error', (err) => {
    console.error('[TUNNEL ERROR]', err);
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();
