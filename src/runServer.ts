import http from "http";
import express from "express";
import cors from "cors";
import { Server, Room } from "colyseus";
import createConnectedRoomHandler, {
  StoreFactory,
} from "./createConnectedRoomHandler";

export type ConnectedRoomOptions = {
  [roomName: string]: { factory: StoreFactory; options?: any };
};

export type RoomOptions = {
  [roomName: string]: { handler: { new (): Room }; options?: any };
};

const runServer = ({
  port,
  connectedRooms,
  rooms = {},
}: {
  port: number;
  connectedRooms: ConnectedRoomOptions;
  rooms?: RoomOptions;
}): (() => Promise<void>) => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);
  const gameServer = new Server({
    server,
  });

  Object.keys(connectedRooms).forEach((roomName) => {
    const { factory, options } = connectedRooms[roomName];

    gameServer.define(
      roomName,
      createConnectedRoomHandler(factory),
      options || {}
    );
  });

  Object.keys(rooms).forEach((roomName) => {
    const { handler, options } = rooms[roomName];

    gameServer.define(roomName, handler, options || {});
  });

  gameServer.listen(port);

  return (alsoExitProcess = false) =>
    gameServer.gracefullyShutdown(alsoExitProcess);
};

export default runServer;
