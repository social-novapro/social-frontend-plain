// add option to have searching put in address bar (so it doesnt spam history), look for places that uses changeHeader()

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

var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`

// const apiURL = `http://localhost:5002/v1`
// const apiURL = `https://interact-api.novapro.net/v1`

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

var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
// let loginUserToken = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)

var debug = false

if (location.protocol !== 'https:' && location.hostname !== 'localhost' &&location.hostname!=='127.0.0.1') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
else {
    if (!('fetch' in window)) {
      if (debug) console.log('Fetch API not found, please upgrade your browser.');
        showModal(`Please upgrade your browser to use Interact!`)
    }
    else checkLogin()
}
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
    const ifSearch = params.has("search")
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
    else if (ifSearch) {
        paramsFound = true
        const searchSearching = params.get('search')
        searchResult(searchSearching)
        addWritingToSeachBar(searchSearching)
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

function postElementCreate(post, user, type) {
    var timesince
    if (post.timePosted) timesince = checkDate(post.timePosted)
    const imageContent = checkForImage(post.content)

   // imageContent.attachments
    if (imageContent.imageFound)if (debug) console.log(imageContent.attachments)
    if (type=="basic"){
        return `
            <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}${user.verified ? ' ✔️ ' : ''}` : '>Unknown User'} | ${timesince}</p>
            <div class="postContent" id="postContentArea_${post._id}">
                <div class="textAreaPost">
                    <p id="postContent_${post._id}">${imageContent.content}</p>
                    ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                </div>
            </div>
        `
    }
    
    return `
        <div id="postElement_${post._id}" class="postElement">
            <div class="publicPost areaPost" id="postdiv_${post._id}">
                <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}${user.verified ? ' ✔️ ' : ''}` : '>Unknown User'} | ${timesince}</p>
                <div class="postContent" id="postContentArea_${post._id}">
                    <div class="textAreaPost">
                        <p id="postContent_${post._id}">${imageContent.content}</p>
                        ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                    </div>
                    ${post.quoteReplyPostID && post.quotedPost && post.quotedUser ? `<hr><div>${postElementCreate(post.quotedPost, post.quotedUser, "basic")}</div>` : ''}
                    <div class="PostAttachments">
                        ${imageContent.image ? `<div>${imageContent.attachments.map(function(attachment) {return `${attachment}`}).join(" ")}</div>`:''}
                    </div>
                </div>
                <p class="debug">${post._id} - from: ${post.userID}</p>
                <div class="actionOptions pointerCursor"> 
                    <p onclick="likePost('${post._id}')" id="likePost_${post._id}">${post.totalLikes} likes</p>
                    <p>${post.totalReplies} comments</p>
                    <p id="quoteButton_${post._id}"><p onclick="quotePost('${post._id}')">quote post</p></p>
                    ${post.userID == currentUserLogin.userID ? `
                        <p onclick="deletePost('${post._id}')">delete post</p>
                        <p id='editButton_${post._id}'><p onclick="editPost('${post._id}', '${post.edited}')">edit post</p></p>
                    ` : '' }</p>
                    <p id="popupactions_${post._id}" onclick="popupActions('${post._id}')">more</p>
                </div>
            </div>
        </div>
    `
}

async function popupActions(postID) {
    var elementPopup = document.getElementById(`popupOpen_${postID}`);
    if (elementPopup) return elementPopup.remove();

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="popupOpen_${postID}" class="publicPost" style="position: element(#popupactions_${postID});">
            <p>Menu Actions</p>
            <p>---</p>
            <p onclick="saveBookmark('${postID}')" id="saveBookmark_${postID}">Save to Bookmarks</p>
            <p onclick="showEditHistory('${postID}')" id="editHistory_${postID}">Check Edit History</p>
            <p onclick="showLikes('${postID}')" id="likedBy_${postID}">Check Who Liked</p>
        </div>
    `;
};

async function saveBookmark(postID, list) {
    const body = {
        postID,
        listname: list ? list : "main"
    }
    const response = await fetch(`${apiURL}/post/savePost/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    // if (!response.ok) return document.getElementById(`saveBookmark_${postID}`).innerText = "Error while saving"
    const res = await response.json();
    if (debug) console.log(res)
    if (res.error) return document.getElementById(`saveBookmark_${postID}`).innerText = `Error: ${res.error}`;
    document.getElementById(`saved post to bookmarks`)
}

async function showLikes(postID) {
    const response = await fetch(`${apiURL}/get/postLikedBy/${postID}`, {
        method: 'GET',
        headers,
    });

    const likedBy = await response.json();
    if (debug) console.log(likedBy.peopleLiked);
    if (!response.ok || !likedBy.peopleLiked) return document.getElementById(`likedBy_${postID}`).innerHTML = `Could not find any people who liked the post.`;

    var newElement = `<p>Liked By:</p>`;
    for (const people of likedBy.peopleLiked) {
        newElement+=`<p onclick="userHtml('${people.userID}')">${people.username}</p>`
    };

    document.getElementById(`likedBy_${postID}`).innerHTML=newElement;
}

async function showEditHistory(postID) {
    const response = await fetch(`${apiURL}/get/postEditHistory/${postID}`, {
        method: 'GET',
        headers,
    });

    const editData = await response.json();
    if (debug) console.log(editData);
    if (!response.ok || !editData.edits) return document.getElementById(`editHistory_${postID}`).innerHTML = `Could not find any edits.`;

    var newElement = `<p>Edit History:</p>`;
    for (const edit of editData.edits) {
        newElement+=`<p>${edit.content}</p>`
    };

    document.getElementById(`editHistory_${postID}`).innerHTML=newElement;
};

async function userPage(username) {
    searching = true

    const response = await fetch(`${apiURL}/get/username/${username}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await response.json() 

    userHtml(userData._id)

    return 
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
    } else if (userData.displayName && !userData.username) {
        document.getElementById("userAccountPage").innerHTML += `
            <h1>${userData.displayName} - @(unknown))</h1>
        `
    } else if (!userData.displayName && userData.username) {
        document.getElementById("userAccountPage").innerHTML / `
            <h1>(unknown) - @${userData.username}</h1>
        `
    }

    if (userData.verified) {
        document.getElementById("userAccountPage").innerHTML += `
            <p>Verified</p>
        `
    } else {
        document.getElementById("userAccountPage").innerHTML += `
            <p>Not Verified</p>
        `
    }
    if (userData.description) {
        document.getElementById("userAccountPage").innerHTML += `
            <p>${userData.description}</p>
        `
    } else {
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

// /*

async function createPostModal() {
    await showModal(`
        <h1>Create a new Post</h1>
        <div class="postModalActions">
            <p onclick="createPost()">Upload Post</p>
            <p onclick="closeModal()">Close</p>
        </div>
        <textarea class="postTextArea" id="newPostTextArea"></textarea>
    `, "hide")
}

/*
document.addEventListener('keypress', logKey);

function logKey(e) {
    if (e.key == '/') {
        searchBar()
        document.getElementById('searchBarArea').focus()
    }
}*/

/*
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
*/

// LOGIN INFO 
async function checkLogin() {
    if (debug) console.log(loginUserToken)

    var loginUserToken = false

    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    if (userStorageLogin) {
        currentUserLogin = JSON.parse(userStorageLogin)
        if (debug) console.log(headers)
        if (debug) console.log(currentUserLogin.accessToken)
        if (debug) console.log(currentUserLogin.userToken)
        if (debug) console.log(currentUserLogin.userID)

        headers.accesstoken = currentUserLogin.accessToken
        headers.usertoken = currentUserLogin.userToken
        headers.userid = currentUserLogin.userID

        loginUserToken = true
    }
    
    if (!loginUserToken) return loginSplashScreen()
    else await getFeed()
}

// USER LOGIN SPLASH SCREEN 
async function loginSplashScreen() {
    return window.location.href='/begin'
    /*document.getElementById("mainFeed").innerHTML = `
        <div class="publicPost signInDiv">
            <h1>Your not signed in!</h1>
            <p>Please Sign into Interact to Proceed!</p>
            <button class="buttonStyled" onclick="loginPage()">Log into Your Account</button>
            <button class="buttonStyled" onclick="createUserPage()">Create an Account</button>
        </div>
    `*/
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
    
    const response = await fetch(`${apiURL}Priv/get/userLogin/`, {
        method: 'GET',
        headers,
    })

    // if (response.status != 200) 
    if (debug) console.log(response)
    const userData = await response.json()
    if (debug) console.log(userData)
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

/*
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

    const response = await fetch(`${apiURL}Priv/post/newUser`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    if (debug) console.log(response)
    const responseParsed = await response.json()
    if (debug) console.log(responseParsed)
    if (response.ok) {
        // save user token to cookie
        // setCookie(currentUser,cvalue,exdays) {}
        return await getFeed()
    }
    else return document.getElementById('errorMessage').innerHTML=`Error: ${responseParsed.code}, ${responseParsed.msg}`
}
*/

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

    userHtml(currentUserLogin.userID)
        // editable after

    currentPage = "profile"
}

async function userEdit(action) {
    const newValue = document.getElementById(`userEdit_${action}_text`).value
    headers[`new${action.toLowerCase()}`] = newValue

    const response = await fetch(`${apiURL}/put/userEdit`, {
        method: 'PUT',
        headers
    })
    const newUser = await response.json()
    if (!response.ok) return console.log("error")

    // return window.location.href = `${document.getElementById('userEdit_username_text').value}`
    console.log(newUser)
}

async function userHtml(userID) {
    const response = await fetch(`${apiURL}/get/user/${userID}`, {
        method: 'GET',
        headers,
    })
    
    const profileData = await response.json()

    var timesince
    if (profileData.userData.creationTimestamp) timesince = checkDate(profileData.userData.creationTimestamp)

    var clientUser = profileData.userData._id === currentUserLogin.userID ? true : false
    if (profileData?.userData?.displayName) document.title = `${profileData?.userData?.displayName} | Interact`
    
    profileData.postData.reverse()
    // profileData.included.post ? profileData.postData.reverse() : profileData.postData = []
    document.getElementById("mainFeed").innerHTML =  `
        <div class="userInfo">
            <p><b>Display Name</b></p>
            ${clientUser ? 
                `
                    <form id="userEdit_displayName" class="contentMessage" onsubmit="userEdit('displayName')">
                        <input id="userEdit_displayName_text" type="text" class="userEditForm" value="${profileData.userData.displayName}">
                    </form>
                ` : `
                    <p>${profileData.userData.displayName}</p>
                `
            }
        </div>
        <div class="userInfo">
            <p><b>Username</b></p>
            ${clientUser ? 
                `
                    <form id="userEdit_username" class="contentMessage" onsubmit="userEdit('username')">
                        <input type="text" id="userEdit_username_text" class="userEditForm" value="${profileData.userData.username}">
                    </form>
                ` : `
                    <p>${profileData.userData.username}</p>
                `
            }
        </div>
        <div class="userInfo">
            <p><b>Description</b></p>
            ${clientUser ? 
                `
                    <form id="userEdit_description" class="contentMessage" onsubmit="userEdit('description')">
                        <input type="text" id="userEdit_description_text" class="userEditForm" value="${profileData.userData.description}">
                    </form>
                ` : `
                    <p>${profileData.userData.description}</p>
                `
            }
        </div> 
        ${clientUser ?
            `
                <div class="userInfo">
                    <p><b>Bookmarks</b></p>
                    <button class="buttonStyled" id="showBookmarksButton" onclick="showBookmarks()">Show Bookmarks</button>
                    <div id="bookmarksdiv"></div>
                </div>
            ` : ``
        }
        ${clientUser ?
            `
                <div class="userInfo">
                    <p><b>Developer</b></p>
                    <button class="buttonStyled" id="showDevOptionsButton" onclick="showDevOptions()">Show Dev Settings</button>
                    <div id="showDevDiv"></div>
                </div>
            ` : ``
        }
        ${profileData.verified ? 
            `
                <div class="userInfo">
                    <p>Verified</p>
                </div>
            ` : `
                ${clientUser ? 
                `
                    <div class="userInfo">
                        <p><b>Verify ✔️</b></p>
                        <div class="searchSelect search">
                            <input id="content_request_verification"  placeholder="Why do you want to verify?">
                            <button onclick="requestVerification()">Request</button>
                        </div>
                    </div>
                ` : ``}
            `
            /*
             <form onsubmit="requestVerification()" id="verifyUserForm">
                    <input type="text" id="content_request_verification" placeholder="Why do you want to verify?">
                </form>
            */
        }   
    
        ${profileData.userData.pronouns ? 
            `
                <div class="userInfo"><p><b>Pronouns</b></p>
                    ${clientUser ? 
                        `
                            <form id="userEdit_pronouns" class="contentMessage" onsubmit="userEdit('pronouns')">
                                <input type="text" id="userEdit_pronouns_text" class="userEditForm" value="${profileData.userData.pronouns}">
                            </form>
                        ` : `
                            <p>${profileData.userData.pronouns}</p>
                        `
                    }
                </div>
            ` : ``
        }
        ${profileData.userData.creationTimestamp ? 
            `  
                <div class="userInfo">
                    <p><b>Creation</b></p>
                    <p>${timesince}</p>
                </div>
            `: ``
        }
        ${profileData.included.posts ? `
            <div class="userInfo">
                <p><b>Posts</b></p>
                <p>${profileData.postData.length}</p>
            </div>
            <hr class="rounded">
            ${profileData.postData.map(function(post) {
                return postElementCreate(post, profileData.userData)                
            }).join(" ")}
        ` : ``}
    `

    if (clientUser) {
        if (profileData.userData.displayName) document.getElementById("userEdit_displayName").addEventListener("submit", function (e) { e.preventDefault()})
        if (profileData.userData.username) document.getElementById("userEdit_username").addEventListener("submit", function (e) { e.preventDefault()})
        if (profileData.userData.description) document.getElementById("userEdit_description").addEventListener("submit", function (e) { e.preventDefault()})
        if (profileData.userData.pronouns) document.getElementById("userEdit_pronouns").addEventListener("submit", function (e) { e.preventDefault()})
    }
  
    return document.getElementById("page2Nav").innerHTML = `<div id="page2Nav"><button class="buttonStyled"  onclick="switchNav(5)" id="page2">Home</button>`
}

function hideBookmarks() {
    document.getElementById('bookmarksdiv').innerHTML=""
    document.getElementById('showBookmarksButton').innerHTML="Show Bookmarks"
}

async function showBookmarks() {
    if (document.getElementById('bookmarksAreShown')) return hideBookmarks()
    document.getElementById('showBookmarksButton').innerHTML="Hide Bookmarks"

    const response = await fetch(`${apiURL}/get/bookmarks/`, {
        method: 'GET',
        headers
    });

    // if (!response.ok) return document.getElementById(`saveBookmark_${postID}`).innerText = "Error while saving"
    const res = await response.json();
    if (debug) console.log(res)
    // if (res.error) return document.getElementById(`saveBookmark_${postID}`).innerText = `Error: ${res.error}`;

    var obj = {} // { list: name, saves: [] }
    for (const list of res.lists) {
        obj[list.name] = []
    }

    for (const save of res.saves) {
        // console.log(save.listname)
        obj[save.bookmarkList].push(save._id)
    }

    var ele = `<hr class="rounded" id="bookmarksAreShown">`

    for (const listname in obj) {
        var list = obj[listname]
        ele+=`
            <div>
                <p>${listname}</p>
                <hr class="rounded">
        `
        for (const save of list) {
            if (debug) console.log(save)
            const newData = await getPostAndProfileData(save)
            if (newData.error) ele+=`<p>error</p>`
            else ele+= postElementCreate(newData.postData, newData.profileData, "basic")
            // ele+=
        }
        ele+=`</div>`
    }

    document.getElementById("bookmarksdiv").innerHTML=ele
    if (debug) console.log(obj)
}

async function hideDevOptions() {
    document.getElementById('showDevDiv').innerHTML=""
    document.getElementById('showDevOptionsButton').innerHTML="Show Dev Settings"
}

function revealDevOptions(option, index){
    switch (option) {
        case "devToken":
            const eledevtoken = document.getElementById('devToken');
            if (eledevtoken.classList.contains("blur")) eledevtoken.classList.remove('blur')   
            else eledevtoken.classList.add('blur')
            break;
        case "appTokens":
            const eleapptokens = document.getElementById(`appToken_${index}`);
            if (eleapptokens.classList.contains("blur")) eleapptokens.classList.remove('blur')   
            else eleapptokens.classList.add('blur')
           
            break;
        case "appAccess":
            const eleaccess = document.getElementById(`appAccess_${index}`);
            if (eleaccess.classList.contains("blur")) eleaccess.classList.remove('blur')   
            else eleaccess.classList.add('blur')
           
            break
        default:
            break;
    }
}

async function showDevOptions() {
    if (document.getElementById('showDevAreShown')) return hideDevOptions()
    document.getElementById('showDevOptionsButton').innerHTML="Hide Developer Settings"

    const response = await fetch(`${apiURL}/get/developer/`, {
        method: 'GET',
        headers
    });

    if (!response.ok) return document.getElementById(`showDevDiv`).innerText = "Error while requesting data"
    const res = await response.json();
    if (debug) console.log(res)

    var firstEle = `
        <hr class="rounded" id="showDevAreShown">
        <p>Account Status</p>
        <div class="userInfo">
            ${res.developer ? `<p>You have an Interact Developer Account</p>`:``}
            ${res.applications&&res.AppTokens ? `<p>You have ${res.AppTokens.length} Approved Applications</p>`: ``}
            ${res.allowedApplications&&res.AppAccesses ? `<p>${res.AppAccesses.length} Connected Applications`: ``} 
        </div>
    `;

    var devAccEle='';
    if (res.developer&&res.DeveloperToken) {
        devAccEle=`
            <hr class="rounded">
            <p>Developer Account</p>
            <div class="userInfo">
                ${res.DeveloperToken._id ? `<p>devToken: <p onclick="revealDevOptions('devToken')" id="devToken" class="blur">${res.DeveloperToken._id}</p>`:``}
                ${res.DeveloperToken.premium ? `<p>Premium Dev Account</p>`:`<p>Regular Dev Account</p>`}
                ${res.DeveloperToken.creationTimestamp ? `<p>Dev account created: ${checkDate(res.DeveloperToken.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
            </div>
        `;
    } else {
        devAccEle=`
            <hr class="rounded">
            <p>Developer Account</p>
            <div class="userInfo" id="devAcc">
                <p>Signup for a developer account.</p>
                <div class="searchSelect search">
                    <button onclick="requestDevToken()">Signup</button>
                </div>
            </div>
        `
    };

    var appTokensEle='';
    if (res.applications&&res.AppTokens) {
        appTokensEle+=`<hr class="rounded"><p>App Token${res.AppTokens.length>=2 ? 's': ''}</p>`
        
        var amount=0;
        for (const appToken of res.AppTokens.reverse()) {
            amount++;
            appTokensEle+=`
                <div class="userInfo">
                    <p>appToken ${amount} of ${res.AppTokens.length}</p>
                    <p>app name: ${appToken.appName ? appToken.appName : `Unknown`}
                    ${appToken._id ? `<p>appToken: <p onclick="revealDevOptions('appTokens', ${amount})" id="appToken_${amount}" class="blur">${appToken._id}</p>`:``}
                    <p>API Uses: ${appToken.APIUses? appToken.APIUses : `0`}
                    ${appToken.creationTimestamp ? `<p>Application created: ${checkDate(appToken.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
                </div>
            `;
        };
    };

    var appAccessEle=`<hr class="rounded"><p>App Connections</p>`;
    if (res.allowedApplications&&res.AppTokens) {
        var amount=0;
        for (const appAccess of res.AppAccesses) {
            amount++;
            appAccessEle+=`
                <div class="userInfo">
                    <p>appAccess ${amount} of ${res.AppAccesses.length}</p>
                    ${appAccess.appToken ? `<p>Using appToken: <p onclick="revealDevOptions('appAccess', ${amount})" id="appAccess_${amount}" class="blur">${appAccess.appToken}</p>`:``}
                </div>
            `;
        };
    };
    
    var ele = firstEle+devAccEle+appTokensEle+appAccessEle;
    
    document.getElementById("showDevDiv").innerHTML=ele;
    return;
};

async function requestDevToken() {
    document.getElementById('devAcc').innerHTML="loading";

    const requestRes = await fetch(`${apiURL}Priv/post/newDev`, {
        method: 'POST',
        headers
    });

    const devData = await requestRes.json();
    if (!requestRes.ok || devData.error) return console.log({error: `${devData?.error ? devData.error : "an unknown error"}`});

    const newEle = `
        ${devData._id ? `<p>devToken: <p onclick="revealDevOptions('devToken')" id="devToken" class="blur">${devData._id}</p>`:``}
        ${devData.premium ? `<p>Premium Dev Account</p>`:`<p>Regular Dev Account</p>`}
        ${devData.creationTimestamp ? `<p>Dev account created: ${checkDate(devData.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
    `;

    document.getElementById('devAcc').innerHTML=newEle;
};

async function getPostAndProfileData(postID) {
    const postRes = await fetch(`${apiURL}/get/post/${postID}`, {
        method: 'GET', 
        headers
    });

    const postData = await postRes.json();

    if (!postRes.ok || postData.error) return {error: `${postData.error ? postData.error : "an unknown error"}`};
    if (debug) console.log(postData);

    const profileRes = await fetch(`${apiURL}/get/userByID/${postData.userID}`, {
        method: 'GET',
        headers,
    });

    const profileData = await profileRes.json();
    if (debug) console.log(profileData);

    if (!profileRes.ok || profileData.error) return {error: `${profileData.error ? profileData.error : "an unknown error"}`};


    return { "postData" : postData, "profileData": profileData };
}

async function requestVerification() {
    var input = document.getElementById('content_request_verification').value
    if (debug) console.log(input)

    const data = { 
        "content" : input,
    };
    // closeModal()

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    fetch(`${apiURL}/post/requestVerify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    }).then(res => {
        console.log(res)
    })
    /*const response = await fetch(`${apiURL}/post/requestVerify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });*/

    // const verification = await response.json()
    // if (debug) console.log(verification)
}

// MAKES SEARCH BAR APPEAR
function searchBar() {

}

function activeSearchBar() {
    document.getElementById("searchArea").innerHTML = `
        <div class="searchSelect search">
            <input id="searchBarArea" onkeyup="searchSocial()" placeholder="Search for Posts and Users...">
        </div>
    `
    document.getElementById('searchBar').innerHTML = `
        <button class="buttonStyled" onclick="unactiveSearchBar()" id="page6">Remove Search</button>
    `
}
function unactiveSearchBar() {
    document.getElementById("searchArea").innerHTML = ``
    document.getElementById('searchBar').innerHTML = `
        <button class="buttonStyled" onclick="activeSearchBar()" id="page6">Search</button>
    `
}

function postBar() {
    document.getElementById("postBar").innerHTML = `
        <form id="searchBar" class="searchSelect search" onsubmit="createPost()">
            <input type="text" id="newPostTextArea" placeholder="Type out your next update...">
        </form>
    `

    /* 
    <div class="searchSelect search">
        <input type="text" id="postBarArea" placeholder="Type out your next update...">
        <button class="buttonStyled" onclick="postbarPublish()">Publish Update</button>
    </div>
    */
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
            <div class="userInfo">
                <input type="text" id="usernameProfile" placeholder="Your username">
            </div>
                <div class="userInfo">
                <input type="text" id="displaynameProfile" placeholder="Your displayname">
            </div>
        </div>
    `
}

function saveLoginUser(userLoginToken) {
    localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(userLoginToken))
}

function checkLoginUser() {
  if (debug) console.log(localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN))
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

    const response = await fetch(`${apiURL}/get/allPosts`, { method: 'GET', headers})
    var data = await response.json()

    currentFeed = data.reverse()

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
            <button class="buttonStyled" onclick="switchNav(5)">Main Feed!</button>
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

   // const userDiv = document.createElement("div") 
   // userDiv.innerHTML=`<div id="test"></div>`

   // // document.getElementById("mainFeed").append(userDiv)
   // document.getElementById('test').innerText=`test`


    document.getElementById("mainFeed").innerHTML = `
        ${posts.map(function(postArray) {
            return postElementCreate(postArray.postData, postArray.userData)
            /* 
            return `
                <div class="postArea">
                    <div class="subheaderMessage">
                        <p 
                            ${user ? ` onclick="userHtml('${post.userID}')" 
                            class="${user._id == currentUserLogin.userID ? "ownUser" : "otherUser"}"
                        >
                            ${user.displayName} @${user.username}` : '>Unknown User'} | ${timesince ? timesince : ""}</p> 
                        </p>
                    </div>
                    <p class="contentMessage">${post.content}</p>
                    <p class="debug">${post._id} - from: ${post.userID}</p>
                </div>
            `*/
            
            /* 
            return `
                <div class="publicPost">
                    <h2 ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}` : '>Unknown User'}</h2>
                    <p>${timesince}</p>
                    <p>${post.content}</p>
                    <p class="debug">${post._id} - from (${post.userID})</p>
                    <button class="buttonStyled" id="${post._id}" onclick="blankFunction('like')">like</button> | <button class="buttonStyled" onclick="blankFunction('repost')">repost</button> | <button class="buttonStyled" onclick="blankFunction('reply')">reply</button>
                </div>
            `
            */

        }).join(" ")}
    `
    devMode()
}
async function deletePost(postID) {
    if (debug) console.log(`deleting post ${postID}`)
    const response = await fetch(`${apiURL}/delete/removePost/${postID}`, { method: 'DELETE', headers})

    if (response.status == 200) return document.getElementById(`postdiv_${postID}`).remove()
    else return showModal("Error", "Something went wrong, please try again later")
}
//postContent_${post._id}

function editPost(postID, edited) {
    if (debug) console.log(`editing post ${postID}`)

    const oldMessage = document.getElementById(`postContent_${postID}`).innerText

    if (debug) console.log(oldMessage)
    document.getElementById(`postContentArea_${postID}`).innerHTML = `
        <form id="editPostForm" class="contentMessage"onsubmit="submitEdit('${postID}')">
            <input type="text" id="editPostInput" class="contentMessage contentMessageFormEdit" value="${oldMessage}">
        </form>
    `
    document.getElementById(`editButton_${postID}`).innerHTML=`<p onclick='cancelEdit("${postID}", "${oldMessage}", "${edited}")'>cancel edit</p>`
   // editButton_${post._id}

    document.getElementById(`editPostInput`).focus()
    document.getElementById("editPostForm").addEventListener("submit", function (e) { e.preventDefault()})

    // if (response.status == 200) return document.getElementById(`postdiv_${postID}`).remove()
    // else return showModal("Error", "Something went wrong, please try again later")
}

async function cancelEdit(postID, content, edited) {
    if (debug) console.log(`cancelling edit of post ${postID}`)

    const postData = await fetch(`${apiURL}/get/post/${postID}`, { method: 'GET', headers})
    if (!postData.ok) return showModal("Error", "Something went wrong, please try again later")
    const post = await postData.json()
    if (debug) console.log(post)
    const userData = await fetch(`${apiURL}/get/userByID/${post.userID}`, { method: 'GET', headers})
    if (debug) console.log(userData)
    if (!userData.ok) return showModal("Error", "Something went wrong, please try again later")

    const user = await userData.json()
    if (debug) console.log(user)
    return document.getElementById(`postElement_${postID}`).innerHTML = postElementCreate(post, user)
}

async function submitEdit(postID) {
    if (debug) console.log(postID)

    const newEdit = document.getElementById('editPostInput').value
    const data = {'postID': postID, 'content': newEdit}

    const response = await fetch(`${apiURL}/put/editPost`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    })
    
    if (debug) console.log(response)
    if (!response.status == 200) return showModal("Error something went wrong, please try again later")

    const editData = await response.json()

    if (debug) console.log(editData)
    const imageContent = checkForImage(editData.new.content)

    document.getElementById(`editButton_${postID}`).innerHTML=`<a onclick='editPost("${postID}")'>edit post</a>`

    return document.getElementById(`postContentArea_${postID}`).innerHTML = `
        <div class="textAreaPost">
            <p id="postContent_${postID}">${imageContent.content} </p>
            ${editData.new.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
        </div>
        <div class="PostAttachments">
            ${imageContent.image ? `<div>${imageContent.attachments.map(function(attachment) {return `${attachment}`}).join(" ")}</div>`:''}
        </div>
    `  
}
async function quotePost(postID) {
    const postResponse = await fetch(`${apiURL}/get/post/${postID}`, { method: 'GET', headers})
    if (!postResponse.ok) return showModal(`<h1>Error</h1><p>something went wrong</p>`)
    const post = await postResponse.json()
    const userResponse = await fetch(`${apiURL}/get/userByID/${post.userID}`, { method: 'GET', headers })
        
    if (!userResponse.ok) return showModal(`<h1>Error</h1><p>something went wrong</p>`)
    const user = await userResponse.json()
    if (debug) console.log(user)
    await showModal(`
        <h1>Create a new Post</h1>
        <div class="postModalActions">
            <p onclick="createPost({'quoteID':'${postID}'})">Upload Post</p>
            <p onclick="closeModal()">Close</p>
        </div>
        <div class="post">
            <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}` : '>Unknown User'}</p>
            <div class="postContent" id="postContentArea_${post._id}">
                <div class="textAreaPost">
                    <p id="postContent_${post._id}">${post.content} </p>
                    ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                </div>
            </div>
        </div>
        <textarea class="postTextArea" id="newPostTextArea"></textarea>
    `, "hide")
}

async function likePost(postID) {
    if (debug) console.log("liking post")
    const response = await fetch(`${apiURL}/put/likePost/${postID}`, { method: 'PUT', headers})
    const data = await response.json()

    if (debug) console.log(data)
    if (!response.ok) return 
    // const likeElemenet = document.getElementById(`likePost_${postID}`)
    // if (likeElemenet.classList.contains("likedColour")) likeElemenet.classList.remove("likedColour");
    // else if (data.totalLikes > likeElemenet.innerText.replace(" likes", "") || !likeElemenet.classList.contains("likedColour")) likeElemenet.classList.add("likedColour");
    document.getElementById(`likePost_${postID}`).classList.add("likedColour");
    document.getElementById(`likePost_${postID}`).innerText = `${data.totalLikes} likes`
}

// USER DATA FOR FEED
async function getUserData(userID) {
    const response = await fetch(`${apiURL}/get/user/${userID}`, {
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
    searchResult(input)
}
async function addWritingToSeachBar(input) {
    document.getElementById('searchBarArea').value = input
}

async function searchResult(input) {
    if (!input) {
        if (debug) console.log("returning to feed")
        changeHeader('')

        return getFeed()
    }
    if (currentSearch == input){
        if (debug) console.log("same search")
        return console.log("same")
    }

    currentSearch = input
    searching = true
    headers.lookupkey = input

    changeHeader(`?search=${input}`)

    const response = await fetch(`${apiURL}/get/search/`, {
        method: 'GET',
        headers,
    });  

    var data = await response.json()

    if (debug) console.log("loading search")

    if (debug) console.log(data)
    
    if (!data.postsFound[0] && !data.usersFound[0]) return document.getElementById("mainFeed").innerHTML= `<div class="publicPost searchUser"><p>no results were found, try to seach something else.</div>`
    else console.log(data.postsFound)

    document.getElementById("mainFeed").innerHTML = `
        ${data.usersFound.reverse().map(function(user) {
            var timesince
            if (user.creationTimestamp) timesince = checkDate(user.creationTimestamp)
            
            return `
                <div class="publicPost searchUser">
                    <p class="${user._id == currentUserLogin.userID ? "ownUser" : "otherUser"}" onclick="userHtml('${user._id}')"> ${user.displayName} @${user.username} | ${user.creationTimestamp ? timesince : '' }</p>
                    <p>${user.description ? user.description : "no description"}</p>
                    <p>Following: ${user.followingCount} | Followers: ${user.followerCount}</p>
                    <p class="debug">${user._id}</p>
                </div>
            `
        }).join(" ")}
        ${data.postsFound.reverse().map(function(postArray) {
            return postElementCreate(postArray.postData, postArray.userData)
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

    const response = await fetch(`${apiURL}/post/createPost`, {
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
async function createPost(params) {
    if (debug) console.log(params)
  //   var input = document.getElementById('postBarArea').value;
    var input = document.getElementById('newPostTextArea').value
    if (debug) console.log(input)

    var quoted 
    if (params?.quoteID) quoted = params.quoteID
    else quoted='null'

    const data = { 
        "userID" : currentUserLogin.userID, 
        "content" : input,
        "quoteReplyPostID" : quoted
    };

    closeModal()

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    const response = await fetch(`${apiURL}/post/createPost`, {
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
    // editUsernameFrontend
    if (!newUsername) {
        document.getElementById("resultEditUsername").innerHTML = `
            <p>You did not enter a new username</p>
        `
    }
    else {
        const data = {
            userID: currentUserLogin.userID,
            newUsername
        }   
    
        const response = await fetch(`${apiURL}/put/editUsername`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });

        const newData = await response.json()
    
        document.getElementById("resultEditUsername").innerHTML = `
            <p>Changed username! from ${newData.before.username} to ${newData.new.username}</p>
        `
    }
}

function getId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
}
    
function checkForImage(content) {
    const imageFormats = ['.jpg', '.png','.jpeg', '.svg', '.gif']
    const videoFormats = [{'urlEnd': '.mp4', "type": 'mp4'}, {'urlEnd':'.mov','type':'mp4'}, {'urlEnd':'.ogg', 'type': 'ogg'}]

    const contentArgs = content.split(/[ ]+/)
    var foundImage = false

    var attachments = []
    for (index = 0; index < contentArgs.length; index++) {
        if (contentArgs[index].startsWith('https://')) {
            for (const imageFormat of imageFormats) {
                if (contentArgs[index].endsWith(imageFormat)) {
                    foundImage = true
                   // contentArgs[index] = `<img class="messageImage" src="${contentArgs[index]}"></img>`
                    attachments.push(`<img alt="userImage" class="messageImage" width="100px" src="${contentArgs[index]}"></img>`)
                }
            }

            for (const videoFormat of videoFormats) {
                if (contentArgs[index].endsWith(videoFormat.urlEnd)) {
                    foundImage = true
                    //contentArgs[index] = `\n<video width="320" height="240" controls><source src="${contentArgs[index]}" type="video/${videoFormat.type}"></video>`
                    attachments.push(`<video alt="uservideo" width="320" height="240" controls><source src="${contentArgs[index]}" type="video/${videoFormat.type}"></video>`)
                }
            }
            const videoId = getId(contentArgs[index]);

            if (videoId) {
                foundImage = true
                const iframeMarkup = `<iframe title="uservideo" width="320" height="240" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
               // contentArgs[index] = iframeMarkup
                attachments.push(iframeMarkup)
            }
        }
    }

    return {"image" : foundImage, "content": contentArgs.join(" "), attachments}
}