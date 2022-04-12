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