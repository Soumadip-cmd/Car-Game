// Game State Management
class GameState {
    constructor() {
        this.cars = [
            {
                id: 1,
                name: "Lightning Bolt",
                color: "#ff0000",
                type: "sports",
                speed: 6,
            },
            {
                id: 2,
                name: "Night Rider", 
                color: "#000000",
                type: "sedan",
                speed: 5,
            },
            {
                id: 3,
                name: "Desert Storm",
                color: "#FFD700", 
                type: "suv",
                speed: 7,
            },
        ];
        
        this.currentCar = null;
        this.selectedColor = "#ff0000";
        this.selectedType = "sedan";
        this.selectedSpeed = 5;
        this.selectedTrack = "day";
        
        this.gameRunning = false;
        this.gamePaused = false;
        
        this.player = {
            x: 150,
            lane: 1,
            jumping: false,
            shield: false,
            shieldTime: 0,
        };
        
        this.obstacles = [];
        this.powerups = [];
        this.particles = [];
        
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem("carGameHighScore") || "0");
        this.baseSpeed = 1;
        this.currentSpeed = 1;
        this.maxSpeed = 8;
        this.minSpeed = 0.5;
        this.jumpsLeft = 0;
        
        this.keys = {};
        this.roadLines = [];
        this.activePowerup = null;
        this.powerupTime = 0;
        
        this.achievements = {
            firstRace: false,
            score1000: false,
            score5000: false,
            speed10: false,
            jumpMaster: false,
            powerupCollector: false,
            nightRacer: false,
            perfectRun: false,
        };
        
        this.stats = {
            gamesPlayed: parseInt(localStorage.getItem("gamesPlayed") || "0"),
            totalScore: parseInt(localStorage.getItem("totalScore") || "0"),
            powerupsCollected: parseInt(localStorage.getItem("powerupsCollected") || "0"),
            jumpsUsed: parseInt(localStorage.getItem("jumpsUsed") || "0"),
        };
        
        this.isMobile = window.innerWidth <= 768;
        this.lanes = this.calculateLanes();
    }
    
    calculateLanes() {
        const roadContainer = document.querySelector('.road-container');
        const roadWidth = roadContainer ? roadContainer.offsetWidth : (this.isMobile ? 250 : 300);
        const laneWidth = roadWidth / 4;
        const carWidth = this.isMobile ? 30 : 35;
        return [
            laneWidth * 0.5 - carWidth/2,
            laneWidth * 1.5 - carWidth/2, 
            laneWidth * 2.5 - carWidth/2,
            laneWidth * 3.5 - carWidth/2
        ];
    }
    
    updateLanes() {
        this.lanes = this.calculateLanes();
        if (this.gameRunning) {
            this.player.x = this.lanes[this.player.lane];
            const playerCar = document.getElementById("player-car");
            if (playerCar) {
                playerCar.style.left = this.player.x + "px";
            }
        }
    }
}

// Initialize game state
const gameState = new GameState();

// Track types configuration
const trackTypes = {
    day: { bg: "#87CEEB", roadClass: "", name: "🌅 Day Track" },
    night: { bg: "#191970", roadClass: "night", name: "🌙 Night Track" },
    desert: { bg: "#CD853F", roadClass: "desert", name: "🏜️ Desert Track" },
    snow: { bg: "#B0E0E6", roadClass: "snow", name: "❄️ Snow Track" },
};

// Car SVG Generation
function createCarSVG(color, type = "sedan", size = "normal") {
    const scale = size === "large" ? 1.3 : (gameState.isMobile ? 0.9 : 1);
    const width = 40 * scale;
    const height = 60 * scale;

    const carTemplates = {
        sedan: `<svg width="${width}" height="${height}" viewBox="0 0 40 60">
            <rect x="8" y="10" width="24" height="40" fill="${color}" stroke="#000" stroke-width="1.5" rx="5"/>
            <rect x="6" y="6" width="28" height="10" fill="${color}" stroke="#000" stroke-width="1.5" rx="6"/>
            <rect x="6" y="44" width="28" height="10" fill="${color}" stroke="#000" stroke-width="1.5" rx="6"/>
            <circle cx="12" cy="16" r="3" fill="#1a1a1a"/>
            <circle cx="28" cy="16" r="3" fill="#1a1a1a"/>
            <circle cx="12" cy="44" r="3" fill="#1a1a1a"/>
            <circle cx="28" cy="44" r="3" fill="#1a1a1a"/>
            <rect x="14" y="20" width="12" height="8" fill="#87CEEB" stroke="#000" stroke-width="1" rx="2"/>
            <rect x="14" y="32" width="12" height="8" fill="#87CEEB" stroke="#000" stroke-width="1" rx="2"/>
            <rect x="16" y="4" width="8" height="5" fill="#FFD700" stroke="#000" stroke-width="1" rx="1"/>
            <rect x="16" y="51" width="8" height="5" fill="#FF4500" stroke="#000" stroke-width="1" rx="1"/>
        </svg>`,

        sports: `<svg width="${width}" height="${height}" viewBox="0 0 40 60">
            <path d="M10 8 L30 8 Q34 12 32 20 L32 40 Q34 48 30 52 L10 52 Q6 48 8 40 L8 20 Q6 12 10 8 Z" fill="${color}" stroke="#000" stroke-width="1.5"/>
            <circle cx="12" cy="18" r="3" fill="#1a1a1a"/>
            <circle cx="28" cy="18" r="3" fill="#1a1a1a"/>
            <circle cx="12" cy="42" r="3" fill="#1a1a1a"/>
            <circle cx="28" cy="42" r="3" fill="#1a1a1a"/>
            <path d="M14 22 Q20 20 26 22 L26 28 Q20 26 14 28 Z" fill="#87CEEB" stroke="#000" stroke-width="1"/>
            <path d="M14 32 Q20 30 26 32 L26 38 Q20 36 14 38 Z" fill="#87CEEB" stroke="#000" stroke-width="1"/>
            <rect x="16" y="5" width="8" height="6" fill="#FFD700" stroke="#000" stroke-width="1" rx="2"/>
            <rect x="16" y="49" width="8" height="6" fill="#FF4500" stroke="#000" stroke-width="1" rx="2"/>
        </svg>`,

        suv: `<svg width="${width}" height="${height}" viewBox="0 0 40 60">
            <rect x="6" y="8" width="28" height="44" fill="${color}" stroke="#000" stroke-width="1.5" rx="5"/>
            <rect x="8" y="5" width="24" height="12" fill="${color}" stroke="#000" stroke-width="1.5" rx="6"/>
            <rect x="8" y="43" width="24" height="12" fill="${color}" stroke="#000" stroke-width="1.5" rx="6"/>
            <circle cx="12" cy="16" r="4" fill="#1a1a1a"/>
            <circle cx="28" cy="16" r="4" fill="#1a1a1a"/>
            <circle cx="12" cy="44" r="4" fill="#1a1a1a"/>
            <circle cx="28" cy="44" r="4" fill="#1a1a1a"/>
            <rect x="12" y="20" width="16" height="8" fill="#87CEEB" stroke="#000" stroke-width="1" rx="2"/>
            <rect x="12" y="32" width="16" height="8" fill="#87CEEB" stroke="#000" stroke-width="1" rx="2"/>
            <rect x="14" y="2" width="12" height="5" fill="#FFD700" stroke="#000" stroke-width="1" rx="1"/>
            <rect x="14" y="53" width="12" height="5" fill="#FF4500" stroke="#000" stroke-width="1" rx="1"/>
        </svg>`,

        truck: `<svg width="${width}" height="${height}" viewBox="0 0 40 60">
            <rect x="5" y="6" width="30" height="48" fill="${color}" stroke="#000" stroke-width="1.5" rx="3"/>
            <rect x="6" y="4" width="28" height="14" fill="${color}" stroke="#000" stroke-width="1.5" rx="5"/>
            <rect x="6" y="42" width="28" height="14" fill="${color}" stroke="#000" stroke-width="1.5" rx="5"/>
            <circle cx="12" cy="14" r="4" fill="#1a1a1a"/>
            <circle cx="28" cy="14" r="4" fill="#1a1a1a"/>
            <circle cx="12" cy="46" r="4" fill="#1a1a1a"/>
            <circle cx="28" cy="46" r="4" fill="#1a1a1a"/>
            <rect x="10" y="20" width="20" height="10" fill="#87CEEB" stroke="#000" stroke-width="1" rx="2"/>
            <rect x="10" y="32" width="20" height="7" fill="#87CEEB" stroke="#000" stroke-width="1" rx="2"/>
            <rect x="13" y="1" width="14" height="5" fill="#FFD700" stroke="#000" stroke-width="1" rx="1"/>
            <rect x="13" y="54" width="14" height="5" fill="#FF4500" stroke="#000" stroke-width="1" rx="1"/>
        </svg>`
    };

    return carTemplates[type] || carTemplates.sedan;
}

// Power-up SVG Generation
function createPowerupSVG(type) {
    const size = gameState.isMobile ? 25 : 30;
    const powerupTemplates = {
        shield: `<svg width="${size}" height="${size}" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="13" fill="none" stroke="#00FFFF" stroke-width="2"/>
            <path d="M15 4 L23 11 L20 19 L15 23 L10 19 L7 11 Z" fill="#00FFFF" opacity="0.7"/>
            <text x="15" y="19" text-anchor="middle" fill="white" font-size="10">🛡</text>
        </svg>`,

        speed: `<svg width="${size}" height="${size}" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="13" fill="none" stroke="#FFD700" stroke-width="2"/>
            <circle cx="15" cy="15" r="9" fill="#FFD700" opacity="0.7"/>
            <text x="15" y="19" text-anchor="middle" fill="white" font-size="10">⚡</text>
        </svg>`,

        jump: `<svg width="${size}" height="${size}" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="13" fill="none" stroke="#00FF00" stroke-width="2"/>
            <circle cx="15" cy="15" r="9" fill="#00FF00" opacity="0.7"/>
            <text x="15" y="19" text-anchor="middle" fill="white" font-size="10">🚀</text>
        </svg>`,

        score: `<svg width="${size}" height="${size}" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="13" fill="none" stroke="#FF69B4" stroke-width="2"/>
            <circle cx="15" cy="15" r="9" fill="#FF69B4" opacity="0.7"/>
            <text x="15" y="19" text-anchor="middle" fill="white" font-size="10">💰</text>
        </svg>`
    };

    return powerupTemplates[type] || powerupTemplates.score;
}

// Screen Management
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.add("hidden");
    });

    // Show selected screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove("hidden");
    }

    // Handle screen-specific logic
    switch (screenId) {
        case "menu-screen":
            updateMenuStats();
            updateAchievementsPreview();
            loadStats();
            break;
        case "select-screen":
            populateCarSelectionList();
            break;
        case "garage-screen":
            populateGarage();
            break;
        case "achievements-screen":
            updateAchievementsList();
            break;
        case "create-screen":
            resetCarCreator();
            break;
    }
}

// Menu Screen Functions
function updateMenuStats() {
    const highScoreEl = document.getElementById("menu-high-score");
    const gamesPlayedEl = document.getElementById("menu-games-played");
    
    if (highScoreEl) highScoreEl.textContent = gameState.highScore;
    if (gamesPlayedEl) gamesPlayedEl.textContent = gameState.stats.gamesPlayed;
}

function updateAchievementsPreview() {
    const container = document.getElementById("achievements-preview-list");
    if (!container) return;
    
    const unlockedAchievements = Object.entries(gameState.achievements)
        .filter(([key, unlocked]) => unlocked)
        .slice(0, 3);

    if (unlockedAchievements.length === 0) {
        container.innerHTML = '<p style="color: #ccc; text-align: center;">No achievements unlocked yet</p>';
        return;
    }

    const achievementNames = {
        firstRace: "🏁 First Race",
        score1000: "🎯 Score Master",
        score5000: "🏆 High Scorer",
        speed10: "🔥 Speed Demon",
        jumpMaster: "🚀 Jump Master",
        powerupCollector: "💎 Power-up Collector",
        nightRacer: "🌙 Night Racer",
        perfectRun: "✨ Perfect Run"
    };

    container.innerHTML = unlockedAchievements
        .map(([key]) => `<div style="color: #4CAF50; margin: 5px 0;">${achievementNames[key]}</div>`)
        .join("");
}

// Track Selection Setup
function setupTrackSelection() {
    document.querySelectorAll(".track-option").forEach(option => {
        option.addEventListener("click", function() {
            document.querySelectorAll(".track-option").forEach(opt => opt.classList.remove("selected"));
            this.classList.add("selected");
            gameState.selectedTrack = this.dataset.track;
        });
    });
}

// Car Selection Functions
function populateCarSelectionList() {
    const container = document.getElementById("car-selection-list");
    if (!container) return;
    
    container.innerHTML = "";

    gameState.cars.forEach(car => {
        const carCard = document.createElement("div");
        carCard.className = "car-card";
        carCard.innerHTML = `
            <div class="car-preview-container">
                <div class="car-preview">${createCarSVG(car.color, car.type || "sedan")}</div>
            </div>
            <div class="car-info">
                <h4>${car.name}</h4>
                <div class="car-stats">
                    <div class="car-stat">Type: ${(car.type || "sedan").charAt(0).toUpperCase() + (car.type || "sedan").slice(1)}</div>
                    <div class="car-stat">Speed: ${car.speed || 5}/10</div>
                </div>
            </div>
        `;

        carCard.addEventListener("click", () => selectCarAndStartGame(car));
        container.appendChild(carCard);
    });
}

function selectCarAndStartGame(car) {
    gameState.currentCar = car;
    gameState.maxSpeed = (car.speed || 5) + 2;
    gameState.minSpeed = Math.max(0.5, (car.speed || 5) * 0.3);
    
    const carNameEl = document.getElementById("current-car-name");
    const trackDisplayEl = document.getElementById("current-track-display");
    
    if (carNameEl) carNameEl.textContent = car.name;
    if (trackDisplayEl) trackDisplayEl.textContent = trackTypes[gameState.selectedTrack].name;
    
    // Update player car visual
    const playerCarEl = document.getElementById("player-car");
    if (playerCarEl) {
        playerCarEl.innerHTML = createCarSVG(car.color, car.type || "sedan");
    }
    
    applyTrackTheme();
    showScreen("game-screen");
    startGame();
}

// Garage Functions
function populateGarage() {
    const container = document.getElementById("garage-car-list");
    if (!container) return;
    
    container.innerHTML = "";

    gameState.cars.forEach((car, index) => {
        const carCard = document.createElement("div");
        carCard.className = "car-card";
        carCard.innerHTML = `
            <div class="car-preview-container">
                <div class="car-preview">${createCarSVG(car.color, car.type || "sedan")}</div>
            </div>
            <div class="car-info">
                <h4>${car.name}</h4>
                <div class="car-stats">
                    <div class="car-stat">Type: ${(car.type || "sedan").charAt(0).toUpperCase() + (car.type || "sedan").slice(1)}</div>
                    <div class="car-stat">Speed: ${car.speed || 5}/10</div>
                    <div class="car-stat">Color: ${car.color}</div>
                </div>
            </div>
            ${index >= 3 ? `<button class="btn btn-warning btn-small" onclick="deleteCar(${car.id})" style="position: absolute; top: 10px; right: 10px;">🗑️</button>` : ''}
        `;

        container.appendChild(carCard);
    });
}

function deleteCar(carId) {
    if (confirm("Are you sure you want to delete this car?")) {
        gameState.cars = gameState.cars.filter(car => car.id !== carId);
        populateGarage();
    }
}

function resetGarage() {
    if (confirm("This will delete all custom cars and reset to defaults. Are you sure?")) {
        gameState.cars = [
            { id: 1, name: "Lightning Bolt", color: "#ff0000", type: "sports", speed: 6 },
            { id: 2, name: "Night Rider", color: "#000000", type: "sedan", speed: 5 },
            { id: 3, name: "Desert Storm", color: "#FFD700", type: "suv", speed: 7 },
        ];
        populateGarage();
    }
}

// Car Creator Functions
function setupCarCreator() {
    // Color selection
    document.querySelectorAll(".color-option").forEach(option => {
        option.addEventListener("click", function() {
            document.querySelectorAll(".color-option").forEach(opt => opt.classList.remove("selected"));
            this.classList.add("selected");
            gameState.selectedColor = this.dataset.color;
            updateCarPreview();
        });
    });

    // Car type selection
    document.querySelectorAll(".car-type-option").forEach(option => {
        option.addEventListener("click", function() {
            document.querySelectorAll(".car-type-option").forEach(opt => opt.classList.remove("selected"));
            this.classList.add("selected");
            gameState.selectedType = this.dataset.type;
            updateCarPreview();
        });
    });

    // Speed slider
    const speedSlider = document.getElementById("speed-slider");
    const speedValue = document.getElementById("speed-value");

    if (speedSlider && speedValue) {
        speedSlider.addEventListener("input", function() {
            gameState.selectedSpeed = parseInt(this.value);
            speedValue.textContent = this.value;
        });
    }

    // Initialize car type previews
    const previewIds = ["sedan-preview", "sports-preview", "suv-preview", "truck-preview"];
    const types = ["sedan", "sports", "suv", "truck"];
    
    previewIds.forEach((id, index) => {
        const preview = document.getElementById(id);
        if (preview) {
            preview.innerHTML = createCarSVG("#888", types[index]);
        }
    });

    updateCarPreview();
}

function resetCarCreator() {
    const carNameInput = document.getElementById("car-name");
    const speedSlider = document.getElementById("speed-slider");
    const speedValue = document.getElementById("speed-value");
    
    if (carNameInput) carNameInput.value = "";
    if (speedSlider) speedSlider.value = 5;
    if (speedValue) speedValue.textContent = 5;
    
    gameState.selectedSpeed = 5;
    gameState.selectedColor = "#ff0000";
    gameState.selectedType = "sedan";

    // Reset selections
    document.querySelectorAll(".color-option").forEach(opt => opt.classList.remove("selected"));
    const redOption = document.querySelector('.color-option[data-color="#ff0000"]');
    if (redOption) redOption.classList.add("selected");
    
    document.querySelectorAll(".car-type-option").forEach(opt => opt.classList.remove("selected"));
    const sedanOption = document.querySelector('.car-type-option[data-type="sedan"]');
    if (sedanOption) sedanOption.classList.add("selected");

    updateCarPreview();
}

function updateCarPreview() {
    const preview = document.getElementById("car-preview");
    if (preview) {
        preview.innerHTML = createCarSVG(gameState.selectedColor, gameState.selectedType, "large");
    }
}

function saveCar() {
    const nameInput = document.getElementById("car-name");
    const name = nameInput ? nameInput.value.trim() : "";
    
    if (!name) {
        alert("Please enter a car name!");
        return;
    }

    if (name.length > 20) {
        alert("Car name must be 20 characters or less!");
        return;
    }

    const car = {
        id: Date.now(),
        name: name,
        color: gameState.selectedColor,
        type: gameState.selectedType,
        speed: gameState.selectedSpeed,
    };

    gameState.cars.push(car);
    showScreen("garage-screen");
}

// Track Theme Application
function applyTrackTheme() {
    const gameArea = document.getElementById("game-area");
    const road = document.querySelector(".road");
    
    if (!gameArea || !road) return;
    
    const theme = trackTypes[gameState.selectedTrack];
    
    // Reset classes
    gameArea.className = "game-area";
    road.className = "road";
    
    // Apply theme
    if (theme.roadClass) {
        gameArea.classList.add(theme.roadClass);
        road.classList.add(theme.roadClass);
    }
}

// Game Core Functions
function startGame() {
    gameState.gameRunning = true;
    gameState.gamePaused = false;
    
    // Reset game state
    gameState.updateLanes();
    gameState.player = {
        x: gameState.lanes[1],
        lane: 1,
        jumping: false,
        shield: false,
        shieldTime: 0,
    };
    
    gameState.obstacles = [];
    gameState.powerups = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.baseSpeed = 1;
    gameState.currentSpeed = 1;
    gameState.jumpsLeft = 0;
    gameState.activePowerup = null;
    gameState.powerupTime = 0;
    gameState.stats.gamesPlayed++;

    // Reset UI
    const gameOverModal = document.getElementById("game-over-modal");
    const pauseModal = document.getElementById("pause-modal");
    const highScoreEl = document.getElementById("high-score");
    
    if (gameOverModal) gameOverModal.classList.add("hidden");
    if (pauseModal) pauseModal.classList.add("hidden");
    if (highScoreEl) highScoreEl.textContent = gameState.highScore;

    // Position player car
    const playerCar = document.getElementById("player-car");
    if (playerCar) {
        playerCar.style.left = gameState.player.x + "px";
        playerCar.classList.remove("shielded");
    }

    // Create road lines
    createRoadLines();
    updateMobileControlsState();
    updateHUD();
    
    // Check first race achievement
    if (!gameState.achievements.firstRace) {
        gameState.achievements.firstRace = true;
        showAchievement("🏁 First Race Complete!");
    }
    
    gameLoop();
}

function createRoadLines() {
    const road = document.querySelector(".road");
    if (!road) return;
    
    road.innerHTML = "";

    for (let i = 0; i < 30; i++) {
        const line1 = document.createElement("div");
        line1.className = "road-line";
        line1.style.top = (i * 50 - 30) + "px";
        line1.style.animationDelay = (i * 0.1) + "s";
        road.appendChild(line1);

        const line2 = document.createElement("div");
        line2.className = "road-line";
        line2.style.top = (i * 50 - 30) + "px";
        line2.style.animationDelay = (i * 0.1) + "s";
        road.appendChild(line2);
    }
}

function pauseGame() {
    if (gameState.gameRunning && !gameState.gamePaused) {
        gameState.gamePaused = true;
        const pauseModal = document.getElementById("pause-modal");
        if (pauseModal) pauseModal.classList.remove("hidden");
    }
}

function resumeGame() {
    if (gameState.gamePaused) {
        gameState.gamePaused = false;
        const pauseModal = document.getElementById("pause-modal");
        if (pauseModal) pauseModal.classList.add("hidden");
        gameLoop();
    }
}

function restartGame() {
    startGame();
}

function gameLoop() {
    if (!gameState.gameRunning || gameState.gamePaused) return;

    handleInput();
    updateSpeed();
    updatePowerups();
    updateObstacles();
    updatePowerupSpawns();
    checkCollisions();
    updateScore();
    updateParticles();
    updateHUD();
    updateMobileControlsState();
    checkAchievements();

    requestAnimationFrame(gameLoop);
}

// Input Handling
function handleInput() {
    // Left movement
    if (gameState.keys["ArrowLeft"] && gameState.player.lane > 0) {
        gameState.player.lane--;
        gameState.player.x = gameState.lanes[gameState.player.lane];
        const playerCar = document.getElementById("player-car");
        if (playerCar) playerCar.style.left = gameState.player.x + "px";
        gameState.keys["ArrowLeft"] = false;
    }

    // Right movement
    if (gameState.keys["ArrowRight"] && gameState.player.lane < 3) {
        gameState.player.lane++;
        gameState.player.x = gameState.lanes[gameState.player.lane];
        const playerCar = document.getElementById("player-car");
        if (playerCar) playerCar.style.left = gameState.player.x + "px";
        gameState.keys["ArrowRight"] = false;
    }

    // Jump
    if (gameState.keys[" "] && gameState.jumpsLeft > 0 && !gameState.player.jumping) {
        jump();
        gameState.keys[" "] = false;
    }

    // Pause
    if (gameState.keys["KeyP"]) {
        pauseGame();
        gameState.keys["KeyP"] = false;
    }
}

// Speed Management
function updateSpeed() {
    let speedMultiplier = 1;
    
    // Track-specific modifiers
    switch (gameState.selectedTrack) {
        case "snow":
            speedMultiplier = 0.9;
            break;
        case "desert":
            speedMultiplier = 1.1;
            break;
    }

    // Power-up modifier
    if (gameState.activePowerup === "speed") {
        speedMultiplier *= 1.5;
    }

    // Manual speed control
    if (gameState.keys["ArrowUp"]) {
        gameState.currentSpeed = Math.min(
            gameState.currentSpeed + 0.08,
            gameState.maxSpeed * speedMultiplier
        );
    }

    if (gameState.keys["ArrowDown"]) {
        gameState.currentSpeed = Math.max(
            gameState.currentSpeed - 0.15,
            gameState.minSpeed
        );
    }

    // Natural acceleration
    gameState.currentSpeed = Math.min(
        gameState.currentSpeed + 0.003,
        gameState.maxSpeed * speedMultiplier
    );
}

// Power-up Management
function updatePowerups() {
    // Active power-up timer
    if (gameState.activePowerup) {
        gameState.powerupTime--;
        if (gameState.powerupTime <= 0) {
            deactivatePowerup();
        }
    }

    // Shield timer
    if (gameState.player.shield && gameState.player.shieldTime > 0) {
        gameState.player.shieldTime--;
        if (gameState.player.shieldTime <= 0) {
            gameState.player.shield = false;
            const playerCar = document.getElementById("player-car");
            if (playerCar) playerCar.classList.remove("shielded");
        }
    }
}

function updatePowerupSpawns() {
    // Spawn power-ups
    if (Math.random() < 0.015) {
        const powerupTypes = ["shield", "speed", "jump", "jump", "score"]; // Extra jump chances
        const powerup = {
            id: Date.now(),
            type: powerupTypes[Math.floor(Math.random() * powerupTypes.length)],
            x: gameState.lanes[Math.floor(Math.random() * 4)],
            y: -40,
            element: null,
        };

        const element = document.createElement("div");
        element.className = "powerup";
        element.innerHTML = createPowerupSVG(powerup.type);
        element.style.left = powerup.x + "px";
        element.style.top = powerup.y + "px";
        const gameArea = document.getElementById("game-area");
        if (gameArea) gameArea.appendChild(element);

        powerup.element = element;
        gameState.powerups.push(powerup);
    }

    // Move power-ups
    gameState.powerups = gameState.powerups.filter(powerup => {
        powerup.y += gameState.currentSpeed * 2 + 3;
        powerup.element.style.top = powerup.y + "px";

        if (powerup.y > window.innerHeight) {
            powerup.element.remove();
            return false;
        }
        return true;
    });
}

function jump() {
    if (gameState.jumpsLeft > 0) {
        gameState.player.jumping = true;
        gameState.jumpsLeft--;
        gameState.stats.jumpsUsed++;
        const playerCar = document.getElementById("player-car");
        if (playerCar) {
            playerCar.classList.add("jumping");
            // Add dramatic jump effect
            playerCar.style.transform = "translateX(-50%) translateY(-40px) scale(1.2)";
        }

        createParticles(gameState.player.x + 20, window.innerHeight * 0.8, "#00FF00", 15);

        setTimeout(() => {
            gameState.player.jumping = false;
            const playerCar = document.getElementById("player-car");
            if (playerCar) {
                playerCar.classList.remove("jumping");
                playerCar.style.transform = "translateX(-50%) translateY(0) scale(1)";
            }
        }, 800);
    }
}

// Obstacle Management
function updateObstacles() {
    const difficultyMultiplier = 1 + gameState.score / 5000;
    const obstacleChance = (0.008 + gameState.currentSpeed * 0.002) * difficultyMultiplier;

    if (Math.random() < obstacleChance) {
        const obstacle = {
            id: Date.now(),
            x: gameState.lanes[Math.floor(Math.random() * 4)],
            y: -75,
            element: null,
        };

        const element = document.createElement("div");
        element.className = "obstacle";
        const carTypes = ["sedan", "sports", "suv", "truck"];
        const obstacleColors = ["#ff0000", "#ff4500", "#8B0000", "#DC143C"];
        const randomType = carTypes[Math.floor(Math.random() * 4)];
        const randomColor = obstacleColors[Math.floor(Math.random() * obstacleColors.length)];
        
        element.innerHTML = createCarSVG(randomColor, randomType);
        element.style.left = obstacle.x + "px";
        element.style.top = obstacle.y + "px";
        const gameArea = document.getElementById("game-area");
        if (gameArea) gameArea.appendChild(element);

        obstacle.element = element;
        gameState.obstacles.push(obstacle);
    }

    // Move obstacles
    gameState.obstacles = gameState.obstacles.filter(obstacle => {
        obstacle.y += gameState.currentSpeed * 3 + 4;
        obstacle.element.style.top = obstacle.y + "px";

        if (obstacle.y > window.innerHeight) {
            obstacle.element.remove();
            return false;
        }
        return true;
    });
}

// Collision Detection
function checkCollisions() {
    const playerY = window.innerHeight * 0.8;

    // Obstacle collisions
    if (!gameState.player.jumping && !gameState.player.shield) {
        gameState.obstacles.forEach(obstacle => {
            if (
                Math.abs(obstacle.x - gameState.player.x) < 25 &&
                obstacle.y > playerY - 30 &&
                obstacle.y < playerY + 30
            ) {
                gameOver();
            }
        });
    }

    // Power-up collisions
    gameState.powerups = gameState.powerups.filter(powerup => {
        if (
            Math.abs(powerup.x - gameState.player.x) < 30 &&
            powerup.y > playerY - 30 &&
            powerup.y < playerY + 30
        ) {
            collectPowerup(powerup);
            powerup.element.remove();
            return false;
        }
        return true;
    });
}

function collectPowerup(powerup) {
    gameState.stats.powerupsCollected++;
    
    // Create collection effect with sound-like visual feedback
    createCollectionEffect(powerup.x + 15, powerup.y + 15, powerup.type);

    switch (powerup.type) {
        case "shield":
            gameState.player.shield = true;
            gameState.player.shieldTime = 300;
            const playerCar = document.getElementById("player-car");
            if (playerCar) playerCar.classList.add("shielded");
            break;
        case "speed":
            activatePowerup("speed", 360);
            break;
        case "jump":
            gameState.jumpsLeft = Math.min(gameState.jumpsLeft + 2, 5);
            break;
        case "score":
            gameState.score += 500;
            break;
    }

    if (gameState.stats.powerupsCollected >= 10 && !gameState.achievements.powerupCollector) {
        gameState.achievements.powerupCollector = true;
        showAchievement("💎 Power-up Collector!");
    }
}

function createCollectionEffect(x, y, type) {
    // Create burst effect
    const colors = {
        shield: "#00FFFF",
        speed: "#FFD700", 
        jump: "#00FF00",
        score: "#FF69B4"
    };
    
    createParticles(x, y, colors[type] || "#FFD700", 20);
    
    // Create expanding circle effect
    const effect = document.createElement("div");
    effect.style.cssText = `
        position: absolute;
        left: ${x - 15}px;
        top: ${y - 15}px;
        width: 30px;
        height: 30px;
        border: 3px solid ${colors[type] || "#FFD700"};
        border-radius: 50%;
        z-index: 20;
        pointer-events: none;
        animation: collectEffect 0.6s ease-out forwards;
    `;
    
    const gameArea = document.getElementById("game-area");
    if (gameArea) gameArea.appendChild(effect);
    
    setTimeout(() => effect.remove(), 600);
}

function activatePowerup(type, duration) {
    gameState.activePowerup = type;
    gameState.powerupTime = duration;
}

function deactivatePowerup() {
    gameState.activePowerup = null;
    gameState.powerupTime = 0;
}

// Particle System
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const particle = {
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 60,
            color: color,
            element: null,
        };

        const element = document.createElement("div");
        element.className = "particle";
        element.style.left = particle.x + "px";
        element.style.top = particle.y + "px";
        element.style.background = color;
        const particlesContainer = document.getElementById("particles");
        if (particlesContainer) particlesContainer.appendChild(element);

        particle.element = element;
        gameState.particles.push(particle);
    }
}

function updateParticles() {
    gameState.particles = gameState.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;

        particle.element.style.left = particle.x + "px";
        particle.element.style.top = particle.y + "px";
        particle.element.style.opacity = particle.life / 60;

        if (particle.life <= 0) {
            particle.element.remove();
            return false;
        }
        return true;
    });
}

// Score Management
function updateScore() {
    gameState.score += gameState.currentSpeed * 0.5;
    gameState.stats.totalScore += gameState.currentSpeed * 0.5;

    // Difficulty increase
    if (Math.floor(gameState.score) % 1500 === 0) {
        gameState.baseSpeed += 0.1;
    }
}

// UI Updates
function updateHUD() {
    const scoreEl = document.getElementById("score");
    const highScoreEl = document.getElementById("high-score");
    const speedEl = document.getElementById("current-speed");
    const jumpsEl = document.getElementById("jumps");
    
    if (scoreEl) scoreEl.textContent = Math.floor(gameState.score);
    if (highScoreEl) highScoreEl.textContent = gameState.highScore;
    if (speedEl) speedEl.textContent = gameState.currentSpeed.toFixed(1);
    if (jumpsEl) jumpsEl.textContent = gameState.jumpsLeft;

    // Power-up display
    const powerupDisplay = document.getElementById("active-powerup");
    const powerupContainer = document.getElementById("powerup-display");

    if (powerupDisplay && powerupContainer) {
        if (gameState.activePowerup) {
            const powerupNames = {
                shield: "Shield",
                speed: "Speed Boost",
                jump: "Jump Boost",
                score: "Score Boost",
            };
            powerupDisplay.textContent = powerupNames[gameState.activePowerup];
            powerupContainer.classList.add("active");
        } else if (gameState.player.shield) {
            powerupDisplay.textContent = "Shield Active";
            powerupContainer.classList.add("active");
        } else {
            powerupDisplay.textContent = "None";
            powerupContainer.classList.remove("active");
        }
    }

    // HUD color updates
    const jumpsHUD = document.getElementById("jumps-display");
    if (jumpsHUD) {
        jumpsHUD.className = "hud-item";
        if (gameState.jumpsLeft === 1) {
            jumpsHUD.classList.add("warning");
        } else if (gameState.jumpsLeft === 0) {
            jumpsHUD.classList.add("danger");
        }
    }

    const speedHUD = document.getElementById("speed-display");
    if (speedHUD) {
        speedHUD.className = "hud-item";
        const speedRatio = gameState.currentSpeed / gameState.maxSpeed;
        if (speedRatio > 0.8) {
            speedHUD.classList.add("danger");
        } else if (speedRatio > 0.6) {
            speedHUD.classList.add("warning");
        }
    }
}

function updateMobileControlsState() {
    const jumpBtn = document.getElementById("jump-btn");
    if (jumpBtn) {
        if (gameState.jumpsLeft <= 0) {
            jumpBtn.classList.add("disabled");
        } else {
            jumpBtn.classList.remove("disabled");
        }
    }
}

// Mobile Controls Setup
function setupMobileControls() {
    const controlButtons = {
        "left-btn": () => gameState.keys["ArrowLeft"] = true,
        "right-btn": () => gameState.keys["ArrowRight"] = true,
        "speed-btn": () => gameState.keys["ArrowUp"] = true,
        "brake-btn": () => gameState.keys["ArrowDown"] = true,
        "jump-btn": () => {
            if (gameState.jumpsLeft > 0) {
                jump();
            }
        }
    };

    Object.entries(controlButtons).forEach(([id, action]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        
        // Touch events
        btn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            if (id !== "jump-btn") {
                action();
            } else {
                action();
            }
        });

        btn.addEventListener("touchend", (e) => {
            e.preventDefault();
            if (id !== "jump-btn") {
                const key = id === "left-btn" ? "ArrowLeft" :
                           id === "right-btn" ? "ArrowRight" :
                           id === "speed-btn" ? "ArrowUp" :
                           id === "brake-btn" ? "ArrowDown" : null;
                if (key) gameState.keys[key] = false;
            }
        });

        // Mouse events for desktop testing
        btn.addEventListener("mousedown", action);
        btn.addEventListener("mouseup", () => {
            if (id !== "jump-btn") {
                const key = id === "left-btn" ? "ArrowLeft" :
                           id === "right-btn" ? "ArrowRight" :
                           id === "speed-btn" ? "ArrowUp" :
                           id === "brake-btn" ? "ArrowDown" : null;
                if (key) gameState.keys[key] = false;
            }
        });
    });
}

// Achievement System
function checkAchievements() {
    // Score achievements
    if (gameState.score >= 1000 && !gameState.achievements.score1000) {
        gameState.achievements.score1000 = true;
        showAchievement("🎯 Score Master!");
    }

    if (gameState.score >= 5000 && !gameState.achievements.score5000) {
        gameState.achievements.score5000 = true;
        showAchievement("🏆 High Scorer!");
    }

    // Speed achievement
    if (gameState.currentSpeed >= 10 && !gameState.achievements.speed10) {
        gameState.achievements.speed10 = true;
        showAchievement("🔥 Speed Demon!");
    }

    // Jump achievement
    if (gameState.stats.jumpsUsed >= 20 && !gameState.achievements.jumpMaster) {
        gameState.achievements.jumpMaster = true;
        showAchievement("🚀 Jump Master!");
    }

    // Night racer achievement
    if (gameState.selectedTrack === "night" && !gameState.achievements.nightRacer) {
        gameState.achievements.nightRacer = true;
        showAchievement("🌙 Night Racer!");
    }
}

function showAchievement(text) {
    const achievement = document.createElement("div");
    achievement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #FFD700, #FFA500);
        color: #000;
        padding: 15px 20px;
        border-radius: 15px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.5);
        transform: translateX(100%);
        transition: transform 0.5s ease;
        max-width: 250px;
        font-size: 14px;
        animation: achievementGlow 2s ease infinite alternate;
    `;
    achievement.textContent = text;
    document.body.appendChild(achievement);

    setTimeout(() => {
        achievement.style.transform = "translateX(0)";
    }, 100);

    setTimeout(() => {
        achievement.style.transform = "translateX(100%)";
        setTimeout(() => {
            achievement.remove();
        }, 500);
    }, 3000);
}

function updateAchievementsList() {
    const container = document.getElementById("achievements-list");
    if (!container) return;
    
    container.innerHTML = "";

    const achievementData = [
        { key: "firstRace", name: "First Race", desc: "Complete your first race", icon: "🏁" },
        { key: "score1000", name: "Score Master", desc: "Reach 1000 points", icon: "🎯" },
        { key: "score5000", name: "High Scorer", desc: "Reach 5000 points", icon: "🏆" },
        { key: "speed10", name: "Speed Demon", desc: "Reach speed 10.0", icon: "🔥" },
        { key: "jumpMaster", name: "Jump Master", desc: "Use 20 jumps total", icon: "🚀" },
        { key: "powerupCollector", name: "Power-up Collector", desc: "Collect 10 power-ups", icon: "💎" },
        { key: "nightRacer", name: "Night Racer", desc: "Race on night track", icon: "🌙" },
        { key: "perfectRun", name: "Perfect Run", desc: "Complete a perfect run", icon: "✨" },
    ];

    achievementData.forEach(achievement => {
        const div = document.createElement("div");
        div.className = "achievement" + (gameState.achievements[achievement.key] ? " unlocked" : "");
        div.innerHTML = `
            <div class="icon">${achievement.icon}</div>
            <div class="info">
                <h4>${achievement.name}</h4>
                <p>${achievement.desc}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// Game Over
function gameOver() {
    gameState.gameRunning = false;
    
    // Create death explosion effect
    createDeathEffect(gameState.player.x + 20, window.innerHeight * 0.8);

    // Save stats
    saveStats();

    // Check for new high score
    const finalScore = Math.floor(gameState.score);
    const newHighScoreBadge = document.getElementById("new-high-score-badge");
    
    if (finalScore > gameState.highScore) {
        gameState.highScore = finalScore;
        localStorage.setItem("carGameHighScore", gameState.highScore.toString());
        if (newHighScoreBadge) newHighScoreBadge.classList.remove("hidden");
    } else {
        if (newHighScoreBadge) newHighScoreBadge.classList.add("hidden");
    }

    const finalScoreEl = document.getElementById("final-score");
    const gameOverModal = document.getElementById("game-over-modal");
    
    if (finalScoreEl) finalScoreEl.textContent = finalScore;
    if (gameOverModal) {
        setTimeout(() => {
            gameOverModal.classList.remove("hidden");
        }, 1000); // Delay to show explosion effect
    }

    // Clear game objects
    gameState.obstacles.forEach(obstacle => {
        if (obstacle.element && obstacle.element.parentNode) {
            obstacle.element.remove();
        }
    });
    gameState.powerups.forEach(powerup => {
        if (powerup.element && powerup.element.parentNode) {
            powerup.element.remove();
        }
    });
    gameState.obstacles = [];
    gameState.powerups = [];
}

function createDeathEffect(x, y) {
    // Create multiple explosion rings
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            createParticles(x, y, "#FF0000", 15);
            createParticles(x, y, "#FF4500", 10);
            createParticles(x, y, "#FFD700", 8);
            
            // Create explosion ring
            const ring = document.createElement("div");
            ring.style.cssText = `
                position: absolute;
                left: ${x - 25}px;
                top: ${y - 25}px;
                width: 50px;
                height: 50px;
                border: 4px solid #FF0000;
                border-radius: 50%;
                z-index: 25;
                pointer-events: none;
                animation: explosionRing 0.8s ease-out forwards;
            `;
            
            const gameArea = document.getElementById("game-area");
            if (gameArea) gameArea.appendChild(ring);
            
            setTimeout(() => ring.remove(), 800);
        }, i * 200);
    }
}

// Data Persistence
function saveStats() {
    localStorage.setItem("gamesPlayed", gameState.stats.gamesPlayed.toString());
    localStorage.setItem("totalScore", Math.floor(gameState.stats.totalScore).toString());
    localStorage.setItem("powerupsCollected", gameState.stats.powerupsCollected.toString());
    localStorage.setItem("jumpsUsed", gameState.stats.jumpsUsed.toString());
    localStorage.setItem("achievements", JSON.stringify(gameState.achievements));
}

function loadStats() {
    const savedAchievements = localStorage.getItem("achievements");
    if (savedAchievements) {
        try {
            gameState.achievements = {
                ...gameState.achievements,
                ...JSON.parse(savedAchievements),
            };
        } catch (e) {
            console.warn("Failed to load achievements from localStorage");
        }
    }
    
    gameState.stats = {
        gamesPlayed: parseInt(localStorage.getItem("gamesPlayed") || "0"),
        totalScore: parseInt(localStorage.getItem("totalScore") || "0"),
        powerupsCollected: parseInt(localStorage.getItem("powerupsCollected") || "0"),
        jumpsUsed: parseInt(localStorage.getItem("jumpsUsed") || "0"),
    };
}

// Event Listeners
function setupEventListeners() {
    // Keyboard events
    document.addEventListener("keydown", (e) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "KeyP"].includes(e.code)) {
            e.preventDefault();
            gameState.keys[e.code] = true;
            gameState.keys[e.key] = true;
        }
    });

    document.addEventListener("keyup", (e) => {
        gameState.keys[e.code] = false;
        gameState.keys[e.key] = false;
    });

    // Window resize
    window.addEventListener("resize", () => {
        gameState.isMobile = window.innerWidth <= 768;
        gameState.updateLanes();
    });

    // Prevent context menu on mobile
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
    });

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener("touchend", (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Add CSS animations for effects
const style = document.createElement('style');
style.textContent = `
    @keyframes achievementGlow {
        0% { box-shadow: 0 4px 20px rgba(255, 215, 0, 0.5); }
        100% { box-shadow: 0 4px 30px rgba(255, 215, 0, 0.8); }
    }
    
    @keyframes collectEffect {
        0% { 
            transform: scale(1);
            opacity: 1;
        }
        100% { 
            transform: scale(3);
            opacity: 0;
        }
    }
    
    @keyframes explosionRing {
        0% { 
            transform: scale(1);
            opacity: 1;
        }
        100% { 
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .player-car.jumping {
        animation: none !important;
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
`;
document.head.appendChild(style);

// Initialize Game
function initGame() {
    gameState.isMobile = window.innerWidth <= 768;
    gameState.updateLanes();
    
    setupTrackSelection();
    setupCarCreator();
    setupMobileControls();
    setupEventListeners();
    
    loadStats();
    updateMenuStats();
    updateAchievementsPreview();
    
    // Load high score
    gameState.highScore = parseInt(localStorage.getItem("carGameHighScore") || "0");
    
    // Show initial screen
    showScreen("menu-screen");
}

// Start the game when DOM is loaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGame);
} else {
    initGame();
}