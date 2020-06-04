import runServer from "./runServer";

runServer(
  parseInt(process.env.PORT || "2567", 10),
  !!process.env.USE_MONITOR || false
);
