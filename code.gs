function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var params = e.parameter;
  var action = params.type;
  var callback = params.callback;

  function returnJSON(obj) {
    var json = JSON.stringify(obj);
    var output = callback ? callback + "(" + json + ")" : json;
    return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  if (action == "expense") {
    var sheet = ss.getSheetByName("Expenses") || ss.insertSheet("Expenses");
    if (sheet.getLastRow() == 0) sheet.appendRow(["Date", "Item", "Category", "Cost", "Notes"]);
    sheet.appendRow([params.date, params.item, params.category, params.cost, params.notes]);
    return returnJSON({status: "success", msg: "Expense Saved"});
  }

  else if (action == "mileage_preview") {
    var stops = JSON.parse(params.stops || "[]");
    return returnJSON({
      status: "success", 
      cleanStart: params.startLoc, 
      cleanStops: stops,
      miles: "0.0" 
    });
  }

  else if (action == "mileage_save") {
    var sheet = ss.getSheetByName("Mileage") || ss.insertSheet("Mileage");
    // Aligned to your headers: DATE, START LOCATION, END LOCATION, MILES, REASON, NOTES
    if (sheet.getLastRow() == 0) sheet.appendRow(["DATE", "START LOCATION", "END LOCATION", "MILES", "REASON", "NOTES"]);
    
    sheet.appendRow([
      params.date,
      params.startLoc,
      params.endLoc,
      params.miles, // Column D
      params.reason, // Column E
      params.notes
    ]);
    return returnJSON({status: "success", msg: "Trip Logged"});
  }

  else if (action == "get_mileage_report") {
    var sheet = ss.getSheetByName("Mileage");
    if (!sheet) return returnJSON({status: "error", msg: "No mileage logs found."});

    var data = sheet.getDataRange().getValues();
    var rows = [];
    var startStr = params.startDate;
    var endStr = params.endDate;
    
    for (var i = 1; i < data.length; i++) {
      var rowRawDate = data[i][0]; 
      var rowDateStr = formatDateForCompare(rowRawDate);
      
      if (rowDateStr >= startStr && rowDateStr <= endStr) {
        rows.push({
          date: formatDate(rowRawDate),
          start: data[i][1],  // START LOCATION
          route: data[i][2],  // END LOCATION
          miles: data[i][3],  // MILES (Column D)
          reason: data[i][4], // REASON (Column E)
          notes: data[i][5]   // NOTES
        });
      }
    }
    return returnJSON({status: "success", data: rows});
  }
  
  return returnJSON({status: "error", msg: "Unknown Action"});
}

function formatDate(d) {
  var date = new Date(d);
  return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
}

function formatDateForCompare(d) {
  var date = new Date(d);
  return date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + "-" + ('0' + date.getDate()).slice(-2);
}
