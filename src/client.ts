import { Client as ColyseusClient, Room } from "colyseus.js";

// a wrapper around colyseus' client / websocket
export interface Client {
  /**
   * returns true iff the clien is currently connected to a room
   */
  isConnected: () => boolean;
  /**
   * sends the given redux action to the room
   */
  sendAction: (action: any) => void;
  /**
   * connects to a room with the given name
   */
  connect: (roomName: string) => Promise<void>;
  /**
   * disconnects from the current room, if possible
   */
  disconnect: () => Promise<void>;
  /**
   * registers the given callback to be called when the remote state changes
   */
  subscribe: (callback: (newState: any) => void) => () => void;
}

/**
 * returns a wrapper for the given colyseus client instance
 * @param remote
 */
const createClient = (remote: ColyseusClient): Client => {
  /**
   * indicates the room currently connected room
   */
  let currentRoom: Room | null;

  /**
   * a list of currently registered subscriptions for remote state change
   */
  const callbacks: Array<((payload: any) => void) | null> = [];

  /**
   * sets the current room to the one passed, and sets up event listeners
   * @param room
   */
  const setRoom = (room: Room) => {
    currentRoom = room;

    // handle a socket disconnection
    room.connection.ws.addEventListener("close", () => {
      currentRoom = null;
    });

    // call all callbacks currently registered when the state changes
    room.onStateChange((newState: any) => {
      // skip unregistered (null) callbacks
      callbacks.filter((_) => _).forEach((callback) => callback!(newState));
    });

    // when leaving, reset the connection state indicator
    room.onLeave(unsetRoom);
  };

  const unsetRoom = () => (currentRoom = null);

  return {
    connect: (roomName: string) =>
      remote.joinOrCreate(roomName, { foo: "bar" }).then(setRoom),
    disconnect: () =>
      new Promise((resolve) => {
        if (currentRoom !== null) {
          currentRoom.onLeave(() => {
            currentRoom = null;
            resolve();
          });
          currentRoom.leave();
        } else {
          resolve();
        }
      }),
    sendAction: (action: any) => {
      if (currentRoom !== null) {
        currentRoom.send("action", action);
      }
    },
    subscribe: (callback: (payload: any) => void): (() => void) => {
      const position = callbacks.push(callback);
      return () => {
        // @todo re-implement with tests
        // callbacks[position - 1] = null;
      };
    },
    isConnected: () => currentRoom !== null,
  };
};

export default createClient;
