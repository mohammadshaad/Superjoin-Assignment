const express = require("express");
const cors = require("cors");
const axios = require("axios");
const {
  readSheetData,
  appendRows,
  updateSheetData,
  clearSheetData,
} = require("./googleSheetsServices"); // Adjust the path as needed
const {
  getConnection,
  fetchRecentChanges,
  pushDataToGoogleSheets,
} = require("./database");

const spreadsheetId = process.env.SPREADSHEET_ID;

const expressApp = express();

// CORS configuration
expressApp.use(
  cors({
    origin: "*", // Allow all origins or specify allowed origins here
  })
);

expressApp.use(express.json()); // To parse JSON requests

const fetch = require("node-fetch");

async function pollSyncEndpoint() {
  try {
    await fetch("http://localhost:3000/manual-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Manual sync triggered.");
  } catch (error) {
    console.error("Error polling sync endpoint:", error);
  }
}

// Poll every 5 minutes (300000 milliseconds)
setInterval(pollSyncEndpoint, 10000);

//sync from database to google sheets
expressApp.post("/manual-sync", async (req, res) => {
  try {
    // Fetch recent data from the database
    const connection = await getConnection();
    const [rows] = await connection.query("SELECT * FROM transactions");

    if (rows.length === 0) {
      return res.status(200).json({ message: "No data to sync." });
    }

    // Push data to Google Sheets
    await pushDataToGoogleSheets(rows);

    res.status(200).json({
      message: "Data successfully synced to Google Sheets.",
    });
  } catch (error) {
    console.error("Error syncing data to Google Sheets:", error);
    res.status(500).json({ message: "Failed to sync data to Google Sheets." });
  }
});

// Helper function to parse dates with fallback to current date
function parseDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date value (${dateStr}). Using current date.`);
    return new Date().toISOString().split("T")[0]; // Fallback to current date (YYYY-MM-DD)
  }
  return date.toISOString().split("T")[0];
}

let cachedData = null; // Cache for storing data
let lastFetchTime = new Date(); // Track the last fetch time

// Function to fetch the latest data every second
async function updateData() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query("SELECT * FROM transactions");
    cachedData = rows; // Update cache with new data
    lastFetchTime = new Date(); // Update the time of the last fetch
  } catch (error) {
    console.error("Error fetching data from MySQL:", error);
  }
}

// Set interval to update data every second (1000 ms)
setInterval(updateData, 5000);

// API route to get cached data
expressApp.get("/parabola/get-data", (req, res) => {
  if (cachedData) {
    return res.status(200).json(cachedData); // Serve cached data
  } else {
    return res
      .status(500)
      .json({ message: "No data available at the moment." });
  }
});

expressApp.post("/send-to-parabola", async (req, res) => {
  const { lastCheckTime } = req.body; // Provide a timestamp to get changes since last check

  try {
    // Fetch recent changes from MySQL database
    const recentChanges = await fetchRecentChanges(lastCheckTime);

    if (recentChanges.length === 0) {
      return res.status(200).json({ message: "No new changes to send." });
    }

    // Define Parabola endpoint URL
    const parabolaEndpoint = "https://api.parabola.io/v1/endpoint"; // Replace with your actual Parabola endpoint

    // Send the data to Parabola
    const response = await axios.post(
      parabolaEndpoint,
      {
        data: recentChanges,
      },
      {
        headers: {
          Authorization: `Bearer YOUR_PARABOLA_API_KEY`, // Replace with your API key
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({
      message: "Data successfully sent to Parabola.",
      response: response.data,
    });
  } catch (error) {
    console.error("Error sending data to Parabola:", error);
    res.status(500).json({ message: "Failed to send data to Parabola." });
  }
});

// Handle POST request from Google Apps Script
expressApp.post("/update-sheet-data", async (req, res) => {
  const { sheetName, range, values } = req.body;

  console.log("Received data from Google Sheets:", {
    sheetName,
    range,
    values: JSON.stringify(values, null, 2),
  });

  try {
    // Clear existing data in the table
    const connection = await getConnection();
    try {
      await connection.query("DELETE FROM transactions");
      console.log("Existing data deleted from the table.");

      // Skip header row and process data rows
      const [header, ...rows] = values;

      // Transform the data to match the database schema
      const transformedData = rows
        .map((row) => {
          try {
            return [
              row[0], // transaction_id
              parseFloat(row[1]), // amount
              row[2], // currency
              row[3], // payment_method
              parseDate(row[4]), // purchase_date, handle null dates properly
            ];
          } catch (error) {
            console.error(
              `Error processing row ${JSON.stringify(row)}:`,
              error
            );
            return null; // Skip invalid rows
          }
        })
        .filter((row) => row !== null); // Remove any invalid rows

      // Insert new data
      const insertQuery = `
        INSERT INTO transactions (transaction_id, amount, currency, payment_method, purchase_date)
        VALUES ?
        ON DUPLICATE KEY UPDATE
          amount = VALUES(amount),
          currency = VALUES(currency),
          payment_method = VALUES(payment_method),
          purchase_date = VALUES(purchase_date)
      `;

      if (transformedData.length > 0) {
        await connection.query(insertQuery, [transformedData]);
        console.log("Data inserted/updated in the table.");
      }

      res.status(200).send("Data successfully updated in the database.");
    } catch (error) {
      console.error("Error manipulating data in MySQL:", error);
      res.status(500).send("Failed to manipulate data in the database.");
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Error processing data:", error);
    res.status(500).send("Failed to process data.");
  }
});

// CRUD routes
expressApp.get("/get-sheet-data", async (req, res) => {
  try {
    // Fetch data from Google Sheets
    const sheetData = await readSheetData(spreadsheetId, "A1:T502");

    // Log the sheet data to confirm structure
    console.log("Sheet Data:", sheetData);

    // Ensure the data is in the expected format
    if (!Array.isArray(sheetData) || sheetData.length < 2) {
      throw new Error("Invalid data format from Google Sheets.");
    }

    res.status(200).json(sheetData);
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    res.status(500).json({ message: "Failed to fetch data." });
  }
});

expressApp.post("/append-data", async (req, res) => {
  const { values } = req.body; // Expecting { "values": [["NewValue1", "NewValue2"]] }
  try {
    const result = await appendRows(spreadsheetId, "Sheet1!A1", values);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error appending data:", error);
    res.status(500).send("Failed to append data.");
  }
});

expressApp.put("/update-data", async (req, res) => {
  const { range, values } = req.body; // Expecting { "range": "Sheet1!A1:B2", "values": [["UpdatedValue1", "UpdatedValue2"]] }
  try {
    const result = await updateSheetData(spreadsheetId, range, values);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).send("Failed to update data.");
  }
});

expressApp.get("/view-data", async (req, res) => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query("SELECT * FROM transactions");
    res.json(rows);
  } catch (error) {
    console.error("Error querying data:", error);
    res.status(500).send("Error querying data");
  } finally {
    await connection.end();
  }
});

expressApp.delete("/clear-data", async (req, res) => {
  const { range } = req.body; // Expecting { "range": "Sheet1!A1:C10" }
  try {
    const result = await clearSheetData(spreadsheetId, range);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error clearing data:", error);
    res.status(500).send("Failed to clear data.");
  }
});

module.exports = expressApp;
