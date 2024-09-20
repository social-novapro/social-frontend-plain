const fs = require('fs');
const path = require('path');
const possibleExtensions = ["html", "js", "png", "css", "jpg", "ico", "json"];

// Cache for storing file paths
let files = {};

const userDirectory = path.join(__dirname, '../html');

// Read all files from a directory at startup
function loadFiles(dir, subdir) {
    console.log('----')
    console.log(`loading directory: ${subdir}`)
    console.log("dir", dir)
    console.log("subdir", subdir)

    fs.readdir(dir, (err, fileList) => {
        if (err) {
            console.error('Error reading user directory:', err);
            return;
        }
    
        fileList.forEach(file => {
            const filePath = path.join(dir, file);
            const routePath = `/${file}`;
            const stat = fs.lstatSync(filePath)

            // console.log
            if (stat.isDirectory()) {
                const newSubdir = filePath.replace(userDirectory, "")
                loadFiles(filePath, newSubdir);
            } else {
                const splitFilePath = filePath.split('.');

                if (possibleExtensions.includes(splitFilePath[splitFilePath.length-1])) {
                    // Cache the files so we can serve them dynamically
                    files[`${subdir}${routePath}`] = filePath;
                    files[`${subdir}${routePath}/`] = filePath;
                    if (file == "index.html") {
                        files[`${subdir}`] = filePath;
                        files[`${subdir}/`] = filePath;
                    }
                } else {
                    console.log('----')
                    console.log("file was not added", splitFilePath)
                }
            }
        });
    });
}

function startUpLoading() {
    loadFiles(userDirectory, "");
}

module.exports = {startUpLoading, files};