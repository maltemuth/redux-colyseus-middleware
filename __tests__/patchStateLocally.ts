import { createStore } from "redux";
import runServer from "../src/runServer";
import { Client as ColyseusClient } from "colyseus.js";
import createConnectedStore from "../src/createConnectedStore";
import createClient from "../src/createClient";

const factory = () =>
  createStore((state = {}, action) => {
    if ((action as { payload?: any }).payload)
      return (action as { payload?: any }).payload;
    return state;
  });
const stopServer = runServer({
  port: 33334,
  connectedRooms: { redux: { factory } },
});
const client = createClient(new ColyseusClient("ws://localhost:33334"));
const store = createConnectedStore(
  client,
  (_ = {}) => _,
  [],
  (local, remote) => Object.assign({}, local, { remote })
);

test("clients patch state", async (done) => {
  await client.connect("redux");

  store.dispatch({
    type: "foo",
    _remote: true,
    payload: { from: "first" },
  });

  setTimeout(() => {
    expect(store.getState()).toEqual({ remote: { from: "first" } });
    done();
  }, 100);
});

afterAll(async (done) => {
  await stopServer();

  done();
});
