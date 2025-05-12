const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const cols = 10;
const rows = 15;
const tileSize = 30;
const grid = [];
let score = 0;
let selectedTile = null;
const fallSpeed = 4;
let isDragging = false;
let dragTile = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let mouseX = 0;
let mouseY = 0;


// Hình trái cây
const fruits = ['apple', 'banana', 'grape', 'orange'];
const fruitImages = {};
fruits.forEach(fruit => {
  const img = new Image();
  img.src = `assets/${fruit}.png`;
  fruitImages[fruit] = img;
});

// Khởi tạo bảng
function initGrid() {
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = {
        type: fruits[Math.floor(Math.random() * fruits.length)],
        falling: false,
        yOffset: 0
      };
    }
  }
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (!cell || !cell.type) continue;
      const img = fruitImages[cell.type];
      const yOffset = cell.yOffset || 0;
      ctx.drawImage(img, c * tileSize, r * tileSize + yOffset, tileSize, tileSize);
    }
  }

	if (isDragging && dragTile) {
	  const fruit = grid[dragTile.row][dragTile.col];
	  if (fruit) {
	    const img = fruitImages[fruit.type];
	    const x = mouseX - dragOffsetX;
	    const y = mouseY - dragOffsetY;
	    ctx.globalAlpha = 0.8;
	    ctx.drawImage(img, x, y, tileSize, tileSize);
	    ctx.globalAlpha = 1.0;

	    // Xoá trái cây gốc để không hiển thị 2 lần
	    ctx.clearRect(dragTile.col * tileSize, dragTile.row * tileSize, tileSize, tileSize);
	  }
	}
}

// Match logic (ngang + dọc)
function findMatches() {
  const matches = [];

  // Ngang
  for (let r = 0; r < rows; r++) {
    let streak = 1;
    for (let c = 1; c <= cols; c++) {
      const curr = grid[r][c]?.type;
      const prev = grid[r][c - 1]?.type;
      if (curr && curr === prev) {
        streak++;
      } else {
        if (streak >= 3) {
          for (let k = 0; k < streak; k++) matches.push({ r, c: c - 1 - k });
        }
        streak = 1;
      }
    }
  }

  // Dọc
  for (let c = 0; c < cols; c++) {
    let streak = 1;
    for (let r = 1; r <= rows; r++) {
      const curr = grid[r]?.[c]?.type;
      const prev = grid[r - 1]?.[c]?.type;
      if (curr && curr === prev) {
        streak++;
      } else {
        if (streak >= 3) {
          for (let k = 0; k < streak; k++) matches.push({ r: r - 1 - k, c });
        }
        streak = 1;
      }
    }
  }

  return matches;
}

function removeMatches(matches) {
  matches.forEach(({ r, c }) => {
    if (grid[r][c]) {
      grid[r][c] = null;
    }
  });
  score += matches.length * 10;
  scoreElement.textContent = `Điểm: ${score}`;
}

function collapse() {
  for (let c = 0; c < cols; c++) {
    for (let r = rows - 1; r >= 0; r--) {
      if (!grid[r][c]) {
        for (let k = r - 1; k >= 0; k--) {
          if (grid[k][c]) {
            grid[r][c] = grid[k][c];
            grid[r][c].yOffset = -tileSize * (r - k);
            grid[k][c] = null;
            break;
          }
        }
        if (!grid[r][c]) {
          grid[r][c] = {
            type: fruits[Math.floor(Math.random() * fruits.length)],
            yOffset: -tileSize * (r + 1)
          };
        }
      }
    }
  }
}

// Animation rơi xuống
function animate() {
  let falling = false;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell && cell.yOffset < 0) {
        cell.yOffset += fallSpeed;
        falling = true;
      } else if (cell) {
        cell.yOffset = 0;
      }
    }
  }
  return falling;
}

// Drag & Drop
canvas.addEventListener('mousedown', (e) => {
  const col = Math.floor(e.offsetX / tileSize);
  const row = Math.floor(e.offsetY / tileSize);
  if (grid[row] && grid[row][col]) {
    dragTile = { row, col };
    dragOffsetX = e.offsetX - col * tileSize;
    dragOffsetY = e.offsetY - row * tileSize;
    isDragging = true;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
  }
});


canvas.addEventListener('mouseup', (e) => {
  if (!isDragging || !dragTile) return;

  const targetCol = Math.floor(e.offsetX / tileSize);
  const targetRow = Math.floor(e.offsetY / tileSize);
  const dx = Math.abs(targetCol - dragTile.col);
  const dy = Math.abs(targetRow - dragTile.row);

  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
    // Hoán đổi
    const temp = grid[dragTile.row][dragTile.col];
    grid[dragTile.row][dragTile.col] = grid[targetRow][targetCol];
    grid[targetRow][targetCol] = temp;
  }

  isDragging = false;
  dragTile = null;
});


// Game loop chính
function gameLoop() {
  const stillFalling = animate();
  drawGrid();

  if (!stillFalling) {
    const matches = findMatches();
    if (matches.length > 0) {
      removeMatches(matches);
      collapse();
    }
  }

  requestAnimationFrame(gameLoop);
}

// Khởi động game
initGrid();
gameLoop();

// Pi SDK Login
// Pi.init({ version: "2.0" });
// Pi.authenticate(['username'], (auth) => {
//   console.log("Người dùng Pi:", auth.user.username);
// });
