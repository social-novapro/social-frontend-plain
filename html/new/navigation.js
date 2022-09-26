
// Switch Sidebar
const openedSidebarIconHTML = document.getElementById('openedSideBarIcon')
const closedSidebarIconHTML = document.getElementById('closedSideBarIcon')

var openedSidebar = false
var mainContentSideBarOpenClosed = false

var sideBarOpenClosed = document.getElementById("expandingNavBar")
var mainContentSideBarOpenClosed = document.getElementById("expandingMainContent")

function sidebarOpen() {
    if(!openedSidebar) {
        setCookie("expandSidebar", true, 365);
        openSideBar()
    } else {
        setCookie("expandSidebar", false, 365);
        closeSideBar()
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
function checkCookie() {
    var showmenu = getCookie("expandSidebar");
    if (showmenu == "true") {
        openSideBar()
        return;
    } if (showmenu == false) {
        closeSideBar()
        return;
    } else {
        setCookie("expandSidebar", false, 365)
        return;
    } 
}

// Cookie Settings
function setCookie(cname,cvalue,exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

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
}

// At Launch of Page
checkCookie() 