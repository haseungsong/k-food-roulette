function doGet() {
  return ContentService.createTextOutput("ok");
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = e.parameter || {};

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
      "interest"
    ]);
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
    data.interest || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
