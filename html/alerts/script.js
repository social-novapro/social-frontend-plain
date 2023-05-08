// can show alerts
// check if admin
// get alerts

var loginUserToken = false
var currentUserLogin = { }
var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var baseURL
var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}


var verifiedConnection = false

// remove these 2
var adminUser = true;
var devMode = true;

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
        <div class="publicPost" id="create">
            <a onclick="setupCreate()" class="buttonStyled">Create Alert</a>
        </div>
        <div class="publicPost" id="list">
            <a onclick="listAlerts()" class="buttonStyled">List Alerts</a>
        </div>
        <div id="getAlert">
            <div class="publicPost">
                <h1>Get Alert</h1>
                <form id="requestAlert" onsubmit="userRequestedAlert()">
                    <div class="userInfo">
                    <p>Enter Alert ID:</p>
                    <input class="contentMessage userEditForm" id="alertIDPlace" placeholder="Alert ID" type="text"></input>
                    <div class="signInDiv">
                        <button class="buttonStyled" type="submit">Fetch</button>
                    </div>
                </form>
            </div>     
        </div>
        <div id="alertCreate"></div>
        <div id="newAlert"></div>
        <div id="alertList"></div>
        <div id="alert"></div>
    `

    document.getElementById("requestAlert").addEventListener("submit", function (e) { e.preventDefault()});
    getLatestAlert();
}

async function userRequestedAlert() {

    const alertID = document.getElementById('alertIDPlace').value
    const data = await fetchAlert(alertID);
    // if ()
    console.log(data);
    document.getElementById('alert').innerHTML = alertEle(data.alert);
}

async function fetchAlert(alertID) {
    const response = await fetch(`${apiURL}/alert/get/${alertID}`, {
        method: 'GET',
        headers: headers
    });

    const alertFetch = await response.json();
    console.log(alertFetch);

    if (!response.ok) return { error: true, };
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

async function sendCreateAlert() {
    var title = document.getElementById('alertTitleCreate').value;
    var content = document.getElementById('alertContentCreate').value;
    var linked = document.getElementById('alertLinkedCreate').value;

    const data = {
        title: title || null,
        content: content,
        postID: linked || null
    }
    console.log(data)

    const response = await fetch(`${apiURL}/alert/create/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    })

    // if (response.status != 200) 
    console.log(response)
    const alertData = await response.json()
    console.log(alertData)

    if (response.ok) {
        document.getElementById('newAlert').innerHTML = `
            <div class="publicPost">
                <h1>Alert Created!</h1>
                ${alertEle(alertData.alert)}
            </div>
        `
    }
    else return showModal(`<p>Error: ${alertData.code}\n${alertData.msg}</p>`)

    if (userData.login === true) return redirection()
}

function setupCreate() {
    // title
    // content
    // linked post
    document.getElementById('alertCreate').innerHTML = `
        <div class="userInfo">
        <h1>Create Alert</h1>
            <form onsubmit="sendCreateAlert()" id="createAlertForm">
                <div class="userInfo">
                    <p>Enter Title:</p>
                    <p><input class="contentMessage userEditForm" id="alertTitleCreate" placeholder="Title" type="text" "></p>
                </div>
                <div class="userInfo">
                    <p>Enter Content:*</p>
                    <p><input class="contentMessage userEditForm" id="alertContentCreate" placeholder="Password" type="text"></p>
                </div>
                <div class="userInfo">
                    <p>Enter Linked Post:</p>
                    <p><input class="contentMessage userEditForm" id="alertLinkedCreate" placeholder="Password" type="text"></p>
                </div>
                <div class="signInDiv">
                    <button class="buttonStyled" type="submit">Create</div>
                </div>
            </form>
        </div>
        <div class="search">
    `

    document.getElementById("createAlertForm").addEventListener("submit", function (e) { e.preventDefault()})
}

async function archiveAlert(alertID) {
    const response = await fetch(`${apiURL}/alert/archive/${alertID}`, {
        method: 'PUT',
        headers
    })

    const alertData = await response.json()
    console.log(alertData)
}

function alertEle(alert) {
    const { _id: alertID, title, content, isArchived } = alert;
    return `
        <div class="publicPost" id="alertID">
            ${title ? 
                `
                    <h1>${title}</h1>
                ` : ``
            }
            <p>${content}</p>
            ${isArchived == true ?
                `
                    <p>Archived</p>
                ` : ``
            }
            ${adminUser == true && isArchived != true ? 
                `
                    <p onclick="archiveAlert('${alertID}')">Archive</p>
                ` : `
                    not an admin or is already archived
                `
            }
            ${devMode ? 
                `
                    <p>${alertID}</p>
                ` : ` `
            }
        </div>
    `;
}