const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

function getNetworkIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getNetworkIp();

console.log('\n============================================================');
console.log('   🚀 STARTING GATE WATCHDOG (PREPARATION TRACKER)        ');
console.log('============================================================');
console.log(`💻 Laptop Browser:  http://localhost:3000`);
console.log(`📱 Phone (Same Wi-Fi): http://${localIp}:3000`);
console.log(`🔌 Backend API:     http://localhost:5050`);
console.log('============================================================\n');

// Start backend server
const serverProcess = spawn('node', ['server/server.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

// Start client Vite dev server
const clientProcess = spawn('npm', ['run', 'dev', '--', '--host'], {
  cwd: path.join(__dirname, '../client'),
  stdio: 'inherit'
});

function cleanup() {
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
