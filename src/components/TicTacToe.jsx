import React, { useState, useEffect } from "react";

export const TicTacToe = () => {
  const buttonArr = new Array(9).fill(null).map((_, index) => ({
    buttonId: index,
    buttonPosition: index,
    buttonValue: null,
  }));
  const [buttonState, setButtonState] = useState(buttonArr);
  const [isPlayer1, setIsPlayer1] = useState(true);
  const [clickCounter, setClickCounter] = useState(-1);
  const [isEndGame, setIsGameEnd] = useState(false);
  const [winner, setWinner] = useState(null);
  const checkWinner = (board) => {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let combination of winningCombinations) {
      let [a, b, c] = combination;
      if (
        board[a].buttonValue &&
        board[a].buttonValue === board[b].buttonValue &&
        board[a].buttonValue === board[c].buttonValue
      ) {
        setWinner(board[a].buttonValue);
        setIsGameEnd(true);
        return board[a].buttonValue;
      }
    }
    return null;
  };

  const handlePlay = (id) => {
    let playerSign = isPlayer1 ? "X" : "O";
    setButtonState((prevState) => {
      return prevState.map((eachButton) =>
        eachButton?.buttonId === id && eachButton.buttonValue === null
          ? { ...eachButton, buttonValue: playerSign }
          : eachButton
      );
    });
    if (clickCounter <= 7) {
      setIsPlayer1(!isPlayer1);
      setClickCounter((prevState) => prevState + 1);
    }
  };

  const handleRestart = () => {
    setButtonState(buttonArr);
    setIsPlayer1(true);
    setClickCounter(-1);
    setIsGameEnd(false);
    setWinner(null);
  };

  useEffect(() => {
    if (clickCounter >= 8) {
      setIsGameEnd(true);
    }
    checkWinner(buttonState);
  }, [clickCounter]);

  return (
    <div className="game-container">
      {isEndGame ? (
        <>
          <p className="status-message">
            Game Over!!: {winner ? `Winner is ${winner}` : "its a Tie"}
          </p>
        </>
      ) : (
        <p className="status-message">
          {isPlayer1 ? 'Player "X" turn' : 'Player "O" turn'}
        </p>
      )}
      <div className="game-board">
        {[0, 3, 6].map((row) => (
          <div className="buttonContainer" key={row}>
            {buttonState.slice(row, row + 3).map((eachButton) => (
              <button
                className="gameButton"
                key={eachButton?.buttonId}
                onClick={() => handlePlay(eachButton.buttonId)}
                disabled={eachButton.buttonValue !== null || isEndGame}
                data-value={eachButton.buttonValue}
              >
                {eachButton.buttonValue}
              </button>
            ))}
          </div>
        ))}
      </div>
      {isEndGame && (
        <button className="restartButton" onClick={handleRestart}>
          Restart Game
        </button>
      )}
    </div>
  );
};
