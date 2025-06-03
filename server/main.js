const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const chokidar = require('chokidar'); // Import chokidar instead of watchdog

const app = express();
const server = require('http').createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://169.254.137.25:8000", "http://172.21.204.189"],
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(cors());

// Static file serving
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// Rate limiters (similar to Flask-Limiter)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000
});
app.use('/api/', apiLimiter);

// Load JSON Files
let status, banwaves, data, keys;

function loadJsonFiles() {
  try {
    status = JSON.parse(fs.readFileSync('./db/status.json', 'utf8'));
    banwaves = JSON.parse(fs.readFileSync('./db/banwaves.json', 'utf8'));
    data = JSON.parse(fs.readFileSync('./db/data.json', 'utf8'));
    keys = JSON.parse(fs.readFileSync('./db/keys.json', 'utf8'));
  } catch (err) {
    console.error("Files Failed Loading:", err);
  }
}

// Chokidar for auto-reloading on file changes
const watcher = chokidar.watch('./db', {
  persistent: true,
  ignoreInitial: true // Ignore initial add events
});

watcher.on('change', (filePath) => {
  console.log(`${filePath} changed, reloading...`);
  loadJsonFiles();
  if (filePath.includes("status.json")) {
    io.emit('change_banstate', {
      "status": "success",
      "banwave_active": status.banwave_active,
      "total_reported": status.total_reported
    });
  }
});

loadJsonFiles();

// Routes
app.get('/', (req, res) => {
  const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`User Loaded ${userIp}`);
  res.sendFile(path.join(__dirname, '../templates/Home.html'));
});

app.get('/api/info/status', (req, res) => {
  res.json({
    status: "success",
    banwave_active: status.banwave_active || false,
    total_reported: status.total_reported || 0
  });
});

app.get('/api/info/stats', (req, res) => {
  const banwaveDate = req.query.Date;
  const banwaveData = banwaves[banwaveDate] || {};
  res.json({
    status: true,
    total_banned: banwaveData.total_reported || 0,
    banwave_start_time: banwaveData.banwave_start_time || 'N/A',
    banwave_duration: banwaveData.banwave_duration || 'N/A'
  });
});

app.get('/api/reports/logs', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const banwaveData = data[today] || {};
    const reports = Object.values(banwaveData.Reports || {});
    const latestReports = reports.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    }).slice(0, 3);
    res.json({ status: true, latest_reports: latestReports });
  } catch (err) {
    res.json({ status: false, error: "Banwave date not found." });
  }
});

app.post('/api/reports/report', (req, res) => {
  const { 'api-key': apiKey, ban_info: banInfo } = req.body;
  if (!keys.Keys.includes(apiKey)) {
    return res.json({ status: false, message: "Invalid API key" });
  }

  const userId = banInfo.user_id;
  axios.get(`https://users.roblox.com/v1/users/${userId}`).then(response => {
    if (!response.data.isBanned) {
      return res.json({ status: true, message: "User not banned." });
    }

    const todayDate = new Date().toISOString().slice(0, 10);
    if (!data[todayDate]) {
      data[todayDate] = {
        total_reported: 0,
        banwave_start_time: new Date().toISOString(),
        Reports: {}
      };
    }

    data[todayDate].total_reported += 1;
    const reportNumber = Object.keys(data[todayDate].Reports).length + 1;
    banInfo.timestamp = new Date().toISOString();
    data[todayDate].Reports[reportNumber] = banInfo;

    fs.writeFileSync('./db/data.json', JSON.stringify(data, null, 4));
    io.emit('new_report', banInfo);

    res.json({ status: true, message: "Report logged successfully." });
  }).catch(err => {
    console.error(err);
    res.json({ status: false, message: "Error fetching user data." });
  });
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Start the server
server.listen(8000, () => {
  console.log('Server running on port 8000');
});
