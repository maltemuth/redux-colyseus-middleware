import runServer from "./service/runServer";
import createClient from "../src/client";
import { Client as ColyseusClient } from "colyseus.js";

test("connect to a server", (done) => {
  const stopServer = runServer(12567);
  const colyseusClient = new ColyseusClient("ws://localhost:12567");
  const client = createClient(colyseusClient);

  client.connect("redux").then(() => {
    expect(client.isConnected()).toBe(true);
    stopServer().then(done);
  });
});

test("disconnect from a server", async (done) => {
  const stopServer = runServer(12678);
  const colyseusClient = new ColyseusClient("ws://localhost:12678");
  const client = createClient(colyseusClient);

  await client.connect("redux");
  expect(client.isConnected()).toBe(true);

  await client.disconnect();

  expect(client.isConnected()).toBe(false);

  stopServer().then(done);
});

test("disconnect when the server dies", async (done) => {
  const stopServer = runServer(12679);
  const colyseusClient = new ColyseusClient("ws://localhost:12679");
  const client = createClient(colyseusClient);

  await client.connect("redux");
  expect(client.isConnected()).toBe(true);

  await stopServer();

  setTimeout(() => {
    expect(client.isConnected()).toBe(false);
    done();
  }, 100);
});
