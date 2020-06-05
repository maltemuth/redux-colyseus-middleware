import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { createStore } from "redux";
import createConnectedRoomHandler, {
  StoreFactory,
} from "./createConnectedRoomHandler";

const runServer = ({
  port,
  connectedRoomName = "redux",
  storeFactory = () => createStore((_ = {}) => _),
}: {
  port: number;
  connectedRoomName?: string;
  storeFactory?: StoreFactory;
}): (() => Promise<void>) => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);
  const gameServer = new Server({
    server,
  });

  gameServer.define(
    connectedRoomName,
    createConnectedRoomHandler(storeFactory)
  );

  gameServer.listen(port);

  return (alsoExitProcess = false) =>
    gameServer.gracefullyShutdown(alsoExitProcess);
};

export default runServer;
