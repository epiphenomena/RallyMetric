# RallyMetric
A simple statistics tracker for volleyball managers

A simple HTML and vanilla JavaScript based web page that enables the user to track multiple statistics for multiple volleyball players during the game.
The design is simple, clean, and modern. Single page application.

## Features

The stats that need to be tracked are:

- Aces
- Serves
- Digs
- Sets
- Hits
- Kills
- Blocks

The stats are columns and the players are rows. The player name and position are the row label.

The stats are just tallies, so for each stat there is a button that adds 1 and a button that subtracts 1.

All of the data is kept locally in the browser using localStorage. It supports keeping separate records for each game by date and time.

## How to Run

1. Clone or download this repository
2. Open `index.html` in a web browser directly, or
3. Serve the files using a local web server:
   - With Python 3: `python -m http.server 8000`
   - With Node.js: `npx serve`
   - Or any other local web server

## How to Use

1. Add players using the player form (name and position)
2. Track statistics for each player using the + and - buttons
3. Create new games using the "New Game" button
4. Switch between games using the game selector dropdown
5. All data is automatically saved in your browser's localStorage

## Implementation Details

- Pure HTML, CSS, and JavaScript (no frameworks)
- Responsive design that works on mobile and desktop
- Data persisted in localStorage
- Clean, modern UI with intuitive controls