// src/websocketServer.js
require("dotenv").config();
const { WebSocketServer } = require("ws");
const { readSheetData } = require("./googleSheetsServices"); // Adjust the path as needed
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const wss = new WebSocketServer({ port: process.env.WS_PORT });

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

const POLLING_INTERVAL = 60000; // 1 minute
let lastKnownData = [];
let lastKnownETag = "";

const checkForChanges = async () => {
  try {
    const { data, etag } = await readSheetData(SPREADSHEET_ID, "A1:T502");

    if (etag !== lastKnownETag) {
      console.log("Data has changed.");
      lastKnownETag = etag;
      lastKnownData = data;
      broadcast({ type: "update", data });
    }
  } catch (error) {
    console.error("Error fetching sheet data:", error);
  }
};

setInterval(checkForChanges, POLLING_INTERVAL);

module.exports = { broadcast };
