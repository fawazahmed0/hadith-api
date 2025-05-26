const readline = require('node:readline')
const fsSync = require('fs')
const path = require('path')
const fs = require('fs/promises')

const pathToFile = path.join(__dirname, 'bukhari_fr_v1.jsonl')

const pathToOutFile = path.join(__dirname, 'fra-bukhari.txt')

async function begin() {
    let arr = await getNDJSON(pathToFile)

    let outArr = []
    for (let value of arr) {
        outArr.push(`${value.arabic_number} | ${value.french}`)
    }

    await fs.writeFile(pathToOutFile, outArr.map(e=>e.replace(/\r?\n/gi, " ")).join('\n'), 'utf8')

}

async function getNDJSON(pathToNDJSON) {
    let arr = []
    const rl = readline.createInterface({
        input: fsSync.createReadStream(pathToNDJSON),
        crlfDelay: Infinity,
    })
    for await (const line of rl)
        arr.push(JSON.parse(line))
    return arr
}
begin()
