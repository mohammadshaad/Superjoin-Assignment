const mysql = require("mysql2/promise");
const { google } = require("googleapis");
const fs = require("fs");
require("dotenv").config();
const fetch = require("node-fetch");
const path = require("path");

// Database Configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

/// Google Sheets API Initialization
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../service.json"), // Ensure correct path
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Function to get a connection to the database
async function getConnection() {
  return mysql.createConnection(dbConfig);
}

// Function to create the table
async function createTable() {
  const connection = await getConnection();
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id VARCHAR(255),
        amount DECIMAL(10, 2) DEFAULT NULL,      
        currency VARCHAR(255) DEFAULT NULL,        
        payment_method VARCHAR(255) DEFAULT NULL,  
        purchase_date DATE DEFAULT NULL,          
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (transaction_id)
      );
    `;
    await connection.query(createTableQuery);
    console.log("Table 'transactions' created or already exists.");
  } catch (error) {
    console.error("Error creating table:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Function to insert data into the MySQL database
async function insertData(
  transactionId,
  amount,
  currency,
  paymentMethod,
  purchaseDate
) {
  const connection = await getConnection();
  try {
    const insertQuery = `
      INSERT INTO transactions (transaction_id, amount, currency, payment_method, purchase_date)
      VALUES (?, ?, ?, ?, ?);
    `;
    await connection.execute(insertQuery, [
      transactionId,
      amount,
      currency,
      paymentMethod,
      purchaseDate,
    ]);
    console.log("Data inserted successfully.");
  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Function to fetch all data from MySQL
async function fetchAllData() {
  const connection = await getConnection();
  try {
    const query = `SELECT * FROM transactions;`;
    const [rows] = await connection.query(query);
    return rows;
  } catch (error) {
    console.error("Error fetching data from MySQL:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Format data for Google Sheets
function formatDataForGoogleSheets(data) {
  return data.map((row) => [
    row.transaction_id,
    row.amount,
    row.currency,
    row.payment_method,
    row.purchase_date,
  ]);
}

// Push data to Google Sheets
async function pushDataToGoogleSheets(data) {
  const sheetId = process.env.SPREADSHEET_ID; // Replace with your Google Sheet ID
  const range = `A2:E${data.length + 1}`; // Adjust this to match your sheet range
  const formattedData = formatDataForGoogleSheets(data);

  try {
    await sheets.spreadsheets.values.update({
      auth: await auth.getClient(),
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: "RAW",
      resource: {
        values: formattedData,
      },
    });
    console.log("Data synced to Google Sheets successfully.");
  } catch (error) {
    console.error("Error syncing data to Google Sheets:", error);
    throw error;
  }
}

// Main function to sync data from MySQL to Google Sheets
async function syncDataToGoogleSheets() {
  try {
    const data = await fetchAllData();
    if (data.length > 0) {
      await pushDataToGoogleSheets(data);
    } else {
      console.log("No data found in MySQL to sync.");
    }
  } catch (error) {
    console.error("Error syncing data:", error);
    throw error;
  }
}

// Initialize the database by creating the table
async function initializeDatabase() {
  await createTable();
}

// Export functions for manual triggering
module.exports = {
  getConnection,
  insertData,
  initializeDatabase,
  fetchAllData,
  syncDataToGoogleSheets,
  pushDataToGoogleSheets,
};
