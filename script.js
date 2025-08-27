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

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
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
}

// Game management functions
function createNewGame() {
    const now = new Date();
    const gameId = now.toISOString();
    const gameName = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    games[gameId] = {
        id: gameId,
        name: gameName,
        date: now,
        players: {}
    };
    
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
        playing: true, // Default to playing when added
        stats: {
            aces: 0,
            serves: 0,
            digs: 0,
            sets: 0,
            hits: 0,
            kills: 0,
            blocks: 0
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
            <td>
                <button class="subtract-column" data-stat="aces" data-player-id="${player.id}">-</button>
                ${player.stats.aces}
                <button class="add-column" data-stat="aces" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="serves" data-player-id="${player.id}">-</button>
                ${player.stats.serves}
                <button class="add-column" data-stat="serves" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="digs" data-player-id="${player.id}">-</button>
                ${player.stats.digs}
                <button class="add-column" data-stat="digs" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="sets" data-player-id="${player.id}">-</button>
                ${player.stats.sets}
                <button class="add-column" data-stat="sets" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="hits" data-player-id="${player.id}">-</button>
                ${player.stats.hits}
                <button class="add-column" data-stat="hits" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="kills" data-player-id="${player.id}">-</button>
                ${player.stats.kills}
                <button class="add-column" data-stat="kills" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="blocks" data-player-id="${player.id}">-</button>
                ${player.stats.blocks}
                <button class="add-column" data-stat="blocks" data-player-id="${player.id}">+</button>
            </td>
            <td class="actions">
                <button class="remove-player-row" data-player-id="${player.id}">×</button>
            </td>
        `;
        
        statsBody.appendChild(row);
    });
    
    // Add event listeners for the new buttons
    document.querySelectorAll('.subtract-column, .add-column').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const stat = button.getAttribute('data-stat');
            const playerId = button.getAttribute('data-player-id');
            const change = button.classList.contains('add-column') ? 1 : -1;
            
            updatePlayerStat(playerId, stat, change);
            saveGame();
            renderStatsTable();
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