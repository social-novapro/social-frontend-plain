const baseURL = `http://localhost:5002/v1`
//const baseURL = `https://interact-api.novapro.net/v1`

var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}

/*var currentUserLogin = {
    "accesstoken" : "d023ed40-95ff-42aa-962b-e19475ebd317",
    "userid" : "d825813d-95d2-46eb-868a-ae2e850eab92"
}*/


// need usertoken, and userid for sending

var searching
var currentFeed 

const LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
// let loginUserToken = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
let loginUserToken = false

checkURLParams()

// CHANGES URL OF BROWSER
function changeHeader(newLink) {
    let stateObj = { id: "100" };
    window.history.replaceState(stateObj, "Socket", "/" + newLink);
}

function checkURLParams() {
    const params = new URLSearchParams(window.location.search)
    const ifUsername = params.has('username')
    const ifPostID = params.has("postID")
    const ifLoginRequest = params.has("login")
    const ifNewAccountLogin = params.has("newAccount")

    if (ifUsername) {
        const usernameSearch = params.get('username')

        return userPage(usernameSearch)
    }
    else if (ifPostID) {
        const usernameSearch = params.get('postID')
        // return userPage(usernameSearch)
    }
    else if (ifLoginRequest) {
        return loginPage()
    }
    else if (ifNewAccountLogin) {
        return loginSplashScreen()
    }
}
function mainSelectionsAdd(){
    document.getElementById('mainSelections').innerHTML=`
        <div class="mainButtons publicPost">
            <div class="mainButton">
                <a onclick="debugModeSwitch()">Dev Mode</a>
            </div>
            <div id="profileButton" class="mainButton">
                <a onclick="profile()">Profile</a>
            </div>
            <div class="mainButton">
                <a onclick="createPost()">Create Post</a>
            </div>
        </div>
    `
}
function mainSelectionsRemove() {
    document.getElementById('mainSelections').innerHTML=``
}

async function userPage(username) {
    searching = true

    const response = await fetch(`${baseURL}/get/username/${username}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await response.json()
    console.log(userData)

    document.getElementById("mainFeed").innerHTML = `
        <div class="publicPost signInDiv">
            <h1>${userData.displayName} - @${userData.username}</h1>
            <p>${userData.description}</p>
        </div>
    `
}

/*
    Login user token layout
    { 
        "usertoken"
        "apptoken"
        "accesstoken"
        "userid"
    }
*/

var debug = false

checkLogin()

async function switchNav(pageVal) {
    switch (pageVal) {
        // SEARCH
        case 1:
            window.location.href="./live-chat"
            break;
    
        default:
            break;
    }
}

// LOGIN INFO 
async function checkLogin() {
    if (debug) console.log(loginUserToken)

    if (!loginUserToken) return loginSplashScreen()
    else {
        await getFeed()
    }
}

// USER LOGIN SPLASH SCREEN 
async function loginSplashScreen() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="publicPost signInDiv">
            <h1>Your not signed in!</h1>
            <p>Please Sign into Interact to Proceed!</p>
            <a onclick="loginPage()">Log into Your Account</a>
            <a onclick="loginPage()">Create an Account</a>
        </div>
    `
}

// USER LOGIN PAGE 
async function loginPage() {
    document.getElementById("mainFeed").innerHTML = `
        <h1>Please Login!</h1>
        <div> 
            <p>Enter your Username</p>
            <input type="text" id="userUsernameLogin" placeholder="Username">

        </div>
        <div> 
            <p>Enter Your Password</p>
            <input type="text" id="userPasswordLogin" placeholder="Password">
        </div>
        <a onclick="sendLoginRequest()">Sign in</a>
    `
    /*
    const response = await fetch(`${baseURL}/get/user/${currentUserLogin.userid}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await response.json()
    */
}

async function sendLoginRequest() {
    var usernameLogin = document.getElementById('userUsernameLogin').value;
    var passwordLogin = document.getElementById('userPasswordLogin').value;

    headers.username = usernameLogin
    headers.password = passwordLogin
    
    const response = await fetch(`${baseURL}Priv/get/userLogin/`, {
        method: 'GET',
        headers,
    })
 //   if (response.status != 200) 
    const userData = await response.json()
    console.log(userData)
    currentUserLogin = userData.accessToken

    // save user token to cookie
    // setCookie(currentUser,cvalue,exdays) {}

    if (userData.login === true) {
        return await getFeed()
    }
}

// CHANGES MAIN FEED BUTTON TO PROFILE
function goBackFeedFromProfile() {
    document.getElementById("profileButton").innerHTML = `
        <a onclick="profile()">Profile</a>
    ` 
    searching = false

    checkLogin()
}

// USER PROFILE PAGE
async function profile() {
    removeSearchBar()
    searching = true

    document.getElementById("profileButton").innerHTML = `
        <a onclick="goBackFeedFromProfile()">Main Feed</a>
    `
    const response = await fetch(`${baseURL}/get/user/${currentUserLogin.userid}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await response.json()
    
    document.getElementById("mainFeed").innerHTML = `
        <div class="search">
            <a onclick="editUser()">Edit Profile</a>
        </div>
        <div class="search">
            <input type="text" id="usernameProfile" placeholder="Your username: ${userData.username}">
        </div>
            <div class="search">
            <input type="text" id="displaynameProfile" placeholder="Your displayname: ${userData.displayName}">
        </div>
    `
}

// MAKES SEARCH BAR APPEAR
function searchBar() {
    document.getElementById("searchBar").innerHTML = `
        <div class="search">
            <input type="text" id="searchBarArea" onkeyup="searchSocial()" placeholder="Search for Posts and Users...">
        </div>
    `
}

function postBar() {
    document.getElementById("postBar").innerHTML = `
        <div class="search">
            <input type="text" id="postBarArea" placeholder="Type out your next update...">
            <a onclick="postbarPublish()">Publish Update</a>
        </div>
    `
}

// MAKES SEARCHBAR DISAPPEAR
function removeSearchBar() {
    document.getElementById("searchBar").innerHTML = ``
}

// SIGN UP PAGE
async function signupSocial() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="signup">
            <div class="main-feed">
                <h1>Dummy signup page</h1>
            </div>
            <div class="search">
                <input type="text" id="usernameProfile" placeholder="Your username">
            </div>
                <div class="search">
                <input type="text" id="displaynameProfile" placeholder="Your displayname">
            </div>
        </div>
    `
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

// ADDING DEBUG INFO TO EVERYTHING
function addDebug() {
    for (debugging of document.getElementsByClassName("debug")) {
        debugging.classList.add("debug-shown"); 
    }
}

// REMOVES DEBUG INFO FROM EVERYTHING
function removeDebug() {
    for (debugging of document.getElementsByClassName("debug")) {
        debugging.classList.remove("debug-shown"); 
    }
}

// SWITCHING DEBUGGING MODE
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

// CHECK DEBUG COOKIE
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

// GET REQUESTED COOKIE
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
    searchBar()
    postBar()
    mainSelectionsAdd()

    if (currentFeed) return buildView(currentFeed)

    if (debug) console.log("loading feed")

    const response = await fetch(`${baseURL}/get/allPosts`)
    var data = await response.json()

    currentFeed = data
    buildView(data)
}

// EASTER EGG
function test() {
    removeSearchBar()

    document.getElementById("mainFeed").innerHTML = `
        <div class="mainNameEasterEgg"> 
            <h1>You pressed the logo!!</h1>
            <p>You pressed the header name, thats pretty cool of you! Thank you for checking out interact!</p>
            <p>Press the button below to go back!</p>
            <a onclick="getFeed()">Main Feed!</a>
        </div>
    `
}

// BUILDING MAIN FEED
function buildView(posts) {
    if (searching) return

    document.getElementById("mainFeed").innerHTML = `
        ${posts.map(function(postArray) {
            const post = postArray.postData
            const user = postArray.userData

            if (!user) {
                return `
                    <div class="publicPost">
                        <h2>Unknown User</h2>
                        <p>${post.content}</p>
                        <p class="debug">${post._id} - from (${post.userID})</p>
                        <a onclick="blankFunction('like')">like</a> | <a onclick="blankFunction('repost')">repost</a> | <a onclick="blankFunction('reply')">reply</a>
                    </div>
                `
            }
            else {
                return `
                    <div class="publicPost">
                        <h2>${user.displayName} @${user.username}</h2>
                        <p>${post.content}</p>
                        <p class="debug">${post._id} - from (${post.userID})</p>
                        <a onclick="blankFunction('like')">like</a> | <a onclick="blankFunction('repost')">repost</a> | <a onclick="blankFunction('reply')">reply</a>
                    </div>
                `
            }
        }).join(" ")}
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
    var input = document.getElementById('searchBarArea').value;
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
        ${data.usersFound.map(function(user) {
            return `
                <div class="publicPost searchUser">
                    <h2>${user.displayName} @${user.username}</h2>
                    <p> Following: ${user.followingCount} | Followers: ${user.followerCount}</p>
                    <p class="debug">${user._id}</p>
                </div>
            `
        }).join(" ")}
        ${data.postsFound.map(function(postArray) {
            var post = postArray.postData
            var user = postArray.userData

            if (!postArray.type.user) {
                return `
                    <div class="publicPost searchUser">
                        <h2>Unknown User</h2>
                        <p>${post.content}</p>
                        <p class="debug">${post._id}</p>
                    </div>
                `
            }
            else {
                return `
                    <div class="publicPost searchUser">
                        <h2>${user.displayName} @${user.username}</h2>
                        <p> ${post.content}</p>
                        <p class="debug">${post._id}</p>
                    </div>
                `
            }
        }).join(" ")}
    `

    devMode()
    searching = false
}

async function createPostPage() {

}

// BASE FOR CREATING POSTS (posts when you press create post)
async function createPost() {
    const data = { 
        "userID" : currentUserLogin.userid, 
        "content" : "testing posting from frontend! not first" 
    };

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    const response = await fetch(`${baseURL}/post/createPost`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    if (debug) console.log(response.json())

    document.getElementById("mainFeed").innerHTML = `
        <h1>Your post was sent!</h1>
    `
}

// PUBLISH WRITTEN POST
async function postbarPublish() {
    var input = document.getElementById('postBarArea').value;

    const data = { 
        "userID" : currentUserLogin.userid, 
        "content" : input 
    };

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    const response = await fetch(`${baseURL}/post/createPost`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    if (debug) console.log(response.json())

    document.getElementById("mainFeed").innerHTML = `
        <h1>Your post was sent!</h1>
    `
}

// BLANK FUNCTION FOR LATER BUTTONS TO LIKE / REPLY / REPOST
function blankFunction(action) {
    console.log(`a dummy ${action} was requested`)
}

function removeEditUser() {
    document.getElementById("mainFeed").innerHTML = ``
    document.getElementById("resultEditUsername").innerHTML = ``
}

function editUser() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="username">
            <input id="newUsername"></input>
            <div id="resultEditUsername"></div>
            <a onclick=renameUsername()>Edit Username</a>
        </div>
    `
}

// EDIT DISPLAY NAME
async function renameUsername() {
    const newUsername = document.getElementById('newUsername').value;
    console.log(newUsername)
    // editUsernameFrontend
    if (!newUsername) {
        document.getElementById("resultEditUsername").innerHTML = `
            <p>You did not enter a new username</p>
        `
    }
    else {
        const data = {
            userID: currentUserLogin.userid,
            newUsername
        }   
    
        const response = await fetch(`${baseURL}/put/editUsername`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });
        console.log(response)
        const newData = await response.json()
        console.log(newData)
    
        document.getElementById("resultEditUsername").innerHTML = `
            <p>Changed username! from ${newData.before.username} to ${newData.new.username}</p>
        `
    }
}