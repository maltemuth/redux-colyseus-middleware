import createConnectedStore, {
  REMOTE_STATE_UPDATE,
} from "../src/createConnectedStore";
import createClient from "../src/createClient";
import { Client as ColyseusClient } from "colyseus.js";
import runServer from "../src/runServer";
import { Store, createStore } from "redux";

let stopServer: () => Promise<void>;
let store: Store;
const createExampleStore = () =>
  createStore((state = { initial: "example" }, action) => {
    if ((action as { payload?: any }).payload)
      return (action as { payload?: any }).payload;
    return state;
  });

beforeAll(async (done) => {
  const colyseusClient = new ColyseusClient("ws://localhost:22567");
  const client = createClient(colyseusClient);
  store = createConnectedStore(client, (_ = {}) => _);
  stopServer = runServer({
    port: 22567,
    connectedRooms: { redux: { factory: createExampleStore } },
  });
  await client.connect("redux");
  setTimeout(done, 100);
});

test("initial state is synchronized after joining", () => {
  expect(store.getState()).toEqual({ initial: "example" });
});

test("action changes state", (done) => {
  store.dispatch({
    type: REMOTE_STATE_UPDATE,
    _remote: true,
    payload: { foo: "bar" },
  });

  setTimeout(() => {
    expect(store.getState()).toEqual({ foo: "bar" });
    done();
  }, 60);
});

afterAll(async (done) => {
  await stopServer();
  done();
});
