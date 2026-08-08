/**
 * PHANTOM ESPORTS — Google Sheet logger
 * ----------------------------------------------------------------
 * Paste this into Extensions → Apps Script on a Google Sheet, then
 * deploy it as a Web App. Full steps are in server/README.md under
 * "Getting registrations onto your computer".
 *
 * Every verified payment on the backend POSTs a JSON body here; this
 * appends one row per registration, adding a header row the first time.
 * ----------------------------------------------------------------
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Registration ID",
      "Payment ID",
      "Format",
      "Team Name",
      "Roster (IGN / UID)",
      "Captain Name",
      "Captain Email",
      "Captain Phone",
      "Match Slot",
      "Match Date",
      "Fee (INR)",
    ]);
  }

  var rosterText = (data.roster || [])
    .map(function (p) {
      return p.ign + " (UID " + p.uid + ")";
    })
    .join(", ");

  sheet.appendRow([
    new Date(),
    data.registrationId || "",
    data.paymentId || "",
    data.mode || "",
    data.teamName || "",
    rosterText,
    data.captainName || "",
    data.captainEmail || "",
    data.captainPhone || "",
    data.slot || "",
    data.date || "",
    data.fee || "",
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(
    ContentService.MimeType.JSON
  );
}
