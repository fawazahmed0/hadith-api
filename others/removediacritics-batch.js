const fs = require('fs/promises')
const fsSync = require('fs')
const path = require('path')
const { readDBTxt } = require('./utilities')

/*
Whenever you want to create or update arabic edition, then use this script to create secondary non-diacritics arabic edition
The files generated and be directly placed in start directory, without any need for futher modification
*/

// Keep the primary arabic edition in input Directory
// This script will generate non diacritics version in output Directory

const pathToInputDir = path.join(__dirname, "input")
const pathToOutputDir = path.join(__dirname, "output")

fsSync.mkdirSync(pathToOutputDir, { recursive: true })

async function main() {
    for (let filePath of (await listDirRecursive(pathToInputDir))) {
        let pathobj = path.parse(filePath)
        let [orgjson, cleanjson, jsondata] = await readDBTxt(filePath)
        if ("name" in jsondata)
            jsondata["name"] += 1
        jsondata["comments"] = "Diacritics removed for easier searching"

        let outputText = Object.entries(orgjson).map(e => `${e[0]} | ${e[1]}`).join('\n') + '\n' + JSON.stringify(jsondata, null, 4)
        outputText = outputText.normalize("NFD").replace(/\p{Diacritic}|\p{Mark}|\p{Extender}|\p{Bidi_Control}/gu, "").replaceAll('ٱ', 'ا')
        let outputPath = path.join(pathToOutputDir, `${pathobj.name}1${pathobj.ext}`)
        await fs.writeFile(outputPath, outputText)
    }
}
main()


// lists all files and directories in folder, returns full path
async function listDirRecursive(pathToDir, onlyFiles, onlyDir) {
    let result = await fs.readdir(pathToDir, { withFileTypes: true, recursive: true })
    if (onlyFiles)
        result = result.filter(e => e.isFile())
    else if (onlyDir)
        result = result.filter(e => e.isDirectory())

    return result.map(e => path.join(e.parentPath, e.name))

}