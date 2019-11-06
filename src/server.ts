import express from "express";
import { createServer } from "http";
import WebSocket from "ws";

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

const app = express();

// initialize a simple http server
const server = createServer(app);

// intialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws: ExtWebSocket) => {
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  // connection is up, let's add a simple event
  ws.on("message", (message: string) => {
    // log the received message and send it back to the client
    console.log(`received: ${message}`);

    const broadcastRegex = /^broadcast\:/;

    if (broadcastRegex.test(message)) {
      message = message.replace(broadcastRegex, "");

      // send back the message to the other clients
      wss.clients.forEach(client => {
        if (client != ws) {
          client.send(`Hello, broadcast message -> ${message}`);
        }
      });
    } else {
      ws.send(`Hello, you sent -> ${message}`);
    }
  });

  // send immediatly a feedback to the incoming connection
  ws.send("Hi there, I am a WebSocket server.");
});

setInterval(() => {
  wss.clients.forEach((ws: WebSocket) => {
    const extWs = ws as ExtWebSocket;

    if (!extWs.isAlive) return extWs.terminate();

    extWs.isAlive = false;
    extWs.ping(null, undefined);
  });
}, 10000);

// start our server
const PORT = process.env.PORT || 8999;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
