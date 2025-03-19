import { useEffect, useState, useCallback } from "react";
import "./App.css";
import { TicTacToe } from "./components/TicTacToe";
import Loader from "./components/Loader";
import axios from "axios";

const App = () => {
  const [isServerAwake, setIsServerAwake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkServer = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/health`
      );
      setIsServerAwake(response.data.status === "ok");
    } catch (error) {
      console.log("Server is not awake", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkServer();
  }, [checkServer]);

  if (isLoading) {
    return <Loader message="Server is not awake please wait..." />;
  }
  return (
    <>
      {isServerAwake ? (
        <>
          <h1>Tic-Tac-Toe</h1>
          <TicTacToe />
        </>
      ) : (
        <p className="server-down">Server is down. Please try again later!</p>
      )}
    </>
  );
};

export default App;
