/* */
const exec = require('child_process').exec;
const lib = require(__dirname + '/../../../_lib/lib.js');

async function getHeaders(req, res) {
  let url = req.params[0];
  let headers = [];
  let header = {};
  let error = {};
  // console.log('getHeaders ... ', url);
  let count = 0; // avoid infinite redirection loop
  let notMoreRedirections = false;
  do {
    try {
      header = await doCurlCommand(`curl -fsSI ${url}`);
    } catch (err) {
      console.log('FAIL =>', err); // "curl: (6) Could not resolve host:"
      error.error = err.slice(err.indexOf(")") + 2).split("\n")[0];
      lib.sendResult(req, res, error, 400);
      return;    
    }
    headers.push(parseHeadString(header));
    //console.log('HEADER =>', header);
    if (header.indexOf("Location") === -1) {
      if (header.indexOf("location") === -1) {
        notMoreRedirections = true;
      } else {
        url = headers[count].location;
      }
    } else {
      url = headers[count].Location;
    }
    count++;
  } while (!notMoreRedirections && count<10);
  lib.sendResult(req, res, headers, 200);
}

function parseHeadString(str) { 
  let res = {};
  str = str.split("\r\n");
  // protocol and status code is the first line
  const name = str[0].split(" ")[0];
  const value = str[0].split(" ")[1];
  let last;
  res[name] = value;
  for (let line = 1; line < str.length; line++) {
    const name = str[line].split(": ")[0];
    const value = str[line].split(": ")[1];
    if (name === "Location") {
      last = value;
    } else {
      res[name] = value;
    }
  }
  // last line is location if exist
  if (last) {
    res["Location"] = last;
  }
  return res;
}

function doCurlCommand (command) {
  //console.log('Command ...', command);
  return new Promise((resolve, reject) => {
    lib.linuxCommand(command, function (err, res) {
      if (err) {        
        console.log('Err => ', err.curl);
        reject(res);
      }
      resolve(res);
    });
  });
}


module.exports = {
  getHeaders: getHeaders
};

