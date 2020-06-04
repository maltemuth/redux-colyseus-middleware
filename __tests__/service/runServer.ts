import http from "http";
import express from "express";
import cors from "cors";
import { Room, Server } from "colyseus";

class ReduxRoom extends Room {
  onCreate() {
    this.setState({});

    this.onMessage("action", (_, { payload }) => {
      this.state = payload;
    });
  }
}

const runServer = (port: number): (() => Promise<void>) => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);
  const gameServer = new Server({
    server,
  });

  gameServer.define("redux", ReduxRoom);

  gameServer.listen(port);

  return (alsoExitProcess = false) =>
    gameServer.gracefullyShutdown(alsoExitProcess);
};

export default runServer;
