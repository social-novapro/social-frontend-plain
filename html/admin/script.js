var loginUserToken = false
var currentUserLogin = { }
var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var baseURL
var headers = {
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}
var verifiedConnection = false

// console.log(config.dev.websocket_url)
document.getElementById('mainFeed').innerHTML = 'eijj';
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
        <div id="verifyRequests">
            <a onclick="verifyRequests()" class="buttonStyled">Check Verification Requests</a>
        </div>
        <div id="listVerifications">
            <a onclick="listVerifications()" class="buttonStyled">Check Verification List</a>
        </div>
        <div id="adminRequests">
            <a onclick="adminRequests()" class="buttonStyled">Check Admin Requests</a>
        </div>
        <div id="listAdmins">
            <a onclick="listAdmins()" class="buttonStyled">Check Admin List</a>
        </div>
        <div id="listErrors">
            <a onclick="listErrors()" class="buttonStyled">Check Errors List</a>
        </div>
        <div id="errorListing"></div>
    `;
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

    var ele = `
        <div class="userInfo">
            <p>${res.amount} found errors</p>
            ${res.prevIndexID ? `<p class="userInfo buttonStyled" onclick="listErrors('${res.prevIndexID}')">Load previous set</p>` : ''}
            ${res.nextIndexID ? `<p class="userInfo buttonStyled" onclick="listErrors('${res.nextIndexID}')">Load next set</p>` : '' }
        </div>
    `;

    for (const issueError of res.foundIssues) {
        ele+=`
            <div class="userInfo">
                <p>Code: ${issueError.errorCode}</p>
                <p>Msg: ${issueError.errorMsg}</p>
                <p>In review: ${issueError.resolved}</p>
                <p>Resolved: ${issueError.inReview}</p>
            </div>
        `
    }
    document.getElementById('errorListing').innerHTML = ele;

}
async function listVerifications() {
    const response = await fetch(`${apiURL}/admin/get/verificationList`, {
        method: 'GET',
        headers: headers
    })
    if (!response.ok) return console.log(response);

    const requests = await response.json();
    // console.log(requests);

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
    // console.log(requests);

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
        <div id="userver_${userData._id}" class="userInfo">
            <p>${userData.displayName} @${userData.username}</p>
            <p>${checkDate(request.timestamp)}</p>
            <p>${request.content}</p>
            <a onclick="acceptVerification('${userData._id}')" class="buttonStyled">Accept</a>
        </div>
    `
}

async function acceptVerification(id) {
    const response = await fetch(`${apiURL}/admin/put/acceptVerification/${id}`, {
        method: 'PUT',
        headers: headers
    });

    if (!response.ok) return console.log(response);
    
    // const data = await response.json();
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
        <a onclick="verifyRequests()" class="buttonStyled">Check Verification Requests</a>
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
        <a onclick="closeAdminTab()" class="buttonStyled">Close Admin Requests</a>
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
        <div id="adminR_userver_${userData._id}" class="userInfo">
            <p>${userData.displayName} @${userData.username}</p>
            <p>Date Requested: ${checkDate(request.timestamp)}</p>
            <p>Content: ${request.content}</p>
            <p>Type: ${request.adminType ? request.adminType : "Unknown"}</p>
            <a onclick="acceptAdmin('${userData._id}')" class="buttonStyled">Accept</a>
        </div>
    `
}

async function acceptAdmin(id) {
    const response = await fetch(`${apiURL}/admin/put/acceptAdmin/${id}`, {
        method: 'PUT',
        headers: headers
    });

    if (!response.ok) return console.log(response);
    
    // const data = await response.json();
    document.getElementById(`adminR_userver_${id}`).remove();
}

async function closeAdminTab() {
    document.getElementById('adminRequests').innerHTML = `
        <a onclick="adminRequests()" class="buttonStyled">Check Admin Requests</a>
    `;
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