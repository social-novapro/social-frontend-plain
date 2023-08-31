var loginUserToken = false
var currentUserLogin = { }
var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var baseURL
var headers = {
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421",
    'Content-Type': 'application/json',
}
var verifiedConnection = false
var params = new URLSearchParams(window.location.search)

document.getElementById('mainFeed').innerHTML = 'eijj';
var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`

if (location.protocol !== 'https:' && !((/localhost|(127|192\.168|10)\.(\d{1,3}\.?){2,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3}\.?){2}/).test(location.hostname))) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
} else startup()

async function startup() {
    setupUI();
    checkURLParams();
}

// sets default UI with back button
function setupUI() {
    document.getElementById('mainFeed').innerHTML = `
        <div class="userInfo">
            <p><b>Hello!</b></p>
            <br />
            <p>You seem to have gotten here on accident, go back home to explore interact!</p>
            <button class="userInfo buttonStyled" onclick="redirectHome()">Home</button>
        </div>
    `;
}

function redirectHome() {
    window.location.href='/'
}

async function checkURLParams() {
    var paramsInfo = {
        paramsFound: false
    }

    const ifReqVer = params.has('verification');
    const ifReqRemoveEmail = params.has("removeEmail");
    const ifReqDelAcc = params.has("deleteAccount");
    const ifChangePass = params.has("replacePassword");
    const ifForgetPass = params.has("forgotPassword");

    if (ifReqVer) {
        paramsInfo.paramsFound = true
        paramsInfo.verification = params.get('verification')
        setupVerRequest(paramsInfo.verification)
    } else if (ifReqRemoveEmail) {
        paramsInfo.paramsFound = true
        paramsInfo.removeEmail = params.get('removeEmail')
        setupRemoveEmailRequest(paramsInfo.removeEmail)
    } else if (ifReqDelAcc) {
        paramsInfo.paramsFound = true;
        paramsInfo.deleteAccount = params.get('deleteAccount');
        setupDelAccRequest(paramsInfo.deleteAccount);
    } else if (ifChangePass) {
        paramsInfo.paramsFound = true;
        paramsInfo.changePass = params.get('replacePassword');
        setupChangePasswordRequest(paramsInfo.changePass);
    } else if (ifForgetPass) {
        paramsInfo.paramsFound = true;
        paramsInfo.forgotPass = params.get('forgotPassword');
        setupForgotPasswordRequest(paramsInfo.forgotPass);
    }

    return paramsInfo
}

// TODO UPDATE
function setupForgotPasswordRequest(verID) {
    const ele = `
        <div class="userInfo">
            <p><b>Forgot Password</b></p>
            <p>Forgot Password ID: ${verID}</p>
            </br>
            <button class="userInfo buttonStyled" onclick="forgotPasswordAPI('${verID}')">Confirm Reset</button>
            <button class="userInfo buttonStyled" onclick="redirectHome()">Go Home</button>
            <p> <br/>Press confirm reset to update your account password, or go back home.</p> 
            <div id="verResult"></div>
        </div>
    `;

    document.getElementById('mainFeed').innerHTML = ele;
    document.getElementById("userEdit_password").addEventListener("submit", function (e) { e.preventDefault()})
}


// UPDATE
async function forgotPasswordAPI(verID) {
    const url = `${apiURL}/auth/password/requests/confirmForgot/${verID}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: headers
    })

    const data = await response.json()

    if (response.status == 200) {
        document.getElementById('verResult').innerHTML = `
            <p><br>Password updated: check email for your new password. Make sure to change password after updating.</p>
        `;
    } else {
        document.getElementById('verResult').innerHTML = `
            <p><br>Password Update Failed</p>
            ${data.msg ? `<p>${data.msg}</p>` : '' }
            <p>Try again later, or could have already completed.</p>
        `;
    }
}
function setupChangePasswordRequest(verID) {
    const ele = `
        <div class="userInfo">
            <p><b>Change Password</b></p>
            <p>Change Password ID: ${verID}</p>
            </br>
            <form id="userEdit_password" class="contentMessage">
                <label for="password_text"><p>New Password</p></label>
                <input type="password" id="password_text" autocomplete="new-password" class="userEditForm" placeholder="New Password">

                <label for="password_confirm"><p>Confirm Password</p></label>
                <input type="password" id="password_confirm" autocomplete="new-password" class="userEditForm" placeholder="Confirm New Password">

                <label for="userEdit_password_old_text"><p>Old Password</p></label>
                <input type="password" id="userEdit_password_old_text" autocomplete="current-password" class="userEditForm" placeholder="Current Password">
            </form>
            <div>
                <button class="userInfo buttonStyled" onclick="changePasswordAPI('${verID}')">Change Password</button>
                <button class="userInfo buttonStyled" onclick="redirectHome()">Go Home</button>
            </div>
            <p> <br/>Press change password to update your account password, or go back home.</p> 
            <div id="verResult"></div>
        </div>
    `;

    document.getElementById('mainFeed').innerHTML = ele;
    document.getElementById("userEdit_password").addEventListener("submit", function (e) { e.preventDefault()})
}

async function changePasswordAPI(verID) {
    const url = `${apiURL}/auth/password/requests/confirmChange/${verID}`;

    const newPassword = document.getElementById("password_text")?.value;
    const confirmPassword = document.getElementById("password_confirm")?.value;
    const curPassword = document.getElementById("userEdit_password_old_text")?.value;

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            newPassword,
            confirmPassword,
            curPassword,
        })
    })


    const data = await response.json()

    if (response.status == 200 && !data.error) {
        document.getElementById('verResult').innerHTML = `
            <p><br>New Password Accepted</p>
        `;
    } else {
        document.getElementById('verResult').innerHTML = `
            <p><br>Password Update Failed</p>
            ${data.msg ? `<p>${data.msg}</p>` : '' }
            <p>Try again later, or could have already completed.</p>
        `;
    }
}

// sets up the UI for the verification request
function setupVerRequest(verID) {
    document.getElementById('mainFeed').innerHTML = `
        <div class="userInfo">
            <p><b>Verification Request</b></p>
            <p>Verification ID: ${verID}</p>
            </br>
            <div id="passwordDiv"></div>
            <button class="userInfo buttonStyled" onclick="acceptVerRequest('${verID}')">Accept</button>
            <div id="verResult"></div>
            <button class="userInfo buttonStyled" onclick="redirectHome()">Go Home</button>
            <p> <br/>Press accept to add email to account, or go back home.</p> 
        </div>
    `;

    displayPasswordReq();
}

function displayPasswordReq() {
    const ele = `
        <form id="userEdit_password" class="contentMessage">
            <label for="passwordEmail"><p><b>Enter Password</b></p></label>
            <input type="password" id="passwordEmail" class="userEditForm" placeholder="Password">
        </form>
    `

    document.getElementById('passwordDiv').innerHTML = ele;
    document.getElementById("userEdit_password").addEventListener("submit", function (e) { e.preventDefault()})
}

function getPassword() {
    const password = document.getElementById("passwordEmail")?.value;
    if (!password) return null;
    else return password;
}

// API - accepts the verification request
async function acceptVerRequest(verID) {
    document.getElementById('verResult').innerHTML = "<p>loading...</p>";
    const url = `${apiURL}/emails/requests/verification/${verID}`
    
    const password = getPassword();

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            password: password
        })
    });

    const data = await response.json()

    if (response.status == 200) {
        document.getElementById('verResult').innerHTML = `
            <p><br>Verification Accepted</p>
            <p>Email: ${data.DB.email}</p>
            <p>Verified ${checkDate(data.DB.timestampVerified)}</p>
        `;
    } else {
        document.getElementById('verResult').innerHTML = `
            <p><br>Verification Failed</p>
            ${data.msg ? `<p>${data.msg}</p>` : '' }
            <p>Try again later, or could have already completed.</p>
        `;
    }
}

// sets up the UI for the remove email request
function setupRemoveEmailRequest(removeVerID) {
    document.getElementById('mainFeed').innerHTML = `
        <div class="userInfo">
            <p><b>Remove Email Request</b></p>
            <p>Remove Email ID: ${removeVerID}</p>
            </br>
            <div id="passwordDiv"></div>
            <button class="userInfo buttonStyled" onclick="removeEmailRequest('${removeVerID}')">Accept</button>
            <div id="verResult"></div>
            <button class="userInfo buttonStyled" onclick="redirectHome()">Go Home</button>
            <p> <br/>Press accept to add email to account, or go back home.</p> 
        </div>
    `;
    displayPasswordReq();
}

// API - accepts the remove email request
async function removeEmailRequest(removeVerID) {
    document.getElementById('verResult').innerHTML = "<p>loading...</p>";

    const url = `${apiURL}/emails/requests/confirmRemove/${removeVerID}`

    const password = getPassword();
    console.log(password)

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            password: password
        })
    })

    const data = await response.json()
    
    if (response.status == 200) {
        document.getElementById('verResult').innerHTML = `
            <p><br>Removed Email</p>
            <p>Completed</p>
        `;
    } else {
        document.getElementById('verResult').innerHTML = `
            <p><br>Removal Failed</p>
            ${data.msg ? `<p>${data.msg}</p>` : '' }
            <p>Try again later, or could have already completed.</p>
        `;
    }
}

async function setupDelAccRequest(delAccVerID) {
    document.getElementById('mainFeed').innerHTML = `
        <div class="userInfo">
            <p><b>Delete Account Request</b></p>
            <p>Delete Account VerID: ${delAccVerID}</p>
            </br>
            <div id="passwordDiv"></div>
            <button class="userInfo buttonStyled" onclick="deleteAccountRequest('${delAccVerID}')">Accept Deletion</button>
            <button class="userInfo buttonStyled" onclick="cancelAccountRequest('${delAccVerID}')">Cancel Request</button>
            <div id="verResult"></div>
            <button class="userInfo buttonStyled" onclick="redirectHome()">Go Home</button>
            <p> <br/>Press accept to add email to account, or go back home.</p> 
        </div>
    `;
    
    displayPasswordReq();
}

// API - accepts the delete account request
async function deleteAccountRequest(delAccVerID) {
    document.getElementById('verResult').innerHTML = "<p>loading...</p>";

    const url = `${apiURL}/users/public/confirmDelete/${delAccVerID}`;

    const password = getPassword();

    const response = await fetch(url, {
        method: 'DELETE',
        headers: headers,
        body: JSON.stringify({
            password: password
        })
    })

    var data
    try {
        data = await response.json()
    } catch {
        console.log("failed")
    }
    
    if (response.status == 200) {
        document.getElementById('verResult').innerHTML = `
            <p><br>Account Deleted</p>
            <p>Completed</p>
        `;
    } else {
        document.getElementById('verResult').innerHTML = `
            <p><br>Deletion Failed</p>
            ${data?.msg ? `<p>${data.msg}</p>` : '' }
            <p>Try again later, or could have already completed.</p>
        `;
    }
}

// API - cancels the delete account request
async function cancelAccountRequest(delAccVerID) {
    document.getElementById('verResult').innerHTML = "<p>loading...</p>";

    const url = `${apiURL}/users/public/cancelDelete/${delAccVerID}`
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: headers
    })

    const data = await response.json()
    
    if (response.status == 200) {
        document.getElementById('verResult').innerHTML = `
            <p><br>Canceled Delete Request</p>
            <p>Completed</p>
        `;
    } else {
        document.getElementById('verResult').innerHTML = `
            <p><br>Cancelation Failed</p>
            ${data.msg ? `<p>${data.msg}</p>` : '' }
            <p>Try again later, or could have already completed.</p>
        `;
    }
}

function checkDate(time){
    var timeNum = 0
    if (!isNaN(time)) timeNum = parseFloat(time)
    else timeNum = time

    const date = dateFromEpoch(timeNum)
    return date
}

function dateFromEpoch(time) {
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

function timeSinceEpoch(diff) {
    var years = Math.floor(diff / 31556952000)
    var days = Math.floor(diff / 86400000) % 365
    var hours = Math.floor(diff / 3600000) % 24;
    var minutes = Math.floor(diff / 60000) % 60;
    var seconds = Math.floor(diff / 1000) % 60;

    if (!minutes) return `${seconds}s`
    if (!hours) return `${minutes}m ${seconds}s`
    if (!days) return `${hours}h ${minutes}m ${seconds}s`
    if (!years) return `${days}d ${hours}h ${minutes}m ${seconds}s`
    else return `${years}y ${days}d ${hours}h ${minutes}m ${seconds}s`
}