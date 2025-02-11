// comments indicate the developer above each function

// multi page app tutorial:
// https://www.bpwebs.com/create-a-multi-page-google-apps-script-web-app/#building-a-multi-page-google-apps-script-web-app
// Jessica - display html to pages
function doGet(e) {
  // get requested page
  let page = e.parameter.mode || "Index";
  // get html template of page and generate html output
  let html = HtmlService.createTemplateFromFile(page).evaluate();
  // creates an html object out of specified html output
  let htmlOutput = HtmlService.createHtmlOutput(html);
  // ensure html is outputted correctly on all devices
  htmlOutput.addMetaTag("viewport", "width=device-width, initial-scale=1");

  // replace placeholder NAVBAR with nav bar content
  htmlOutput.setContent(
    htmlOutput.getContent().replace("{{NAVBAR}}", getNavbar(page))
  );
  return htmlOutput;
}

// Jessica - generate nav bar
function getNavbar(activePage) {
  // generate URLS for the diff pages
  let scriptURLHome = getScriptURL();
  let scriptURLLibrary = getScriptURL("mode=Library");

  // the navbar
  let navbar = `<nav class="nav main-nav">
      <div class="container">
      <div class="navbar-nav">
        <a class="nav-item nav-link ${
          activePage === "Index" ? "active" : ""
        }" href="${scriptURLHome}">Home</a>
        <a class="nav-item nav-link ${
          activePage === "Library" ? "active" : ""
        }" href="${scriptURLLibrary}">Library</a>
      </div>
      </div>
    </nav>`;
  return navbar;
}

// Jessica - returns URL of web app
function getScriptURL(qs = null) {
  var url = ScriptApp.getService().getUrl();
  if (qs) {
    if (qs.indexOf("?") === -1) {
      qs = "?" + qs;
    }
    url = url + qs;
  }
  return url;
}

// Jessica - use this function in files to include other files eg. use include(Stylesheet) to get CSS
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Angela - gets all books from spreadsheet
// returns array of book objects
function getAllBooks() {
  let shelves = getShelves();
  let books = [];

  for (let s = 0; s < shelves.length; s++) {
    books = books.concat(getBooksByShelf(shelves[s]));
  }

  return books;
}

// Angela - gets all books from one shelf
// returns array of book objects
// Jessica - all the parts related to book covers
function getBooksByShelf(shelf) {
  let sheet = shelf.getDataRange().getValues();
  let shelfName = shelf.getSheetName();
  let books = [];
  let coverLinks = getCoverLinks();
  let coverIds = [];
  let coverImage;

  // remove .jpg from link
  for (let i = 0; i < coverLinks.length; i++) {
    coverIds.push(coverLinks[i][0].slice(0, 4));
  }

  for (let row = 1; row < sheet.length; row++) {
    // get book ID from sheet
    let bookID = sheet[row][5];
    // if cover isn't in covers folder set cover as an empty string
    if (coverIds.indexOf(bookID) == -1) {
      coverImage = "";
    } else {
      // set cover as link
      coverImage = coverLinks[coverIds.indexOf(bookID)][1];
    }

    books.push(getBook(sheet, row, shelfName, coverImage));
  }

  return books;
}

// Jessica - returns coverlink ids
function getCoverLinks() {
  // covers folder
  let folder = DriveApp.getFolderById(
    getFolderIdFromLink(
      "https://drive.google.com/drive/folders/14Jfk1vnIdv-KQpFktuBvmJsFsUPKzh6v?usp=drive_link"
    )
  );
  let files = folder.getFiles();
  filelinks = [];

  // for every file in the covers folder...
  while (files.hasNext()) {
    // get file and file name and ID
    let file = files.next();
    let fileName = file.getName();
    let filelink = file.getId();
    // add file name and link to array
    filelinks.push([fileName, filelink]);
  }

  // sorts links alphabetically
  filelinks.sort();

  return filelinks;
}

// Jessica - get folder id from link
// retrieved from: https://medium.com/@akmkurian/retrieve-file-names-and-urls-of-a-google-drive-folder-using-google-apps-script-and-google-sheets-467955e88e7
function getFolderIdFromLink(link) {
  let regex = /\/folders\/([^/?]+)/;
  let match = link.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

// Angela - gets the info for one book
// returns book object
function getBook(sheet, index, shelfName, coverImage) {
  let book = {
    author: sheet[index][0],
    title: sheet[index][1],
    description: sheet[index][2],
    genre: sheet[index][3].split(", "),
    shelf: shelfName,
    link: sheet[index][4],
    cover: coverImage,
  };

  return book;
}

// Jessica - return wanted searched books
function getSearchedBooks(searchedBook) {
  searchedBook = searchedBook.toLowerCase();
  bookArray = getAllBooks();
  // wanted books to display
  wantedBooks = [];

  for (i = 0; i < bookArray.length; i++) {
    book = bookArray[i];
    title = book.title.toLowerCase();
    author = book.author.toLowerCase();

    // if the title or author matches the search...
    if (title.includes(searchedBook) || author.includes(searchedBook)) {
      // add book to array of wanted books
      wantedBooks.push(book);
    }
  }

  return wantedBooks;
}

// Angela - gets array of shelves from spreadsheet
function getShelves() {
  let spreadsheet = SpreadsheetApp.openById(
    "1iHDchaIoMsC0aqfqFQFnzRULZpQrSqHMBTymHRvOpCg"
  );
  let shelves = spreadsheet.getSheets();

  // gets rid of first shelf (template)
  shelves.splice(0, 1);

  return shelves;
}

// Angela - gets array of shelf names from spreadsheet
function getShelfNames() {
  let shelves = getShelves();
  let shelfNames = [];

  for (let i = 0; i < shelves.length; i++) {
    shelfNames.push(shelves[i].getSheetName());
  }

  return shelfNames;
}

// Angela - returns array of all genres in the spreadsheet
function getGenres() {
  let shelves = getShelves();

  let genresArr = [];
  let shelfData;
  let genres;

  // loops through shelves
  for (let s = 0; s < shelves.length; s++) {
    shelfData = shelves[s].getDataRange().getValues();

    // loops through each book in the shelf
    for (let row = 1; row < shelfData.length; row++) {
      genres = shelfData[row][3].split(", ");

      // goes through each genre for the current book
      // and inserts into the genresArr array
      for (let g = 0; g < genres.length; g++) {
        insertIntoArray(genresArr, genres[g]);
      }
    }
  }

  return genresArr;
}

// Angela - inserts new element into sorted array
function insertIntoArray(arr, newElement) {
  // if this element already appears in the array, doesn't add it
  if (isInArray(arr, newElement)) {
    return;
  }

  // pushes new element
  arr.push(newElement);

  // sorts array
  arr.sort();
}

// Angela - returns true if element is in array, false if not
function isInArray(arr, element) {
  if (binarySearch(arr, element) > -1) {
    return true;
  }
  return false;
}

// Angela - binary search for a sorted array
function binarySearch(arr, element) {
  let start = 0;
  let end = arr.length - 1;
  let midpoint;

  while (start <= end) {
    midpoint = Math.round((start + end) / 2);

    if (element == arr[midpoint]) {
      return midpoint;
    } else if (element > arr[midpoint]) {
      start = midpoint + 1;
    } else {
      end = midpoint - 1;
    }
  }

  return -1;
}
