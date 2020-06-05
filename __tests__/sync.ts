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
  port: 33333,
  connectedRooms: { redux: { factory } },
});
const firstClient = createClient(new ColyseusClient("ws://localhost:33333"));
const firstStore = createConnectedStore(firstClient, (_ = {}) => _);

const secondClient = createClient(new ColyseusClient("ws://localhost:33333"));
const secondStore = createConnectedStore(secondClient, (_ = {}) => _);

test("clients sync state", async (done) => {
  await firstClient.connect("redux");
  await secondClient.connect("redux");

  firstStore.dispatch({
    type: "foo",
    _remote: true,
    payload: { from: "first" },
  });

  setTimeout(() => {
    expect(firstStore.getState()).toEqual({ from: "first" });
    expect(secondStore.getState()).toEqual({ from: "first" });
    done();
  }, 100);
});

afterAll(async (done) => {
  await stopServer();

  done();
});
