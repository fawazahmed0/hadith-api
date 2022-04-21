const {
    mode, cleanify,replaceInnerJSON,replaceJSON,streamRead,sortJSON,getJSONKeyByValue,renameInnerJSONKey,saveJSON, renameJSONKey,isObject,capitalize,getJSON,getJSONInArray,dirCheck,isoLangMap,readDBTxt,isValidJSON,cleanifyObject,logmsg
    } = require('./utilities.js')
const path = require('path')
const fs = require('fs')

async function test(){
    let metaPath = path.join(__dirname, 'info.json')
    let metainfo = await getJSON(metaPath)
    // add zeros
    for(let [key, value] of Object.entries(metainfo)){
        if(!metainfo[key].metadata.sections["0"] && metainfo[key].metadata.sections["1"])
        metainfo[key].metadata.sections["0"]= ''
    }

    saveJSON(metainfo,metaPath,'\t')
}
test()