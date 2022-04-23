// This only works in linux environment properly due to tar --delete thing, which is in linux
const tar = require('tar');
const fs = require('fs');
const path = require('path');
const util = require('util')
const exec = util.promisify(require('child_process').exec)

let filesArr = [];
let tarballName = 'mytarball.tar'
let tarballPath = path.join(__dirname,tarballName)
let foldersToExclude = ['node_modules','.git','originals','start',tarballName,tarballName+'.gz']
let tarballOptions =  {file: tarballName, prefix: 'dir'}
let update = false

const getEntryFilenames = async tarballFilename => {
  const filenames = []
  await tar.t({
    file: tarballFilename,
    onentry: entry => filenames.push(entry.path),
  })
  return filenames
}
  async function test(){
    traverseDir('.',foldersToExclude)
    let filesObj = {}
    for (let value of filesArr)
    filesObj[value] = fs.statSync(value).size
    filesObj= sortJSONbyValue(filesObj)

    if(fs.existsSync(tarballPath))
    update=true
 
    //compression ratio for 7zip
    let compressionRatio = 6.6
    let sizeLimit = 195 * 1000000 //195MB
    sizeLimit*=compressionRatio



    let cleanFilesArr=[],sum=0;
    // get tarball files list
    let tarballFiles = []
    if(update){
      sum+=fs.statSync(tarballPath).size
      tarballFiles = await getEntryFilenames(tarballPath)
    }
  

    for (let [key,value] of Object.entries(filesObj)) {
       // don't add sizes for files from tarball, as we have already added the whole tarball size to sum
      if(!tarballFiles.includes(tarballOptions.prefix+'/'+key.split(path.sep).join('/')))
        sum+=value
        if(sum>sizeLimit)
        break

      cleanFilesArr.push(key)
    }


   //update tar
    if(update){
  

       // delete files from tarball
      let toDeleteFiles = cleanFilesArr.map(e=>tarballOptions.prefix+'/'+e.split(path.sep).join('/')).filter(e=>tarballFiles.includes(e))
      // take n files at a time to avoid exec issues
      let batchArr = TwoDimensional(toDeleteFiles, 1000) 
      for(let batch of batchArr)
      try{await exec('tar --delete --file='+tarballName+' '+batch.join(' '), { maxBuffer: Infinity })}catch(e){}
      
      // now update tarball with new files
      await tar.r(tarballOptions,cleanFilesArr)
    }
    //create tarball
      else
      await tar.c(tarballOptions, cleanFilesArr)



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

function TwoDimensional(arr, size) 
{
  var res = []; 
  for(var i=0;i < arr.length;i = i+size)
  res.push(arr.slice(i,i+size));
  return res;
}
