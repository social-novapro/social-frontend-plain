/*
    new idea
        have a basic feed page, without likes, comments, etc.
        once you login, you can choose to see 
            - discover feed (default when not logged in)
            - custom feed (default when logged in)
            - following feed (just people you follow)

// function that checks if user is logged in
if (checkLoginUser()) {
    // if user is logged in, show the logout button
    document.getElementById("logoutButton").innerHTML = `
        <button class="buttonStyled" onclick="logout()">Logout</button>
    `
} else {
    // if user is not logged in, show the login button
    document.getElementById("logoutButton").innerHTML = `
        <button class="buttonStyled" onclick="login()">Login</button>
    `
}

// if user is logged in, show the post button
if (checkLoginUser()) {
    document.getElementById("postButton").innerHTML = `
        <button class="buttonStyled" onclick="postbar()">Post</button>
    `
} else {
    document.getElementById("postButton").innerHTML = ``
}

// Ping server to see if user is logged in
async function checkLoginUser() {
    const headers = {
        'Authorization': 'Bearer my-token',
        'My-Custom-Header': 'foobar'
    };

    const checkLogin = await axios.get(`${APIv1}/check/login`, { headers })
    return checkLogin.data
}
*/


const baseURL = `http://localhost:5002/v1`
//const baseURL = `https://interact-api.novapro.net/v1`

var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}

var currentUserLogin = { }
/*var currentUserLogin = {
    "accesstoken" : "d023ed40-95ff-42aa-962b-e19475ebd317",
    "userid" : "d825813d-95d2-46eb-868a-ae2e850eab92"
}*/

var currentPage
// need usertoken, and userid for sending

var searching
var currentFeed 

const LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
// let loginUserToken = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)

var debug = false
checkLogin()

// CHANGES URL OF BROWSER
function changeHeader(newLink) {
    let stateObj = { id: "100" };
    window.history.replaceState(stateObj, "Socket", "/" + newLink);
}

async function checkURLParams() {
    var paramsInfo = {
        paramsFound: false
    }

    const params = new URLSearchParams(window.location.search)
    const ifUsername = params.has('username')
    const ifPostID = params.has("postID")
    const ifLoginRequest = params.has("login")
    const ifNewAccountLogin = params.has("newAccount")

    if (ifUsername) {
        paramsFound = true
        const usernameSearch = params.get('username')
        userPage(usernameSearch)
    }
    else if (ifPostID) {
        paramsFound = true
        const usernameSearch = params.get('postID')
        // return userPage(usernameSearch)
    }
    else if (ifLoginRequest) {
        paramsFound = true
        loginPage()
    }
    else if (ifNewAccountLogin) {
        paramsFound = true
        loginSplashScreen()
    }
   
    return paramsInfo
}

async function userPage(username) {
    searching = true

    const response = await fetch(`${baseURL}/get/username/${username}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await response.json() 
    if (userData.displayName) document.title = `${userData.displayName} | Interact`

    if (userData.code) {
        return document.getElementById("mainFeed").innerHTML = `
            <div class="publicPost signInDiv" id="userAccountPage">The user you requested to view does not exist.</div>
        `   
    }

    document.getElementById("mainFeed").innerHTML = `
        <div class="publicPost signInDiv" id="userAccountPage"></div>
    `
    if (userData.displayName && userData.username) {
        document.getElementById("userAccountPage").innerHTML += `
            <h1>${userData.displayName} - @${userData.username}</h1>
        `
    }
    else if (userData.displayName && !userData.username) {
        document.getElementById("userAccountPage").innerHTML += `
            <h1>${userData.displayName} - @(unknown))</h1>
        `
    }
    else if (!userData.displayName && userData.username) {
        document.getElementById("userAccountPage").innerHTML / `
            <h1>(unknown) - @${userData.username}</h1>
        `
    }

    if (userData.description) {
        document.getElementById("userAccountPage").innerHTML += `
            <p>${userData.description}</p>
        `
    }
    else {
        document.getElementById("userAccountPage").innerHTML += `
            <p>There is no description for this user.</p>
        `
    }
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


async function switchNav(pageVal) {
    switch (pageVal) {
        // SEARCH
        case 1:
            window.location.href="./live-chat"
            break;
        case 2:
            profile()
            break;
        case 3:
            debugModeSwitch()
            break;
        case 4:
            await showModal(`
                <h1>Create a new Post</h1>
                <textarea class="postTextArea" id="newPostTextArea"></textarea>
                <button class="buttonStyled" onclick="createPost()">Upload Post</button>
            `)
        default:
            break;
    }
}

async function showModal(html, showClose) {
    document.getElementById('modalContainer').classList.add("showModal");
    document.getElementById('modal').innerHTML = html

    if (showClose == "hide") return
    else return showModalClose()
}

async function showModalClose() {
    document.getElementById('modal').innerHTML+=`
        <button class="buttonStyled" onclick="closeModal()">Close</button>
    `
}

async function closeModal() {
    document.getElementById('modalContainer').classList.remove("showModal")    
}

// LOGIN INFO 
async function checkLogin() {
    if (debug) console.log(loginUserToken)

    var loginUserToken = false

    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    if (userStorageLogin) {
        currentUserLogin = userStorageLogin
        loginUserToken = true
    }
    

    if (!loginUserToken) return loginSplashScreen()
    else await getFeed()
}

// USER LOGIN SPLASH SCREEN 
async function loginSplashScreen() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="publicPost signInDiv">
            <h1>Your not signed in!</h1>
            <p>Please Sign into Interact to Proceed!</p>
            <button class="buttonStyled" onclick="loginPage()">Log into Your Account</button>
            <button class="buttonStyled" onclick="createUserPage()">Create an Account</button>
        </div>
    `
}

// USER LOGIN PAGE 
async function loginPage() {
    document.getElementById("mainFeed").innerHTML = `
        <h1>Please Login!</h1>
        <form onsubmit="sendLoginRequest()" id="signInForm">
            <div>
                <p>Enter Username:</p>
                <p><input id="userUsernameLogin" placeholder="Username" type="text" name="username"></p>
            </div>
            <div>
                <p>Enter Password</p>
                <p><input id="userPasswordLogin" placeholder="Password" type="password" name="password"></p>
            </div>
            <input class="buttonStyled" type="submit">
        </form>
    `
        document.getElementById("signInForm").addEventListener("submit", function (e) { e.preventDefault()})
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

    // if (response.status != 200) 
    console.log(response)
    const userData = await response.json()
    console.log(userData)
   //  currentUserLogin = userData.accessToken
    if (response.ok) {
        if (userData.public._id) currentUserLogin.userid = userData.public._id

        saveLoginUser(userData)
        // save user token to cookie
        // setCookie(currentUser,cvalue,exdays) {}
        return await getFeed()
    }

    else return showModal(`<p>Error: ${userData.code}\n${userData.msg}</p>`)

    if (userData.login === true) {
        return await getFeed()
    }
}

function createUserPage() {
    document.getElementById("mainFeed").innerHTML = `
        <h1>Please Create an Account!</h1>
        <p id="errorMessage"></p>
        <form onsubmit="createNewUserRequest()" id="createUserForm">
            <div> 
                <p>Enter Your New Username:</p>
                <input type="text" id="usernameCreate" placeholder="Username" type="text" name="username">
            </div>
            <div> 
                <p>Enter Your New Displayname:</p>
                <input type="text" id="displaynameCreate" placeholder="Displayname">
            </div>
            <div> 
                <p>Enter Your New Password:</p>
                <input id="passwordCreate" placeholder="Password" type="password" name="password">
            </div>
            <div> 
                <p>Enter Your Description:</p>
                <input type="text" id="descriptionCreate" placeholder="Description">
            </div>
            <div> 
                <p>Enter Your Pronouns:</p>
                <input type="text" id="pronounsCreate" placeholder="Pronouns">
            </div>
            <input class="buttonStyled" type="submit">
        </form>
    `
    document.getElementById("createUserForm").addEventListener("submit", function (e) { e.preventDefault()})
}

async function createNewUserRequest() {
    var usernameCreate = document.getElementById('usernameCreate').value;
    var displaynameCreate = document.getElementById('displaynameCreate').value;
    var passwordCreate = document.getElementById('passwordCreate').value;
    var descriptionCreate = document.getElementById('descriptionCreate').value;
    var pronounsCreate = document.getElementById('pronounsCreate').value;

    const data = { 
        "username" : usernameCreate, 
        "displayName" : displaynameCreate,
        "password" : passwordCreate,
        "description": descriptionCreate,
        "pronouns": pronounsCreate
    };

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    const response = await fetch(`${baseURL}Priv/post/newUser`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    console.log(response)
    const responseParsed = await response.json()
    console.log(responseParsed)
    if (response.ok) {
        // save user token to cookie
        // setCookie(currentUser,cvalue,exdays) {}
        return await getFeed()
    }
    else return document.getElementById('errorMessage').innerHTML=`Error: ${responseParsed.code}, ${responseParsed.msg}`
}


// CHANGES MAIN FEED BUTTON TO PROFILE
function goBackFeedFromProfile() {
    document.getElementById("page2").innerHTML = `Profile` 
    searching = false

    return checkLogin()
}

// USER PROFILE PAGE
async function profile() {
    checkLogin()
    removeSearchBar()
    searching = true

    const response = await fetch(`${baseURL}/get/user/${currentUserLogin.userid}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await response.json()
    
    document.getElementById("mainFeed").innerHTML = `
        <div class="search">
            <button class="buttonStyled" onclick="editUser()">Edit Profile</button>
        </div>
        <div class="search">
            <input type="text" id="usernameProfile" placeholder="Your username: ${userData.username}">
        </div>
            <div class="search">
            <input type="text" id="displaynameProfile" placeholder="Your displayname: ${userData.displayName}">
        </div>
    `
    currentPage = "profile"
    document.getElementById("page2").innerHTML = `Home`

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
            <button class="buttonStyled" onclick="postbarPublish()">Publish Update</button>
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

function saveLoginUser(userLoginToken) {
    localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(userLoginToken))
}
function checkLoginUser() {
    console.log(localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN))
   //  localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(userLoginToken))
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
    document.getElementById('mainFeed').innerHTML=``
    searchBar()
    // postBar()

    if (currentFeed) return buildView(currentFeed)
    if (debug) console.log("loading feed")

    const response = await fetch(`${baseURL}/get/allPosts`)
    var data = await response.json()

    currentFeed = data

    const params = await checkURLParams()

    if (params.paramsFound == false) return buildView(data)
    else return
}

// EASTER EGG
function test() {
    removeSearchBar()

    document.getElementById("mainFeed").innerHTML = `
        <div class="mainNameEasterEgg"> 
            <h1>You pressed the logo!!</h1>
            <p>You pressed the header name, thats pretty cool of you! Thank you for checking out interact!</p>
            <p>Press the button below to go back!</p>
            <button class="buttonStyled" onclick="getFeed()">Main Feed!</button>
        </div>
    `
}


function checkDate(time){
    var timeNum = 0
    if (!isNaN(time)) timeNum = parseFloat(time)
    else timeNum = time
    const date = dateFromEpoch(timeNum)
    
    return date
}

function dateFromEpoch(time) {
   // console.log(time)
    const date = new Date(time)
    const year = date.getFullYear()
    const day = date.getDate()
    const month = date.getMonth()
    const monthReadable = checkMonth(month)

    return `${monthReadable} ${day}, ${year}`
}

function checkMonth(month) {
    var months = [ "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December" ];

    var monthSelected = months[month];
    return monthSelected
}

// BUILDING MAIN FEED
function buildView(posts) {
    if (searching) return


    document.getElementById("mainFeed").innerHTML = `
        ${posts.map(function(postArray) {
            const post = postArray.postData
            const user = postArray.userData

            var timesince
            if (post.timePosted) timesince = checkDate(post.timePosted)

            if (!user) {
                return `
                    <div class="publicPost">
                        <h2>Unknown User</h2>
                        <p>${timesince}</p>
                        <p>${post.content}</p>
                        <p class="debug">${post._id} - from (${post.userID})</p>
                        <button class="buttonStyled" onclick="blankFunction('like')">like</button> | <button class="buttonStyled" onclick="blankFunction('repost')">repost</button> | <button class="buttonStyled" onclick="blankFunction('reply')">reply</button>
                    </div>
                `
            }
            else {
                return `
                    <div class="publicPost">
                        <h2>${user.displayName} @${user.username}</h2>
                        <p>${timesince}</p>
                        <p>${post.content}</p>
                        <p class="debug">${post._id} - from (${post.userID})</p>
                        <button class="buttonStyled" onclick="blankFunction('like')">like</button> | <button class="buttonStyled" onclick="blankFunction('repost')">repost</button> | <button class="buttonStyled" onclick="blankFunction('reply')">reply</button>
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

/*
// BASE FOR CREATING POSTS (posts when you press create post)
async function createPost() {
    const data = { 
        "userID" : currentUserLogin.userid, 
        "content" : document.getElementById('newPostTextArea').value
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
*/
// PUBLISH WRITTEN POST
async function createPost() {
  //   var input = document.getElementById('postBarArea').value;
    var input = document.getElementById('newPostTextArea').value

    console.log(currentUserLogin)
    const data = { 
        "userID" : currentUserLogin.userid, 
        "content" : input 
    };

    closeModal()

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    const response = await fetch(`${baseURL}/post/createPost`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    const postData = await response.json()
    if (debug) console.log(postData)

    if (response.ok) return showModal(`<h1>Your post was sent!</h1> <p>${postData.content}</p>`)
    else return showModal(`<h1>something went wrong.</h1> <p>${postData.code}\n${postData.msg}</p>`)

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
            <button class="buttonStyled" onclick=renameUsername()>Edit Username</button>
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