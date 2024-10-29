import React, { useState, useEffect } from "react";

const symbols = ["*", "X", "O", "Δ"];
const boardSize = 8; // 8x8 board
const MAX_MOVES = 20; // Maximum number of moves
const TARGET_SCORE = 100; // Target score
const TIMER_DURATION = 60; // Timer duration in seconds

function generateBoard() {
  return Array.from({ length: boardSize }, () =>
    Array.from(
      { length: boardSize },
      () => symbols[Math.floor(Math.random() * symbols.length)]
    )
  );
}

function checkMatches(board) {
  const matches = [];

  // Check horizontal matches
  for (let row = 0; row < boardSize; row++) {
    let matchLength = 1;
    for (let col = 1; col < boardSize; col++) {
      if (board[row][col] === board[row][col - 1]) {
        matchLength++;
      } else {
        if (matchLength === 5) {
          const bombIndex = col - Math.floor(matchLength / 2);
          matches.push({ row, col: bombIndex, isBomb: true });
        } else if (matchLength === 6) {
          const lightningIndex = col - Math.floor(matchLength / 2);
          matches.push({ row, col: lightningIndex, isLightning: true }); // Lightning symbol
        } else if (matchLength >= 3 || matchLength >= 4) {
          for (let k = 0; k < matchLength; k++) {
            matches.push({ row, col: col - 1 - k });
          }
        }
        matchLength = 1;
      }
    }
    if (matchLength === 5) {
      const bombIndex = boardSize - 1 - Math.floor(matchLength / 2);
      matches.push({ row, col: bombIndex, isBomb: true });
    } else if (matchLength === 6) {
      const lightningIndex = boardSize - 1 - Math.floor(matchLength / 2);
      matches.push({ row, col: lightningIndex, isLightning: true }); // Lightning symbol
    } else if (matchLength >= 3 || matchLength >= 4) {
      for (let k = 0; k < matchLength; k++) {
        matches.push({ row, col: boardSize - 1 - k });
      }
    }
  }

  // Check vertical matches
  for (let col = 0; col < boardSize; col++) {
    let matchLength = 1;
    for (let row = 1; row < boardSize; row++) {
      if (board[row][col] === board[row - 1][col]) {
        matchLength++;
      } else {
        if (matchLength === 5) {
          const bombIndex = row - Math.floor(matchLength / 2);
          matches.push({ row: bombIndex, col, isBomb: true });
        } else if (matchLength === 6) {
          const lightningIndex = row - Math.floor(matchLength / 2);
          matches.push({ row: lightningIndex, col, isLightning: true }); // Lightning symbol
        } else if (matchLength >= 3 || matchLength >= 4) {
          for (let k = 0; k < matchLength; k++) {
            matches.push({ row: row - 1 - k, col });
          }
        }
        matchLength = 1;
      }
    }

    if (matchLength === 5) {
      const bombIndex = boardSize - 1 - Math.floor(matchLength / 2);
      matches.push({ row: bombIndex, col, isBomb: true });
    } else if (matchLength === 6) {
      const lightningIndex = boardSize - 1 - Math.floor(matchLength / 2);
      matches.push({ row: lightningIndex, col, isLightning: true }); // Lightning symbol
    } else if (matchLength >= 3 || matchLength >= 4) {
      for (let k = 0; k < matchLength; k++) {
        matches.push({ row: boardSize - 1 - k, col });
      }
    }
  }
  return matches;
}

function clearMatches(board, matches) {
  const newBoard = board.map((row) => [...row]);
  matches.forEach(({ row, col, isBomb, isLightning }) => {
    if (isBomb) {
      newBoard[row][col] = "💣"; // Set "💣" for bombs
    } else if (isLightning) {
      newBoard[row][col] = "⚡"; // Set "⚡" for lightning
    } else {
      newBoard[row][col] = null; // Clear the matched cell
    }
  });
  return newBoard;
}

function dropSymbols(board) {
  const newBoard = [...board];
  for (let col = 0; col < boardSize; col++) {
    let emptyRow = boardSize - 1;
    for (let row = boardSize - 1; row >= 0; row--) {
      if (newBoard[row][col] !== null) {
        newBoard[emptyRow][col] = newBoard[row][col];
        if (emptyRow !== row) {
          newBoard[row][col] = null;
        }
        emptyRow--;
      }
    }
  }
  return newBoard;
}

function refillBoard(board) {
  return board.map((row) =>
    row.map((cell) =>
      cell === null ? symbols[Math.floor(Math.random() * symbols.length)] : cell
    )
  );
}

function removeRandomPieces(board, count) {
  const newBoard = [...board];
  const emptyCells = [];

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (newBoard[row][col] !== null) {
        emptyCells.push({ row, col });
      }
    }
  }

  // Shuffle the emptyCells array and select the first 'count' cells
  for (let i = emptyCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
  }

  const cellsToRemove = emptyCells.slice(0, count);

  cellsToRemove.forEach(({ row, col }) => {
    newBoard[row][col] = null; // Clear the selected cells
  });

  return newBoard;
}

export default function Game({ updateStats }) {
  const [board, setBoard] = useState(generateBoard());
  const [moves, setMoves] = useState(0);
  const [points, setPoints] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [boosterCount, setBoosterCount] = useState(3); // Start with 3 boosters
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION); // Timer state

  useEffect(() => {
    let initialBoard = generateBoard();
    let initialMatches = checkMatches(initialBoard);

    while (initialMatches.length > 0) {
      initialBoard = clearMatches(initialBoard, initialMatches);
      initialBoard = dropSymbols(initialBoard);
      initialBoard = refillBoard(initialBoard);
      initialMatches = checkMatches(initialBoard);
    }

    setBoard(initialBoard);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timerId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timerId);
    } else if (timeLeft === 0) {
      setGameOver(true); // Set game over when time runs out
    }
  }, [timeLeft, gameOver]);

  const handleCellClick = (row, col) => {
    if (selectedCell === null && !gameOver) {
      setSelectedCell({ row, col });
    } else if (!gameOver) {
      const newBoard = [...board];
      const { row: prevRow, col: prevCol } = selectedCell;

      if (newBoard[row][col] === "💣") {
        activateBombEffect(newBoard, row, col);
      } else if (newBoard[row][col] === "⚡") {
        activateLightningEffect(newBoard, row, col);
      } else {
        [newBoard[prevRow][prevCol], newBoard[row][col]] = [
          newBoard[row][col],
          newBoard[prevRow][prevCol],
        ];
      }

      setBoard(newBoard);
      setSelectedCell(null);
      const newMoves = moves + 1;
      setMoves(newMoves);

      handleMatches(newBoard);

      if (newMoves >= MAX_MOVES) {
        setGameOver(true);
      }

      if (typeof updateStats === "function") {
        updateStats(newMoves, points);
      }
    }
  };

  const handleMatches = (currentBoard) => {
    const matches = checkMatches(currentBoard);

    if (matches.length > 0) {
      const clearedBoard = clearMatches(currentBoard, matches);
      const droppedBoard = dropSymbols(clearedBoard);
      const refilledBoard = refillBoard(droppedBoard);

      setBoard(refilledBoard);
      setPoints((prevPoints) => prevPoints + matches.length);
      return true;
    }
    return false;
  };

  const activateBoosterEffect = () => {
    if (boosterCount > 0) {
      setBoosterCount(boosterCount - 1);
      const newBoard = removeRandomPieces(board, 12);
      setBoard(newBoard);
    }
  };

  const activateBombEffect = (currentBoard, row, col) => {
    const bombCells = []; // Store the cells to be removed

    // Get the A shape of cells to remove
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
          bombCells.push({ row: r, col: c });
        }
      }
    }

    const newBoard = [...currentBoard];
    bombCells.forEach(({ row, col }) => {
      newBoard[row][col] = null; // Clear the cells in 'A' shape
    });

    setBoard(newBoard);
  };

  const activateLightningEffect = (currentBoard, row, col) => {
    const newBoard = removeRandomPieces(currentBoard, 12);
    setBoard(newBoard);
  };

  return (
    <div>
      <h1>Match Master Game</h1>
      <p>Moves: {moves}</p>
      <p>Points: {points}</p>
      <p>Boosters Left: {boosterCount}</p> {/* Show booster count */}
      <p>Time Left: {timeLeft} seconds</p> {/* Show timer */}
      <button onClick={activateBoosterEffect} disabled={boosterCount <= 0}>
        Use Booster
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${boardSize}, 50px)`,
          gap: "5px",
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: cell ? "#ccc" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #000",
                cursor: "pointer",
                fontSize: "24px",
              }}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      {gameOver && <h2>Game Over!</h2>}
    </div>
  );
}
