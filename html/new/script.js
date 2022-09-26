var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'

var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`
var redirectURL = `${config ? `${config.current == "prod" ? config.prod.hosted_url : config.dev.hosted_url}` : 'https://interact-api.novapro.net/v1' }`

var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}

var currentUserLogin = { }

if (location.protocol !== 'https:' && !((/localhost|(127|192\.168|10)\.(\d{1,3}\.?){2,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3}\.?){2}/).test(location.hostname))) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
else {
    checkURLParams()
}

async function checkURLParams() {
    const params = new URLSearchParams(window.location.search)
    const ifRedirect = params.has('redirect')

    if (ifRedirect) {
        const redirectSearch = params.get('redirect')
        if (redirectSearch == 'live-chat') redirectURL += redirectSearch
        else console.log('redirect not found')
    }
    
    return checkLogin()
}

function redirection() {
    window.location.href = '/'
}

/*
// LOGIN INFO 
async function checkLogin() {
    var loginUserToken = false

    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    if (userStorageLogin) {
        currentUserLogin = userStorageLogin
        loginUserToken = true

        return redirection()
    }
    
    if (!loginUserToken) return loginSplashScreen()
}*/
async function sendLoginRequest() {
    const response = await fetch(`${apiURL}/auth/checkToken/`, {
        method: 'GET',
        headers,
    })

    return response
}

async function checkLogin() {
    return loginSplashScreen()
}

// USER LOGIN SPLASH SCREEN 
async function loginSplashScreen() {
    console.log('-- login splash screen')
    document.getElementById("root").innerHTML = `hello`
    document.getElementById("root").innerHTML = `
        <div class="center_div publicPost signInDiv">
            <h1>Your not signed in!</h1>
            <p>Please Sign into Interact to Proceed!</p>
            <button class="buttonStyled" onclick="loginPage()">Log into Your Account</button>
            <button class="buttonStyled" onclick="createUserPage()">Create an Account</button>
        </div>
    `
    console.log('--- login splash screen end')
}

// USER LOGIN PAGE 
async function loginPage() {
    document.getElementById("root").innerHTML = `
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
    
    // const response = await fetch(`${baseURL}Priv/get/userLogin/`, {
    const response = await fetch(`${apiURL}/auth/userLogin/`, {
        method: 'GET',
        headers,
    })

    // if (response.status != 200) 
    console.log(response)
    const userData = await response.json()
    console.log(userData)

    if (response.ok) saveLoginUser(userData.userID, userData.userToken, userData.accessToken)
    else return showModal(`<p>Error: ${userData.code}\n${userData.msg}</p>`)

    if (userData.login === true) return redirection()
}

function saveLoginUser(userID, userToken, accessToken) {
    //setCookie("accesstoken", accessToken , 365);
    //setCookie("usertoken", userToken , 365);
    //setCookie("userid", userID , 365);

    localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify({ userID, userToken, accessToken}))
}

async function checkLoginUser() {
    const response = await fetch(`${apiURL}/auth/checkToken`, {
        method: 'GET',
        headers,
    })

    console.log(response)
    const userData = await response.json()
    console.log(userData)

    console.log(localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN))
   //  localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(userLoginToken))
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

    var data = {}
    if (usernameCreate) data.username = usernameCreate
    if (displaynameCreate) data.displayName = displaynameCreate
    if (passwordCreate) data.password = passwordCreate
    if (descriptionCreate) data.description = descriptionCreate
    if (pronounsCreate) data.pronouns = pronounsCreate

    const response = await fetch(`${apiURL}Priv/post/newUser`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
  
    const userData = await response.json()
    
    if (response.ok) saveLoginUser(userData.userID, userData.userToken, userData.accessToken)
    else return showModal(`<p>Error: ${userData.code}\n${userData.msg}</p>`)

    if (userData.login === true) return redirection()
}
/* function setCookie(cname,cvalue,exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
} */