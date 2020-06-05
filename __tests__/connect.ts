import runServer from "../src/runServer";
import createClient from "../src/createClient";
import { Client as ColyseusClient } from "colyseus.js";
import { createStore } from "redux";

const exampleStoreFactory = () => createStore(() => ({}));
const testRoomName = "redux";

test("connect to a server", (done) => {
  const stopServer = runServer({
    port: 12567,
    connectedRooms: { [testRoomName]: { factory: exampleStoreFactory } },
  });
  const colyseusClient = new ColyseusClient("ws://localhost:12567");
  const client = createClient(colyseusClient);

  client.connect(testRoomName).then(() => {
    expect(client.isConnected()).toBe(true);
    stopServer().then(done);
  });
});

test("disconnect from a server", async (done) => {
  const stopServer = runServer({
    port: 12678,
    connectedRooms: { [testRoomName]: { factory: exampleStoreFactory } },
  });
  const colyseusClient = new ColyseusClient("ws://localhost:12678");
  const client = createClient(colyseusClient);

  await client.connect(testRoomName);
  expect(client.isConnected()).toBe(true);

  await client.disconnect();

  expect(client.isConnected()).toBe(false);

  stopServer().then(done);
});

test("disconnect when the server dies", async (done) => {
  const stopServer = runServer({
    port: 12679,
    connectedRooms: { [testRoomName]: { factory: exampleStoreFactory } },
  });
  const colyseusClient = new ColyseusClient("ws://localhost:12679");
  const client = createClient(colyseusClient);

  await client.connect(testRoomName);
  expect(client.isConnected()).toBe(true);

  await stopServer();

  setTimeout(() => {
    expect(client.isConnected()).toBe(false);
    done();
  }, 100);
});
