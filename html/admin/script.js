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

function checkURLParams() {
    var paramsInfo = {
        paramsFound: false
    }

    const ifErrors = params.has('errors')

    if (ifErrors) {
        paramsFound = true
        paramsInfo.paramsFound = true
        listErrors()
    }
   
    return paramsInfo
}

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
    if (!loginUserToken) return window.location.href = "/begin/?live-chat";
    else return setupUI()
}

function setupUI() {
    document.getElementById('mainFeed').innerHTML = `
        <div class="menu menu-style">
            <p><b>Verifications</b></p>
            <div id="verifyRequests">
                <button class="menuButton menuButton-style" onclick="verifyRequests()" class="buttonStyled">Check Verification Requests</button>
            </div>
            <div id="listVerifications">
                <button class="menuButton menuButton-style" onclick="listVerifications()" class="buttonStyled">Check Verification List</button>
            </div>
        </div>
        <div class="menu menu-style">
            <p><b>Admins</b></p>
            <div id="adminRequests">
                <button class="menuButton menuButton-style" onclick="adminRequests()" class="buttonStyled">Check Admin Requests</button>
            </div>
            <div id="listAdmins">
                <button class="menuButton menuButton-style" onclick="listAdmins()" class="buttonStyled">Check Admin List</button>
            </div>
        </div>
        <div class="menu menu-style">
            <p><b>Errors</b></p>
            <div id="listErrors">
                <button class="menuButton menuButton-style" onclick="listErrors()">Check Errors List</button>
                <div id="errorIndex1"></div>
            </div>
        </div>
        <div id="errorListing"></div>
        <div id="errorIndex2"></div>

    `;
    
    checkURLParams();
};

async function listErrors(listID) {
    var response;

    if (!listID) {
        response = await fetch(`${apiURL}/admin/errors/list/`, {
            method: "GET",
            headers
        })
    
    } else {
        response = await fetch(`${apiURL}/admin/errors/list/${listID}`, {
            method: "GET",
            headers
        })
    }

    if (!response.ok) return console.log(response)
    
    const res = await response.json();

    var ele = ``;
    const indexEle = `
        <div class="menu menu-style">
            <p>${res.amount} found errors</p>
            ${res.prevIndexID ? `<button class="menuButton menuButton-style" onclick="listErrors('${res.prevIndexID}')">Load previous set</button>` : ''}
            ${res.nextIndexID ? `<button class="menuButton menuButton-style" onclick="listErrors('${res.nextIndexID}')">Load next set</button>` : '' }
        </div>
    `

    document.getElementById("errorIndex1").innerHTML = indexEle;
    document.getElementById("errorIndex2").innerHTML = indexEle;

    var i=0;
    for (const issueError of res.foundIssues.reverse()) {
        i++;
        ele+=`
            <div class="menu menu-style" id="errorEle_${issueError._id}">
            <p>Error Listing #${i}</p>

            ${createErrorElement(issueError)}
            </div>
        `
    }

    document.getElementById('errorListing').innerHTML = ele;
}

async function previewUser(userID) {
    const userRes = await fetch(`${apiURL}/get/userByID/${userID}`, {
        method: 'GET',
        headers
    });
   
    const userData = await userRes.json();
    if (userData.error) showModal(`<p>Error Occured</p>`);

    showModal(`
        <h2>User Information</h2>
        <p>${userData.displayName} @${userData.username}</p>
        ${userData.description ? `<p>Bio: ${userData.description }</p>`: ''}
    `);
}

function createErrorElement(issueError) {
    var timesinceResolved = null;
    var timestampReview = null;
    var timestamp = null;
    
    if (issueError.reviewTimestamp) timestampReview = checkDateV2(issueError.reviewTimestamp);
    if (issueError.resolvedTimestamp) timesinceResolved = checkDateV2(issueError.resolvedTimestamp);
    if (issueError.timestamp) timestamp = checkDateV2(issueError.timestamp);
    
    return `
        <div class="menu menu-style">
            <p><b>${issueError.errorCode}:</b> ${issueError.errorMsg}</p>
            <p>${timestamp}</p>
        </div>
        ${issueError.errorVersion == 2 ? `
            <button class="menuButton menuButton-style" onclick="previewUser('${issueError.userID}')">View User</button>
        `: ``}
        ${issueError.reviewedBy ? `
            <button class="menuButton menuButton-style" onclick="previewUser('${issueError.reviewedBy}')">Reviewer</button>
        `: ``}
        ${ issueError.inReview ? `
            ${ issueError.reviewedBy != headers.userid || issueError.resolved ? `
                <button class="menuButton menuButton-style" onclick="overrideReview('${issueError._id}')">Take over review</button>
            ` : `
                <button class="menuButton menuButton-style" onclick="markResolved('${issueError._id}')">Mark as resolved</button>
            ` }
        ` : issueError.resolved ? `
            <button class="menuButton menuButton-style" onclick="overrideReview('${issueError._id}')">Mark as unresolved+in review</button>
        `:`
            <button class="menuButton menuButton-style" onclick="markInReview('${issueError._id}')">Mark in review</button>
        ` }
        <div class="menu menu-style">
            ${issueError.inReview ? `
                <p>In review: ${issueError.inReview}</p>
                <p>${timestampReview}</p>
            ` : `
                <p>Not Under Review</p>
            `}
        </div>
        <div class="menu menu-style">
            ${issueError.resolved ? `
                <p>Resolved: ${issueError.resolved}</p>
                <p>${timesinceResolved}</p>
                ` : `
                <p>Unresolved</p>
            `}
        </div>
        <div class="menu menu-style">
            <p>UserID: ${issueError.userID}</p>
            <p>Reviewer: ${issueError.reviewedBy}</p>
            <p>Issue Version: ${issueError.errorVersion}</p>
        </div>
    `;
}

async function markInReview(errorID) {
    if (!errorID) return alert("no provided error id");

    const response = await fetch(`${apiURL}/admin/errors/review/${errorID}`, {
        method: 'POST',
        headers: headers
    })

    if (!response.ok) return console.log(response);
    const result = await response.json(); 

    document.getElementById(`errorEle_${result._id}`).innerHTML=createErrorElement(result);
}

async function markResolved(errorID) {
    if (!errorID) return alert("no provided error id");

    const response = await fetch(`${apiURL}/admin/errors/resolve/${errorID}`, {
        method: 'POST',
        headers: headers
    })

    if (!response.ok) return console.log(response);

    const result = await response.json(); 
    document.getElementById(`errorEle_${result._id}`).innerHTML=createErrorElement(result);
}

async function overrideReview(errorID) {
    if (!errorID) return alert("no provided error id");

    const response = await fetch(`${apiURL}/admin/errors/overrideReview/${errorID}`, {
        method: 'POST',
        headers: headers
    })

    if (!response.ok) return console.log(response);

    const result = await response.json(); 
    document.getElementById(`errorEle_${result._id}`).innerHTML=createErrorElement(result);
}

async function listVerifications() {
    const response = await fetch(`${apiURL}/admin/get/verificationList`, {
        method: 'GET',
        headers: headers
    })
    if (!response.ok) return console.log(response);

    const requests = await response.json();

    const users = {};
    for (const request of requests) {
        if (!users[request._id]) {
            const getUser = await fetch(`${apiURL}/get/userByID/${request._id}`, {
                method: 'GET',
                headers: headers
            });

            const userData = await getUser.json();

            users[request._id] = userData;
        }
    }
    document.getElementById('listVerifications').innerHTML += `
        <div>
            ${requests.map((request) => {
                    return putData(users[request._id]);
                }).join('')
            }
        </div>
    `;

}
async function verifyRequests() {
    const response = await fetch(`${apiURL}/admin/get/verificationRequests`, {
        method: 'GET',
        headers: headers
    })
    if (!response.ok) return console.log(response);

    const requests = await response.json();

    const users = {};
    for (const request of requests) {
        if (!users[request._id]) {
            const getUser = await fetch(`${apiURL}/get/userByID/${request._id}`, {
                method: 'GET',
                headers: headers
            });
        
            const userData = await getUser.json();
            users[request._id] = userData;
        }
    }

    document.getElementById('verifyRequests').innerHTML = `
        <a onclick="closeVerificationTab()" class="buttonStyled">Close Verification Requests</a>
        <div>
            ${requests.map((request) => {
                console.log(users[request._id]);
                    return verificationRequestEle(request, users[request._id]);
                }).join('')
            }
        </div>
    `;
}

function verificationRequestEle(request, userData) {
    return `
        <div id="userver_${userData._id}" class="menu menu-style">
            <p>${userData.displayName} @${userData.username}</p>
            <p>${checkDate(request.timestamp)}</p>
            <p>${request.content}</p>
            <a onclick="acceptVerification('${userData._id}')" class="menuButton menuButton-style">Accept</a>
        </div>
    `
}

async function acceptVerification(id) {
    const response = await fetch(`${apiURL}/admin/put/acceptVerification/${id}`, {
        method: 'PUT',
        headers: headers
    });

    if (!response.ok) return console.log(response);
    
    document.getElementById(`userver_${id}`).remove();
}

function putData(userData) {
    return `
        <div id="userver_${userData._id}">
            <p>${userData.username}
        </div>
    `
}

async function closeVerificationTab() {
    document.getElementById('verifyRequests').innerHTML = `
        <a onclick="verifyRequests()" class="menuButton menuButton-style">Check Verification Requests</a>
    `;
}

async function adminRequests() {
    const response = await fetch(`${apiURL}/admin/get/verificationRequests`, {
        method: 'GET',
        headers: headers
    })
    if (!response.ok) return console.log(response);
    const requests = await response.json();

    const users = {};
    for (const request of requests) {
        if (!users[request._id]) {
            const getUser = await fetch(`${apiURL}/get/userByID/${request._id}`, {
                method: 'GET',
                headers: headers
            });
        
            const userData = await getUser.json();
            // console.log(userData);
            users[request._id] = userData;
        }
    }

    document.getElementById('adminRequests').innerHTML = `
        <a onclick="closeAdminTab()" class="menuButton menuButton-style">Close Admin Requests</a>
        <div>
            ${requests.map((request) => {
                console.log(users[request._id]);
                    return adminRequestEle(request, users[request._id]);
                }).join('')
            }
        </div>
    `;
}

function adminRequestEle(request, userData) {
    return `
        <div id="adminR_userver_${userData._id}" class="menu menu-style">
            <p>${userData.displayName} @${userData.username}</p>
            <p>Date Requested: ${checkDate(request.timestamp)}</p>
            <p>Content: ${request.content}</p>
            <p>Type: ${request.adminType ? request.adminType : "Unknown"}</p>
            <a onclick="acceptAdmin('${userData._id}')" class="menuButton menuButton-style">Accept</a>
        </div>
    `
}

async function acceptAdmin(id) {
    const response = await fetch(`${apiURL}/admin/put/acceptAdmin/${id}`, {
        method: 'PUT',
        headers: headers
    });

    if (!response.ok) return console.log(response);
    
    document.getElementById(`adminR_userver_${id}`).remove();
}

async function closeAdminTab() {
    document.getElementById('adminRequests').innerHTML = `
        <a onclick="adminRequests()" class="menuButton menuButton-style">Check Admin Requests</a>
    `;
}

function checkDateV2(time){
    var timeNum = 0
    if (!isNaN(time)) timeNum = parseFloat(time)
    else timeNum = time
    
    var currentTime = getTime()

    const diff = (currentTime - timeNum)
    const date = dateFromEpochv2(timeNum)
    const timesince = timeSinceEpoch(diff)
    return date
}
function getTime() {
    const d = new Date();
    const currentTime = d.getTime()
    return currentTime
}
function dateFromEpochv2(time) {
    const date = new Date(time)
    const year = date.getFullYear()
    const day = date.getDate()
    const month = date.getMonth()
    const monthReadable = checkMonth(month)
    const hoursRaw = date.getHours()
    const hours = `${hoursRaw > 12 ? hoursRaw - 12 : hoursRaw}`;
    const minutes = date.getMinutes();

    return `${monthReadable} ${day}, ${year} at ${hours}:${minutes} ${hoursRaw > 12 ? 'PM' : 'AM'}`
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