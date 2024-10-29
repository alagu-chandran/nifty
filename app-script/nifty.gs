function fetchDataAndPopulateSheet() {
  // Get the active spreadsheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get the "Current" sheet
  var currentSheet = spreadsheet.getSheetByName("Current");
  
  // Duplicate the sheet
  var duplicatedSheet = currentSheet.copyTo(spreadsheet);
  
  // Get the value in cell A1 of the duplicated sheet
  var newName = duplicatedSheet.getRange("A1").getValue();
  
  // Rename the duplicated sheet
  duplicatedSheet.setName(newName);

  // Move the duplicated sheet to the right of the "Current" sheet
  var currentSheetIndex = currentSheet.getIndex();
  spreadsheet.setActiveSheet(duplicatedSheet);
  spreadsheet.moveActiveSheet(currentSheetIndex + 1); 

  
  // Set the focus back to the "Current" sheet
  spreadsheet.setActiveSheet(currentSheet);  
  // Specify the URL to fetch data from
  var url = "https://alagu-chandran.github.io/nifty/NIFTY.json";

  // Fetch data from the URL
  var response = UrlFetchApp.fetch(url);
  var content = response.getContentText();

  try {
    // Parse the JSON data
    var jsonData = JSON.parse(content);

    // Get the active spreadsheet and sheet
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("Current");

    // Clear existing data in the sheet
    sheet.clear();

    // Get the headers from the JSON data
    var headers = Object.keys(jsonData['active'][0]);

    // Set headers in the sheet
    sheet.appendRow(headers);

    // Populate data in the sheet
    jsonData['active'].forEach(function (row) {
      var rowData = headers.map(function (header) {
        return row[header];
      });
      sheet.appendRow(rowData);
    });
    sheet.getRange(4, 19).setValue("Open");
    sheet.getRange(4, 20).setValue(jsonData['summary']['open']);
    sheet.getRange(5, 19).setValue("High");
    sheet.getRange(5, 20).setValue(jsonData['summary']['high']);
    sheet.getRange(6, 19).setValue("Low");
    sheet.getRange(6, 20).setValue(jsonData['summary']['low']);
    sheet.getRange(7, 19).setValue("Close");
    sheet.getRange(7, 20).setValue(jsonData['summary']['close']);    
    message = 
    Logger.log("Data successfully populated in the 'Current' sheet.");
    fetchDataWithParams("🚨Nifty Sheet Updated")
  } catch (error) {
    Logger.log("Error parsing JSON data: " + error);
    fetchDataWithParams("🚨Nifty Sheet Update Error"+"\nError parsing JSON data: " + error)
  }
}


function duplicateAndRenameSheet() {
  // Get the active spreadsheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get the "Current" sheet
  var currentSheet = spreadsheet.getSheetByName("Current");
  
  // Duplicate the sheet
  var duplicatedSheet = currentSheet.copyTo(spreadsheet);
  
  // Get the value in cell A1 of the duplicated sheet
  var newName = duplicatedSheet.getRange("A1").getValue();
  
  // Rename the duplicated sheet
  duplicatedSheet.setName(newName);

  // Move the duplicated sheet to the right of the "Current" sheet
  var currentSheetIndex = currentSheet.getIndex();
  spreadsheet.setActiveSheet(duplicatedSheet);
  spreadsheet.moveActiveSheet(currentSheetIndex + 1); 

  
  // Set the focus back to the "Current" sheet
  spreadsheet.setActiveSheet(currentSheet);  
}

function fetchDataWithParams(message) {
  // Specify the base URL
  var baseUrl = "https://api.telegram.org/bot5587231907:AAEvfLOyRPYRUl8bkJgtr7svFSqxRpB7Rg0/sendMessage";

  // Specify parameters
  var params = {
    "chat_id": "-1002056977910",
    "text": message,
    // Add more parameters as needed
  };

  // Build the URL with parameters
  var urlWithParams = buildUrl(baseUrl, params);

  // Fetch data from the URL
  var response = UrlFetchApp.fetch(urlWithParams);

  // Log the response content
  Logger.log(response.getContentText());
}

// Function to build a URL with parameters
function buildUrl(baseUrl, params) {
  var queryString = Object.keys(params)
    .map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
    })
    .join("&");

  return baseUrl + "?" + queryString;
}

//Funtion to delete 7 Days older Data
function deleteOldSheets() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = spreadsheet.getSheets();
  var today = new Date();
  var log = [];

  // Iterate over all the sheets in the spreadsheet
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var sheetName = sheet.getName();
    
    // Check if the sheet name follows the dd.mm.yyyy format using regex
    var datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    var match = sheetName.match(datePattern);
    
    if (match) {
      // Convert the extracted date from the sheet name to a Date object
      var day = parseInt(match[1]);
      var month = parseInt(match[2]) - 1;  // Month in Date() is 0-indexed
      var year = parseInt(match[3]);
      
      var sheetDate = new Date(year, month, day);
      
      // Calculate the difference in days between today and the sheet's date
      var diffInDays = Math.floor((today - sheetDate) / (1000 * 60 * 60 * 24));
      
      // If the sheet date is more than 7 days older, delete the sheet and log the action
      if (diffInDays > 7) {
        log.push("Deleting sheet: " + sheetName + " | Date: " + sheetDate.toDateString() + " | Older than 7 days.");
        spreadsheet.deleteSheet(sheet);
      }
    } else {
      log.push("Skipping sheet: " + sheetName + " | Not a valid date format (dd.mm.yyyy).");
    }
  }
  
  // Log the results
  log.forEach(function(entry) {
    Logger.log(entry);
  });
}


function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Create a menu item in the menu bar
  ui.createMenu('Actions')
    .addItem('Fetch Data', 'fetchDataAndPopulateSheet')
    .addItem('Delete Sheets', 'deleteOldSheets')
    .addToUi();
}
