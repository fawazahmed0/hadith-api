// Flags
// whether to check for duplicate translation or not during create
var checkduplicate = true;
// whether json is required in translation or not
var jsonrequired = true

const {
    cleanify,replaceInnerJSON,replaceJSON,streamRead,sortJSON,getJSONKeyByValue,renameInnerJSONKey,saveJSON, renameJSONKey,isObject,capitalize,getJSON,getJSONInArray,dirCheck,isoLangMap,readDBTxt,isValidJSON,cleanifyObject,logmsg
  } = require('../hadith/utilities.js')

const fs = require('fs');
const path = require('path');

  const {
    firefox
  } = require('playwright');


  
// Folder that holds all the translations that needs to be added
var startDir = path.join(__dirname, "start")
// Folder that holds all the hadith editions
var editionsFolder = "editions"
var editionsDir = path.join(__dirname, editionsFolder)
// Stores the files for download and as backup
var databaseDir = path.join(__dirname, 'database')
// Stores translations in line by line format of 6236 lines
var linebylineDir = path.join(databaseDir, 'linebyline')

var startUrl = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@"
var apiVersion = '1'
// API url
var url = startUrl + apiVersion + "/"

// Stores the translation files snippets and it's json,retreieves them from linebylineDir
var jsondb = {}
// spaces to be used for prettify/json.stringify
var prettyindent = '\t'

// stores iso codes
var isocodes;
//stores grades, books metadata etc
var metainfo;

// https://stackoverflow.com/a/5767589
// access node command line args
var argarr = process.argv.slice(2);
// Page to add translation text and get the direction of text and also for font generation
var page
// browser variable, to allow easily closing the browser from anywhere in the script
var browser
// stores hadith books count
var bookslength = {}

// We will make few directories, incase if they doesn't exists, this will help to run this script even if we
// partially cloned this repo
fs.mkdirSync(startDir, {
    recursive: true
  });
  fs.mkdirSync(editionsDir, {
    recursive: true
  });
  
  fs.mkdirSync(path.join(databaseDir, "originals"), {
    recursive: true
  });



// function that will run on running this script
async function start() {
    logmsg("BEGIN:\n" + process.argv.join(' '), true)
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
    console.log("\nsearch\nsearches the provided line in database\nExample: node ", filename, ' search "hadithTextToSearch"')
  }


// function that will generate the editions, it will take the files from startDir
async function create(update) {
      // saving database snippet, filename and it's json data in jsondb variable
  await jsonDB()
 // getting isocodes in json
 isocodes = await getJSON('https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/isocodes/iso-codes.min.json',true)
 metainfo = await getJSON(path.join(__dirname,'info.json'))
// get books count
 for(let key of Object.keys(metainfo))
 bookslength[key] = metainfo[key]["metadata"]["hadith_count"]
   // Launching browser as we will need it for checking direction of the language
   await launchBrowser()

     // Saving flags used
  logmsg("\nFlags Used\ncheckduplicate:" + checkduplicate + "\njsonrequired:" + jsonrequired, true)

    // Starting to read files in startDir
    for (var filename of fs.readdirSync(startDir)) {
    // we don't want to read .gitkeep, it is used as a placeholder for start direcotory to exist in git
    if (filename == '.gitkeep')
      continue;
    logmsg("\nStarting to create files for " + filename)

        // Reading the file and retrieving as array, filteredarr, and jsondata inside it
    // filterarr doesn't contain jsondata and empty lines in it
    var [orgjson, cleanjson, jsondata] = readDBTxt(path.join(startDir, filename))
    if(!orgjson)
    continue
    if (!jsondata) {
        logmsg("\nNo JSON found in file " + filename + " or please enter the json in correct format", true)
        jsondata = {}
        if (jsonrequired) {
          var tempjson = '{"author":"Name of Author","book":"Name of book","language":"Name of language","source":"","comments":""}'
          logmsg("\nAdd json at end of file in the following format:\n\n" + JSON.stringify(JSON.parse(tempjson), null, prettyindent))
          continue
        }
  
      }

          // Now we have to check and make sure same copy doesn't exists in the repo, here we will use the linebylineDir to check
    var duplicatefilename = checkduplicateTrans(cleanjson, linebylineDir)
        // We don't want to check for duplicates during update operation
        if (duplicatefilename && !update) {
            logmsg("\nThis file " + filename + " seems to be a duplicate copy of edition " + duplicatefilename.replace(/(\.[^\.]*$)/i, ""))
            if (checkduplicate)
              continue
            else
              logmsg("\ncheckduplicate is set to false, so a duplicate copy of this translation will be created in the database")
          }

                // Cleaning and lowercasing the json
      jsondata = cleanifyObject(jsondata)
       
      let bookName = jsondata['book']
            if(!Object.keys(bookslength).includes(bookName)){
                logmsg("\nNo correct book name found in json " + filename+" skipping this", true)
                logmsg("\nYou should set the book name to any of the following values\n"+Object.keys(bookslength), true)
                continue
              }
              if(!jsondata['language']){
                logmsg("\nPlease specify the language in json in " + filename)
                continue
              }
     // This will store the language name and isocode
     var temp = isoLangMap([jsondata['language']], isocodes)

     if (!Array.isArray(temp)){
     logmsg("\nPlease specify the proper iso name of the language in json, Skipping this translation " + filename)
     continue;
     }

                   // Assigning isoname of the language and it's isocode
                   jsondata['language'] = temp[0]
                   jsondata['iso'] = temp[1]

                      // check max number in the arr is less than or equal to books length
      let maxVal = Math.max(...Object.keys(cleanjson))
      
      if(maxVal>bookslength[bookName]){
        logmsg("\nThe max hadith number in the file " + filename + " is "+maxVal+" It larger than books length for "+bookName+ "it should be less than or equal to "+bookslength[bookName])
        continue
      }

          // if this is update operation
    if (update) {

        if (!fs.existsSync(path.join(linebylineDir, filename))) {
            logmsg("\nEdition with name " + filename.replace(/(\.[^\.]*$)/i, "") + " does not exist in the database")
            continue
          } else if (jsondata['name'] && filename.replace(/(\.[^\.]*$)/i, "") != jsondata['name']) {
            logmsg("\nYou are trying to change edition name to " + jsondata['name'] + " this should be done only in very rare cases only")
            if (fs.existsSync(path.join(linebylineDir, jsondata['name'] + '.txt'))) {
              logmsg("\nA Edition with same name as " + jsondata['name'] + " exists in the database, you will have to give a new edition name")
              continue
            }
          }
                // delete the old editions
      var oldEditionName = filename.replace(/(\.[^\.]*$)/i, "")
      deleteEditions([oldEditionName])

    }
        // generating edition
        logmsg("\nGenerating Edition")
            // if edition name exists in the file during update process, we will use that as edition name
    if (update && jsondata['name'])
    var genJSON = await generateEdition(cleanjson, jsondata, jsondata['name'])
  else
    var genJSON = await generateEdition(cleanjson, jsondata)
    if (update) {
        // if this is update operation, then we will give more preference to json data from file, instead of generated json data
        for (var [key, val] of Object.entries(genJSON)) {
          // we want the autogenerated link, linkmin and direction values
          
          if (jsondata[key] && !key.includes('link') && !['direction','has_sections'].includes(key))
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
async function generateEdition(json, jsondata, editionName) {
    var genJSON = {}
    // use the editionName to generateJSON if it's defined
      // use the editionName to generateJSON if it's defined
  if (editionName)
  genJSON = await generateJSON(json, jsondata, editionName)
  else
  genJSON = await generateJSON(json, jsondata)

    // generate files in database
    generateFiles(json, genJSON)
      // save the json data and snippet inside the jsondb variable
  await jsonDB(genJSON['name'] + '.txt')
  logmsg("\n Generated edition " + genJSON['name'])

  return genJSON


}

// Generate the files and folder for the edition in REST architecture
function generateFiles(json, jsondata) {
    // sort json in this order
    let sortByArr = ["name",'metadata','hadithnumber','arabicnumber','text','grades','section','reference']
    // We will generate the files and folders only if we are in github actions where CI env is set to trues and not on dev environment
  if(process.env.CI || true){
// generate whole edition first
    let fullEditionObj = {}
    let bookName = jsondata['book']
    fullEditionObj =  structuredClone(metainfo[bookName])
    let skeletonJSON = 	replaceInnerJSON(structuredClone(fullEditionObj["hadiths"][0]))
    skeletonJSON.text = ""
    for(let i=0;i<fullEditionObj["hadiths"].length;i++){
        // set the initial values to skeletonJSON
        for(let [key,value] of Object.entries(skeletonJSON)){
            if(!fullEditionObj["hadiths"][i][key])
            fullEditionObj["hadiths"][i][key] = value
        }

        let hadithNo = fullEditionObj["hadiths"][i].hadithnumber
        if(json[hadithNo])
        fullEditionObj["hadiths"][i].text = json[hadithNo]
        else
        fullEditionObj["hadiths"][i].text = ''
        fullEditionObj["hadiths"][i] = sortJSON(fullEditionObj["hadiths"][i],sortByArr)
      }
      // get hadith numbers which were not saved in fullEditionObj
      let hadithnumArr = fullEditionObj["hadiths"].map(e=>e.hadithnumber)
      let newHaditNumArr = Object.keys(json).filter(e=>!hadithnumArr.includes(parseFloat(e)))
      // check arabicnumber & hadith number can be same or not
      
      let middleHadith = metainfo[bookName]["hadiths"][parseInt(bookslength[bookName]/2)]
      let sameHadithNum = middleHadith.hadithnumber == middleHadith.arabicnumber ? true : false
      // we will save them also with skeleton
      for(let key of newHaditNumArr){
        // initial values to skeletonJSON
        let myObj = structuredClone(skeletonJSON)
        let hadithtext =  json[key]
        let num = parseFloat(key)
        myObj.hadithnumber = num
        if(sameHadithNum)
        myObj.arabicnumber = num
  
        myObj.text = hadithtext
        myObj = sortJSON(myObj,sortByArr)
        fullEditionObj["hadiths"].push(myObj)
  
      }
      // sort by hadith number
      fullEditionObj["hadiths"].sort((a,b)=>parseFloat(a.hadithnumber)-parseFloat(b.hadithnumber))
      delete fullEditionObj["metadata"].hadith_count
      //delete fullEditionObj["metadata"].has_sections

 
      
      saveJSON(fullEditionObj,path.join(editionsDir, jsondata['name'])+'.json',prettyindent)
      saveJSON(fullEditionObj,path.join(editionsDir, jsondata['name'])+'.min.json')
      let editionNamePath = path.join(editionsDir, jsondata['name'])
      let sectionsPath = path.join(editionNamePath, "sections")
      fs.mkdirSync(sectionsPath, {
        recursive: true
      });
      // generate sections
      for(let [key,value] of Object.entries(metainfo[bookName]["metadata"]["sections"])){
          let sectionObj = {}
          sectionObj["metadata"] = structuredClone(fullEditionObj["metadata"])
          sectionObj["hadiths"] = fullEditionObj["hadiths"].filter(e=>e["reference"].book==key)

          delete sectionObj["metadata"]["sections"]
          sectionObj["metadata"]["section"] = {} 
          sectionObj["metadata"]["section"][key] = value
          sectionObj["metadata"] = sortJSON(sectionObj["metadata"],sortByArr)
          saveJSON(sectionObj,path.join(sectionsPath,key+'.json'),prettyindent)
          saveJSON(sectionObj,path.join(sectionsPath,key+'.min.json'))
      }

            // generate single
        for(let value of fullEditionObj["hadiths"]){
            let singleObj = structuredClone(value)
            let sectionNum = singleObj["reference"].book
            let hadithNo = singleObj["hadithnumber"]
            singleObj["section"] = {}
            singleObj["section"][sectionNum] = fullEditionObj["metadata"]["sections"][sectionNum]
            singleObj =  sortJSON(singleObj,sortByArr)
            saveJSON(singleObj,path.join(editionNamePath,hadithNo+'.json'),prettyindent)
            saveJSON(singleObj,path.join(editionNamePath,hadithNo+'.min.json'))
        }


  }
    json = sortJSON(json,sortByArr)
    // saving in linebylinedir as backup
    fs.writeFileSync(path.join(linebylineDir, jsondata['name'] + ".txt"), Object.entries(json).map(e=>e.join(' | ')).join('\n') + '\n' + JSON.stringify(jsondata, null, prettyindent))
   

}

// Generates the json with standard naming conventions
async function generateJSON(json, newjson, editionName) {


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

  // Take bookname to make editionName
  // editionName will be a foldername and also part of url, so cannot have anything other than latin alphabets
  if (!editionName)
    editionName = isocode + "-" + newjson['book'].toLowerCase().replace(/[^A-Za-z]+/gi, "")

      // first check file with same endpoint exists or not in editions.json, if there then we will add 1 to the editionname and check again
  for (var i = 1;; i++) {
    // If a filename with same edition name exists in database then add number to the editionName
    if (jsondb[editionName + '.txt']) {
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
  newjson['direction'] = await dirCheck(Object.values(json).slice(0, 10).join('\n'), page)
  newjson['has_sections'] = metainfo[newjson['book']]["hadiths"][2]?.["reference"]?.["hadith"] ? true : false

    // JSON in sorted order
    var sortjson = {}
    sortjson['name'] = newjson['name']
    sortjson['book'] = newjson['book']
    sortjson['author'] = newjson['author']
    sortjson['language'] = newjson['language']
    sortjson['has_sections'] = newjson['has_sections']
    sortjson['direction'] = newjson['direction']
    sortjson['source'] = newjson['source']
    sortjson['comments'] = newjson['comments']
    sortjson['link'] = newjson['link']
    sortjson['linkmin'] = newjson['linkmin']
  
    return sortjson
}


// Stores the translation files snippets and it's json,retreieves them from linebylineDir
async function jsonDB(singlefile) {
    for (var filename of fs.readdirSync(linebylineDir)) {
 // if single file is defined, we will break the loop at end, we will only read that particular files data into jsondb object
 if (singlefile)
 filename = singlefile

var filepath = path.join(linebylineDir, filename)
var fileSize = fs.statSync(filepath).size
// read the first 2% bytes of file to be stored as snippet in jsondb object
var data = await streamRead(filepath, 0, parseInt(fileSize*0.02))

jsondb[filename] = {}
// taking verse from line 11 to 20 and storing it for searching and duplicate detection
jsondb[filename]['snippet'] = data.split(/\r?\n/).slice(10, 20).map(e=>e.replace(/^\d+\.?\d*\s*\|\s*/,'').trim()).join('\n')
// reading last 6k bytes of file to fetch json
data = await streamRead(filepath, fileSize - 6000)
// parse the json
jsondb[filename]['jsondata'] = getJSONInArray(data.split(/\r?\n/))[0]
// break the loop, as we only wanted to add one file
if (singlefile)
 break;


    }


}


// function to delete list of editions from the database
// This will also remove the auto generated -la and -lad of edition
function deleteEditions(arr) {


    var deleted = false
    for (var editionname of arr) {


        // array containing paths to delete
      var pathsarr = []
      pathsarr.push(path.join(editionsDir, editionname))
      pathsarr.push(path.join(editionsDir, editionname + '.json'))
      pathsarr.push(path.join(editionsDir, editionname + '.min.json'))
      pathsarr.push(path.join(linebylineDir, editionname + '.txt'))
  

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
            logmsg("\n deletion completed for " + editionname)


    }
      // Generate the editions.json if any of the file was deleted
  if (deleted)
  editionsListingsGen()
}

// reads the jsondb variable to generate editions.json
function editionsListingsGen() {
    var newjsondb = {}

    for(let key of Object.keys(metainfo).sort()){
    newjsondb[key] = {}
    newjsondb[key]["name"] = metainfo[key]["metadata"]["name"]
    newjsondb[key]["collection"] = []
    }

    for(let key of Object.keys(jsondb).sort()){
        let bookname = jsondb[key]['jsondata']['book']
        newjsondb[bookname]["collection"].push(jsondb[key]['jsondata'])
    }

    fs.writeFileSync(editionsDir + ".json", JSON.stringify(newjsondb, null, prettyindent))
    fs.writeFileSync(editionsDir + ".min.json", JSON.stringify(newjsondb))
    logmsg("\neditions.json and editions.min.json generated")
   
  }

// searches the string in whole linebyline database
function search(arr) {
    var found = false
    for (var val of arr) {
      for (var filename of fs.readdirSync(linebylineDir)) {
        var content = fs.readFileSync(path.join(linebylineDir, filename)).toString();
        str = cleanify(val)
        content = cleanify(content)
  
        if (content.includes(str)) {
          logmsg("\n Line: " + val + " contains in edition \n" + filename.replace(/(\.[^\.]*$)/i, ""))
          found = true
        }
      }
    }
    if (!found)
      logmsg("\n No edition found in the database")
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

  // Checks for duplicate files in the database
function checkduplicateTrans(json, pathToDir) {
    for (var filename of fs.readdirSync(pathToDir)) {
      if (cleanify(Object.values(json).join('\n')).includes(cleanify(jsondb[filename]['snippet'])))
        return filename
    }
  }