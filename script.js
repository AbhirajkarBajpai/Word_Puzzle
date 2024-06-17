const gridLetters = [
  ["G", "A", "I", "K", "L"],
  ["T", "R", "M", "D", "O"],
  ["A", "N", "F", "E", "S"],
  ["S", "B", "E", "R", "E"],
  ["P", "L", "A", "Y", "R"],
];
let selectedLetters = [];
let selectedNo=[];
let selectedPositions = [];
let score = 0;
const minWordLength = 3;
let isMouseDown = false;
let isTouching = false;
let gameCompleted = false;
const lines = [];
let wordsFounded = [];
let circleElement;

document.addEventListener("DOMContentLoaded", () => {
  const gridElement = document.getElementById("grid");
  const popOutMessage = document.getElementById("popOutMessage");
  const scoreElement = document.getElementById("score");
  const messageElement = document.getElementById("message");
  const tempElement = document.getElementById("temp");

  // Initialize grid
  for (let row = 0; row < gridLetters.length; row++) {
    for (let col = 0; col < gridLetters[row].length; col++) {
      const cell = document.createElement("div");
      cell.style.backgroundColor = "#bacadf";
      cell.textContent = gridLetters[row][col];
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("mousedown", (event) =>
        handleMouseDown(event, row, col, cell)
      );
      cell.addEventListener("mouseover", (event) =>
        handleMouseOver(event, row, col, cell)
      );
      cell.addEventListener("mouseup", () => handleMouseUp(cell));
      cell.addEventListener("touchstart", (event) =>
        handleTouchStart(event, row, col, cell)
      );
      cell.addEventListener("touchmove", (event) => handleTouchMove(event));
      cell.addEventListener("touchend", () => handleTouchEnd(cell));
      const operator = document.createElement("p");
      operator.textContent = Math.floor(Math.random() * 3) + 1;
      operator.classList.add("symbols");
      cell.appendChild(operator);
      gridElement.appendChild(cell);
    }
  }

  let timeLeft = 60;
  const timerElement = document.getElementById("timer");

  function updateTimer() {
    timerElement.textContent = `Time Remaining: ${timeLeft}sec`;
    if (timeLeft > 0) {
      timeLeft--;
    } else {
      gameCompleted = true;
      timerElement.textContent = "Game Completed!!"
      clearInterval(timerInterval);
    }
  }

  // Update the timer every second
  const timerInterval = setInterval(updateTimer, 1000);

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
    // showCircle(cell); // Show circle on first click
  }

  function handleMouseOver(event, row, col, cell) {
    if (isMouseDown) {
      handleCellClick(row, col, cell);
      // showCircle(cell); // Show circle while dragging
    }
  }

  function handleMouseUp(cell) {
    if (gameCompleted) {
      return;
    }
    isMouseDown = false;
    // hideCircle(); // Hide circle on mouse up
    processSelection(cell);
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
    // showCircle(cell); // Show circle on first touch
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
        // showCircle(element); // Show circle while dragging
      }
    }
  }

  function handleTouchEnd(cell) {
    if (gameCompleted) {
      return;
    }
    isTouching = false;
    // hideCircle(); // Hide circle on touch end
    processSelection(cell);
  }

  function handleCellClick(row, col, cell) {
    const position = `${row},${col}`;
    const lastPosition = selectedPositions[selectedPositions.length - 1];

    if (selectedPositions.length > 0 && !isAdjacent(lastPosition, position)) {
      resetSelection();
    }

    if (selectedPositions.includes(position)) {
      const index = selectedPositions.indexOf(position);

      for (let i = selectedPositions.length - 1; i > index; i--) {
        const [r, c] = selectedPositions[i].split(",").map(Number);
        const cellToDeselect = document.querySelector(
          `.grid div[data-row="${r}"][data-col="${c}"]`
        );
        cellToDeselect.classList.remove("selected");
      }

      selectedPositions = selectedPositions.slice(0, index + 1);
      selectedLetters = selectedLetters.slice(0, index + 1);
      selectedNo = selectedNo.slice(0, index + 1);

      while (lines.length > index) {
        const line = lines.pop();
        if (line) line.remove();
      }
    } else {
      selectedLetters.push(cell.textContent[0]);
      selectedNo.push(cell.textContent[1]);
      selectedPositions.push(position);
      cell.classList.add("selected");
      const a= cell.querySelector("p.symbols");
      a.style.color="#ffffff"
      if (selectedPositions.length > 1) {
        drawLine(lastPosition, position);
      }
    }
  }

  async function processSelection(cell){
    if (selectedLetters.length >= minWordLength){
      const word = selectedLetters.join("");
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
        );
        const data = await response.json();
        if (data.title === "No Definitions Found") {
          messageElement.textContent = "Invalid Word!";
          messageElement.style.color = "red";
          selectedPositions.forEach((pos) => {
            const [row, col] = pos.split(",").map(Number);

            const newcell = document.querySelector(
              `.grid div[data-row="${row}"][data-col="${col}"]`
            );
            newcell.classList.add("wrong");
          });
          resetSelection();
        } else {
          if (!wordsFounded.includes(word)) {
            let toAdd=0;
            for(let i = 0; i < selectedNo.length ; i++) {
              toAdd += parseInt(selectedNo[i], 10);
            }
            wordsFounded.push(word);
            score += toAdd;
            updateTemp(toAdd);
            scoreElement.textContent = score;
            messageElement.textContent = "Good Job!";
            messageElement.style.color = "green";
            // noWordsElement.style.display = "none";

            selectedPositions.forEach((pos) => {
              const [row, col] = pos.split(",").map(Number);
              const newcell = document.querySelector(
                `.grid div[data-row="${row}"][data-col="${col}"]`
              );
              newcell.classList.add("correct");
            });

            if (word.length > 4) {
              popOutMessage.classList.add("show");
            }
          } else {
            selectedPositions.forEach((pos) => {
              const [row, col] = pos.split(",").map(Number);
              const newcell = document.querySelector(
                `.grid div[data-row="${row}"][data-col="${col}"]`
              );
              newcell.classList.add("again");
            });
            messageElement.textContent = "Already Founded!";
            messageElement.style.color = "Yellow";
          }
          resetSelection();
        }
      } catch (error) {
        console.error("Something wrong Happened", error);
        resetSelection();
      }
    } else {
      messageElement.textContent = "Invalid word!";
      messageElement.style.color = "red";
      resetSelection();
    }
  }

  function updateTemp(change) {
    // Display the change
    tempElement.textContent = (change >= 0 ? "+" : "") + change;
    tempElement.style.opacity = 1;

    // Animate the change
    setTimeout(() => {
      tempElement.style.opacity = 0;
    }, 1000);

    // Remove the change from display after 2 seconds
    setTimeout(() => {
      tempElement.textContent = "";
    }, 2100);
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

    const fromX = (fromRect.left + fromRect.width / 2);
    const fromY = fromRect.top + fromRect.height / 2;
    const toX = toRect.left + toRect.width / 2;
    const toY = toRect.top + toRect.height / 2;

    const line = document.createElement("div");
    line.classList.add("line");
    document.body.appendChild(line);

    const length = Math.sqrt(
      Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2)
    );
    const angle = (Math.atan2(toY - fromY, toX - fromX) * 180)/ Math.PI;

    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.top = `${fromY}px`;
    line.style.left = `${fromX+5}px`;

    lines.push(line);
  }

  // function showCircle(cell) {
  //   const rect = cell.getBoundingClientRect();
  //   circleElement.style.left = `${
  //     rect.left + rect.width / 2 - circleElement.offsetWidth / 2
  //   }px`;
  //   circleElement.style.top = `${
  //     rect.top + rect.height / 2 - circleElement.offsetHeight / 2
  //   }px`;
  //   circleElement.textContent = cell.textContent[0];
  //   circleElement.style.display = "flex";
  // }

  // function hideCircle() {
  //   circleElement.style.display = "none";
  // }

  function resetSelection() {
    selectedLetters = [];
    selectedNo = [];
    selectedPositions = [];
    const cells = document.querySelectorAll(".grid div");
    cells.forEach((cell) => {
      const a= cell.querySelector("p.symbols");
      a.style.color=""
      cell.classList.remove("selected");
      cell.style.backgroundColor = ""; // Reset to the original background color
    });

    lines.forEach((line) => line.remove());
    lines.length = 0;

    setTimeout(() => {
      cells.forEach((cell) => {
        cell.classList.remove("wrong");
        cell.classList.remove("correct");
        cell.classList.remove("again");
        messageElement.textContent = "";
        popOutMessage.classList.remove("show");
      });
    }, 2500);
  }
});


// const wordsList = ["MID","GAME", "GRID", "TABLE", "PLAY", "LOSE", "DOES", "LOSER","FEAR", "BEAR","FEES","TRIM","RIDE"]; // Example word list
// const gridLetters = [
//     ['G', 'A', 'I', 'K', 'L'],
//     ['T', 'R', 'M', 'D', 'O'],
//     ['A', 'N', 'F', 'E', 'S'],
//     ['S', 'B', 'E', 'R', 'E'],
//     ['P', 'L', 'A', 'Y', 'R']
// ];
// let selectedLetters = [];
// let selectedPositions = [];
// let score = 0;
// const minWordLength = 3;
// let isMouseDown = false;
// let isTouching = false;
// let gameCompleted = false;  // Flag to track game completion status
// const lines = [];
// let wordsFounded=[];
// const maxScore = wordsList.reduce((acc, word) => acc + word.length, 0); // Maximum possible score
// let circleElement;

// document.addEventListener("DOMContentLoaded", () => {
//     const gridElement = document.getElementById("grid");
//     const noWordsElement = document.getElementById("no-words");
//     const scoreElement = document.getElementById("score");
//     const messageElement = document.getElementById("message");
    

//     // Initialize grid
//     for (let row = 0; row < gridLetters.length; row++) {
//         for (let col = 0; col < gridLetters[row].length; col++) {
//             const cell = document.createElement("div");
//             cell.textContent = gridLetters[row][col];
//             cell.dataset.row = row;
//             cell.dataset.col = col;
//             cell.addEventListener("mousedown", (event) => handleMouseDown(event, row, col, cell));
//             cell.addEventListener("mouseover", (event) => handleMouseOver(event, row, col, cell));
//             cell.addEventListener("mouseup", handleMouseUp);
//             cell.addEventListener("touchstart", (event) => handleTouchStart(event, row, col, cell));
//             cell.addEventListener("touchmove", (event) => handleTouchMove(event));
//             cell.addEventListener("touchend", handleTouchEnd);
//             gridElement.appendChild(cell);
//         }
//     }

//     // Create and append the circle element
//     circleElement = document.createElement("div");
//     circleElement.classList.add("circle");
//     circleElement.style.display = "none";
//     document.body.appendChild(circleElement);

//     function handleMouseDown(event, row, col, cell) {
//         if (gameCompleted) {
//             alert("Game completed! Restart to play again.");
//             return;
//         }
//         isMouseDown = true;
//         resetSelection();
//         handleCellClick(row, col, cell);
//         showCircle(cell);  // Show circle on first click
//     }

//     function handleMouseOver(event, row, col, cell) {
//         if (isMouseDown) {
//             handleCellClick(row, col, cell);
//             showCircle(cell);  // Show circle while dragging
//         }
//     }

//     function handleMouseUp() {
//         if (gameCompleted) {
//             return;
//         }
//         isMouseDown = false;
//         hideCircle();  // Hide circle on mouse up
//         processSelection();
//     }

//     function handleTouchStart(event, row, col, cell) {
//         event.preventDefault();  // Prevent default touch behavior
//         if (gameCompleted) {
//             alert("Game completed! Restart to play again.");
//             return;
//         }
//         isTouching = true;
//         resetSelection();
//         handleCellClick(row, col, cell);
//         showCircle(cell);  // Show circle on first touch
//     }

//     function handleTouchMove(event) {
//         event.preventDefault();  // Prevent default touch behavior
//         if (isTouching) {
//             const touch = event.touches[0];
//             const element = document.elementFromPoint(touch.clientX, touch.clientY);
//             if (element && element.dataset.row && element.dataset.col) {
//                 const row = parseInt(element.dataset.row);
//                 const col = parseInt(element.dataset.col);
//                 handleCellClick(row, col, element);
//                 showCircle(element);  // Show circle while dragging
//             }
//         }
//     }

//     function handleTouchEnd() {
//         if (gameCompleted) {
//             return;
//         }
//         isTouching = false;
//         hideCircle();  // Hide circle on touch end
//         processSelection();
//     }

//     function handleCellClick(row, col, cell) {
//         const position = `${row},${col}`;
//         const lastPosition = selectedPositions[selectedPositions.length - 1];

//         if (selectedPositions.length > 0 && !isAdjacent(lastPosition, position)) {
//             resetSelection();
//         }

//         if (!selectedPositions.includes(position)) {
//             selectedLetters.push(cell.textContent);
//             selectedPositions.push(position);
//             cell.classList.add("selected");
//             if (selectedPositions.length > 1) {
//                 drawLine(lastPosition, position);
//             }
//         }
//     }

//     async function processSelection() {
//         if (selectedLetters.length >= minWordLength) {
//             const word = selectedLetters.join('');
//             try {
//                 const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
//                 const data = await response.json();
//                 if (data.title === "No Definitions Found") {
//                     messageElement.textContent = "Invalid Word!";
//                     messageElement.style.color = "red";
//                     resetSelection();
//                 } else {
//                     if (!wordsFounded.includes(word)) {
//                         wordsFounded.push(word);
//                     score += word.length;
//                     scoreElement.textContent = score;
//                     // updateScoreBar();
//                     messageElement.textContent = "Good Job!";
//                     messageElement.style.color="green";
//                     noWordsElement.style.display = "none"
//                     } else {
//                         alert("Word already found!");
//                     }
//                     resetSelection();
//                 }
//             } catch (error) {
//                 console.error('Something wrong Happened', error);
//                 resetSelection();
//             }
//         } else {
//             messageElement.textContent = "Invalid word!";
//             messageElement.style.color = "red";
//             resetSelection();
//         }
//     }

//     function isAdjacent(lastPosition, currentPosition) {
//         const [lastRow, lastCol] = lastPosition.split(',').map(Number);
//         const [currentRow, currentCol] = currentPosition.split(',').map(Number);

//         const rowDiff = Math.abs(lastRow - currentRow);
//         const colDiff = Math.abs(lastCol - currentCol);

//         return rowDiff <= 1 && colDiff <= 1;
//     }

//     function drawLine(fromPosition, toPosition) {
//         const [fromRow, fromCol] = fromPosition.split(',').map(Number);
//         const [toRow, toCol] = toPosition.split(',').map(Number);

//         const fromCell = document.querySelector(`.grid div[data-row="${fromRow}"][data-col="${fromCol}"]`);
//         const toCell = document.querySelector(`.grid div[data-row="${toRow}"][data-col="${toCol}"]`);

//         const fromRect = fromCell.getBoundingClientRect();
//         const toRect = toCell.getBoundingClientRect();

//         const fromX = fromRect.left + fromRect.width / 2;
//         const fromY = fromRect.top + fromRect.height / 2;
//         const toX = toRect.left + toRect.width / 2;
//         const toY = toRect.top + toRect.height / 2;

//         const line = document.createElement("div");
//         line.classList.add("line");
//         document.body.appendChild(line);

//         const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
//         const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;

//         line.style.width = `${length}px`;
//         line.style.transform = `rotate(${angle}deg)`;
//         line.style.top = `${fromY}px`;
//         line.style.left = `${fromX}px`;

//         lines.push(line);
//     }

//     function showCircle(cell) {
//         const rect = cell.getBoundingClientRect();
//         circleElement.style.left = `${rect.left + rect.width / 2 - circleElement.offsetWidth / 2}px`;
//         circleElement.style.top = `${rect.top + rect.height / 2 - circleElement.offsetHeight / 2}px`;
//         circleElement.textContent = cell.textContent;
//         circleElement.style.display = "flex";
//     }

//     function hideCircle() {
//         circleElement.style.display = "none";
//     }

//     function resetSelection() {
//         selectedLetters = [];
//         selectedPositions = [];
//         const cells = document.querySelectorAll(".grid div");
//         cells.forEach(cell => cell.classList.remove("selected"));
//         lines.forEach(line => line.remove());
//         lines.length = 0;
//     }

//     function validateWord(word) {
//         return wordsList.includes(word);
//     }
// });
