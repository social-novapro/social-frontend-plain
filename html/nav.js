

var loginUserToken
var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
var pathArray = window.location.pathname.split( '/' );

var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var LOCAL_STORAGE_LOGINS='social.loginAccounts'
var LOCAL_STORAGE_THEME_SETTINGS = 'social.themeSettings'
var LOCAL_STORAGE_THEME_POSSIBLE = 'social.themePossible'

// console.log(config)
var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`
var hostedURL = `${config ? `${config.current == "prod" ? config.prod.hosted_url : config.dev.hosted_url}` : 'https://interact-api.novapro.net/v1' }`
var wsURL = `${config ? `${config.current == "prod" ? config.prod.websocket_url : config.dev.websocket_url}` : 'wss://interact-api.novapro.net/' }`

var headers = {
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}
var openedSidebar = false
var mainContentSideBarOpenClosed = false
var debug = false;

var sideBarOpenClosed = document.getElementById("expandingNavBar")
var mainContentSideBarOpenClosed = document.getElementById("expandingMainContent")

if (location.protocol !== 'https:' && !((/localhost|(127|192\.168|10)\.(\d{1,3}\.?){2,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3}\.?){2}/).test(location.hostname))) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
else {
   startup()
}

async function startup(){
    devMode();
    addNavigation()
    checkNavCookie()
    addTitle() 
    checkLogin()
    loadTheme();
}

// DEBUGGING MODE
function devMode() {
    const debugStr = getCookie("debugMode");
    if (debugStr == "true") {
        debug = true;
        addDebug();
    } else {
        debug=false;
        removeDebug();
    }
}

// ADDING DEBUG INFO TO EVERYTHING
function addDebug() {
    for (debugging of document.getElementsByClassName("debug")) {
        debugging.classList.add("debug-shown"); 
    }
}

// REMOVES DEBUG INFO FROM EVERYTHING
function removeDebug() {
    for (debugging of document.getElementsByClassName("debug")) {
        debugging.classList.remove("debug-shown"); 
    }
}

// SWITCHING DEBUGGING MODE
function debugModeSwitch() {
    if(!debug) {
        setCookie("debugMode", true, 365);
        addDebug()
        debug = true
    } else {
        setCookie("debugMode", false, 365);
        removeDebug()
        debug = false
    }
}

function copyToClipboard(data) {
    navigator.clipboard.writeText(data);
}

async function loadTheme() {
    const prevSettings = getThemeSettings(); // and loads 
    
    const currentTheme = await getTheme();
    if (!currentTheme || !currentTheme.colourTheme) {
        // sets empty theme
        await applyThemeNav({});
        return false;
    };
    if (
        prevSettings &&
        prevSettings._id == currentTheme._id && 
        prevSettings.timestamp_edited == currentTheme.timestamp_edited
    ) return true;
    else setThemeSettings(currentTheme);

    await applyThemeNav(currentTheme);

    return true;
}

function getThemeSettings() {
    const themeSettings = localStorage.getItem(LOCAL_STORAGE_THEME_SETTINGS)
    if (!themeSettings) return false;
    else {
        currentThemeSettings = JSON.parse(themeSettings);
        if (!currentThemeSettings || !currentThemeSettings.colourTheme) return false;
        quickApplyThemeNav(currentThemeSettings.colourTheme);

        return currentThemeSettings;
    }
}

function setThemeSettings(newData) {
    if (!newData) return removeThemeSettings();
    localStorage.setItem(LOCAL_STORAGE_THEME_SETTINGS, JSON.stringify(newData))
}

function removeThemeSettings() {
    localStorage.removeItem(LOCAL_STORAGE_THEME_SETTINGS)
}

async function applyThemeNav(theme) {
    const themeSettings = theme.colourTheme;

    setThemeSettings(theme);

    const findSettings = await getPossibleThemeEdits();
    if (findSettings && !findSettings.error) localStorage.setItem(LOCAL_STORAGE_THEME_POSSIBLE, JSON.stringify(findSettings))

    // removes current theme
    unsetTheme()
   
    const style = document.createElement('style');
    style.id="themeStyle"
    
    if (!findSettings || findSettings.error || findSettings[0]) return;
    for (const option of findSettings) {
        const optionName = option.option;
        if (optionName == "_id") continue;
        if (themeSettings && themeSettings[optionName]) style.innerHTML += setTheme(optionName, themeSettings[optionName], option.styles)
        else style.innerHTML += setTheme(optionName, null, option.styles)
    }

    document.head.appendChild(style);

    return true;
}

function unsetTheme() {
    const rmStyle = document.getElementById('themeStyle');
    if (rmStyle) document.head.removeChild(rmStyle);
    return true;
}

function quickApplyThemeNav(themeSettings) {
    const style = document.createElement('style');
    style.id="themeStyle"
    const possible = JSON.parse(localStorage.getItem(LOCAL_STORAGE_THEME_POSSIBLE))

    if (possible && possible[0]) {
        for (const option of possible) {
            const optionName = option.option;
            if (optionName == "_id") continue;
            if (themeSettings && themeSettings[optionName]) style.innerHTML += setTheme(optionName, themeSettings[optionName], option.styles)
            else style.innerHTML += setTheme(optionName, null)
        }
    } else {
        for (const option in themeSettings) {
            if (option == "_id") continue;
            style.innerHTML += setTheme(option, themeSettings[option] ? themeSettings[option] : null);
        }
    }

    // applies new theme
    document.head.appendChild(style);

    return true;
}

function getStyles(name) {
    const possible = JSON.parse(localStorage.getItem(LOCAL_STORAGE_THEME_POSSIBLE))
    
    if (possible && possible[0]) {
        for (const option of possible) {
            if (option.option == name) return option.styles;
        }
    }
}

function setTheme(name, value, styles) {
    if (name.includes("font")) {
        var newName = name.replace("font_", "");
        newName+= "-style";
        var styling = `.${newName}`;
        
        if (styles) {
            for (const style of styles) {
                styling += `, .${newName} ${style} `
            }
        }

        return `${styling} { color: ${value}; } \n`;
    }
    
    return `.${name}-style { background-color: ${value}; } \n`;
}

async function getTheme(themeID) {
    const response = await fetch(`${themeID ? `${apiURL}/users/profile/theme/${themeID}` : `${apiURL}/users/profile/theme/user/`}`, {
        method: 'GET',
        headers,
    });

    const res = await response.json();

    return res;
}

async function getPossibleThemeEdits() {
    const response = await fetch(`${apiURL}/users/profile/theme/possible`, {
        method: 'GET',
        headers,
    });

    const res = await response.json();

    return res;
}

function addNavigation() {
    return newNavigation();
}

function newNavigation() {
    document.getElementById('expandingNavBar').innerHTML = `
        <ul class="navbar-nav navigation-style">
            <li class="nav-item pointerCursor" id="navSection0">
                <div id="page2Nav" class="nav-link" onclick="switchNav(5)">
                    <span class="material-symbols-outlined nav-button";>home</span>
                    <span class="link-text pointerCursor" id="page0">Home</span>
                </div>
            </li>
            <li class="nav-item pointerCursor" id="navSection1">
                <div id="page1Nav" class="nav-link" onclick="switchNav(1)">
                    <span class="material-symbols-outlined nav-button";>chat</span>
                    <span class="link-text pointerCursor" id="page1">${pathArray[1] != "" ? `Live Chat` : `Live Chat`}</span>
                </div>
            </li>
            ${pathArray[1] != "" ? "" : `
            <li class="nav-item pointerCursor" id="navSection4">
                <div id="page4Nav" class="nav-link" onclick="createPostModal()">
                    <span class="material-symbols-outlined nav-button";>post_add</span>
                    <span class="link-text pointerCursor" id="page4">Create Post</span>
                </div>
            </li> 
            <li class="nav-item pointerCursor" id="navSection3">
                <div id="page3Nav" class="nav-link" onclick="switchNav(7)">
                    <span class="material-symbols-outlined nav-button";>Settings</span>
                    <span class="link-text pointerCursor" id="page7">Settings</span>
                </div>
            </li>
            <li class="nav-item pointerCursor" id="navSection6">
                <div id="page6Nav" class="nav-link" onclick="switchNav(6)">
                    <span class="material-symbols-outlined nav-button";>notifications</span>
                    <span class="link-text pointerCursor" id="page6">Notifications</span>
                </div>
            </li>`}
            ${pathArray[1] != "" ? `` : `
            <li class="nav-item pointerCursor" id="navSection5">
                <div id="searchBar" class="nav-link" onclick="activeSearchBar()">
                    <span class="material-symbols-outlined nav-button";>search</span>
                    <span class="link-text pointerCursor" id="page6">Search</span>
                </div>
            </li>`}
            <li class="nav-item pointerCursor expanding-button">
                <div id="expand" class="nav-link" onclick="sidebarOpen()">
                    <span class="material-symbols-outlined nav-button";>arrow_forward_ios</span>
                    <span class="link-text pointerCursor" id="page1">Expand</span>
                </div>
            </li>
        </ul>
    `
    return true;
};

function addTitle() {
    document.title = 'Interact'
}

async function signOut() {
    localStorage.removeItem(LOCAL_STORAGE_LOGIN_USER_TOKEN);

    const logins = localStorage.getItem(LOCAL_STORAGE_LOGINS);
    if (logins) {
        const loginsArray = JSON.parse(logins);

        for (const login of loginsArray) {
            if (login.accessToken == currentUserLogin.accessToken) {
                loginsArray.splice(loginsArray.indexOf(login), 1);
            }
        }
        localStorage.setItem(LOCAL_STORAGE_LOGINS, JSON.stringify(loginsArray));

        if (loginsArray[0]) return switchAccount(loginsArray[0].userID);
    }

    redirectBegin()
}

async function signOutAll() {
    localStorage.removeItem(LOCAL_STORAGE_LOGIN_USER_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_LOGINS);

    redirectBegin()
}

async function switchAccount(userID) {
    const logins = localStorage.getItem(LOCAL_STORAGE_LOGINS);
    if (logins) {
        const loginsArray = JSON.parse(logins);

        for (const login of loginsArray) {
            if (login.userID == userID) {
                localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(login));
                await checkLogin();
                const currentTheme = await getTheme(null, true);
                if (!currentTheme || !currentTheme.colourTheme) {
                    // sets empty theme
                    await applyThemeNav({});
                    return false;
                };
            
                await applyThemeNav(currentTheme);
                location.reload()
            }
        }   
    }
}

// location.reload(true); 
// USE THIS 
function redirectBegin() {
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
    if (pathArray[1]=="emails") return

    else if (pathArray[1]=="") window.location.href='/begin'
    else window.location.href=`/begin?redirect=${pathArray[1]}`
}

async function checkLogin() {
    if (pathArray[1]=="emails") {
        console.log("emails wow")
        return false;
    }

    if (window.pathArray[1]=="staff") return false;

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
        case 6:
            window.location.href='/?notifications'
            break;
        case 7: 
            window.location.href='/?settings'
            break;
        default:
            break;
    }
}

function showModal(html, showClose) {
    document.getElementById('modalContainer').classList.add("showModal");
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal menu-style" id="modal">${html}</div>
    `;

    listenerContainer();

    if (showClose == "hide") return true;
    else return showModalClose();
}

function listenerContainer() {
    document.getElementById('modalContainer').addEventListener('click', function(event) {
        if (event.target === modalContainer) {
            return closeModal();
        }
    });
}

function showModalClose() {
    document.getElementById('modal').innerHTML+=`
        <button class="menuButton menuButton-style" onclick="closeModal()">Close</button>
    `;
}

function closeModal() {
    document.getElementById('modalContainer')?.classList.remove("showModal");
    document.getElementById('modalContainer').innerHTML = "";

    return true;
}


var openedSidebar = false;
var mainContentSideBarOpenClosed = false;

var sideBarOpenClosed = document.getElementById("expandingNavBar");
var mainContentSideBarOpenClosed = document.getElementById("expandingMainContent");

function sidebarOpen() {
    if (!openedSidebar) {
        setCookie("expandSidebar", "true", 365);
        openSideBar();
    } else {
        setCookie("expandSidebar", "false", 365);
        closeSideBar();
    }
}

function openSideBar() {
    openedSidebar = true;
    sideBarOpenClosed.classList.add("navbar-expanded");
    mainContentSideBarOpenClosed.classList.add("main-content-expanded");
}

function closeSideBar() {
    openedSidebar = false;
    sideBarOpenClosed.classList.remove("navbar-expanded");
    mainContentSideBarOpenClosed.classList.remove("main-content-expanded");
}

// Sidebar Cookie
function checkNavCookie() {
    var showmenu = getCookie("expandSidebar");
    if (showmenu === "true") {
        openSideBar();
        return;
    } 
    if (showmenu === "false") {
        closeSideBar();
        return;
    } 
    // No cookie found, apply window size
    if (window.innerWidth >= 1080) {
        openSideBar();
    } else {
        closeSideBar();
    }
}

// Cookie Settings
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');

    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Check cookie and apply window size rule if no cookie
checkNavCookie();

// Automatically open/close navbar if window size changes
if (window.attachEvent) {
    window.attachEvent('onresize', function() {
        if (!getCookie("expandSidebar")) {
            if (window.innerWidth < 1080) {
                closeSideBar();
            } else {
                openSideBar();
            }
        }
    });
} else if (window.addEventListener) {
    window.addEventListener('resize', function() {
        if (!getCookie("expandSidebar")) {
            if (window.innerWidth < 1080) {
                closeSideBar();
            } else {
                openSideBar();
            }
        }
    }, true);
}
