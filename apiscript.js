const util = require('../hadith/utilities.js')

const fs = require('fs');
const path = require('path');
const {
    spawnSync
  } = require('child_process');
  const {
    firefox
  } = require('playwright');

  // Flags
// whether to check for duplicate translation or not during create
var checkduplicate = true;
// whether json is required in translation or not
var jsonrequired = true


// Folder that holds all the translations that needs to be added
var startDir = path.join(__dirname, "start")
// Folder that holds all the hadith editions
var editionsFolder = "editions"
var editionsDir = path.join(__dirname, editionsFolder)
// Stores the files for download and as backup
var databaseDir = path.join(__dirname, 'database')
// Stores translations in line by line format of 6236 lines
var linebylineDir = path.join(databaseDir, 'linebyline')

// We will make few directories, incase if they doesn't exists, this will help to run this script even if we
// partially cloned this repo
fs.mkdirSync(startDir, {
  recursive: true
});
fs.mkdirSync(editionsDir, {
  recursive: true
});
fs.mkdirSync(fontsDir, {
  recursive: true
});
fs.mkdirSync(path.join(databaseDir, "originals"), {
  recursive: true
});


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
//stores grades etc
var metainfo;

// https://stackoverflow.com/a/5767589
// access node command line args
var argarr = process.argv.slice(2);
// Page to add translation text and get the direction of text and also for font generation
var page
// browser variable, to allow easily closing the browser from anywhere in the script
var browser


// function that will run on running this script
async function start() {
    util.logmsg("BEGIN:\n" + process.argv.join(' '), true)
    // Print the help and how to use the script file and arguments, same as given in contribute
    if (argarr[0] == undefined)
      helpPrint()
    else if (argarr[0].toLowerCase().trim() == "create")
      await create()
    else if (argarr[0].toLowerCase().trim() == "update")
      await create(true)
    else if (argarr[0].toLowerCase().trim() == "search")
      search(argarr.slice(1))
    else if (argarr[0].toLowerCase().trim() == "delete") {
      // storing the data in jsondb, so editionsListingsGen function can work and create editions.json
      await jsonDB()
      deleteEditions(argarr.slice(1))
    } 
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
    console.log("\nupdate\nupdates the database, copy the edition that needs to be edited from database/linebyline directory and paste that edition in start directory and then perform any editing you want in the file and then run this command\nExample: node ", filename, " update")
    console.log("\ndelete\ndeletes the edition from database\nExample: node ", filename, " delete editionNameToDelete")
    console.log("\nsearch\nsearches the provided line in database\nExample: node ", filename, ' search "verseToSearch"')
  }


async function create(update){
 // saving database snippet, filename and it's json data in jsondb variable
 await jsonDB()
 // saving isocodes in json
 isocodes = await util.getJSON('https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/isocodes/iso-codes.min.json',true)

 // saving quran data such as how many rukus, etc, this will be used to generate the rukus endpoint
 metainfo = await util.getJSON(path.join(__dirname,'..','hadith','grades','grades.json'))


 // Launching browser as we will need it for checking direction of the language
 await launchBrowser()

 for (var filename of fs.readdirSync(startDir)) {
  // we don't want to read .gitkeep, it is used as a placeholder for start direcotory to exist in git
  if (filename == '.gitkeep')
    continue;
    util.logmsg("\nStarting to create files for " + filename)
    // Reading the file and retrieving as array, filteredarr, and jsondata inside it
    // filterarr doesn't contain jsondata and empty lines in it
    var [orgarr, cleanarr, jsondata] = util.readDBTxt(path.join(startDir, filename))

    if (!jsondata) {
      util.logmsg("\nNo JSON found in file " + filename + " or please enter the json in correct format", true)
      jsondata = {}
      if (jsonrequired) {
        var tempjson = '{"author":"Name of Author","language":"Name of language","source":"","comments":""}'
        util.logmsg("\nAdd json at end of file in the following format:\n\n" + JSON.stringify(JSON.parse(tempjson), null, prettyindent))
        continue
      }

    }

        // Now we have to check and make sure same copy doesn't exists in the repo, here we will use the linebylineDir to check
        var duplicatefilename = checkduplicateTrans(cleanarr)
        // We don't want to check for duplicates during update operation
        if (duplicatefilename && !update) {
          util.logmsg("\nThis file " + filename + " seems to be a duplicate copy of edition " + duplicatefilename.replace(/(\.[^\.]*$)/i, ""))
          if (checkduplicate)
            continue
          else
            util.logmsg("\ncheckduplicate is set to false, so a duplicate copy of this translation will be created in the database")
        }

        var temp = isoLangMap([jsondata['language']])
        // if the above fails, then we will have to detect the language
        if (!Array.isArray(temp)){
        util.logmsg("\nPlease specify the proper iso name of the language in json, Skipping this translation " + filename)
        continue;
        }
              // Assigning isoname of the language and it's isocode
      jsondata['language'] = temp[0]
      jsondata['iso'] = temp[1]

      if (update) {

        if (!fs.existsSync(path.join(linebylineDir, filename))) {
          util.logmsg("\nEdition with name " + filename.replace(/(\.[^\.]*$)/i, "") + " does not exist in the database")
          continue
        } else if (jsondata['name'] && filename.replace(/(\.[^\.]*$)/i, "") != jsondata['name']) {
          util.logmsg("\nYou are trying to change edition name to " + jsondata['name'] + " this should be done only in very rare cases only")
          if (fs.existsSync(path.join(linebylineDir, jsondata['name'] + '.txt'))) {
            util.logmsg("\nA Edition with same name as " + jsondata['name'] + " exists in the database, you will have to give a new edition name")
            continue
          }
        }
  
        // delete the old editions
        var oldEditionName = filename.replace(/(\.[^\.]*$)/i, "")
        deleteEditions([oldEditionName])
      }


        // generating edition
    util.logmsg("\nGenerating Edition")
    // if edition name exists in the file during update process, we will use that as edition name
    if (update && jsondata['name'])
      var genJSON = await generateEdition(cleanarr, jsondata, jsondata['name'])
    else
      var genJSON = await generateEdition(cleanarr, jsondata)

    if (update) {
      // if this is update operation, then we will give more preference to json data from file, instead of generated json data
      for (var [key, val] of Object.entries(genJSON)) {
        // we want the autogenerated link, linkmin and direction values
        if (jsondata[key] && !key.includes('link') && key != 'direction')
          genJSON[key] = jsondata[key]
      }
    }
        // move the file for which update/create have been completed from startDir to originals dir
        fs.renameSync(path.join(startDir, filename), path.join(databaseDir, "originals", filename))

        
      }
        // Generate the editions.json
  editionsListingsGen()
  // close the browser when everything is done
  await browser.close();

    

    
  

 }
    

 // This function is a wrapper to generate json and generate the files in the database
async function generateEdition(arr, jsondata, editionName) {
  var genJSON = {}
  // use the editionName to generateJSON if it's defined
  if (editionName)
    genJSON = await generateJSON(arr, jsondata, editionName)
  else
    genJSON = await generateJSON(arr, jsondata)

  // generate files in database
  generateFiles(arr, genJSON)
  // save the json data and snippet inside the jsondb variable
  await jsonDB(genJSON['name'] + '.txt')
  util.logmsg("\n Generated edition " + genJSON['name'])

  return genJSON
}


// function to delete list of editions from the database
// This will also remove the auto generated -la and -lad of edition
function deleteEditions(arr) {
  var deleted = false
  for (var val of arr) {
    for (var editionname of [val, val + '-la', val + '-lad']) {
      // array containing paths to delete
      var pathsarr = []
      pathsarr.push(path.join(editionsDir, editionname))
      pathsarr.push(path.join(editionsDir, editionname + '.json'))
      pathsarr.push(path.join(editionsDir, editionname + '.min.json'))
      pathsarr.push(path.join(linebylineDir, editionname + '.txt'))
      pathsarr.push(path.join(databaseDir, 'chapterverse', editionname + '.txt'))

      for (var pathToDelete of pathsarr) {
        if (fs.existsSync(pathToDelete)) {
          deleted = true
          if (fs.statSync(pathToDelete).isDirectory())
            fs.rmdirSync(pathToDelete, {
              recursive: true
            })
          else
            fs.unlinkSync(pathToDelete)
        }
      }
      // Deleting also from temporary jsondb variable
      delete jsondb[editionname + '.txt']
      util.logmsg("\n deletion completed for " + editionname)
    }
  }
  // Generate the editions.json if any of the file was deleted
  if (deleted)
    editionsListingsGen()
}

// reads the jsondb variable to generate editions.json
function editionsListingsGen() {
  var newjsondb = {}
  // we will always keep the editions.json in sorted order, so it's easier to find
  var sortedkeys = Object.keys(jsondb).sort()
  for (var name of sortedkeys) {
    // removing .txt from filename and replace dash with underscore as many programming languages doesn't support - (dash) in json object key
    var newname = name.replace(/\..*/gi, "").replace(/-/gi, "_")
    newjsondb[newname] = jsondb[name]['jsondata']
  }

  fs.writeFileSync(editionsDir + ".json", JSON.stringify(newjsondb, null, prettyindent))
  fs.writeFileSync(editionsDir + ".min.json", JSON.stringify(newjsondb))
  util.logmsg("\neditions.json and editions.min.json generated")
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

// Generates the json with standard naming conventions
async function generateJSON(arr, newjson, editionName) {

  var isocode = newjson['iso']
  // Deleting iso key, as it might create a bug in the future, as this key was added later to solve an issue in actions enviroment
  delete newjson['iso']
  // capitalize first letters
  newjson['language'] = capitalize(newjson['language'])
  // If values are undefined we will assign it as empty string
  newjson['author'] = newjson['author'] || "unknown"

  // Removing special symbols and diacritics from authors name
  newjson['author'] = newjson['author'].normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z\s\.\,]+/gi, " ").replace(/\s\s+/gi, " ").toLowerCase().trim()
  newjson['author'] = capitalize(newjson['author'])

  // If values are undefined we will assign it as empty string
  newjson['source'] = newjson['source'] || ""
  newjson['comments'] = newjson['comments'] || ""


  // Number of chars to consider in author name for editionName creation
  var authorSize = 15
  // Take first few chars of like 10chars for author to make editionName
  // editionName will be a foldername and also part of url, so cannot have anything other than latin alphabets
  if (!editionName)
    editionName = isocode + "-" + newjson['author'].toLowerCase().replace(/[^A-Za-z]+/gi, "").substring(0, authorSize);

  // first check file with same endpoint exists or not in editions.json, if there then we will add 1 to the editionname and check again
  for (var i = 1;; i++) {
    // If a filename with same edition name exists in database then add number to the editionName
    if (jsondb[editionName + '.txt'] || jsondb[editionName + '-la.txt'] || jsondb[editionName + '-lad.txt']) {
      // Fetch the number if exists in the editionName
      var Num = editionName.match(/\d+$/) || [0]
      Num = parseInt(Num[0])
      // Increment that number if it exists to get a new editionName
      editionName = editionName.replace(/\d+$/, "") + (Num + 1);
    } else
      break;
  }

  newjson['name'] = editionName
  newjson['link'] = url + editionsFolder + "/" + editionName + ".json"
  newjson['linkmin'] = url + editionsFolder + "/" + editionName + ".min.json"
  newjson['direction'] = await dirCheck(arr.slice(0, 10).join('\n'))

  // JSON in sorted order
  var sortjson = {}
  sortjson['name'] = newjson['name']
  sortjson['author'] = newjson['author']
  sortjson['language'] = newjson['language']
  sortjson['direction'] = newjson['direction']
  sortjson['source'] = newjson['source']
  sortjson['comments'] = newjson['comments']
  sortjson['link'] = newjson['link']
  sortjson['linkmin'] = newjson['linkmin']

  return sortjson
}
