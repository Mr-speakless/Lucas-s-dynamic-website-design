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
app.listen(3000, function () {   //adding a callbcak function
    console.log('the server is listing at http://localhost:3000');
})

//serve statc HTML to the client
// The 'app.use()' method registers a middleware function that will be executed for every incoming request.
// 'express.static()' is a built-in Express method (factory function).
// This returned function handles serving static files (HTML, CSS, images, etc.).
//eventually return the index page from public folder
app.use(express.static('public'));

//tell the express app 'view-engine' to process the 'ejs'
app.set('view-engine', 'ejs');

//handle JSON docment
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//set an array of the link
//let sketchLink = [];

// set an array to restore the time
let timer = [];
// set an array to restore text
let capsuleText = [];
// set an array to restore verification codes
let capsuleCodes = [];

// Helper function to generate a 4-digit code
function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

//post handaler
//receive the post information form the form
//app.post registers a route handler（callback function） for incoming HTTP POST requests
app.post('/uploadSketch', upLoadSketchPostRequestHandler);
function upLoadSketchPostRequestHandler(req, res) {
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
    console.log('the capsule will release at: ', time);
    timer.push(time);

    //set the text to the text array
    let text = req.body.capsule_Text;
    console.log('the capsule text is: ', text);
    capsuleText.push(text);

    // Generate and store the verification code
    let code = generateCode();
    console.log('the verification code is: ', code);
    capsuleCodes.push(code);

    //response to the user with the code
    res.send(`
        <html>
                <head><title>Capsule Set!</title><link rel="stylesheet" type="text/css" href="/capsule.css"></head>
                <body>
                    <div class="capsule-entry">
                        <h1>⏳ Time Capsule Sealed! ⏳</h1>
                        <p>Your capsule will unlock on ${time}.</p>
                        <p><strong>Your verification code is: ${code}</strong></p>
                        <p>Please remember this code, you will need it to open the capsule!</p>
                        <a href="/capsules">View All Capsules</a>
                        <br>
                        <a href="/">Create Another Capsule</a>
                    </div>
                </body>
        </html>
    `);
}


//upload handaler
//upload the command to the gallery 'index.html'
app.get('/capsules', myCapsuleHandler);
function myCapsuleHandler(req, res) {
    // Create a JavaScript Date object for the current time
    const now = new Date();

    //writing the HTML part
    let capsulesData = [];
    for (let i = 0; i < timer.length; i++) {
        const releaseTime = new Date(timer[i]);
        capsulesData.push({
            id: i, // Pass the index (ID)
            releaseTime: releaseTime,
            isReady: (now >= releaseTime) // Pass a boolean if it's ready
        });
    }

    // Render the 'capsules.ejs' template and pass the data to it
    res.render('capsules.ejs', {
        capsules: capsulesData
    });
}

// Add a new route to handle the verification code form submission
app.post('/view', function (req, res) {
    // Get the ID and submitted code from the form
    const id = req.body.id;
    const submittedCode = req.body.code;

    // Retrieve the correct data from our arrays
    const correctCode = capsuleCodes[id];
    const message = capsuleText[id];
    const releaseTime = new Date(timer[id]);

    let renderData;

    // Check if the code is correct
    if (submittedCode === correctCode) {
        // Correct code! Prepare data for success page
        renderData = {
            success: true,
            message: message,
            releaseTime: releaseTime.toLocaleString()
        };
    } else {
        // Incorrect code! Prepare data for failure page
        renderData = {
            success: false,
            message: null,
            releaseTime: null
        };
    }

    // Render the 'view.ejs' page with the results
    res.render('view.ejs', renderData);
});



