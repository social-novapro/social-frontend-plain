var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'

var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`
var redirectURL = `${config ? `${config.current == "prod" ? config.prod.hosted_url : config.dev.hosted_url}` : 'https://interact-api.novapro.net/v1' }`

var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}

var params = new URLSearchParams(window.location.search);
var foundparams = false;

async function checkURLParams() {
    var paramsInfo = {
        paramsFound: false
    }

    const ifRedirect = params.has('redirect')
    const ifLoginRequest = params.has("login")
    const ifNewAccountLogin = params.has("newAccount")
    const ifForgotPassowrd = params.has("forgotPass");

    if (ifRedirect) {
        const redirectSearch = params.get('redirect')
        if (redirectSearch) redirectURL += redirectSearch
        //else if (redirectSearch == 'live-chat') redirectURL += redirectSearch
        else console.log('redirect not found')
    }
    if (ifLoginRequest) {
        paramsFound = true
        paramsInfo.paramsFound = true

        loginPage();
    }
    else if (ifNewAccountLogin) {
        paramsFound = true
        paramsInfo.paramsFound = true

        createUserPage();
    }
    else if (ifForgotPassowrd) {
        paramsFound = true
        paramsInfo.paramsFound = true
        // forgotPasswordPage();
    }

    if (paramsInfo.paramsFound == false) return checkLogin()
}

var currentUserLogin = { }

if (location.protocol !== 'https:' && !((/localhost|(127|192\.168|10)\.(\d{1,3}\.?){2,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3}\.?){2}/).test(location.hostname))) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
else {
    checkURLParams()
}

function redirection() {
    window.location.href = redirectURL;
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
    if (foundparams == true) return;
    return loginSplashScreen()
}

// USER LOGIN SPLASH SCREEN 
async function loginSplashScreen() {
    console.log('-- login splash screen')
    document.getElementById("mainFeed").innerHTML = `hello`
    document.getElementById("mainFeed").innerHTML = `
        <div class="publicPost signInDiv">
            <h1><a onclick="changeYour()" id="badYourGrammer">You're</a> not signed in</h1>
            <p>Please sign into Interact to Proceed!</p>
            <button class="buttonStyled" onclick="loginPage()">Log into Your Account</button>
            <button class="buttonStyled" onclick="createUserPage()">Create an Account</button>
        </div>
    `
    console.log('--- login splash screen end');
}

async function changeYour() {
    var badYourGrammer = document.getElementById('badYourGrammer');
    if (badYourGrammer.innerHTML == 'You\'re') badYourGrammer.innerHTML = 'Your';
    else if (badYourGrammer.innerHTML == 'Your') badYourGrammer.innerHTML = 'You are';
    else badYourGrammer.innerHTML = 'You\'re';
}

// USER LOGIN PAGE 
async function loginPage() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="userInfo">
            <h1>Please Login!</h1>
            <form onsubmit="sendLoginRequest()" id="signInForm">
                <div class="userInfo">
                    <p>Enter Username or Email:</p>
                    <p><input class="contentMessage userEditForm" id="userUsernameLogin" placeholder="Username/Email" type="username" name="username"></p>
                </div>
                <div class="userInfo">
                    <p>Enter Password</p>
                    <p><input class="contentMessage userEditForm" id="userPasswordLogin" placeholder="Password" type="password" name="password"></p>
                </div>
                <div class="signInDiv">
                    <button class="buttonStyled" type="submit">Login</button>
                </div>
            </form>
            <div class="signInDiv">
                <button class="buttonStyled" onclick="forgetPassPage()">Forgot Password</button>
            </div>
       </div>
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

async function forgetPassPage() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="userInfo">
            <h1>Enter Details!</h1>
            <p>Enter your username or email to reset your password!</p>
            <p>Once you have entered your username or email, you will recieve an email with a link to reset your password!</p>
            <p>If you do not recieve an email, please check your spam folder.</p>
            <p>This will only work if you have an email set to your Interact account.</p>
            <p>Please contact us at <a href="mailto:daniel@novapro.net">daniel@novapro.net</a> for any problems with resetting your password</p>
            <form onsubmit="sendForgetRequest()" id="signInForm">
                <div class="userInfo">
                    <p>Enter Username or Email:</p>
                    <p><input class="contentMessage userEditForm" id="usernameForgetPass" placeholder="Username/Email" type="username" name="username"></p>
                </div>
                <div class="signInDiv">
                    <button class="buttonStyled" type="submit">Submit Request</button>
                </div>
            </form>
        </div>
    `
    document.getElementById("signInForm").addEventListener("submit", function (e) { e.preventDefault()})
}

async function sendForgetRequest() {
    var usernameLogin = document.getElementById('usernameForgetPass').value;

    // const response = await fetch(`${baseURL}Priv/get/userLogin/`, {
    const response = await fetch(`${apiURL}/auth/password/forgot/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username: usernameLogin })
    })

    // if (response.status != 200) 
    const userData = await response.json()

    if (!response.ok) return showModal(`<p>Error: ${userData.code}\n${userData.msg}</p>`)

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
        <div class="userInfo">
            <h1>Please Create an Account!</h1>
            <form onsubmit="createNewUserRequest()" id="createUserForm">
                <div class="userInfo">
                    <p>Enter Your New Username:</p>
                    <input type="text" class="contentMessage userEditForm" id="usernameCreate" placeholder="Username" type="text" name="username">
                </div>
                <div class="userInfo">
                    <p>Enter Your New Displayname:</p>
                    <input type="text" class="contentMessage userEditForm" id="displaynameCreate" placeholder="Displayname">
                </div>
                <div class="userInfo">
                    <p>Enter Your New Password:</p>
                    <input type="password" class="contentMessage userEditForm" id="passwordCreate" placeholder="Password" name="password">
                </div>
                <div class="userInfo">
                    <p>Enter Your Description:</p>
                    <input type="text" class="contentMessage userEditForm" id="descriptionCreate" placeholder="Description">
                </div>
                <div class="userInfo">
                    <p>Enter Your Pronouns:</p>
                    <input type="text" class="contentMessage userEditForm" id="pronounsCreate" placeholder="Pronouns">
                </div>
                <div class="signInDiv">
                    <button class="buttonStyled" type="submit">Create Account</div>
                </div>
            </form>
        </div>
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