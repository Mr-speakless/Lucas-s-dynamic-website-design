//environment build
//with WSL and installed with node.js --> %install nodejs
//%npm i install
//%npm install express

// requier is a Global Object from Node.js, it is used to load a module.
// The 'express' variable now holds the Express factory function.
let express = require('express');

//create an app to handle the HTTP request
let app = express();// Instantiate the Express application object.

// The 'app.listen()' method is used to bind and listen for connections on the specified host and port.
// app.listen() returns an instance of the http.Server object.
app.listen(3000, function() 
{   //adding a callbcak function
    console.log('the server is listing at http://localhost:3000');
})

//serve statc HTML to the client
// The 'app.use()' method registers a middleware function that will be executed for every incoming request.
// 'express.static()' is a built-in Express method (factory function).
// This returned function handles serving static files (HTML, CSS, images, etc.).
//eventually return the index page from public folder
app.use(express.static('public'));

//handle JSON docment
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//set an array of the link
//let sketchLink = [];

// set an array to restore the time
let timer = [];
// set an array to restore text
let capsuleText = [];

//post handaler
//receive the post information form the form
//app.post registers a route handler（callback function） for incoming HTTP POST requests
app.post('/uploadSketch', upLoadSketchPostRequestHandler);
function upLoadSketchPostRequestHandler(req,res){
    //Explain for req and res: express will automatically created a request and response obejct to req and res
    //req contains all information form the client
    //res contains all methods for sending output back to the client.

    //give the link of the value from req.body.sketchEmbedLink
    //req have all rhe information form the client,body is a sub-component of the req
    //sketchEmbedLink have to be the same name lable of the content that you want to get
    // let link = req.body.sketchEmbedLink;
    // console.log(link);
    // sketchLink.push(link);
    // console.log('how many sketch link do we have? we have ', sketchLink.length);
    // res.send('thank you for your link');

    //give the time to the array
    let time = req.body.releaseTime;
    console.log('the capsule will release at: ',time);
    timer.push(time);

    //set the text to the text array
    let text = req.body.capsule_Text;
    console.log('the capsule text is: ', text);
    capsuleText.push(text);

    //response to the user
    res.send('your time capsule has been set');
}


//upload handaler
//upload the command to the gallery 'index.html'
app.get('/', myCapsuleHandler);
function myCapsuleHandler(req,res){
    //hand write a dynamic HTML
    // let galleryHTML = '<head><link rel="stylesheet" type="text/css" href="sketchGallery.css"></head>'
    // galleryHTML += "<body>"
    //     galleryHTML += '<h1>Welcome to the gallery!</h1>'
    //     galleryHTML += "<div id='sketchGalleryDiv'>";
    //         for (let i = 0; i < sketchLink.length; i++){
    //             galleryHTML += sketchLink[i];
    //         }
    //     galleryHTML +="</div>";
    // galleryHTML += "</body>"

    // Create a JavaScript Date object for the current time
    const now = new Date();

    //writing the HTML part
    let capsuleHTML = '<!DOCTYPE html><html lang="en"><head><link rel="stylesheet" type="text/css" href="capsule.css"></head>'
    capsuleHTML += '<body>'
        capsuleHTML += '<h1>Time Capsules</h1>'
        for (let i = 0; i < timer.length; i++){
            //get the information
            //convert the string to a Date object
            const releaseTime = new Date(timer[i]);
            const message = capsuleText[i];

            // set a div with each capsule
            capsuleHTML += '<div class="capsule-entry">';
                if(now >= releaseTime){
                    // if the time has already come "show the text"
                    capsuleHTML += '<h2>🎉 UNSEALED CAPSULE! 🎉</h2>';
                    capsuleHTML += `<p class="message-unsealed">Message ${i+1} from the past:${message}</p>`;
                    capsuleHTML += `<p class="timestamp">Message is come from: ${releaseTime.toLocaleString()}</p>`;
                }
                else{
                    capsuleHTML += '<h2>⏳ Time Capsule Sealed 🔒</h2>';
                    capsuleHTML += `<p class="message-sealed">The capsule will be released at ${releaseTime.toLocaleString()}</p>`;
                }
            capsuleHTML += '</div>';

        }

        // if the time has aready come "show the text"
        //else show "the capsule will be released at ' the time' "
    capsuleHTML += '</body>'
    //send the dynamic HTML beck to the webpage
    // res.send(galleryHTML);
    res.send(capsuleHTML);
}



