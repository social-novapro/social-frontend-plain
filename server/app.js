const express = require('express');
const path = require('path');
const requestIp = require('request-ip');
const {startUpLoading, files} = require('./loadFiles');

const app = express();
const PORT = 5500;

// require request-ip and register it as middleware
app.use(requestIp.mw({ attributeName : 'user-x-address' }))

// Call loadFiles at startup
startUpLoading();

// send the varible that stores all routes
app.get('/allroutes', (req, res) => {
    res.status(200).send(files);
})

// Serve dynamic files based on what's in the directory
app.get('*', (req, res) => {
    console.log('----')
    console.log('new request')
    const requestData = {
        referer: req.headers.referer,
        user_x_address: req['user-x-address'],
        user_agent: req.headers['user-agent']
    };

    console.log(requestData)
    var fileName = req.path; // or originalUrl
    // console.log(req)
    console.log("fileName", fileName)
    console.log("referer", req.headers.referer)

    // make sure ? is considered
    if (fileName.includes('?')) {
        const splitFile = fileName.split('?');
        fileName = splitFile[0]
    }

    const filePath = files[`${fileName}`];
    console.log("filepath", filePath)

    if (filePath) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
        console.log(files)
    }
});

// Serve static files like images, CSS from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
