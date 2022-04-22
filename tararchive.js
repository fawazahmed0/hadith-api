const tar = require('tar');
const fs = require('fs');
const path = require('path');

let filesArr = [];
let tarballName = 'mytarball.tar'
let foldersToExclude = ['node_modules','.git','originals','start',tarballName,tarballName+'.gz']
  async function test(){
    traverseDir(path.join('..',path.basename(__dirname)),foldersToExclude)

    let filesObj = {}
    for (let value of filesArr)
    filesObj[value] = fs.statSync(value).size

    filesObj= sortJSONbyValue(filesObj)
    //compression ratio for 7zip
    let compressionRatio = 12
    let sizeLimit = 195 * 1000000 //195MB
    sizeLimit*=compressionRatio


    let cleanFilesArr=[],sum=0;
    for (let [key,value] of Object.entries(filesObj)) {
        sum+=value
        if(sum>sizeLimit)
        break

      cleanFilesArr.push(key)
    }



    //create tar
    await tar.c(
        {
          file: tarballName
        },
        cleanFilesArr
      )

  }



test()




function traverseDir(dir,foldersToExclude) {
 
    fs.readdirSync(dir).filter(e=>!foldersToExclude.includes(e)).forEach(file => {
      let fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
         traverseDir(fullPath,foldersToExclude);
       } else {
        filesArr.push(fullPath);
       }  
    });

  }

function sortJSONbyValue(json){
  let entries  =   Object.entries(json).sort((a,b) => b[1] -  a[1] )
  return Object.fromEntries(entries)
}