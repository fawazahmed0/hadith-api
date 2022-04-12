const util = require('../hadith/utilities.js')

const fs = require('fs');
const path = require('path');
const {
    spawnSync
  } = require('child_process');
  const {
    firefox
  } = require('playwright');

// whether json is required in translation or not
var jsonrequired = true
// Folder that holds all the translations that needs to be added
var startDir = path.join(__dirname, "start")

// Folder that holds all the translations that needs to be added
var startDir = path.join(__dirname, "start")
// Folder that holds all the hadith editions
var editionsFolder = "editions"
var editionsDir = path.join(__dirname, editionsFolder)
// Stores the files for download and as backup
var databaseDir = path.join(__dirname, 'database')
// Stores translations in line by line format of 6236 lines
var linebylineDir = path.join(databaseDir, 'linebyline')
// Directory containing all the fonts
var fontsDir = path.join(__dirname, 'fonts')
var startUrl = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@"
var apiVersion = '1'
// API url
var url = startUrl + apiVersion + "/"

// Stores the translation files snippets and it's json,retreieves them from linebylineDir
var jsondb = {}
// spaces to be used for prettify/json.stringify
var prettyindent = '\t'
// stores iso codes
var isocodes;
//stores maqra,juz etc start and end
var qinfo;
// stores the google language codes
var gLangCodes;
// https://stackoverflow.com/a/5767589
// access node command line args
var argarr = process.argv.slice(2);
// Page to add translation text and get the direction of text and also for font generation
var page
// browser variable, to allow easily closing the browser from anywhere in the script
var browser


// function that will run on running this script
async function start() {
    logmsg("\nBEGIN:\n" + process.argv.join(' '), true)
    // Print the help and how to use the script file and arguments, same as given in contribute
    if (argarr[0] == undefined)
      helpPrint()
    else if ("" + argarr[0].toLowerCase().trim() == "create")
      await create()
    else if (argarr[0].toLowerCase().trim() == "update")
      await create(true)
    else if (argarr[0].toLowerCase().trim() == "search")
      search(argarr.slice(1))
    else if (argarr[0].toLowerCase().trim() == "delete") {
      // storing the data in jsondb, so editionsListingsGen function can work and create editions.json
      await jsonDB()
      deleteEditions(argarr.slice(1))
    } else if (argarr[0].toLowerCase().trim() == "fontsgen")
      fontsGen()
    else
      helpPrint()
  
  }
  // calling start()
  start()

  
// Prints the information on how to use this tool, mirror whatever is written in contribution.md
function helpPrint() {
    var filename = path.basename(__filename);
    console.log("\nUsage: node ", filename, " [arguments]")
    console.log("\n\narguments:")
    console.log("\ncreate\ncreates the database in REST architecture, paste your files in start directory and then run this command\nExample: node ", filename, " create")
    console.log("\nupdate\nupdates the database, copy the edition that needs to be edited from database/chapterverse directory and paste that edition in start directory and then perform any editing you want in the file and then run this command\nExample: node ", filename, " update")
    console.log("\ndelete\ndeletes the edition from database\nExample: node ", filename, " delete editionNameToDelete")
    console.log("\nsearch\nsearches the provided line in database\nExample: node ", filename, ' search "verseToSearch"')
    console.log("\nfontsgen\ngenerates the fonts, paste your fonts in start direcotry and then run this command\nExample: node ", filename, ' fontsgen')
  }


  async function create(){

    
  }

    // Stores the translation files snippets and it's json,retreieves them from linebylineDir
async function jsonDB(singlefile) {
  for (var filename of fs.readdirSync(linebylineDir)) {
    // if single file is defined, we will break the loop at end, we will only read that particular files data into jsondb object
    if (singlefile)
      filename = singlefile

    var filepath = path.join(linebylineDir, filename)
    // read the file 40k bytes of file to be stored as snippet in jsondb object
    var data = await streamRead(filepath, 0, 40000)

    jsondb[filename] = {}
    // taking verse from line 11 to 20 and storing it for searching and duplicate detection
    jsondb[filename]['snippet'] = data.split(/\r?\n/).slice(10, 20).join('\n')
    // reading last 3k bytes of file to fetch json
    data = await streamRead(filepath, fs.statSync(filepath).size - 3000)
    // parse the json
    jsondb[filename]['jsondata'] = getJSONInArray(data.split(/\r?\n/))[0]
    // break the loop, as we only wanted to add one file
    if (singlefile)
      break;
  }
}

// Checks for duplicate files in the database
function checkduplicateTrans(arr) {
  for (var filename of fs.readdirSync(linebylineDir)) {
    if (cleanify(arr.join('\n')).includes(cleanify(jsondb[filename]['snippet'])))
      return filename
  }
}



// Page and browser is a global variable and it can be accessed from anywhere
// function that launches a browser
async function launchBrowser(linkToOpen, downloadPathDir) {
  browser = await firefox.launch({
    headless: true,
    downloadsPath: downloadPathDir
  });
  var context = await browser.newContext({
    acceptDownloads: true
  });
  page = await context.newPage();
  if (linkToOpen)
    await page.goto(linkToOpen, {
      timeout: 60000
    });
}