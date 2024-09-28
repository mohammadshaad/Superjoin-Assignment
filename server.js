// server.js
const http = require("http");
const expressApp = require("./src/expressApp");
const { PORT } = require("./src/config");
const { updateDatabase, initializeDatabase } = require("./src/database");

// Create HTTP server and integrate Express app
const server = http.createServer(expressApp);

// Optionally, integrate WebSocket server with the same HTTP server
// This requires modifying websocketServer.js to accept an existing server

// Start the HTTP server
initializeDatabase()
  .then(() => {
    console.log("Database initialized successfully.");

    // Start the Express server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error initializing database:", error);
  });
