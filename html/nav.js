var loginUserToken
var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
var pathArray = window.location.pathname.split( '/' );

console.log(baseUrl)
console.log(pathArray)
addNavigation()
addTitle() 
checkLogin()

var apiURL
var hostedURL

fetch('/config.json').then(response => response.json()).then(data => {
    if (data.current == "dev") {
        apiURL = data.dev.api_url
        hostedURL = data.dev.hosted_url
    }
    else {
        apiURL = data.prod.api_url
        hostedURL = data.prod.hosted_url
    }
    checkLogin()
})

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
    
    if (pathArray[0] == "" || "begin") window.location.href = `${hostedURL}begin`
    else window.location.href = `${hostedURL}begin?redirect=${pathArray[1]}`
}

async function checkLogin() {
    const LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'

    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    console.log(userStorageLogin)
    if (userStorageLogin) {
        currentUserLogin = JSON.parse(userStorageLogin)
        loginUserToken = true
    }
}

async function switchNav(pageVal) {
    switch (pageVal) {
        // SEARCH
        case 1:
            window.location.href = `${hostedURL}live-chat`
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