 
        class GameState {
            constructor() {
                this.cars = [
                    { id: 1, name: "Lightning Bolt", color: "#ff0000", type: "sports", speed: 6 },
                    { id: 2, name: "Night Rider", color: "#000000", type: "sedan", speed: 5 },
                    { id: 3, name: "Desert Storm", color: "#FFD700", type: "suv", speed: 7 },
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
                this.distance = 0;
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
                 // Touch controls
                this.touch = {
                    startX: 0,
                    startY: 0,
                    startTime: 0,
                    lastTap: 0,
                    swipeThreshold: 30,
                    doubleTapThreshold: 300
                };
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
                    totalDistance: parseInt(localStorage.getItem("totalDistance") || "0"),
                    powerupsCollected: parseInt(localStorage.getItem("powerupsCollected") || "0"),
                    jumpsUsed: parseInt(localStorage.getItem("jumpsUsed") || "0"),
                };
                
                this.isMobile = window.innerWidth <= 768;
                this.lanes = this.calculateLanes();
            }
            
            calculateLanes() {
                // Get the actual road container dimensions
                const roadContainer = document.querySelector('.road-container');
                if (!roadContainer) {
                    // Fallback values
                    const roadWidth = this.isMobile ? 250 : 300;
                    const laneWidth = roadWidth / 4;
                    return [
                        laneWidth * 0.5,
                        laneWidth * 1.5,
                        laneWidth * 2.5,
                        laneWidth * 3.5
                    ];
                }
                
                const roadWidth = roadContainer.offsetWidth;
                const laneWidth = roadWidth / 4;
                
                // Calculate positions relative to road container center
                return [
                    laneWidth * 0.5,    // Lane 0 (leftmost)
                    laneWidth * 1.5,    // Lane 1 
                    laneWidth * 2.5,    // Lane 2
                    laneWidth * 3.5     // Lane 3 (rightmost)
                ];
            }
            
            updateLanes() {
                this.lanes = this.calculateLanes();
                if (this.gameRunning) {
                    this.player.x = this.lanes[this.player.lane];
                    const playerCar = document.getElementById("player-car");
                    const roadContainer = document.querySelector('.road-container');
                    if (playerCar && roadContainer) {
                        // Position car relative to road container
                        const roadRect = roadContainer.getBoundingClientRect();
                        const gameAreaRect = document.getElementById("game-area").getBoundingClientRect();
                        // Calculate position relative to road container
                        const roadLeft = roadRect.left - gameAreaRect.left;
                        const carLeft = roadLeft + this.player.x;
                        playerCar.style.left = carLeft + "px";
                        playerCar.style.bottom = "80px";
                        playerCar.style.transform = "translateX(-50%)";
                    }
                }
            }

            moveLeft() {
                if (this.player.lane > 0) {
                    this.player.lane--;
                    this.player.x = this.lanes[this.player.lane];
                    this.updateLanes();
                    this.animateLaneChange();
                }
            }

            moveRight() {
                if (this.player.lane < this.lanes.length - 1) {
                    this.player.lane++;
                    this.player.x = this.lanes[this.player.lane];
                    this.updateLanes();
                    this.animateLaneChange();
                }
            }

            animateLaneChange() {
                const playerCar = document.getElementById("player-car");
                if (playerCar) {
                    playerCar.classList.remove("lane-change");
                    // Force reflow for restart animation
                    void playerCar.offsetWidth;
                    playerCar.classList.add("lane-change");
                }
            }
        }

        // Initialize game state
        const gameState = new GameState();

        // Track types configuration
        const trackTypes = {
            day: { bg: "#87ceeb", roadClass: "", name: "🌅 Day Track" },
            night: { bg: "#1a1a2e", roadClass: "night", name: "🌙 Night Track" },
            desert: { bg: "#daa520", roadClass: "desert", name: "🏜️ Desert Track" },
            snow: { bg: "#e6f3ff", roadClass: "snow", name: "❄️ Snow Track" },
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
                    <rect x="14" y="20" width="12" height="8" fill="#87ceeb" stroke="#000" stroke-width="1" rx="2"/>
                    <rect x="14" y="32" width="12" height="8" fill="#87ceeb" stroke="#000" stroke-width="1" rx="2"/>
                    <rect x="16" y="4" width="8" height="5" fill="#ffd700" stroke="#000" stroke-width="1" rx="1"/>
                    <rect x="16" y="51" width="8" height="5" fill="#ff4500" stroke="#000" stroke-width="1" rx="1"/>
                </svg>`,

                sports: `<svg width="${width}" height="${height}" viewBox="0 0 40 60">
                    <path d="M10 8 L30 8 Q34 12 32 20 L32 40 Q34 48 30 52 L10 52 Q6 48 8 40 L8 20 Q6 12 10 8 Z" fill="${color}" stroke="#000" stroke-width="1.5"/>
                    <circle cx="12" cy="18" r="3" fill="#1a1a1a"/>
                    <circle cx="28" cy="18" r="3" fill="#1a1a1a"/>
                    <circle cx="12" cy="42" r="3" fill="#1a1a1a"/>
                    <circle cx="28" cy="42" r="3" fill="#1a1a1a"/>
                    <path d="M14 22 Q20 20 26 22 L26 28 Q20 26 14 28 Z" fill="#87ceeb" stroke="#000" stroke-width="1"/>
                    <path d="M14 32 Q20 30 26 32 L26 38 Q20 36 14 38 Z" fill="#87ceeb" stroke="#000" stroke-width="1"/>
                    <rect x="16" y="5" width="8" height="6" fill="#ffd700" stroke="#000" stroke-width="1" rx="2"/>
                    <rect x="16" y="49" width="8" height="6" fill="#ff4500" stroke="#000" stroke-width="1" rx="2"/>
                </svg>`,

                suv: `<svg width="${width}" height="${height}" viewBox="0 0 40 60">
                    <rect x="6" y="8" width="28" height="44" fill="${color}" stroke="#000" stroke-width="1.5" rx="5"/>
                    <rect x="8" y="5" width="24" height="12" fill="${color}" stroke="#000" stroke-width="1.5" rx="6"/>
                    <rect x="8" y="43" width="24" height="12" fill="${color}" stroke="#000" stroke-width="1.5" rx="6"/>
                    <circle cx="12" cy="16" r="4" fill="#1a1a1a"/>
                    <circle cx="28" cy="16" r="4" fill="#1a1a1a"/>
                    <circle cx="12" cy="44" r="4" fill="#1a1a1a"/>
                    <circle cx="28" cy="44" r="4" fill="#1a1a1a"/>
                    <rect x="12" y="20" width="16" height="8" fill="#87ceeb" stroke="#000" stroke-width="1" rx="2"/>
                    <rect x="12" y="32" width="16" height="8" fill="#87ceeb" stroke="#000" stroke-width="1" rx="2"/>
                    <rect x="14" y="2" width="12" height="5" fill="#ffd700" stroke="#000" stroke-width="1" rx="1"/>
                    <rect x="14" y="53" width="12" height="5" fill="#ff4500" stroke="#000" stroke-width="1" rx="1"/>
                </svg>`,

                truck: `<svg width="${width}" height="${height}" viewBox="0 0 40 60">
                    <rect x="5" y="6" width="30" height="48" fill="${color}" stroke="#000" stroke-width="1.5" rx="3"/>
                    <rect x="6" y="4" width="28" height="14" fill="${color}" stroke="#000" stroke-width="1.5" rx="5"/>
                    <rect x="6" y="42" width="28" height="14" fill="${color}" stroke="#000" stroke-width="1.5" rx="5"/>
                    <circle cx="12" cy="14" r="4" fill="#1a1a1a"/>
                    <circle cx="28" cy="14" r="4" fill="#1a1a1a"/>
                    <circle cx="12" cy="46" r="4" fill="#1a1a1a"/>
                    <circle cx="28" cy="46" r="4" fill="#1a1a1a"/>
                    <rect x="10" y="20" width="20" height="10" fill="#87ceeb" stroke="#000" stroke-width="1" rx="2"/>
                    <rect x="10" y="32" width="20" height="7" fill="#87ceeb" stroke="#000" stroke-width="1" rx="2"/>
                    <rect x="13" y="1" width="14" height="5" fill="#ffd700" stroke="#000" stroke-width="1" rx="1"/>
                    <rect x="13" y="54" width="14" height="5" fill="#ff4500" stroke="#000" stroke-width="1" rx="1"/>
                </svg>`
            };

            return carTemplates[type] || carTemplates.sedan;
        }

        // Power-up SVG Generation
        function createPowerupSVG(type) {
            const size = gameState.isMobile ? 25 : 30;
            const powerupTemplates = {
                shield: `<svg width="${size}" height="${size}" viewBox="0 0 30 30">
                    <circle cx="15" cy="15" r="13" fill="none" stroke="#00ffff" stroke-width="2"/>
                    <path d="M15 4 L23 11 L20 19 L15 23 L10 19 L7 11 Z" fill="#00ffff" opacity="0.7"/>
                    <text x="15" y="19" text-anchor="middle" fill="white" font-size="10">🛡</text>
                </svg>`,

                speed: `<svg width="${size}" height="${size}" viewBox="0 0 30 30">
                    <circle cx="15" cy="15" r="13" fill="none" stroke="#ffd700" stroke-width="2"/>
                    <circle cx="15" cy="15" r="9" fill="#ffd700" opacity="0.7"/>
                    <text x="15" y="19" text-anchor="middle" fill="white" font-size="10">⚡</text>
                </svg>`,

                jump: `<svg width="${size}" height="${size}" viewBox="0 0 30 30">
                    <circle cx="15" cy="15" r="13" fill="none" stroke="#00ff00" stroke-width="2"/>
                    <circle cx="15" cy="15" r="9" fill="#00ff00" opacity="0.7"/>
                    <text x="15" y="19" text-anchor="middle" fill="white" font-size="10">🚀</text>
                </svg>`,

                score: `<svg width="${size}" height="${size}" viewBox="0 0 30 30">
                    <circle cx="15" cy="15" r="13" fill="none" stroke="#ff69b4" stroke-width="2"/>
                    <circle cx="15" cy="15" r="9" fill="#ff69b4" opacity="0.7"/>
                    <text x="15" y="19" text-anchor="middle" fill="white" font-size="10">💰</text>
                </svg>`
            };

            return powerupTemplates[type] || powerupTemplates.score;
        }

        // Screen Management
        function showScreen(screenId) {
            document.querySelectorAll(".screen").forEach(screen => {
                screen.classList.add("hidden");
            });

            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.remove("hidden");
            }

            // Show mobile controls only on game screen
            const mobileControls = document.getElementById('mobile-controls');
            if (mobileControls) {
                if (screenId === 'game-screen') {
                    mobileControls.style.display = 'block';
                } else {
                    mobileControls.style.display = 'none';
                }
            }

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
            const elements = {
                "menu-high-score": gameState.highScore,
                "menu-games-played": gameState.stats.gamesPlayed,
                "menu-total-distance": Math.floor(gameState.stats.totalDistance) + "km",
                "menu-achievements": Object.values(gameState.achievements).filter(Boolean).length + "/8"
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            });
        }

        function updateAchievementsPreview() {
            const container = document.getElementById("achievements-preview-list");
            if (!container) return;
            
            const unlockedAchievements = Object.entries(gameState.achievements)
                .filter(([key, unlocked]) => unlocked)
                .slice(0, 3);

            if (unlockedAchievements.length === 0) {
                container.innerHTML = '<p style="color: #a0a0a0; text-align: center;">No achievements unlocked yet</p>';
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
                .map(([key]) => `<div style="color: #4a90e2; margin: 5px 0;">${achievementNames[key]}</div>`)
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
                carCard.style.position = "relative";
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
                    ${index >= 3 ? `<button class="btn btn-danger btn-small" onclick="deleteCar(${car.id})" style="position: absolute; top: 10px; right: 10px; margin: 0;">🗑️</button>` : ''}
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
                    { id: 3, name: "Desert Storm", color: "#ffd700", type: "suv", speed: 7 },
                ];
                populateGarage();
            }
        }

        // Car Creator Functions
        function setupCarCreator() {
            document.querySelectorAll(".color-option").forEach(option => {
                option.addEventListener("click", function() {
                    document.querySelectorAll(".color-option").forEach(opt => opt.classList.remove("selected"));
                    this.classList.add("selected");
                    gameState.selectedColor = this.dataset.color;
                    updateCarPreview();
                });
            });

            document.querySelectorAll(".car-type-option").forEach(option => {
                option.addEventListener("click", function() {
                    document.querySelectorAll(".car-type-option").forEach(opt => opt.classList.remove("selected"));
                    this.classList.add("selected");
                    gameState.selectedType = this.dataset.type;
                    updateCarPreview();
                });
            });

            const speedSlider = document.getElementById("speed-slider");
            const speedValue = document.getElementById("speed-value");

            if (speedSlider && speedValue) {
                speedSlider.addEventListener("input", function() {
                    gameState.selectedSpeed = parseInt(this.value);
                    speedValue.textContent = this.value;
                });
            }

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
            
            gameArea.className = "game-area";
            road.className = "road";
            
            if (theme.roadClass) {
                gameArea.classList.add(theme.roadClass);
                road.classList.add(theme.roadClass);
            }
        }

        // Game Core Functions
        function startGame() {
            gameState.gameRunning = true;
            gameState.gamePaused = false;
            
            // Update lanes first
            gameState.updateLanes();
            
            // Reset player to center lane (lane 1)
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
            gameState.distance = 0;
            gameState.baseSpeed = 0.5; // Start slower
            gameState.currentSpeed = 0.5; // Start slower
            gameState.jumpsLeft = 2; // Start with some jumps
            gameState.activePowerup = null;
            gameState.powerupTime = 0;
            gameState.stats.gamesPlayed++;

            const gameOverModal = document.getElementById("game-over-modal");
            const pauseModal = document.getElementById("pause-modal");
            const highScoreEl = document.getElementById("high-score");
            
            if (gameOverModal) gameOverModal.classList.add("hidden");
            if (pauseModal) pauseModal.classList.add("hidden");
            if (highScoreEl) highScoreEl.textContent = gameState.highScore;

            // Position player car correctly within road container
            setTimeout(() => {
                const playerCar = document.getElementById("player-car");
                const roadContainer = document.querySelector('.road-container');
                
                if (playerCar && roadContainer) {
                    // Position car relative to road container
                    const roadRect = roadContainer.getBoundingClientRect();
                    const gameAreaRect = document.getElementById("game-area").getBoundingClientRect();
                    
                    const roadLeft = roadRect.left - gameAreaRect.left;
                    const carLeft = roadLeft + gameState.player.x;
                    
                    playerCar.style.left = carLeft + "px";
                    playerCar.style.bottom = "80px";
                    playerCar.style.transform = "translateX(-50%)";
                    playerCar.classList.remove("shielded", "jumping");
                }
            }, 100);

            createRoadLines();
            updateMobileControlsState();
            updateHUD();
            
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
            if (gameState.keys["ArrowLeft"] && gameState.player.lane > 0) {
                gameState.player.lane--;
                gameState.player.x = gameState.lanes[gameState.player.lane];
                
                const playerCar = document.getElementById("player-car");
                const roadContainer = document.querySelector('.road-container');
                
                if (playerCar && roadContainer) {
                    const roadRect = roadContainer.getBoundingClientRect();
                    const gameAreaRect = document.getElementById("game-area").getBoundingClientRect();
                    
                    const roadLeft = roadRect.left - gameAreaRect.left;
                    const carLeft = roadLeft + gameState.player.x;
                    
                    playerCar.style.left = carLeft + "px";
                    playerCar.style.transform = "translateX(-50%)";
                }
                gameState.keys["ArrowLeft"] = false;
            }

            if (gameState.keys["ArrowRight"] && gameState.player.lane < 3) {
                gameState.player.lane++;
                gameState.player.x = gameState.lanes[gameState.player.lane];
                
                const playerCar = document.getElementById("player-car");
                const roadContainer = document.querySelector('.road-container');
                
                if (playerCar && roadContainer) {
                    const roadRect = roadContainer.getBoundingClientRect();
                    const gameAreaRect = document.getElementById("game-area").getBoundingClientRect();
                    
                    const roadLeft = roadRect.left - gameAreaRect.left;
                    const carLeft = roadLeft + gameState.player.x;
                    
                    playerCar.style.left = carLeft + "px";
                    playerCar.style.transform = "translateX(-50%)";
                }
                gameState.keys["ArrowRight"] = false;
            }

            if ((gameState.keys[" "] || gameState.keys["Space"]) && gameState.jumpsLeft > 0 && !gameState.player.jumping) {
                jump();
                gameState.keys[" "] = false;
                gameState.keys["Space"] = false;
            }

            if (gameState.keys["KeyP"]) {
                pauseGame();
                gameState.keys["KeyP"] = false;
            }
        }

        // Speed Management
        function updateSpeed() {
            let speedMultiplier = 1;
            
            switch (gameState.selectedTrack) {
                case "snow":
                    speedMultiplier = 0.8;
                    break;
                case "desert":
                    speedMultiplier = 1.2;
                    break;
            }

            if (gameState.activePowerup === "speed") {
                speedMultiplier *= 1.8;
            }

            // Manual speed control
            if (gameState.keys["ArrowUp"]) {
                gameState.currentSpeed = Math.min(
                    gameState.currentSpeed + 0.05,
                    gameState.maxSpeed * speedMultiplier
                );
            }

            if (gameState.keys["ArrowDown"]) {
                gameState.currentSpeed = Math.max(
                    gameState.currentSpeed - 0.1,
                    gameState.minSpeed
                );
            }

            // Gradual natural acceleration (slower progression)
            const scoreBasedSpeed = Math.min(gameState.score / 2000, 3); // Max +3 speed from score
            const targetSpeed = (gameState.baseSpeed + scoreBasedSpeed) * speedMultiplier;
            
            if (gameState.currentSpeed < targetSpeed) {
                gameState.currentSpeed = Math.min(
                    gameState.currentSpeed + 0.002, // Much slower acceleration
                    targetSpeed
                );
            }
        }

        // Power-up Management
        function updatePowerups() {
            if (gameState.activePowerup) {
                gameState.powerupTime--;
                if (gameState.powerupTime <= 0) {
                    deactivatePowerup();
                }
            }

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
            if (Math.random() < 0.015) {
                const roadContainer = document.querySelector('.road-container');
                if (!roadContainer) return;
                
                const roadRect = roadContainer.getBoundingClientRect();
                const gameAreaRect = document.getElementById("game-area").getBoundingClientRect();
                const roadLeft = roadRect.left - gameAreaRect.left;
                
                const powerupTypes = ["shield", "speed", "jump", "jump", "score"];
                const powerup = {
                    id: Date.now(),
                    type: powerupTypes[Math.floor(Math.random() * powerupTypes.length)],
                    lane: Math.floor(Math.random() * 4),
                    x: roadLeft + gameState.lanes[Math.floor(Math.random() * 4)],
                    y: -40,
                    element: null,
                };

                const element = document.createElement("div");
                element.className = "powerup";
                element.innerHTML = createPowerupSVG(powerup.type);
                element.style.left = powerup.x + "px";
                element.style.top = powerup.y + "px";
                element.style.position = "absolute";
                element.style.transform = "translateX(-50%)";
                const gameArea = document.getElementById("game-area");
                if (gameArea) gameArea.appendChild(element);

                powerup.element = element;
                gameState.powerups.push(powerup);
            }

            gameState.powerups = gameState.powerups.filter(powerup => {
                powerup.y += gameState.currentSpeed * 2 + 3;
                if (powerup.element) {
                    powerup.element.style.top = powerup.y + "px";
                }

                if (powerup.y > window.innerHeight) {
                    if (powerup.element && powerup.element.parentNode) {
                        powerup.element.remove();
                    }
                    return false;
                }
                return true;
            });
        }

function jump() {
    if (!gameState.gameRunning) return;
    if (gameState.jumpsLeft > 0 && !gameState.player.jumping) {
        gameState.player.jumping = true;
        gameState.jumpsLeft--;
        gameState.stats.jumpsUsed++;

        const playerCar = document.getElementById("player-car");
        if (playerCar) {
            playerCar.classList.remove("speed-burst"); // Remove any speed burst effect
            playerCar.classList.add("jumping");
        }

        // Extra jump burst effect
        createJumpBoostEffect();

        // Create jump particles
        setTimeout(() => {
            const roadContainer = document.querySelector('.road-container');
            if (roadContainer) {
                const roadRect = roadContainer.getBoundingClientRect();
                const gameAreaRect = document.getElementById("game-area").getBoundingClientRect();
                const roadLeft = roadRect.left - gameAreaRect.left;
                const carLeft = roadLeft + gameState.player.x;

                createParticles(carLeft, window.innerHeight * 0.75, "#00ff00", 20);
                createParticles(carLeft, window.innerHeight * 0.75, "#ffff00", 15);
            }
        }, 200);

        setTimeout(() => {
            gameState.player.jumping = false;
            const playerCar = document.getElementById("player-car");
            if (playerCar) {
                playerCar.classList.remove("jumping");
            }
        }, 800);
    }
}

        // Obstacle Management
        function updateObstacles() {
            const difficultyMultiplier = 1 + gameState.score / 5000;
            const obstacleChance = (0.008 + gameState.currentSpeed * 0.002) * difficultyMultiplier;

            if (Math.random() < obstacleChance) {
                const roadContainer = document.querySelector('.road-container');
                if (!roadContainer) return;
                
                const roadRect = roadContainer.getBoundingClientRect();
                const gameAreaRect = document.getElementById("game-area").getBoundingClientRect();
                const roadLeft = roadRect.left - gameAreaRect.left;
                
                const obstacle = {
                    id: Date.now(),
                    lane: Math.floor(Math.random() * 4),
                    x: roadLeft + gameState.lanes[Math.floor(Math.random() * 4)],
                    y: -75,
                    element: null,
                };

                const element = document.createElement("div");
                element.className = "obstacle";
                const carTypes = ["sedan", "sports", "suv", "truck"];
                const obstacleColors = ["#ff0000", "#ff4500", "#8b0000", "#dc143c"];
                const randomType = carTypes[Math.floor(Math.random() * 4)];
                const randomColor = obstacleColors[Math.floor(Math.random() * obstacleColors.length)];
                
                element.innerHTML = createCarSVG(randomColor, randomType);
                element.style.left = obstacle.x + "px";
                element.style.top = obstacle.y + "px";
                element.style.position = "absolute";
                element.style.transform = "translateX(-50%)";
                const gameArea = document.getElementById("game-area");
                if (gameArea) gameArea.appendChild(element);

                obstacle.element = element;
                gameState.obstacles.push(obstacle);
            }

            gameState.obstacles = gameState.obstacles.filter(obstacle => {
                obstacle.y += gameState.currentSpeed * 3 + 4;
                if (obstacle.element) {
                    obstacle.element.style.top = obstacle.y + "px";
                }

                if (obstacle.y > window.innerHeight) {
                    if (obstacle.element && obstacle.element.parentNode) {
                        obstacle.element.remove();
                    }
                    return false;
                }
                return true;
            });
        }

        // Collision Detection
        function checkCollisions() {
            const playerY = window.innerHeight * 0.8;
            const roadContainer = document.querySelector('.road-container');
            if (!roadContainer) return;
            
            const roadRect = roadContainer.getBoundingClientRect();
            const gameAreaRect = document.getElementById("game-area").getBoundingClientRect();
            const roadLeft = roadRect.left - gameAreaRect.left;
            const playerCarX = roadLeft + gameState.player.x;

            // Obstacle collisions (only when not jumping and not shielded)
            if (!gameState.player.jumping && !gameState.player.shield) {
                gameState.obstacles.forEach((obstacle, index) => {
                    if (
                        Math.abs(obstacle.x - playerCarX) < 30 &&
                        obstacle.y > playerY - 40 &&
                        obstacle.y < playerY + 40
                    ) {
                        // Create crash blast animation
                        createCrashBlast(obstacle.x, obstacle.y, playerCarX, playerY);
                        
                        // Remove the obstacle immediately
                        if (obstacle.element && obstacle.element.parentNode) {
                            obstacle.element.remove();
                        }
                        gameState.obstacles.splice(index, 1);
                        
                        // Game over after short animation delay
                        setTimeout(() => {
                            gameOver();
                        }, 800);
                        return;
                    }
                });
            }

            // Power-up collisions
            gameState.powerups = gameState.powerups.filter((powerup, index) => {
                if (
                    Math.abs(powerup.x - playerCarX) < 35 &&
                    powerup.y > playerY - 35 &&
                    powerup.y < playerY + 35
                ) {
                    collectPowerup(powerup);
                    if (powerup.element && powerup.element.parentNode) {
                        powerup.element.remove();
                    }
                    return false;
                }
                return true;
            });
        }

        function createCrashBlast(obstacleX, obstacleY, playerX, playerY) {
            const gameArea = document.getElementById("game-area");
            if (!gameArea) return;
            
            // Calculate crash point
            const crashX = (obstacleX + playerX) / 2;
            const crashY = (obstacleY + playerY) / 2;
            
            // Stop the game immediately
            gameState.gameRunning = false;
            
            // Create screen flash
            gameArea.classList.add("impact-flash");
            setTimeout(() => gameArea.classList.remove("impact-flash"), 600);
            
            // Create explosion particles
            for (let wave = 0; wave < 4; wave++) {
                setTimeout(() => {
                    createParticles(crashX, crashY, "#ff0000", 20);
                    createParticles(crashX, crashY, "#ff4500", 15);
                    createParticles(crashX, crashY, "#ffd700", 12);
                    createParticles(crashX, crashY, "#ffffff", 8);
                }, wave * 100);
            }
            
            // Create explosion rings
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const ring = document.createElement("div");
                    ring.style.cssText = `
                        position: absolute;
                        left: ${crashX - 30 - (i * 10)}px;
                        top: ${crashY - 30 - (i * 10)}px;
                        width: ${60 + (i * 20)}px;
                        height: ${60 + (i * 20)}px;
                        border: ${3 + i}px solid ${i % 2 ? "#ff0000" : "#ffd700"};
                        border-radius: 50%;
                        z-index: 30;
                        pointer-events: none;
                        animation: explosionRing 1s ease-out forwards;
                    `;
                    
                    gameArea.appendChild(ring);
                    setTimeout(() => ring.remove(), 1000);
                }, i * 120);
            }
            
            // Show dramatic crash text
            setTimeout(() => {
                const crashText = document.createElement("div");
                crashText.style.cssText = `
                    position: absolute;
                    left: 50%;
                    top: 40%;
                    transform: translate(-50%, -50%);
                    font-size: 3rem;
                    font-weight: 900;
                    color: #ff0000;
                    text-shadow: 
                        2px 2px 0 #000,
                        -2px -2px 0 #000,
                        2px -2px 0 #000,
                        -2px 2px 0 #000,
                        0 0 15px #ff0000;
                    z-index: 50;
                    pointer-events: none;
                    font-family: 'Arial Black', Arial, sans-serif;
                    animation: crashTextAppear 1.5s ease-out forwards;
                `;
                crashText.textContent = "CRASH!";
                
                gameArea.appendChild(crashText);
                setTimeout(() => crashText.remove(), 1500);
            }, 200);
        }

        function startCrashSequence(obstacle, obstacleIndex, playerCarX, playerY) {
            // Stop the game immediately
            gameState.gameRunning = false;
            
            // Get references
            const gameArea = document.getElementById("game-area");
            const playerCar = document.getElementById("player-car");
            const screen = document.querySelector('.screen:not(.hidden)');
            
            // Phase 1: Impact flash and screen shake (0-0.5s)
            if (gameArea) {
                gameArea.classList.add("impact-flash");
            }
            if (screen) {
                screen.classList.add("screen-shake");
            }
            
            // Phase 2: Car animations (0.2s)
            setTimeout(() => {
                if (playerCar) {
                    playerCar.classList.add("player-crash");
                }
                if (obstacle.element) {
                    obstacle.element.classList.add("obstacle-destroy");
                }
                
                // Create massive explosion effect
                createMassiveExplosion(obstacle.x, obstacle.y, playerCarX, playerY);
            }, 200);
            
            // Phase 3: Show crash text (0.5s)
            setTimeout(() => {
                showDramaticCrashText(obstacle.x, obstacle.y);
            }, 500);
            
            // Phase 4: Clean up effects (1.2s)
            setTimeout(() => {
                if (gameArea) {
                    gameArea.classList.remove("impact-flash");
                }
                if (screen) {
                    screen.classList.remove("screen-shake");
                }
                if (playerCar) {
                    playerCar.classList.remove("player-crash");
                }
            }, 1200);
            
            // Phase 5: Remove obstacle and trigger game over (1.5s)
            setTimeout(() => {
                if (obstacle.element && obstacle.element.parentNode) {
                    obstacle.element.remove();
                }
                gameState.obstacles.splice(obstacleIndex, 1);
                
                // Trigger game over after full crash sequence
                setTimeout(() => {
                    gameOver();
                }, 500);
            }, 1500);
        }

        function createMassiveExplosion(obstacleX, obstacleY, playerX, playerY) {
            const crashX = (obstacleX + playerX) / 2;
            const crashY = (obstacleY + playerY) / 2;
            const gameArea = document.getElementById("game-area");
            
            // Create multiple explosion waves
            for (let wave = 0; wave < 6; wave++) {
                setTimeout(() => {
                    // Particles for this wave
                    createParticles(crashX, crashY, "#ff0000", 25);
                    createParticles(crashX, crashY, "#ff4500", 20);
                    createParticles(crashX, crashY, "#ffd700", 15);
                    createParticles(crashX, crashY, "#ffffff", 10);
                    createParticles(crashX, crashY, "#ff8c00", 12);
                    
                    // Expanding rings
                    const ring = document.createElement("div");
                    ring.style.cssText = `
                        position: absolute;
                        left: ${crashX - 40}px;
                        top: ${crashY - 40}px;
                        width: 80px;
                        height: 80px;
                        border: ${4 + wave}px solid ${wave % 2 ? "#ff0000" : "#ffd700"};
                        border-radius: 50%;
                        z-index: 30;
                        pointer-events: none;
                        animation: explosionRing 1s ease-out forwards;
                    `;
                    
                    if (gameArea) gameArea.appendChild(ring);
                    setTimeout(() => ring.remove(), 1000);
                }, wave * 150);
            }
            
            // Create debris effect
            for (let i = 0; i < 12; i++) {
                setTimeout(() => {
                    const debris = document.createElement("div");
                    const angle = (i * 30) * Math.PI / 180;
                    debris.style.cssText = `
                        position: absolute;
                        left: ${crashX}px;
                        top: ${crashY}px;
                        width: 6px;
                        height: 6px;
                        background: ${i % 3 === 0 ? "#ff0000" : i % 3 === 1 ? "#ffd700" : "#ff4500"};
                        border-radius: 50%;
                        z-index: 25;
                        pointer-events: none;
                        animation: debrisFly 1.5s ease-out forwards;
                        --angle: ${angle}rad;
                    `;
                    
                    if (gameArea) gameArea.appendChild(debris);
                    setTimeout(() => debris.remove(), 1500);
                }, i * 50);
            }
        }

        function showDramaticCrashText(x, y) {
            const gameArea = document.getElementById("game-area");
            if (!gameArea) return;
            
            const crashText = document.createElement("div");
            crashText.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                font-size: 4rem;
                font-weight: 900;
                color: #ff0000;
                text-shadow: 
                    3px 3px 0 #000,
                    -3px -3px 0 #000,
                    3px -3px 0 #000,
                    -3px 3px 0 #000,
                    0 0 20px #ff0000,
                    0 0 40px #ff0000;
                z-index: 50;
                pointer-events: none;
                font-family: 'Arial Black', Arial, sans-serif;
                letter-spacing: 0.2em;
            `;
            crashText.textContent = "CRASH!";
            crashText.classList.add("crash-text");
            
            gameArea.appendChild(crashText);
            
            // Remove crash text after animation
            setTimeout(() => {
                if (crashText.parentNode) {
                    crashText.remove();
                }
            }, 2000);
        }

        function collectPowerup(powerup) {
            gameState.stats.powerupsCollected++;
            
            // Create fireworks effect immediately
            createFireworks(powerup.x, powerup.y, powerup.type);
            
            // Remove the powerup element
            if (powerup.element && powerup.element.parentNode) {
                powerup.element.remove();
            }
            
            // Add visual feedback to player car
            const playerCar = document.getElementById("player-car");
            
            switch (powerup.type) {
                case "shield":
                    gameState.player.shield = true;
                    gameState.player.shieldTime = 300;
                    if (playerCar) {
                        playerCar.classList.add("shielded");
                    }
                    showFloatingText("SHIELD ACTIVATED!", powerup.x, powerup.y, "#00ffff");
                    break;
                case "speed":
                    activatePowerup("speed", 360);
                    if (playerCar) {
                        playerCar.classList.add("speed-burst");
                        setTimeout(() => playerCar.classList.remove("speed-burst"), 600);
                    }
                    showFloatingText("SPEED BOOST!", powerup.x, powerup.y, "#ffd700");
                    break;
                case "jump":
                    gameState.jumpsLeft = Math.min(gameState.jumpsLeft + 3, 5);
                    showFloatingText("+3 JUMPS!", powerup.x, powerup.y, "#00ff00");
                    break;
                case "score":
                    gameState.score += 500;
                    showFloatingText("+500 POINTS!", powerup.x, powerup.y, "#ff69b4");
                    break;
            }

            if (gameState.stats.powerupsCollected >= 10 && !gameState.achievements.powerupCollector) {
                gameState.achievements.powerupCollector = true;
                showAchievement("💎 Power-up Collector!");
            }
        }

        function createFireworks(x, y, type) {
            const gameArea = document.getElementById("game-area");
            if (!gameArea) return;
            
            const colorSets = {
                shield: ["#00ffff", "#0080ff", "#40e0d0"],
                speed: ["#ffd700", "#ffff00", "#ffa500"], 
                jump: ["#00ff00", "#32cd32", "#00fa9a"],
                score: ["#ff69b4", "#ff1493", "#da70d6"]
            };
            
            const colors = colorSets[type] || colorSets.score;
            
            // Main firework explosion
            setTimeout(() => {
                // Center burst
                const center = document.createElement("div");
                center.style.cssText = `
                    position: absolute;
                    left: ${x - 6}px;
                    top: ${y - 6}px;
                    width: 12px;
                    height: 12px;
                    background: ${colors[0]};
                    border-radius: 50%;
                    z-index: 35;
                    box-shadow: 0 0 15px ${colors[0]};
                    animation: fireworkCenter 1.2s ease-out forwards;
                `;
                gameArea.appendChild(center);
                setTimeout(() => {
                    if (center.parentNode) center.remove();
                }, 1200);
                
                // Radiating trails
                for (let i = 0; i < 16; i++) {
                    const angle = (i * 22.5) * Math.PI / 180;
                    const distance = 60 + Math.random() * 30;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    const trail = document.createElement("div");
                    trail.style.cssText = `
                        position: absolute;
                        left: ${x - 1}px;
                        top: ${y - 10}px;
                        width: 2px;
                        height: 15px;
                        background: linear-gradient(to bottom, ${color}, transparent);
                        border-radius: 50%;
                        z-index: 30;
                        pointer-events: none;
                        transform-origin: bottom center;
                        animation: fireworkTrail 1.5s ease-out forwards;
                        --angle: ${angle}rad;
                        --distance: ${distance}px;
                    `;
                    
                    gameArea.appendChild(trail);
                    setTimeout(() => {
                        if (trail.parentNode) trail.remove();
                    }, 1500);
                    
                    // Sparkle at end of trail
                    setTimeout(() => {
                        const endX = x + Math.cos(angle) * distance;
                        const endY = y + Math.sin(angle) * distance;
                        
                        const sparkle = document.createElement("div");
                        sparkle.style.cssText = `
                            position: absolute;
                            left: ${endX - 2}px;
                            top: ${endY - 2}px;
                            width: 4px;
                            height: 4px;
                            background: ${color};
                            border-radius: 50%;
                            z-index: 32;
                            box-shadow: 0 0 6px ${color};
                            animation: sparkleEnd 0.8s ease-out forwards;
                        `;
                        
                        gameArea.appendChild(sparkle);
                        setTimeout(() => {
                            if (sparkle.parentNode) sparkle.remove();
                        }, 800);
                    }, 400 + Math.random() * 200);
                }
                
                // Falling sparkles
                setTimeout(() => {
                    for (let i = 0; i < 8; i++) {
                        const fallX = x + (Math.random() - 0.5) * 80;
                        const fallY = y - 10;
                        const fallColor = colors[Math.floor(Math.random() * colors.length)];
                        
                        const falling = document.createElement("div");
                        falling.style.cssText = `
                            position: absolute;
                            left: ${fallX}px;
                            top: ${fallY}px;
                            width: 2px;
                            height: 2px;
                            background: ${fallColor};
                            border-radius: 50%;
                            z-index: 26;
                            box-shadow: 0 0 3px ${fallColor};
                            animation: fireworkFall 1.5s ease-in forwards;
                        `;
                        
                        gameArea.appendChild(falling);
                        setTimeout(() => {
                            if (falling.parentNode) falling.remove();
                        }, 1500);
                    }
                }, 600);
                
            }, 50);
        }

        function createShieldActivationEffect() {
            const gameArea = document.getElementById("game-area");
            if (!gameArea) return;
            
            // Screen-wide shield effect
            const shieldOverlay = document.createElement("div");
            shieldOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, transparent 30%, rgba(0, 255, 255, 0.3) 70%);
                z-index: 15;
                pointer-events: none;
                animation: shieldWave 1s ease-out forwards;
            `;
            
            gameArea.appendChild(shieldOverlay);
            setTimeout(() => shieldOverlay.remove(), 1000);
        }

        function createSpeedBoostEffect() {
            const gameArea = document.getElementById("game-area");
            if (!gameArea) return;
            
            // Speed lines effect
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const speedLine = document.createElement("div");
                    speedLine.style.cssText = `
                        position: absolute;
                        left: ${Math.random() * 100}%;
                        top: -5px;
                        width: 3px;
                        height: 50px;
                        background: linear-gradient(to bottom, transparent, #ffd700, transparent);
                        z-index: 12;
                        pointer-events: none;
                        animation: speedLineMove 0.5s ease-out forwards;
                    `;
                    
                    gameArea.appendChild(speedLine);
                    setTimeout(() => speedLine.remove(), 500);
                }, i * 50);
            }
        }

        function createJumpBoostEffect() {
            const gameArea = document.getElementById("game-area");
            if (!gameArea) return;
            
            // Upward energy burst
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    const jumpBurst = document.createElement("div");
                    jumpBurst.style.cssText = `
                        position: absolute;
                        left: 50%;
                        bottom: 20%;
                        width: 8px;
                        height: 8px;
                        background: #00ff00;
                        border-radius: 50%;
                        z-index: 20;
                        pointer-events: none;
                        animation: jumpBurstUp 1s ease-out forwards;
                        transform: translateX(-50%);
                        --offset: ${(i - 3) * 20}px;
                    `;
                    
                    gameArea.appendChild(jumpBurst);
                    setTimeout(() => jumpBurst.remove(), 1000);
                }, i * 80);
            }
        }

        function createScoreBoostEffect(x, y) {
            const gameArea = document.getElementById("game-area");
            if (!gameArea) return;
            
            // Flying score particles
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const scoreParticle = document.createElement("div");
                    scoreParticle.style.cssText = `
                        position: absolute;
                        left: ${x}px;
                        top: ${y}px;
                        width: 6px;
                        height: 6px;
                        background: #ff69b4;
                        border-radius: 50%;
                        z-index: 25;
                        pointer-events: none;
                        animation: scoreFloat 1.5s ease-out forwards;
                        --random-x: ${(Math.random() - 0.5) * 100}px;
                        --random-y: ${-Math.random() * 80}px;
                    `;
                    
                    gameArea.appendChild(scoreParticle);
                    setTimeout(() => scoreParticle.remove(), 1500);
                }, i * 50);
            }
        }

        function showFloatingText(text, x, y, color) {
            const floatingText = document.createElement("div");
            floatingText.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                color: ${color};
                font-weight: bold;
                font-size: 14px;
                z-index: 30;
                pointer-events: none;
                transform: translateX(-50%);
                animation: floatUp 2s ease-out forwards;
            `;
            floatingText.textContent = text;
            
            const gameArea = document.getElementById("game-area");
            if (gameArea) {
                gameArea.appendChild(floatingText);
                setTimeout(() => floatingText.remove(), 2000);
            }
        }

        function createCollectionEffect(x, y, type) {
            const colors = {
                shield: "#00ffff",
                speed: "#ffd700", 
                jump: "#00ff00",
                score: "#ff69b4"
            };
            
            // Create burst of particles
            createParticles(x, y, colors[type] || "#ffd700", 25);
            createParticles(x, y, "#ffffff", 15);
            
            // Create multiple expanding rings
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const ring = document.createElement("div");
                    ring.style.cssText = `
                        position: absolute;
                        left: ${x - 20}px;
                        top: ${y - 20}px;
                        width: 40px;
                        height: 40px;
                        border: 3px solid ${colors[type] || "#ffd700"};
                        border-radius: 50%;
                        z-index: 25;
                        pointer-events: none;
                        animation: collectEffect 0.8s ease-out forwards;
                    `;
                    
                    const gameArea = document.getElementById("game-area");
                    if (gameArea) gameArea.appendChild(ring);
                    
                    setTimeout(() => ring.remove(), 800);
                }, i * 150);
            }
            
            // Create starburst effect
            for (let i = 0; i < 8; i++) {
                const angle = (i * 45) * Math.PI / 180;
                const sparkle = document.createElement("div");
                sparkle.style.cssText = `
                    position: absolute;
                    left: ${x}px;
                    top: ${y}px;
                    width: 4px;
                    height: 4px;
                    background: ${colors[type] || "#ffd700"};
                    border-radius: 50%;
                    z-index: 20;
                    pointer-events: none;
                    animation: sparkleOut 1s ease-out forwards;
                    transform-origin: center;
                    --angle: ${angle}rad;
                `;
                
                const gameArea = document.getElementById("game-area");
                if (gameArea) gameArea.appendChild(sparkle);
                
                setTimeout(() => sparkle.remove(), 1000);
            }
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
            gameState.score += gameState.currentSpeed * 0.3; // Slower score increase
            gameState.distance += gameState.currentSpeed * 0.08; // Slower distance
            gameState.stats.totalScore += gameState.currentSpeed * 0.3;
            gameState.stats.totalDistance += gameState.currentSpeed * 0.08;

            // Slower difficulty increase
            if (Math.floor(gameState.score) % 2000 === 0 && Math.floor(gameState.score) > 0) {
                gameState.baseSpeed += 0.05; // Much smaller increases
                showFloatingText("LEVEL UP!", 300, 200, "#ffd700");
            }
        }

        // UI Updates
        function updateHUD() {
            const elements = {
                "score": Math.floor(gameState.score),
                "high-score": gameState.highScore,
                "jumps": gameState.jumpsLeft
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            });

            const jumpsHUD = document.getElementById("jumps-display");
            if (jumpsHUD) {
                jumpsHUD.className = "hud-item";
                if (gameState.jumpsLeft === 1) {
                    jumpsHUD.classList.add("warning");
                } else if (gameState.jumpsLeft === 0) {
                    jumpsHUD.classList.add("danger");
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
            if (gameState.score >= 1000 && !gameState.achievements.score1000) {
                gameState.achievements.score1000 = true;
                showAchievement("🎯 Score Master!");
            }

            if (gameState.score >= 5000 && !gameState.achievements.score5000) {
                gameState.achievements.score5000 = true;
                showAchievement("🏆 High Scorer!");
            }

            if (gameState.currentSpeed >= 10 && !gameState.achievements.speed10) {
                gameState.achievements.speed10 = true;
                showAchievement("🔥 Speed Demon!");
            }

            if (gameState.stats.jumpsUsed >= 20 && !gameState.achievements.jumpMaster) {
                gameState.achievements.jumpMaster = true;
                showAchievement("🚀 Jump Master!");
            }

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
                background: #28a745;
                color: #ffffff;
                padding: 15px 20px;
                border-radius: 8px;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 4px 20px rgba(40, 167, 69, 0.5);
                transform: translateX(100%);
                transition: transform 0.5s ease;
                max-width: 250px;
                font-size: 14px;
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
            
            saveStats();

            const finalScore = Math.floor(gameState.score);
            const finalDistance = Math.floor(gameState.distance);
            const newHighScoreBadge = document.getElementById("new-high-score-badge");
            
            if (finalScore > gameState.highScore) {
                gameState.highScore = finalScore;
                localStorage.setItem("carGameHighScore", gameState.highScore.toString());
                if (newHighScoreBadge) newHighScoreBadge.classList.remove("hidden");
            } else {
                if (newHighScoreBadge) newHighScoreBadge.classList.add("hidden");
            }

            const finalScoreEl = document.getElementById("final-score");
            const finalDistanceEl = document.getElementById("final-distance");
            const gameOverModal = document.getElementById("game-over-modal");
            
            if (finalScoreEl) finalScoreEl.textContent = finalScore;
            if (finalDistanceEl) finalDistanceEl.textContent = finalDistance + "km";
            
            // Show game over modal after short delay to see the crash
            if (gameOverModal) {
                setTimeout(() => {
                    gameOverModal.classList.remove("hidden");
                }, 300);
            }

            // Clean up remaining game objects
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

        function createCrashEffect(obstacleX, obstacleY, playerX, playerY) {
            // This function is now replaced by startCrashSequence
            // Keeping for compatibility but functionality moved to startCrashSequence
        }

        // Data Persistence
        function saveStats() {
            localStorage.setItem("gamesPlayed", gameState.stats.gamesPlayed.toString());
            localStorage.setItem("totalScore", Math.floor(gameState.stats.totalScore).toString());
            localStorage.setItem("totalDistance", Math.floor(gameState.stats.totalDistance).toString());
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
                totalDistance: parseInt(localStorage.getItem("totalDistance") || "0"),
                powerupsCollected: parseInt(localStorage.getItem("powerupsCollected") || "0"),
                jumpsUsed: parseInt(localStorage.getItem("jumpsUsed") || "0"),
            };
        }

        // Event Listeners
function setupEventListeners() {
    document.addEventListener("keydown", (e) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Space", "KeyP"].includes(e.code)) {
            e.preventDefault();
            gameState.keys[e.code] = true;
            gameState.keys[e.key] = true;
            // Handle space bar immediately for jump
            if ((e.code === "Space" || e.key === " ") && gameState.gameRunning && !gameState.gamePaused) {
                if (gameState.jumpsLeft > 0 && !gameState.player.jumping) {
                    jump();
                }
            }
        }
    });

    document.addEventListener("keyup", (e) => {
        gameState.keys[e.code] = false;
        gameState.keys[e.key] = false;
    });

    window.addEventListener("resize", () => {
        gameState.isMobile = window.innerWidth <= 768;
        gameState.updateLanes();
    });

    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
    });

    // Touch controls for mobile
    function setupTouchControls() {
        const carEl = document.getElementById("player-car");
        if (!carEl) return;
        let touchStartX = 0;
        let touchStartY = 0;
        let lastTap = 0;
        let tapTimeout = null;
        carEl.addEventListener("touchstart", function(e) {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        });
        carEl.addEventListener("touchend", function(e) {
            if (e.changedTouches.length === 1) {
                const dx = e.changedTouches[0].clientX - touchStartX;
                const dy = e.changedTouches[0].clientY - touchStartY;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                // Swipe detection (horizontal only)
                if (absDx > 30 && absDx > absDy) {
                    if (dx > 0) {
                        // Swipe right
                        if (typeof gameState.moveRight === 'function') {
                            gameState.moveRight();
                        } else {
                            // fallback: simulate right arrow key
                            const evt = new KeyboardEvent('keydown', {key: 'ArrowRight', code: 'ArrowRight'});
                            window.dispatchEvent(evt);
                        }
                    } else {
                        // Swipe left
                        if (typeof gameState.moveLeft === 'function') {
                            gameState.moveLeft();
                        } else {
                            // fallback: simulate left arrow key
                            const evt = new KeyboardEvent('keydown', {key: 'ArrowLeft', code: 'ArrowLeft'});
                            window.dispatchEvent(evt);
                        }
                    }
                } else {
                    // Double-tap detection
                    const now = Date.now();
                    if (now - lastTap < 350) {
                        // Double-tap detected
                        if (typeof jump === 'function') jump();
                        lastTap = 0;
                        if (tapTimeout) clearTimeout(tapTimeout);
                    } else {
                        lastTap = now;
                        if (tapTimeout) clearTimeout(tapTimeout);
                        tapTimeout = setTimeout(() => { lastTap = 0; }, 400);
                    }
                }
            }
        });
    }
    setupTouchControls();

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
            @keyframes floatUp {
                0% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-60px);
                }
            }
            
            @keyframes sparkleOut {
                0% {
                    opacity: 1;
                    transform: scale(1) translate(0, 0);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.5) translate(
                        calc(cos(var(--angle)) * 40px),
                        calc(sin(var(--angle)) * 40px)
                    );
                }
            }
            
            @keyframes debrisFly {
                0% {
                    opacity: 1;
                    transform: scale(1) translate(0, 0);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(0.8) translate(
                        calc(cos(var(--angle)) * 60px),
                        calc(sin(var(--angle)) * 60px)
                    );
                }
                100% {
                    opacity: 0;
                    transform: scale(0.3) translate(
                        calc(cos(var(--angle)) * 120px),
                        calc(sin(var(--angle)) * 120px)
                    );
                }
            }
            
            @keyframes centerPulse {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(2);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(3);
                    opacity: 0;
                }
            }
            
            @keyframes shieldWave {
                0% {
                    opacity: 0;
                    transform: scale(0.5);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: scale(2);
                }
            }
            
            @keyframes speedLineMove {
                0% {
                    top: -50px;
                    opacity: 0;
                }
                20% {
                    opacity: 1;
                }
                80% {
                    opacity: 1;
                }
                100% {
                    top: 100%;
                    opacity: 0;
                }
            }
            
            @keyframes jumpBurstUp {
                0% {
                    transform: translateX(calc(-50% + var(--offset))) translateY(0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translateX(calc(-50% + var(--offset))) translateY(-100px) scale(0.3);
                    opacity: 0;
                }
            }
            
            @keyframes scoreFloat {
                0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(var(--random-x), var(--random-y)) scale(0.5);
                    opacity: 0;
                }
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
            
            gameState.highScore = parseInt(localStorage.getItem("carGameHighScore") || "0");
            
            showScreen("menu-screen");
        }

        // Start the game when DOM is loaded
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", initGame);
        } else {
            initGame();
        }
    