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
*/

// URL VARIBLES
var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
var pathArray = window.location.pathname.split( '/' );
var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`
var hostedUrl = `${config ? `${config.current == "prod" ? config.prod.hosted_url : config.dev.hosted_url}` : 'https://interact.novapro.net/' }`
// var params = new URLSearchParams(window.location.search)
var prevIndexID = 0;
var followingFollowerData = {
    userID: null,
    prevIndexID: null,
    userData: null,
    currentlyBuilding: false,
    type: 0
}

// API HEADERS
var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}

// VARIBLES
var currentUserLogin = { }
var currentPage
var searching
var currentFeed 
var currentFeedType
var mobileClient = checkifMobile();
var followingFollowerListStore = []
var userData = {
    userProfile: null,
    userUpdates: null,
}
// LOCAL STORAGE
var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var LOCAL_STORAGE_LOGINS='social.loginAccounts'
var LOCAL_STORAGE_THEME_SETTINGS = 'social.themeSettings'
var LOCAL_STORAGE_THEME_POSSIBLE = 'social.themePossible'
var buildingFeed = true;

var articleComponentsStore = []
var articleComponentsEditor = []
var articleComponentsEditorIndex = 0
// let loginUserToken = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
const fakeArticleData = { title: 'this will be a test', topic: 'Test Topic', components: [{  type: { id: 0, order: 0, name: 'Header', description: 'Add a header to your article.', placeholder: 'New Header...'}, value: 'this is a article', options: { 'font_size': { dbName: 'font_size', value: '12' }, alignment: { dbName: 'alignment', value: 'center' }, 'padding_bottom': { dbName: 'padding_bottom', value: '4' }, indent: { dbName: 'indent', value: '4' } } }, { type: { id: 1, order: 1, name: 'Sub header', description: 'Add a sub header to your article.', placeholder: 'New Subheader...' }, value: 'I will use this as a test data lol', options: { 'font_size': { dbName: 'font_size', value: '12' }, alignment: { dbName: 'alignment', value: 'center' }, 'padding_bottom': { dbName: 'padding_bottom', value: '4' }, indent: { dbName: 'indent', value: '4' } } }, { type: { id: 2, order: 2, name: 'Paragraph', description: 'Add a compontent of text like a paragraph to your article.', placeholder: 'New Paragraph...' }, value: 'this data will be saved as articleData on the frontend to provide to the backend for me to send mtulple times ', options: { 'font_size': { dbName: 'font_size', value: '12' }, alignment: { dbName: 'alignment', value: 'center' }, 'padding_bottom': { dbName: 'padding_bottom', value: '4' }, indent: { dbName: 'indent', value: '4' } } } ]}

function checkifMobile() {
    const width = document.getElementById("html").clientWidth
    if (width < 900) {
        return true;
    } else {
        return false;
    }
}

// makes sure url is as expected
if (location.protocol !== 'https:' && !((/localhost|(127|192\.168|10)\.(\d{1,3}\.?){2,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3}\.?){2}/).test(location.hostname))) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
} else {
    if (!('fetch' in window)) {
        if (debug) console.log('Fetch API not found, please upgrade your browser.');
        showModal(`Please upgrade your browser to use Interact!`)
    } else checkLogin()
}

// CHANGES URL OF BROWSER
function changeHeader(newLink) {
    let stateObj = { id: "100" };
    window.history.replaceState(stateObj, "Socket", "/" + newLink);
}

// parameter checks
async function checkURLParams() {
    var params = new URLSearchParams(window.location.search)
    var paramsInfo = {
        paramsFound: false
    }

    const ifUsername = params.has('username')
    const ifPostID = params.has("postID")
    const ifSearch = params.has("search")
    const ifPostPage = params.has("posting");
    const ifUserEdit = params.has("userEdit");
    const ifSettings = params.has("settings");
    const ifEmailSettings = params.has("emailSettings");
    const ifThemeSettings = params.has("themeEditor");
    const ifThemeDiscovery = params.has("themeDiscovery")
    const ifCreateArticle = params.has("createArticle")

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
        // console.log(searchSearching)
        searchResult(searchSearching)
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
    } else if (ifThemeSettings) {
        paramsFound = true
        paramsInfo.paramsFound = true

        settingsPage();
        editThemePanel(headers.userid);
        document.getElementById("themeEditor").scrollIntoView();
    } else if (ifThemeDiscovery) {
        paramsFound = true
        paramsInfo.paramsFound = true

        settingsPage();
        await viewThemesDiscovery()
        document.getElementById("themeDiscovery").scrollIntoView();
    } else if (ifCreateArticle) {
        paramsFound = true
        paramsInfo.paramsFound = true

        createArticlePage()
    }
   
    return paramsInfo
}

function postElementCreate({
    post,
    user,
    type, hideParent,
    hideReplies,
    pollData,
    voteData,
    quoteData,
    coposterData,
    tagData,
    extraData
}) {
    if (!post) return;
    if (post.deleted) {
        const ele = `
            <div class="postContent posts-style" id="postContentArea_${post._id}">
                <div class="textAreaPost posts_content-style">
                    <p id="postContent_${post._id}">Post was deleted.</p>
                </div>
            </div>
        `;

        return ele;
    }

    if (!extraData) extraData = { }
    var timesince
    if (post.timePosted) timesince = checkDate(post.timePosted)
    const imageContent = checkForImage(post.content, tagData)
    const owner = post.userID == currentUserLogin.userID ? true : false;

    const options = {
        hideParent : hideParent ? true : false, 
        hideReplies : hideReplies ? true : false,
        owner: owner,
    }
    
    const timeSinceData = getTimeSince(post.timePosted);

    // imageContent.attachments
    if (imageContent.imageFound) if (debug) console.log(imageContent.attachments)

    if (type=="basic"){
        return `
            ${user ? `
            <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser-style" : "otherUser-style"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}${user.verified ? ' ✔️ ' : ''}` : '>Unknown User'} | ${timesince} | ${timeSinceData.sinceOrUntil == "current" ? "just posted" : `${timeSinceData.sinceOrUntil == "since" ? timeSinceData.value + " ago" : timeSinceData.value}`}</p>
            `:''}
            <div class="postContent posts-style" id="postContentArea_${post._id}">
                <div class="textAreaPost posts_content-style">
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
            <div class="publicPost posts-style areaPost" id="postdiv_${post._id}">
                ${!hideParent==true && post.isReply ? `
                    ${ post.replyData ? `
                        <p onclick="viewParentPost('${post._id}', '${post.replyData.postID}')" id="parentViewing_${post._id}">This was a reply, click here to see.</p>
                    ` : ``}
                `: ``}
                <div>
                    <p><span class="pointerCursor ${ user && (post.userID == currentUserLogin.userID )? "ownUser-style" : "otherUser-style"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}${user.verified ? ' ✔️' : ''}` : '>Unknown User'}</span>
                    ${coposterData && coposterData[0] ? `${coposterData.map(function(coposter) {
                        return `, <span class="spacer_2px pointerCursor ${ coposter._id == currentUserLogin.userID ? "ownUser-style" : "otherUser-style"}" ${coposter ? ` onclick="userHtml('${coposter._id}')"> ${coposter.displayName} @${coposter.username}${coposter.verified ? ' ✔️ ' : ''}` : '>Unknown User'}</span>`
                    }).join(" ")}`:``}
                    </p>
                    <p class="spacer_2px pointerCursor ${ user && (post.userID == currentUserLogin.userID )? "ownUser-style" : "otherUser-style"}">${timesince} | ${timeSinceData.sinceOrUntil == "current" ? "just posted" : `${timeSinceData.sinceOrUntil == "since" ? timeSinceData.value + " ago" : timeSinceData.value}`}</p>
                </div>
                <div class="postContent" id="postContentArea_${post._id}">
                    <div class="textAreaPost posts_content-style">
                        <p id="postContent_${post._id}">${imageContent.content}</p>
                        ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                    </div>
                    ${post.replyingPostID ? `<a class="replyingPost" href="#postElement_${post.replyingPostID}">Press here</a>` : ``}
                    ${quoteData && quoteData.quotePost ? `<hr><div>${postElementCreate({post: quoteData.quotePost, user: quoteData.quoteUser, type: "basic"})}</div>` : ''}
                    <div class="PostAttachments">
                        ${imageContent.image ? `<div>${imageContent.attachments.map(function(attachment) {return `${attachment}`}).join(" ")}</div>`:''}
                    </div>
                </div>
                ${post.pollID ? `
                    <div class="poll_option posts-style" id="pollContainer_${post._id}">
                    ${pollData ? `
                        ${pollElement(post._id, post.pollID, pollData, voteData)}
                    `: ``}
                    </div>
                ` : `` }
                <div class="debug">
                    <p onclick="copyToClipboard('${post._id}')">postID: ${post._id}</p>
                    <p onclick="copyToClipboard('${post.userID}')">userID: ${post.userID}</p>
                    ${post.indexID ? `<p onclick="copyToClipboard('${post.indexID}')">indexID: ${post.indexID}</p>` : `` }

                    ${coposterData && coposterData[0] ? `${coposterData.map(function(coposter) {
                        return ` <p onclick="copyToClipboard('${coposter._id}')">coposter ${coposter.username}: ${coposter._id}</p>`
                    }).join(" ")}`:``}
                    ${post.pollID ? `<p onclick="copyToClipboard('${post.pollID}')">pollID: ${post.pollID}</p>` : `` }
                </div>
                <div class="actionOptions pointerCursor no-select"> 
                    <p onclick="likePost('${post._id}')" class="${extraData.liked == true ? 'ownUser-style likedColour':'posts_action-style'}" id="likePost_${post._id}">${styleLikedButton(extraData.liked, post.totalLikes ?? 0)}</p>
                    <p onclick="replyPost('${post._id}')" class="posts_action-style">${styleReplyButton(post.totalReplies)}</p>
                    <p onclick="quotePost('${post._id}')" class="posts_action-style">${styleQuoteButton(post.totalQuotes)}</p>
                    ${!mobileClient ? `
                        ${post.userID == currentUserLogin.userID ? `
                            <p onclick="deletePost('${post._id}')" class="posts_action-style">${styleDeleteButton()}</p>
                            <p id='editButton_${post._id}'>
                                <span onclick="editPost('${post._id}', '${post.edited}')" class="posts_action-style">${styleEditButton()}</span>
                            </p>
                        ` : ''}
                    ` : ''}
                    <p id="popupactions_${post._id}" class="posts_action-style" onclick="popupActions('${post._id}', '${post.userID}', '${options.hideParent}', '${options.hideReplies}', ${owner}, ${extraData.pinned}, ${extraData.saved}, ${extraData.followed})">${styleActionButton()}</p>
                </div>
            </div>
        </div>
    `

    if (post.pollID && !pollData) {
        // handle poll no data
    }

    return element;
}

function styleLikedButton(liked, totalLikes) {
    var returnElement = `<span>`;
    if (totalLikes) returnElement+=`<span>${totalLikes}</span>`

    if (!liked) returnElement+=`<span class="material-symbols-outlined">heart_plus</span>`
    else returnElement+=`<span class="material-symbols-outlined">heart_minus</span>`

    return returnElement + `</span>`
}

function styleReplyButton(totalReplies) {
    var returnElement = `<span>`;
    if (totalReplies) returnElement+=`<span>${totalReplies}</span>`
    returnElement+=`<span class="material-symbols-outlined">reply</span>`
    return returnElement + `</span>`
}

function styleQuoteButton(totalQuotes) {
    var returnElement = `<span>`;
    if (totalQuotes) returnElement+=`<span>${totalQuotes}</span>`
    returnElement+=`<span class="material-symbols-outlined">format_quote</span>`
    return returnElement + `</span>`
}

function styleEditButton(cancel) {
    if (!cancel) return `<span class="material-symbols-outlined">edit</span>`
    else return `<span class="material-symbols-outlined">close</span>`
}

function styleActionButton(active) {
    if (!active) return `<span class="material-symbols-outlined">expand_more</span>`
    else return `<span class="material-symbols-outlined">expand_less</span>`
}

function styleDeleteButton() {
    return `<span class="material-symbols-outlined">delete</span>`
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

async function popupActions(postID, userID, hideParent, hideReplies, owner, pinned=false, saved=false, followed=false) {
    var elementPopup = document.getElementById(`popupOpen_${postID}`);
    if (elementPopup) {
        document.getElementById(`popupactions_${postID}`).innerHTML = styleActionButton(false)
        return elementPopup.remove();
    } else {
        document.getElementById(`popupactions_${postID}`).innerHTML = styleActionButton(true)
    }

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="popupOpen_${postID}" class="publicPost posts-style no-select" style="position: element(#popupactions_${postID});">
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
            <p class="pointerCursor" onclick="${pinned===true ? `unpinPost('${postID}')` : `pinPost('${postID}')` }" id="pin_post_${postID}">${pinned===true ? `Unpin from Profile` : `Pin to Profile` }</p>
            <p class="pointerCursor" onclick="${saved===true ? `unsaveBookmark('${postID}')` : `saveBookmark('${postID}')`}" id="saveBookmark_${postID}">${saved===true ? `Remove from Bookmarks`:`Save to Bookmarks`}</p>
            <p class="pointerCursor" id="followUser_${postID}" onclick=
            ${owner ? `` : `${followed===true ? 
                `"unFollowUser('${userID}', 'followUser_${postID}')">Unfollow User` :
                `"followUser('${userID}', 'followUser_${postID}')">Follow User`
            }</p>`}
            <p class="pointerCursor" onclick="copyPostLink('${postID}')" id="post_copy_${postID}">Copy Post Link</p>
            <p class="pointerCursor" onclick="showEditHistory('${postID}')" id="editHistory_${postID}">Check Edit History</p>
            <p class="pointerCursor" onclick="showLikes('${postID}')" id="likedBy_${postID}">Check Who Liked</p>
            ${hideReplies != true ? `<p class="pointerCursor" onclick="viewReplies('${postID}')" id="replies_${postID}">Check Replies</p>` : ``}
            ${hideReplies != true ? `<p class="pointerCursor" onclick="viewQuotes('${postID}')" id="quotes_${postID}">Check Quotes</p>` : ``}
        </div>
    `;
};

function copyPostLink(postID) {
    const postLink = `${hostedUrl}?postID=${postID}`
    copyToClipboard(postLink)
    document.getElementById(`post_copy_${postID}`).innerText = "Copied Link!"
}

async function pinPost(postID) {
    const req = await sendRequest(`/users/edit/pins/${postID}`, { method: 'POST' });
    if (req.error) return

    showModal(`<p>Success!</p>`)
    
}

async function unpinPost(postID) {
    const req = await sendRequest(`/users/edit/pins/${postID}`, { method: 'DELETE' });
    if (req.error) return

    showModal(`<p>Success!</p>`)
}

async function unpinAllPosts() {
    const req = await sendRequest(`/users/edit/pins/removeAll`, { method: 'DELETE' });
    if (req.error) return

    showModal(`<p>Success!</p>`)
}

async function followingFollowerList(userID, type=0, indexID=null) {
    const res = await sendRequest(`/users/${type==0 ? "following" : "followers"}/${userID}${indexID ? `/${indexID}`:``}`, { method: "GET" });
    if (res.error) return;

    return res; 
}

async function followUser(userID, eleIdChange) {
    const res = await sendRequest(`/users/follow/${userID}`, { method: "POST" });
    if (res.error) return;

    if (eleIdChange) {
        document.getElementById(eleIdChange).innerText="Unfollow User";
        document.getElementById(eleIdChange).onclick = () => unFollowUser(userID, eleIdChange);
    } else {
        showModal(`<p>Unfollowed User!</p>`);
    }
}

async function unFollowUser(userID, eleIdChange) {
    const res = await sendRequest(`/users/unfollow/${userID}`, { method: "DELETE" });
    if (res.error) return;

    if (eleIdChange) {
        document.getElementById(eleIdChange).innerText="Follow User";
        document.getElementById(eleIdChange).onclick = () => followUser(userID, eleIdChange);
    } else {
        showModal(`<p>Unfollowed User!</p>`);
    }
}

async function viewParentPost(postID, parentPostID) {
    if (document.getElementById(`openedParent_${postID}`)) {
        document.getElementById(`parentViewing_${postID}`).innerText = "This was a reply, click here to see.";
        return document.getElementById(`openedParent_${postID}`).remove();
    }

    const postData = await sendRequest(`/posts/get/${parentPostID}`, { method: "GET" });

    if (postData.deleted == true || !postData.userID) {
        //document.getElementById()
        document.getElementById(`parent_${postID}`).innerHTML = `
            <div class="posts-style publicPost areaPost" id="openedParent_${postID}">
                <div class="publicPost areaPost posts-style">
                    <p>Parent post has been deleted.</p>
                </div>
            </div>
        `;
        document.getElementById(`parentViewing_${postID}`).innerText = "Close parent post.";

        return;
    }

    const userData = await sendRequest(`/users/get/basic/${postData.userID}`, { method: 'GET', });
   
    const postEle = postElementCreate({post: postData, user: userData});
    document.getElementById(`parent_${postID}`).innerHTML = `
        <div class="publicPost areaPost posts-style" id="openedParent_${postID}">${postEle}</div>
    `;
    document.getElementById(`parentViewing_${postID}`).innerText = "Close parent post.";

}

async function viewQuotes(postID) {
    if (document.getElementById(`quotesOpened_${postID}`)) {
        document.getElementById(`quotes_${postID}`).innerText = "Check Quotes";
        return document.getElementById(`quotesOpened_${postID}`).remove();
    }

    const quoteData = await sendRequest(`/posts/quotes/${postID}`, { method: 'GET', });
    if (quoteData.error) {
        document.getElementById(`postElement_${postID}`).innerHTML+=`
            <div id="quotesOpened_${postID}" class="publicPost posts-style" style="position: element(#popupactions_${postID});">
                <p>Quotes</p>
                <p>---</p>
                There are no quotes yet on this post.
            </div>
        `;
        if (debug) console.log("no quotes")
        return ;
    }

    var ele = ``;
    for (const quote of quoteData.quotes) {
        const userData = await sendRequest(`/users/get/basic/${quote.userID}`, { method: 'GET' });
        ele+=postElementCreate({post: quote, user: userData, hideParent: true });
    }

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="quotesOpened_${postID}" class="publicPost posts-style" style="position: element(#popupactions_${postID});">
            <p>Quotes</p>
            <p>---</p>
            ${ele}
        </div>
    `;

    document.getElementById(`quotes_${postID}`).innerText = "Close Quotes";
}

// async function 
async function viewReplies(postID) {
    if (document.getElementById(`repliesOpened_${postID}`)) {
        document.getElementById(`replies_${postID}`).innerText = "Check replies";

        return document.getElementById(`repliesOpened_${postID}`).remove();
    }

    const replyData = await sendRequest(`/posts/replies/${postID}`, { method: 'GET', });
    if (replyData.error) {
        document.getElementById(`postElement_${postID}`).innerHTML+=`
            <div id="repliesOpened_${postID}" class="publicPost posts-style" style="position: element(#popupactions_${postID});">
                <p>Replies</p>
                <p>---</p>
                There are no replies yet on this post.
            </div>
        `;
        if (debug) console.log("no replies")
        return ;
    }

    var ele = ``;
    for (const reply of replyData.replies) {
        const userData = await sendRequest(`/users/get/basic/${reply.userID}`, { method: 'GET' });
        ele+=postElementCreate({post: reply, user: userData, hideParent: true });
    }

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="repliesOpened_${postID}" class="publicPost posts-style" style="position: element(#popupactions_${postID});">
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
    const res = await sendRequest(`/posts/save/`, { method: 'POST', body });
    if (res.error) return document.getElementById(`saveBookmark_${postID}`).innerText = `Error: ${res.error}`;
    document.getElementById(`saveBookmark_${postID}`).innerText="Saved"
}

async function unsaveBookmark(postID, list, where) {
    const body = {
        postID,
        listname: list ? list : "main"
    }
    const res = await sendRequest(`/posts/unsave/`, { method: 'DELETE', body });
    if (res.error) return document.getElementById(`saveBookmark_${postID}`).innerText = `Error: ${res.error}`;
    if (!where) document.getElementById(`saveBookmark_${postID}`).innerText="Unsaved"
    if (where == "bookmarks") document.getElementById(`bookmarkView_${postID}`).remove()
}

async function showLikes(postID) {
    const likedBy = await sendRequest(`/posts/likes/${postID}`, { method: 'GET' });
    if (!likedBy || !likedBy.peopleLiked) return document.getElementById(`likedBy_${postID}`).innerHTML = `Could not find any people who liked the post.`;

    var newElement = `<p>Liked By:</p>`;
    for (const people of likedBy.peopleLiked) {
        newElement+=`<p onclick="userHtml('${people.userID}')">${people.username}</p>`
    };

    document.getElementById(`likedBy_${postID}`).innerHTML=newElement;
}

async function showEditHistory(postID) {
    const editData = await sendRequest(`/posts/edits/${postID}`, { method: 'GET' });
    if (!editData || !editData.edits) return document.getElementById(`editHistory_${postID}`).innerHTML = `Could not find any edits.`;

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

function pollElement(postID, pollID, pollData, voteData) {
    if (!pollData || !pollData.pollOptions) return;
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
                        <div id="pollOption_${postID}_${option._id}" class="pollOption posts-style">
                            <div id="poll_option_${pollData._id}_${option._id}" class="poll_option ${voteData?.pollOptionID == option._id ? "voted" : ""}" onclick="voteOption('${pollID}', '${option._id}')">
                                <p>${option.optionTitle}</p>
                            </div>
                            <div class="debug">
                                <p onclick="copyToClipboard('${option._id}')">optionID: ${option._id}</p>
                                <p onclick="copyToClipboard('${option.currentIndexID}')">indexID: ${option.currentIndexID || "unknown"}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <p>Total votes: ${totalVotes} | ${timesinceData.sinceOrUntil=="current" ? "ended just now" : `${timesinceData.sinceOrUntil=="since" ? ` ended ${timesinceData.value} ago` : `${timesinceData.value} time left`}`} </p>
        </div>
    `;
}

async function removeVote(pollID, optionID) {
    if (!pollID || !optionID) return alert("Error while removing vote");

    const body = {
        pollID,
        pollOptionID: optionID
    }
    
    const res = await sendRequest(`/polls/removeVote`, {
        method: 'PUT',
        body: body
    });

    if (!res || res.error) return null;
    
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
    
    const res = await sendRequest(`/polls/createVote`, {
        method: 'PUT',
        body
    });

    if (!res || res.error) return null;
    
    if (res.oldVote) removeColorOption(res.oldVote.pollID, res.oldVote.pollOptionID)
    colorizeOption(pollID, optionID)

    if (debug) console.log("Voted!")
}

async function followingFollowerPage(userID, type=0) {
    searching = true
    followingFollowerHtml(userID, type)
    return null;
}

async function userPage(userSearch) {
    searching = true
    userHtml(userSearch)
    return null;
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
        <h1 class="font_h1-style">Create a new Post</h1>
        <div id="postModel">
            <button onclick="createPostPage()" class="menuButton menuButton-style">Open Post Page</button>
            <button onclick="createPost()" class="menuButton menuButton-style">Upload Post</button>
            <button onclick="closeModal()" class="menuButton menuButton-style">Close</button>
        </div>
        <div class="search">
            <input type="text" class="addPollOption menu-style" id="pollCreateLink" placeholder="Link Poll via ID">
        </div>
        <textarea class="postTextArea" id="newPostTextArea"></textarea>
        <div id="foundTaggings"></div>
        </div>
    `, "hide")
}

async function socialTypePost(customInputID, forCoposter=false) {
    // return false; // remove once feature is done
    if (debug) console.log("socialTypePost")
    const content = document.getElementById(customInputID ? customInputID : 'newPostTextArea').value
    const foundTags = await findTag(content)
    if (debug) console.log(foundTags)

    if (foundTags.found == false) {
        if (document.getElementById('taggingsOpened')) {
            document.getElementById('foundTaggings').innerHTML=""
        }
        return false;
    };

    var taggings = ""
    if (debug) console.log("!!")
    if (foundTags.results.users && foundTags.results.users[0]) {
        for (const index of foundTags.results.users) {
            taggings+=`
                <div class="publicPost posts-style" onclick="${forCoposter ? `autoCompleteCoposter('${index.user.username}', '${index.user._id}')`: `autoCompleteUser('${index.user.username}')`}">
                    <p>@${index.user.username}</p>
                    ${index.user.description ? `<p>${index.user.description}</p>` : ``}
                    <p>${index.possibility}% match</p>
                </div>
            `
        }
    } else if (foundTags.results.hashtags && foundTags.results.hashtags[0]) {
        for (const index of foundTags.results.hashtags) {
            taggings+=`
                <div class="publicPost posts-style" onclick="autoCompleteUser('${index.tag}')">
                    <p>${index.tag}</p>
                    <p>${index.possibility}% match</p>
                </div>
            `
        }
    }
    
    if (debug) console.log(foundTags)
    document.getElementById('foundTaggings').innerHTML=`
        <div id="taggingsOpened"></div>
        ${taggings}
    `
}

async function autoCompleteCoposter(username, userID) {
    const content = document.getElementById('coPostersInput').value
    const contentArgs = content.split(" ")

    // replaces with new value
    contentArgs[contentArgs.length-1] = `@${username} `;
    document.getElementById('foundTaggings').innerHTML=""

    document.getElementById('coPostersInput').value = contentArgs.join(" ")
    document.getElementById('coPostersInput').focus()

    document.getElementById('coPostersDiv').innerHTML+=`
        <div class="menu menu-style" id="coposter_${userID}">
            <p>${username}</p>
            <p style="display:none" class="addCoPosterID">${userID}</p>
            <p onclick="removeCoposter('${userID}', '${username}')">Remove</p>
        </div>
    `
}

async function removeCoposter(userID, username) {
    document.getElementById(`coposter_${userID}`).remove()

    const content = document.getElementById('coPostersInput').value
    const contentArgs = content.split(" ")
    const newContentArgs = []

    for (const arg of contentArgs) {
        if (arg != `@${username}`) newContentArgs.push(arg)
    }

    document.getElementById('coPostersInput').value = newContentArgs.join(" ")
    document.getElementById('coPostersInput').focus()
}

async function autoCompleteUser(username) {
    const content = document.getElementById('newPostTextArea').value
    const contentArgs = content.split(" ")

    // replaces with new value
    if (contentArgs[contentArgs.length-1].startsWith("#")) contentArgs[contentArgs.length-1] = `${username} `;
    else contentArgs[contentArgs.length-1] = `@${username} `;
    document.getElementById('foundTaggings').innerHTML=""

    
    document.getElementById('newPostTextArea').value = contentArgs.join(" ")
    document.getElementById('newPostTextArea').focus()
}

async function findUserTag(content) {
    const contentArgs = content.split(/[ ]+/)
    const searchUser = contentArgs[contentArgs.length-1];

    if (searchUser==''||searchUser=="@") return { found: false };
    if (!searchUser.startsWith("@")) return { found: false };
    const res = await sendRequest(`/search/userTag/${searchUser.replace("@", "")}`, { method: 'GET' });
    if (!res || res.error || !res[0]) return { found: false };
    return {found: true, results: res};
}

async function findTag(content) {
    const contentArgs = content.split(/[ ]+/)
    var searchUser = contentArgs[contentArgs.length-1];

    if (!searchUser.startsWith("@") && !searchUser.startsWith("#")) return { found: false, error: "doesnt start with required case" };
    if (searchUser=="@" || searchUser=="#") return { found: false, error: "only includes starting case of search" };
    if (searchUser.startsWith("@")) searchUser = searchUser.replace("@", "0");
    if (searchUser.startsWith("#")) searchUser = searchUser.replace("#", "1");
    const res = await sendRequest(`/search/tags/${searchUser}`, { method: 'GET', ignoreError: true });
    if (!res || res.error) return { found: false };
    return {found: true, results: res};
}

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
function loginSplashScreen() {
    return window.location.href='/begin'
}

// USER PROFILE PAGE
async function profile() {
    checkLogin()
    removeSearchBar()
    searching = true

    userHtml(currentUserLogin.userID)

    currentPage = "profile"
}

function convertEpochToDate(epoch) {
    // ms to mm-dd-yyyy
    const newDate = new Date(epoch).toLocaleDateString()
    return newDate;
}

function convertDateToEpoch(date) {
    const newDate = new Date(date);
    const timezoneOffset = newDate.getTimezoneOffset() * 60000;
    const adjustedDate = newDate.getTime() + timezoneOffset;
    return adjustedDate;
}

async function userEditV2() {
    if (!userData || !userData.userUpdates) return showModal(`<p>Error: No user data found, reopen edit page.</p>`)

    var editBody = {};

    for (const update of userData.userUpdates) {
        var value = document.getElementById(`userEdit_${update.dbName}_text`).value
        console.log(value)

        if (!value || (update.currentValue && update.currentValue == value)) continue;
        if (update.type == "Date") value = convertDateToEpoch(value)

        editBody[update.dbName] = value;
    }

    const newUser = await sendRequest(`/users/update`, {
        method: 'POST',
        body: editBody
    });

    if (!newUser || newUser.error) return console.log(newUser);
    userData.userUpdates = newUser.newData;
    
    if (newUser.fails && newUser.fails[0]) {
        for (const fail of newUser.fails) {
            document.getElementById(`userEdit_update_${fail.field}`).innerText = fail.msg;
        }
    }

    if (newUser.acceptedChanges && newUser.acceptedChanges[0]) {
        for (const accepted of newUser.acceptedChanges) {
            if (accepted.type == "Date") accepted.value = convertEpochToDate(accepted.value)
            document.getElementById(`userEdit_${accepted.field}_text`).value = accepted.value;
            document.getElementById(`userEdit_update_${accepted.field}`).innerText = `Updated to: ${accepted.value}`;
        }
    }
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

    var tempHeaders = {};

    for (const actionData of actions) {
        tempHeaders[`new${actionData.action.toLowerCase()}`] = actionData.value
    }

    const newUser = await sendRequest(`/put/userEdit`, {
        method: 'PUT',
        extraHeaders: tempHeaders
    });

    if (!newUser || newUser.error) return console.log(newUser)

    return showModal("<p>Success! You can now close this page.</p>")
}

async function postHtml(postID) {
    const postData = await sendRequest(`/posts/get/${postID}`, { method: 'GET' })
    if (!postData || postData.deleted) return console.log("error with post");

    const userData = await sendRequest(`/users/get/basic/${postData.userID}`, { method: 'GET' })
    
    const ele = postElementCreate({post: postData, user: userData});
    document.getElementById("mainFeed").innerHTML = ele

    return 
    /*
    | Mother of post  (recursivly)
    |
    | Actual Post (will be main, large)

        scrolls down to actual post, +  half of mother post vieable

        loads one comment index (most recent)
    */
}

async function getFullUserData(userSearch) {
    const profileData = await sendRequest(`/users/get/${userSearch}`, { method: 'GET' })
    
    if (!profileData || profileData.error) return console.log("error with user");
    return profileData;
}

function settingsPage() {
    changeHeader("?settings")

    const ele = `
        <div id="settingsPage">
            <div class="" id="settingsPageContent">
                <div class="menu menu-style">
                    <h1 class="font_h1-style">Settings</h1>
                </div>
                <div class="inline">
                    <div class="menu menu-style">
                        <p>View your profile. As shown to other users.</p>
                        <button class="menuButton menuButton-style" onclick="profile()">View Profile</button>
                        <hr class="rounded">
                        <p>Edit your public profile.</p>
                        <button class="menuButton menuButton-style" onclick="userEditPage()">Edit Profile</button>
                    </div>
                    <div class="menu menu-style">
                        <p><b>Notifications</b></p>
                        <div>
                            <button class="menuButton menuButton-style" id="showNotificationsButton" onclick="showNotifications()">Show Notifications</button>
                            <div id="notificationsDiv"></div>
                        </div>
                        <div>
                            <button class="menuButton menuButton-style" id="showSubscriptionsButton" onclick="showSubscriptions()">Show Subscriptions</button>
                            <div id="subscriptionsDiv"></div>
                        </div>
                    </div>
                    <div class="menu menu-style">
                        <p><b>Bookmarks</b></p>
                        <button class="menuButton menuButton-style" id="showBookmarksButton" onclick="showBookmarks()">Show Bookmarks</button>
                        <div id="bookmarksdiv"></div>
                    </div>
                    <div id="feedSettings" class="menu menu-style">
                        <p><b>Feed</b></p>
                        <button class="menuButton menuButton-style" onclick="changeFeedSettings()">Feed Settings</p>
                    </div>
                    <div id="feedPopup"></div>
                    <div id="searchSetting" class="menu menu-style">
                        <p><b>Search</b></p>
                        <button class="menuButton menuButton-style" onclick="changeSearchSettings()">Search Settings</p>
                    </div>
                    <div id="searchSettingPopup"></div>
                    <div id="themeEditor" class="menu menu-style"><p><b>Client Theme</b></p>
                        <button class="menuButton menuButton-style" onclick='editThemePanel("${headers.userid}")'>Open Editor</button>
                        <button class="menuButton menuButton-style" onclick='createTheme()'>Create Theme</button>
                        <button class="menuButton menuButton-style" onclick='viewThemes("${headers.userid}")'>Existing Themes</button>
                        <button class="menuButton menuButton-style" onclick='unsetThemeFrontend()'>Unset Theme</button>
                        <button class="menuButton menuButton-style" onclick='viewThemesDiscovery()'>Discover Themes</button>
                    </div> 
                    <div id="userThemeEditor"></div>
                    <div class="menu menu-style">
                        <p><b>Privacy</b></p>
                        <button class="menuButton menuButton-style" onclick="openPrivacyPage()">Open Privacy Page</p>
                    </div>
                    <div id="privacyPopup"></div>
                    <div id="emailSettings" class="menu menu-style">
                        <p><b>Email</b></p>
                        <button class="menuButton menuButton-style" onclick="changeEmailPage()">Email Settings</p>
                    </div>
                    <div id="emailPopup"></div>
                    <div class="menu menu-style">
                        <p><b>Password</b></p>
                        <button class="menuButton menuButton-style"  onclick="changePasswordPage()">Change Password</p>
                    </div>
                    <div id="passwordPopup"></div>
                    <div class="menu menu-style">
                        <p><b>User Login</b></p>
                        <p>Sign into another account.</p>
                        <button class="menuButton menuButton-style" onclick="redirectBegin()">Login</button>
                        <hr class="rounded">
                        <p><b>Switch Login</b></p>
                        <p>Switch to another account.</p>
                        <button class="menuButton menuButton-style" onclick="switchAccountPage()">View Accounts</button>
                        <hr class="rounded">
                        <p><b>Sign Out</b></p>
                        <p>Open your sign out options.</p>
                        <button class="menuButton menuButton-style" onclick="signOutPage()">Sign Out</button>
                        <div id="signOutConfirm"></div>
                    </div>
                    <div class="menu menu-style">
                        <p>Delete your account.</p>
                        <button class="menuButton menuButton-style" onclick="deleteAccPage()">Delete Account</button>
                        <div id="deleteAccConfirm"></div>
                    </div>
                    <div class="menu menu-style">
                        <p><b>Other Pages</b></p>
                        <p>These are other pages that are related to interact.</p>
                        <button class="menuButton menuButton-style" onclick="generateRelatedPages()">Show Pages</button>
                        <div id="generateRelatedPages"></div>
                    </div>
                    <div class="menu menu-style">
                        <p><b>DevMode</b></p>
                        <p>Enable / Disable dev mode. This will allow you to see more information about the different elements of Interact.<br><br>
                        To view change live, open inspect element, and run <b>switchNav(3)</b><br><br>
                        You can quickly copy values by pressing the IDs. This will copy the ID to your clipboard.</p>
                        <button class="menuButton menuButton-style" onclick="devModePage()">Dev Mode Settings</button>
                        <div id="devModeConfirm"></div>
                    </div>
                    <div class="menu menu-style">
                        <p><b>Developer</b></p>
                        <p>Access your developer account, and any apps that has access to your account</p>
                        <button class="menuButton menuButton-style" id="showDevOptionsButton" onclick="showDevOptions()">Show Dev Settings</button>
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

function generateRelatedPages() {
    const related = [
        { name: "Analytics", url: "https://interact-analytics.novapro.net" },
        { name: "Interact Info", url: "https://novapro.net/interact/" },
        { name: "Admin Page", url: "/admin/" },
        { name: "Interact Staff", url: "/staff/" },
        { name: "GitHub", url: "https://github.com/social-novapro/" },
        { name: "Nova Productions", url: "https://novapro.net/" },
        { name: "dkravec site", url: "https://dkravec.net/" },
    ];

    var ele = '';

    for (const rel of related) {
        ele+=`
            <button class="userInfo buttonStyled" onclick="relatedPagesSwitch('${rel.url}')">${rel.name}</button>
        `
    }

    document.getElementById("generateRelatedPages").innerHTML=ele;
}

function relatedPagesSwitch(page) {
    window.location.href=page;
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
        <div class="menu menu-stye" id="signOutPage">
            <p><b>Sign Out</b></p>
            <p>Are you sure you want to sign out?</p>
            <button class="menuButton menuButton-style"onclick="signOut()">Sign Out</p>
            <button class="menuButton menuButton-style"onclick="signOutAll()">Sign Out of All Accounts</p>
            <button class="menuButton menuButton-style" onclick="removeSignOutConfirm()">Cancel</button></div>
        </div>
    `;

    document.getElementById("signOutConfirm").innerHTML = ele;
    document.getElementById("signOutPage").classList.add("menu");
    document.getElementById("signOutPage").classList.add("menu-style");
    return true;
}

async function switchAccountPage() {
    const logins = localStorage.getItem(LOCAL_STORAGE_LOGINS)
    if (!logins) return showModal("<p>No other accounts found</p>")
    const loginsParsed = JSON.parse(logins)
    if (!loginsParsed) return showModal("<p>No other accounts found</p>")
    if (!loginsParsed[0]) return showModal("<p>No other accounts found</p>")

    var ele = `
        <div class="menu menu-style" id="switchAccountPage">
            <p><b>Switch Account</b></p>
            <p>Choose an account to switch to</p>
            <div class="inline">
    `;

    for (const login of loginsParsed) {
        const preview = await miniPreviewUser(login.userID)
        ele+=`
            <button class="menuButton menuButton-style" onclick="switchAccount('${login.userID}')">${preview}</button>
        `;
    }
    ele += `</div>`;

    document.getElementById("signOutConfirm").innerHTML = ele;
    document.getElementById("signOutPage").classList.add("menu");
    document.getElementById("signOutPage").classList.add("menu-style");
}

async function miniPreviewUser(userID) {
    const userData = await sendRequest(`/users/get/basic/${userID}`, { method: 'GET' })
    if (!userData || userData.error) return console.log("error with user");
    const ele = `<p>${userData.displayName}@${userData.username}</p>`;
    return ele;
}

async function deleteAccPage() {
    const ele = `
        <div class="" id="deleteAccPage">
            <p><b>Delete Account</b></p>
            <p>Are you sure you want to delete your account?<br>This will send an email and you will need to confirm.</p>
            <div class="signInDiv">
                <form id="userEdit_password_delete" class="contentMessage">
                    <label for="userEdit_email_pass_delete"><p>Password</p></label>
                    <input type="password" id="userEdit_email_pass_delete" class="userEditForm menu-style" placeholder="Password">
                </form>
            </div>
            <button class="menuButton menuButton-style" onclick="requestDeleteAcc()">Delete</button>
            <button class="menuButton menuButton-style" onclick="removeDeleteAccConfirm()">Cancel</button></div>
            <p id="resultDeleteRequest"></p>
        </div>
    `;
    
    document.getElementById("deleteAccConfirm").innerHTML = ele;
    document.getElementById("deleteAccConfirm").classList.add("menu");
    document.getElementById("deleteAccConfirm").classList.add("menu-style");
    document.getElementById("userEdit_password_delete").addEventListener("submit", function (e) { e.preventDefault()})
}

async function requestDeleteAcc() {
    const password = document.getElementById("userEdit_email_pass_delete")?.value;

    const res = await sendRequest(`/users/reqDelete/`, {
        method: 'DELETE',
        body: { password: password }
    });

    if (!res || res.error) {
        document.getElementById("resultDeleteRequest").innerHTML = `<p>Failed ${res.error ? res.msg : "unknown reason"}</p>`
        return false
    } else {
        document.getElementById("resultDeleteRequest").innerHTML = `<p>Success, check your email.</p>`
    }

    return res;
}

function devModePage() {
    const ele = `
        <div class="menu menu-style" id="devModePage">
            <p><b>Dev Mode</b></p>
            <p>Dev Mode is ${debug ? "enabled" : "disabled"}</p>
            <p>Are you sure you want to enter dev mode?</p>
            <button class="menuButton menuButton-style" onclick="switchDevMode()">Dev Mode</button>
            <button class="menuButton menuButton-style" onclick="removeDevModeConfirm()">Cancel</button></div>
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
    await userEditHtmlV2(currentUserLogin.userID);
    return true;
}
async function userEditHtmlV2(userID) {
    if (userID != currentUserLogin.userID) return showModal("<div><p>Sorry, you can't edit this user!</p></div>");
    changeHeader("?userEdit")

    const updateData = await sendRequest(`/users/update/`, { method: 'GET' })
    const profileData = await sendRequest(`/users/get/basic/${userID}`, { method: 'GET' })

    userData.userProfile = profileData
    userData.userUpdates = updateData

    var timesince
    if (profileData.creationTimestamp) timesince = checkDate(profileData.creationTimestamp)

    if (profileData?.displayName) document.title = `${profileData?.displayName} | Interact`

    console.log(updateData)
    var ele = `
        <div class="userEdit">
            <div class="menu menu-style">
                <h1 class="font_h1-style">Edit Profile</h1>
            </div>
            <div class="menu menu-style">
                <p><b>Save any changes made</b></p>
                <button class="menuButton menuButton-style" onclick="userEditV2()">Save</button>
            </div>
    `

    for (const update of updateData) {
        if (update.type=="Date") {
            ele+=`
                <div class="menu menu-style">
                    <p><b>${update.title}</b></p>
                    <p>${update.description}</p>
                    <p id="userEdit_current_${update.dbName}">Current: ${update.currentValue ? convertEpochToDate(update.currentValue) : "No value set"}</p>
                    <p id="userEdit_update_${update.dbName}"></p>
                    <form id="userEdit_${update.dbName}" class="contentMessage" onsubmit="userEditV2()">
                        <input type="date" id="userEdit_${update.dbName}_text" class="userEditForm menu-style" placeholder="${update.currentValue ? convertEpochToDate(update.currentValue) : update.title}" value="${update.currentValue ? convertEpochToDate(update.currentValue) : ""}">
                    </form>
                </div>
            `
            continue;
        }

        ele+=`
            <div class="menu menu-style">
                <p><b>${update.title}</b></p>
                <p>${update.description}</p>
                <p>Current: ${update.currentValue || "No value set"}</p>
                ${update.dbName=="profileURL" && update.currentValue != null? `<img src="${update.currentValue}" class="profileImage">` : ""}
                    <p id="userEdit_update_${update.dbName}"></p>
                    <form id="userEdit_${update.dbName}" class="contentMessage" onsubmit="userEditV2Specific('${update.action}')">
                    <input type="text" id="userEdit_${update.dbName}_text" class="userEditForm menu-style" placeholder="${update.currentValue || update.title}" value="${update.currentValue || ""}">
                </form>
            </div>
        `
    }

    ele+=`
        ${profileData.creationTimestamp ? `  
            <div class="menu menu-style">
                <p><b>Creation</b></p>
                <p>${timesince}</p>
            </div>
        `: `` }
        ${profileData.verified ? `
            <div class="menu menu-style">
                <p>Verified</p>
            </div>
        ` : `
            <div class="menu menu-style">
                <p><b>Verify ✔️</b></p>
                <div class="searchSelect search menu-style">
                    <input id="content_request_verification" class="menu-style" placeholder="Why do you want to verify?">
                </div>
                <button class="menuButton menuButton-style" onclick="requestVerification()">Request</button>
            </div>
        `}
    </div>`

    document.getElementById("mainFeed").innerHTML = ele;

    for (const update of updateData) {
        document.getElementById(`userEdit_${update.dbName}`).addEventListener("submit", function (e) { e.preventDefault()})
    }
}

async function updateProfile(userID) {

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
            <div class="menu menu-style">
                <h1 class="font_h1-style">Edit Profile</h1>
            </div>
            <div class="menu menu-style">
                <p><b>Save any changes made</b></p>
                <button class="menuButton menuButton-style" onclick="userEdit()">Save</button>
            </div>
            <div class="menu menu-style">
                <p><b>Profile Image</b></p>
                ${profileData.userData.profileURL ? `<img src="${profileData.userData.profileURL}" class="profileImage">` : "No image set"}
                <form id="userEdit_profileImage" class="contentMessage" onsubmit="userEdit('profileImage')">
                    <input id="userEdit_profileImage_text" type="text" class="userEditForm menu-style" placeholder="Profile Image URL">
                </form>
            </div>
            <div class="menu menu-style">
                <p><b>Display Name</b></p>
                ${profileData.userData.displayName ? `<p>${profileData.userData.displayName}` : "No display name set"}
                <form id="userEdit_displayName" class="contentMessage" onsubmit="userEdit('displayName')">
                    <input id="userEdit_displayName_text" type="text" class="userEditForm menu-style" placeholder="Display Name">
                </form>
            </div>
            <div class="menu menu-style">
                <p><b>Username</b></p>
                ${profileData.userData.username ? `<p>${profileData.userData.username}` : "No username set"}
                <form id="userEdit_username" class="contentMessage" onsubmit="userEdit('username')">
                    <input type="text" id="userEdit_username_text" class="userEditForm menu-style" placeholder="Username">
                </form>
            </div>
            <div class="menu menu-style">
                <p><b>Status</b></p>
                ${profileData.userData.statusTitle ? `<p>${profileData.userData.statusTitle}` : "No status set"}
                <form id="userEdit_status" class="contentMessage" onsubmit="userEdit('status')">
                    <input type="text" id="userEdit_status_text" class="userEditForm menu-style" placeholder="Status">
                </form> 
            </div>
            <div class="menu menu-style">
                <p><b>Description</b></p>
                ${profileData.userData.description ? `<p>${profileData.userData.description}` : "No description set" }
                <form id="userEdit_description" class="contentMessage" onsubmit="userEdit('description')">
                    <input type="text" id="userEdit_description_text" class="userEditForm menu-style" placeholder="Description">
                </form>
            </div>
            <div class="menu menu-style">
                <p><b>Pronouns</b></p>
                ${profileData.userData.pronouns ? `<p>${profileData.userData.pronouns}` : "No pronouns set"}
                <form id="userEdit_pronouns" class="contentMessage" onsubmit="userEdit('pronouns')">
                    <input type="text" id="userEdit_pronouns_text" class="userEditForm menu-style" placeholder="Pronouns">
                </form>
            </div>
            ${profileData.userData.creationTimestamp ? 
                `  
                    <div class="menu menu-style">
                        <p><b>Creation</b></p>
                        <p>${timesince}</p>
                    </div>
                `: ``
            }
            ${profileData.verified ? 
                `
                    <div class="menu menu-style">
                        <p>Verified</p>
                    </div>
                ` : `
                    <div class="menu menu-style">
                        <p><b>Verify ✔️</b></p>
                        <div class="searchSelect search menu-style">
                            <input id="content_request_verification" class="menu-style" placeholder="Why do you want to verify?">
                        </div>
                        <button class="menuButton menuButton-style" onclick="requestVerification()">Request</button>
                    </div>
                `
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

function escapeHtml(text) {
    return text.replace(/"/g, '&quot;');
}

function unescapeHtml(text) {
    return text.replace(/&quot;/g, '"');
}

async function editThemePanel() {
    const themeSettings = await getTheme(null, true)
    if (!themeSettings || themeSettings.error) return await createTheme();

    await editTheme(themeSettings);

    return true;
}

async function createTheme() {
    var ele = `
        <div class="menu menu-style">
        <p><b>Theme Editor</b></p>
        <p>Change the theme of your profile and experince.</p>
    `;
    
    ele+=`
        <p>There was no theme set</p>
        <p>Would you like to create one?</p>
        <div class="signInDiv">
            <form id="userEdit_themeSettings_create" class="contentMessage">
                <label for="userEdit_themeSettings_create_name"><p>Theme Name</p></label>
                <input type="text" id="userEdit_themeSettings_create_name" class="userEditForm menu-style" placeholder="Theme Name">
                <label for="userEdit_themeSettings_create_privacy">Privacy:</label>
                <select id="userEdit_themeSettings_create_privacy" name="privacy">
                    <option value="1">Public</option>
                    <option value="3">Private</option>
                </select>
                <label for="userEdit_themeSettings_create_fork"><p>Fork existing theme</p></label>
                <input type="text" id="userEdit_themeSettings_create_fork" class="userEditForm menu-style" placeholder="Theme ID">
            </form>
            <button class="menuButton menuButton-style" onclick="createThemeSettings()">Create Theme Settings</button>
        </div>
    `;

    document.getElementById("userThemeEditor").innerHTML = ele
    return true;
}

async function editTheme(themeSettings) {
    if (!themeSettings || themeSettings.error) return await createTheme();
    const possibleThemeEdits = await getPossibleThemeEdits();

    var ele = `
        <div class="menu menu-style">
        <p><b>Theme Editor</b></p>
        <p>Change the theme of your profile and experince.</p>
        <p>Theme Name: ${themeSettings.theme_name}</p>
        <hr class="rounded">
        <p>Created: ${checkDate(themeSettings.timestamp)}</p>
        ${themeSettings.timestamp_edited ? `<p>Last Edited: ${checkDate(themeSettings.timestamp_edited)}</p>` : ``}
        <hr class="rounded">
        <form id="userEdit_themeSettings">
            <div>
                <b><label for="themeSetting_name">Name:<br></label></b>
                <input type="text" id="themeSetting_name" value="${themeSettings.theme_name}"/>
            </div>
            <hr class="rounded">
            <div>
                <b><label for="themeSetting_privacy">Privacy:<br></label></b>
                <select id="themeSetting_privacy" name="privacy">
                    <option value="1" ${themeSettings.privacy ==1 ? 'selected' : ''}>Public</option>
                    <option value="3" ${themeSettings.privacy ==3 ? 'selected' : ''}>Private</option>
                </select>
            </div>
            <hr class="rounded">
            <div>
                <b><label for="themeSetting_locked">Lock Theme:<br></label></b>
                <p>When locked, you will be no longer allowed to edit this version of the theme. You will be still able edit values, then select fork.</p>
                <select id="themeSetting_locked" name="locked">
                    <option value="0" ${!themeSettings.locked ? 'selected' : ''}>Unlocked</option>
                    <option value="1" ${themeSettings.locked === true ? 'selected' : ''}>Lock</option>
                </select>

    `;

    // TEST FOR NULL DATAS
    for (const option of possibleThemeEdits) {
        const currentData = themeSettings.colourTheme ? themeSettings.colourTheme[option.option]? themeSettings.colourTheme[option.option] : '' : ''
        ele+=`
            <hr class="rounded">
            <div>
                <b><label for="themeSetting_${option.option}">${option.name}<br>${option.description}<br></label></b>
                <input type="color" class="menu-style" id="themeSetting_${option.option}_color" value="${currentData}"/>
                <input type="text" class="menu-style" id="themeSetting_${option.option}" value="${currentData}"/>
                <!--<div style="width: 5px; height: 5px; background-color: ${currentData};"></div>-->
            </div>
        `;
    };

    ele += `</form>`
    // submit
    ele += `
        <button 
            class="menuButton menuButton-style" 
            onclick="forkThemeSettings('${themeSettings._id}')"
        >Fork Theme</button>`;

    if (themeSettings.userID == headers.userid && themeSettings.locked !== true) ele +=`
        <button 
            class="menuButton menuButton-style" 
            onclick="submitThemeSettings('${themeSettings._id}')"
        >Submit Edits</button>
        <button 
            class="menuButton menuButton-style" 
            onclick="submitDeleteTheme('${themeSettings._id}')"
        >Delete Theme</button>
    `;
    
    ele+=`</div>`;

    document.getElementById("userThemeEditor").innerHTML = ele;
    document.getElementById("userEdit_themeSettings").addEventListener("submit", function (e) { e.preventDefault()})
    listenChange(possibleThemeEdits);

    return true;
}

async function viewThemesDiscovery() {
    const themes = await getDiscoveryThemes();
    if (!themes) return

    var ele = `
        <div class="menu menu-style">
        <h1 id="themeDiscovery">Theme Discovery</h1>
        <p>Discovery and set themes created by other users.</p>
    `;

    for (const theme of themes.themes) {
        if (!theme || !theme.colourTheme) continue;

        ele += `
            <div class="menu menu-style">
                <p>Theme: <b>${theme.theme_name}</b></p>
                <p>Created: ${checkDate(theme.timestamp)}</p>
                <p>By: ${themes.users[theme.userID].username}</p>
        `
        for (const option in theme.colourTheme) {
            ele += `
                <div class="menu menu-style colour-theme-box" style="background: ${theme.colourTheme[option]};"></div>
            `
        }
        ele +=`
                <button class="menuButton menuButton-style" onclick="selectThemeWithID('${theme._id}')">Set Theme</button>
            </div>
        `;
        
    }

    ele += `</div>`;
    document.getElementById("userThemeEditor").innerHTML = ele;
}

async function viewThemes(userID) {
    const themes = await getThemes(userID);
    if (!themes || themes.error) return showModal(`<p>Error: ${themes.code}, ${themes.msg}</p>`)

    const currentTheme = localStorage.getItem(LOCAL_STORAGE_THEME_SETTINGS)
    const currentThemeParsed = currentTheme ? JSON.parse(currentTheme) : null
    const currentThemeID = currentThemeParsed ? currentThemeParsed._id : null

    var ele = `
        <div class="menu menu-style">
            <p><b>View Themes</b></p>
            <p>View your themes. Press select, to use, and an editor will appear.</p>
            <hr class="rounded">
            <select id="viewThemeSelect" name="theme">
    `;

    var amount=0;
    for (const theme of themes) {
        ele += `<option value="${theme._id}"${theme._id==currentThemeID ? "selected" : ''}>${theme.theme_name}</option>`
        amount++;
    }

    ele += `
            </select>
            <div>   
                <button class="menuButton menuButton-style" onclick="selectTheme(true)">Select Theme</button>
            </div>
        </div>
    `;

    document.getElementById("userThemeEditor").innerHTML = ele;
    return true;
}

async function unsetThemeFrontend() {
    const theme = await unsetThemeAPI();
    if (!theme || theme.error) return showModal(`<p>Error: ${theme.code}, ${theme.msg}</p>`)

    await applyTheme({ });

    showModal(`<p>Success! Your current theme has been unset.</p>`)
}


async function selectTheme(toEdit) {
    const themeID = document.getElementById("viewThemeSelect").value;

    const theme = await setThemeAPI(themeID);
    if (!theme || theme.error) return;

    if (toEdit) await editTheme(theme);
    await applyTheme(theme);

    return true;
}

async function selectThemeWithID(themeID) {
    const theme = await setThemeAPI(themeID);
    if (!theme || theme.error) return;

    await applyTheme(theme);

    return true;
}

function listenChange(possibleThemeEdits) {
    for (const option of possibleThemeEdits) {
        const colorInput = document.getElementById(`themeSetting_${option.option}_color`);
        const textInput = document.getElementById(`themeSetting_${option.option}`);
        
        colorInput.addEventListener('input', function() {
            textInput.value = colorInput.value;
        });
        textInput.addEventListener('input', function() {
            colorInput.value = textInput.value;
        });
    }
}

async function createThemeSettings() {
    const themeName =  document.getElementById("userEdit_themeSettings_create_name").value;
    const privacy =  document.getElementById("userEdit_themeSettings_create_privacy").value;
    const fork =  document.getElementById("userEdit_themeSettings_create_fork").value;

    const res = await sendRequest(`/users/profile/theme/submit/create`, {
        method: 'POST',
        body: {
            name: themeName,
            privacy: privacy,
            fork: fork ? fork : null
        }
    });

    editTheme(res); // rerender
    return res
}

async function getPossibleThemeEdits() {
    const res = await sendRequest(`/users/profile/theme/possible`, { method: 'GET' });
    return res
}

async function unsetThemeAPI() {
    const res = await sendRequest(`/users/profile/theme/unset`, { method: 'DELETE' });
    return res;
}

async function setThemeAPI(themeID) {
    const res = await sendRequest(`/users/profile/theme/set/${themeID}`, { method: 'POST' });
    return res;
}

async function submitDeleteTheme(themeID) {
    const res = await sendRequest(`/users/profile/theme/submit/delete/`, {
        method: 'DELETE',
        body: {themeID}
    });

    return res;
}

async function getTheme(themeID, ignoreError) {
    const res = await sendRequest(`${themeID ? `/users/profile/theme/${themeID}` : `/users/profile/theme/user/`}`, { method: 'GET', ignoreError });
    return res;
}

async function getThemes(userID) {
    const res = await sendRequest(`/users/profile/theme/user/${userID}`, { method: 'GET' });
    return res;
}

async function getDiscoveryThemes() {
    const res = await sendRequest(`/users/profile/theme/themes/`, { method: 'GET' });
    return res;
}

function getThemeChanges(themeID, possibleThemeEdits, ignoreLock) {
    const reqBody = [];

    const changeName = document.getElementById(`themeSetting_name`).value;
    if (changeName) reqBody.push({ option: "name", value: changeName});

    const changePrivacy = document.getElementById(`themeSetting_privacy`).value;
    if (changePrivacy) reqBody.push({ option: "privacy", value: changePrivacy});

    if (!ignoreLock) {
        const changeLock = document.getElementById(`themeSetting_locked`).value;
        console.log(changeLock)
        if (changeLock) reqBody.push({ option: "locked", value: changeLock == 1 ? true : false});
    }

    for (const option of possibleThemeEdits) {
        const themeVal =  document.getElementById(`themeSetting_${option.option}`).value;
        reqBody.push({ option: option.option, value: themeVal});
    }

    return reqBody;
}

async function forkThemeSettings(themeID) {
    const possibleThemeEdits = await getPossibleThemeEdits();
    const reqBody = getThemeChanges(themeID, possibleThemeEdits, true); // get changes

    // forked
    const res = await sendRequest(`/users/profile/theme/fork/${themeID}`, { method: 'POST' });
    if (!res || res.error) return showModal(`<p>Error: ${res.code}, ${res.msg}</p>`);

    const submittedChange = await submitThemeChanges(res._id, reqBody);
    if (!submittedChange || submittedChange.error) return false; // handling done in function

    return showModal(`<p>Success!</p>`);
}

async function submitThemeSettings(themeID) {
    const possibleThemeEdits = await getPossibleThemeEdits();
    const reqBody = getThemeChanges(themeID, possibleThemeEdits);

    const submittedChange = await submitThemeChanges(themeID, reqBody);
    if (!submittedChange || submittedChange.error) return false; // handling done in function

    return showModal(`<p>Success!</p>`);
}   

async function submitThemeChanges(themeID, submitBody) {
    const res = await sendRequest(`/users/profile/theme/submit/${themeID}`, { 
        method: 'PUT',
        body: submitBody
    });

    if (!res) return;

    await applyTheme(res);
    editTheme(res); // rerender edit

    return res;
}

async function applyTheme(theme) {
    const themeSettings = theme.colourTheme;

    setThemeSettings(theme);

    const findSettings = await getPossibleThemeEdits();
    if (findSettings && !findSettings.error) localStorage.setItem(LOCAL_STORAGE_THEME_POSSIBLE, JSON.stringify(findSettings))

    // removes current theme
    unsetTheme()
   
    const style = document.createElement('style');
    style.id="themeStyle"
        
    for (const option of findSettings) {
        const optionName = option.option;
        if (optionName == "_id") continue;
        if (themeSettings && themeSettings[optionName]) style.innerHTML += setTheme(optionName, themeSettings[optionName], option.styles)
        else style.innerHTML += setTheme(optionName, null)
    }

    // applies new theme
    document.head.appendChild(style);

    return true;
}

function setThemeSettings(newData) {
    localStorage.setItem(LOCAL_STORAGE_THEME_SETTINGS, JSON.stringify(newData))
}

function unsetTheme() {
    const rmStyle = document.getElementById('themeStyle');
    if (rmStyle) document.head.removeChild(rmStyle);
    return true;
}

function isHexColor (hex) {
    return typeof hex === 'string'
        && hex.length === 6
        && !isNaN(Number('0x' + hex))
}

function convertRGBToHex(rgb) {
    // Convert RGB to HEX
    const rgbSplit = rgb.split(',');
    const r = parseInt(rgbSplit[0].substring(4));
    const g = parseInt(rgbSplit[1]);
    const b = parseInt(rgbSplit[2].substring(0, rgbSplit[2].length - 1));
    const hex = "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();

    return hex;
}

async function followingFollowerHtml(userID, type=0) {
    followingFollowerData.type=type;
    followingFollowerData.userID=userID;
    // type, 0=following, 1=followers
    const followData = await followingFollowerList(userID, type);
    console.log(followData)
    if (!followData) return; //showModal(`<p>Error: ${userList.code}, ${userList.msg}</p>`);

    if (followData.prevIndexID) followingFollowerData.prevIndexID = followData.prevIndexID;
    if (followData.userData) followingFollowerData.userData = followData.userData;

    document.getElementById("mainFeed").innerHTML =  `
        <div class="menu menu-style">
            <p><b>Profile</b></p>
            <button class="menuButton menuButton-style" onclick="userPage('${userID}')">Profile Page</button>
        </div>

        <div class="menu menu-style">
            <p><b><u>${type == 0 ? "Following" : "Followers"}</u></b></p>
            <div>
                <button class="menuButton menuButton-style" onclick="${type == 1 ? `followingFollowerHtml('${userID}', 0)` : ""}">${followingFollowerData.userData?.followingCount} Following</button>
                <button class="menuButton menuButton-style" onclick="${type == 0 ? `followingFollowerHtml('${userID}', 1)` : ""}">${followingFollowerData.userData?.followerCount} Follower${followingFollowerData.userData?.followerCount ?? 0 == 1 ? "":"s"}</button>
            </div>

        </div>
        <div id="followingFollowerList"></div>
    `;

    /*<div class="menu menu-style">
        <div onclick="userPage('${user._id}')">
            <p><b>${user.displayName}</b></p>
            <p><b>@${user.username}</p>
        </div>
    </div>*/
    
    if (!followData.found || !followData?.data) return document.getElementById("followingFollowerList").innerHTML = `
        <div class="publicPost posts-style">
            <p>No ${type==0 ? "following" : "followers"} found</p>
        </div>
    `;

    followingFollowerListStore = [...followData?.data];

    listFollowingFollower();
}

function listFollowingFollower() {
    followingFollowerData.currentlyBuilding = true;
    var ele = ``;

    for (const data of followingFollowerListStore) {
        const user = data.userData;
        const follow = data.followData;

        var timesince
        if (user.creationTimestamp) timesince = checkDate(user.creationTimestamp)

        var timesinceFollow
        if (follow.timestamp) timesinceFollow = checkDate(follow.timestamp)

        ele += `
            <div class="publicPost posts-style">
                <p class="${user._id == currentUserLogin.userID ? "ownUser-style" : "otherUser-style"}" onclick="userHtml('${user._id}')"> ${user.displayName} @${user.username} | ${user.creationTimestamp ? timesince : '' }</p>
                <p>${user.description ? user.description : "no description"}</p>
                <p>Following: ${user.followingCount} | Followers: ${user.followerCount}</p>
                ${user._id == currentUserLogin.userID ? `` : `
                    <p id="follow_search_id_${user._id}" onclick=
                    ${user.followed===true ? 
                        `"unFollowUser('${user._id}', 'follow_search_id_${user._id}')">Unfollow User` :
                        `"followUser('${user._id}', 'follow_search_id_${user._id}')">Follow User`
                    }</p>
                `}
                <p class="debug" onclick="copyToClipboard('${user._id}')">${user._id}</p>
               ${follow.timestamp ? `<p>Followed: ${timesinceFollow}</p>` : ``}
            </div>
        `;
    }

    ele+=`<div id="addToBottomFollowingFollower"></div>`;
    document.getElementById("followingFollowerList").innerHTML = ele;
    followingFollowerData.currentlyBuilding=false;
}

async function nextFollowingFollowerList() {
    if (!followingFollowerData.prevIndexID) return;
    if (followingFollowerData.currentlyBuilding) return;
    followingFollowerData.currentlyBuilding=true;
    const followData = await followingFollowerList(followingFollowerData.userID, followingFollowerData.type, followingFollowerData.prevIndexID);
    if (!followData) return; //showModal(`<p>Error: ${userList.code}, ${userList.msg}</p>`);

    followingFollowerData.prevIndexID = followData.prevIndexID;
    followingFollowerListStore = [...followingFollowerListStore, ...followData?.data];
    listFollowingFollower();
}

async function userHtml(userSearch) {
    const profileData = await getFullUserData(userSearch)
    if (!profileData) return showModal("<div><p>Sorry, this user does not exist!</p></div>")

    changeHeader('?username='+profileData.userData.username, 'Profile')

    var timesince
    if (profileData.userData.creationTimestamp) timesince = checkDate(profileData.userData.creationTimestamp)

    var clientUser = profileData.userData._id === currentUserLogin.userID ? true : false
    if (profileData?.userData?.displayName) document.title = `${profileData?.userData?.displayName} | Interact`
    
    if (!profileData.postData.error) profileData.postData.reverse()
    if (debug) console.log(profileData)
    if (profileData.userData) followingFollowerData.userData = profileData.userData;


    document.getElementById("mainFeed").innerHTML =  `
        ${clientUser ? `
            <div class="menu menu-style">
                <p><b>Edit Profile</b></p>
                <button class="menuButton menuButton-style" onclick="userEditPage()">Edit Page</button>
            </div>
            `: ""
        }
        ${profileData.userData?.profileURL != null ? 
            `
                <div class="menu menu-style">
                    <p><b>Profile Image</b></p>
                    ${profileData.userData?.profileURL != null ?  `
                        <img class="profileUserHtmlLarge" src="${profileData.userData.profileURL}"></img>
                    ` : ``}
                </div>
            ` : ``
        }
        <div class="menu menu-style">
            <p><b>Follow Data</b><p>
            <button class="menu menu-style" onclick="followingFollowerPage('${profileData.userData._id}', 0)">Following: ${profileData.userData.followingCount}</button>
            <button class="menu menu-style" onclick="followingFollowerPage('${profileData.userData._id}', 1)">Followers: ${profileData.userData.followerCount}</button>
            ${profileData.userData._id == currentUserLogin.userID ? `` : `
                <button class="menu menu-style" id="follow_user_id_${profileData.userData._id}" onclick=
                ${profileData.extraData.followed===true ? 
                    `"unFollowUser('${profileData.userData._id}', 'follow_user_id_${profileData.userData._id}')">Unfollow User` :
                    `"followUser('${profileData.userData._id}', 'follow_user_id_${profileData.userData._id}')">Follow User`
                }</button>
            `}
        </div>
        <div class="menu menu-style">
            <p><b>Notifications</b></p>
            <a id="notificationSub" onclick="subNotifi('${profileData.userData._id}')">Subscribe</a>
        </div>
        <div class="menu menu-style">
            <p><b>Display Name</b></p>
            <p>${profileData.userData.displayName}</p>
        </div>
        <div class="menu menu-style">
            <p><b>Username</b></p>
            <p>${profileData.userData.username}</p>
        </div>
        ${profileData.userData.statusTitle ? 
            `
                <div class="menu menu-style">
                    <p><b>Status</b></p>
                    <p>${profileData.userData.statusTitle}</p>
                </div>
            ` : ``
        }
        <div class="menu menu-style">
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
                <div class="menu menu-style"><p><b>Pronouns</b></p>
                    <p>${profileData.userData.pronouns}</p>
                </div>
            ` : ``
        }
        ${profileData.userData.creationTimestamp ? 
            `  
                <div class="menu menu-style">
                    <p><b>Creation</b></p>
                    <p>${timesince}</p>
                </div>
            `: ``
        }
        <div class="menu menu-style">
            <p><b>Theme</b></p>
            <button class="menuButton menuButton-style" onclick='viewThemes("${profileData.userData._id}")'>View Themes</button>
        </div>
        <div id="userThemeEditor"></div>
        ${profileData.included.badges ? badgeData(profileData.badgeData) : ``}
        ${profileData.included.pins ? `
            <div class="menu menu-style">
                <p><b>Pins</b></p>
                <p>${profileData.userData.pins.length}</p>
                ${clientUser ? `<button class="menuButton menuButton-style" onclick="unpinAllPosts()">Remove All</button>` : ``}
            </div>
            <hr class="rounded">
            ${profileData.pinData.map(function(pin) {
                return postElementCreate({
                    post: pin.postData,
                    user: pin.userData, 
                    pollData: pin.type?.poll=="included" ? pin.pollData : null,
                    voteData: pin.type?.vote=="included" ? pin.voteData : null,
                    quoteData: pin.type?.quote=="included" ? pin.quoteData : null,
                    coposterData: pin.type?.coposter=="included" ? pin.coposterData : null,
                    tagData: pin.type?.tag=="included" ? pin.tagData : null,
                    extraData: pin.type?.extra=="included" ? pin.extraData : {},
                })
            }).join(" ")}
        ` : ``}
        ${!profileData.postData.error ? `
            <div class="menu menu-style">
                <p><b>Posts</b></p>
                <p>${profileData.postData.length}</p>
            </div>
            <hr class="rounded">
            ${profileData.postData.map(function(post) {
                return postElementCreate({
                    post: post.postData, 
                    user: post.userData,
                    pollData: post.type?.poll=="included" ? post.pollData : null,
                    voteData: post.type?.vote=="included" ? post.voteData : null,
                    quoteData: post.type?.quote=="included" ? post.quoteData : null,
                    coposterData: post.type?.copost=="included" ? post.coposterData : null,
                    tagData: post.type?.tag=="included" ? post.tagData : null,
                    extraData: post.type?.extra=="included" ? post.extraData : {},
                })                
            }).join(" ")}
        ` : ``}
    `

    return;
}

function showBadges() {
    document.getElementById("showBadgeArea").style.display = "";
}

function hideBadges() {
    document.getElementById("showBadgeArea").style.display = "none";
}

function switchBadgeDisplay() {
    if (document.getElementById("showBadgeArea").style.display == "none") showBadges()
    else hideBadges()
}

function loadPossibleBadges() {
    if (document.getElementById("possibleBadgesArea").style.display == "none") {
        document.getElementById("possibleBadgesArea").style.display = "";
        renderPossibleBadges()
    }
    else {
        document.getElementById("possibleBadgesArea").style.display = "none";
    }
}
async function renderPossibleBadges() {
    const req = await sendRequest(`/users/badges/`, { method: 'GET' });
    if (!req || req.error) return;
    var ele = "<p><b>Possible Badges</b></p>";
    if (!req || req.length == 0) { 
        ele+=`<p>There were no badges found.</p></div>`;
        return ele;
    }
    for (const badge of req) {
        ele+=badgeEleBasic(badge);
    }

    document.getElementById('possibleBadgesArea').innerHTML=ele;
}

function badgeData(badges) {
    var ele = `
        <div class="menu menu-style">
            <p><b>Badges</b></p>
            <p>Badges are a way to show off your achievements.</p>
            <button class="menuButton menuButton-style" onclick="loadPossibleBadges()">View Possible Badges</button>
    `;

    if (!badges || badges.length == 0) { 
        ele+=`<p>Currently, there are no badges.</p>
        <div id="possibleBadgesArea" style="display: none;"></div>
        </div>`;
        return ele;
    }
    ele+=`<button class="menuButton menuButton-style" onclick="switchBadgeDisplay()">Reveal User Badges</button>`;
    ele+=`<div id="possibleBadgesArea" style="display: none;"></div>`
    ele+=`<div id="showBadgeArea" style="display:none;"><p><b>User Badges</b></p>`
    for (const badge of badges) {
        ele+=badgeEle(badge);
    }
    ele+=`</div></div></div>`;
    return ele;
}

function badgeEle(badge) {
    return `
        <div class="menu menu-style">
            <p><b>${badge.name}</b></p>
            <p>${badge.description}</p>
            <p>Achieved: ${checkDate(badge.achieved)}</p>
            ${badge.latest ? `<p>Latest: ${checkDate(badge.latest)}</p>` : ``}
            ${badge.showCount ? `<p>Count: ${badge.count}</p>` : ``}
            <div>
                <button class="" onclick="revealInfoData('${badge.id}')">Click to Show Extra Info</button>
            </div>
            <div id="extra_data_${badge.id}" style="display:none;">
                <p>Technical Description: ${badge.info.technical_description}</p>
                <p>Shown Date: ${badge.info.date_achieved}</p>
                <p>Version Introduced: v${badge.info.version_introduced}</p>
            </div>
        </div>
    `;
}

function badgeEleBasic(badge) {
    return `
        <div class="menu menu-style">
            <p><b>${badge.name}</b></p>
            <p>${badge.description}</p>
            <p>Technical Description: ${badge.technical_description}</p>
            <p>Shown Date: ${badge.date_achieved}</p>
            <p>Version Introduced: v${badge.version_introduced}</p>
        </div>
    `;
}
function revealInfoData(badgeID) {
    const ele = document.getElementById(`extra_data_${badgeID}`);
    if (ele.style.display == "none") ele.style.display = "";
    else ele.style.display = "none";
}

async function openPrivacyPage(privacyDataFound) {
    var privacyData
    if (!privacyDataFound) {
        privacyData = await sendRequest("/users/privacy/get/", { method: "GET"});
    } else {
        privacyData = privacyDataFound
    }
    if (debug) console.log(privacyData);

    var ele = `
        <div class="menu menu-style">
            <p><b><br>Privacy Settings</b></p>
            <p>This feature is unfinished, and will have a later update for better functionality.</p>
            <p>Currently only privating posts works.</p>
            <hr class="rounded">
        <form id="userEdit_privacySettings">
    `;

    for (const privacy of privacyData) {
        ele+=`
            <div>
            <h3>${privacy.title}</h3>
            <p>${privacy.description}</p>
            <label for="${privacy.title}">Select an option:</label>
            <select id="${privacy.name}">
            `;
            
            for (const option of privacy.options) {
                ele+=`
                <option value="${option.value}"${option.isActive ? ` selected ` : ""}>${option.title}</option>
            `
        }
        ele+=`
        </select>
        <hr class="rounded">
        `
    }

    ele += `
            </form>
            <button class="menuButton menuButton-style" onclick="updatePrivacySettings()">Update Settings</button>
            <div id="completed_change_pass"></div>
        </div>
    `;
    
    document.getElementById("privacyPopup").innerHTML = ele;
    document.getElementById("userEdit_privacySettings").addEventListener("submit", function (e) { e.preventDefault()})

}

async function updatePrivacySettings() {
    const form = document.getElementById("userEdit_privacySettings");
    const selections = form.querySelectorAll("select");
    const changedItems = [];

    for (const selection of selections) {
        if (selection.value) {
            changedItems.push({name: selection.id, value: selection.value});
        }
    }

    const res = await sendRequest(`/users/privacy/set`, {
        method: 'POST',
        body: {
            newSettings: changedItems
        },
    });

    if (!res || res.error) return null;
    openPrivacyPage(res)
}

async function changePasswordPage() {
    const ele = `
        <div class="menu menu-style">
            <p><b>Change Password</b></p>
            <p>Request change password, then check email and update with URL sent.</p>
            <hr class="rounded">
            <form id="userEdit_change_password" class="contentMessage">
                <label for="userEdit_password_old_text"><p>Password</p></label>
                <input type="password" id="userEdit_password_old_text" autocomplete="current-password" class="userEditForm menu-style" placeholder="Password">
            </form>
            <button class="menuButton menuButton-style" onclick="requestChangePassword()">Change Password</button>
            <div id="completed_change_pass"></div>
        </div>
    `

    document.getElementById("passwordPopup").innerHTML = ele;
    document.getElementById("userEdit_change_password").addEventListener("submit", function (e) { e.preventDefault()})
}

async function requestChangePassword() {
    const password = document.getElementById("userEdit_password_old_text")?.value
    if (!password) return showModal("<p>Please enter your current password</p>");

    const res = await sendRequest(`/auth/password/change/`, {
        method: 'POST',
        body: { "password": password }
    });

    if (res.error) return;
     
    document.getElementById("completed_change_pass").innerHTML = `<p>Success, check your email.</p>`
    return showModal(`<p>Success, check your email.</p>`)
}

async function fetchClientEmailData() {
    const res = await sendRequest(`/emails/userData/`, { method: 'GET' });
    return res
}

async function changeFeedSettings() {
    const allowed = await getPossibleFeeds();
    if (!allowed) return alert("Error getting feeds")
    const getPref = await getPrefAPI()
    const currentDefaultOption = allowed.find(allow => allow.name === getPref.preferredFeed);
    const selectedDate = getTimeSince(getPref.timestamp)
    
    var ele = `
        <div class="menu menu-style">
            <p><b>Change your default feed</p></b>
            <hr class="rounded">
            <p>Current default feed is:<br><b>${currentDefaultOption.niceName}</b> selected ${selectedDate.sinceOrUntil == "current" ? "just changed" : `${selectedDate.sinceOrUntil == "since" ? selectedDate.value + " ago" : selectedDate.value}`}
    `;
    for (const feed of allowed) {
        if (!feed.speical) ele += `
        <div class="menu menu-style">
            <p>${feed.description}</p>
            <button class="menuButton menuButton-style ${getPref.preferredFeed==feed.name ? 'activeFeed' : ''}" onclick="changePref('${feed.name}')">${feed.niceName}</button>
        </div>
        `
    }

    ele +="</div>"
    document.getElementById("feedPopup").innerHTML = ele;
}

async function changePref(feedName) {
    const changed = changePrefAPI(feedName);
    if (!changed || changed.error) alert(`An error occurred while changing${changed.error? `: ${changed.msg}`: ""}`);
    await changeFeedSettings();
}

async function getPrefAPI() {
    const data = await sendRequest(`/feeds/preference`, { method: "GET" })
    return data; 
}

async function changePrefAPI(feedName) {
    const data = await sendRequest(`/feeds/preference`, {
        method: "POST",
        body: { setPref: feedName }
    });
    return data; 
}

async function changeSearchSettings() {
    const searchExport = await sendRequest('/search/setting', { method: 'GET' });
    if (!searchExport) return alert("Error getting search settings");
    else renderSearchSettings(searchExport);
}

function renderSearchSettings(searchExport) {
    const currentDefaultOption = searchExport.possibleSearch.find(versions => versions.name === searchExport.currentSearch.preferredSearch);
    const selectedDate = getTimeSince(searchExport.currentSearch.timestamp)
    
    var ele = `
        <div class="menu menu-style">
            <p><b>Change your default search algorithm</p></b>
            <hr class="rounded">
            <p>Current default search is:<br><b>${currentDefaultOption.niceName}</b> selected ${selectedDate.sinceOrUntil == "current" ? "just changed" : `${selectedDate.sinceOrUntil == "since" ? selectedDate.value + " ago" : selectedDate.value}`}
    `;
    for (const searchVersion of searchExport.possibleSearch) {
        ele += `
            <div class="menu menu-style">
                <p>${searchVersion.description}</p>
                <button class="menuButton menuButton-style ${searchExport.currentSearch.preferredSearch==searchVersion.name ? 'activeFeed' : ''}" onclick="changeSearchPref('${searchVersion.name}')">${searchVersion.name} - ${searchVersion.niceName}</button>
            </div>
        `
    }

    ele +="</div>"
    document.getElementById("searchSettingPopup").innerHTML = ele;
}

async function changeSearchPref(searchVersion) {
    const searchExport = await sendRequest('/search/setting', { method: 'POST', body: { newSearch: searchVersion} });
    if (!searchExport || searchExport.error) alert(`An error occurred while changing${changed.error? `: ${changed.msg}`: ""}`);

    renderSearchSettings(searchExport);
}

async function changeEmailPage() {
    const emailData = await fetchClientEmailData();

    const ele = `
        <div class="menu menu-style">
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
                    <input type="email" id="userEdit_email_text" autocomplete="false" autofill="false" class="userEditForm menu-style" placeholder="New Email">
                </form>
                <form id="userEdit_password" class="contentMessage" onsubmit="editEmailRequest()">
                    <label for="userEdit_email_pass"><p>Password</p></label>
                    <input type="password" id="userEdit_email_pass" class="userEditForm menu-style" placeholder="Password">
                </form>
                <button class="menuButton menuButton-style" onclick="editEmailRequest()">Submit Email</button>
                <p id="resultAddRequest"></p>
            </div>
            ${emailData.verified ? `
            <div>
                <hr class="rounded">
                <p><b>Remove Email</b></p>
                <hr class="rounded">
                <form id="userEdit_password_remove" class="contentMessage" onsubmit="removeEmailRequest('${emailData.email}')">
                    <label for="userEdit_email_pass_remove"><p>Password</p></label>
                    <input type="password" id="userEdit_email_pass_remove" class="userEditForm menu-style" placeholder="Password">
                </form>
                <button class="menuButton menuButton-style" onclick="removeEmailRequest('${emailData.email}')">Remove Email</button>
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
                <input class="menu-style" type="checkbox" id="emailSetting_${option.option}" name="interest" value="${option.option}"${emailSettings[option.option] ? ` checked ` : ""}/>
                <label for="${option.option}">${option.name}<br>${option.description}</label>
            </div>
        `
    }

    ele+=`</form><button class="menuButton menuButton-style" onclick="editEmailSettings()">Submit Email Settings</button>`;
    
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

    const newSettings = [];
    
    var i=0;
    for (item of changedItems) {
        newSettings.push({ option: item, value: document.getElementById(`emailSetting_${item}`).checked })
    }

    const res = await sendRequest(`/emails/settings`, {
        method: 'PUT',
        body: {
            newSettings
        },
    });
    
    if (!res || res.error) return null;
    createEditEmailSettingsView(res);
}

async function getPossibleEmailSettings() {
    const res = await sendRequest(`/emails/settings`, { method: 'GET' })
    return res;
}

async function removeEmailRequest(currentEmail) {
    const password = document.getElementById("userEdit_email_pass_remove")?.value;
    if (!password) return showModal("Please enter your password");

    const res = await sendRequest(`/emails/remove`, {
        method: 'DELETE',
        body: {
            email: currentEmail,
            password: password
        }
    });

    if (!res || res.error) {
        document.getElementById("resultRemoveRequest").innerHTML = `<p>Failed</p>`
    } else {
        document.getElementById("resultRemoveRequest").innerHTML = `<p>Success</p>`
    }

    return res;
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
    const res = await sendRequest(`/emails/requests/validEmail/${email}`, { method: 'GET' });
    return res
}

async function addEmailAccount({ email, password }) {
    const res = await sendRequest(`/emails/set/`, {
        method: 'POST',
        body: {"email" : email, "password" : password}
    });

    if (!res || res.error) {
        document.getElementById("resultAddRequest").innerHTML = `<p>Failed</p>`
        return false
    } else {
        document.getElementById("resultAddRequest").innerHTML = `<p>Success</p>`
    }

    return res;
}

async function subNotifi(subUser) {
    const res = await sendRequest(`/notifications/sub/${subUser}`, { method: 'POST' });
    if (!res || res.error) return document.getElementById('notificationSub').innerHTML=`error`
    document.getElementById('notificationSub').innerHTML=`done`
}

async function unsubUser(userID, username) {
    const res = await sendRequest(`/notifications/unsub/${userID}`, { method: 'DELETE' });
    if (!res || res.error) return document.getElementById(`subList_${userID}`).innerHTML=`error while unsubscribing`
    document.getElementById(`subList_${userID}`).innerHTML=`Unsubscribed from <a onclick="userHtml('${userID}')">${username}</a>.`
}

async function unsubAll() {
    const res = await sendRequest(`/notifications/unsubAll/`, { method: 'DELETE' });

    if (!res || res.error) return document.getElementById(`subscriptionsDiv`).innerHTML=`error while unsubscribing`
    else return document.getElementById(`subscriptionsDiv`).innerHTML=`Unsubscribed from all users.`
}

function hideBookmarks() {
    document.getElementById('bookmarksdiv').innerHTML=""
    document.getElementById('showBookmarksButton').innerHTML="Show Bookmarks"
}

async function showBookmarks() {
    if (document.getElementById('bookmarksAreShown')) return hideBookmarks()
    document.getElementById('showBookmarksButton').innerHTML="Hide Bookmarks"

    const res = await sendRequest(`/posts/bookmarks/`, { method: 'GET' });

    var obj = {} // { list: name, saves: [] }
    for (const list of res.lists) {
        obj[list.name] = []
    }

    for (const save of res.saves.reverse()) {
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
        for (const save of list) {``
            if (debug) console.log(save)
            const newData = await getPostAndProfileData(save)
            ele+= `
                <div class="menu menu-style" id="bookmarkView_${save}">
                    ${newData.error ? `
                        <p>Deleted Post or Otherwise</p>
                    ` : `
                        ${postElementCreate({
                            post: newData.postData,
                            user: newData.profileData,
                            type : "basic"
                        })}
                    `}
                    <button class="menuButton menuButton-style" onclick="unsaveBookmark('${save}', null, 'bookmarks')">Remove ${newData.error ? `Broken` : ''} Bookmark</button>
                </div>
            `;
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
    
    const res = await sendRequest(`/notifications/subscriptions/`, { method: 'GET' });
    if (!res || res.error) return document.getElementById('showSubscriptionsButton').innerHTML=`error`

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

    const res = await sendRequest(`/notifications/getList`, { method: 'GET' });
    if (!res || res.error) return document.getElementById('showNotificationsButton').innerHTML=`error`
    
    var ele = `<hr class="rounded" id="notificationsAreShown"><p id="amount_notifications">${res.amountFound} Notifications</p><hr class="rounded">`
    ele = ele+`<div><a id="dismissAll" onclick="dismissAll()">dismiss all notifications.</a><hr class="rounded"></div>`;
    
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

    var foundUsers = {};

    for (const notifi of res.notifications.reverse()) {
        switch (notifi.type) {
            case 5:
                if (!foundUsers[notifi.userID]) foundUsers[notifi.userID] = await getUserDataSimple(notifi.userID);
                const userData = foundUsers[notifi.userID];

                ele+=`
                    <div class="buttonStyled" id="notification_${notifi._id}">
                        <a onclick="showPost('${notifi.postID}')"><b>${userData?.username ? userData.username : "Unknown User" }</b> has posted! (click to see)</a>
                        <p onclick="dismissNotification('${notifi._id}')">Dismiss Notification.</p>
                    </div>
                `
                break;
            case 7: 
                if (!foundUsers[notifi.userID])  foundUsers[notifi.userID] = await getUserDataSimple(notifi.userID);
                const userData2 = foundUsers[notifi.userID];

                ele+=`
                    <div class="buttonStyled" id="notification_${notifi._id}">
                        <a onclick="showPost('${notifi.postID}')"><b>${userData2?.username ? userData2.username : "Unknown User" }</b> quoted your post!(click to see)</a>
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
    const res = await sendRequest(`/notifications/dismiss/${notificationID}`, { method: 'DELETE' });
    if (!res || res.error) return ;

    document.getElementById(`notification_${notificationID}`).remove();

    var input = document.getElementById("amount_notifications").innerText
    var newInput = input.replace(" Notifications", "")

    newInput--

    document.getElementById("amount_notifications").innerHTML=`${newInput} Notifications` 
};

async function dismissAll() {
    const res = await sendRequest(`/notifications/dismissAll/`, { method: 'DELETE' });

    if (!res || res.error) return document.getElementById(`notificationsDiv`).innerHTML=`error while dismissing`
    else return document.getElementById(`notificationsDiv`).innerHTML=`Dismissed all notifications.`
}

async function showPost(postID) {
    const res = await sendRequest(`/posts/get/${postID}`, { method: 'GET' });
    if (!res || res.error) return showModal("<p>Post was not found</p>")

    const user = await getUserDataSimple(res.userID)
    if (debug) console.log(user)
    const ele = postElementCreate({post: res, user: user})
    document.getElementById('mainFeed').innerHTML=ele
}

async function getUserDataSimple(userID) {
    const res = await sendRequest(`/users/get/basic/${userID}`, { method: 'GET' });
    if (!res || res.error) return 
    else return res
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

    const res = await sendRequest(`/get/developer/`, { method: 'GET' });
    if (!res || res.error) return document.getElementById(`showDevDiv`).innerText = "Error while requesting data"

    var firstEle = `
        <hr class="rounded" id="showDevAreShown">
        <p>Account Status</p>
        <div class="menu menu-style">
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
            <div class="menu menu-style">
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
            <div class="menu menu-style" id="devAcc">
                <p>Sign up for a developer account.</p>
                <div class="">
                    <button class="menuButton menuButton-style" onclick="requestDevToken()">Sign Up</button>
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
                <div class="menu menu-style">
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
            <div class="menu menu-style" id="newAppToken">
                <p>Generate New App Token</p>
                <p>Please input an application name</p>
                <div class="searchSelect search menu-style">
                    <input class="menu-style" id="appName_AppTokenRequest" placeholder="Application Name:">
                </div>
                <button class="menuButton menuButton-style" onclick="requestAppToken(${amount})">Generate Token</button>
            </div>
        `
    }

    var appAccessEle=`<hr class="rounded"><p>App Connections</p>`;
    if (res.allowedApplications&&res.AppTokens) {
        var amount=0;
        for (const appAccess of res.AppAccesses) {
            amount++;
            appAccessEle+=`
                <div class="menu menu-style">
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
    const appTokenData = await sendRequest(`Priv/post/newAppToken`, {
        method: 'POST',
        body: data
    });

    if (!appTokenData|| appTokenData.error) return 

    const newEle = `
        <div class="menu menu-style">
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
        <div class="searchSelect search menu-style">
            <input id="appName_AppTokenRequest" class="menu-style" placeholder="Application Name:">
        </div>
        <button class="menuButton menuButton-style" onclick="requestAppToken(${newAmount})">Generate Token</button>
    `
    document.getElementById('newAppToken').innerHTML=newRequestEle
    document.getElementById('appTokenList').innerHTML+=newEle;
}

async function requestDevToken() {
    document.getElementById('devAcc').innerHTML="loading";

    const devData = await sendRequest(`Priv/post/newDev`, { method: 'POST' });
    if (!devData || devData.error) return 

    const newEle = `
        ${devData._id ? `<p>devToken: <p onclick="revealDevOptions('devToken')" id="devToken" class="blur">${devData._id}</p>`:``}
        ${devData.premium ? `<p>Premium Dev Account</p>`:`<p>Regular Dev Account</p>`}
        ${devData.creationTimestamp ? `<p>Dev account created: ${checkDate(devData.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
    `;

    document.getElementById('devAcc').innerHTML=newEle;
};

async function getPostAndProfileData(postID) {
    const postData = await sendRequest(`/posts/get/${postID}`, { method: 'GET', ignoreError: true});

    if (!postData || postData.error) return {error: `${postData.error ? postData.error : "an unknown error"}`};
    if (debug) console.log(postData);

    const profileData = await sendRequest(`/users/get/basic/${postData.userID}`, { method: 'GET', ignoreError: true});
    if (!profileData || profileData.error) return {error: `${profileData.error ? profileData.error : "an unknown error"}`};

    return { "postData" : postData, "profileData": profileData };
}

async function requestVerification() {
    var input = document.getElementById('content_request_verification').value
    if (debug) console.log(input)

    const data = { 
        "content" : input,
    };

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    fetch(`${apiURL}/post/requestVerify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    }).then(res => {
        console.log(res)
    })
}

function activeSearchBar() {
    if (document.getElementById("searchArea").innerHTML) return;
    document.getElementById("searchArea").innerHTML = `
        <div class="searchSelect search menu-style">
            <input id="searchBarArea" class="menu-style" onkeyup="searchSocial()" placeholder="Search for Posts and Users...">
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
    if (!document.getElementById("searchArea").innerHTML) return;
    document.getElementById("searchArea").innerHTML = ``
    document.getElementById('navSection5').innerHTML = `
        <div id="searchBar" class="nav-link" onclick="activeSearchBar()">
            <span class="material-symbols-outlined nav-button";>search</span>
            <span class="link-text pointerCursor" id="page6">Search</span>
        </div>

    `
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
                <input type="text" id="usernameProfile" class="menu-style" placeholder="Your username">
            </div>
                <div class="userInfo">
                <input type="text" id="displaynameProfile" class="menu-style" placeholder="Your displayname">
            </div>
        </div>
    `
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

async function getPossibleFeeds() {
    const data = await sendRequest(`/feeds/possibleFeeds`, { method: 'GET' })
    if (!data || data.error) return false;
    return data
}

/*
    usage: 
    run listenForLoading() when element is rendered
*/
function loadingHTML(text) {
    const ele = `
        <div id="loadingSection" class="loading menu menu-style">
            <h1 class="h1-style">${text ? text : "Loading..."}</h1>
            <canvas id="loadingBar"></canvas>
        </div>
    `;

    return ele;
}


function listenForLoading() {
    const canvas = document.getElementById('loadingBar');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 50;
    let angle = 0;

    function drawLoadingCircle() {
        if (debug) console.log("drawing loading circle")
        const checkEle = document.getElementById("loadingSection");
        if (!checkEle) return true;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, angle);
        ctx.strokeStyle = 'rgb(39, 113, 240)';
        ctx.lineWidth = 10;
        ctx.stroke();
        angle += Math.PI / 15;
        if (angle >= 2 * Math.PI) {
            angle = 0;
        }
        requestAnimationFrame(drawLoadingCircle);
    }

    drawLoadingCircle();
}

async function changeFeedHeader(current) {
    const possibleFeeds = await getPossibleFeeds();
    if (!possibleFeeds) return console.log("error getting possible feeds");

    var ele = '<div class="">';
    for (const feed of possibleFeeds) {
        ele += `<button class="buttonStyled navSecondary ${current==feed.name ? 'activeFeed' : ''}" onclick="getFeed('${feed.name}')">${feed.niceName}</button>`
    }
    ele += '</div>'

    document.getElementById("possibleFeeds").innerHTML = ele;
    document.getElementById("possibleFeeds").classList.add("possibleFeeds")
    document.getElementById("possibleFeeds").classList.add("navSecondary-style");
    document.getElementById("topPadding").classList.add("activeFeeds");
}

async function changeFeed(feedType) {
    await getFeed(feedType);
}

// GET DATA FROM API FOR MAIN FEED
async function getFeed(feedType) {
    const feedToUse = feedType || 'userFeed'
    buildingFeed=true

    if (currentFeed && (feedToUse == currentFeedType)) return buildView(currentFeed)
    if (debug) console.log("loading feed")

    const params = await checkURLParams()
    if (params.paramsFound != false) return 

    document.getElementById('mainFeed').innerHTML=loadingHTML("Loading feed...");
    listenForLoading();
    buildCopostRequests()
    var url = `/feeds/${feedToUse}`
    if (feedToUse == "userFeed" || feedToUse=="allPosts") url+="/v2"
    const data = await sendRequest(`${url}`, { method: 'GET' })
    if (data.feedVersion == 2){
        currentFeedType = feedToUse;
        currentFeed = data.posts.reverse()
        prevIndexID = data.prevIndexID
    
        if (params.paramsFound == false) {
            buildView(data.posts)
            await changeFeedHeader(feedToUse);
            return;
        }
        else return
    }

    if (!data || !data[0]) return showModal("<p>There was no data in the feed selected, please load a different feed</p>")
    currentFeedType = feedToUse;
    currentFeed = data.reverse()

    if (params.paramsFound == false) {
        buildView(data)
        await changeFeedHeader(feedToUse);
        return;
    }
    else return
}

function setupCopostRequests() {

}

async function buildCopostRequests() {
    const data = await sendRequest('/posts/coposts/requests', { method: 'GET', ignoreError: true})
    if (!data || data.error) return false;
    if (debug) console.log(data)

    var ele = `
        <div class="menu menu-style">
            <p>CoPost Requests</p>
            <p>Requests: ${data.length}</p>
        </div>
    `;

    for (const request of data) {
        ele += copostRequestElement(request);
    }

    document.getElementById("copostRequests").innerHTML = ele;

}

function copostRequestElement({request, post, user}) {
    return `
        <div id="copostRequest_${request._id}" class="menu menu-style">
            <p>Request from: ${user.username}</p>
            <p>Post: ${post.content}</p>
            <button class="menuButton menuButton-style" onclick="acceptCopostRequest('${request._id}')">Accept</button>
            <button class="menuButton menuButton-style" onclick="declineCopostRequest('${request._id}')">Decline</button>
        </div>
    `
}

async function acceptCopostRequest(requestID) {
    const data = await sendRequest(`/posts/coposts/approve/${requestID}`, { method: 'POST' })
    if (!data || data.error) return false;

    return document.getElementById(`copostRequest_${requestID}`).remove()
}

async function declineCopostRequest(requestID) {
    const data = await sendRequest(`/posts/coposts/decline/${requestID}`, { method: 'DELETE' })
    if (!data || data.error) return false;

    return document.getElementById(`copostRequest_${requestID}`).remove()
}

// EASTER EGG
function test() {
    removeSearchBar()

    document.getElementById("mainFeed").innerHTML = `
        <div class="mainNameEasterEgg"> 
            <h1 class="h1-style">You pressed the logo!!</h1>
            <p class="p-style">You pressed the header name, thats pretty cool of you! Thank you for checking out interact!</p>
            <p class=_p-style">Press the button below to go back!</p>
            <button class="menuButton menuButton-style" onclick="switchNav(5)">Main Feed!</button>
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
    if (debug) console.log("buidlding view")
    if (searching) return

    document.getElementById("mainFeed").innerHTML = `
        <div id="addToTop"></div>
        ${posts.map(function(postArray) {
            return postElementCreate({
                post: postArray.postData,
                user: postArray.userData, 
                pollData: postArray.type?.poll=="included" ? postArray.pollData : null,
                voteData: postArray.type?.vote=="included" ? postArray.voteData : null,
                quoteData: postArray.type?.quote=="included" ? postArray.quoteData : null,
                coposterData: postArray.type?.copost=="included" ? postArray.coposterData : null,
                tagData: postArray.type?.tag=="included" ? postArray.tagData : null,
                extraData: postArray.type?.extra=="included" ? postArray.extraData : null,
            })
        }).join(" ")}
        <div id="addToBottom"></div>
    `
    buildingFeed = false;
    devMode()
}
// BUILDING MAIN FEED
function addBuildView(posts) {
    if (debug) console.log("buidlding extra view")
    if (searching) return
    if (!document.getElementById("addToBottom")) return console.log("no bottom div")

    document.getElementById("addToBottom").outerHTML = `
        ${posts.map(function(postArray) {
            return postElementCreate({
                post: postArray.postData,
                user: postArray.userData, 
                pollData: postArray.type?.poll=="included" ? postArray.pollData : null,
                voteData: postArray.type?.vote=="included" ? postArray.voteData : null,
                quoteData: postArray.type?.quote=="included" ? postArray.quoteData : null,
                coposterData: postArray.type?.copost=="included" ? postArray.coposterData : null,
                tagData: postArray.type?.tag=="included" ? postArray.tagData : null,
                extraData: postArray.type?.extra=="included" ? postArray.extraData : null,
            })
        }).join(" ")}
        <div id="addToBottom"></div>
    `
    buildingFeed = false
    devMode()
}

async function nextFeedPage(feedType) {
    buildingFeed = true

    //nextIndexID = data.nextIndexID
    const feedToUse = feedType || 'userFeed'

    const data = await sendRequest(`/feeds/${feedToUse}/v2/${prevIndexID}`, { method: 'GET' })
    if (data.feedVersion == 2){
        currentFeedType = feedToUse;
        currentFeed = data.posts.reverse()
        prevIndexID = data.prevIndexID

        addBuildView(data.posts)
        return;
    }
}

// Callback function to be executed when the intersection changes
function handleIntersection(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            console.log('Bottom div is now in view!');
            if (document.getElementById("addToBottomFollowingFollower")) return nextFollowingFollowerList()
            if (!buildingFeed) nextFeedPage(currentFeedType)
            // Do something when the bottom div is in view
        }
    });
}

// Create an intersection observer with the callback function
const observer = new IntersectionObserver(handleIntersection, {
    root: null, // Use the viewport as the root
    rootMargin: '0px', // No margin
    threshold: 0.5 // Trigger the callback when at least 50% of the target is visible
});

// Target the bottom div
const bottomDiv = document.getElementsByClassName('end-page-padding')[0];

// Start observing the bottom div
observer.observe(bottomDiv);

async function deletePost(postID) {
    if (debug) console.log(`deleting post ${postID}`)

    const response = await sendRequest(`/posts/remove/${postID}`, { method: 'DELETE' })
    if (!response || response.error) return null;
    if (debug) console.log("post deleted")

    var elementPopup = document.getElementById(`popupOpen_${postID}`);
    if (elementPopup) return elementPopup.remove();

    return document.getElementById(`postdiv_${postID}`).remove()
}

function editPost(postID, edited) {
    if (debug) console.log(`editing post ${postID}`)

    const oldMessage = document.getElementById(`postContent_${postID}`).innerText

    if (debug) console.log(oldMessage)
    document.getElementById(`postContentArea_${postID}`).innerHTML = `
        <form id="editPostForm" class="contentMessage"onsubmit="submitEdit('${postID}')">
            <input type="text" id="editPostInput" class="contentMessage contentMessageFormEdit menu-style" value="${oldMessage}">
        </form>
    `
    document.getElementById(`editButton_${postID}`).innerHTML=`<span onclick='cancelEdit("${postID}", "${oldMessage}", "${edited}")'>${styleEditButton(true)}</span>`
    document.getElementById(`editPostInput`).focus()
    document.getElementById("editPostForm").addEventListener("submit", function (e) { e.preventDefault()})
}

async function cancelEdit(postID, content, edited) {
    if (debug) console.log(`cancelling edit of post ${postID}`)

    const post = await sendRequest(`/posts/get/${postID}`, { method: 'GET' })
    if (!post || post.error) return false;

    document.getElementById(`postContentArea_${postID}`).innerHTML = `
        <div class="textAreaPost posts_content-style">
            <p id="postContent_${post._id}">${post.content}</p>
            ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
        </div>
    `

    document.getElementById(`editButton_${postID}`).innerHTML=`<span onclick='editPost("${postID}")' class="posts_action-style">${styleEditButton()}</span>`
}

async function submitEdit(postID) {
    if (debug) console.log(postID)

    const newEdit = document.getElementById('editPostInput').value
    const data = {'postID': postID, 'content': newEdit}

    const editData = await sendRequest(`/posts/edit`, {
        method: 'PUT',
        body: data
    })
    
    if (!editData || editData.error) return false;

    const imageContent = checkForImage(editData.new.content)

    document.getElementById(`editButton_${postID}`).innerHTML=`<span onclick='editPost("${postID}")' class="posts_action-style">${styleEditButton()}</span>`

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
    const post = await sendRequest(`/posts/get/${postID}`, { method: 'GET' })
    if (!post || post.error) return false;
    const user = await sendRequest(`/users/get/basic/${post.userID}`, { method: 'GET' })
    if (!user || user.error) return false;

    await showModal(`
        <h1>Create a new Post</h1>
        <div class="postModalActions">
            <button class="menuButton menuButton-style" onclick="createPost({'quoteID':'${postID}'})">Upload Post</button>
            <button class="menuButton menuButton-style" onclick="closeModal()">Close</button>
        </div>
        <hr class="rounded">
        <div class="post">
            <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser-style" : "otherUser-style"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}` : '>Unknown User'}</p>
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
    const post = await sendRequest(`/posts/get/${postID}`, { method: 'GET', headers})
    if (!post || post.error) return false;

    const user = await sendRequest(`/users/get/basic/${post.userID}`, { method: 'GET', headers })
    if (!user || user.error) return false;

    await showModal(`
        <h1>Create a new Reply</h1>
        <div class="postModalActions">
            <button class="menuButton menuButton-style" onclick="createPost({'replyID':'${postID}'})">Upload Reply</button>
            <button class="menuButton menuButton-style" onclick="closeModal()">Close</button>
        </div>
        <hr class="rounded">
        <div class="post">
            <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser-style" : "otherUser-style"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}` : '>Unknown User'}</p>
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

    if (postIsLiked) {
        if (debug) console.log("liking post")
        const data = await sendRequest(`/posts/unlike/${postID}`, { method: 'DELETE' })
        if (!data || data.error)  return false;

        document.getElementById(`likePost_${postID}`).classList.remove("likedColour");
        document.getElementById(`likePost_${postID}`).classList.remove("ownUser-style");
        document.getElementById(`likePost_${postID}`).classList.add("posts_action-style");

        document.getElementById(`likePost_${postID}`).innerHTML = styleLikedButton(false, data.totalLikes);
    } else {
        if (debug) console.log("liking post")
        const data = await sendRequest(`/posts/like/${postID}`, { method: 'PUT' })

        if (!data || data.error) return false;

        document.getElementById(`likePost_${postID}`).classList.add("likedColour");
        document.getElementById(`likePost_${postID}`).classList.add("ownUser-style");
        document.getElementById(`likePost_${postID}`).classList.remove("posts_action-style");

        document.getElementById(`likePost_${postID}`).innerHTML = styleLikedButton(true, data.totalLikes);
    }
}

// USER DATA FOR FEED
async function getUserData(userID) {
    const response = await sendRequest(`/users/get/${userID}`, { method: 'GET' });
    return response;
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

function hashtagElementCreate(tag) {
    return `
        <div class="publicPost posts-style">
            <p>${tag.tag}</p>
        </div>
    `
}

async function searchResult(input) {
    console.log(input)
    if (!input) {
        if (debug) console.log("returning to feed")
        changeHeader('')
        addWritingToSeachBar('')
        return getFeed()
    }
    if (currentSearch == input){
        if (debug) console.log("same search")
        return console.log("same")
    }

    var headerReplace = input;
    console.log(headerReplace)
    
    currentSearch = input
    searching = true
    const extraHeaders = {
        lookupkey: input
    }

    if (input.startsWith("@")) {
        headerReplace = input.replace("@", "0")
    } else if (input.startsWith("#")) {
        headerReplace = input.replace("#", "1")
    } else if (input.startsWith("0")) {
        extraHeaders.lookupkey = input.replace("0", "@")
    } else if (input.startsWith("1")) {
        extraHeaders.lookupkey = input.replace("1", "#")
    }

    activeSearchBar()
    addWritingToSeachBar(extraHeaders.lookupkey)
    changeHeader(`?search=${headerReplace}`)

    const data = await sendRequest(`/search/`, {
        method: 'GET',
        extraHeaders
    }); 

    if (debug) console.log("loading search")
    
    if (!data || data.error || 
        (!data.hashtagsFound[0] && !data.tagsFound[0] && !data.postsFound[0] && !data.usersFound[0])
    ) return document.getElementById("mainFeed").innerHTML= `<div class="publicPost searchUser"><p>no results were found, try to seach something else.</div>`
    if (debug) console.log(data.postsFound)

    document.getElementById("mainFeed").innerHTML = `
        ${data.usersFound.length > 0 ? `<div><h1 class="publicPost posts-styles font_h1-style">Users found</h1>` : ""}
        ${data.usersFound.reverse().map(function(user) {
            var timesince
            if (user.creationTimestamp) timesince = checkDate(user.creationTimestamp)

            return `
                <div class="publicPost posts-style">
                    <p class="${user._id == currentUserLogin.userID ? "ownUser-style" : "otherUser-style"}" onclick="userHtml('${user._id}')"> ${user.displayName} @${user.username} | ${user.creationTimestamp ? timesince : '' }</p>
                    <p>${user.description ? user.description : "no description"}</p>
                    <p>Following: ${user.followingCount} | Followers: ${user.followerCount}</p>
                    ${user._id == currentUserLogin.userID ? `` : `
                        <p id="follow_search_id_${user._id}" onclick=
                        ${user.followed===true ? 
                            `"unFollowUser('${user._id}', 'follow_search_id_${user._id}')">Unfollow User` :
                            `"followUser('${user._id}', 'follow_search_id_${user._id}')">Follow User`
                        }</p>
                    `}
                    <p class="debug" onclick="copyToClipboard('${user._id}')">${user._id}</p>
                </div>
            `
        }).join(" ")}
        ${data.usersFound.length > 0 ? `</div>` : ""}
        ${data.hashtagsFound?.length > 0 ? `<div><h1 class="publicPost posts-styles font_h1-style">Related Hashtags</h1>` : ""}
        ${data.hashtagsFound?.map(function(hashtagFound) {
            if (debug) console.log(hashtagFound)
            return hashtagElementCreate(hashtagFound)
        }).join(" ")}
        ${data.hashtagsFound?.length > 0 ? `</div>` : ""}
        ${data.tagsFound?.map(function(tagFound) {
            return `
                <div class="">
                <h1 class="publicPost posts-styles font_h1-style">Posts for ${tagFound.tag}</h1>
                    ${tagFound.posts?.reverse().map(function(postData) {
                        return postElementCreate({
                            post: postData.postData,
                            user: postData.userData, 
                            pollData: postData.type?.poll=="included" ? postData.pollData : null,
                            voteData: postData.type?.vote=="included" ? postData.voteData : null,
                            quoteData: postData.type?.quote=="included" ? postData.quoteData : null,
                            coposterData: postData.type?.copost=="included" ? postData.coposterData : null,
                            tagData: postData.type?.tag=="included" ? postData.tagData : null,
                            extraData: postData.type?.extra=="included" ? postData.extraData : null,
                        })
                }).join(" ")}
                </div>
            `
        }).join(" ")}
        ${data.postsFound.length > 0 ? `<div><h1 class="publicPost posts-styles font_h1-style">Posts Found</h1>` : ""}
        ${data.postsFound.reverse().map(function(postArray) {
            return postElementCreate({
                post: postArray.postData,
                user: postArray.userData, 
                pollData: postArray.type?.poll=="included" ? postArray.pollData : null,
                voteData: postArray.type?.vote=="included" ? postArray.voteData : null,
                quoteData: postArray.type?.quote=="included" ? postArray.quoteData : null,
                coposterData: postArray.type?.copost=="included" ? postArray.coposterData : null,
                tagData: postArray.type?.tag=="included" ? postArray.tagData : null,
                extraDta: postArray.type?.extra=="included" ? postArray.extraData : null,
            })
        }).join(" ")}
        ${data.postsFound.length > 0 ? `</div>` : ""}
    `
    devMode()
    searching = false
}

async function createPostPage() {
    var preinput = false;
    var data = { };
    var paramsFound = [];
    const params = new URLSearchParams(window.location.search)
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

    changeHeader(`?posting${paramString}`)

    if (debug) console.log("creating post")

    const ele = `
        <div id="postPageDiv" class="menu menu-style">
            <h1>Create a new Post</h1>
            <div class="postPageInput">
            <textarea class="postTextArea" onkeyup="onTypePostPage()" id="newPostTextArea">${data?.content ? data.content : ""}</textarea>
            </div>
            <div class="mainActions">
                <p class="publicPost menuButton menuButton-style" onclick="leavePostPage()">Back</p>
                <p class="publicPost menuButton menuButton-style" onclick="publishFromPostPage()">Upload Post</p>
                <p class="publicPost menuButton menuButton-style" id="pollCreationButton" onclick="showPollCreation()">Add Poll</p>
                <p class="publicPost menuButton menuButton-style" id="pollCreationButton" onclick="showCoPostersCreation()">Add Co-Posters</p>
                <div class="publicPost menuButton menuButton-style">
                    <p onclick="exportPostHeaderURL()">Create Post Template</p>
                    <p id="postURL_preview"></p>
                    <p id="postURL_messageURL"></p>
                </div>
            </div>
            <div>
                <iv id="addCoPoster"></div>
                <input type="text" id="pollCreateLink" class="addPollOption menu-style" placeholder="Link Poll via ID" ${data.pollID ? `value="${data.pollID}"` : ""}></input>
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

function showCoPostersCreation() {
    const ele = `
        <div class="menu menu-style">
            <p>Co-Posters</p>
            <input type="text" onkeyup="socialTypePost('coPostersInput', true)" id="coPostersInput" class="addPollOption menu-style" placeholder="Add Co-Poster"></input>
            <div id="coPostersDiv"></div>
        </div>
    `;

    document.getElementById("addCoPoster").innerHTML = ele;
}

async function onTypeCoPosters() {
    const input = document.getElementById('co-posters-input').value;
    if (input == "") return document.getElementById('co-posters-div').innerHTML = "";
    const foundTags = await findUserTag(content)
    if (foundTags.found == false) {
        if (document.getElementById('taggingsOpened')) {
            document.getElementById('foundTaggings').innerHTML=""
        }
        return false;
    };
}

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
    const params = new URLSearchParams(window.location.search)

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
        optionAmount: amountOptions,
    };

    for (let i = 0; i < options.length; i++) {
        body[`option_${i+1}`] = options[i];
    }

    if (debug) console.log(body);

    const pollData = await sendRequest(`/polls/create`, {
        method: 'POST',
        body: body
    });

    if (!pollData || pollData.error) return null;
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

    var coposters = null
    const copostersDiv = document.getElementById('coPostersDiv');
    if (copostersDiv) {
        const copostersFound = document.getElementsByClassName('addCoPosterID');
        console.log(copostersFound)
        if (copostersFound) {
            coposters = [];
            for (const coposter of copostersFound) {
                console.log(coposter)
                coposters.push(coposter.innerHTML);
            }

        }
    }


    /* if poll then publish poll first */
    return createPost({ pollID: pollID ? pollID : null, coposters: coposters ? coposters : null });
};

function changePostPageNavButton(method) {
    return false;
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
            <p class="publicPost menuButton menuButton-style" onclick="addExtraOption()">Add Another Option</p>
            <p class="publicPost menuButton menuButton-style" onclick="removeLastOption()">Remove Newest Option</p>
        </div>
        <hr class="rounded">
        <div id="pollCreation">
            <div id="optionAmount"></div>
            <div>
                <p><u>Question</u></p>
                <input type="text" id="pollCreateTitle" class="addPollOption menu-style" placeholder="Question">
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
            <input type="text" class="addPollOption menu-style" id="poll_option_${num}" placeholder="Option ${amount}">
        </div>
    `;
}

function getOption(num) {
    const foundOption = document.getElementById(`poll_option_${num}`)?.value;
    if (foundOption) return foundOption;
    else return false;
}

// PUBLISH WRITTEN POST
async function createPost(params) {
    if (debug) console.log(params)
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

    var coposters
    if (params?.coposters) coposters = params.coposters
    else coposters = undefined

    const data = { 
        "userID" : currentUserLogin.userID, 
        "content" : input,
        "quoteReplyPostID" : quoted,
        "replyingPostID" : replied,
        "linkedPollID" : pollID || null,
        "coposters" : coposters
    };

    if (isFromPostPage) leavePostPage()
    else closeModal();

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    changeHeader('')

    const postData = await sendRequest(`/posts/create`, {
        method: 'POST',
        body: data
    });

    if (!postData || postData.error) return false;
    
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
            <input id="newUsername" class="menu-style"></input>
            <div id="resultEditUsername"></div>
            <button class="buttonStyled" onclick=renameUsername()>Edit Username</button>
        </div>
    `
}

// EDIT DISPLAY NAME
async function renameUsername() {
    const newUsername = document.getElementById('newUsername').value;
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
    
        const newData = await sendRequest(`/put/editUsername`, {
            method: 'PUT',
            body: data
        });

        document.getElementById("resultEditUsername").innerHTML = `
            <p>Changed username! from ${newData.before.username} to ${newData.new.username}</p>
        `
    }
}

async function uploadArticle(method = "draft") {
   const articleData = collectEditArticleData();
    console.log(articleData);


    const articleUploaded = await sendRequest(`/articles/create/upload`, { body: { method, article: articleData }, method: 'POST' });
    console.log(articleUploaded)
};

// ARTICLES
async function createArticlePage() {
    const articleComponents = await sendRequest(`/articles/create/components`, { method: 'GET' });
    console.log(articleComponents)
    if (!articleComponents || articleComponents.error) return false;
    if (articleComponents) articleComponentsStore = articleComponents;

    const ele = `
        <div class="menu menu-style">
            <h1 onclick="uploadArticle('publish')">Publish Article</h1>
            <h1 onclick="uploadArticle('draft')">Draft Article</h1>
        </div>
        <div class="articleCreationArea"> 
            <div class="articleCreate" style="overflow:scroll; height:100vh;"> 
                <div id="articleEditor">
                    <div class="userInfo userInfo-style search">
                        <p>Title:</p><input class="postTextArea" style="height: 30px;" onkeyup="renderPreview()" id="newArticleTitleText"></input>
                    </div>
                    <div id="newComp"></div>
                </div>
                
                <div>${addArticleComponentOptionsEle()}</div>
            </div>

            <div class="articlePreview" id="articlePreview">
        </div>
        </div>
    `;
    
    // ADD component
    // TITLE 
    // SUBMIT
    // ASSIGN to blog page  / topic
    
    document.getElementById("mainFeed").innerHTML = ele;
    renderPreview();
}

function dragArticleStart(event, compontentId) {
    event.dataTransfer.setData("text/plain", event.target.id);
}

// This is necessary to allow a drop
function dragArticleOver(event, compontentId) {
    event.preventDefault();  
}

function dragArticleDrop(event, compontentId) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text");
    const draggedElement = document.getElementById(draggedId);
    const dropTarget = event.target.closest('.userInfo');  // Find the closest .menu target

    if (dropTarget && draggedElement !== dropTarget) {
        // swap comps in articleComponentsEditor array
        const draggedCompId = draggedElement.id.replace("article_component_", "");
        console.log("draggedCompId == compontentId", draggedCompId == compontentId)
        const dropCompId = dropTarget.id.replace("article_component_", "");

        var draggedComp = {
            index: -1,
            comp: {}
        };

        var dropComp= {
            index: -1,
            comp: {}
        };

        for (var i=0; i<articleComponentsEditor.length; i++) {
            if (articleComponentsEditor[i].id == draggedCompId) draggedComp = {index: i, comp: articleComponentsEditor[i]};
            if (articleComponentsEditor[i].id == dropCompId) dropComp = {index: i, comp: articleComponentsEditor[i]};
        }

        if (draggedComp.index == -1 || dropComp.index == -1) return false;

        articleComponentsEditor[draggedComp.index] = dropComp.comp; // dragged replacing dropped
        articleComponentsEditor[dropComp.index] = draggedComp.comp; // dropped replacing dragged

        if (draggedComp.index > dropComp.index) {
            dropTarget.parentNode.insertBefore(draggedElement, dropTarget);
        } else if (draggedComp.index < dropComp.index) {
            dropTarget.parentNode.insertBefore(dropTarget, draggedElement);
        }

        renderPreview();
    }
}

function addArticleComponent(compId) {
    // articleEditor
    const componentId = articleComponentsEditorIndex;
    const newArticlePlacement = document.getElementById('newComp');
    if (!newArticlePlacement) return false;
    
    articleComponentsEditorIndex++;
    const foundComponent = articleComponentsStore.find(comp => comp.type.id == compId);
    
    if (!foundComponent) return false;
    const ele = `
        <div 
            class="userInfo userInfo-style search"
            id="article_component_${componentId}"
            draggable="true" 
            ondragstart="dragArticleStart(event, ${componentId})" 
            ondragover="dragArticleOver(event, ${componentId})" 
            ondrop="dragArticleDrop(event, ${componentId})" 

        >
            <p>${foundComponent.type.name}</p>
            <!--<div
                class=".article_component_drag_handle"
                id="article_component_drag_handle_${componentId}"
            >::</div>-->
            <input 
                class="postTextArea"
                style="height: 30px;"
                id="article_component_${componentId}_value"
                onkeyup="renderPreview()"
                ${foundComponent.type.placeholder? `
                    placeholder="${foundComponent.type.placeholder}"
                `: ``}
            ></input>
            ${foundComponent.options ? `
                ${foundComponent.options.map(option => {
                    return `
                        <p>${option.name}</p>
                            <input 
                                oninput="renderPreview()"
                                class="postTextArea" 
                                style="height: 30px;"
                                id="article_component_option_${componentId}_${option.id}" 
                                name="article_component_option_${componentId}_${option.id}"
                                ${option.default || option.placeholder ? `
                                    placeholder="${option.placeholder ? option.placeholder : option.default}" 
                                ` : ``}
                                ${option.input == "number" ? `
                                    value="${option.default}"
                                    type="number">
                                ` : ``}
                                ${option.input == "text" ? `
                                    type="text">
                                ` : ``}
                                ${option.input == "list" ? `
                                    list="${option.dbName}">
                                    <datalist id="${option.dbName}">
                                    ${option.options.map(option => { 
                                        return  `
                                            <option value="${option.value}">${option.name}</option>
                                        `
                                    }).join("")}
                                    </datalist>
                                ` : ``}
                        </input>
                    `
                }).join("")}
            ` : ``}

        </div>
        <div id="newComp"></div>
    `;

    articleComponentsEditor.push({ id: componentId, type: foundComponent.type });
    newArticlePlacement.outerHTML = ele;
}

function collectEditArticleData() {
    const title = document.getElementById('newArticleTitleText')?.value;
    const components = [];

    for (var i=0; i<articleComponentsEditorIndex; i++) {
        const compData = articleComponentsEditor[i];
        if (debug) console.log("related comp data", compData)
        const compId = compData.id;
        const compType = articleComponentsStore.find(comp => comp.type.id == compData.type.id);
        const compValue = document.getElementById(`article_component_${compId}_value`)?.value;
        const foundOptions = {};

        for (const option of compType.options) {
            const optionValue = document.getElementById(`article_component_option_${compId}_${option.id}`)?.value;

            if (optionValue) foundOptions[option.dbName] = {
                dbName: option.dbName,
                value: optionValue
            }

            else if (option.default) {
                foundOptions[option.dbName] = {
                    dbName: option.dbName,
                    value: option.default
                }
            }
        }

        if (!compValue) continue;
        components.push({
            type: compType.type,
            value: compValue,
            options: foundOptions
        });
    }

    const articleData = {
        title : title ? title : "New Article",
        topic: "Test Topic",
        components
    }

    // return fakeArticleData;
    return articleData;
}

function renderPreview() {
    const articleData = collectEditArticleData() 
    const ele = articleViewEle(articleData);
    document.getElementById("articlePreview").innerHTML = ele;
}

function addArticleComponentOptionsEle() {
    var ele = ``;

    for (const component of articleComponentsStore) {
        ele += `
        <div 
            class="menu menu-style" 
            onclick="addArticleComponent('${component.type.id}')"
        >
            <h2>${component.type.name}</h2>
            <p>${component.type.description}</p>
        </div>`
    }

    return ele;
}

function articleViewEle(articleData, articleUser) {
    var ele = ``
    if (articleData.title) ele += `<h1>${articleData.title}</h1>`
    if (articleData.topic) ele += `<p>Written for: ${articleData.topic}</p>`
    
    ele+=`<div class="spacer_10px"></div>`

    if (articleData.components) {
        for (const component of articleData.components) {
            // ele += `<div class="menu menu-style">` // for now
            ele+=`<div class="spacer_2px"></div>`

            var eleType;
            if (component.type.id==0) {
                eleType = "h2"
            } else if (component.type.id==1) {
                eleType = "h3"
            } else if (component.type.id==2) {
                eleType = "p"
            } else {
                eleType = "p"
            }

            // styles
            ele += `<${eleType} style="
                color: var(--main-p-color); 
                font-size:${component.options["font_size"]?.value ?? 12}px;
                text-align: ${component.options["alignment"]?.value ?? "left"};
                padding-bottom: ${component.options["padding_bottom"]?.value ?? 0}px;
                text-indent: ${component.options["indent"]?.value ?? 0}px;
            ">${component.value}</${eleType}></div>`
        }
    }

    return ele;
}

// For API Use
async function sendRequest(request, { method, body, extraHeaders, ignoreError=false }) {
    // add "version" as a possible header, and .replace on the apiURL
    // or force the version be in the request
    var headersEdited = {};

    if (extraHeaders) {
        headersEdited = { ...headers };
        for (const header in extraHeaders) {
            headersEdited[header] = extraHeaders[header];
        }
    }

    if (debug) console.log(`Sending Request: ${method} ${apiURL}${request}`);

    const response = await fetch(`${apiURL}${request}`, {
        method: method || 'GET',
        body: body ? JSON.stringify(body) : null,
        headers : extraHeaders ? headersEdited : headers
    });
    
    try {
        const data = await response.json();
        if (debug) console.log(data);
        if (data.error && !ignoreError) {
            showModal(`<h1>Error</h1><p>${data.code}: ${data.msg}</p>`);
            return data;
        }

        return data;
    } catch(err) {
        if (!ignoreError) {
            showModal(`<h1>Error</h1><p>Unknown Error.</p>`);
        }
        return { error : true };
    }
}

function getId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : undefined;
}
    
function loadSpotify(amount, link) {
    const iframeSpotify = `<div><p onclick="unloadSpotify(${amount}, '${link}')">Hide Spotify Embed</p><iframe src="${link}" width="320" height="240" frameborder="0" encrypted-media; picture-in-picture"></iframe></div>`
    document.getElementById(`spotify_frame_${amount}`).innerHTML = iframeSpotify
    document.getElementById(`spotify_frame_${amount}`).onclick = null
}

function unloadSpotify(amount, link) {
    document.getElementById(`spotify_frame_${amount}`).innerHTML = `Click to load spotify link #${amount}`
    document.getElementById(`spotify_frame_${amount}`).onclick = `loadSpotify(${amount}, '${link}')`
}

function checkForImage(content, tags) {
    const imageFormats = ['.jpg', '.png','.jpeg', '.svg', '.gif']
    const videoFormats = [{'urlEnd': '.mp4', "type": 'mp4'}, {'urlEnd':'.mov','type':'mp4'}, {'urlEnd':'.ogg', 'type': 'ogg'}]

    if (!content) return '';
    const contentArgs = content.split(/[ ]+/)
    var foundImage = false
    var foundSpotifys = 1

    var attachments = []
    for (index = 0; index < contentArgs.length; index++) {
        if (tags) {
            for (const tag of tags) {
                if (
                    (index == tag.wordIndex) && 
                    (tag.tagTextOriginal == contentArgs[index])
                ) {
                    if (tag.tagTextOriginal.startsWith("@")) {
                        contentArgs[index] = `<a class="ownUser-style" onclick="userPage('${tag.tagTextOriginal.replace("@", "0")}')">${contentArgs[index]}</a>`
                    } else if (tag.tagTextOriginal.startsWith("#")) {
                        contentArgs[index] = `<a class="ownUser-style" onclick="searchResult('${tag.tagTextOriginal.replace("#", "1")}')">${contentArgs[index]}</a>`
                    }
                }
            }
        }
        //if (contentArgs[index].includes(' ')) contentArgs[index] = contentArgs[index].replace(' ', '')
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

            if (contentArgs[index].startsWith("https://open.spotify.com/embed/")) {
                foundImage = true
                var URL = contentArgs[index]
                URL = URL.replace(/\n/g, '');

                const iframeSpotify = `<div><div onclick="loadSpotify(${foundSpotifys},'${URL}')">Click to load spotify link #${foundSpotifys}</div><div id="spotify_frame_${foundSpotifys}"></div></div>`
                attachments.push(iframeSpotify)
                foundSpotifys++
            }
        }
    }

    return {"image" : foundImage, "content": contentArgs.join(" "), attachments}
}
