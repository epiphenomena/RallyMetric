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

    // Download CSV
    downloadCsvButton.addEventListener('click', downloadCSV);
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
        playing: false, // Default to not playing when added
        stats: {
            // Passing
            pass3: 0,
            pass2: 0,
            pass1: 0,
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
            <td>
                <button class="subtract-column" data-stat="pass3" data-player-id="${player.id}">-</button>
                ${player.stats.pass3}
                <button class="add-column" data-stat="pass3" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="pass2" data-player-id="${player.id}">-</button>
                ${player.stats.pass2}
                <button class="add-column" data-stat="pass2" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="pass1" data-player-id="${player.id}">-</button>
                ${player.stats.pass1}
                <button class="add-column" data-stat="pass1" data-player-id="${player.id}">+</button>
            </td>
            <!-- Sets -->
            <td>
                <button class="subtract-column" data-stat="setAtt" data-player-id="${player.id}">-</button>
                ${player.stats.setAtt}
                <button class="add-column" data-stat="setAtt" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="setAsst" data-player-id="${player.id}">-</button>
                ${player.stats.setAsst}
                <button class="add-column" data-stat="setAsst" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="setErr" data-player-id="${player.id}">-</button>
                ${player.stats.setErr}
                <button class="add-column" data-stat="setErr" data-player-id="${player.id}">+</button>
            </td>
            <!-- Hitting -->
            <td>
                <button class="subtract-column" data-stat="hitAtt" data-player-id="${player.id}">-</button>
                ${player.stats.hitAtt}
                <button class="add-column" data-stat="hitAtt" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="hitKill" data-player-id="${player.id}">-</button>
                ${player.stats.hitKill}
                <button class="add-column" data-stat="hitKill" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="hitErr" data-player-id="${player.id}">-</button>
                ${player.stats.hitErr}
                <button class="add-column" data-stat="hitErr" data-player-id="${player.id}">+</button>
            </td>
            <!-- Digs -->
            <td>
                <button class="subtract-column" data-stat="digs" data-player-id="${player.id}">-</button>
                ${player.stats.digs}
                <button class="add-column" data-stat="digs" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="digErr" data-player-id="${player.id}">-</button>
                ${player.stats.digErr}
                <button class="add-column" data-stat="digErr" data-player-id="${player.id}">+</button>
            </td>
            <!-- Block -->
            <td>
                <button class="subtract-column" data-stat="block" data-player-id="${player.id}">-</button>
                ${player.stats.block}
                <button class="add-column" data-stat="block" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="blockBLT" data-player-id="${player.id}">-</button>
                ${player.stats.blockBLT}
                <button class="add-column" data-stat="blockBLT" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="blockErr" data-player-id="${player.id}">-</button>
                ${player.stats.blockErr}
                <button class="add-column" data-stat="blockErr" data-player-id="${player.id}">+</button>
            </td>
            <!-- Serves -->
            <td>
                <button class="subtract-column" data-stat="serveAtt" data-player-id="${player.id}">-</button>
                ${player.stats.serveAtt}
                <button class="add-column" data-stat="serveAtt" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="serveAce" data-player-id="${player.id}">-</button>
                ${player.stats.serveAce}
                <button class="add-column" data-stat="serveAce" data-player-id="${player.id}">+</button>
            </td>
            <td>
                <button class="subtract-column" data-stat="serveErr" data-player-id="${player.id}">-</button>
                ${player.stats.serveErr}
                <button class="add-column" data-stat="serveErr" data-player-id="${player.id}">+</button>
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

// CSV Export function
function downloadCSV() {
    if (!currentGameId || !games[currentGameId]) return;
    const currentGame = games[currentGameId];
    const players = Object.values(currentGame.players);
    // Create CSV content
    let csvContent = "Playing,Player,Position,Pass3,Pass2,Pass1,SetAtt,SetAsst,SetErr,HitAtt,HitKill,HitErr,Digs,DigErr,Block,BLT,BlockErr,ServeAtt,ServeAce,ServeErr\n";
    players.forEach(player => {
        const row = [
            player.playing ? 'Yes' : 'No',
            player.name,
            player.position,
            player.stats.pass3,
            player.stats.pass2,
            player.stats.pass1,
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