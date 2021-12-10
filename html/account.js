var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}

var currentUserLogin = {
    "accesstoken" : "d023ed40-95ff-42aa-962b-e19475ebd317",
    "userid" : "d825813d-95d2-46eb-868a-ae2e850eab92"
}

// LOGIN INFO 
async function checkLogin() {
    if (debug) console.log(loginUserToken)

    if (!loginUserToken) {
        document.getElementById("mainFeed").innerHTML = `
            <div class="publicPost signInDiv">
                <h1>Your not signed in!</h1>
                <p>Please sign into Interact to proceed!</p>
                <a onclick="login()">Log into your account</a>
            </div>
        `
    }
    else {
        await getFeed()
    }
}

// USER LOGIN PAGE 
async function login() {
    document.getElementById("mainFeed").innerHTML = `
        <h1>Please Login!</h1>
        <div class="search">
            <input type="text" id="usernameProfile" placeholder="Your username: ${userData.username}">
        </div>
            <div class="search">
            <input type="text" id="displaynameProfile" placeholder="Your displayname: ${userData.displayName}">
        </div>
    `
    const response = await fetch(`${baseURL}/get/user/${currentUserLogin.userid}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await response.json()
}