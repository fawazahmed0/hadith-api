const {
    mode, cleanify,replaceInnerJSON,replaceJSON,streamRead,sortJSON,getJSONKeyByValue,renameInnerJSONKey,saveJSON, renameJSONKey,isObject,capitalize,getJSON,getJSONInArray,dirCheck,isoLangMap,readDBTxt,isValidJSON,cleanifyObject,logmsg
    } = require('./utilities.js')
const path = require('path')
const fs = require('fs')
let sortByArr = ["name",'metadata','hadithnumber','arabicnumber','text','grades','section','sections','reference']

async function test(){
    let metaPath = path.join(__dirname, 'info.json')
    let metainfo = await getJSON(metaPath)
   
    for(let [key, value] of Object.entries(metainfo)){

       // add zeros to sections, for proper sections generation
        if(!metainfo[key].metadata.sections["0"] && metainfo[key].metadata.sections["1"])
        metainfo[key].metadata.sections["0"]= ''

        // sort
        metainfo[key] = sortJSON(metainfo[key],sortByArr)
        // sort metadata
        metainfo[key]["metadata"] = sortJSON(metainfo[key]["metadata"],sortByArr)
        // create skeletonjson
        let skeletonJSON = 	replaceInnerJSON(structuredClone(metainfo[key]["hadiths"][0]))
        // sort by numbers
        metainfo[key]["hadiths"].sort((a,b)=>parseFloat(a.hadithnumber)-parseFloat(b.hadithnumber))
        for(let i=0;i<metainfo[key]["hadiths"].length;i++){
            // set default skeleton values for undefined values
            for(let [innerkey,innervalue] of Object.entries(skeletonJSON)){
                if(!metainfo[key]["hadiths"][i][innerkey])
                metainfo[key]["hadiths"][i][innerkey] = innervalue
            }
            metainfo[key]["hadiths"][i] =  sortJSON(metainfo[key]["hadiths"][i],sortByArr)
        }
        

    }

    saveJSON(metainfo,metaPath,'\t')
}
test()