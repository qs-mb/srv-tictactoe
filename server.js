import express from 'express';
import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {}; // In-memory user storage
const games = {}; // In-memory game storage

app.use(express.json());
app.use(express.static('public'));

// User account routes
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  users[username] = { password };
  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.status(200).json({ message: 'Login successful' });
});

// WebSocket for multiplayer
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGame', (gameId) => {
    if (!games[gameId]) {
      games[gameId] = { players: [], board: Array(9).fill(''), currentPlayer: 'X' };
    }
    const game = games[gameId];
    if (game.players.length >= 2) {
      socket.emit('error', 'Game is full');
      return;
    }
    game.players.push(socket.id);
    socket.join(gameId);
    socket.emit('gameJoined', { gameId, board: game.board, currentPlayer: game.currentPlayer });
    io.to(gameId).emit('playerJoined', game.players.length);
  });

  socket.on('makeMove', ({ gameId, index }) => {
    const game = games[gameId];
    if (!game || game.board[index] !== '' || game.players[game.currentPlayer === 'X' ? 0 : 1] !== socket.id) {
      socket.emit('error', 'Invalid move');
      return;
    }
    game.board[index] = game.currentPlayer;
    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
    io.to(gameId).emit('updateBoard', { board: game.board, currentPlayer: game.currentPlayer });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    for (const gameId in games) {
      const game = games[gameId];
      game.players = game.players.filter((player) => player !== socket.id);
      if (game.players.length === 0) {
        delete games[gameId];
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:12345');
});
