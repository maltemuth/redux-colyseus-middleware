import runServer from "../../src/runServer";

runServer({ port: parseInt(process.env.PORT || "2567", 10) });
