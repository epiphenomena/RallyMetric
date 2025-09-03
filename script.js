// Main application state
let games = JSON.parse(localStorage.getItem('rallymetric-games')) || {};
let currentGameId = localStorage.getItem('rallymetric-current-game') || null;

// DOM Elements
const gameDateSelect = document.getElementById('game-date');
const newGameButton = document.getElementById('new-game');
const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playerPositionInput = document.getElementById('player-position');
const playersList = document.getElementById('players-list');
const statsBody = document.getElementById('stats-body');
const downloadCsvButton = document.getElementById('download-csv');
const minusButton = document.getElementById('minus-button');
let aboutLink;
let aboutModal;
let closeModal;

// State for minus mode
let minusModeActive = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Get modal elements after DOM is loaded
    aboutLink = document.getElementById('about-link');
    aboutModal = document.getElementById('about-modal');
    closeModal = document.querySelector('.close');
    
    loadGames();
    setupEventListeners();
    renderGameSelector();
    
    if (!currentGameId || !games[currentGameId]) {
        createNewGame();
    }
    
    renderStatsTable();
});

// Set up event listeners
function setupEventListeners() {
    // Game management
    newGameButton.addEventListener('click', createNewGame);
    gameDateSelect.addEventListener('change', switchGame);

    // Player management
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addPlayer();
    });

    // Download CSV
    downloadCsvButton.addEventListener('click', downloadCSV);
    
    // Minus button
    minusButton.addEventListener('click', toggleMinusMode);
    
    // About modal
    aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.style.display = 'block';
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });
}

// Game management functions
function createNewGame() {
    const now = new Date();
    const gameId = now.toISOString();
    const gameName = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    // Create new game with empty players object
    const newGame = {
        id: gameId,
        name: gameName,
        date: now,
        players: {}
    };
    
    // If there are existing games, copy player names and positions from the most recent game
    const gameIds = Object.keys(games);
    if (gameIds.length > 0) {
        // Find the most recent game
        const mostRecentGameId = gameIds.reduce((mostRecent, gameId) => {
            if (!mostRecent) return gameId;
            return games[gameId].date > games[mostRecent].date ? gameId : mostRecent;
        }, null);
        
        // Copy player names and positions (but not stats) from the most recent game
        if (mostRecentGameId) {
            const mostRecentGame = games[mostRecentGameId];
            Object.values(mostRecentGame.players).forEach(player => {
                const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9); // New unique ID
                newGame.players[playerId] = {
                    id: playerId,
                    name: player.name,
                    position: player.position,
                    playing: false, // Default to not playing
                    stats: {
                        // Initialize all stats to 0
                        pass3: 0,
                        pass2: 0,
                        pass1: 0,
                        pass0: 0,
                        setAtt: 0,
                        setAsst: 0,
                        setErr: 0,
                        hitAtt: 0,
                        hitKill: 0,
                        hitErr: 0,
                        digs: 0,
                        digErr: 0,
                        block: 0,
                        blockBLT: 0,
                        blockErr: 0,
                        serveAtt: 0,
                        serveAce: 0,
                        serveErr: 0
                    }
                };
            });
        }
    }
    
    games[gameId] = newGame;
    currentGameId = gameId;
    localStorage.setItem('rallymetric-current-game', currentGameId);
    saveGames();
    renderGameSelector();
    renderStatsTable();
}

function switchGame() {
    currentGameId = gameDateSelect.value;
    localStorage.setItem('rallymetric-current-game', currentGameId);
    renderStatsTable();
}

// Player management functions
function addPlayer() {
    const name = playerNameInput.value.trim();
    const position = playerPositionInput.value;

    if (!name || !position) return;

    const playerId = Date.now().toString(); // Simple unique ID
    const currentGame = games[currentGameId];

    currentGame.players[playerId] = {
        id: playerId,
        name: name,
        position: position,
        playing: false, // Default to not playing when added
        stats: {
            // Passing
            pass3: 0,
            pass2: 0,
            pass1: 0,
            pass0: 0,
            // Sets
            setAtt: 0,
            setAsst: 0,
            setErr: 0,
            // Hitting
            hitAtt: 0,
            hitKill: 0,
            hitErr: 0,
            // Digs
            digs: 0,
            digErr: 0,
            // Block
            block: 0,
            blockBLT: 0,
            blockErr: 0,
            // Serves
            serveAtt: 0,
            serveAce: 0,
            serveErr: 0
        }
    };

    // Clear form
    playerNameInput.value = '';
    playerPositionInput.selectedIndex = 0;

    saveGame();
    renderStatsTable();
}

function removePlayer(playerId) {
    const currentGame = games[currentGameId];
    delete currentGame.players[playerId];
    saveGame();
    renderStatsTable();
}

// Stats management functions
function updatePlayerStat(playerId, statName, change) {
    const currentGame = games[currentGameId];
    const player = currentGame.players[playerId];

    if (player) {
        player.stats[statName] = Math.max(0, player.stats[statName] + change);
    }
}

// Render functions
function renderGameSelector() {
    gameDateSelect.innerHTML = '';

    Object.values(games)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(game => {
            const option = document.createElement('option');
            option.value = game.id;
            option.textContent = game.name;
            if (game.id === currentGameId) {
                option.selected = true;
            }
            gameDateSelect.appendChild(option);
        });
}

function renderStatsTable() {
    if (!currentGameId || !games[currentGameId]) return;
    
    const currentGame = games[currentGameId];
    statsBody.innerHTML = '';
    
    // Sort players: playing first, then by position, then by name
    const sortedPlayers = Object.values(currentGame.players).sort((a, b) => {
        // First sort by playing status (playing first)
        if (a.playing && !b.playing) return -1;
        if (!a.playing && b.playing) return 1;
        
        // Then sort by position
        const positionOrder = { 'Setter': 1, 'Hitter': 2, 'DS': 3 };
        const positionComparison = (positionOrder[a.position] || 4) - (positionOrder[b.position] || 4);
        if (positionComparison !== 0) return positionComparison;
        
        // Finally sort by name
        return a.name.localeCompare(b.name);
    });
    
    sortedPlayers.forEach(player => {
        const row = document.createElement('tr');
        
        // Add position-based CSS class
        const positionClass = player.position.toLowerCase() + '-row';
        row.classList.add(positionClass);
        
        row.innerHTML = `
            <td><input type="checkbox" class="playing-checkbox" data-player-id="${player.id}" ${player.playing ? 'checked' : ''}></td>
            <td>${player.name}</td>
            <td>${player.position}</td>
            <!-- Passing -->
            <td class="stat-cell" data-stat="pass3" data-player-id="${player.id}">${player.stats.pass3}</td>
            <td class="stat-cell" data-stat="pass2" data-player-id="${player.id}">${player.stats.pass2}</td>
            <td class="stat-cell" data-stat="pass1" data-player-id="${player.id}">${player.stats.pass1}</td>
            <td class="stat-cell" data-stat="pass0" data-player-id="${player.id}">${player.stats.pass0}</td>
            <!-- Sets -->
            <td class="stat-cell" data-stat="setAtt" data-player-id="${player.id}">${player.stats.setAtt}</td>
            <td class="stat-cell" data-stat="setAsst" data-player-id="${player.id}">${player.stats.setAsst}</td>
            <td class="stat-cell" data-stat="setErr" data-player-id="${player.id}">${player.stats.setErr}</td>
            <!-- Hitting -->
            <td class="stat-cell" data-stat="hitAtt" data-player-id="${player.id}">${player.stats.hitAtt}</td>
            <td class="stat-cell" data-stat="hitKill" data-player-id="${player.id}">${player.stats.hitKill}</td>
            <td class="stat-cell" data-stat="hitErr" data-player-id="${player.id}">${player.stats.hitErr}</td>
            <!-- Digs -->
            <td class="stat-cell" data-stat="digs" data-player-id="${player.id}">${player.stats.digs}</td>
            <td class="stat-cell" data-stat="digErr" data-player-id="${player.id}">${player.stats.digErr}</td>
            <!-- Block -->
            <td class="stat-cell" data-stat="block" data-player-id="${player.id}">${player.stats.block}</td>
            <td class="stat-cell" data-stat="blockBLT" data-player-id="${player.id}">${player.stats.blockBLT}</td>
            <td class="stat-cell" data-stat="blockErr" data-player-id="${player.id}">${player.stats.blockErr}</td>
            <!-- Serves -->
            <td class="stat-cell" data-stat="serveAtt" data-player-id="${player.id}">${player.stats.serveAtt}</td>
            <td class="stat-cell" data-stat="serveAce" data-player-id="${player.id}">${player.stats.serveAce}</td>
            <td class="stat-cell" data-stat="serveErr" data-player-id="${player.id}">${player.stats.serveErr}</td>
            <td class="actions">
                <button class="remove-player-row" data-player-id="${player.id}">×</button>
            </td>
        `;
        
        statsBody.appendChild(row);
    });
    
    // Add event listeners for the stat cells
    document.querySelectorAll('.stat-cell').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const stat = cell.getAttribute('data-stat');
            const playerId = cell.getAttribute('data-player-id');
            
            // Determine if we're adding or subtracting
            const change = minusModeActive ? -1 : 1;
            
            updatePlayerStat(playerId, stat, change);
            saveGame();
            renderStatsTable();
            
            // If we were in minus mode, deactivate it
            if (minusModeActive) {
                toggleMinusMode();
            }
        });
    });
    
    document.querySelectorAll('.remove-player-row').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const playerId = button.getAttribute('data-player-id');
            removePlayer(playerId);
        });
    });
    
    // Add event listeners for the playing checkboxes
    document.querySelectorAll('.playing-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            const playerId = checkbox.getAttribute('data-player-id');
            const currentGame = games[currentGameId];
            const player = currentGame.players[playerId];
            
            if (player) {
                player.playing = checkbox.checked;
                saveGame();
                renderStatsTable();
            }
        });
    });
}

// Storage functions
function saveGames() {
    localStorage.setItem('rallymetric-games', JSON.stringify(games));
}

function saveGame() {
    saveGames();
}

function loadGames() {
    const savedGames = localStorage.getItem('rallymetric-games');
    if (savedGames) {
        games = JSON.parse(savedGames);
        // Convert date strings back to Date objects
        Object.values(games).forEach(game => {
            game.date = new Date(game.date);
        });
    }
}

// Minus mode functions
function toggleMinusMode() {
    minusModeActive = !minusModeActive;
    if (minusModeActive) {
        minusButton.classList.add('active');
    } else {
        minusButton.classList.remove('active');
    }
}

// CSV Export function
function downloadCSV() {
    if (!currentGameId || !games[currentGameId]) return;
    const currentGame = games[currentGameId];
    const players = Object.values(currentGame.players);
    // Create CSV content
    let csvContent = "Playing,Player,Position,Pass3,Pass2,Pass1,Pass0,SetAtt,SetAsst,SetErr,HitAtt,HitKill,HitErr,Digs,DigErr,Block,BLT,BlockErr,ServeAtt,ServeAce,ServeErr\n";
    players.forEach(player => {
        const row = [
            player.playing ? 'Yes' : 'No',
            player.name,
            player.position,
            player.stats.pass3,
            player.stats.pass2,
            player.stats.pass1,
            player.stats.pass0,
            player.stats.setAtt,
            player.stats.setAsst,
            player.stats.setErr,
            player.stats.hitAtt,
            player.stats.hitKill,
            player.stats.hitErr,
            player.stats.digs,
            player.stats.digErr,
            player.stats.block,
            player.stats.blockBLT,
            player.stats.blockErr,
            player.stats.serveAtt,
            player.stats.serveAce,
            player.stats.serveErr
        ].join(',');
        csvContent += row + '\n';
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `rallymetric-${currentGame.name.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}