
const baseURL = `http://localhost:5002/v1`
//const baseURL = `https://interact-api.novapro.net/v1`

const headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}


async function getFeed() {
    console.log("run")
    const response = await fetch(`${baseURL}/get/allPosts`)
    const data = await response.json()
    buildView(data)
}

function test() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="main-feed">
            <div class="mainNameEasterEgg"> 
                <h1>You pressed the logo!!</h1>
                <p>You pressed the header name, thats pretty cool of you! Thank you for checking out interact!</p>
                <p>Press the button below to go back!</p>
                <a onclick="getFeed()">Main Feed!</a>
            </div>
        </div>
    `
}

function buildView(posts) {
    document.getElementById("mainFeed").innerHTML = `
        <div class="main-feed">
            ${posts.map(function(post) {
                console.log(post)
                var userData
                // displayName
                // username

                return `
                    <div class="publicPost">
                        <p>${post.content}</p>
                        <p class="debug debugPostID">${post._id}</p>
                        <a>like</a> | <a>repost</a> | <a>reply</a>
                    </div>
                `
            }).join(" ")}
        </div>
    `
}

async function getUserData(userID) {
    const response = await fetch(`${baseURL}/get/user/${userID}`, {
        method: 'GET',
        headers,
    });
    return response.json()
}