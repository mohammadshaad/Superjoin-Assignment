[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/e0mOS4g_)
# Superjoin Hiring Assignment

### Welcome to Superjoin's hiring assignment! 🚀

### Objective
Build a solution that enables real-time synchronization of data between a Google Sheet and a specified database (e.g., MySQL, PostgreSQL). The solution should detect changes in the Google Sheet and update the database accordingly, and vice versa.

### Problem Statement
Many businesses use Google Sheets for collaborative data management and databases for more robust and scalable data storage. However, keeping the data synchronised between Google Sheets and databases is often a manual and error-prone process. Your task is to develop a solution that automates this synchronisation, ensuring that changes in one are reflected in the other in real-time.

### Requirements:
1. Real-time Synchronisation
  - Implement a system that detects changes in Google Sheets and updates the database accordingly.
   - Similarly, detect changes in the database and update the Google Sheet.
  2.	CRUD Operations
   - Ensure the system supports Create, Read, Update, and Delete operations for both Google Sheets and the database.
   - Maintain data consistency across both platforms.
   
### Optional Challenges (This is not mandatory):
1. Conflict Handling
- Develop a strategy to handle conflicts that may arise when changes are made simultaneously in both Google Sheets and the database.
- Provide options for conflict resolution (e.g., last write wins, user-defined rules).
    
2. Scalability: 	
- Ensure the solution can handle large datasets and high-frequency updates without performance degradation.
- Optimize for scalability and efficiency.

## Submission ⏰
The timeline for this submission is: **Next 2 days**

Some things you might want to take care of:
- Make use of git and commit your steps!
- Use good coding practices.
- Write beautiful and readable code. Well-written code is nothing less than a work of art.
- Use semantic variable naming.
- Your code should be organized well in files and folders which is easy to figure out.
- If there is something happening in your code that is not very intuitive, add some comments.
- Add to this README at the bottom explaining your approach (brownie points 😋)
- Use ChatGPT4o/o1/Github Co-pilot, anything that accelerates how you work 💪🏽. 

Make sure you finish the assignment a little earlier than this so you have time to make any final changes.

Once you're done, make sure you **record a video** showing your project working. The video should **NOT** be longer than 120 seconds. While you record the video, tell us about your biggest blocker, and how you overcame it! Don't be shy, talk us through, we'd love that.

We have a checklist at the bottom of this README file, which you should update as your progress with your assignment. It will help us evaluate your project.

- [x] My code's working just fine! 🥳
- [x] I have recorded a video showing it working and embedded it in the README ▶️
- [x] I have tested all the normal working cases 😎
- [x] I have even solved some edge cases (brownie points) 💪
- [x] I added my very planned-out approach to the problem at the end of this README 📜

## Got Questions❓
Feel free to check the discussions tab, you might get some help there. Check out that tab before reaching out to us. Also, did you know, the internet is a great place to explore? 😛

We're available at techhiring@superjoin.ai for all queries. 

All the best ✨.

## Developer's Section

- Here's a video that explains the project:
- (Video Link)[https://youtu.be/GtvB4f6_xlQ]

## Project Timeline

### Day 0

- Created mock Google Sheet data.
- Set up GitHub workflow and NodeJS project.
- Obtained OAuth refresh token for accessing the Google Sheets API.
- Abandoned OAuth approach due to verification issues, created a service account instead.
- Built ExpressJS CRUD APIs and fetched data from Google Sheets using the `SPREADSHEET_ID` approach.

### Day 1

- Wrote Google Apps Script to detect changes (using the onEdit trigger).
- Created an API endpoint for receiving changes from the script and successfully received the data.
- The challenge was to create the database schema and synchronize changes with the database.
- Initially tried appending only the data received from `/update-sheet-data`, but encountered errors.
- To avoid frequent requests, I cached the previous database state and compared it with the current state every 5 seconds.

### Day 2

- Successfully implemented one-way synchronization from Google Sheets to the database.
- The challenge was syncing changes from the database back to Google Sheets.
- Tried Google Apps Script for this, but faced rate limiting issues.
- Successfully implemented Triggers in MySQL to detect changes in the database and send them to the Google Sheets API.

### Biggest Challenge

- I initially tried to use PostgreSQL's LISTEN/NOTIFY feature to detect changes in the database and send them to Google Sheets but faced issues with the Google Sheets API rate limits.
- I then tried to use WebSockets to send changes from the database to Google Sheets but faced the same rate limit issues.
- I also implemented polling to detect changes in the database and send them to Google Sheets but tried to avoid frequent requests.


## Approaches Tried

- **OAuth**: Failure (due to verification issues, switched to a service account)
- **WebSockets**: Failure (due to Google Sheets API rate limits)
- **Polling**: Success
- **Google Sheets API**: Success
- **Triggers in MySQL**: Success

---

## Project Setup Guide

**Note**: The setup is complex due to Google Apps Scripts,service account credentials and API integrations. If you'd like to set up the project, feel free to reach out to me. I would not recommend setting this up

### Steps:

1. Clone the repository.
2. Install dependencies:

```bash
  npm install
```

3. Create a .env file and enter the following:

```bash
CopyPORT=3000
WS_PORT=8080
SPREADSHEET_ID=1Ci63bTCrhe6Vp8TWjiGbbrEbXgCiJds98I5W_7lE7Ew
DB_HOST=your_db_host
DB_PORT=your_db_port
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
```

- On Google Cloud Console, create a service account and obtain JSON file. Name it service.json and paste it in the project root directory.

- The project structure should look like this:

```
vit-mohammadshaad/
│
├── src/
│   ├── config.js
│   ├── database.js
│   ├── expressApp.js
│   ├── googleSheetsServices.js
│   └── polling.js
│
├── .env
├── service.json
├── server.js
├── package.json
└── ngrok.exe
```

- Run node server.js

4. After creating the service account, grant it edit access to the Google Sheet using the service email.

- In Google Sheets, go to Extensions > Apps Script
- Copy and paste this App Script as a .gs file
- AppScript Code to detect changes in Google Sheets:

```javascript
// Function to handle GET requests
function doGet(e) {
  return HtmlService.createHtmlOutput("Welcome to the Google Apps Script Web App!");
}

// Function to handle POST requests
function doPost(e) {
  // Log the entire event object for debugging
  Logger.log(JSON.stringify(e));

  // Check if e.postData exists
  if (!e.postData) {
    return ContentService.createTextOutput("No POST data received").setMimeType(ContentService.MimeType.TEXT);
  }

  // Log the request body for debugging
  Logger.log('Request body: ' + e.postData.contents);

  // Parse the JSON payload from the POST request
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    return ContentService.createTextOutput("Invalid JSON format").setMimeType(ContentService.MimeType.TEXT);
  }

  // Example: Process the data (here we're just logging it)
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getRange("A2");
  range.setValue("Received data: " + JSON.stringify(data));

  // Respond with success message
  return ContentService.createTextOutput("Data received and processed successfully.");
}


// Function to handle onEdit triggers
function customOnEdit(e) {
  // Check if the event object contains the necessary properties
  if (!e || !e.source || !e.range) {
    console.error('Event object or its properties are not available');
    return;
  }

  const sheet = e.source.getActiveSheet();
  const range = e.range;
  const values = sheet.getDataRange().getValues(); // Get all data from the sheet

  // Prepare the data to send
  const data = {
    sheetName: sheet.getName(),
    range: range.getA1Notation(),
    values: values,
  };

  // Replace with your Express route URL
  const url = 'https://1830-115-240-194-54.ngrok-free.app/update-sheet-data'; // Ensure this URL is correct and accessible

  // Send data to your Express server
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(data),
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    console.error('Error sending data to server:', error);
  }
}

// Trigger this function periodically to sync data
function scheduledSync() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues(); // Get all data from the sheet

  // Prepare the data to send
  const data = {
    sheetName: sheet.getName(),
    range: "A2:T502", // Adjust the range as needed
    values: values,
  };

  // Replace with your Express route URL
  const url = 'https://1830-115-240-194-54.ngrok-free.app/update-sheet-data'; // Ensure this URL is correct and accessible

  // Send data to your Express server
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(data),
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    console.error('Error sending data to server:', error);
  }
}
```

- Add an `on edit` trigger and deploy the project as a web app.

---

### SQL Query to create the Trigger for the transactions:

```sql
CREATE TRIGGER after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE json_data JSON;
    SET json_data = JSON_OBJECT(
        'transaction_id', NEW.transaction_id,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'payment_method', NEW.payment_method,
        'purchase_date', NEW.purchase_date
    );

    -- Call the external URL to notify the application
    SELECT
        sys_exec(CONCAT('curl -X POST http://localhost:3000/update-transaction -d ''', json_data, ''' -H "Content-Type: application/json"'));
END;
```

---

### Conclusion

- The project was challenging due to the real-time synchronization requirement.
- The project could be improved by using Pub/Sub or WebSockets for real-time synchronization.
- I enjoyed working on this project and look forward to feedback.

### Thank you! 🚀


