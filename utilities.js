const fs = require('fs');
const path = require('path')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));



function renameInnerJSONKey(obj, oldKey, newKey){

    for(let [key, value] of Object.entries(obj)){
        if(isObject(value))
            renameInnerJSONKey(value, oldKey, newKey)
        if(key == oldKey)
            renameJSONKey(obj, oldKey, newKey)
    }
    }

    function renameJSONKey ( obj, oldKey, newKey ) {
      obj[newKey] = obj[oldKey];
      delete obj[oldKey];
    }
    // replace json values with default values
    function replaceInnerJSON(obj,num=0, arr=[], inner){

      for(let key of Object.keys(obj)) {
        if(isObject(obj[key])) {
            obj[key] = replaceJSON(obj[key],num, arr)
            replaceInnerJSON(obj[key],num,arr,true);
        }

    }
    obj = replaceJSON(obj,num, arr)
    if(!inner) 
    return obj

    }

    function replaceJSON(obj,num=0,arr=[]){

      for(let [key, value] of Object.entries(obj)){
        if(Array.isArray(value))
          obj[key] = arr
        else if(!isNaN(value))
          obj[key] = num

      }
      return obj
    }



  // values in arr is given first preferences & then by alphabetical order

  
  // values in arr is given first preferences & then by alphabetical order
    function sortJSON(jsonObj,arr=[]){
      let objectKeys = Object.keys(jsonObj)
      // sort numbers properly
      if(!objectKeys.some(isNaN))
      objectKeys.sort((a, b) => parseFloat(a)-parseFloat(b))
      else
      objectKeys.sort()

      return arr.concat(objectKeys).reduce(
          (obj, key) => { 
            if(jsonObj[key])
            obj[key] = jsonObj[key]; 
            return obj;
          }, 
          {}
        );
  
    }



function isObject(obj) {
    return obj === Object(obj);
  }

const capitalize = words => words.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, match => match.toUpperCase()).trim()

async function getJSON(path, isLink){
    if(isLink)
    return await fetch(path).then(res => res.json())
    return JSON.parse(fs.readFileSync(path).toString())
}

// gets the JSON from end of array, returns [jsondata, i], where i is the position from end where jsondata was parsed successfully
function getJSONInArray(arr) {
    var i = 0
    while (!isValidJSON(arr.slice(--i).join('\n')) && i > -100);
    if (i != -100)
      return [JSON.parse(arr.slice(i).join('\n')), i]
  }


// This function checks the direction of the language and returns either rtl or ltr
// https://playwright.dev/#version=v1.3.0&path=docs%2Fcore-concepts.md&q=evaluation
async function dirCheck(str,page) {
    var result = await page.evaluate(str => {
      var divelem = document.createElement("div");
      divelem.dir = "auto"
      divelem.innerHTML = str;
      document.body.appendChild(divelem)
      return window.getComputedStyle(divelem).getPropertyValue('direction')
    }, str);
    return result
  }
  
  // Returns the iso name ,iso2 of the language
function isoLangMap(arrval,isocodes) {
    for (var [lang, val] of Object.entries(isocodes)) {
      if (arrval[0].toLowerCase().replace(/[^A-Za-z\(\)]+/gi, "").trim() == lang.toLowerCase().replace(/[^A-Za-z\(\)]+/gi, "").trim())
        return [lang, val.iso2]
    }
    if (arrval[1]) {
      for (var [lang, val] of Object.entries(isocodes)) {
        if (val.iso1 == arrval[1] || val.iso2 == arrval[1])
          return [lang, val.iso2]
      }
    }
  }
 // reads the text file and returns [originaljson, cleanedjson, cleanarr jsondata]
// orignalarr  orignalfile as json,
// cleanedjson - No empty lines in it & no numbers etc
// jsondata - JSON data at the end of file, return undefined if doens't exists
function readDBTxt(pathToFile) {
    var orgarr = fs.readFileSync(pathToFile).toString().split(/\r?\n/)

    // now remove all lines with empty strings or spaces or tabs
    // https://stackoverflow.com/a/281335
    // return elememnt only if they are not spaces/tabs and emptyline
  //  var filterarr = orgarr.filter(elem => !/^\s*$/.test(elem))
    // search & validate JSON in array
    var temp = getJSONInArray(orgarr)
    // If the json exists, then Remove the json from the file
    if (Array.isArray(temp))
        orgarr = orgarr.slice(0, temp[1])

                // find index of element which doesn't follow pattern of number | text
                let indexProblem = orgarr.findIndex(e=>!/^\d+\.?\d*\s*\|\s*/.test(e) && !/^\s*$/.test(e))
                if(indexProblem != -1){
                  logmsg("problem at index "+indexProblem+" in file "+path.basename(pathToFile)+" skipping this")
                  return
                }
        // convert it into json for ease
        var orgjson = orgarr.map(e=>[e.split('|')[0].trim(),e.split('|').slice(1).join(' ').trim()])
        orgjson = Object.fromEntries(orgjson)
       // remove empty lines from json
       cleanjson = validateCleanTrans(orgjson)
       //sort the decimals in json
       cleanjson = sortJSON(cleanjson)
  // If the json exists then return json with the array
  if (Array.isArray(temp))
      return [orgjson, cleanjson , temp[0]]
  // return without json
  return [orgjson, cleanjson]
  } 


function validateCleanTrans(json) {
  // remove empty values from json
  Object.keys(json).forEach(k => !json[k] && delete json[k]);
  return cleanTrans(json)

}

// Cleaning translation from numbers, special symbols etc
function cleanTrans(json) {
  for (let key of Object.keys(json)) {
    // https://en.wikipedia.org/wiki/List_of_Unicode_characters#Basic_Latin
    // This will remove all special symbols and numbers from starting and special symbols ending of verse
    json[key] = json[key].replace(/^[\u0020-\u0040|\u005b-\u0060|\u007b-\u007e|\s|\n|\r]{1,20}/, " ").replace(/^\s*\w{1}\s*(\.|\)|\}|\>|\])+[\u0020-\u0040|\u005b-\u0060|\u007b-\u007e|\s|\n|\r]{0,7}/i, " ").replace(/[\u0020-\u002F|\u005b-\u0060|\u007b-\u007e|\s|\n|\r]{1,15}$/, " ").replace(/[\r\n]/g, " ").replace(/\s\s+/g, " ").trim()
    // Checking partially open/close bracket exists or not at begninning of verse
    var bracket1 = json[key].match(/^[^\[|\(|\<|\{]+(\]|\)|\>|\})/)
    // Checking partially open/close bracket exists or not at end of verse
    var bracket2 = json[key].match(/(\[|\(|\<|\{)[^\]|\)|\>|\}]+$/)

    // closing partially open/close bracket in the verse
    // closing partially open/close bracket at the beginning of verse
    if (bracket1)
      json[key] = getOppoBracket(bracket1[0].slice(-1)) + json[key]
    // closing partially open/close bracket at the end of verse
    if (bracket2)
      json[key] = json[key] + getOppoBracket(bracket2[0].slice(0, 1))
  }
  return json
}

// returns opposite bracket
function getOppoBracket(str) {
  switch (str) {
    case '(':
      return ')'
    case ')':
      return '('
    case '<':
      return '>'
    case '>':
      return '<'
    case '[':
      return ']'
    case ']':
      return '['
    case '{':
      return '}'
    case '}':
      return '{'
    default:
      return ''
  }
}



// function which checks whether a string is valid json or not
function isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  // cleans the json
function cleanifyObject(jsondata) {
    // lowercase for all json , trimming white spaces and also removing empty json and also cleaning the keys and values
    //https://stackoverflow.com/a/54985484/2437224
    var newjson = Object.fromEntries(
      Object.entries(jsondata).map(([k, v]) => {
        if (v != undefined && typeof v !== 'boolean' && v)
          return ["" + k.replace(/[^A-Za-z]+/gi, "").trim().toLowerCase(), "" + v.replace(/\s\s+/gi, " ").trim()]
        return ["", ""]
      })
    );
    // removing empty keys
    delete newjson[""]
    return newjson
  }

  // clean the string from special symbols,numbers,multiple spaces etc , this is used for string comparision
function cleanify(str) {
  return str.replace(/[\u0020-\u0040|\u005b-\u0060|\u007b-\u007e|\s|\n]+/gi, " ").replace(/^\s*\w{1}\s+/i, " ").replace(/\s\s+/g, " ").trim().toLowerCase()
}

// Stores all the log, to help in reviewing PR and checking for any mistake by the user
function logmsg(str, skipconsole) {
  
  fs.appendFileSync(path.join(path.dirname(process.argv[1]),'log.txt'), '\n'+str)
  if (!skipconsole)
    console.log(str)
}

function saveJSON(jsondata, pathToFile, indent) {
    if(indent)
    fs.writeFileSync(pathToFile,JSON.stringify(jsondata,null,indent))
    else
    fs.writeFileSync(pathToFile,JSON.stringify(jsondata))
  }
  function getJSONKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

// reads the file using streams, start is the starting byte and end is the bytes to read
async function streamRead(pathtofile, start, end) {
  var readstream;
  if (start && !end)
    readstream = fs.createReadStream(pathtofile, {
      start: start
    });
  else if (!start && end)
    readstream = fs.createReadStream(pathtofile, {
      end: end
    });
  else if (!start && !end)
    readstream = fs.createReadStream(pathtofile);
  else
    readstream = fs.createReadStream(pathtofile, {
      start: start,
      end: end
    });

  var data = ''
  for await (var chunk of readstream) {
    data = data + chunk.toString()
  }
  return data
}

function mode(arr){
  return arr.sort((a,b) =>
        arr.filter(v => v===a).length
      - arr.filter(v => v===b).length
  ).pop();
}

module.exports = {
  mode,cleanify,replaceInnerJSON,replaceJSON,streamRead,sortJSON,getJSONKeyByValue,renameInnerJSONKey,saveJSON, renameJSONKey,isObject,capitalize,getJSON,getJSONInArray,dirCheck,isoLangMap,readDBTxt,isValidJSON,cleanifyObject,logmsg
};
