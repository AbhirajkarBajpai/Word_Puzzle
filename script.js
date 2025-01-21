const wordsList = [
  "MID",
  "GAME",
  "GRID",
  "TABLE",
  "PLAY",
  "LOSE",
  "DOES",
  "LOSER",
  "FEAR",
  "BEAR",
  "FEES",
  "TRIM",
  "RIDE",
  "FEEL",
];
const gridLetters = [
  ["G", "A", "I", "K", "L"],
  ["T", "R", "M", "D", "O"],
  ["A", "N", "F", "E", "S"],
  ["S", "B", "E", "R", "E"],
  ["P", "L", "A", "Y", "R"],
];
let selectedLetters = [];
let selectedPositions = [];
let score = 0;
const minWordLength = 3;
let isMouseDown = false;
let isTouching = false;
let gameCompleted = false; // Flag to track game completion status
const lines = [];
const maxScore = wordsList.reduce((acc, word) => acc + word.length, 0); // Maximum possible score
let circleElement;

document.addEventListener("DOMContentLoaded", () => {
  const gridElement = document.getElementById("grid");
  const wordsElement = document.getElementById("words");
  const noWordsElement = document.getElementById("no-words");
  const scoreElement = document.getElementById("score");
  const messageElement = document.getElementById("message");
  const scoreBarElement = document.getElementById("score-bar");

  // Initialize grid
  for (let row = 0; row < gridLetters.length; row++) {
    for (let col = 0; col < gridLetters[row].length; col++) {
      const cell = document.createElement("div");
      cell.textContent = gridLetters[row][col];
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("mousedown", (event) =>
        handleMouseDown(event, row, col, cell)
      );
      cell.addEventListener("mouseover", (event) =>
        handleMouseOver(event, row, col, cell)
      );
      cell.addEventListener("mouseup", handleMouseUp);
      cell.addEventListener("touchstart", (event) =>
        handleTouchStart(event, row, col, cell)
      );
      cell.addEventListener("touchmove", (event) => handleTouchMove(event));
      cell.addEventListener("touchend", handleTouchEnd);
      gridElement.appendChild(cell);
    }
  }

  // Create and append the circle element
  circleElement = document.createElement("div");
  circleElement.classList.add("circle");
  circleElement.style.display = "none";
  document.body.appendChild(circleElement);

  function handleMouseDown(event, row, col, cell) {
    if (gameCompleted) {
      alert("Game completed! Restart to play again.");
      return;
    }
    isMouseDown = true;
    resetSelection();
    handleCellClick(row, col, cell);
    showCircle(cell); // Show circle on first click
  }

  function handleMouseOver(event, row, col, cell) {
    if (isMouseDown) {
      handleCellClick(row, col, cell);
      showCircle(cell); // Show circle while dragging
    }
  }

  function handleMouseUp() {
    if (gameCompleted) {
      return;
    }
    isMouseDown = false;
    hideCircle(); // Hide circle on mouse up
    processSelection();
  }

  function handleTouchStart(event, row, col, cell) {
    event.preventDefault(); // Prevent default touch behavior
    if (gameCompleted) {
      alert("Game completed! Restart to play again.");
      return;
    }
    isTouching = true;
    resetSelection();
    handleCellClick(row, col, cell);
    showCircle(cell); // Show circle on first touch
  }

  function handleTouchMove(event) {
    event.preventDefault(); // Prevent default touch behavior
    if (isTouching) {
      const touch = event.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.dataset.row && element.dataset.col) {
        const row = parseInt(element.dataset.row);
        const col = parseInt(element.dataset.col);
        handleCellClick(row, col, element);
        showCircle(element); // Show circle while dragging
      }
    }
  }

  function handleTouchEnd() {
    if (gameCompleted) {
      return;
    }
    isTouching = false;
    hideCircle(); // Hide circle on touch end
    processSelection();
  }

  function handleCellClick(row, col, cell) {
    const position = `${row},${col}`;
    const lastPosition = selectedPositions[selectedPositions.length - 1];

    if (selectedPositions.length > 0 && !isAdjacent(lastPosition, position)) {
      resetSelection();
    }

    if (!selectedPositions.includes(position)) {
      selectedLetters.push(cell.textContent);
      selectedPositions.push(position);
      cell.classList.add("selected");
      if (selectedPositions.length > 1) {
        drawLine(lastPosition, position);
      }
    }
  }

  async function processSelection() {
    if (selectedLetters.length >= minWordLength) {
      const word = selectedLetters.join("");
      const ispresent = await validateWord(word);
      if (ispresent) {
        if (!wordsElement.textContent.includes(word)) {
          const wordItem = document.createElement("li");
          wordItem.textContent = word;
          wordsElement.appendChild(wordItem);
          score += word.length;
          scoreElement.textContent = score;
          updateScoreBar();
          messageElement.textContent = "Good Job!";
          messageElement.style.color = "green";
          noWordsElement.style.display = "none"; // Hide the "No Words Found Yet" message
        } else {
          alert("Word already found!");
        }
        resetSelection();
        checkCompletion();
      } else {
        messageElement.textContent = "Invalid word!";
        messageElement.style.color = "red";
        resetSelection();
      }
    } else {
      messageElement.textContent = "Invalid word!";
      messageElement.classList.add("error");
      resetSelection();
    }
  }

  function isAdjacent(lastPosition, currentPosition) {
    const [lastRow, lastCol] = lastPosition.split(",").map(Number);
    const [currentRow, currentCol] = currentPosition.split(",").map(Number);

    const rowDiff = Math.abs(lastRow - currentRow);
    const colDiff = Math.abs(lastCol - currentCol);

    return rowDiff <= 1 && colDiff <= 1;
  }

  function drawLine(fromPosition, toPosition) {
    const [fromRow, fromCol] = fromPosition.split(",").map(Number);
    const [toRow, toCol] = toPosition.split(",").map(Number);

    const fromCell = document.querySelector(
      `.grid div[data-row="${fromRow}"][data-col="${fromCol}"]`
    );
    const toCell = document.querySelector(
      `.grid div[data-row="${toRow}"][data-col="${toCol}"]`
    );

    const fromRect = fromCell.getBoundingClientRect();
    const toRect = toCell.getBoundingClientRect();

    const fromX = fromRect.left + fromRect.width / 2;
    const fromY = fromRect.top + fromRect.height / 2;
    const toX = toRect.left + toRect.width / 2;
    const toY = toRect.top + toRect.height / 2;

    const line = document.createElement("div");
    line.classList.add("line");
    document.body.appendChild(line);

    const length = Math.sqrt(
      Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2)
    );
    const angle = (Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI;

    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.top = `${fromY}px`;
    line.style.left = `${fromX}px`;

    lines.push(line);
  }

  function showCircle(cell) {
    const rect = cell.getBoundingClientRect();
    circleElement.style.left = `${
      rect.left + rect.width / 2 - circleElement.offsetWidth / 2
    }px`;
    circleElement.style.top = `${
      rect.top + rect.height / 2 - circleElement.offsetHeight / 2
    }px`;
    circleElement.textContent = cell.textContent;
    circleElement.style.display = "flex";
  }

  function hideCircle() {
    circleElement.style.display = "none";
  }

  function resetSelection() {
    selectedLetters = [];
    selectedPositions = [];
    const cells = document.querySelectorAll(".grid div");
    cells.forEach((cell) => cell.classList.remove("selected"));
    lines.forEach((line) => line.remove());
    lines.length = 0;
  }

  async function validateWord(word) {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
  
      // Check if the API returned a successful response (status 200)
      if (response.ok) {
        return true;
      } else {
        // If the status is not 200, return false
        return false;
      }
    } catch (error) {
      // Handle network or other fetch-related errors
      console.error("Error fetching the API:", error);
      return false;
    }
  }
  

  function updateScoreBar() {
    const scorePercentage = (score / maxScore) * 100;
    scoreBarElement.style.width = `${scorePercentage}%`;
    scoreBarElement.style.background = `linear-gradient(to right, #ADD899 ${scorePercentage}%, #78ABA8 100%)`;
  }

  function checkCompletion() {
    if (wordsElement.children.length === wordsList.length) {
      messageElement.textContent = "You completed the game!";
      gameCompleted = true; // Mark the game as completed
    }
  }

  // Periodically check for game completion
  setInterval(checkCompletion, 1000);
});
