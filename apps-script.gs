const SHEET_ID = "1b_LMC8maxvSW2uKKHtpxo9lwOc3bL4CVnDB2ujILprQ";

function doGet() {
  return ContentService.createTextOutput("ok");
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Survey") || ss.getSheets()[0];
  const data = (e && e.parameter) || {};

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "timestamp",
      "age",
      "gender",
      "region",
      "awareness",
      "foods",
      "favorite",
      "frequency",
      "purchase",
      "interest",
      "event",
      "kfood_event"
    ]);
  } else if (!sheet.getRange(1, 11).getValue()) {
    sheet.getRange(1, 11, 1, 2).setValues([["event", "kfood_event"]]);
  }

  sheet.appendRow([
    data.timestamp || new Date(),
    data.age || "",
    data.gender || "",
    data.region || "",
    data.awareness || "",
    data.foods || "",
    data.favorite || "",
    data.frequency || "",
    data.purchase || "",
    data.interest || "",
    data.event || "",
    data.kfoodEvent || ""
  ]);

  return ContentService.createTextOutput("ok");
}
