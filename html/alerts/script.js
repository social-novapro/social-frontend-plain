// can show alerts
// check if admin
// get alerts

var loginUserToken = false
var currentUserLogin = { }
var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var baseURL
var headers = {
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}
var verifiedConnection = false

var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`

if (location.protocol !== 'https:' && !((/localhost|(127|192\.168|10)\.(\d{1,3}\.?){2,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3}\.?){2}/).test(location.hostname))) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
} else checkLogin();

async function checkLogin() {
    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    if (userStorageLogin) {
        currentUserLogin = JSON.parse(userStorageLogin)
        headers.accesstoken = currentUserLogin.accessToken
        headers.usertoken = currentUserLogin.userToken
        headers.userid = currentUserLogin.userID
        loginUserToken = true
    }
    if (!loginUserToken) return window.location.href = "/begin/?alerts";
    else return setupUI()
}


function setupUI() {
    document.getElementById('mainFeed').innerHTML = `
        <div id="latestAlert"></div>
        <div id="verifyRequests">
            <a onclick="setupCreate()" class="buttonStyled">Create Alert</a>
        </div>
        <div id="listVerifications">
            <a onclick="listAlerts()" class="buttonStyled">List Alerts</a>
        </div>
        <div id="alertCreate"></div>
        <div id="alertList"></div>
    `
    getLatestAlert();
}

async function fetchAlert(alertID) {
    const response = await fetch(`${apiURL}/alert/get/${alertID}`, {
        method: 'GET',
        headers: headers
    });

    const alertFetch = await response.json();
    console.log(alertFetch);

    if (!response.ok) return console.log(response);
    else return alertFetch;
}

async function getLatestAlert() {
    const response = await fetch(`${apiURL}/alert/get/latest`, {
        method: 'GET',
        headers: headers
    })
    
    const alertFetch = await response.json();
    console.log(alertFetch);
    if (!response.ok) return console.log(response);

    document.getElementById('latestAlert').innerHTML = alertEle(alertFetch.alert);
}

async function listAlerts() {
    const response = await fetch(`${apiURL}/alert/get/list`, {
        method: 'GET',
        headers: headers
    })
    
    const indexFetch = await response.json();
    console.log(indexFetch);
    // if (debug) console.log(alertFetch);
    if (!response.ok) return console.log(response);

    var ele = ``;
    for (let i = 0; i < indexFetch.index.alerts.length; i++) {
        const alertID = indexFetch.index.alerts[i];
        const alertData = await fetchAlert(alertID._id);
        ele += alertEle(alertData.alert);
    }
    document.getElementById('alertList').innerHTML = ele;
}

function setupCreate() {

}


function alertEle(alert) {
    const { alertID, title, content } = alert;
    return `
        <div class="publicPost" id="alertID">
            <h1>${title}</h3>
            <p>${content}</p>
        </div>
    `;
}