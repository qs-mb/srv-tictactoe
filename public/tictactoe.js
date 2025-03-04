const socket = io();

const cells = document.querySelectorAll('.cell');
const statusText = document.querySelector('.status');
const registerButton = document.getElementById('register');
const loginButton = document.getElementById('login');
const joinGameButton = document.getElementById('joinGame');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const gameIdInput = document.getElementById('gameId');

let currentPlayer = null;
let gameId = null;

registerButton.addEventListener('click', async () => {
  const username = usernameInput.value;
  const password = passwordInput.value;
  const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  alert(data.message);
});

loginButton.addEventListener('click', async () => {
  const username = usernameInput.value;
  const password = passwordInput.value;
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  alert(data.message);
});

joinGameButton.addEventListener('click', () => {
  gameId = gameIdInput.value;
  socket.emit('joinGame', gameId);
});

socket.on('gameJoined', ({ gameId: id, board, currentPlayer: player }) => {
  gameId = id;
  currentPlayer = player;
  updateBoard(board);
  statusText.textContent = `Player ${currentPlayer}'s turn`;
});

socket.on('updateBoard', ({ board, currentPlayer: player }) => {
  currentPlayer = player;
  updateBoard(board);
  statusText.textContent = `Player ${currentPlayer}'s turn`;
});

cells.forEach((cell, index) => {
  cell.addEventListener('click', () => {
    if (!gameId || !currentPlayer) return;
    socket.emit('makeMove', { gameId, index });
  });
});

function updateBoard(board) {
  cells.forEach((cell, index) => {
    cell.textContent = board[index];
  });
}
