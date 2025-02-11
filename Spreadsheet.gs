function onOpen() {
  let ui = SpreadsheetApp.getUi();
  ui.createMenu("Library")
    .addItem("Update Website", "updateWebsite")
    .addItem("Create New Shelf", "createNewShelf")
    .addItem("Sort Current Sheet by Author", "sortCurrentSheetByAuthor")
    .addItem("Sort All Sheets by Author", "sortAllSheetsByAuthor")
    .addItem("Format Current Sheet", "formatCurrentSheet")
    .addItem("Format All Sheets", "formatAllSheets")
    .addItem("Help", "help")
    .addToUi();
}

// updates website
// functionally, copies all content from this spreadsheet to the secondary spreadsheet, which is used by the website to fetch book data
function updateWebsite() {
  // ask if they want to update the website
  let result = SpreadsheetApp.getUi().alert("Are you sure you want to update the website?", SpreadsheetApp.getUi().ButtonSet.YES_NO);
  if (result == SpreadsheetApp.getUi().Button.YES) {
    let currentSpread = SpreadsheetApp.getActiveSpreadsheet();
    let secondSpread = SpreadsheetApp.openById("1iHDchaIoMsC0aqfqFQFnzRULZpQrSqHMBTymHRvOpCg");

    // deletes all shelves in second spreadsheet except for template
    let secondShelves = secondSpread.getSheets();

    // unhides template sheet first, since there must be at least one visible sheet at all times
    secondShelves[0].showSheet();

    for (let i = 1; i < secondShelves.length; i++) {
      secondSpread.deleteSheet(secondShelves[i]);
    }

    // copies over all shelves to secondary spreadsheet
    let currentShelves = currentSpread.getSheets();
    let shelfName;

    for (let i = 1; i < currentShelves.length; i++) {
      shelfName = currentShelves[i].getSheetName();
      currentShelves[i].copyTo(secondSpread).setName(shelfName);
    }

    // hides template sheet again
    secondShelves[0].hideSheet();
  }

}

// creates a new shelf
function createNewShelf() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let template = spreadsheet.getSheetByName("Template");

  // prompts user for the name of the new shelf
  let shelfName = SpreadsheetApp.getUi().prompt("Enter the name of the new shelf:").getResponseText();

  // copies template content to new shelf
  template.copyTo(spreadsheet).setName(shelfName);

  // unhides new shelf
  spreadsheet.getSheetByName(shelfName).showSheet();
}

// sorts books by using the specified compare method
function sortBooks(sheet, compareMethod) {
  let booksArray = sheet.getDataRange().getValues();

  // removes first row
  booksArray.splice(0, 1);

  // sorts the array with compareAuthors function
  booksArray.sort(compareMethod);

  // puts values in spreadsheet
  sheet.getRange(2, 1, booksArray.length, booksArray[0].length).setValues(booksArray);
}

// sorts sheet by author
function sortSheetByAuthor(sheet) {
  sortBooks(sheet, compareBooksByAuthor);
  formatSheet(sheet);
}

// sorts current sheet's books by author
function sortCurrentSheetByAuthor() {
  let activeSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sortSheetByAuthor(activeSheet);
}

// sorts all sheets by author
function sortAllSheetsByAuthor() {
  let sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();

  for (let i = 1; i < sheets.length; i++) {
    sortSheetByAuthor(sheets[i]);
  }
}

// compares the author names for the two books; if they're the same, then compares the titles
// bookA and bookB are rows in the spreadsheet
function compareBooksByAuthor(bookA, bookB) {

  // if author is the same, returns difference in titles
  if (bookA[0] == bookB[0]) {
    return bookA[1].localeCompare(bookB[1]);
  }

  // otherwise, return the difference in authors
  return bookA[0].localeCompare(bookB[0]);
}

// formats the current active sheet
function formatCurrentSheet() {
  formatSheet(SpreadsheetApp.getActiveSpreadsheet().getActiveSheet());
}

// formats all sheets
function formatAllSheets() {
  let sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();

  for (let i = 1; i < sheets.length; i++) {
    formatSheet(sheets[i]);
  }
}

// formats the sheet
function formatSheet(sheet) {
  let dataRange = sheet.getDataRange();

  // default formatting for most of the sheet
  dataRange.setFontFamily('Arial');
  dataRange.setFontColor('black');
  dataRange.setFontSize(10);
  dataRange.setBackgroundColor('white');
  dataRange.setFontWeight('normal');
  dataRange.setFontStyle('normal');
  dataRange.setFontLine('none');
  dataRange.setBorder(false, false, false, false, false, false);
  dataRange.setHorizontalAlignment('center');
  dataRange.setVerticalAlignment('middle');
  dataRange.setWrap(true);

  // sets first row to bold and coloured background
  let firstRowRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  firstRowRange.setFontWeight('bold');
  firstRowRange.setFontColor('white');

  // colour hex codes
  const colours = {
    brown: '#524547',
    green: '#658170',
    turquoise: '#05606D',
    blue: '#093761',
    purple: '#54214C'
  }

  // random colour generator
  let colourNames = Object.keys(colours);
  let randomNum = Math.floor(Math.random() * (colourNames.length));
  let colour = colours[colourNames[randomNum]];
  firstRowRange.setBackgroundColor(colour);

  // sets Goodreads links (second last column) to coloured text and underlined
  let goodreadsRange = sheet.getRange(2, sheet.getLastColumn() - 1, sheet.getLastRow()-1, 1);
  goodreadsRange.setFontLine('underline');
  goodreadsRange.setFontColor(colours.turquoise);

  // freezes first row and first two columns
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // sets column widths
  let colWidths = [120, 120, 800, 120, 120, 80];
  for (let i = 1; i <= sheet.getLastColumn(); i++) {
    sheet.setColumnWidth(i, colWidths[i - 1]);
  }
}

// display help popup to user
function help() {
  let message = "Format of the Spreadsheet:\n-Author: LastName, FirstName\n-Multiple Genres: Add a space after each comma\n-ID: Assigns the book's cover ID. Use the same letter as others in the same shelf and increment the number by 1. When adding a book to a new shelf, use next letter in alphabet for the ID. Download and add the cover image as a file (ex. \".jpg\") to the Covers folder in Google Drive and name the file the same as the ID in the sheet with the file type (ex. \"A001.jpg\")\n\nNOTE: WHEN DONE ADDING BOOKS TO SHEET, PLEASE PRESS THE \"UPDATE WEBSITE\" BUTTON UNDER \"LIBRARY\"\n\nFor more information, please go to the Instructions Document :)";
  SpreadsheetApp.getUi().alert(message);
}
