import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SERVER_URL, {
  withCredentials: true,
  transports: ["websocket"],
  cors: {
    origin: import.meta.env.VITE_CLIENT_URL,
  },
});

const INITIAL_BOARD = new Array(9).fill(null).map((_, index) => ({
  buttonId: index,
  buttonPosition: index,
  buttonValue: null,
}));

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
export const TicTacToe = () => {
  const [buttonState, setButtonState] = useState(INITIAL_BOARD);
  // eslint-disable-next-line no-unused-vars
  const [isPlayer1, setIsPlayer1] = useState(true);
  const [clickCounter, setClickCounter] = useState(-1);
  const [isEndGame, setIsGameEnd] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameStatus, setGameStatus] = useState("waiting");

  const resetGameState = () => {
    setButtonState(INITIAL_BOARD);
    setIsPlayer1(true);
    setClickCounter(-1);
    setIsGameEnd(false);
    setWinner(null);
    setWinningCells([]);
    setIsMyTurn(playerNumber === 1);
    setGameStatus("playing");
  };

  useEffect(() => {
    socket.on("roomCreated", ({ roomId, playerNumber }) => {
      setRoomId(roomId);
      setPlayerNumber(playerNumber);
      setGameStatus("waiting for opponent");
      setClickCounter(-1);
    });

    socket.on("roomJoined", ({ roomId, playerNumber }) => {
      setRoomId(roomId);
      setPlayerNumber(playerNumber);
      setClickCounter(-1);
    });

    socket.on("gameStart", () => {
      setGameStatus("playing");
      setIsMyTurn(playerNumber === 1);
      setClickCounter(-1);
    });

    socket.on("moveMade", (move) => {
      updateGameState(move);
      setIsMyTurn(move.playerNumber !== playerNumber);
    });

    socket.on("gameRestarted", () => {
      resetGameState();
    });

    socket.on("playerDisconnected", () => {
      setGameStatus("opponent disconnected");
      setIsGameEnd(true);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("gameStart");
      socket.off("moveMade");
      socket.off("gameRestarted");
      socket.off("playerDisconnected");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerNumber, isEndGame]);

  const createRoom = () => {
    socket.emit("createRoom");
  };

  const joinRoom = (roomId) => {
    socket.emit("joinRoom", roomId);
  };

  const handlePlay = useCallback(
    (id) => {
      if (!isMyTurn || isEndGame) return;

      const playerSign = playerNumber === 1 ? "X" : "O";
      const move = {
        id,
        playerSign,
        playerNumber,
        moveNumber: clickCounter + 1,
      };

      socket.emit("makeMove", { roomId, move });
      updateGameState(move);
      setIsMyTurn(false);
    },
    [isMyTurn, isEndGame, playerNumber, clickCounter, roomId]
  );

  const updateGameState = (move) => {
    setButtonState((prevState) => {
      return prevState.map((eachButton) =>
        eachButton?.buttonId === move.id && eachButton.buttonValue === null
          ? { ...eachButton, buttonValue: move.playerSign }
          : eachButton
      );
    });
    setClickCounter(move.moveNumber);
  };

  const handleRestart = () => {
    socket.emit("restartGame", { roomId });
    resetGameState();
  };

  const checkWinner = (board) => {
    for (let combination of WINNING_COMBINATIONS) {
      let [a, b, c] = combination;
      if (
        board[a].buttonValue &&
        board[a].buttonValue === board[b].buttonValue &&
        board[a].buttonValue === board[c].buttonValue
      ) {
        setWinner(board[a].buttonValue);
        setWinningCells(combination);
        setIsGameEnd(true);
        return true;
      }
    }
    return false;
  };

  const handleCopyRoomId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy room ID:", err);
    }
  }, [roomId]);
  useEffect(() => {
    if (clickCounter >= 0) {
      const hasWinner = checkWinner(buttonState);

      if (!hasWinner && clickCounter === 8) {
        setIsGameEnd(true);
        setWinner(null);
      }
    }
  }, [clickCounter, buttonState]);

  // useEffect(() => {
  //   console.log("Move counter:", clickCounter);
  // }, [clickCounter]);

  return (
    <div className="game-container">
      {gameStatus === "waiting" && (
        <div className="room-controls">
          <button className="create-room-btn" onClick={createRoom}>
            Create New Game
          </button>
          <span>or</span>
          <div className="join-room-container">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
            />
            <button onClick={() => joinRoom(joinRoomId)}>Join Game</button>
          </div>
        </div>
      )}

      {gameStatus === "waiting for opponent" && (
        <div className="room-info">
          <h2>Waiting for opponent...</h2>
          <div className="room-id-container">
            <p>Share this Room ID with your friend:</p>
            <div className="room-id-box">
              <span>{roomId}</span>
              <button className="copy-button" onClick={handleCopyRoomId}>
                {copySuccess ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {gameStatus === "playing" && (
        <>
          <p className={`status-message ${winner ? "winner-message" : ""}`}>
            {isEndGame ? (
              winner ? (
                `Game Over! ${
                  winner === (playerNumber === 1 ? "X" : "O")
                    ? "You won!"
                    : "Opponent won!"
                }`
              ) : (
                "Game Over! It's a Tie!"
              )
            ) : (
              <>
                <strong>
                  You are Player {playerNumber} (
                  {playerNumber === 1 ? "X" : "O"})
                </strong>
                <br />
                {isMyTurn ? "Your turn" : "Opponent's turn"}
              </>
            )}
          </p>

          <GameBoard
            buttonState={buttonState}
            winningCells={winningCells}
            handlePlay={handlePlay}
            isMyTurn={isMyTurn}
            isEndGame={isEndGame}
          />

          {isEndGame && (
            <button className="restartButton" onClick={handleRestart}>
              Restart Game
            </button>
          )}
        </>
      )}

      {gameStatus === "opponent disconnected" && (
        <p className="status-message">Opponent disconnected</p>
      )}
    </div>
  );
};

const GameBoard = React.memo(
  ({ buttonState, winningCells, handlePlay, isMyTurn, isEndGame }) => (
    <div className="game-board">
      {[0, 3, 6].map((row) => (
        <div className="buttonContainer" key={row}>
          {buttonState.slice(row, row + 3).map((eachButton) => (
            <button
              className={`gameButton ${
                winningCells.includes(eachButton.buttonId) ? "winner" : ""
              }`}
              key={eachButton?.buttonId}
              onClick={() => handlePlay(eachButton.buttonId)}
              disabled={
                !isMyTurn || eachButton.buttonValue !== null || isEndGame
              }
              data-value={eachButton.buttonValue}
            >
              {eachButton.buttonValue}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
);
