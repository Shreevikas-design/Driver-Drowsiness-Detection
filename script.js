// ============================================================
// DROWSINESS DETECTION DASHBOARD - IMPROVED VERSION
// Features: Complete alarm logic, real-time updates, EAR graph
// ============================================================

// ========== Configuration ==========
const CONFIG = {
    updateInterval: 300,        // Update every 300ms for smooth UI
    jsonPath: '../build/status.json',
    earHistoryLength: 60,       // Show last 60 data points on graph
    awakeThreshold: 0.27,
    drowsyThreshold: 0.23,
    alarmLoopDelay: 500         // Delay between alarm repeats
};

// ========== State Management ==========
const state = {
    earHistory: [],
    timestamps: [],
    drowsyEventCount: 0,
    sessionStartTime: Date.now(),
    lastDrowsyState: false,
    audioUnlocked: false,
    isAlarmPlaying: false,
    isMuted: false,
    currentVolume: 0.7,
    connectionErrors: 0,
    lastSuccessfulUpdate: Date.now()
};

// ========== DOM Elements ==========
let elements = {};

// ========== Chart Instance ==========
let earChart = null;

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    initializeChart();
    initializeAudio();
    initializeControls();
    startUpdateLoop();
    updateSessionTime();
});

// ========== Element Initialization ==========
function initializeElements() {
    elements = {
        earValue: document.getElementById('earValue'),
        statusText: document.getElementById('statusText'),
        statusIndicator: document.getElementById('statusIndicator'),
        timestamp: document.getElementById('timestamp'),
        avgEAR: document.getElementById('avgEAR'),
        drowsyCount: document.getElementById('drowsyCount'),
        sessionTime: document.getElementById('sessionTime'),
        alarmSound: document.getElementById('alarmSound'),
        volumeSlider: document.getElementById('volumeSlider'),
        volumeValue: document.getElementById('volumeValue'),
        muteCheckbox: document.getElementById('muteCheckbox'),
        testAlarmBtn: document.getElementById('testAlarmBtn'),
        resetBtn: document.getElementById('resetBtn'),
        audioStatus: document.getElementById('audioStatus'),
        connectionStatus: document.getElementById('connectionStatus'),
        connectionText: document.getElementById('connectionText')
    };
}

// ========== Chart Initialization ==========
function initializeChart() {
    const ctx = document.getElementById('earChart').getContext('2d');
    
    earChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: state.timestamps,
            datasets: [{
                label: 'EAR Value',
                data: state.earHistory,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0.15,
                    max: 0.35,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#888',
                        callback: function(value) {
                            return value.toFixed(2);
                        }
                    }
                },
                x: {
                    display: false
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'EAR: ' + context.parsed.y.toFixed(3);
                        }
                    }
                },
                annotation: {
                    annotations: {
                        awakeThreshold: {
                            type: 'line',
                            yMin: CONFIG.awakeThreshold,
                            yMax: CONFIG.awakeThreshold,
                            borderColor: 'rgba(0, 255, 100, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5]
                        },
                        drowsyThreshold: {
                            type: 'line',
                            yMin: CONFIG.drowsyThreshold,
                            yMax: CONFIG.drowsyThreshold,
                            borderColor: 'rgba(255, 50, 50, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5]
                        }
                    }
                }
            }
        }
    });
}

// ========== Audio Initialization ==========
function initializeAudio() {
    // Set initial volume
    elements.alarmSound.volume = state.currentVolume;
    
    // Audio unlock on first user interaction
    const unlockAudio = async () => {
        if (!state.audioUnlocked) {
            try {
                // Try to play and immediately pause to unlock
                await elements.alarmSound.play();
                elements.alarmSound.pause();
                elements.alarmSound.currentTime = 0;
                
                state.audioUnlocked = true;
                elements.audioStatus.textContent = '✓ Audio Enabled';
                elements.audioStatus.classList.add('enabled');
                
                console.log('✓ Audio unlocked successfully');
            } catch (error) {
                console.warn('Audio unlock failed:', error);
            }
        }
    };
    
    // Listen for any user interaction
    ['click', 'touchstart', 'keydown'].forEach(eventType => {
        document.body.addEventListener(eventType, unlockAudio, { once: true });
    });
}

// ========== Control Initialization ==========
function initializeControls() {
    // Volume slider
    elements.volumeSlider.addEventListener('input', (e) => {
        state.currentVolume = e.target.value / 100;
        elements.alarmSound.volume = state.currentVolume;
        elements.volumeValue.textContent = e.target.value + '%';
    });
    
    // Mute checkbox
    elements.muteCheckbox.addEventListener('change', (e) => {
        state.isMuted = e.target.checked;
        if (state.isMuted && state.isAlarmPlaying) {
            stopAlarm();
        }
    });
    
    // Test alarm button
    elements.testAlarmBtn.addEventListener('click', async () => {
        if (!state.audioUnlocked) {
            alert('Please enable audio first by clicking anywhere on the page');
            return;
        }
        
        await playAlarmOnce();
    });
    
    // Reset session button
    elements.resetBtn.addEventListener('click', () => {
        if (confirm('Reset session statistics?')) {
            resetSession();
        }
    });
}

// ========== Main Update Loop ==========
function startUpdateLoop() {
    setInterval(async () => {
        await fetchAndUpdate();
    }, CONFIG.updateInterval);
    
    // Initial fetch
    fetchAndUpdate();
}

// ========== Fetch and Update Data ==========
async function fetchAndUpdate() {
    try {
        const response = await fetch(CONFIG.jsonPath + '?t=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update connection status
        updateConnectionStatus(true);
        state.lastSuccessfulUpdate = Date.now();
        state.connectionErrors = 0;
        
        // Update UI with new data
        updateDisplay(data);
        updateGraph(data.ear);
        updateStatistics(data);
        
        // Handle drowsiness detection and alarm
        await handleDrowsinessDetection(data);
        
    } catch (error) {
        console.error('Error fetching status:', error);
        state.connectionErrors++;
        
        if (state.connectionErrors > 5) {
            updateConnectionStatus(false, error.message);
        }
    }
}

// ========== Update Display ==========
function updateDisplay(data) {
    // Update EAR value
    elements.earValue.textContent = data.ear.toFixed(3);
    
    // Update status
    const isDrowsy = data.state === 'DROWSY';
    elements.statusText.textContent = data.state;
    
    // Update status indicator styling
    if (isDrowsy) {
        elements.statusIndicator.classList.remove('awake');
        elements.statusIndicator.classList.add('drowsy');
    } else {
        elements.statusIndicator.classList.remove('drowsy');
        elements.statusIndicator.classList.add('awake');
    }
    
    // Update timestamp
    const now = new Date();
    elements.timestamp.textContent = now.toLocaleTimeString();
}

// ========== Update Graph ==========
function updateGraph(earValue) {
    // Add new data point
    state.earHistory.push(earValue);
    state.timestamps.push('');
    
    // Keep only recent history
    if (state.earHistory.length > CONFIG.earHistoryLength) {
        state.earHistory.shift();
        state.timestamps.shift();
    }
    
    // Update chart
    earChart.data.labels = state.timestamps;
    earChart.data.datasets[0].data = state.earHistory;
    
    // Color the line based on current state
    const isDrowsy = earValue < CONFIG.drowsyThreshold;
    earChart.data.datasets[0].borderColor = isDrowsy ? '#ff3232' : '#00d4ff';
    earChart.data.datasets[0].backgroundColor = isDrowsy ? 
        'rgba(255, 50, 50, 0.1)' : 'rgba(0, 212, 255, 0.1)';
    
    earChart.update('none'); // Update without animation for smoothness
}

// ========== Update Statistics ==========
function updateStatistics(data) {
    // Calculate average EAR
    if (state.earHistory.length > 0) {
        const sum = state.earHistory.reduce((a, b) => a + b, 0);
        const avg = sum / state.earHistory.length;
        elements.avgEAR.textContent = avg.toFixed(3);
    }
    
    // Track drowsy events (transition from AWAKE to DROWSY)
    const isDrowsy = data.state === 'DROWSY';
    if (isDrowsy && !state.lastDrowsyState) {
        state.drowsyEventCount++;
        elements.drowsyCount.textContent = state.drowsyEventCount;
    }
    state.lastDrowsyState = isDrowsy;
}

// ========== Update Session Time ==========
function updateSessionTime() {
    setInterval(() => {
        const elapsed = Date.now() - state.sessionStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        elements.sessionTime.textContent = `${minutes}m ${seconds}s`;
    }, 1000);
}

// ========== Handle Drowsiness Detection ==========
async function handleDrowsinessDetection(data) {
    const isDrowsy = data.state === 'DROWSY';
    
    if (isDrowsy) {
        // Start alarm if not already playing
        if (!state.isAlarmPlaying && !state.isMuted && state.audioUnlocked) {
            await playAlarm();
        }
    } else {
        // Stop alarm when awake
        if (state.isAlarmPlaying) {
            stopAlarm();
        }
    }
}

// ========== Play Alarm (Continuous) ==========
async function playAlarm() {
    if (state.isAlarmPlaying) return;
    
    try {
        state.isAlarmPlaying = true;
        elements.alarmSound.currentTime = 0;
        await elements.alarmSound.play();
        console.log('🔔 Alarm started');
    } catch (error) {
        console.error('Alarm play error:', error);
        state.isAlarmPlaying = false;
    }
}

// ========== Play Alarm Once (for testing) ==========
async function playAlarmOnce() {
    try {
        const sound = elements.alarmSound.cloneNode();
        sound.volume = state.currentVolume;
        sound.loop = false;
        await sound.play();
        console.log('🔔 Test alarm played');
    } catch (error) {
        console.error('Test alarm error:', error);
    }
}

// ========== Stop Alarm ==========
function stopAlarm() {
    if (!state.isAlarmPlaying) return;
    
    try {
        elements.alarmSound.pause();
        elements.alarmSound.currentTime = 0;
        state.isAlarmPlaying = false;
        console.log('🔕 Alarm stopped');
    } catch (error) {
        console.error('Alarm stop error:', error);
    }
}

// ========== Update Connection Status ==========
function updateConnectionStatus(connected, errorMsg = '') {
    if (connected) {
        elements.connectionStatus.classList.remove('error');
        elements.connectionStatus.classList.add('connected');
        elements.connectionText.textContent = 'Connected';
    } else {
        elements.connectionStatus.classList.remove('connected');
        elements.connectionStatus.classList.add('error');
        elements.connectionText.textContent = errorMsg || 'Connection Error';
    }
}

// ========== Reset Session ==========
function resetSession() {
    state.earHistory = [];
    state.timestamps = [];
    state.drowsyEventCount = 0;
    state.sessionStartTime = Date.now();
    state.lastDrowsyState = false;
    
    // Update UI
    elements.drowsyCount.textContent = '0';
    elements.avgEAR.textContent = '0.000';
    
    // Clear chart
    earChart.data.labels = [];
    earChart.data.datasets[0].data = [];
    earChart.update();
    
    console.log('Session reset');
}

// ========== Error Handling ==========
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ========== Visibility Change Handler ==========
document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.isAlarmPlaying) {
        // Keep alarm playing even when tab is hidden
        console.log('Tab hidden, alarm continues...');
    }
});
