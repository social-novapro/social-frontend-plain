const baseURL = `http://localhost:5002/v1`
//const baseURL = `https://interact-api.novapro.net/v1`
var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}
var searching

var currentFeed 

const LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
// let loginUserToken = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
let loginUserToken = true

var debug = false

checkLogin()

// LOGIN INFO 
async function checkLogin() {
    if (debug) console.log(loginUserToken)

    if (!loginUserToken) {
        document.getElementById("mainFeed").innerHTML = `
            <div class="main-feed">
                <div class="publicPost">
                    <h1>Your not signed in!</h1>
                    <p>Please sign into Interact to proceed!</p>
                </div>
            </div>
        `
    }
    else {
        await getFeed()
    }
}

function saveLoginUserToken(userLoginToken) {
    localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(userLoginToken))
}

// DEBUGGING MODE
function devMode() {
    debug = getCookie("debugMode");
    if (debug == "true") addDebug()
    else removeDebug()
}

function addDebug() {
    for (debugging of document.getElementsByClassName("debug")) {
        debugging.classList.add("debug-shown"); 
    }
}

function removeDebug() {
    for (debugging of document.getElementsByClassName("debug")) {
        debugging.classList.remove("debug-shown"); 
    }
}

function debugModeSwitch() {
    if(!debug) {
        setCookie("debugMode", true, 365);
        addDebug()
        debug = true
    } else {
        setCookie("debugMode", false, 365);
        removeDebug()
        debug = false
    }
}

function checkCookie() {
    var showmenu = getCookie("debugMode");
    if (showmenu == "true") {
        openSideBar()
        return;
    } if (showmenu == false) {
        closeSideBar()
        return;
    } else {
        setCookie("debugMode", false, 365)
        return;
    } 
}

// Cookie Settings
function setCookie(cname,cvalue,exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');

    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        } if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// GET DATA FROM API FOR MAIN FEED
async function getFeed() {
    if (currentFeed) {
        return buildView(currentFeed)
    }

    if (debug) console.log("loading feed")

    const response = await fetch(`${baseURL}/get/allPosts`)
    var data = await response.json()

    var allPostsWithUserData = []
   // /*
    for (post of data) {
        if (searching) return 
        if (post.userID != '0001') {
            var newPost = post
            var userData = await getUserData(newPost.userID)
            newPost.userData = userData
            allPostsWithUserData.push(newPost)
        }
        else {
            var newPost = post
            var userData = { }
            newPost.userData = userData
            allPostsWithUserData.push(newPost)
        }
    }
    currentFeed = allPostsWithUserData
    buildView(allPostsWithUserData)
}

// EASTER EGG
function test() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="main-feed">
            <div class="mainNameEasterEgg"> 
                <h1>You pressed the logo!!</h1>
                <p>You pressed the header name, thats pretty cool of you! Thank you for checking out interact!</p>
                <p>Press the button below to go back!</p>
                <a onclick="getFeed()">Main Feed!</a>
            </div>
        </div>
    `
}


// BUILDING MAIN FEED
function buildView(posts) {
    document.getElementById("mainFeed").innerHTML = `
        <div class="main-feed">
            ${posts.map(function(post) {
               // console.log(post.userData)
                return `
                    <div class="publicPost">
                        <h2>${post.userData.displayName} @${post.userData.username}</h2>
                        <p>${post.content}</p>
                        <p class="debug">${post._id} - from (${post.userID})</p>
                        <a>like</a> | <a>repost</a> | <a>reply</a>
                    </div>
                `
            }).join(" ")}
        </div>
    `
    devMode()
}


// USER DATA FOR FEED
async function getUserData(userID) {
    const response = await fetch(`${baseURL}/get/user/${userID}`, {
        method: 'GET',
        headers,
    });
    return response.json()
}

var currentSearch
// SEARCHING
async function searchSocial() {
    input = document.getElementById('myInput').value;
    searching = false

    if (!input) {
        if (debug) console.log("returning to feed")
        return getFeed()
    }
    if (currentSearch == input){
        if (debug) console.log("same search")
        return console.log("same")
    }

    currentSearch = input
    searching = true
    headers.lookupkey = input

    const response = await fetch(`${baseURL}/get/search/`, {
        method: 'GET',
        headers,
    });  

    var data = await response.json()

    if (debug) console.log("loading search")

    document.getElementById("mainFeed").innerHTML = `
        <div class="main-feed">
            ${data.usersFound.map(function(user) {
                return `
                    <div class="publicPost searchUser">
                        <h2>${user.displayName} @${user.username}</h2>
                        <p> Following: ${user.followingCount} | Followers: ${user.followerCount}</p>
                        <p class="debug">${user._id}</p>
                    </div>
                `
            }).join(" ")}
            ${data.postsFound.map(function(post) {
                return `
                    <div class="publicPost searchUser">
                        <h2>Pretend this is user data</h2>
                        <p> ${post.content}</p>
                        <p class="debug">${post._id}</p>
                    </div>
                `
            }).join(" ")}
        </div>
    `
    devMode()
    searching = false
}