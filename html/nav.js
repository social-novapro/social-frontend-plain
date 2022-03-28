

var loginUserToken
var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
var pathArray = window.location.pathname.split( '/' );

var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'

console.log(config)
var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`
var hostedURL = `${config ? `${config.current == "prod" ? config.prod.hosted_url : config.dev.hosted_url}` : 'https://interact-api.novapro.net/v1' }`
var wsURL = `${config ? `${config.current == "prod" ? config.prod.websocket_url : config.dev.websocket_url}` : 'wss://interact-api.novapro.net/' }`

var headers = {
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}

if (location.protocol !== 'https:' && location.hostname !== 'localhost' &&location.hostname!=='127.0.0.1') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
else {
    addNavigation()
    addTitle() 
    checkLogin()
}

console.log(hostedURL)
console.log(baseUrl)
console.log(pathArray)

/*if ("WebSocket" in window) {
    ws = new WebSocket(`${wsURL}stats`)
}*/

function addNavigation() {
    document.getElementById('navArea').innerHTML = `
        <div class="nav"id="nav">
            <div id="page1Nav">${pathArray[1] != "" ? `<button class="buttonStyled"  onclick="switchNav(5)" id="page1">Feed</button>` : `<button class="buttonStyled"  onclick="switchNav(1)" id="page1">Live Chat</button>`}</div>
            <div id="page2Nav"><button class="buttonStyled"  onclick="switchNav(2)" id="page2">Profile</button></div>
            <div id="page3Nav"><button class="buttonStyled"  onclick="switchNav(3)" id="page3">DevMode</button></div>
            <div id="page4Nav"><button class="buttonStyled"  onclick="createPostModal()" id="page4Nav">Create Post</button></div>
            <div id="page5Nav"><button class="buttonStyled"  onclick="signOut()" id="page5">Sign Out</button></div>
        </div>
    `
}

function addTitle() {
    document.title = 'Interact'
}

async function signOut() {
    console.log(pathArray)
    localStorage.removeItem(LOCAL_STORAGE_LOGIN_USER_TOKEN);
    
    if (pathArray[1] == "" || "begin") window.location.href = `/begin`
    else window.location.href = `/begin?redirect=${pathArray[1]}`
}

async function sendLoginRequest() {
    const response = await fetch(`${apiURL}/auth/checkToken/`, {
        method: 'GET',
        headers,
    })

    return response
}

async function redirectPage() {
    if (pathArray[1]=="begin") return
    else if (pathArray[1]=="") window.location.href='/begin'
    else window.location.href=`/begin?redirect=${pathArray[1]}`
}

async function checkLogin() {
    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    if (!userStorageLogin) return redirectPage()
    else {
        currentUserLogin = JSON.parse(userStorageLogin)

        headers.accesstoken = currentUserLogin.accessToken
        headers.usertoken = currentUserLogin.userToken
        headers.userid = currentUserLogin.userID
    }

    const response = await sendLoginRequest()
    if (!response.ok) return redirectPage()

    const userData = await response.json()

    if (!userData.login) return redirectPage()
    return
}

/* // GET REQUESTED COOKIE
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
}*/

async function switchNav(pageVal) {
    switch (pageVal) {
        // SEARCH
        case 1:
            window.location.href = `/live-chat`
            break;
        case 2:
            profile()
            break;
        case 3:
            debugModeSwitch()
            break;
        case 4:
            showModal(`
                <h1>Create a new Post</h1>
                <textarea class="postTextArea" id="newPostTextArea"></textarea>
                <button class="buttonStyled" onclick="createPost()">Upload Post</button>
            `, true)
            break;
            
        case 5:
                window.location.href='/'
            break;
        default:
            break;
    }
}

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