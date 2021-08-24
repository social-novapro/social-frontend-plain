const LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
let loginUserToken = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)



checkLogin()

// LOGIN INFO 
function checkLogin() {
    console.log(loginUserToken)
    if (!loginUserToken) {
        console.log("your not logged in, but thats not your fault.")
    }
    else {
        console.log("nice your logged in, somehow")
    }

}

function saveLoginUserToken(userLoginToken) {
    localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(userLoginToken))
}