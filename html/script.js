// add option to have searching put in address bar (so it doesnt spam history), look for places that uses changeHeader()

/*
    new idea
        have a basic feed page, without likes, comments, etc.
        once you login, you can choose to see 
            - discover feed (default when not logged in)
            - custom feed (default when logged in)
            - following feed (just people you follow)

    check if there are messages to be read
    make a secondary message area
// function that checks if user is logged in
if (checkLoginUser()) {
    // if user is logged in, show the logout button
    document.getElementById("logoutButton").innerHTML = `
        <button class="buttonStyled" onclick="logout()">Logout</button>
    `
} else {
    // if user is not logged in, show the login button
    document.getElementById("logoutButton").innerHTML = `
        <button class="buttonStyled" onclick="login()">Login</button>
    `
}

// if user is logged in, show the post button
if (checkLoginUser()) {
    document.getElementById("postButton").innerHTML = `
        <button class="buttonStyled" onclick="postbar()">Post</button>
    `
} else {
    document.getElementById("postButton").innerHTML = ``
}

// Ping server to see if user is logged in
async function checkLoginUser() {
    const headers = {
        'Authorization': 'Bearer my-token',
        'My-Custom-Header': 'foobar'
    };

    const checkLogin = await axios.get(`${APIv1}/check/login`, { headers })
    return checkLogin.data
}
*/
var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
var pathArray = window.location.pathname.split( '/' );

var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`

// const apiURL = `http://localhost:5002/v1`
// const apiURL = `https://interact-api.novapro.net/v1`

var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}

var currentUserLogin = { }
/*var currentUserLogin = {
    "accesstoken" : "d023ed40-95ff-42aa-962b-e19475ebd317",
    "userid" : "d825813d-95d2-46eb-868a-ae2e850eab92"
}*/

var currentPage
// need usertoken, and userid for sending

var searching
var currentFeed 

var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
// let loginUserToken = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)

var debug = false

var mobileClient = checkifMobile();
var params = new URLSearchParams(window.location.search)

function checkifMobile() {
    const width = document.getElementById("html").clientWidth
        console.log(width)
    if (width < 900) {
        return true;
    } else {
        return false;
    }
}

// good luck
if (location.protocol !== 'https:' && !((/localhost|(127|192\.168|10)\.(\d{1,3}\.?){2,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3}\.?){2}/).test(location.hostname))) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
else {
    if (!('fetch' in window)) {
      if (debug) console.log('Fetch API not found, please upgrade your browser.');
        showModal(`Please upgrade your browser to use Interact!`)
    }
    else checkLogin()
}
// CHANGES URL OF BROWSER
function changeHeader(newLink) {
    let stateObj = { id: "100" };
    window.history.replaceState(stateObj, "Socket", "/" + newLink);
}

async function checkURLParams() {
    var paramsInfo = {
        paramsFound: false
    }

    const ifUsername = params.has('username')
    const ifPostID = params.has("postID")
    const ifSearch = params.has("search")
    const ifLoginRequest = params.has("login")
    const ifNewAccountLogin = params.has("newAccount")
    const ifPostPage = params.has("posting");
    const ifUserEdit = params.has("userEdit");
    const ifSettings = params.has("settings");
    const ifEmailSettings = params.has("emailSettings");

    if (ifUsername) {
        paramsFound = true
        paramsInfo.paramsFound = true
        const usernameSearch = params.get('username')
        userPage(usernameSearch)
    }
    else if (ifPostID) {
        paramsFound = true
        paramsInfo.paramsFound = true

        const postIDSearch = params.get('postID')
        // postPage()
        postHtml(postIDSearch)
        // return userPage(usernameSearch)
    }
    else if (ifSearch) {
        paramsFound = true
        paramsInfo.paramsFound = true

        const searchSearching = params.get('search')
        searchResult(searchSearching)
        addWritingToSeachBar(searchSearching)
    }
    else if (ifLoginRequest) {
        paramsFound = true
        paramsInfo.paramsFound = true

        loginPage()
    }
    else if (ifNewAccountLogin) {
        paramsFound = true
        paramsInfo.paramsFound = true

        loginSplashScreen()
    }
    else if (ifPostPage) {
        paramsFound = true
        paramsInfo.paramsFound = true

        createPostPage()
    } else if (ifUserEdit) {
        paramsFound = true
        paramsInfo.paramsFound = true

        userEditPage()
    } else if (ifSettings) {
        paramsFound = true
        paramsInfo.paramsFound = true

        settingsPage()
    } else if (ifEmailSettings) {
        paramsFound = true
        paramsInfo.paramsFound = true

        settingsPage();
        changeEmailPage();
        document.getElementById("emailSettings").scrollIntoView();
    }
   
    return paramsInfo
}

function postElementCreate({ post, user, type, hideParent, hideReplies }) {
    var timesince
    if (post.timePosted) timesince = checkDate(post.timePosted)
    const imageContent = checkForImage(post.content)
    const owner = post.userID == currentUserLogin.userID ? true : false;

    const options = {
        hideParent : hideParent ? true : false, 
        hideReplies : hideReplies ? true : false,
        owner: owner,
    }
    
    const timeSinceData = getTimeSince(post.timePosted);

    const postIsLiked = post.liked ? true : false;

    // imageContent.attachments
    if (imageContent.imageFound)if (debug) console.log(imageContent.attachments)
    if (type=="basic"){
        return `
            <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}${user.verified ? ' ✔️ ' : ''}` : '>Unknown User'} | ${timesince} | ${timeSinceData.sinceOrUntil == "current" ? "just posted" : `${timeSinceData.sinceOrUntil == "since" ? timeSinceData.value + " ago" : timeSinceData.value}`}</p>
            <div class="postContent" id="postContentArea_${post._id}">
                <div class="textAreaPost">
                    <p id="postContent_${post._id}">${imageContent.content}</p>
                    ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                </div>
            </div>
        `
    }
    
    const element = `
        <div id="postElement_${post._id}" class="postElement">
            ${!hideParent==true && post.isReply ? `
                <div id="parent_${post._id}"></div>` 
            : `` } 
            <div class="publicPost areaPost" id="postdiv_${post._id}">
                ${!hideParent==true && post.isReply ? `
                    ${ post.replyData ? `
                        <p onclick="viewParentPost('${post._id}', '${post.replyData.postID}')" id="parentViewing_${post._id}">This was a reply, click here to see.</p>
                    ` : ``}
                `: ``}
                <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}${user.verified ? ' ✔️ ' : ''}` : '>Unknown User'}<br class="spacer_2px">${timesince} | ${timeSinceData.sinceOrUntil == "current" ? "just posted" : `${timeSinceData.sinceOrUntil == "since" ? timeSinceData.value + " ago" : timeSinceData.value}`}</p>
                <div class="postContent" id="postContentArea_${post._id}">
                    <div class="textAreaPost">
                        <p id="postContent_${post._id}">${imageContent.content}</p>
                        ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                    </div>
                    ${post.replyingPostID ? `<a class="replyingPost" href="#postElement_${post.replyingPostID}">Press here</a>` : ``}
                    ${post.quoteReplyPostID && post.quotedPost && post.quotedUser ? `<hr><div>${postElementCreate({post: post.quotedPost, user: post.quotedUser, type: "basic"})}</div>` : ''}
                    <div class="PostAttachments">
                        ${imageContent.image ? `<div>${imageContent.attachments.map(function(attachment) {return `${attachment}`}).join(" ")}</div>`:''}
                    </div>
                </div>
                ${post.pollID ? `<div class="poll_option" id="pollContainer_${post._id}"></div>` : `` }
                <div class="debug">
                    <p>postID: ${post._id}</p>
                    <p>userID: ${post.userID}</p>
                    ${post.pollID ? `<p>pollID: ${post.pollID}</p>` : `` }
                </div>
                <div class="actionOptions pointerCursor"> 
                    ${post.totalLikes ? 
                        `<p onclick="likePost('${post._id}')" ${postIsLiked == true ? 'class="likedColour"':''} id="likePost_${post._id}">${puralDataType('like', post.totalLikes)}</p>` :
                        `<p onclick="likePost('${post._id}')" id="likePost_${post._id}">like</p>`
                    }
                    ${post.totalReplies ? 
                        `<p onclick="replyPost('${post._id}')">${puralDataType('reply', post.totalReplies)}</p>` : 
                        `<p onclick="replyPost('${post._id}')">reply</p>`
                    }
                    ${post.totalQuotes ? 
                        `<p onclick="quotePost('${post._id}')">${puralDataType('quote', post.totalQuotes)}</p>` : 
                        `<p id="quoteButton_${post._id}">
                            <p onclick="quotePost('${post._id}')">quote</p>
                        </p>`
                    }
                    ${!mobileClient ? `
                        ${post.userID == currentUserLogin.userID ? `
                            <p onclick="deletePost('${post._id}')">delete post</p>
                            <p id='editButton_${post._id}'>
                                <p onclick="editPost('${post._id}', '${post.edited}')">edit post</p>
                            </p>
                        ` : ''}
                    ` : ''}
                    </p>
                    <p id="popupactions_${post._id}" onclick="popupActions('${post._id}', '${options.hideParent}', '${options.hideReplies}', ${options.owner})">more</p>
                </div>
            </div>
        </div>
    `

    if (post.pollID) {
        createPollElement(post._id, post.pollID)
        .then(function(ele) { 
            if (ele) {
                document.getElementById(`pollContainer_${post._id}`).innerHTML = ele; 
                checkIfUserVoted(post.pollID)
                .then(function(data) {
                    if (data.error) {
                        if (debug) console.log(data);
                        return false;
                    }
                    if (data.voted && data.foundVote && data.foundVote.pollOptionID && data.foundVote.pollID == post.pollID) {
                        colorizeOption(post.pollID, data.foundVote.pollOptionID);
                        changeVoteOption(post.pollID, data.foundVote.pollOptionID);
                    }
                    devMode()
                })
            }
        })
    }

    return element;
}

function changeVoteOption(pollID, optionID) {
    return false;//doesnt work properly, changed how it works

    const element = document.getElementById(`poll_option_${pollID}_${optionID}`);
    console.log(element);
    if (debug) console.log(pollID);
    if (userVoted == true) {
        // colo
        
        // const myElement = document.getElementById('myElement');
        element.onclick = `removeVote('${pollID}', '${optionID}')`;
    } else {
        // const myElement = document.getElementById('myElement');
        element.onclick = `voteOption('${pollID}', '${optionID}')`;
    }
}

function colorizeOption(pollID, optionID) {
    const elementID = `poll_option_${pollID}_${optionID}`;
    if (debug) console.log(elementID);
    document.getElementById(elementID).classList.add("voted");
}
function removeColorOption(pollID, optionID) {
    const elementID = `poll_option_${pollID}_${optionID}`;
    if (debug) console.log(elementID)
    document.getElementById(elementID).classList.remove("voted");
}

async function popupActions(postID, hideParent, hideReplies, owner) {
    // options = JSON.parse(options)
    var elementPopup = document.getElementById(`popupOpen_${postID}`);
    if (elementPopup) return elementPopup.remove();

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="popupOpen_${postID}" class="publicPost" style="position: element(#popupactions_${postID});">
            ${owner && mobileClient? `
                <p>Owner Actions</p>
                <p>---</p>
                <p onclick="deletePost('${postID}')">delete post</p>
                <p id='editButton_${postID}'>
                    <p onclick="editPost('${postID}')">edit post</p>
                </p>
            ` : ``}
            <p>Menu Actions</p>
            <p>---</p>
            <p class="pointerCursor" onclick="saveBookmark('${postID}')" id="saveBookmark_${postID}">Save to Bookmarks</p>
            <p class="pointerCursor" onclick="showEditHistory('${postID}')" id="editHistory_${postID}">Check Edit History</p>
            <p class="pointerCursor" onclick="showLikes('${postID}')" id="likedBy_${postID}">Check Who Liked</p>
            ${hideReplies != true ? `<p class="pointerCursor" onclick="viewReplies('${postID}')" id="replies_${postID}">Check Replies</p>` : ``}
        </div>
    `;
};

async function viewParentPost(postID, parentPostID) {
    if (document.getElementById(`openedParent_${postID}`)) {
        document.getElementById(`parentViewing_${postID}`).innerText = "This was a reply, click here to see.";
        return document.getElementById(`openedParent_${postID}`).remove();
    }

    const response = await fetch(`${apiURL}/get/post/${parentPostID}`, {
        method: 'GET',
        headers
        // body: JSON.stringify(body)
    });
    
    const postData = await response.json();
    if (debug) console.log(postData);

    if (postData.deleted == true || !postData.userID) {
        document.getElementById(`parent_${postID}`).innerHTML = `
            <div class="publicPost areaPost" id="openedParent_${postID}">
                <div class="publicPost areaPost">
                    <p>Parent post has been deleted.</p>
                </div>
            </div>
        `;
        document.getElementById(`parentViewing_${postID}`).innerText = "Close parent post.";

        return;
    }

    const userRes = await fetch(`${apiURL}/get/userByID/${postData.userID}`, {
        method: 'GET',
        headers
        // body: JSON.stringify(body)
    });
   
    const userData = await userRes.json();

    const postEle = postElementCreate({post: postData, user: userData});
    document.getElementById(`parent_${postID}`).innerHTML = `
        <div class="publicPost areaPost" id="openedParent_${postID}">${postEle}</div>
    `;
    document.getElementById(`parentViewing_${postID}`).innerText = "Close parent post.";

}

// async function 
async function viewReplies(postID) {
    if (document.getElementById(`repliesOpened_${postID}`)) {
        document.getElementById(`replies_${postID}`).innerText = "Check replies";

        return document.getElementById(`repliesOpened_${postID}`).remove();
    }

    // if ()
    // http://localhost:5002/v1/get/postReplies/71f9a348-aa28-4443-a39d-4247620e43ce
    const response = await fetch(`${apiURL}/get/postReplies/${postID}`, {
        method: 'GET',
        headers
        // body: JSON.stringify(body)
    });
    const replyData = await response.json();
    if (debug) console.log(replyData)
    if (replyData.code) {
        document.getElementById(`postElement_${postID}`).innerHTML+=`
            <div id="repliesOpened_${postID}" class="publicPost" style="position: element(#popupactions_${postID});">
                <p>Replies</p>
                <p>---</p>
                There are no replies yet on this post.
            </div>
        `;
        if (debug) console.log("no replies")
        return ;
    }
    // array

    var ele = ``;
    for (const reply of replyData.replies) {
        // if (reply!=null) {
            const userRes = await fetch(`${apiURL}/get/userByID/${reply.userID}`, {
                method: 'GET',
                headers
                // body: JSON.stringify(body)
            });
            const userData = await userRes.json();
            if (debug) console.log(userData)
            ele+=postElementCreate({post: reply, user: userData, hideParent: true });
        // }
    }

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="repliesOpened_${postID}" class="publicPost" style="position: element(#popupactions_${postID});">
            <p>Replies</p>
            <p>---</p>
            ${ele}
        </div>
    `;

    document.getElementById(`replies_${postID}`).innerText = "Close replies";
    // get message
    // postElementCreate

}

async function saveBookmark(postID, list) {
    const body = {
        postID,
        listname: list ? list : "main"
    }
    const response = await fetch(`${apiURL}/post/savePost/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    // if (!response.ok) return document.getElementById(`saveBookmark_${postID}`).innerText = "Error while saving"
    const res = await response.json();
    if (debug) console.log(res)
    if (res.error) return document.getElementById(`saveBookmark_${postID}`).innerText = `Error: ${res.error}`;
    document.getElementById(`saveBookmark_${postID}`).innerText="Saved"
}

async function showLikes(postID) {
    const response = await fetch(`${apiURL}/get/postLikedBy/${postID}`, {
        method: 'GET',
        headers,
    });

    const likedBy = await response.json();
    if (debug) console.log(likedBy.peopleLiked);
    if (!response.ok || !likedBy.peopleLiked) return document.getElementById(`likedBy_${postID}`).innerHTML = `Could not find any people who liked the post.`;

    var newElement = `<p>Liked By:</p>`;
    for (const people of likedBy.peopleLiked) {
        newElement+=`<p onclick="userHtml('${people.userID}')">${people.username}</p>`
    };

    document.getElementById(`likedBy_${postID}`).innerHTML=newElement;
}

async function showEditHistory(postID) {
    const response = await fetch(`${apiURL}/get/postEditHistory/${postID}`, {
        method: 'GET',
        headers,
    });

    const editData = await response.json();
    if (debug) console.log(editData);
    if (!response.ok || !editData.edits) return document.getElementById(`editHistory_${postID}`).innerHTML = `Could not find any edits.`;

    var newElement = `<p>Edit History:</p>`;
    for (const edit of editData.edits.reverse()) {
        newElement+=`<p>${edit.content}</p>`
    };

    document.getElementById(`editHistory_${postID}`).innerHTML=newElement;
};

function getTime() {
    const d = new Date();
    const currentTime = d.getTime()
    return currentTime
}

function getTimeSince(time) {
    var currentTime = getTime()

    var diff = (currentTime - time)
    if (currentTime < time) diff = (time - currentTime);

    var years = Math.floor(diff / 31556952000)
    var days = Math.floor(diff / 86400000) % 365;
    var hours = Math.floor(diff / 3600000) % 24;
    var minutes = Math.floor(diff / 60000) % 60;
    var seconds = Math.floor(diff / 1000) % 60;
    
    var sinceNowUntil
    if (currentTime < time) sinceNowUntil = "until"
    else if (currentTime > time) sinceNowUntil = "since"
    else if (currentTime == time) sinceNowUntil = "current"

    var finalReturn = {
        "sinceOrUntil" : sinceNowUntil,
        "value" : ""
    }

    if (years) finalReturn.value = `${years}y ${days}d`
    if (!years) finalReturn.value = `${days}d ${hours}h`
    if (!years && !days) finalReturn.value = `${hours}h ${minutes}m`
    if (!years && !days && !hours) finalReturn.value = `${minutes}m ${seconds}s`
    if (!years && !days && !hours && !minutes) finalReturn.value = `${seconds}s`
    if (!years && !days && !hours && !minutes && !seconds) {
        finalReturn.value = `now`
        finalReturn.sinceOrUntil = "current"
    }

    return finalReturn;
}

async function createPollElement(postID, pollID) {
    return getPollData(pollID, {
        method: 'GET',
        headers,
    })
    .then(function (pollData) {
        if (debug) console.log(pollData);
        if (!pollData || !pollData.pollOptions) return false;
        var totalVotes = 0;

        for (const option of pollData.pollOptions) {
            if (option?.amountVoted) totalVotes+=option.amountVoted;
        }

        const timesinceData = getTimeSince(pollData.timestampEnding);

        return `
            <div id="pollElement_${postID}" class="pollElement">
                <p id="pollQuestion_${postID}">${pollData.pollName}</p>
                <div id="pollOptions_${postID}">
                    ${pollData.pollOptions.map((option, index) => { 
                        return `
                            <div id="pollOption_${postID}_${option._id}" class="pollOption">
                                <div id="poll_option_${pollData._id}_${option._id}" class="poll_option" onclick="voteOption('${pollID}', '${option._id}')">
                                    <p>${option.optionTitle}</p>
                                    <div class="debug">
                                        <p>optionID: ${option._id}</p>
                                        <p>indexID: ${option.currentIndexID || "unknown"}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <p>Total votes: ${totalVotes} | ${timesinceData.sinceOrUntil=="current" ? "ended just now" : `${timesinceData.sinceOrUntil=="since" ? ` ended ${timesinceData.value} ago` : `${timesinceData.value} time left`}`} </p>
            </div>
        `;
    })
    .catch(function (err) {
        console.log(err);
    });
}

async function checkIfUserVoted(pollID) {
    if (debug) console.log("check " + pollID)
    // ttp://localhost:5002/v1/polls/
    return fetch(`${apiURL}/polls/userVote/${pollID}`, {
        method: 'GET',
        headers,
    })
    .then(function (res) {
        return res.json();
    })
    .then(function (data) {
        return data;
    })
    .catch(function (err) {
        console.log(err);
    });
}

async function getPollData(pollID) {
    return fetch(`${apiURL}/polls/get/${pollID}`, {
        method: 'GET',
        headers,
    })
    .then(function (res) {
        return res.json();
    })
    .then(function (data) {
        return data;
    })
    .catch(function (err) {
        console.log(err);
    });
}

async function removeVote(pollID, optionID) {
    if (!pollID || !optionID) return alert("Error while removing vote");

    const body = {
        pollID,
        pollOptionID: optionID
    }
    
    const response = await fetch(`${apiURL}/polls/removeVote`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });

    const res = await response.json();
    if (debug) console.log(res)
    if (res.error) return alert(`Error: ${res.error.msg}`);
    
    removeColorOption(pollID, optionID)
    
    if (debug) console.log("Removed vote!")
}

async function voteOption(pollID, optionID) {
    if (!pollID || !optionID) return alert("Error while voting");

    const element = document.getElementById(`poll_option_${pollID}_${optionID}`);
    if (element.classList.contains("voted")) {
        if (debug) console.log("Already voted for this option");
        
        await removeVote(pollID, optionID);
        return;
    }

    const body = {
        pollID,
        pollOptionID: optionID
    }
    
    const response = await fetch(`${apiURL}/polls/createVote`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });

    const res = await response.json();
    if (debug) console.log(res)
    if (res.error) return alert(`Error: ${res.error.msg}`);
    
    if (res.oldVote) removeColorOption(res.oldVote.pollID, res.oldVote.pollOptionID)
    colorizeOption(pollID, optionID)

    if (debug) console.log("Voted!")
}

// async function postPage() {

// }
async function userPage(username) {
    searching = true

    const response = await fetch(`${apiURL}/get/username/${username}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await response.json() 

    userHtml(userData._id)

    return 
}

/*
    Login user token layout
    { 
        "usertoken"
        "apptoken"
        "accesstoken"
        "userid"
    }
*/

// /*

async function createPostModal() {
    await showModal(`
        <div id="postingModel">
        <h1>Create a new Post</h1>
        <div id="postModel" class="postModalActions">
            <p onclick="createPostPage()">Open Post Page</p>
            <hr class="rounded">
            <p onclick="createPost()">Upload Post</p>
            <p onclick="closeModal()">Close</p>
        </div>
        <div class="search">
            <input type="text" class="addPollOption" id="pollCreateLink" placeholder="Link Poll via ID">
        </div>
        <textarea class="postTextArea" id="newPostTextArea"></textarea>
        <div id="foundTaggings"></div>
        </div>
    `, "hide")
}

async function socialTypePost() {
    // return false; // remove once feature is done
    if (debug) console.log("socialTypePost")
    const content = document.getElementById('newPostTextArea').value
    const foundTags = await findTag(content)
    if (foundTags.found == false) {
        if (document.getElementById('taggingsOpened')) {
            document.getElementById('foundTaggings').innerHTML=""
        }
        return false;
    };

    var taggings = ""
    if (debug) console.log("!!")
    for (const index of foundTags.results) {
        taggings+=`
            <div class=""onclick="autoCompleteUser('${index.user.username}')">
                <p>${index.user.username}</p>
                ${index.user.description ? `<p>${index.user.description}</p>` : ``}
                <p>${index.possiblity}% match</p>
            </div>
        `
    }
    if (debug) console.log(taggings)
    document.getElementById('foundTaggings').innerHTML=`
        <div id="taggingsOpened"></div>
        ${taggings}
    `
}

async function autoCompleteUser(username) {
    const content = document.getElementById('newPostTextArea').value
    const contentArgs = content.split(" ")

    // replaces with new value
    contentArgs[contentArgs.length-1] = `@${username} `;
    document.getElementById('foundTaggings').innerHTML=""

    
    document.getElementById('newPostTextArea').value = contentArgs.join(" ")
    document.getElementById('newPostTextArea').focus()
}

async function findTag(content) {
    const contentArgs = content.split(/[ ]+/)
    const searchUser = contentArgs[contentArgs.length-1];

    if (searchUser==''||searchUser=="@") return { found: false };
    if (!searchUser.startsWith("@")) return { found: false };
    const response = await fetch(`${apiURL}/get/taguserSearch/${searchUser.replace("@", "")}`, {
        method: 'GET',
        headers,
    });
    
    if (debug) console.log(response)
    const res = await response.json();
    if (debug) console.log(res)
    if (res.error) return { found: false };
    if (!res) return { found: false }
    if (!res[0]) return { found: false }
    return {found: true, results: res};
}

document.addEventListener('keypress', logKey);

function logKey(e) {
    if (e.key == '/') {
        searchBar()
        document.getElementById('searchBarArea').focus()
    }
}

/*
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
*/

// LOGIN INFO 
async function checkLogin() {
    if (debug) console.log(loginUserToken)

    var loginUserToken = false

    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    if (userStorageLogin) {
        currentUserLogin = JSON.parse(userStorageLogin)
        if (debug) console.log(headers)
        if (debug) console.log(currentUserLogin.accessToken)
        if (debug) console.log(currentUserLogin.userToken)
        if (debug) console.log(currentUserLogin.userID)

        headers.accesstoken = currentUserLogin.accessToken
        headers.usertoken = currentUserLogin.userToken
        headers.userid = currentUserLogin.userID

        loginUserToken = true
    }
    
    if (!loginUserToken) return loginSplashScreen()
    else await getFeed()
}

// USER LOGIN SPLASH SCREEN 
async function loginSplashScreen() {
    return window.location.href='/begin'
    /*document.getElementById("mainFeed").innerHTML = `
        <div class="publicPost signInDiv">
            <h1>Your not signed in!</h1>
            <p>Please Sign into Interact to Proceed!</p>
            <button class="buttonStyled" onclick="loginPage()">Log into Your Account</button>
            <button class="buttonStyled" onclick="createUserPage()">Create an Account</button>
        </div>
    `*/
}

// USER LOGIN PAGE 
async function loginPage() {
    document.getElementById("mainFeed").innerHTML = `
        <h1>Please Login!</h1>
        <form onsubmit="sendLoginRequest()" id="signInForm">
            <div>
                <p>Enter Username:</p>
                <p><input id="userUsernameLogin" placeholder="Username" type="text" name="username"></p>
            </div>
            <div>
                <p>Enter Password</p>
                <p><input id="userPasswordLogin" placeholder="Password" type="password" name="password"></p>
            </div>
            <input class="buttonStyled" type="submit">
        </form>
    `
        document.getElementById("signInForm").addEventListener("submit", function (e) { e.preventDefault()})
}

async function sendLoginRequest() {
    var usernameLogin = document.getElementById('userUsernameLogin').value;
    var passwordLogin = document.getElementById('userPasswordLogin').value;

    headers.username = usernameLogin
    headers.password = passwordLogin
    
    const response = await fetch(`${apiURL}Priv/get/userLogin/`, {
        method: 'GET',
        headers,
    })

    // if (response.status != 200) 
    if (debug) console.log(response)
    const userData = await response.json()
    if (debug) console.log(userData)
   //  currentUserLogin = userData.accessToken
    if (response.ok) {
        if (userData.public._id) currentUserLogin.userid = userData.public._id

        saveLoginUser(userData)
        // save user token to cookie
        // setCookie(currentUser,cvalue,exdays) {}
        return await getFeed()
    }

    else return showModal(`<p>Error: ${userData.code}\n${userData.msg}</p>`)

    if (userData.login === true) {
        return await getFeed()
    }
}

/*
function createUserPage() {
    document.getElementById("mainFeed").innerHTML = `
        <h1>Please Create an Account!</h1>
        <p id="errorMessage"></p>
        <form onsubmit="createNewUserRequest()" id="createUserForm">
            <div> 
                <p>Enter Your New Username:</p>
                <input type="text" id="usernameCreate" placeholder="Username" type="text" name="username">
            </div>
            <div> 
                <p>Enter Your New Displayname:</p>
                <input type="text" id="displaynameCreate" placeholder="Displayname">
            </div>
            <div> 
                <p>Enter Your New Password:</p>
                <input id="passwordCreate" placeholder="Password" type="password" name="password">
            </div>
            <div> 
                <p>Enter Your Description:</p>
                <input type="text" id="descriptionCreate" placeholder="Description">
            </div>
            <div> 
                <p>Enter Your Pronouns:</p>
                <input type="text" id="pronounsCreate" placeholder="Pronouns">
            </div>
            <input class="buttonStyled" type="submit">
        </form>
    `
    document.getElementById("createUserForm").addEventListener("submit", function (e) { e.preventDefault()})
}


async function createNewUserRequest() {
    var usernameCreate = document.getElementById('usernameCreate').value;
    var displaynameCreate = document.getElementById('displaynameCreate').value;
    var passwordCreate = document.getElementById('passwordCreate').value;
    var descriptionCreate = document.getElementById('descriptionCreate').value;
    var pronounsCreate = document.getElementById('pronounsCreate').value;

    const data = { 
        "username" : usernameCreate, 
        "displayName" : displaynameCreate,
        "password" : passwordCreate,
        "description": descriptionCreate,
        "pronouns": pronounsCreate
    };

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    const response = await fetch(`${apiURL}Priv/post/newUser`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    if (debug) console.log(response)
    const responseParsed = await response.json()
    if (debug) console.log(responseParsed)
    if (response.ok) {
        // save user token to cookie
        // setCookie(currentUser,cvalue,exdays) {}
        return await getFeed()
    }
    else return document.getElementById('errorMessage').innerHTML=`Error: ${responseParsed.code}, ${responseParsed.msg}`
}
*/

// CHANGES MAIN FEED BUTTON TO PROFILE
function goBackFeedFromProfile() {
    document.getElementById("page2").innerHTML = `Profile` 
    searching = false

    return checkLogin()
}

// USER PROFILE PAGE
async function profile() {
    checkLogin()
    removeSearchBar()
    searching = true

    userHtml(currentUserLogin.userID)
        // editable after

    currentPage = "profile"
}

async function userEdit(action) {
    const possibleEdits = ["profileImage", "displayName", "username", "status", "description", "pronouns"];
    var actions = []; 
    
    if (!action) {
        for (const possible of possibleEdits) {
            const value = document.getElementById(`userEdit_${possible}_text`).value
            if (value) actions.push({action: possible, value})
        }
    }

    if (action) {
        if (!possibleEdits.includes(action)) return showModal(`<p>Error: ${action} is not a valid action</p>`)
        actions.push({action, value: document.getElementById(`userEdit_${action}_text`).value})
    }

    if (!actions|| !actions[0]) return showModal(`<p>Error: No actions to perform</p>`)

    var tempHeaders = headers;

    for (const actionData of actions) {
        tempHeaders[`new${actionData.action.toLowerCase()}`] = actionData.value
    }

    const response = await fetch(`${apiURL}/put/userEdit`, {
        method: 'PUT',
        headers
    });

    const newUser = await response.json()
    if (!response.ok) return console.log(newUser)

    // return window.location.href = `${document.getElementById('userEdit_username_text').value}`
    if (debug) console.log(newUser)
    return showModal("<p>Success! You can now close this page.</p>")
}

async function postHtml(postID) {
    const postRes = await fetch(`${apiURL}/get/post/${postID}`, {
        method: 'GET',
        headers,
    })

    const postData = await postRes.json()

    if (!postData || !postRes.ok || postData.deleted) return console.log("error with post");

    const userRes = await fetch(`${apiURL}/get/userByID/${postData.userID}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await userRes.json();
    const ele = postElementCreate({post: postData, user: userData});
    document.getElementById("mainFeed").innerHTML = ele

    return 
    if (postRes.isReply) {

    } else {

    }
    // const ele = ``;


    /*
    | Mother of post  (recursivly)
    |
    | Actual Post (will be main, large)

        scrolls down to actual post, +  half of mother post vieable

        loads one comment index (most recent)
    */
}
async function getFullUserData(userID) {
    const response = await fetch(`${apiURL}/get/user/${userID}`, {
        method: 'GET',
        headers,
    })
    
    const profileData = await response.json()

    if (!response.ok) return console.log("error with user");
    return profileData;
}

function settingsPage() {
    changeHeader("?settings")

    const ele = `
        <div id="settingsPage">
            <div class="" id="settingsPageContent">
                <div class="userInfo">
                    <h1>Settings</h1>
                </div>
                <div class="inline">
                    <div class="userInfo">
                        <p>View your profile. As shown to other users.</p>
                        <button class="userInfo buttonStyled" onclick="profile()">View Profile</button>
                        <hr class="rounded">
                        <p>Edit your public profile.</p>
                        <button class="userInfo buttonStyled" onclick="userEditPage()">Edit Profile</button>
                    </div>
                    <div class="userInfo">
                        <p><b>Notifications</b></p>
                        <div>
                            <button class="userInfo buttonStyled" id="showNotificationsButton" onclick="showNotifications()">Show Notifications</button>
                            <div id="notificationsDiv"></div>
                        </div>
                        <div>
                            <button class="userInfo buttonStyled" id="showSubscriptionsButton" onclick="showSubscriptions()">Show Subscriptions</button>
                            <div id="subscriptionsDiv"></div>
                        </div>
                    </div>
                    <div class="userInfo">
                        <p><b>Bookmarks</b></p>
                        <button class="userInfo buttonStyled" id="showBookmarksButton" onclick="showBookmarks()">Show Bookmarks</button>
                        <div id="bookmarksdiv"></div>
                    </div>
                    <div id="emailSettings" class="userInfo">
                        <p><b>Email</b></p>
                        <button class="userInfo buttonStyled" onclick="changeEmailPage()">Email Settings</p>
                    </div>
                    <div id="emailPopup"></div>
                    <div class="userInfo">
                        <p><b>Password</b></p>
                        <button class="userInfo buttonStyled"  onclick="changePasswordPage()">Change Password</p>
                    </div>
                    <div id="passwordPopup"></div>
                    <div class="userInfo">
                        <p>Sign out of your account.</p>
                        <button class="userInfo buttonStyled" onclick="signOutPage()">Sign Out</button>
                        <div id="signOutConfirm"></div>
                    </div>
                    <div class="userInfo">
                        <p>Delete your account.</p>
                        <button class="userInfo buttonStyled" onclick="deleteAccPage()">Delete Account</button>
                        <div id="deleteAccConfirm"></div>
                    </div>
                    <div class="userInfo">
                        <p>Enable / Disable dev mode. This will allow you to see more information about the different elements of Interact.</p>
                        <button class="userInfo buttonStyled" onclick="devModePage()">Dev Mode Settings</button>
                        <div id="devModeConfirm"></div>
                    </div>
                    <div class="userInfo">
                        <p><b>Developer</b></p>
                        <p>Access your developer account, and any apps that has access to your account</p>
                        <button class="userInfo buttonStyled" id="showDevOptionsButton" onclick="showDevOptions()">Show Dev Settings</button>
                        <div id="showDevDiv"></div>
                    </div>
                </div>
            </div>
            <div id="settingsContent"></div>
        </div>
    `;

    document.getElementById("mainFeed").innerHTML = ele;
    devMode();

    return true;
}

function removeDevModeConfirm() {
    document.getElementById("devModeConfirm").innerHTML = "";
    return true;
}

function removeSignOutConfirm() {
    document.getElementById("signOutConfirm").innerHTML = "";
    return true;
}

function removeDeleteAccConfirm() {
    document.getElementById("deleteAccConfirm").innerHTML = "";
    return true;
}

function signOutPage() {
    const ele = `
        <div class="userInfo" id="signOutPage">
            <p><b>Sign Out</b></p>
            <p>Are you sure you want to sign out?</p>
            <div class="signInDiv">
                <p class="buttonStyled"onclick="signOut()">Sign Out</p>
            </div>
            <button class="userInfo buttonStyled" onclick="removeSignOutConfirm()">Cancel</button></div>
        </div>
    `;

    document.getElementById("signOutConfirm").innerHTML = ele;
    return true;
}

async function deleteAccPage() {
    const ele = `
        <div class="userInfo" id="deleteAccPage">
            <p><b>Delete Account</b></p>
            <p>Are you sure you want to delete your account?<br>This will send an email and you will need to confirm.</p>
            <div class="signInDiv">
                <form id="userEdit_password_delete" class="contentMessage">
                    <label for="userEdit_email_pass_delete"><p>Password</p></label>
                    <input type="password" id="userEdit_email_pass_delete" class="userEditForm" placeholder="Password">
                </form>
                <p class="buttonStyled"onclick="requestDeleteAcc()">Delete</p>
            </div>
            <button class="userInfo buttonStyled" onclick="removeDeleteAccConfirm()">Cancel</button></div>
            <p id="resultDeleteRequest"></p>
        </div>
    `;
    
    document.getElementById("deleteAccConfirm").innerHTML = ele;
    document.getElementById("userEdit_password_delete").addEventListener("submit", function (e) { e.preventDefault()})
}

async function requestDeleteAcc() {
    const password = document.getElementById("userEdit_email_pass_delete")?.value;

    const response = await fetch(`${apiURL}/users/reqDelete/`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({
            password: password
        })
    });

    const res = await response.json();
    if (!response.ok || res.error) {
        document.getElementById("resultDeleteRequest").innerHTML = `<p>Failed ${res.error ? res.msg : "unknown reason"}</p>`
        showModal(`<p>Failed ${res.error ? res.msg : "unknown reason"}</p>`)
        return false
    } else {
        document.getElementById("resultDeleteRequest").innerHTML = `<p>Success, check your email.</p>`
    }

    return res;
}

function devModePage() {
    const ele = `
        <div class="userInfo" id="devModePage">
            <p><b>Dev Mode</b></p>
            <p>Dev Mode is ${debug ? "enabled" : "disabled"}</p>
            <p>Are you sure you want to enter dev mode?</p>
            <div class="signInDiv">
                <p class="buttonStyled" onclick="switchDevMode()">Dev Mode</p>
            </div>
            <button class="userInfo buttonStyled" onclick="removeDevModeConfirm()">Cancel</button></div>
        </div>
    `;

    document.getElementById("devModeConfirm").innerHTML = ele;
    return true;
}

function switchDevMode() {
    debugModeSwitch()
    devMode();
    devModePage()
}

async function userEditPage() {
    await userEditHtml(currentUserLogin.userID);
    //alert("ok")
    return true;
}

async function userEditHtml(userID) {
    const profileData = await getFullUserData(userID)
    if (!profileData) return showModal("<div><p>Sorry, this user does not exist!</p></div>")

    if (userID != currentUserLogin.userID) return showModal("<div><p>Sorry, you can't edit this user!</p></div>");
    changeHeader("?userEdit")


    var timesince
    if (profileData.userData.creationTimestamp) timesince = checkDate(profileData.userData.creationTimestamp)

    var clientUser = profileData.userData._id === currentUserLogin.userID ? true : false
    if (profileData?.userData?.displayName) document.title = `${profileData?.userData?.displayName} | Interact`
    
    document.getElementById("mainFeed").innerHTML =  `
        <div class="userEdit">
            <div class="userInfo">
                <h1>Edit Profile</h1>
            </div>
            <div class="userEditArea">
                <p><b>Save any changes made</b></p>
                <button class="userInfo buttonStyled" onclick="userEdit()">Save</button>
            </div>
            <div class="userEditArea">
                <p><b>Profile Image</b></p>
                ${profileData.userData.profileURL ? `<img src="${profileData.userData.profileURL}" class="profileImage">` : "No image set"}
                <form id="userEdit_profileImage" class="contentMessage" onsubmit="userEdit('profileImage')">
                    <input id="userEdit_profileImage_text" type="text" class="userEditForm" placeholder="Profile Image URL">
                </form>
            </div>
            <div class="userEditArea">
                <p><b>Display Name</b></p>
                ${profileData.userData.displayName ? `<p>${profileData.userData.displayName}` : "No display name set"}
                <form id="userEdit_displayName" class="contentMessage" onsubmit="userEdit('displayName')">
                    <input id="userEdit_displayName_text" type="text" class="userEditForm" placeholder="Display Name">
                </form>
            </div>
            <div class="userEditArea">
                <p><b>Username</b></p>
                ${profileData.userData.username ? `<p>${profileData.userData.username}` : "No username set"}
                <form id="userEdit_username" class="contentMessage" onsubmit="userEdit('username')">
                    <input type="text" id="userEdit_username_text" class="userEditForm" placeholder="Username">
                </form>
            </div>
            <div class="userEditArea">
                <p><b>Status</b></p>
                ${profileData.userData.statusTitle ? `<p>${profileData.userData.statusTitle}` : "No status set"}
                <form id="userEdit_status" class="contentMessage" onsubmit="userEdit('status')">
                    <input type="text" id="userEdit_status_text" class="userEditForm" placeholder="Status">
                </form> 
            </div>
            <div class="userEditArea">
                <p><b>Description</b></p>
                ${profileData.userData.description ? `<p>${profileData.userData.description}` : "No description set" }
                <form id="userEdit_description" class="contentMessage" onsubmit="userEdit('description')">
                    <input type="text" id="userEdit_description_text" class="userEditForm" placeholder="Description">
                </form>
            </div>
            <div class="userEditArea"><p><b>Pronouns</b></p>
                ${profileData.userData.pronouns ? `<p>${profileData.userData.pronouns}` : "No pronouns set"}
                <form id="userEdit_pronouns" class="contentMessage" onsubmit="userEdit('pronouns')">
                    <input type="text" id="userEdit_pronouns_text" class="userEditForm" placeholder="Pronouns">
                </form>
            </div> 
            ${profileData.userData.creationTimestamp ? 
                `  
                    <div class="userEditArea">
                        <p><b>Creation</b></p>
                        <p>${timesince}</p>
                    </div>
                `: ``
            }
            ${profileData.verified ? 
                `
                    <div class="userEditArea">
                        <p>Verified</p>
                    </div>
                ` : `
                    <div class="userEditArea">
                        <p><b>Verify ✔️</b></p>
                        <div class="searchSelect search">
                            <input id="content_request_verification"  placeholder="Why do you want to verify?">
                            <button onclick="requestVerification()">Request</button>
                        </div>
                    </div>
                `
                /*
                <form onsubmit="requestVerification()" id="verifyUserForm">
                        <input type="text" id="content_request_verification" placeholder="Why do you want to verify?">
                    </form>
                */
            }
        </div>
    `

    if (clientUser) {
        document.getElementById("userEdit_displayName").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_username").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_description").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_pronouns").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_status").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_profileImage").addEventListener("submit", function (e) { e.preventDefault()})
    }
    return true; 
}

async function userHtml(userID) {
    const profileData = await getFullUserData(userID)
    if (!profileData) return showModal("<div><p>Sorry, this user does not exist!</p></div>")

    changeHeader('?username='+profileData.userData.username, 'Profile')

    var timesince
    if (profileData.userData.creationTimestamp) timesince = checkDate(profileData.userData.creationTimestamp)

    var clientUser = profileData.userData._id === currentUserLogin.userID ? true : false
    if (profileData?.userData?.displayName) document.title = `${profileData?.userData?.displayName} | Interact`
    
    profileData.postData.reverse()
    if (debug) console.log(profileData)

    // profileData.included.post ? profileData.postData.reverse() : profileData.postData = []
    
    document.getElementById("mainFeed").innerHTML =  `
        ${clientUser ? `
            <div class="userInfo">
                <p><b>Edit Profile</b></p>
                <button class="buttonStyled" onclick="userEditPage()">Edit Page</button>
            </div>
            `: ""
        }
        ${profileData.userData?.profileURL != null ? 
            `
                <div class="userInfo">
                    <p><b>Profile Image</b></p>
                    ${profileData.userData?.profileURL != null ?  `
                        <img class="profileUserHtmlLarge" src="${profileData.userData.profileURL}"></img>
                    ` : ``}
                </div>
            ` : ``
        }
        <div class="userInfo">
            <p><b>Notifications</b></p>
            <a id="notificationSub" onclick="subNotifi('${profileData.userData._id}')">Subscribe</a>
        </div>
        <div class="userInfo">
            <p><b>Display Name</b></p>
            <p>${profileData.userData.displayName}</p>
        </div>
        <div class="userInfo">
            <p><b>Username</b></p>
            <p>${profileData.userData.username}</p>
        </div>
        ${profileData.userData.statusTitle ? 

            `
                <div class="userInfo">
                    <p><b>Status</b></p>
                    <p>${profileData.userData.statusTitle}</p>
                </div>
            ` : ``
        }
        <div class="userInfo">
            <p><b>Description</b></p>
            <p>${profileData.userData.description}</p>
        </div> 
        ${profileData.verified ? 
            `
                <div class="userInfo">
                    <p>Verified</p>
                </div>
            ` : `
            `
        }   
        ${profileData.userData.pronouns ? 
            `
                <div class="userInfo"><p><b>Pronouns</b></p>
                    <p>${profileData.userData.pronouns}</p>
                </div>
            ` : ``
        }
        ${profileData.userData.creationTimestamp ? 
            `  
                <div class="userInfo">
                    <p><b>Creation</b></p>
                    <p>${timesince}</p>
                </div>
            `: ``
        }
        ${profileData.included.posts ? `
            <div class="userInfo">
                <p><b>Posts</b></p>
                <p>${profileData.postData.length}</p>
            </div>
            <hr class="rounded">
            ${profileData.postData.map(function(post) {
                return postElementCreate({post: post, user: profileData.userData})                
            }).join(" ")}
        ` : ``}
    `

    return;
}

async function changePasswordPage() {
    const eleError = `
        <div class="userInfo">
            <p><b>Change Password</b></p>
            <hr class="rounded">
            <p>Can not change password yet, please wait until future version of interact</p>
        </div>
    `;
    document.getElementById("passwordPopup").innerHTML = eleError;
    return ;

    const ele = `
        <div class="userInfo">
            <p><b>Change Password</b></p>
            <hr class="rounded">
            <form id="userEdit_password" class="contentMessage")">
                <label for="password_text"><p>New Password</p></label>
                <input type="password" id="password_text" autocomplete="new-password" class="userEditForm" placeholder="New Password">
            </form>
            <form id="userEdit_password_confirm" class="contentMessage">
                <label for="password_confirm"><p>Confirm Password</p></label>
                <input type="password" id="password_confirm" autocomplete="new-password" class="userEditForm" placeholder="Confirm New Password">
            </form>
            <form id="userEdit_password_old" class="contentMessage">
                <label for="userEdit_password_old_text"><p>Old Password</p></label>
                <input type="text" id="userEdit_password_old_text" autocomplete="current-password" class="userEditForm" placeholder="Old Password">
            </form>
            <a onclick="changePassword()">Change Password</a>
        </div>
    `
    //await showModal(ele)

    document.getElementById("passwordPopup").innerHTML = ele;

    document.getElementById("password_text").addEventListener("submit", function (e) { e.preventDefault()})
    document.getElementById("userEdit_password_old_text").addEventListener("submit", function (e) { e.preventDefault()})
    document.getElementById("password_confirm").addEventListener("submit", function (e) { e.preventDefault()})
}

async function fetchClientEmailData() {
    const response = await fetch(`${apiURL}/emails/userData/`, {
        method: 'GET',
        headers
    });

    const res = await response.json();
    if (debug) console.log(res)
    return res
}

async function changeEmailPage() {
    const emailData = await fetchClientEmailData();

    const ele = `
        <div class="userInfo">
            <div> 
                <p><b>Current Email Settings</b></p>
                <hr class="rounded">
                <p>Current Email: ${emailData.email}</p>
                <p>Email Verified: ${emailData.verified}</p>
                ${emailData.verified && emailData.timestampVerified ? `
                    <p>Verified Since: ${checkDate(emailData.timestampVerified)}</p>
                ` : ``}
                ${emailData.emailSetting != emailData.email ? `
                    <p>Attempting Verification for: ${emailData.emailSetting}</p>
                ` : ``}
                ${emailData.removeRequest ? `
                    <p>Attempting Removal for: ${emailData.removeRequest}</p>
                ` : ``}
            </div>
            <div>
            <hr class="rounded">
            <p><b>Email Notifications</b></p>
                ${emailData.verified ? `
                    <div id="emailSettingOptions"></div>
                ` : `
                    <p>Email is not verified, can not change email settings</p>
                `}
            </div>
            <div>
                <hr class="rounded">
                <p><b>Change Email</b></p>
                <hr class="rounded">
                <form id="userEdit_email" class="contentMessage" onsubmit="editEmailRequest()">
                    <label for="userEdit_email_text"><p>New Email</p></label>
                    <input type="email" id="userEdit_email_text" autocomplete="false" autofill="false" class="userEditForm" placeholder="New Email">
                </form>
                <form id="userEdit_password" class="contentMessage" onsubmit="editEmailRequest()">
                    <label for="userEdit_email_pass"><p>Password</p></label>
                    <input type="password" id="userEdit_email_pass" class="userEditForm" placeholder="Password">
                </form>
                <button class="userInfo buttonStyled" onclick="editEmailRequest()">Submit Email</button>
                <p id="resultAddRequest"></p>
            </div>
            ${emailData.verified ? `
            <div>
                <hr class="rounded">
                <p><b>Remove Email</b></p>
                <hr class="rounded">
                <form id="userEdit_password_remove" class="contentMessage" onsubmit="removeEmailRequest('${emailData.email}')">
                    <label for="userEdit_email_pass_remove"><p>Password</p></label>
                    <input type="password" id="userEdit_email_pass_remove" class="userEditForm" placeholder="Password">
                </form>
                <button class="userInfo buttonStyled" onclick="removeEmailRequest('${emailData.email}')">Remove Email</button>
                <p id="resultRemoveRequest"></p>
            </div> 
            ` : ``}
        </div>
    `

    if (emailData.verified) {
        createEditEmailSettingsView(emailData.emailSettings);
    }

    document.getElementById("emailPopup").innerHTML = ele;
    
    document.getElementById("userEdit_email").addEventListener("submit", function (e) { e.preventDefault()})
    document.getElementById("userEdit_password").addEventListener("submit", function (e) { e.preventDefault()})
    document.getElementById("userEdit_password_remove").addEventListener("submit", function (e) { e.preventDefault()})
}

async function createEditEmailSettingsView(emailSettings) {
    const possibleOptions = await getPossibleEmailSettings();

    var ele = `<form id="userEdit_emailSettings">`;

    for (const option of possibleOptions) {
        ele+=`
        <hr class="rounded">
            <div>
                <input type="checkbox" id="emailSetting_${option.option}" name="interest" value="${option.option}"${emailSettings[option.option] ? ` checked ` : ""}/>
                <label for="${option.option}">${option.name}<br>${option.description}</label>
            </div>
        `
    }

    ele+=`</form><button class="userInfo buttonStyled" onclick="editEmailSettings()">Submit Email Settings</button>`;
    
    document.getElementById("emailSettingOptions").innerHTML = ele;
    document.getElementById("userEdit_emailSettings").addEventListener("submit", function (e) { e.preventDefault()})
}

async function editEmailSettings() {
    // Get the form element
    const form = document.getElementById("userEdit_emailSettings");

    // Get all the checkboxes within the form
    const checkboxes = form.querySelectorAll("input[type='checkbox']");

    // Create an array to store the changed values
    const changedItems = [];

    // Loop through each checkbox and check if its checked state has changed
    checkboxes.forEach((checkbox) => {
        if (checkbox.checked !== checkbox.defaultChecked) {
            changedItems.push(checkbox.value);
        }
    });

    const reqBody = [];
    
    var i=0;
    for (item of changedItems) {
        //[ { option: "notifications", value: true }]
        reqBody.push({ option: item, value: document.getElementById(`emailSetting_${item}`).checked })
    }


    const response = await fetch(`${apiURL}/emails/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(reqBody),
    });

    
    const res = await response.json();

    if (debug) console.log(res);
    if (!response.ok || res.error) return showModal("<p>res.msg</p>");

    createEditEmailSettingsView(res);
}

async function getPossibleEmailSettings() {
    const response = await fetch(`${apiURL}/emails/settings`, {
        method: 'GET',
        headers,
    })

    const res = await response.json();
    if (debug) console.log(res);
    return res;
}

async function removeEmailRequest(currentEmail) {
    const password = document.getElementById("userEdit_email_pass_remove")?.value;
    if (!password) return showModal("Please enter your password");

    const response = await fetch(`${apiURL}/emails/remove`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({
            email: currentEmail,
            password: password
        })
    });

    const res = await response.json();
    if (debug) console.log(res);
    if (!response.ok) {
        document.getElementById("resultRemoveRequest").innerHTML = `<p>Failed</p>`
    } else {
        document.getElementById("resultRemoveRequest").innerHTML = `<p>Success</p>`
    }
    return res;
}

async function updateEmail() {

}

// change password
async function changePassword() {
    // get old password
    // get new password
    // get new password confirm
    // compare passwords
    // submit api call
}

// change email
async function editEmailRequest(hasCurrent) {
    const email = document.getElementById("userEdit_email_text")?.value
    const password = document.getElementById("userEdit_email_pass")?.value
    if (!email) return showModal("<p>Please enter an email</p>");
    if (!password) return showModal("<p>Please enter your password</p>");

    const validated = await validateEmail(email)
    if (validated.valid != true) return showModal("<div><p>Please enter a valid email</p></div>");

    const updatedEmail = await addEmailAccount({email, password});
    if (!updatedEmail) return showModal("<div><p>There was an error updating your email</p></div>");
}

async function validateEmail(email) {
    const response = await fetch(`${apiURL}/emails/requests/validEmail/${email}`, {
        method: 'GET',
        headers
    });

    const res = await response.json();
    if (debug) console.log(res)
    return res
}

async function editEmailAccount() {
    // change email
}

async function addEmailAccount({ email, password }) {
    const response = await fetch(`${apiURL}/emails/set/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({"email" : email, "password" : password})
    });

    const res = await response.json();
    
    if (!response.ok || res.error) {
        document.getElementById("resultAddRequest").innerHTML = `<p>Failed</p>`
        return false
    } else {
        document.getElementById("resultAddRequest").innerHTML = `<p>Success</p>`
    }

    return res;
}

async function subNotifi(subUser) {
    const response = await fetch(`${apiURL}/subscriptions/sub/${subUser}`, {
        method: 'POST',
        headers
    });
    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok || res.error) return document.getElementById('notificationSub').innerHTML=`error`

    document.getElementById('notificationSub').innerHTML=`done`
}

async function unsubUser(userID, username) {
    const response = await fetch(`${apiURL}/subscriptions/unsub/${userID}`, {
        method: 'DELETE',
        headers
    });
    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok || res.error) return document.getElementById(`subList_${userID}`).innerHTML=`error while unsubscribing`

    document.getElementById(`subList_${userID}`).innerHTML=`Unsubscribed from <a onclick="userHtml('${userID}')">${username}</a>.`
}
async function unsubAll(userID) {
    const response = await fetch(`${apiURL}/subscriptions/unsubAll/`, {
        method: 'DELETE',
        headers
    });

    try {
        const res = await response.json();
        if (!response.ok || res.error) return document.getElementById(`subscriptionsDiv`).innerHTML=`error while unsubscribing`
        else return document.getElementById(`subscriptionsDiv`).innerHTML=`Unsubscribed from all users.`
    } catch {
        return document.getElementById(`subscriptionsDiv`).innerHTML=`error while unsubscribing`
    }
}

function hideBookmarks() {
    document.getElementById('bookmarksdiv').innerHTML=""
    document.getElementById('showBookmarksButton').innerHTML="Show Bookmarks"
}

async function showBookmarks() {
    if (document.getElementById('bookmarksAreShown')) return hideBookmarks()
    document.getElementById('showBookmarksButton').innerHTML="Hide Bookmarks"

    const response = await fetch(`${apiURL}/get/bookmarks/`, {
        method: 'GET',
        headers
    });

    // if (!response.ok) return document.getElementById(`saveBookmark_${postID}`).innerText = "Error while saving"
    const res = await response.json();
    if (debug) console.log(res)
    // if (res.error) return document.getElementById(`saveBookmark_${postID}`).innerText = `Error: ${res.error}`;

    var obj = {} // { list: name, saves: [] }
    for (const list of res.lists) {
        obj[list.name] = []
    }

    for (const save of res.saves) {
        // console.log(save.listname)
        obj[save.bookmarkList].push(save._id)
    }

    var ele = `<hr class="rounded" id="bookmarksAreShown">`

    for (const listname in obj) {
        var list = obj[listname]
        ele+=`
            <div>
                <p>${listname}</p>
                <hr class="rounded">
        `
        for (const save of list) {
            if (debug) console.log(save)
            const newData = await getPostAndProfileData(save)
            if (newData.error) ele+=`<p>error</p>`
            else ele+= postElementCreate({post: newData.postData, user: newData.profileData, type : "basic"})
            // ele+=
        }
        ele+=`</div>`
    }

    document.getElementById("bookmarksdiv").innerHTML=ele
    if (debug) console.log(obj)
}

function hideSubscriptions() {
    document.getElementById('subscriptionsDiv').innerHTML=""
    document.getElementById('showSubscriptionsButton').innerHTML="Show Subscriptions"
}

async function showSubscriptions() {
    if (document.getElementById('subscriptionsAreShown')) return hideSubscriptions()
    document.getElementById('showSubscriptionsButton').innerHTML="Hide Subscriptions"
    const response = await fetch(`${apiURL}/subscriptions/getAll`, {
        method: 'GET',
        headers
    });
    // console.log(response)

    // if (!response.ok) return document.getElementById(`saveBookmark_${postID}`).innerText = "Error while saving"
    `
        [
            {
                _id: "d1f32225-a940-48ed-bff9-22efd5636cbd",
                __v: 0, 
                subscribed: [
                    { 
                        _id: "d1f32225-a940-48ed-bff9-22efd5636cbd", 
                        timestamp: 1657607591942
                    }, {
                        _id: "d2ac792f-0f5a-443d-8453-f8396e1b6303", 
                        timestamp: 1658554148695
                    }
                ]
            }, {
                _id: "6ceae342-2ca2-48ec-8ce3-0e39caebe989",
                __v: 0,
                subscribed: [{
                    _id: "d2ac792f-0f5a-443d-8453-f8396e1b6303", 
                    timestamp: 1658554289386
                }]
            }
        ]
    `
    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok) return document.getElementById('showSubscriptionsButton').innerHTML=`error`
    

    var ele = `<hr class="rounded" id="subscriptionsAreShown"><p>${res.length} Subscriptions</p><hr class="rounded">`
    ele = ele+`<div><a id="unsuballbutton" onclick="unsubAll()">unsub from all users.</a><hr class="rounded"></div>`;

    for (const sub of res.reverse()) {
        const userData = await getUserDataSimple(sub._id) 
        ele = ele + `
            <div id="subList_${userData._id}">
                <div>
                    <a onclick="userHtml('${userData._id}')">${userData.username}</a>
                </div>
                <div>
                    <a onclick="unsubUser('${userData._id}', '${userData.username}')">unsub from user.</a>
                </div>
            </div>
        `
    }

    document.getElementById("subscriptionsDiv").innerHTML=ele
}


function hideNotifications() {
    document.getElementById('notificationsDiv').innerHTML=""
    document.getElementById('showNotificationsButton').innerHTML="Show Notifications"
}

async function showNotifications() {
    if (document.getElementById('notificationsAreShown')) return hideNotifications()
    document.getElementById('showNotificationsButton').innerHTML="Hide Notifcations"

    const response = await fetch(`${apiURL}/get/notifications/`, {
        method: 'GET',
        headers
    });

    // if (!response.ok) return document.getElementById(`saveBookmark_${postID}`).innerText = "Error while saving"
    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok) return document.getElementById('showNotificationsButton').innerHTML=`error`
    

    var ele = `<hr class="rounded" id="notificationsAreShown"><p id="amount_notifications">${res.amountFound} Notifications</p><hr class="rounded">`
    /*
        type: String (one)
            1: someone followed
            2: someone unfollowed
            3: someone liked post
            4: someone unliked post
            5: someone posted
            6: someone mentioned you

        var returnData = {
            amountFound: interactUserNotifications.notifications.length,
            notifications: []
        };
    */

    // console.log(res)

    for (const notifi of res.notifications.reverse()) {
        switch (notifi.type) {
            case 5:
                const userData = await getUserDataSimple(notifi.userID) 
                ele+=`
                    <div class="buttonStyled" id="notification_${notifi._id}">
                        <a onclick="showPost('${notifi.postID}')"><b>${userData.username}</b> has posted! (click to see)</a>
                        <p onclick="dismissNotification('${notifi._id}')">Dismiss Notification.</p>
                    </div>
                `
                break;
            case 7: 
                const userData2 = await getUserDataSimple(notifi.userID)
                ele+=`
                    <div class="buttonStyled" id="notification_${notifi._id}">
                        <a onclick="showPost('${notifi.postID}')"><b>${userData2.username}</b> quoted your post!(click to see)</a>
                        <p onclick="dismissNotification('${notifi._id}')">Dismiss Notification.</p> 
                    </div>
                `
            default:
                break;
        }
    }
   
    document.getElementById("notificationsDiv").innerHTML=ele
}
async function dismissNotification(notificationID) {
    const response = await fetch(`${apiURL}/delete/dismissNotification/${notificationID}`, {
        method: 'DELETE',
        headers
    });
    const res = await response.json();
    if (!response.ok) return ;

    if (res.success == false) return;
    document.getElementById(`notification_${notificationID}`).remove();

    var input = document.getElementById("amount_notifications").innerText

    var newInput = input.replace(" Notifications", "")

    newInput--

    document.getElementById("amount_notifications").innerHTML=`${newInput} Notifications` 
};

async function showPost(postID) {
    const response = await fetch(`${apiURL}/get/post/${postID}`, {
        method: 'GET',
        headers
    });

    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok) return 

    const user = await getUserDataSimple(res.userID)
    if (debug) console.log(user)
    const ele = postElementCreate({post: res, user: user})
    document.getElementById('mainFeed').innerHTML=ele
}
/*
`
    <button class="buttonStyled" id="showNotificationsButton" onclick="showNotifications()">Show Notifications</button>
    <div id="notificationsDIv"></div>
`
*/

async function getUserDataSimple(userID) {
    const response = await fetch(`${apiURL}/get/userByID/${userID}`, {
        method: 'GET',
        headers
    });

    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok) return 
    else  return res
}

async function hideDevOptions() {
    document.getElementById('showDevDiv').innerHTML=""
    document.getElementById('showDevOptionsButton').innerHTML="Show Dev Settings"
}

function revealDevOptions(option, index){
    switch (option) {
        case "devToken":
            const eledevtoken = document.getElementById('devToken');
            if (eledevtoken.classList.contains("blur")) eledevtoken.classList.remove('blur')   
            else eledevtoken.classList.add('blur')
            break;
        case "appTokens":
            const eleapptokens = document.getElementById(`appToken_${index}`);
            if (eleapptokens.classList.contains("blur")) eleapptokens.classList.remove('blur')   
            else eleapptokens.classList.add('blur')
           
            break;
        case "appAccess":
            const eleaccess = document.getElementById(`appAccess_${index}`);
            if (eleaccess.classList.contains("blur")) eleaccess.classList.remove('blur')   
            else eleaccess.classList.add('blur')
           
            break
        default:
            break;
    }
}

async function showDevOptions() {
    if (document.getElementById('showDevAreShown')) return hideDevOptions()
    document.getElementById('showDevOptionsButton').innerHTML="Hide Developer Settings"

    const response = await fetch(`${apiURL}/get/developer/`, {
        method: 'GET',
        headers
    });

    if (!response.ok) return document.getElementById(`showDevDiv`).innerText = "Error while requesting data"
    const res = await response.json();
    if (debug) console.log(res)

    var firstEle = `
        <hr class="rounded" id="showDevAreShown">
        <p>Account Status</p>
        <div class="userInfo">
            ${res.developer ? `<p>You have an Interact Developer Account</p>`:``}
            ${res.applications&&res.AppTokens ? `<p>You have ${res.AppTokens.length} Approved Applications</p>`: ``}
            ${res.allowedApplications&&res.AppAccesses ? `<p>${res.AppAccesses.length} Connected Applications`: ``} 
        </div>
    `;

    var devAccEle='';
    if (res.developer&&res.DeveloperToken) {
        devAccEle=`
            <hr class="rounded">
            <p>Developer Account</p>
            <div class="userInfo">
                ${res.DeveloperToken._id ? `<p>devToken: <p onclick="revealDevOptions('devToken')" id="devToken" class="blur">${res.DeveloperToken._id}</p>`:``}
                ${res.DeveloperToken.premium ? `<p>Premium Dev Account</p>`:`<p>Regular Dev Account</p>`}
                ${res.DeveloperToken.creationTimestamp ? `<p>Dev account created: ${checkDate(res.DeveloperToken.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
                ${res.DeveloperToken._id ? `<p onclick="copyToClipboard('${res.DeveloperToken._id}')">Copy Token</p>` : ""}
            </div>
        `;

    } else {
        devAccEle=`
            <hr class="rounded">
            <p>Developer Account</p>
            <div class="userInfo" id="devAcc">
                <p>Signup for a developer account.</p>
                <div class="searchSelect search">
                    <button onclick="requestDevToken()">Signup</button>
                </div>
            </div>
        `
    };

    var appTokensEle='<hr class="rounded"><p>App Token</p>';

    // list of app token
    var amount=0;
    if (res.applications&&res.AppTokens) {
        appTokensEle=`<hr class="rounded"><p>App Token${res.AppTokens.length>=2 ? 's': ''}</p><div id="appTokenList">`
        
        // var amount=0;
        for (const appToken of res.AppTokens.reverse()) {
            amount++;
            appTokensEle+=`
                <div class="userInfo">
                    <p>appToken #${amount} of ${res.AppTokens.length}</p>
                    <p>app name: ${appToken.appName ? appToken.appName : `Unknown`}
                    ${appToken._id ? `<p>appToken: <p onclick="revealDevOptions('appTokens', ${amount})" id="appToken_${amount}" class="blur">${appToken._id}</p>`:``}
                    ${appToken._id ? `<p onclick="copyToClipboard('${appToken._id}')">Copy Token</p>` : ""}
                    <p>API Uses: ${appToken.APIUses? appToken.APIUses : `0`}
                    ${appToken.creationTimestamp ? `<p>Application created: ${checkDate(appToken.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
                </div>
            `;
        };
        appTokensEle+="</div>"
    };
    // create new app token
    if (res.developer) {
        appTokensEle+=`
            <div class="userInfo" id="newAppToken">
                <p>Generate New App Token</p>
                <p>Please input an application name</p>
                <div class="searchSelect search">
                    <input id="appName_AppTokenRequest" placeholder="Application Name:">
                </div>
                <button onclick="requestAppToken(${amount})">Generate Token</button>
            </div>
        `
    }

    var appAccessEle=`<hr class="rounded"><p>App Connections</p>`;
    if (res.allowedApplications&&res.AppTokens) {
        var amount=0;
        for (const appAccess of res.AppAccesses) {
            amount++;
            appAccessEle+=`
                <div class="userInfo">
                    <p>appAccess ${amount} of ${res.AppAccesses.length}</p>
                    ${appAccess.appToken ? `<p>Using appToken: <p onclick="revealDevOptions('appAccess', ${amount})" id="appAccess_${amount}" class="blur">${appAccess.appToken}</p>`:``}
                </div>
            `;
        };
    };
    
    var ele = firstEle+devAccEle+appTokensEle+appAccessEle;
    
    document.getElementById("showDevDiv").innerHTML=ele;
    return;
};

function copyToClipboard(data) {
    navigator.clipboard.writeText(data);
}

async function requestAppToken(amount) {
    const newAmount = amount+1;
    const appName = document.getElementById('appName_AppTokenRequest').value;
    if (debug) console.log(appName);
    const userDevToken = document.getElementById('devToken').innerText;
    if (debug) console.log(userDevToken);
    document.getElementById('newAppToken').innerHTML="loading";

    if (!appName){
        return document.getElementById('newAppToken').innerText="Failed! Please input a new app name!";

    };
    if (!userDevToken) {
        return document.getElementById('newAppToken').innerText="Failed! No user dev token, please request a developer account!";
    };
    const data = {
        appname: appName,
        userdevtoken: userDevToken
    }
    const requestRes = await fetch(`${apiURL}Priv/post/newAppToken`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    const appTokenData = await requestRes.json();
    if (debug) console.log(appTokenData)
    if (!requestRes.ok || requestRes.error) return console.log({error: `${requestRes?.error ? requestRes.error : "an unknown error"}`});

    const newEle = `
        <div class="userInfo">
            <p>NEW TOKEN</p>
            <p>appToken #${newAmount}</p>
            <p>app name: ${appTokenData.appName ? appTokenData.appName : `Unknown`}
            ${appTokenData._id ? `<p>appToken: <p onclick="revealDevOptions('appTokens', ${newAmount})" id="appToken_${newAmount}" class="blur">${appTokenData._id}</p>`:``}
            ${appTokenData._id ? `<p onclick="copyToClipboard('${appTokenData._id}')">Copy Token</p>` : ""}
            <p>API Uses: ${appTokenData.APIUses? appTokenData.APIUses : `0`}
            ${appTokenData.creationTimestamp ? `<p>Application created: ${checkDate(appTokenData.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
        </div>
    `;
    const newRequestEle = `
        <p>Generate New App Token</p>
        <p>Please input an application name</p>
        <div class="searchSelect search">
            <input id="appName_AppTokenRequest" placeholder="Application Name:">
        </div>
        <button onclick="requestAppToken(${newAmount})">Generate Token</button>
    `
    document.getElementById('newAppToken').innerHTML=newRequestEle
    document.getElementById('appTokenList').innerHTML+=newEle;
}

async function requestDevToken() {
    document.getElementById('devAcc').innerHTML="loading";

    const requestRes = await fetch(`${apiURL}Priv/post/newDev`, {
        method: 'POST',
        headers
    });

    const devData = await requestRes.json();
    if (!requestRes.ok || devData.error) return console.log({error: `${devData?.error ? devData.error : "an unknown error"}`});

    const newEle = `
        ${devData._id ? `<p>devToken: <p onclick="revealDevOptions('devToken')" id="devToken" class="blur">${devData._id}</p>`:``}
        ${devData.premium ? `<p>Premium Dev Account</p>`:`<p>Regular Dev Account</p>`}
        ${devData.creationTimestamp ? `<p>Dev account created: ${checkDate(devData.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
    `;

    document.getElementById('devAcc').innerHTML=newEle;
};

async function getPostAndProfileData(postID) {
    const postRes = await fetch(`${apiURL}/get/post/${postID}`, {
        method: 'GET', 
        headers
    });

    const postData = await postRes.json();

    if (!postRes.ok || postData.error) return {error: `${postData.error ? postData.error : "an unknown error"}`};
    if (debug) console.log(postData);

    const profileRes = await fetch(`${apiURL}/get/userByID/${postData.userID}`, {
        method: 'GET',
        headers,
    });

    const profileData = await profileRes.json();
    if (debug) console.log(profileData);

    if (!profileRes.ok || profileData.error) return {error: `${profileData.error ? profileData.error : "an unknown error"}`};


    return { "postData" : postData, "profileData": profileData };
}

async function requestVerification() {
    var input = document.getElementById('content_request_verification').value
    if (debug) console.log(input)

    const data = { 
        "content" : input,
    };
    // closeModal()

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    fetch(`${apiURL}/post/requestVerify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    }).then(res => {
        console.log(res)
    })
    /*const response = await fetch(`${apiURL}/post/requestVerify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });*/

    // const verification = await response.json()
    // if (debug) console.log(verification)
}

// MAKES SEARCH BAR APPEAR
function searchBar() {

}

function activeSearchBar() {
    document.getElementById("searchArea").innerHTML = `
        <div class="searchSelect search">
            <input id="searchBarArea" onkeyup="searchSocial()" placeholder="Search for Posts and Users...">
        </div>
    `
    document.getElementById('navSection5').innerHTML = `
        <div id="searchBar" class="nav-link" onclick="unactiveSearchBar()">
            <span class="material-symbols-outlined nav-button";>search</span>
            <span class="link-text pointerCursor" id="page6">Remove</span>
        </div>

    `
}
function unactiveSearchBar() {
    document.getElementById("searchArea").innerHTML = ``
    document.getElementById('navSection5').innerHTML = `
        <div id="searchBar" class="nav-link" onclick="activeSearchBar()">
            <span class="material-symbols-outlined nav-button";>search</span>
            <span class="link-text pointerCursor" id="page6">Search</span>
        </div>

    `
}

function postBar() {
    document.getElementById("postBar").innerHTML = `
        <form id="searchBar" class="searchSelect search" onsubmit="createPost()">
            <input type="text" id="newPostTextArea" placeholder="Type out your next update...">
        </form>
    `

    /* 
    <div class="searchSelect search">
        <input type="text" id="postBarArea" placeholder="Type out your next update...">
        <button class="buttonStyled" onclick="postbarPublish()">Publish Update</button>
    </div>
    */
}

// MAKES SEARCHBAR DISAPPEAR
function removeSearchBar() {
    document.getElementById("searchBar").innerHTML = ``
}

// SIGN UP PAGE
async function signupSocial() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="signup">
            <div class="main-feed">
                <h1>Dummy signup page</h1>
            </div>
            <div class="userInfo">
                <input type="text" id="usernameProfile" placeholder="Your username">
            </div>
                <div class="userInfo">
                <input type="text" id="displaynameProfile" placeholder="Your displayname">
            </div>
        </div>
    `
}

function saveLoginUser(userLoginToken) {
    localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(userLoginToken))
}

function checkLoginUser() {
  if (debug) console.log(localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN))
   //  localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(userLoginToken))
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

// CHECK DEBUG COOKIE
function checkCookie() {
    var showmenu = getCookie("debugMode");

    if (showmenu == "true") {
        openSideBar()
        return;
    } if (showmenu == false) {
        closeSideBar()
        return;
    } else {
        setCookie("debugMode", false, 365)
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

// GET REQUESTED COOKIE
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

// GET DATA FROM API FOR MAIN FEED
async function getFeed() {
    document.getElementById('mainFeed').innerHTML=``
    searchBar()
    // postBar()

    if (currentFeed) return buildView(currentFeed)
    if (debug) console.log("loading feed")

    const params = await checkURLParams()
    if (params.paramsFound != false) return 

    const response = await fetch(`${apiURL}/get/allPosts`, { method: 'GET', headers})
    var data = await response.json()

    currentFeed = data.reverse()


    if (params.paramsFound == false) return buildView(data)
    else return
}

// EASTER EGG
function test() {
    removeSearchBar()

    document.getElementById("mainFeed").innerHTML = `
        <div class="mainNameEasterEgg"> 
            <h1>You pressed the logo!!</h1>
            <p>You pressed the header name, thats pretty cool of you! Thank you for checking out interact!</p>
            <p>Press the button below to go back!</p>
            <button class="buttonStyled" onclick="switchNav(5)">Main Feed!</button>
        </div>
    `
}

function checkDate(time){
    var timeNum = 0
    if (!isNaN(time)) timeNum = parseFloat(time)
    else timeNum = time
    const date = dateFromEpoch(timeNum)
    
    return date
}

function dateFromEpoch(time) {
   // console.log(time)
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

// BUILDING MAIN FEED
function buildView(posts) {
    if (searching) return

   // const userDiv = document.createElement("div") 
   // userDiv.innerHTML=`<div id="test"></div>`

   // // document.getElementById("mainFeed").append(userDiv)
   // document.getElementById('test').innerText=`test`


    document.getElementById("mainFeed").innerHTML = `
        <div id="addToTop"></div>
        ${posts.map(function(postArray) {
            return postElementCreate({post: postArray.postData, user: postArray.userData})
            /* 
            return `
                <div class="postArea">
                    <div class="subheaderMessage">
                        <p 
                            ${user ? ` onclick="userHtml('${post.userID}')" 
                            class="${user._id == currentUserLogin.userID ? "ownUser" : "otherUser"}"
                        >
                            ${user.displayName} @${user.username}` : '>Unknown User'} | ${timesince ? timesince : ""}</p> 
                        </p>
                    </div>
                    <p class="contentMessage">${post.content}</p>
                    <p class="debug">${post._id} - from: ${post.userID}</p>
                </div>
            `*/
            
            /* 
            return `
                <div class="publicPost">
                    <h2 ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}` : '>Unknown User'}</h2>
                    <p>${timesince}</p>
                    <p>${post.content}</p>
                    <p class="debug">${post._id} - from (${post.userID})</p>
                    <button class="buttonStyled" id="${post._id}" onclick="blankFunction('like')">like</button> | <button class="buttonStyled" onclick="blankFunction('repost')">repost</button> | <button class="buttonStyled" onclick="blankFunction('reply')">reply</button>
                </div>
            `
            */

        }).join(" ")}
    `
    devMode()
}
async function deletePost(postID) {
    if (debug) console.log(`deleting post ${postID}`)
    const response = await fetch(`${apiURL}/delete/removePost/${postID}`, { method: 'DELETE', headers})

    if (response.status == 200)  {
        if (debug) console.log("post deleted")
        document.getElementById(`popupOpen_${postID}`).remove()
        return document.getElementById(`postdiv_${postID}`).remove()
    }
    else return showModal("Error", "Something went wrong, please try again later")
}
//postContent_${post._id}

function editPost(postID, edited) {
    if (debug) console.log(`editing post ${postID}`)

    const oldMessage = document.getElementById(`postContent_${postID}`).innerText

    if (debug) console.log(oldMessage)
    document.getElementById(`postContentArea_${postID}`).innerHTML = `
        <form id="editPostForm" class="contentMessage"onsubmit="submitEdit('${postID}')">
            <input type="text" id="editPostInput" class="contentMessage contentMessageFormEdit" value="${oldMessage}">
        </form>
    `
    document.getElementById(`editButton_${postID}`).innerHTML=`<p onclick='cancelEdit("${postID}", "${oldMessage}", "${edited}")'>cancel edit</p>`
   // editButton_${post._id}

    document.getElementById(`editPostInput`).focus()
    document.getElementById("editPostForm").addEventListener("submit", function (e) { e.preventDefault()})

    // if (response.status == 200) return document.getElementById(`postdiv_${postID}`).remove()
    // else return showModal("Error", "Something went wrong, please try again later")
}

async function cancelEdit(postID, content, edited) {
    if (debug) console.log(`cancelling edit of post ${postID}`)

    const postData = await fetch(`${apiURL}/get/post/${postID}`, { method: 'GET', headers})
    if (!postData.ok) return showModal("Error", "Something went wrong, please try again later")
    const post = await postData.json()
    if (debug) console.log(post)
    const userData = await fetch(`${apiURL}/get/userByID/${post.userID}`, { method: 'GET', headers})
    if (debug) console.log(userData)
    if (!userData.ok) return showModal("Error", "Something went wrong, please try again later")

    const user = await userData.json()
    if (debug) console.log(user)
    return document.getElementById(`postElement_${postID}`).innerHTML = postElementCreate({post, user})
}

async function submitEdit(postID) {
    if (debug) console.log(postID)

    const newEdit = document.getElementById('editPostInput').value
    const data = {'postID': postID, 'content': newEdit}

    const response = await fetch(`${apiURL}/put/editPost`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    })
    
    if (debug) console.log(response)
    if (!response.status == 200) return showModal("Error something went wrong, please try again later")

    const editData = await response.json()

    if (debug) console.log(editData)
    const imageContent = checkForImage(editData.new.content)

    document.getElementById(`editButton_${postID}`).innerHTML=`<a onclick='editPost("${postID}")'>edit post</a>`

    return document.getElementById(`postContentArea_${postID}`).innerHTML = `
        <div class="textAreaPost">
            <p id="postContent_${postID}">${imageContent.content} </p>
            ${editData.new.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
        </div>
        <div class="PostAttachments">
            ${imageContent.image ? `<div>${imageContent.attachments.map(function(attachment) {return `${attachment}`}).join(" ")}</div>`:''}
        </div>
    `  
}
async function quotePost(postID) {
    const postResponse = await fetch(`${apiURL}/get/post/${postID}`, { method: 'GET', headers})
    if (!postResponse.ok) return showModal(`<h1>Error</h1><p>something went wrong</p>`)
    const post = await postResponse.json()
    const userResponse = await fetch(`${apiURL}/get/userByID/${post.userID}`, { method: 'GET', headers })
        
    if (!userResponse.ok) return showModal(`<h1>Error</h1><p>something went wrong</p>`)
    const user = await userResponse.json()
    if (debug) console.log(user)
    await showModal(`
        <h1>Create a new Post</h1>
        <div class="postModalActions">
            <p onclick="createPost({'quoteID':'${postID}'})">Upload Post</p>
            <p onclick="closeModal()">Close</p>
        </div>
        <div class="post">
            <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}` : '>Unknown User'}</p>
            <div class="postContent" id="postContentArea_${post._id}">
                <div class="textAreaPost">
                    <p id="postContent_${post._id}">${post.content}</p>
                    ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                </div>
            </div>
        </div>
        <textarea class="postTextArea" id="newPostTextArea"></textarea>
        <div id="foundTaggings"></div>
    `, "hide")
}

async function replyPost(postID) {
    const postResponse = await fetch(`${apiURL}/get/post/${postID}`, { method: 'GET', headers})
    if (!postResponse.ok) return showModal(`<h1>Error</h1><p>something went wrong</p>`)
    const post = await postResponse.json()
    const userResponse = await fetch(`${apiURL}/get/userByID/${post.userID}`, { method: 'GET', headers })
        
    if (!userResponse.ok) return showModal(`<h1>Error</h1><p>something went wrong</p>`)
    const user = await userResponse.json()
    if (debug) console.log(user)
    await showModal(`
        <h1>Create a new Reply</h1>
        <div class="postModalActions">
            <p onclick="createPost({'replyID':'${postID}'})">Upload Reply</p>
            <p onclick="closeModal()">Close</p>
        </div>
        <div class="post">
            <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}` : '>Unknown User'}</p>
            <div class="postContent" id="postContentArea_${post._id}">
                <div class="textAreaPost">
                    <p id="postContent_${post._id}">${post.content}</p>
                    ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                </div>
            </div>
        </div>
        <textarea class="postTextArea" id="newPostTextArea"></textarea>
        <div id="foundTaggings"></div>
    `, "hide")
}
function checkIfLiked(postID) {
    if (document.getElementById(`likePost_${postID}`).classList.contains("likedColour")) return true
    else return false
}

// take in data then return the correct pural form of the data
function puralDataType(type, amount) {
    if (!amount || !type) return `${type}`

    switch (type) {
        case "like":
            if (amount == 1) return `${amount} like`
            else return `${amount} likes`;
        case "reply":
            if (amount == 1) return `${amount} reply`
            else return `${amount} replies`;
        case "quote":
            if (amount == 1) return `${amount} quote`
            else return `${amount} quotes`;
        default:
            return `${amount} ${type} (!!update puralDataType func!!)`
    }
}

async function likePost(postID) {
    if (debug) console.log("liking post")

    const postIsLiked = checkIfLiked(postID)

    var data 
    if (postIsLiked) {
        if (debug) console.log("liking post")
        const response = await fetch(`${apiURL}/delete/unlikePost/${postID}`, { method: 'DELETE', headers})
        data = await response.json()

        if (!response.ok || data.error) {
            if (debug) console.log("something went wrong while liking");
            return false;
        }
        
        document.getElementById(`likePost_${postID}`).classList.remove("likedColour");
        document.getElementById(`likePost_${postID}`).innerText = puralDataType('like', data.totalLikes);
    }
    else {
        if (debug) console.log("liking post")
        const response = await fetch(`${apiURL}/put/likePost/${postID}`, { method: 'PUT', headers})

        data = await response.json()

        if (!response.ok || data.error) {
            if (debug) console.log("something went wrong while liking");
            return false;
        }

        document.getElementById(`likePost_${postID}`).classList.add("likedColour");
        document.getElementById(`likePost_${postID}`).innerText = puralDataType('like', data.totalLikes)
    }
    
    if (debug) console.log(data)

   
}

// USER DATA FOR FEED
async function getUserData(userID) {
    const response = await fetch(`${apiURL}/get/user/${userID}`, {
        method: 'GET',
        headers,
    });
    return response.json()
}

var currentSearch

// SEARCHING
async function searchSocial() {
    var input = document.getElementById('searchBarArea').value;
    searching = false
    searchResult(input)
}
async function addWritingToSeachBar(input) {
    document.getElementById('searchBarArea').value = input
}

async function searchResult(input) {
    if (!input) {
        if (debug) console.log("returning to feed")
        changeHeader('')

        return getFeed()
    }
    if (currentSearch == input){
        if (debug) console.log("same search")
        return console.log("same")
    }

    currentSearch = input
    searching = true
    headers.lookupkey = input

    changeHeader(`?search=${input}`)

    const response = await fetch(`${apiURL}/get/search/`, {
        method: 'GET',
        headers,
    });  

    var data = await response.json()

    if (debug) console.log("loading search")

    if (debug) console.log(data)
    
    if (!data.postsFound[0] && !data.usersFound[0]) return document.getElementById("mainFeed").innerHTML= `<div class="publicPost searchUser"><p>no results were found, try to seach something else.</div>`
    else console.log(data.postsFound)

    document.getElementById("mainFeed").innerHTML = `
        ${data.usersFound.reverse().map(function(user) {
            var timesince
            if (user.creationTimestamp) timesince = checkDate(user.creationTimestamp)
            
            return `
                <div class="publicPost searchUser">
                    <p class="${user._id == currentUserLogin.userID ? "ownUser" : "otherUser"}" onclick="userHtml('${user._id}')"> ${user.displayName} @${user.username} | ${user.creationTimestamp ? timesince : '' }</p>
                    <p>${user.description ? user.description : "no description"}</p>
                    <p>Following: ${user.followingCount} | Followers: ${user.followerCount}</p>
                    <p class="debug">${user._id}</p>
                </div>
            `
        }).join(" ")}
        ${data.postsFound.reverse().map(function(postArray) {
            return postElementCreate({post: postArray.postData, user: postArray.userData})
        }).join(" ")}
    `

    devMode()
    searching = false
}

async function createPostPage() {
    var preinput = false;
    var data = { };
    var paramsFound = [];
    if (debug) console.log("params? " + getUrl.search)
    if (debug) console.log("params != ?posting " + getUrl.search.includes("?posting"))

    // content from header
    const foundContentParam = params.get('content');
    if (foundContentParam) {
        preinput = true
        data.content = foundContentParam
        paramsFound.push({ "paramName" : "content", "paramValue" : foundContentParam})
    }

    // pollID from header
    const foundPollIDParam = params.get('pollID');
    if (foundPollIDParam) {
        preinput = true
        data.pollID = foundPollIDParam
        paramsFound.push({ "paramName" : "pollID", "paramValue" : foundPollIDParam})
    }
   
    // poll data from header
    const foundPollParam = params.get('poll');
    if (foundPollParam) {
        preinput = true
        data.poll = foundPollParam
        paramsFound.push({ "paramName" : "poll", "paramValue" : foundPollParam})
        
        // poll options from header
        const foundPollOptionsParam = params.get('pollOptions');
        if (foundPollOptionsParam) {
            preinput = true
            data.pollOptions = foundPollOptionsParam
            paramsFound.push({ "paramName" : "pollOptions", "paramValue" : foundPollOptionsParam})
        }

        // poll title from header
        const foundPollTitleParam = params.get('pollTitle');
        if (foundPollTitleParam) {
            preinput = true
            data.pollTitle = foundPollTitleParam
            paramsFound.push({ "paramName" : "pollTitle", "paramValue" : foundPollTitleParam})
        }

        for (let i=1; i<=data.pollOptions;i++) {
            const foundPollOptionParam = params.get(`poll_option_${i}`);
            if (foundPollOptionParam) {
                data[`poll_option_${i}`] = foundPollOptionParam
                paramsFound.push({ "paramName" : `poll_option_${i}`, "paramValue" : foundPollOptionParam })
            }
        }
    }

    changePostPageNavButton('goto')

    // from old post modal 
    const foundModal = document.getElementById("postingModel");
    if (debug) console.log("foundModal: " + foundModal);

    if (foundModal) {
        const content = document.getElementById('newPostTextArea')
        if (debug) console.log("content: " + content)
        if (content) {
            content.remove()
            if (content.value)data.content = content.value;
            preinput = true;
        };

        const foundPollLink = document.getElementById('pollCreateLink');
        if (foundPollLink) {
            if (foundPollLink.value) data.pollID = foundPollLink.value
            preinput = true;
        }

        closeModal();
        foundModal.remove();
    }

    var paramString = ""
    for (const param of paramsFound) {
        if (debug) console.log(param.paramName, param.paramValue);
        const str = createNewParam(param.paramName, param.paramValue);
        if (str) paramString += str;
    }
    // if (data.content) changeHeader(`?posting&content=${encodeURIComponent(data.content)}`)
    changeHeader(`?posting${paramString}`)

    if (debug) console.log("creating post")

    const ele = `
        <div id="postPageDiv" class="postPageDiv">
            <h1>Create a new Post</h1>
            <div class="postPageInput">
            <textarea class="postTextArea" onkeyup="onTypePostPage()" id="newPostTextArea">${data?.content ? data.content : ""}</textarea>
            </div>
            <div class="mainActions">
                <p class="publicPost" onclick="leavePostPage()">Back</p>
                <p class="publicPost" onclick="publishFromPostPage()">Upload Post</p>
                <p class="publicPost" id="pollCreationButton" onclick="showPollCreation()">Add Poll</p>
                <div class="publicPost">
                    <p onclick="exportPostHeaderURL()">Create Post Template</p>
                    <p id="postURL_preview"></p>
                    <p id="postURL_messageURL"></p>
                </div>
            </div>
            <div>
                <input type="text" id="pollCreateLink" class="addPollOption" placeholder="Link Poll via ID" ${data.pollID ? `value="${data.pollID}"` : ""}></input>
            </div>
            <div id="pollCreate"></div>
            <div id="foundTaggings"></div>
        </div>
    `;

    document.getElementById("mainFeed").innerHTML = ele;

    // add all data found from headers
    if (data.poll) {
        if (data.pollOptions) {
            showPollCreation();
            const currentAmountOptions = checkPollOptionAmount();
            for (let i=currentAmountOptions+1; i<=data.pollOptions; i++) {
                if (debug) console.log("adding option: " + i)
                document.getElementById("options").innerHTML += addOption(i);
            }
        }
        if (data.pollTitle) {
            document.getElementById("pollCreateTitle").value = data.pollTitle;
        }

        for (let i=1; i <= data.pollOptions; i++) {
            const foundOption = data[`poll_option_${i}`];
            if (foundOption) document.getElementById(`poll_option_${i}`).value = data[`poll_option_${i}`]
        }
    }
};

function createPostPageHeaders() {
    const content = document.getElementById('newPostTextArea')?.value
    const pollID = document.getElementById('pollCreateLink')?.value

    const params = []

    // content to post page header
    if (content != undefined && content != null && content != "") {
        if (debug) console.log("content")
        const newParam = createNewParam("content", content)
        params.push(newParam);
    } else if (debug) console.log("no content")

    // pollID to post page header
    if (pollID != undefined && pollID != null && pollID != "") {
        if (debug) console.log("pollID")
        const newParam = createNewParam("pollID", pollID)
        params.push(newParam);
    } else if (debug) console.log("no pollID")
    
    // poll in ceation
    const createPoll = document.getElementById('pollCreation')
    if (createPoll) {
        if (debug) console.log("poll")
        const newParam = createNewParam("poll", true)
        params.push(newParam);

        // pollTitle
        const pollTitle = document.getElementById('pollCreateTitle')?.value
        if (pollTitle) {
            const newParam = createNewParam("pollTitle", pollTitle)
            params.push(newParam);
        }

        // options + amount of options 
        const amountOptions = checkPollOptionAmount();
        if (amountOptions) {
            const newParam = createNewParam("pollOptions", amountOptions)
            params.push(newParam);

            for (let i = 1; i <= amountOptions; i++) {
                const option = document.getElementById(`poll_option_${i}`)?.value
                if (option !=null && option != undefined && option != "") {
                    const newParam = createNewParam(`poll_option_${i}`, option)
                    params.push(newParam);
                }
            }
        }
    } else if (debug) console.log("no poll")

    if (debug) console.log(params)
    var newString = `?posting`

    for (const param of params) {
        newString += param
    };

    return newString;
}

function exportPostHeaderURL() {
    const newParam = createPostPageHeaders();
    
    const newString = `${baseUrl}${newParam}`

    if (debug) console.log(newString);
    copyToClipboard(newString);

    document.getElementById("postURL_messageURL").innerHTML = `Copied!`
    document.getElementById("postURL_preview").innerHTML = newString
}

async function onTypePostPage(e) {
    socialTypePost()

    return 
    // this would change the top url. works, but not needed
    const content = document.getElementById('newPostTextArea')?.value
    if (content != null) newPostHeader("content", content) 
    // createHeaderParamString('posting', true)
}

function newPostHeader(paramName, data) {
    const newString = createNewParam(paramName, data);
    if (debug) console.log("new param: " + newString)
    const current = getUrl.search;
    const hasParam = current.includes(paramName);

    if (hasParam) {
        const oldData = encodeURIComponent(params.get(paramName));
        const newHeader = current.replace(`&${paramName}=${oldData}`, newString);
        changeHeader(newHeader);
        if (debug) console.log("newURL: " + getUrl.search)

    } else {
        const newHeader = current + newString;
        changeHeader(newHeader);
        if (debug) console.log("newURL: " + getUrl.search)
    }

    params = new URLSearchParams(getUrl.search)
}

function createNewParam(paramName, data) {
    return `&${paramName}=${encodeURIComponent(data)}`;
}

async function publishPoll() {
    if (debug) console.log("creating poll")
    const amountOptions = checkPollOptionAmount();
    if (amountOptions<2 || amountOptions>10) return showModal("<h1>Something went wrong.</h1><p>Please enter between 2 and 10 poll options</p>")

    var options = [];
    for (let i = 1; i <= amountOptions; i++) {
        const option = getOption(i);
        if (option) options.push(option);
        if (debug) console.log(option)
    }

    if (options.length < 2 || options.length > 10) return showModal("<h1>Something went wrong.</h1><p>Please enter between 2 and 10 poll options</p>");

    /*
        pollName
        timeLive
        optioNAmount
        option_[num]
    */
    var body = {
        pollName: document.getElementById('pollCreateTitle')?.value,
        // timeLive: document.getElementById('timeLive')?.value, add later
        optionAmount: amountOptions,
    };

    for (let i = 0; i < options.length; i++) {
        body[`option_${i+1}`] = options[i];
    }

    if (debug) console.log(body);

    const response = await fetch(`${apiURL}/polls/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    const pollData = await response.json()
    if (debug) console.log(pollData)

    if (!response.ok) {
        if (pollData.msg) showModal(`<h1>Something went wrong.</h1> <p>${pollData.code}\n${pollData.msg}</p>`)
        else if (pollData.error.msg) showModal(`<h1>Something went wrong.</h1> <p>${pollData.error.code}\n${pollData.error.msg}</p>`)
        else showModal(`<h1>Something went wrong.</h1> <p>${JSON.stringify(pollData)}</p>`)
        return null;
    }
    
    return pollData.pollData;
};

async function publishFromPostPage() {
    if (debug) console.log("publishing post")
    const createPoll = document.getElementById('pollCreation');

    var pollID = null;
    if (createPoll) {
        const pollData = await publishPoll();
        if (debug && pollID) console.log("new pollID: " + pollID)
        if (pollData) pollID = pollData._id;
        else return null;
    }

    /* if poll then publish poll first */
    return createPost({ pollID: pollID ? pollID : null });
};

function changePostPageNavButton(method) {
    return false;
    if (method == "goto") {
        document.getElementById('navSection4').innerHTML = `
            <div id="page4Nav" class="nav-link" onclick="leavePostPage()">
                <span class="material-symbols-outlined nav-button";>home</span>
                <span class="link-text pointerCursor" id="page4">Home</span>
            </div>
        `
    } else {
        document.getElementById('navSection4').innerHTML = `
            <div id="page4Nav" class="nav-link" onclick="createPostModal()">
                <span class="material-symbols-outlined nav-button";>post_add</span>
                <span class="link-text pointerCursor" id="page4">Create Post</span>
            </div>
        `
    };
};

/*
    user opens post page
    - can get data from modal 

    user types in post

    user can add poll
    when user press create, it will create a poll, then add the poll to the post via id
*/

async function leavePostPage() {
    if (debug) console.log("leaving post")
    if (getUrl.search=="?posting") changeHeader('')
    //changePostPageNavButton('leave')
    getFeed()
}

function removePollCreation() {
    if (debug) console.log("removing poll")
    document.getElementById("pollCreate").innerHTML = "";
    document.getElementById("pollCreationButton").onclick=showPollCreation;
    document.getElementById("pollCreationButton").innerHTML="Add Poll";
}

function showPollCreation() {
    if (debug) console.log("creating poll")
    document.getElementById("pollCreationButton").onclick=removePollCreation;
    document.getElementById("pollCreationButton").innerHTML="Remove Poll";
    
    const content = document.getElementById('newPostTextArea')?.value
    if (content) showinput = true

    var ele = `
        <hr class="rounded">
        <h1>Create New Poll</h1>
        <hr class="rounded">
        <div class="mainActions">
            <p class="publicPost" onclick="addExtraOption()">Add Another Option</p>
            <p class="publicPost" onclick="removeLastOption()">Remove Newest Option</p>
        </div>
        <hr class="rounded">
        <div id="pollCreation">
            <div id="optionAmount"></div>
            <div>
                <p><u>Question</u></p>
                <input type="text" id="pollCreateTitle" class="addPollOption" placeholder="Question">
            </div>
            <div id="options">${addOption(1)}${addOption(2)}</div>
        </div>
    `;

    document.getElementById("pollCreate").innerHTML = ele;
}

function checkPollOptionAmount() {
    const options = document.getElementsByClassName("pollOption");
    return options.length || 1;
};

function removeLastOption() {
    if (debug) console.log("removing option")
    const currentNum = checkPollOptionAmount();
    if (currentNum <= 2) return console.log("cant remove more options");

    const option = document.getElementById(`option_${currentNum}`);
    if (option) option.remove();

    /* restore old values when add */
    const values=[];
    for (let i = 0; i < currentNum-1; i++) {
        const option = getOption(i+1);
        if (option) values.push({value: option, num: i+1});
    }

    const questionTitle = document.getElementById('pollCreateTitle')?.value;

    // document.getElementById("options").innerHTML += addOption(currentNum+1)
    for (let i = 0; i < values.length; i++) {
        const optionData = values[i];
        document.getElementById(`poll_option_${optionData.num}`).value = optionData.value;
    }
    document.getElementById('pollCreateTitle').value = questionTitle;
    
    document.getElementById(`poll_option_${currentNum-1}`).focus();
    return;
}

function addExtraOption() {
    if (debug) console.log("adding option")
    const currentNum = checkPollOptionAmount();
    if (currentNum >= 10) {
        if (document.getElementById("cantAddMoreOptions")) return console.log("cant add more options")
        return document.getElementById("options").innerHTML += '<p id="cantAddMoreOptions">cant create more than 10 options</p>';
    }

    /* restore old values when add */
    const values=[];
    for (let i = 0; i < currentNum; i++) {
        const option = getOption(i+1);
        if (option) values.push({value: option, num: i+1});
    }
    const questionTitle = document.getElementById('pollCreateTitle')?.value;

    document.getElementById("options").innerHTML += addOption(currentNum+1)
    for (let i = 0; i < values.length; i++) {
        const optionData = values[i];
        document.getElementById(`poll_option_${optionData.num}`).value = optionData.value;
    }
    document.getElementById('pollCreateTitle').value = questionTitle;
    
    document.getElementById(`poll_option_${currentNum+1}`).focus();
    return
};

function addOption(num) {
    const amount = num || checkPollOptionAmount()+1;
    return `
        <div class="pollOption" id="option_${num}">
            <p><u>Option ${amount}</u></p>
            <input type="text" class="addPollOption" id="poll_option_${num}" placeholder="Option ${amount}">
        </div>
    `;
}

function getOption(num) {
    const foundOption = document.getElementById(`poll_option_${num}`)?.value;
    if (foundOption) return foundOption;
    else return false;
}

/*
// BASE FOR CREATING POSTS (posts when you press create post)
async function createPost() {
    const data = { 
        "userID" : currentUserLogin.userid, 
        "content" : document.getElementById('newPostTextArea').value
    };

    
    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    const response = await fetch(`${apiURL}/post/createPost`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    if (debug) console.log(response.json())

    document.getElementById("mainFeed").innerHTML = `
        <h1>Your post was sent!</h1>
    `
}
*/

// PUBLISH WRITTEN POST
async function createPost(params) {
    if (debug) console.log(params)
  //   var input = document.getElementById('postBarArea').value;
    var input = document.getElementById('newPostTextArea').value
    if (debug) console.log(input)

    var isFromPostPage = false;
    if (document.getElementById('postPageDiv')) isFromPostPage = true;
    if (debug) console.log("isFromPostPage: " + isFromPostPage)

    var quoted 
    if (params?.quoteID) quoted = params.quoteID
    else quoted=undefined

    var replied
    if (params?.replyID) replied = params.replyID
    else replied=undefined

    // var 
    var pollID
    if (params?.pollID) pollID = params.pollID
    else {
        const pollELe = document.getElementById('pollCreateLink')
        if (pollELe) pollID = pollELe.value
        else pollID = undefined
    }

    if (debug) console.log(pollID)
    // console.log(pollID)

    const data = { 
        "userID" : currentUserLogin.userID, 
        "content" : input,
        "quoteReplyPostID" : quoted,
        "replyingPostID" : replied,
        "linkedPollID" : pollID || null
    };

    if (isFromPostPage) leavePostPage()
    else closeModal();

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    changeHeader('')

    const response = await fetch(`${apiURL}/post/createPost`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    const postData = await response.json()
    if (debug) console.log(postData)

    if (!response.ok)  return showModal(`<h1>something went wrong.</h1> <p>${postData.code}\n${postData.msg}</p>`)
    
    const userData = await getUserDataSimple(postData.userID)

    /* add to top */
    const newEle = `${postElementCreate({post: postData, user: userData })}`;

    showModal(`<h1>Your post was sent!</h1> <p>${postData.content}</p>`)

    const topEle = document.getElementById("addToTop")
    if (!topEle || !newEle ) return;

    topEle.innerHTML = newEle + topEle.innerHTML

}

// BLANK FUNCTION FOR LATER BUTTONS TO LIKE / REPLY / REPOST
function blankFunction(action) {
  console.log(`a dummy ${action} was requested`)
}

function removeEditUser() {
    document.getElementById("mainFeed").innerHTML = ``
    document.getElementById("resultEditUsername").innerHTML = ``
}

function editUser() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="username">
            <input id="newUsername"></input>
            <div id="resultEditUsername"></div>
            <button class="buttonStyled" onclick=renameUsername()>Edit Username</button>
        </div>
    `
}

// EDIT DISPLAY NAME
async function renameUsername() {
    const newUsername = document.getElementById('newUsername').value;
    // editUsernameFrontend
    if (!newUsername) {
        document.getElementById("resultEditUsername").innerHTML = `
            <p>You did not enter a new username</p>
        `
    }
    else {
        const data = {
            userID: currentUserLogin.userID,
            newUsername
        }   
    
        const response = await fetch(`${apiURL}/put/editUsername`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });

        const newData = await response.json()
    
        document.getElementById("resultEditUsername").innerHTML = `
            <p>Changed username! from ${newData.before.username} to ${newData.new.username}</p>
        `
    }
}

function getId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : undefined;
}
    
function checkForImage(content) {
    const imageFormats = ['.jpg', '.png','.jpeg', '.svg', '.gif']
    const videoFormats = [{'urlEnd': '.mp4', "type": 'mp4'}, {'urlEnd':'.mov','type':'mp4'}, {'urlEnd':'.ogg', 'type': 'ogg'}]

    const contentArgs = content.split(/[ ]+/)
    var foundImage = false

    var attachments = []
    for (index = 0; index < contentArgs.length; index++) {
        if (contentArgs[index].startsWith('https://')) {
            for (const imageFormat of imageFormats) {
                if (contentArgs[index].endsWith(imageFormat)) {
                    foundImage = true
                   // contentArgs[index] = `<img class="messageImage" src="${contentArgs[index]}"></img>`
                    attachments.push(`<img alt="userImage" class="messageImage" width="100px" src="${contentArgs[index]}"></img>`)
                }
            }

            for (const videoFormat of videoFormats) {
                if (contentArgs[index].endsWith(videoFormat.urlEnd)) {
                    foundImage = true
                    //contentArgs[index] = `\n<video width="320" height="240" controls><source src="${contentArgs[index]}" type="video/${videoFormat.type}"></video>`
                    attachments.push(`<video alt="uservideo" width="320" height="240" controls><source src="${contentArgs[index]}" type="video/${videoFormat.type}"></video>`)
                }
            }
            const videoId = getId(contentArgs[index]);

            if (videoId) {
                foundImage = true
                const iframeMarkup = `<iframe title="uservideo" width="320" height="240" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
               // contentArgs[index] = iframeMarkup
                attachments.push(iframeMarkup)
            }

            if (contentArgs[index].startsWith("https://huelet.net/w/")) {
                foundImage = true

                const URL = contentArgs[index]
                var videoID = URL.replace("https://huelet.net/w/", "")

                const iframeHuelet = `<iframe src="https://publish.huelet.net/?embed=true&vuid=${videoID}" width="320" height="240" frameborder="0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen="true"></iframe>`
                attachments.push(iframeHuelet)
            }
        }
    }

    return {"image" : foundImage, "content": contentArgs.join(" "), attachments}
}