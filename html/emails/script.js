var loginUserToken = false
var currentUserLogin = { }
var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var baseURL
var headers = {
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
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

    if (ifReqVer) {
        paramsInfo.paramsFound = true
        paramsInfo.verification = params.get('verification')
        setupVerRequest(paramsInfo.verification)
    } else if (ifReqRemoveEmail) {
        paramsInfo.paramsFound = true
        paramsInfo.removeEmail = params.get('removeEmail')
        setupRemoveEmailRequest(paramsInfo.removeEmail)
    }

    return paramsInfo
}

// sets up the UI for the verification request
function setupVerRequest(verID) {
    document.getElementById('mainFeed').innerHTML = `
        <div class="userInfo">
            <p><b>Verification Request</b></p>
            <p>Verification ID: ${verID}</p>
            <button class="userInfo buttonStyled" onclick="acceptVerRequest('${verID}')">Accept</button>
            <div id="verResult"></div>
            <button class="userInfo buttonStyled" onclick="redirectHome()">Go Home</button>
            <p> <br/>Press accept to add email to account, or go back home.</p> 
        </div>
    `;
}

// API - accepts the verification request
async function acceptVerRequest(verID) {
    document.getElementById('verResult').innerHTML = "<p>loading...</p>";
    const url = `${apiURL}/emails/requests/verification/${verID}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: headers
    })

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
            <button class="userInfo buttonStyled" onclick="removeEmailRequest('${removeVerID}')">Accept</button>
            <div id="verResult"></div>
            <button class="userInfo buttonStyled" onclick="redirectHome()">Go Home</button>
            <p> <br/>Press accept to add email to account, or go back home.</p> 
        </div>
    `;
}

// API - accepts the remove email request
async function removeEmailRequest(removeVerID) {
    document.getElementById('verResult').innerHTML = "<p>loading...</p>";

    const url = `${apiURL}/emails/requests/confirmRemove/${removeVerID}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: headers
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