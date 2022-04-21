const {
    mode, cleanify,replaceInnerJSON,replaceJSON,streamRead,sortJSON,getJSONKeyByValue,renameInnerJSONKey,saveJSON, renameJSONKey,isObject,capitalize,getJSON,getJSONInArray,dirCheck,isoLangMap,readDBTxt,isValidJSON,cleanifyObject,logmsg
    } = require('./utilities.js')
const path = require('path')
const fs = require('fs')

let gradesValues = `mawdu
maqtu
mauquf
sahih
daif
munqar
batil
mursal
hasan
shadh`.trim().split('\n').map(e=>e.trim())

//let gradesReg = new RegExp('('+gradesValues.join('|').replace(/\|$/,'')+')','gi')


    async function test(){

        let metaPath = path.join(__dirname, 'info.json')
        let metainfo = await getJSON(metaPath)
        let good = false
        let graderName = "Shuaib Al Arnaut"
        for(let [key,value] of Object.entries(metainfo)){
            
            for(let data of metainfo[key]["hadiths"]){
                if(Array.isArray(data.grades)){
                good=false
                for(let grade of data.grades){
                    if(grade.name==graderName){
                        for(let gradeval of gradesValues){
                            if(grade.grade.toLowerCase().includes(gradeval) && data.grades.filter(e=>e.grade.toLowerCase().includes(gradeval)).length>1){
                                good=true
                            }

                        }
                    }
                }
                if(!good)
                data.grades=   data.grades.filter(e=>e.name!=graderName)
                
            }
            }

        }
        saveJSON(metainfo,metaPath,'\t')

    }

 test()