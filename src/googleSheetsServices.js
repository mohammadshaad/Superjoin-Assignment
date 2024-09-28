const { google } = require("googleapis");
const path = require("path");
require("dotenv").config();

// Initialize the service account client
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../service.json"), // Update path to your JSON key file
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Function to get data from a Google Sheet
async function readSheetData(spreadsheetId, range) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values;
  } catch (error) {
    console.error("Error reading sheet data:", error);
    throw error;
  }
}

// Function to append data to a Google Sheet
async function appendRows(spreadsheetId, range, values) {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error appending rows:", error);
    throw error;
  }
}

// Function to update data in a Google Sheet
async function updateSheetData(spreadsheetId, range, values) {
  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating sheet data:", error);
    throw error;
  }
}

// Function to clear data in a Google Sheet
async function clearSheetData(spreadsheetId, range) {
  try {
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });
    return response.data;
  } catch (error) {
    console.error("Error clearing sheet data:", error);
    throw error;
  }
}

module.exports = {
  readSheetData,
  appendRows,
  updateSheetData,
  clearSheetData,
};
