import createConnectedStore, {
  REMOTE_STATE_UPDATE,
} from "../src/createConnectedStore";
import createClient from "../src/client";
import { Client as ColyseusClient } from "colyseus.js";
import runServer from "./service/runServer";
import { Store } from "redux";

let stopServer: () => Promise<void>;
let store: Store;

beforeAll(async (done) => {
  stopServer = runServer(22567);
  const colyseusClient = new ColyseusClient("ws://localhost:22567");
  const client = createClient(colyseusClient);
  store = createConnectedStore(client, (_ = {}) => _);
  await client.connect("redux");
  done();
});

test("initial state is empty", () => {
  expect(store.getState()).toEqual({});
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
