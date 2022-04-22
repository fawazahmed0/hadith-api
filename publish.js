let fs = require('fs');
let path = require('path')
var RegClient = require('npm-registry-client')
var client = new RegClient({scope: '@fawazahmed0'})

let packagePath = path.join(__dirname,'package.json')
// path to package json
let metadata = JSON.parse(fs.readFileSync(packagePath).toString())

let tarballPath = path.join(__dirname,'mytarball.tar.gz')

var baseuri = "https://registry.npmjs.org/"
var uri = baseuri + 'npm'

let npmToken = fs.readFileSync(path.join(__dirname,'..','npmtoken.txt')).toString().trim()


// location of tar.gz file
const readable = fs.createReadStream(tarballPath)
var params = {access:'public', body: readable, auth: {token:npmToken}, metadata: metadata}



client.publish(uri, params, function (error, data, raw, res) {
  // error is an error if there was a problem.
  // data is the parsed data object
  // raw is the json string
  // res is the response from couch
   // if (!error) 
   //   client.unpublish(baseuri+metadata.name, {"version":decrementVersion(metadata.version),auth: {token:npmToken}}, function (error, data, raw, res) {})

})

function decrementVersion(semver){
  let version = semver.split('.').map(e=>parseInt(e))
  version[2]-=1
  return version.join('.')

}

