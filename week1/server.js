// console.log("Hello from JavaScript")
// console.log("No ; ")
// console.log("No ; ")

let http = require('http');
let fs = require('fs');

 
let myServer = http.createServer(myRequestHandler)

myServer.listen(8080);
function myRequestHandler(req,res){
// this function will respond to incoming requests

//this will return any url that you type behind"http://localhost:8080/"    
let path = req.url;
console.log("Incoming request at",path);
console.log("server read form this dircroty", __dirname)
//fs.readFile(__dirname);

let filePath = __dirname + path;
console.log('requestingn the ', filePath);

//check the statement of error

fs.readFile(filePath, function(err,data){
    
        if(err){
            console.log('there is no data');
            res.writeHead(500);
            res.end('faild to access the file');
            return;
        }

        console.log('got the data, respond to the client');
        res.writeHead(200);
        res.end(data);
    })
}