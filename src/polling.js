const { fetchRecentChanges, pushDataToGoogleSheets } = require("./database");

// Track the last time the database was checked
let lastCheckTime = new Date();

// Polling function
async function pollForUpdates() {
  try {
    const changes = await fetchRecentChanges(lastCheckTime);

    if (changes.length > 0) {
      console.log("Recent changes found:", changes);
      await pushDataToGoogleSheets(changes);
    } else {
      console.log("No recent changes found.");
    }

    // Update last check time
    lastCheckTime = new Date();
  } catch (error) {
    console.error("Error during polling:", error);
  }
}

// Schedule polling every 1 second
// setInterval(pollForUpdates, 1000);

console.log("Polling started. Checking for updates every second.");