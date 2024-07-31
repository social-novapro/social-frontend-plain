// VARIBLES
var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var LOCAL_STORAGE_LOGINS='social.loginAccounts'
var params = new URLSearchParams(window.location.search);
var foundparams = false;

var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`
var redirectURL = `/`;

var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}

/* loginACcounts info
    will be an array, with the usertoken, and userID, and access token, nothing else
    when user logs in, gets added to the array, and then when the user logs out, gets removed
    when user logs in, checks if the user is already logged in, if so, then it will log them out, and then log them in
    if user switchs account or new log in, itll go to .loginUserToken 
*/
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
        <div class="menu menu-style">
            <h1><a onclick="changeYour()" id="badYourGrammer">You're</a> not signed in</h1>
            <p>Please sign into Interact to Proceed!</p>
            <div>
                <button class="menuButton menuButton-style" onclick="loginPage()">Log into Your Account</button>
            </div>
            <div>
                <button class="menuButton menuButton-style" onclick="createUserPage()">Create an Account</button>
            </div>
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
        <div class="menu menu-style">
            <h1>Please Login!</h1>
            <form onsubmit="sendLoginRequest()" id="signInForm">
                <div class="menu menu-style">
                    <p>Enter Username or Email:</p>
                    <p><input class="contentMessage userEditForm menu-style" id="userUsernameLogin" placeholder="Username/Email" type="username" name="username"></p>
                </div>
                <div class="menu menu-style">
                    <p>Enter Password</p>
                    <p><input class="contentMessage userEditForm menu-style" id="userPasswordLogin" placeholder="Password" type="password" name="password"></p>
                </div>
                <div>
                    <button class="menuButton menuButton-style" type="submit">Login</button>
                </div>
            </form>
            <div>
                <button class="menuButton menuButton-style" onclick="forgetPassPage()">Forgot Password</button>
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
    
    const response = await fetch(`${apiURL}/auth/userLogin/`, {
        method: 'GET',
        headers,
    })

    const userData = await response.json()

    if (response.ok) saveLoginUser(userData.userID, userData.userToken, userData.accessToken)
    else return showModal(`<p>Error: ${userData.code}\n${userData.msg}</p>`)

    if (userData.login === true) return redirection()
}

async function forgetPassPage() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="menu menu-style">
            <h1>Enter Details!</h1>
            <p>Enter your username or email to reset your password!</p>
            <p>Once you have entered your username or email, you will recieve an email with a link to reset your password!</p>
            <p>If you do not recieve an email, please check your spam folder.</p>
            <p>This will only work if you have an email set to your Interact account.</p>
            <p>Please contact us at <a href="mailto:daniel@novapro.net">daniel@novapro.net</a> for any problems with resetting your password</p>
            <form onsubmit="sendForgetRequest()" id="signInForm">
                <div class="menu menu-style">
                    <p>Enter Username or Email:</p>
                    <p><input class="contentMessage userEditForm menu-style" id="usernameForgetPass" placeholder="Username/Email" type="username" name="username"></p>
                </div>
                <div class="menu menu-style">
                    <button class="buttonStyled menuButton menuButton-style" type="submit">Submit Request</button>
                </div>
            </form>
            <div id="forgotPassResponse"></div>
        </div>
    `
    document.getElementById("signInForm").addEventListener("submit", function (e) { e.preventDefault()})
}

async function sendForgetRequest() {
    var usernameLogin = document.getElementById('usernameForgetPass').value;

    const response = await fetch(`${apiURL}/auth/password/forgot/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username: usernameLogin })
    })

    const userData = await response.json()

    if (!response.ok) {
        document.getElementById("forgotPassResponse").innerHTML = `<p>Error: ${userData.code}\n${userData.msg}</p>`;
        return showModal(`<p>Error: ${userData.code}\n${userData.msg}</p>`);
    } else {
        document.getElementById("forgotPassResponse").innerHTML = `<p>Completed, check your email for a reset link.</p>`;
        return showModal(`<p>Success, check email.</p>`);
    }
}

function saveLoginUser(userID, userToken, accessToken) {
    localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify({ userID, userToken, accessToken}))
    const logins = localStorage.getItem(LOCAL_STORAGE_LOGINS);

    if (logins) {
        const loginsArray = JSON.parse(logins);
        for (const login of loginsArray) {
            if (login.userID == userID) {
                loginsArray.splice(loginsArray.indexOf(login), 1);
            }
        }
        loginsArray.push({ userID, userToken, accessToken });
        localStorage.setItem(LOCAL_STORAGE_LOGINS, JSON.stringify(loginsArray));
    } else {
        localStorage.setItem(LOCAL_STORAGE_LOGINS, JSON.stringify([{ userID, userToken, accessToken }]));
    }
}

function createUserPage() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="menu menu-style">
            <h1>Please Create an Account!</h1>
            <form onsubmit="createNewUserRequest()" id="createUserForm">
                <div class="menu menu-style">
                    <p>Enter Your Email:</p>
                    <input type="text" class="contentMessage userEditForm menu-style" id="emailCreate" placeholder="Email" type="text" name="email">
                </div>
                <div class="menu menu-style">
                    <p>Enter Your New Username: (required)</p>
                    <input type="text" class="contentMessage userEditForm menu-style" id="usernameCreate" placeholder="Username" type="text" name="username">
                </div>
                <div class="menu menu-style">
                    <p>Enter Your New Displayname: (required)</p>
                    <input type="text" class="contentMessage userEditForm menu-style" id="displaynameCreate" placeholder="Displayname">
                </div>
                <div class="menu menu-style">
                    <p>Enter Your New Password: (required)</p>
                    <input type="password" class="contentMessage userEditForm menu-style" id="passwordCreate" placeholder="Password" name="password">
                </div>
                <div class="menu menu-style">
                    <p>Enter Your Description:</p>
                    <input type="text" class="contentMessage userEditForm menu-style" id="descriptionCreate" placeholder="Description">
                </div>
                <div class="menu menu-style">
                    <p>Enter Your Pronouns:</p>
                    <input type="text" class="contentMessage userEditForm menu-style" id="pronounsCreate" placeholder="Pronouns">
                </div>
                <div class="menu menu-style">
                    <p>Enter Your Birthdate: (required)</p>
                    <input type="date" class="contentMessage userEditForm menu-style" id="birthDateCreate" placeholder="01/01/04">
                </div>
                <div class="menu menu-style">
                    <button class="buttonStyled" type="submit">Create Account</div>
                </div>
            </form>
        </div>
    `
    document.getElementById("createUserForm").addEventListener("submit", function (e) { e.preventDefault()})
}
function convertDateToEpoch(date) {
    const newDate = new Date(date).getTime()
    return newDate;
}
async function createNewUserRequest() {
    var emailCreate = document.getElementById('emailCreate').value;
    var usernameCreate = document.getElementById('usernameCreate').value;
    var displaynameCreate = document.getElementById('displaynameCreate').value;
    var passwordCreate = document.getElementById('passwordCreate').value;
    var descriptionCreate = document.getElementById('descriptionCreate').value;
    var pronounsCreate = document.getElementById('pronounsCreate').value;
    var birthDateCreate = document.getElementById('birthDateCreate').value;

    var data = {}
    if (emailCreate) data.email = emailCreate;
    if (usernameCreate) data.username = usernameCreate
    if (displaynameCreate) data.displayName = displaynameCreate
    if (passwordCreate) data.password = passwordCreate
    if (descriptionCreate) data.description = descriptionCreate
    if (pronounsCreate) data.pronouns = pronounsCreate
    if (birthDateCreate) data.userAge = convertDateToEpoch(birthDateCreate)

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
