var loginUserToken
var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
var pathArray = window.location.pathname.split( '/' );

addNavigation()
addTitle() 
checkLogin()

function addNavigation() {
    document.getElementById('navArea').innerHTML = `
        <div class="nav"id="nav">
            <button class="buttonStyled"  onclick="switchNav(1)" id="page1">Live Chat</button>
            <button class="buttonStyled"  onclick="switchNav(2)" id="page2">Profile</button>
            <button class="buttonStyled"  onclick="switchNav(3)" id="page3">DevMode</button>
            <button class="buttonStyled"  onclick="switchNav(4)" id="page4">Create Post</button>
            <button class="buttonStyled"  onclick="showModal()" id="page4">show</button>
            <button class="buttonStyled"  onclick="signOut()" id="page5">Sign Out</button>
        </div>
    `
}

function addTitle() {
    document.title = 'Interact'
}

async function signOut() {
    console.log(pathArray)
    localStorage.removeItem(LOCAL_STORAGE_LOGIN_USER_TOKEN);
    window.location.href = `/begin/?${pathArray[2]}`;
}

async function checkLogin() {
    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    if (userStorageLogin) {
        currentUserLogin = JSON.parse(userStorageLogin)
        loginUserToken = true
    }
}