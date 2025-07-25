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
var stopLoadingFeed = false; // this is used for drawing the circle, could use buildingFeed, but that includes other stuff
var userProfieIndexData = {
    indexID: null,
    prevIndexID: null,
    nextIndexID: null,
    building: false,
}
var aiSuggestions = [];
var amountSuggestions = 0;
// LOCAL STORAGE
var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var LOCAL_STORAGE_LOGINS='social.loginAccounts'
var LOCAL_STORAGE_THEME_SETTINGS = 'social.themeSettings'
var LOCAL_STORAGE_THEME_POSSIBLE = 'social.themePossible'
var buildingFeed = true;
// let loginUserToken = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
var foundCategories = [];
var mediaUploadLinks = [];

var profileLikeIndexData = {
    indexID: null,
    prevIndexID: null,
    nextIndexID: null,
    building: false,
}

updateMargin();
window.addEventListener('resize', updateMargin);

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
    const ifNotificationPage = params.has("notifications")
    const ifBookmarksPage = params.has("bookmarks")
    const ifSearchPage = params.has("searchPage")

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
    } else if (ifNotificationPage) {
        paramsFound = true
        paramsInfo.paramsFound = true

        notificationsPage();
    }else if (ifBookmarksPage) {
        paramsFound = true
        paramsInfo.paramsFound = true

        bookmarksPage();
    } else if (ifSearchPage) {
        paramsFound = true
        paramsInfo.paramsFound = true
        // const searchSearching = params.get('search')
        activeSearchBar();
    }
    return paramsInfo
}

// Update margin based on screen size
function updateMargin() {
    console.log("updating margin")
    const root = document.documentElement;
    const headerHeight = document.getElementsByClassName("main-header")[0]?.clientHeight ?? 0;
    const feedHeaderHeight = document.getElementsByClassName("possibleFeeds")[0]?.clientHeight ?? 0;
    const navWidth = document.getElementsByClassName("navbar-nav")[0]?.clientWidth ?? 0;
    if (debug) console.log(`Header Height: ${headerHeight}, Feed Header Height: ${feedHeaderHeight}, Nav Width: ${navWidth}`);
    if (debug) console.log(`Screen Width: ${window.innerWidth}, Screen Height: ${window.innerHeight}`);
   
    const screenWidth = window.innerWidth - navWidth;
    const screenHeight = window.innerHeight - headerHeight - feedHeaderHeight;
    const ratio = screenWidth / screenHeight;

    // set margin based on screen ratio
    if (ratio >= 1.4) {
        root.style.setProperty('--mainMarginSides', '20%');
    } else if (ratio >= 1.0) {
        root.style.setProperty('--mainMarginSides', '10%');
    } else {
        root.style.setProperty('--mainMarginSides', '5%');
    }
}

// makes it easy to render postElement without having to do a lot of work
function postElementCreateFullEasy(postData, hideParent=false, hideReplies=false) {
    return postElementCreate({
        post: postData.postData,
        user: postData.userData, 
        hideParent: hideParent,
        hideReplies: hideReplies,
        pollData: postData.type?.poll=="included" ? postData.pollData : null,
        voteData: postData.type?.vote=="included" ? postData.voteData : null,
        quoteData: postData.type?.quote=="included" ? postData.quoteData : null,
        coposterData: postData.type?.coposter=="included" ? postData.coposterData : null,
        tagData: postData.type?.tag=="included" ? postData.tagData : null,
        extraData: postData.type?.extra=="included" ? postData.extraData : {},
    })
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
    extraData,
    postData,
    userData
}) {
    if (!post && postData) post = postData;
    if (!user && userData) user = userData;

    if (!post) return "";
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
            <div class="postContent" id="postContentArea_${post._id}">
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
                <div class="post-header">
                    ${user?.profileURL ? `<img onclick="userHtml('${post.userID}')" src="${user.profileURL}" alt="${user.displayName}" class="profile-image">` : ""}
                    <div class="post-user-info">
                        <p>
                            <span class="pointerCursor ${ user && (post.userID == currentUserLogin.userID )? "ownUser-style" : "otherUser-style"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}${user.verified ? ' ✔️' : ''}` : '>Unknown User'}</span>
                            ${coposterData && coposterData[0] ? `${coposterData.map(function(coposter) {
                                return `, <span class="spacer_2px pointerCursor ${ coposter._id == currentUserLogin.userID ? "ownUser-style" : "otherUser-style"}" ${coposter ? ` onclick="userHtml('${coposter._id}')"> ${coposter.displayName} @${coposter.username}${coposter.verified ? ' ✔️ ' : ''}` : '>Unknown User'}</span>`
                            }).join(" ")}`:``}
                        </p>
                        <p class="spacer_2px pointerCursor ${ user && (post.userID == currentUserLogin.userID )? "ownUser-style" : "otherUser-style"}">${timesince} | ${timeSinceData.sinceOrUntil == "current" ? "just posted" : `${timeSinceData.sinceOrUntil == "since" ? timeSinceData.value + " ago" : timeSinceData.value}`}</p>
                    </div>
                </div>
                <div class="postContent" id="postContentArea_${post._id}">
                    <div class="textAreaPost posts_content-style">
                        <p id="postContent_${post._id}">${imageContent.content}</p>
                        ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                    </div>
                    <div class="PostAttachments">
                        ${imageContent.image ? `<div>${imageContent.attachments.map(function(attachment) {return `${attachment}`}).join(" ")}</div>`:''}
                    </div>
                </div>
                ${quoteData && quoteData.quotePost ? `<hr><div>${postElementCreate({post: quoteData.quotePost, user: quoteData.quoteUser, type: "basic"})}</div>` : ''}
                ${post.pollID ? `
                    <div class="poll_option posts-style" id="pollContainer_${post._id}">
                    ${pollData ? `
                        ${pollElement(post._id, post.pollID, pollData, voteData)}
                    `: ``}
                    </div>
                ` : `` }
                <div class="debug">
                    <p><u>Debug Info</u></p>
                    ${post.hasCategory ? `<p>Category: ${post.category} - ${post.subCats.map(function(subcat) { return `${subcat}`}).join(", ")}</p>` : ``}
                    <p onclick="copyToClipboard('${post._id}')">postID: ${post._id}</p>
                    <p onclick="copyToClipboard('${post.userID}')">userID: ${post.userID}</p>
                    ${post.indexID ? `<p onclick="copyToClipboard('${post.indexID}')">indexID: ${post.indexID}</p>` : `` }
                    ${post.userPostIndexID ? `<p onclick="copyToClipboard('${post.userPostIndexID}')">userPostIndexID: ${post.userPostIndexID}</p>` : `` }

                    ${coposterData && coposterData[0] ? `${coposterData.map(function(coposter) {
                        return ` <p onclick="copyToClipboard('${coposter._id}')">coposter ${coposter.username}: ${coposter._id}</p>`
                    }).join(" ")}`:``}
                    ${post.pollID ? `<p onclick="copyToClipboard('${post.pollID}')">pollID: ${post.pollID}</p>` : `` }
                </div>
                <div class="actionOptions pointerCursor no-select"> 
                    <p onclick="likePost('${post._id}')" class="${extraData.liked == true ? 'ownUser-style likedColour':'posts_action-style'}" id="likePost_${post._id}">${styleLikedButton(extraData.liked, post.totalLikes ?? 0)}</p>
                    <p onclick="replyPost('${post._id}')" class="posts_action-style">${styleReplyButton(post.totalReplies)}</p>
                    <p onclick="quotePost('${post._id}')" class="posts_action-style">${styleQuoteButton(post.totalQuotes)}</p>
                    <p id="aisummaryaction_${post._id}" onclick="aiSummaryAction('${post._id}')" class="posts_action-style">${styleSummaryButton()}</p>
                    ${!mobileClient ? `
                        ${post.userID == currentUserLogin.userID ? `
                            <p onclick="deletePost('${post._id}')" class="posts_action-style">${styleDeleteButton()}</p>
                            <p id='editButton_${post._id}'>
                                <span onclick="editPost('${post._id}', '${post.edited}')" class="posts_action-style">${styleEditButton()}</span>
                            </p>
                        ` : ''}
                    ` : ''}
                    <p id="popupactions_${post._id}" class="posts_action-style" data-postid="${post._id}" data-userid="${post.userID}" data-hideparent="${options.hideParent}" data-hidereplies="${options.hideReplies}" data-owner="${owner}" data-pinned="${extraData.pinned}" data-saved="${extraData.saved}" data-followed="${extraData.followed}" onclick="popupActions(this)">${styleActionButton()}</p>
                </div>
            </div>
        </div>
    `

    if (post.pollID && !pollData) {
        // handle poll no data
    }

    return element;
}

function styleSummaryButton() {
    var returnElement = `<span>`;
    returnElement+=`<span class="material-symbols-outlined">rocket_launch</span>`
    return returnElement + `</span>`
}
function styleSummaryCloseButton() {
    var returnElement = `<span>`;
    returnElement+=`<span class="material-symbols-outlined">rocket</span>`
    return returnElement + `</span>`
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

async function popupActions(elem/*postID, userID, hideParent, hideReplies, owner, pinned=false, saved=false, followed=false */) {
    const postID = elem.dataset.postid;
    const userID = elem.dataset.userid;
    const hideParent = elem.dataset.hideparent === ("true" || true) ? true : false //? elem.dataset.hideparent : false;
    const hideReplies = elem.dataset.hidereplies === ("true" || true) ? true : false //? elem.dataset.hideparent : false;;
    const owner = elem.dataset.owner === ("true" || true) ? true : false //? elem.dataset.owner : false;
    const pinned = elem.dataset.pinned === ("true" || true) ? true : false //? elem.dataset.pinned : false;
    const saved = elem.dataset.saved === ("true" || true) ? true : false //? elem.dataset.saved : false;
    const followed = elem.dataset.followed === ("true" || true) ? true : false //? elem.dataset.followed : false;

    if (debug) console.log({ postID, userID, hideParent, hideReplies, owner, pinned, saved, followed });

    const existingPopup = document.getElementById(`popupOpen_${postID}`);
    const triggerButton = document.getElementById(`popupactions_${postID}`);

    const openedEditHistory = document.getElementById(`editHistoryOpened_${postID}`);
    const openedLikes = document.getElementById(`likesOpened_${postID}`);
    const openedReplies = document.getElementById(`repliesOpened_${postID}`);
    const openedQuotes = document.getElementById(`quotesOpened_${postID}`);

    // If already open, close it
    if (existingPopup) {
        triggerButton.innerHTML = styleActionButton(false);
        return existingPopup.remove();
    } else {
        triggerButton.innerHTML = styleActionButton(true);
    }

    // Get the position of the button that triggered the popup
    const rect = triggerButton.getBoundingClientRect();

    // Create the popup
    const popup = document.createElement("div");
    popup.id = `popupOpen_${postID}`;
    popup.className = "popup-context-menu";
    popup.style.position = "absolute";
    popup.style.top = `${rect.bottom + window.scrollY}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.zIndex = 9999;
    popup.style.background = "var(--main-nav-color)";
    popup.style.border = "2px solid var(--main-border-color)";
    popup.style.padding = "10px";
    popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
    popup.style.borderRadius = "15px";
    popup.style.textAlign = "left";

    // Set the inner HTML
    popup.innerHTML = `
        ${owner && mobileClient ? `
            <p><strong>Owner Actions</strong></p>
            <hr>
            <p onclick="deletePost('${postID}')">
                <span class="material-symbols-outlined">delete</span>
                <span>Delete Post</span>
            </p>
            <p onclick="editPost('${postID}')">
                <span class="material-symbols-outlined">edit</span>
                <span>Edit Post</span>
            </p>
        ` : ``}
        <p><strong>Menu Actions</strong></p>
        <hr>
        <p class="pointerCursor" onclick="${pinned ? `unpinPost('${postID}')` : `pinPost('${postID}')`}">
            ${pinned ? `
                <span class="material-symbols-outlined">keep_off</span>
                <span id="pin_post_${postID}">Unpin from Profile</span>    
            ` : `
                <span class="material-symbols-outlined">keep</span>
                <span id="pin_post_${postID}">Pin to Profile</span>
            `}
        </p>
        <p class="pointerCursor" onclick="${saved ? `unsaveBookmark('${postID}')` : `saveBookmark('${postID}')`}">
            ${saved ? `
                <span class="material-symbols-outlined">bookmark_remove</span>
                <span id="saveBookmark_${postID}">Unsave from Bookmarks</span>
            ` : `
                <span class="material-symbols-outlined">bookmark_add</span>
                <span id="saveBookmark_${postID}">Save to Bookmarks</span>
            `}
        </p>
        ${!owner ? `
            <p class="pointerCursor" onclick="${followed ? `unFollowUser('${userID}', 'followUserPostMenu_${postID}')` : `followUser('${userID}', 'followUserPostMenu_${postID}')`}">
                ${followed ? `
                    <span class="material-symbols-outlined">person_remove</span>
                    <span id="followUserPostMenu_${postID}">Unfollow User</span>
                ` : `
                    <span class="material-symbols-outlined">person_add</span>
                    <span id="followUserPostMenu_${postID}">Follow User</span>
                `}
            </p>
        ` : ``}
        <p class="pointerCursor" onclick="copyPostLink('${postID}')">
            <span class="material-symbols-outlined">add_link</span>
            <span id="post_copy_${postID}">Copy Post Link</span>
        </p>
        <p class="pointerCursor" onclick="showEditHistory('${postID}')">
            <span class="material-symbols-outlined">history</span>
            <span id="editHistory_${postID}">${!openedEditHistory ? "View Edit History" : "Close Edit History"}</span>
        </p>
        <p class="pointerCursor" onclick="showLikes('${postID}')">
            <span class="material-symbols-outlined">recent_actors</span>
            <span id="likedBy_${postID}">${!openedLikes ? "View Likes" : "Close Likes"}</span>
        </p>
        ${hideReplies !== true ? `
            <p class="pointerCursor" onclick="viewReplies('${postID}')">
                <span class="material-symbols-outlined">reply_all</span>
                <span id="replies_${postID}">${!openedReplies ? "Check Replies" : "Close Replies"}</span>
            </p>
            <p class="pointerCursor" onclick="viewQuotes('${postID}')">
                <span class="material-symbols-outlined">record_voice_over</span>
                <span id="quotes_${postID}">${!openedQuotes ? "Check Quotes" : "Close Quotes"}</span>
            </p>
        ` : ``}
    `;

    // Close popup when clicking outside
    const clickAway = (e) => {
        if (!popup.contains(e.target) && e.target !== triggerButton) {
            popup.remove();
            triggerButton.innerHTML = styleActionButton(false);
            document.removeEventListener("click", clickAway);
        }
    };
    setTimeout(() => document.addEventListener("click", clickAway), 0); // delay to avoid immediate close

    document.body.appendChild(popup);
}


async function aiSummaryAction(postID, userID) {
    var elementPopup = document.getElementById(`aisummaryOpen_${postID}`);
    if (elementPopup) {
        document.getElementById(`aisummaryaction_${postID}`).innerHTML = styleSummaryButton(false)
        return elementPopup.remove();
    } else {
        document.getElementById(`aisummaryaction_${postID}`).innerHTML = styleSummaryCloseButton(true)
    }

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="aisummaryOpen_${postID}" class="publicPost posts-style" style="position: element(#popupactions_${postID});">
            <p id="aisummaryOpenResult_${postID}">Please wait... Loading AI Summary</p>
        </div>
    `;


    const summaryData = await sendRequest(`/ai/summary/${postID}`, {
        method: 'GET'
    });

    if (!summaryData || summaryData.error || !summaryData.response) return document.getElementById(`aisummaryOpenResult_${postID}`).innerText = "Error while loading AI Summary, please try again later.";
    document.getElementById(`aisummaryOpenResult_${postID}`).innerHTML = `
    <div class="inline">
        <p>AI Summary</p>
        <hr class="rounded">
        ${summaryData.totalPosts > 1 ? `<p>Based on ${summaryData.totalPosts} posts</p>` : ``}
        <p>${summaryData.response}</p>
    </div>`;
};

function copyPostLink(postID) {
    const postLink = `${hostedUrl}?postID=${postID}`
    copyToClipboard(postLink)
    document.getElementById(`post_copy_${postID}`).innerText = "Copied Link!"
}

async function pinPost(postID) {
    const req = await sendRequest(`/users/edit/pins/${postID}`, { method: 'POST' });
    if (req.error) return document.getElementById(`pin_post_${postID}`).innerText = "Error while pinning post, please try again later.";
    document.getElementById(`pin_post_${postID}`).innerText = "Pinned";
    document.getElementById(`pin_post_${postID}`).parentElement.onclick = () => unpinPost(postID);
    document.getElementById(`popupactions_${postID}`).dataset.pinned = true;
}

async function unpinPost(postID) {
    const req = await sendRequest(`/users/edit/pins/${postID}`, { method: 'DELETE' });
    if (req.error) return document.getElementById(`pin_post_${postID}`).innerText = "Error while unpinning post, please try again later.";
    document.getElementById(`pin_post_${postID}`).innerText = "Unpinned"
    document.getElementById(`pin_post_${postID}`).parentElement.onclick = () => pinPost(postID);
    document.getElementById(`popupactions_${postID}`).dataset.pinned = false;
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

        if (eleIdChange.startsWith("followUserPostMenu_")) {
            document.getElementById(eleIdChange).parentElement.onclick = () => unFollowUser(userID, eleIdChange);
            const postID = eleIdChange.split("_")[1];
            document.getElementById(`popupactions_${postID}`).dataset.followed = true;
        }
        else document.getElementById(eleIdChange).onclick = () => unFollowUser(userID, eleIdChange);
    } else {
        showModal(`<p>Unfollowed User!</p>`);
    }
}

async function unFollowUser(userID, eleIdChange) {
    const res = await sendRequest(`/users/unfollow/${userID}`, { method: "DELETE" });
    if (res.error) return;

    if (eleIdChange) {
        document.getElementById(eleIdChange).innerText="Follow User";
        if (eleIdChange.startsWith("followUserPostMenu_")) {
            document.getElementById(eleIdChange).parentElement.onclick = () => followUser(userID, eleIdChange);
            const postID = eleIdChange.split("_")[1];
            document.getElementById(`popupactions_${postID}`).dataset.followed = false;
        }
        else document.getElementById(eleIdChange).onclick = () => followUser(userID, eleIdChange);

    } else {
        showModal(`<p>Unfollowed User!</p>`);
    }
}

async function viewParentPost(postID, parentPostID) {
    if (document.getElementById(`openedParent_${postID}`)) {
        document.getElementById(`parentViewing_${postID}`).innerText = "This was a reply, click here to see.";
        return document.getElementById(`openedParent_${postID}`).remove();
    }

    const postFound = await sendRequest(`/posts/get/full/${parentPostID}`, { method: "GET" });
    if (!postFound || postFound.error) return "";
    const {postData, userData} = postFound;
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

    const postEle = postElementCreate({post: postData, user: userData});
    document.getElementById(`parent_${postID}`).innerHTML = `
        <div class="" id="openedParent_${postID}">${postEle}</div>
    `;
    document.getElementById(`parentViewing_${postID}`).innerText = "Close parent post.";

}

async function viewQuotes(postID) {
    if (document.getElementById(`quotesOpened_${postID}`)) {
        document.getElementById(`quotes_${postID}`).innerText = "Check Quotes";
        return document.getElementById(`quotesOpened_${postID}`).remove();
    }
    document.getElementById(`quotes_${postID}`).innerText = "Close Quotes";

    const quoteData = await sendRequest(`/posts/quotes/${postID}`, { method: 'GET', ignoreError: true });
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
}

// async function 
async function viewReplies(postID) {
    if (document.getElementById(`repliesOpened_${postID}`)) {
        document.getElementById(`replies_${postID}`).innerText = "Check replies";

        return document.getElementById(`repliesOpened_${postID}`).remove();
    }

    document.getElementById(`replies_${postID}`).innerText = "Close replies";

    const replyData = await sendRequest(`/posts/replies/full/${postID}`, { method: 'GET',ignoreError: true });
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
        ele+=postElementCreateFullEasy(reply, true);
        // const userData = await sendRequest(`/users/get/basic/${reply.userID}`, { method: 'GET' });
        // ele+=postElementCreate({post: reply, user: userData, hideParent: true });
    }

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="repliesOpened_${postID}" class="publicPost posts-style" style="position: element(#popupactions_${postID});">
            <p>Replies</p>
            <p>---</p>
            ${ele}
        </div>
    `;

    // get message
    // postElementCreate
}

async function saveBookmark(postID, list) {
    const body = {
        postID,
        listname: list ? list : "main"
    }
    const res = await sendRequest(`/posts/save/`, { method: 'POST', body });
    if (res.error) return document.getElementById(`saveBookmark_${postID}`).innerText = `Error: ${res.msg}`;
    document.getElementById(`saveBookmark_${postID}`).innerText="Saved";
    // parent must be updated to do new function

    document.getElementById(`saveBookmark_${postID}`).parentElement.onclick = () => unsaveBookmark(postID);
    document.getElementById(`saveBookmark_${postID}`).parentElement.childNodes[0].innerText = "bookmark_remove"
    document.getElementById(`popupactions_${postID}`).dataset.saved = true;
}

async function unsaveBookmark(postID, list, where) {
    const body = {
        postID,
        listname: list ? list : "main"
    }
    const res = await sendRequest(`/posts/unsave/`, { method: 'DELETE', body });
    if (res.error) return document.getElementById(`saveBookmark_${postID}`).innerText = `Error: ${res.msg}`;
    if (!where) document.getElementById(`saveBookmark_${postID}`).innerText="Unsaved"
    if (where == "bookmarks") document.getElementById(`bookmarkView_${postID}`).remove()
    document.getElementById(`saveBookmark_${postID}`).parentElement.onclick = () => saveBookmark(postID);

    document.getElementById(`popupactions_${postID}`).dataset.saved = false;
}

async function showLikes(postID) {
    if (document.getElementById(`likesOpened_${postID}`)) {
        document.getElementById(`likedBy_${postID}`).innerText = "View Likes";
        return document.getElementById(`likesOpened_${postID}`).remove();
    }
    document.getElementById(`likedBy_${postID}`).innerText = "Close Likes";

    const likeData = await sendRequest(`/posts/likes/${postID}`, { method: 'GET', ignoreError: true });
    if (likeData.error) {
        document.getElementById(`postElement_${postID}`).innerHTML+=`
            <div id="likesOpened_${postID}" class="publicPost posts-style" style="position: element(#popupactions_${postID});">
                <p>Likes</p>
                <p>---</p>
                There are no likes yet on this post.
            </div>
        `;
        if (debug) console.log("no likes")
        return ;
    }
    
    var ele = ``;
    for (const userInfoLike of likeData.peopleLiked) {
        ele+=`<p onclick="userHtml('${userInfoLike.userID}')">${userInfoLike.userData?.displayName} @${userInfoLike.username}</p>`;
    }

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="likesOpened_${postID}" class="publicPost posts-style" style="position: element(#popupactions_${postID});">
            <p>Likes</p>
            <p>---</p>
            ${ele}
        </div>
    `;
}

async function showEditHistory(postID) {
    if (document.getElementById(`editHistoryOpened_${postID}`)) {
        document.getElementById(`editHistory_${postID}`).innerText = "View Edit History";
        return document.getElementById(`editHistoryOpened_${postID}`).remove();
    }
    document.getElementById(`editHistory_${postID}`).innerText = "Close Edit History";
    
    const editData = await sendRequest(`/posts/edits/${postID}`, { method: 'GET', ignoreError: true });
    if (editData.error) {
        document.getElementById(`postElement_${postID}`).innerHTML+=`
            <div id="editHistoryOpened_${postID}" class="publicPost posts-style" style="position: element(#popupactions_${postID});">
                <p>Edit History</p
                <p>---</p>
                There is no edit history for this post.
            </div>
        `;
        if (debug) console.log("no edit history")
        return ;
    }

    var ele =``;
    for (const edit of editData.edits.reverse()) {
        ele+=`<p>${edit.content}</p>`
    };

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="editHistoryOpened_${postID}" class="publicPost posts-style" style="position: element(#popupactions_${postID});">
            <p>Edit History</p>
            <p>---</p>
            ${ele}
        </div>
    `;
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
    createPostPage(true);
    return null;
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

    const outputDivBox = customInputID ? `foundTaggings_${customInputID}` : "foundTaggings";
    if (debug) console.log("input div output", outputDivBox)

    if (foundTags.found == false) {
        if (document.getElementById('taggingsOpened')) {
            document.getElementById(outputDivBox).innerHTML=""
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
    document.getElementById(outputDivBox).innerHTML=`
        <div id="taggingsOpened"></div>
        ${taggings}
    `
}

async function autoCompleteCoposter(username, userID) {
    const content = document.getElementById('coPostersInput').value
    const contentArgs = content.split(" ")

    // replaces with new value
    contentArgs[contentArgs.length-1] = `@${username} `;
    document.getElementById('foundTaggings_coPostersInput').innerHTML=""

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
    document.getElementById('foundTaggings').innerHTML="" // only for taggings

    
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
    // removeSearchBar()
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
        if ((!value || value==update.currentValue) && update.dbName == "profileURL") {
            const file = await uploadFile(true)
            if (!file || file.error) continue;
            value = `${apiURL}/cdn${file.cdnURL}`;
        }

        if (!value || (update.currentValue && update.currentValue == value)) continue;
        if (update.type == "Date") value = convertDateToEpoch(value);

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
        if (actionData == "profileImage") {
            const file = await uploadFile("profileImage")
            if (!file || file.error) return console.log(file)
            tempHeaders[`new${actionData.action.toLowerCase()}`] = `${apiURL}${file.cdnURL}`;
            continue;
        }
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
    const postData = await sendRequest(`/posts/get/full/${postID}`, { method: 'GET' })
    if (!postData || postData.deleted) return console.log("error with post");

    const ele = postElementCreateFullEasy(postData);
    document.getElementById("mainFeed").innerHTML = ele
    addDebug()

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

function settingsPage(toChangeHeader=true, toReset=false, subCategory) {
    const hash = window.location.search.split("=")[1];
  
    if ((toChangeHeader && !hash) || (toChangeHeader && toReset)) changeHeader("?settings");

        console.log("settingsPage", hash, toChangeHeader, toReset)

    const ele = `
        <div id="settingsPage">
            <div id="settingsHeader">
                <div class="menu menu-style areaPost"><h1 class="font_h1-style">Settings</h1></div>
            </div>
            <div id="settingsContent">
                <div class="menu menu-style areaPost settingsCategory" onclick="openSettingsCategoryPage('accounts')"><p>👤 Accounts - Manage Accounts on Interact Website</p></div>
                <div class="menu menu-style areaPost settingsCategory" onclick="openSettingsCategoryPage('feed')"><p>📰 Feed - Adjust Your Feed and Search to Your Liking</p></div>
                <div class="menu menu-style areaPost settingsCategory" onclick="openSettingsCategoryPage('theme')"><p>🎨 Theme - Adjust Your Default Client</p></div>
                <div class="menu menu-style areaPost settingsCategory" onclick="openSettingsCategoryPage('privacy')"><p>🔐 Privacy - Adjust Your Privacy Settings</p></div>
                <div class="menu menu-style areaPost settingsCategory" onclick="openSettingsCategoryPage('developer')"><p>👨‍💻 Developer - Learn and Create using Interact API</p></div>
                <div class="menu menu-style areaPost settingsCategory" onclick="openSettingsCategoryPage('email')"><p>📧 Email - Adjust Your Email Settings</p></div>
                <div class="menu menu-style areaPost settingsCategory" onclick="openSettingsCategoryPage('other')"><p>📄 Other Pages - View Other Pages Related to Interact</p></div>
            </div>
        </div>
    `;

    document.getElementById("mainFeed").innerHTML = ele;
    devMode();
    if ((hash && !toReset) || subCategory) return openSettingsCategoryPage(hash ? hash : subCategory);

    return true;
}

async function openSettingsCategoryPage(category) {
    const backBtn = `<div class="menu menu-style settingsCategory" onclick="settingsPage(true, true)"><p>Back to Settings Page</p></div>`
    const headerTitle = `<div class="menu menu-style areaPost"><h1 class="font_h1-style">${firstLetterUpperCase(category)} ${category != "other" ? "Settings" : "Pages" }</h1></div>`
    let header = `${headerTitle}${backBtn}`;
    document.getElementById("settingsHeader").innerHTML = header;
    document.getElementById("settingsContent").innerHTML = `<div class="menu menu-style areaPost"><p>Loading ${firstLetterUpperCase(category)} Settings...</p></div>`;
    changeHeader(`?settings=${category}`)

    let content = "";
    switch (category) {
        case "accounts":
            content += profileSettingsCategoryPage();
            break;
        case "feed":
            content += await feedSettingsCategoryPage();
            break;
        case "theme":
            content += themeSettingsCategoryPage();
            break;
        case "privacy":
            content += await privacySettingsCategoryPage();
            break;
        case "email":
            content += await emailSettingsCategoryPage();
            break;
        case "developer":
            content += await developerSettingsCategoryPage();
            break;
        case "other":
            content += otherSettingsCategoryPage();
            break;
        default:
            content += `<div class="menu menu-style"><p>Unknown category: '${category}'. Please report this to the developers, or check spelling.</p></div>`;
            break;
    }

    document.getElementById("settingsContent").innerHTML = content;

    if (category == "privacy") {
        document.getElementById("userEdit_privacySettings").addEventListener("submit", function (e) { e.preventDefault()})
    } else if (category == "email") {
        if (document.getElementById("userEdit_emailSettings")) document.getElementById("userEdit_emailSettings").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_email").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_password").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_password_remove").addEventListener("submit", function (e) { e.preventDefault()})
    }

    devMode();
}

function profileSettingsCategoryPage() {
    const ele = `
        <div class="menu menu-style">
            <p>View your profile. As shown to other users.</p>
            <button class="menuButton menuButton-style" onclick="profile()">View Profile</button>
            <hr class="rounded">
            <p>Edit your public profile.</p>
            <button class="menuButton menuButton-style" onclick="userEditPage()">Edit Profile</button>
        </div>
        <div class="menu menu-style">
            <p><b>Interact Accounts</b></p>
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
        </div>
        <div id="signOutConfirm"></div>
        <div class="menu menu-style">
            <p><b>Delete Your Account</b></p>
            <button class="menuButton menuButton-style" onclick="deleteAccPage()">Delete Account</button>
        </div>
        <div id="deleteAccConfirm"></div>
        <div class="menu menu-style">
            <p><b>Change Your Password</b></p>
            <button class="menuButton menuButton-style" onclick="changePasswordPage()">Change Password</p>
        </div>
        <div id="passwordPopup"></div>
    `
    return ele;
}

async function feedSettingsCategoryPage() {
    const changeFeedSettingsUI = await changeFeedSettings();
    const changePersonalizedFeedUI = await changePersonalizedFeed();
    const changeSearchSettingsUI = await changeSearchSettings();
    const ele = `
        <div class="menu menu-style" id="changeFeedSettingsUI">
            ${changeFeedSettingsUI}
        </div>
        <div class="menu menu-style">
            ${changePersonalizedFeedUI}
        </div>
        <div class="menu menu-style" id="changeSearchSettingsUI">
            ${changeSearchSettingsUI}
        </div>
    `;
    return ele;
}

function themeSettingsCategoryPage() {
    const ele = `
        <div id="themeEditor" class="menu menu-style"><p><b>Client Theme</b></p>
            <button class="menuButton menuButton-style" onclick='editThemePanel("${headers.userid}")'>Open Editor</button>
            <button class="menuButton menuButton-style" onclick='createTheme()'>Create Theme</button>
            <button class="menuButton menuButton-style" onclick='viewThemes("${headers.userid}")'>Existing Themes</button>
            <button class="menuButton menuButton-style" onclick='unsetThemeFrontend()'>Unset Theme</button>
            <button class="menuButton menuButton-style" onclick='viewThemesDiscovery()'>Discover Themes</button>
        </div> 
        <div id="userThemeEditor"></div>
    `;
    return ele;
}

async function privacySettingsCategoryPage() {
    const openPrivacyPageUI = await openPrivacyPage();
    const ele = `
        <div class="menu menu-style">
            <p>Note: This feature is unfinished, and will have a later updates for better functionality.</p>
        </div>
        <div class="menu menu-style" id="privacySettingsUI">
            ${openPrivacyPageUI}
        </div>
    `;
    return ele;
}

function updateUIDevMode() {
    const devModePageUI = devModePage();
    document.getElementById("devModeStatus").innerHTML = devModePageUI;
}

async function developerSettingsCategoryPage() {
    const devModePageUI = devModePage();
    const showDevOptionsUI = await showDevOptions();
    const ele = `
        <div class="menu menu-style">
            <p><b>DevMode</b></p>
            <p>Enable / Disable dev mode. This will allow you to see more information about the different elements of Interact.<br><br>
            To view change live, open inspect element, and run <b>switchNav(3)</b><br><br>
            You can quickly copy values by pressing the IDs. This will copy the ID to your clipboard.</p>
        </div>
        <div id="devModeStatus" class="menu menu-style">
            <div>${devModePageUI}</div>
        </div>
        <div class="menu menu-style">
            <p><b>Developer</b></p>
            <p>Access your developer account, and any apps that has access to your account</p>
        </div>
        <div class="menu menu-style">
            <div id="showDevDiv">${showDevOptionsUI}</div>
        </div>
    `;
    return ele;
}

async function emailSettingsCategoryPage() {
    const changeEmailPageUI = await changeEmailPage();

    const ele = `
        <div class="menu menu-style">
            ${changeEmailPageUI}
        </div>
    `;
    return ele;
}

function otherSettingsCategoryPage() {
    const generatedReleatedUI = generateRelatedPages();
    const ele = `
        <div class="menu menu-style areaPost settingsCategory" onclick="switchNav(6)"><p>Notifications - Check out your notifications and subscriptions</p></div>
        <div class="menu menu-style areaPost settingsCategory" onclick="switchNav(9)"><p>Bookmarks - Check out your bookmarks</p></div>
        ${generatedReleatedUI}
    `
    return ele;
}

function bookmarksPage() {
    changeHeader("?bookmarks")
    const ele = `
        <div id="bookmarksPage">
            <div class="menu menu-style">
                <h1>Bookmarks</h1>
            </div>
            <div class="menu menu-style">
                <button class="menuButton menuButton-style" id="showBookmarksButton" onclick="showBookmarks()">Show Bookmarks</button>
                <div id="bookmarksdiv"></div>
            </div>
        </div>
    `;

    document.getElementById("mainFeed").innerHTML = ele;
    showBookmarks()
}

function generateRelatedPages() {
    const related = [
        { name: "Analytics", url: "https://interact-analytics.novapro.net", description: "Check out Analytics about Interact" },
        { name: "Interact Info", url: "https://novapro.net/interact/", description: "Check out the product page on novapro.net" },
        { name: "Admin Page", url: "/admin/", description: "Check out the admin page, where you can see some runtime info" },
        { name: "Interact Staff", url: "/staff/", description: "Check out the Interact staff page" },
        { name: "GitHub", url: "https://github.com/social-novapro/", description: "Check out the social-novapro github page, where you can find many open source repos" },
        { name: "Nova Productions", url: "https://novapro.net/", description: "Learn about the company that created Interact." },
        { name: "dkravec site", url: "https://dkravec.net/", description: "Learn about me - Daniel Kravec, the creator of Interact." },
    ];

    var ele = '';

    for (const rel of related) {
        ele+=`
            <div class="menu menu-style areaPost settingsCategory" onclick=relatedPagesSwitch('${rel.url}')"><p>${rel.name} - ${rel.description}</p></div>
        `
    }

   return ele;
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
        <div class="menu menu-style">
            <p><b>Sign Out</b></p>
            <p>Are you sure you want to sign out?</p>
            <button class="menuButton menuButton-style"onclick="signOut()">Sign Out</p>
            <button class="menuButton menuButton-style"onclick="signOutAll()">Sign Out of All Accounts</p>
            <button class="menuButton menuButton-style" onclick="removeSignOutConfirm()">Cancel</button></div>
        </div>
    `;

    document.getElementById("signOutConfirm").innerHTML = ele;
    // document.getElementById("signOutPage").classList.add("menu");
    // document.getElementById("signOutPage").classList.add("menu-style");
    return true;
}

async function switchAccountPage() {
    const logins = localStorage.getItem(LOCAL_STORAGE_LOGINS)
    if (!logins) return showModal("<p>No other accounts found</p>")
    const loginsParsed = JSON.parse(logins)
    if (!loginsParsed) return showModal("<p>No other accounts found</p>")
    if (!loginsParsed[0]) return showModal("<p>No other accounts found</p>")

    var ele = `
        <div class="menu menu-style">
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
    ele += `<button class="menuButton menuButton-style" onclick="removeSignOutConfirm()">Cancel</button></div></div>`;

    document.getElementById("signOutConfirm").innerHTML = ele;
}

async function miniPreviewUser(userID) {
    const userData = await sendRequest(`/users/get/basic/${userID}`, { method: 'GET' })
    if (!userData || userData.error) return console.log("error with user");
    const ele = `<p>${userData.displayName}@${userData.username}</p>`;
    return ele;
}

async function deleteAccPage() {
    const ele = `
        <div class="menu menu-style">
            <p><b>Delete Account</b></p>
            <p>Are you sure you want to delete your account?<br>This will send an email and you will need to confirm.</p>
            <hr class="rounded">
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

function firstLetterUpperCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
async function changePersonalizedFeed() {
    // get all categories
    /*if (!foundCategories || !foundCategories[0]) */foundCategories = await sendRequest(`/users/personalize`, { method: 'GET' });
    if (!foundCategories || foundCategories.error) return console.log("error with categories");

    var ele = `
        <p><b>Personalization Settings</b></p>
        <p>Choose what categories you want to see in your feed.</p>
        <hr class="rounded">                    
    `;

    for (const category of foundCategories) {
        ele+=`
            <p style="text-align:left; padding-left:11%">${firstLetterUpperCase(category.name)} - <span id="categoryValue_${category.id}">Value ${category.value}</span> - <span id="revealButton_${category.id}" onclick="viewSubcategories('${category.id}')">View Subcategories</span></p>
            <div class="slider-labels">
                <span>0</span>
                <input
                    type="range"
                    id="feedSettings_${category.id}"
                    class="menu-style sliderInput"
                    min="0"
                    max="10"
                    value="${category.value}"
                    onchange="updateCategory('${category.id}')"
                >
                <span>10</span>
            </div>
            ${category.subCategories && category.subCategories[0] ? `
                <div style="display: none" id="feedSettings_${category.id}_subcategories">
                    <hr class="rounded">                    
                    ${category.subCategories.map(subCategory => {
                        return `
                            <span>${subCategory.name}, </span>
                        `;
                    }).join('')}
                </div>
               
            ` : ``}
            <div class="spacer_5px"></div>
            <div class="spacer_5px"></div>
        `;
    }


    return ele;
}

function viewSubcategories(id) {
    if (document.getElementById(`feedSettings_${id}_subcategories`).style.display == "block") {
        document.getElementById(`feedSettings_${id}_subcategories`).style.display = "none";
        document.getElementById(`revealButton_${id}`).innerText = "Reveal Subcategories";
        return;
    }

    document.getElementById(`feedSettings_${id}_subcategories`).style.display = "block";
    document.getElementById(`revealButton_${id}`).innerText = "Hide Subcategories";
}

async function updateCategory(id) {
    const value = document.getElementById(`feedSettings_${id}`).value;
    const body = {
        categoryID: id,
        value: value
    }

    const res = await sendRequest(`/users/personalize/`, {
        method: 'POST',
        body: body
    });

    if (!res || res.error) return console.log("error with categories");
    
    if (devMode) console.log("Updated category", id, value)
    document.getElementById(`categoryValue_${id}`).innerText = value;
    console.log(body)
}

function revealSubcategories(id) {
    const ele = document.getElementById(`feedSettings_${id}_subcategories`);
    const reveal = document.getElementById(`reveal_subcategories_${id}`);

    if (ele.style.display == "none") {
        ele.style.display = "block";
        reveal.innerText = "Hide Subcategories";
    }
    else {
        ele.style.display = "none";
        reveal.innerText = "Reveal Subcategories";
    }
}

function devModePage() {
    const ele = `
        <p>Dev Mode is ${debug ? "enabled" : "disabled"}</p>
        <button class="menuButton menuButton-style" onclick="switchDevMode()">Dev Mode</button>
        <button class="menuButton menuButton-style" onclick="removeDevModeConfirm()">Cancel</button></div>
    `;

    return ele;
}

function switchDevMode() {
    debugModeSwitch()
    devMode();
    updateUIDevMode()
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

    var ele = `
        <div class="userEdit">
            <div class="menu menu-style">
                <h1 class="font_h1-style">Edit Profile</h1>
            </div>

            <div class="menu menu-style">
                <p><b>Go Back or Save Changes</b></p>
                <button class="menuButton menuButton-style" onclick="userHtml('${userID}')"">Go Back</button>
                <button class="menuButton menuButton-style" onclick="userEditV2()">Save Changes</button>
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
                ${update.dbName=="profileURL" && update.currentValue != null? `<img width="30%" height="30%" src="${update.currentValue}" class="profileImage">` : ""}
                    <p id="userEdit_update_${update.dbName}"></p>
                    <form id="userEdit_${update.dbName}" class="contentMessage" onsubmit="userEditV2Specific('${update.action}')">
                    <div><input type="text" id="userEdit_${update.dbName}_text" class="userEditForm menu-style" placeholder="${update.currentValue || update.title}" value="${update.currentValue || ""}"></div>
                    ${update.dbName=="profileURL" ? `<div><input type="file" id="interactFile" class="menuButton menuButton-style"></div>` : ""}
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
                    <input type="file" id="interactFile" class="menuButton menuButton-style">
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
    if (!followData) return; //showModal(`<p>Error: ${userList.code}, ${userList.msg}</p>`);

    if (followData.prevIndexID) followingFollowerData.prevIndexID = followData.prevIndexID;
    if (followData.userData) followingFollowerData.userData = followData.userData;

    followingFollowerData.currentlyBuilding = true;

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
        ele += followingFollowerSingleElement(data.userData, data.followData);
    }

    ele+=`<div id="addToBottomFollowingFollower"></div>`;
    document.getElementById("followingFollowerList").innerHTML = ele;
    followingFollowerData.currentlyBuilding=false;
}

function followingFollowerSingleElement(user, follow) {
    if (!user) return `<p>Error: No user data found</p>`;
    if (!follow) return `<p>Error: No follow data found</p>`;
    var timesince
    if (user.creationTimestamp) timesince = checkDate(user.creationTimestamp)

    var timesinceFollow
    if (follow.timestamp) timesinceFollow = checkDate(follow.timestamp)

    return ` 
        <div class="publicPost posts-style">
            ${follow.current != true ? `<p><i>Not current, might have unfollowed</i></p>` : ``}
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
    `
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


    if (profileData.included.userPostIndexData) {
        userProfieIndexData.indexID = profileData.userPostIndexData.indexID;
        if (profileData.userPostIndexData.prevIndexID) userProfieIndexData.prevIndexID = profileData.userPostIndexData.prevIndexID;
        if (profileData.userPostIndexData.nextIndexID) userProfieIndexData.nextIndexID = profileData.userPostIndexData.nextIndexID;
    } else {
        profileData.prevIndexID = null;
        profileData.nextIndexID = null;
        profileData.totalPosts = 0;
    }

    if (profileData.included.likeIndexData) {
        profileLikeIndexData.indexID = profileData.likeIndexData.indexID;
        if (profileData.likeIndexData.prevIndexID) profileLikeIndexData.prevIndexID = profileData.likeIndexData.prevIndexID;
        if (profileData.likeIndexData.nextIndexID) profileLikeIndexData.nextIndexID = profileData.likeIndexData.nextIndexID;
    }

    document.getElementById("mainFeed").innerHTML =  `
        <div class="menu menu-style">
            <h1>Profile</h1>
        </div>
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
        <!-- Likes, TO FIX UI OF PROFILE, SELECTABLE, PINS, BADGES, POSTS, like mobile -->
        ${profileData.included.likes ? `
            <div class="menu menu-style">
                <p><b>Likes</b></p>
                <p>${profileData.userData.likedCount}</p>
                <div id="likeRenderActionButtons"> 
                    ${likesRenderActionButtons()}
                </div>
            </div>
            <hr class="rounded">
            <div id="likesRenderPage">
                ${likesRenderPage(profileData.likesData)}
            </div>
        ` : ``}
        ${!profileData.postData.error ? `
            <div class="menu menu-style">
                <p><b>Posts</b></p>
                <p>${profileData.userData.totalPosts}</p>
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
            ${profileData.included.userPostIndexData && profileData.userPostIndexData.prevIndexID ? `
                <div id="addToBottomProfile"></div>
            `: ``}
        ` : ``}
    `

    devMode()
    return;
}
function likesRenderActionButtons() {
    return `
        ${profileLikeIndexData.prevIndexID ? `<button class="menuButton menuButton-style" onclick="loadProfileLikeIndex('prev')">Previous Page</button>` : ''}
        ${profileLikeIndexData.nextIndexID ? `<button class="menuButton menuButton-style" onclick="loadProfileLikeIndex('next')">Next Page</button>` : ''}
    `
}

async function loadProfileLikeIndex(direction) {
    if (profileLikeIndexData.currentlyBuilding) return;
    profileLikeIndexData.currentlyBuilding = true;

    var likesData = null;

    if (direction == 'prev') {
        if (!profileLikeIndexData.prevIndexID) return;
        likesData = await sendRequest(`/users/likes/index/${profileLikeIndexData.prevIndexID}`, { method: 'GET' });
    } else if (direction == 'next') {
        if (!profileLikeIndexData.nextIndexID) return;
        likesData = await sendRequest(`/users/likes/index/${profileLikeIndexData.nextIndexID}`, { method: 'GET' });
    }

    if (!likesData || likesData.error) return showModal(`<p>Error: ${likesData.code}, ${likesData.msg}</p>`);
    
    profileLikeIndexData.indexID = likesData._id;
    profileLikeIndexData.prevIndexID = likesData.prevIndexID ?? null;
    profileLikeIndexData.nextIndexID = likesData.nextIndexID ?? null;
    
    document.getElementById("likesRenderPage").innerHTML = likesRenderPage(likesData.postsLiked);
    document.getElementById("likeRenderActionButtons").innerHTML = likesRenderActionButtons();
    profileLikeIndexData.currentlyBuilding = false;
}

function likesRenderPage(likesData) {
    if (!likesData || likesData.error) return '';//showModal(`<p>Error: ${likesData.code}, ${likesData.msg}</p>`);

    return `
        ${likesData.map(function(like) {
            return postElementCreate({
                post: like.postData,
                user: like.userData, 
                pollData: like.type?.poll=="included" ? like.pollData : null,
                voteData: like.type?.vote=="included" ? like.voteData : null,
                quoteData: like.type?.quote=="included" ? like.quoteData : null,
                coposterData: like.type?.coposter=="included" ? like.coposterData : null,
                tagData: like.type?.tag=="included" ? like.tagData : null,
                extraData: like.type?.extra=="included" ? like.extraData : {},
            })
        }).join(" ")}
    `
}

async function addNextIndexProfile() {
    console.log("BUILDING NEXT USERPOSTINDEX")
    userProfieIndexData.currentlyBuilding = true;
    if (!userProfieIndexData.prevIndexID) return;

    const nextIndexData = await sendRequest(`/users/get/userPosts/${userProfieIndexData.prevIndexID}`, { method: 'GET' })
    if (!nextIndexData || nextIndexData.error) return;

    const myEle = `
        ${nextIndexData.posts.map(function(post) {
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
        <div id="addToBottomProfile"></div>
    `;
    
    userProfieIndexData.indexID = nextIndexData.index._id;
    userProfieIndexData.prevIndexID = nextIndexData.index.prevIndexID ?? null;
    userProfieIndexData.nextIndexID = nextIndexData.index.nextIndexID ?? null;

    document.getElementById("addToBottomProfile").outerHTML = myEle;
    userProfieIndexData.currentlyBuilding = false;
    devMode()
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
    `;
    
    return ele;
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
    const updatedUI = await openPrivacyPage(res)
    document.getElementById("privacySettingsUI").innerHTML = updatedUI;
    document.getElementById("userEdit_privacySettings").addEventListener("submit", function (e) { e.preventDefault()})
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
        <p><b>Change your default feed</p></b>
        <hr class="rounded">
        <p>Current default feed is:<br><b>${currentDefaultOption.niceName}</b> selected ${selectedDate.sinceOrUntil == "current" ? "just changed" : `${selectedDate.sinceOrUntil == "since" ? selectedDate.value + " ago" : selectedDate.value}`}
    `;

    for (const feed of allowed) {
        if (!feed.speical) ele += `
        <div class="menu menu-style">
            <p>${feed.description}</p>
            <button class="menuButton menuButton-style ${getPref.preferredFeed==feed.name ? 'activeFeed' : ''}" onclick="changePref('${feed.name}')">${feed.niceName}</button>
            ${feed.name == "personal" ? `
                <div>
                    <div class="spacer_5px"></div>
                    <p>Reset personalized feed indexes and viewed posts</p>
                    <button class="menuButton menuButton-style" onclick="resetPersonalizedFeed()" id="resetPersonalFeed">Reset Personalized Feed</button>
                </div>
            ` : ``}
        </div>
        `
    }

    ele +="</div>"
    return ele;
}
async function resetPersonalizedFeed() {
    const reset = await sendRequest(`/feeds/personal/reset`, { method: "GET" });
    if (!reset || reset.error) return alert(`An error occurred while resetting feed${reset.error? `: ${reset.msg}`: ""}`);
    const changeFeedSettingsUI = await changeFeedSettings();
    document.getElementById("changeFeedSettingsUI").innerHTML = changeFeedSettingsUI;
    document.getElementById("resetPersonalFeed").innerHTML = "Reset Personalized Feed (Completed)";
    document.getElementById("resetPersonalFeed").disabled = true;
}

async function changePref(feedName) {
    const changed = changePrefAPI(feedName);
    if (!changed || changed.error) alert(`An error occurred while changing${changed.error? `: ${changed.msg}`: ""}`);
    const changeFeedSettingsUI = await changeFeedSettings();
    document.getElementById("changeFeedSettingsUI").innerHTML = changeFeedSettingsUI;
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
    if (!searchExport) alert("Error getting search settings");
    else return renderSearchSettings(searchExport);
}

function renderSearchSettings(searchExport) {
    const currentDefaultOption = searchExport.possibleSearch.find(versions => versions.name === searchExport.currentSearch.preferredSearch);
    const selectedDate = getTimeSince(searchExport.currentSearch.timestamp)
    
    var ele = `
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

    return ele;
}

async function changeSearchPref(searchVersion) {
    const searchExport = await sendRequest('/search/setting', { method: 'POST', body: { newSearch: searchVersion} });
    if (!searchExport || searchExport.error) alert(`An error occurred while changing${changed.error? `: ${changed.msg}`: ""}`);

    const changeSearchSettingsUI = renderSearchSettings(searchExport);
    document.getElementById("changeSearchSettingsUI").innerHTML = changeSearchSettingsUI;
}

async function changeEmailPage() {
    const emailData = await fetchClientEmailData();
    var createEditEmailSettingsUI = ""
    if (emailData.verified) {
        createEditEmailSettingsUI = await createEditEmailSettingsView(emailData.emailSettings);
    }

    const ele = `
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
                <div id="emailSettingOptions">${createEditEmailSettingsUI}</div>
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
    `

    // document.getElementById("emailPopup").innerHTML = ele;
    return ele;
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
    
    return ele;
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
    const createEditEmailSettingsUI = await createEditEmailSettingsView(res);
    document.getElementById("emailSettingOptions").innerHTML = createEditEmailSettingsUI;
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

    if (!res || res.error) return document.getElementById(`notificationsDiv`).innerHTML=`error while unsubscribing`
    else return document.getElementById(`notificationsDiv`).innerHTML=`Unsubscribed from all users.`
}

function hideBookmarks() {
    document.getElementById('bookmarksdiv').innerHTML=""
    document.getElementById('showBookmarksButton').innerHTML="Show Bookmarks"
}

async function showBookmarks() {
    if (document.getElementById('bookmarksAreShown')) return hideBookmarks()
    document.getElementById('showBookmarksButton').innerHTML="Hide Bookmarks"

    const res = await sendRequest(`/posts/bookmarks/`, { method: 'GET', ignoreError: true });
    if (!res || res.error) return document.getElementById("bookmarksdiv").innerHTML=`<div><hr class="rounded">No Bookmarks found.</div>`

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
        `
        for (const save of list) {``
            if (debug) console.log(save)
            const newData = await getPostAndProfileData(save)
            ele+= `
                <hr class="rounded">

                <div class="" id="bookmarkView_${save}">
                    ${newData.error ? `
                        <p>Deleted Post or Otherwise</p>
                    ` : `
                        ${postElementCreate(newData)}
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
    document.getElementById('notificationsDiv').innerHTML=""
    document.getElementById('showSubscriptionsButton').innerHTML="Show Subscriptions"
}

async function showSubscriptions() {
    if (document.getElementById('subscriptionsAreShown')) return hideSubscriptions()
    document.getElementById('showSubscriptionsButton').innerHTML="Hide Subscriptions"
    document.getElementById('showNotificationsButton').innerHTML="Show Notifications"

    const res = await sendRequest(`/notifications/subscriptions/`, { method: 'GET', ignoreError: true });
    if (!res || res.error) return document.getElementById('notificationsDiv').innerHTML=`No Subscriptions Found`

    var ele = `<hr class="rounded" id="subscriptionsAreShown"><p>${res.length} Subscriptions</p><hr class="rounded">`
    ele = ele+`<div><a id="unsuballbutton" onclick="unsubAll()">unsub from all users.</a><hr class="rounded"></div>`;

    for (const sub of res.reverse()) {
        const userData = await getUserDataSimple(sub._id) 
        var timesince
        if (userData.creationTimestamp) timesince = checkDate(userData.creationTimestamp)
    
        ele = ele + `
            <div id="subList_${userData._id}">
                <div class="publicPost posts-style">
                    <p class="${userData._id == currentUserLogin.userID ? "ownUser-style" : "otherUser-style"}" onclick="userHtml('${userData._id}')"> ${userData.displayName} @${userData.username} | ${userData.creationTimestamp ? timesince : '' }</p>
                    <p>${userData.description ? userData.description : "no description"}</p>
                    <p>Following: ${userData.followingCount} | Followers: ${userData.followerCount}</p>
                    ${userData._id == currentUserLogin.userID ? `` : `
                        <p id="follow_search_id_${userData._id}" onclick=
                        ${userData.followed===true ? 
                            `"unFollowUser('${userData._id}', 'follow_search_id_${userData._id}')">Unfollow User` :
                            `"followUser('${userData._id}', 'follow_search_id_${userData._id}')">Follow User`
                        }</p>
                    `}
                    <a onclick="unsubUser('${userData._id}', '${userData.username}')">Unsubscribe from User</a>
                    <p class="debug" onclick="copyToClipboard('${userData._id}')">${userData._id}</p>
                </div>
            </div>
        `
    }

    document.getElementById("notificationsDiv").innerHTML=ele
}

async function showSubscriptionsV2() {
    const res = await sendRequest(`/notificationCenter/subscriptions/`, { method: 'GET' });
    if (!res || res.error) return document.getElementById('showSubscriptionsButton').innerHTML=`error`

    var ele = `<hr class="rounded" id="subscriptionsAreShown"><p>${res.length} Subscriptions</p><hr class="rounded">`
    ele = ele+`<div><a id="unsuballbutton" onclick="unsubAll()">unsub from all users.</a><hr class="rounded"></div>`;

    for (const sub of res.reverse()) {
        const userData = await getUserDataSimple(sub._id) 
        var timesince
        if (userData.creationTimestamp) timesince = checkDate(userData.creationTimestamp)
    
        ele = ele + `
            <div id="subList_${userData._id}">
                <div class="publicPost posts-style">
                    <p class="${userData._id == currentUserLogin.userID ? "ownUser-style" : "otherUser-style"}" onclick="userHtml('${userData._id}')"> ${userData.displayName} @${userData.username} | ${userData.creationTimestamp ? timesince : '' }</p>
                    <p>${userData.description ? userData.description : "no description"}</p>
                    <p>Following: ${userData.followingCount} | Followers: ${userData.followerCount}</p>
                    ${userData._id == currentUserLogin.userID ? `` : `
                        <p id="follow_search_id_${userData._id}" onclick=
                        ${userData.followed===true ? 
                            `"unFollowUser('${userData._id}', 'follow_search_id_${userData._id}')">Unfollow User` :
                            `"followUser('${userData._id}', 'follow_search_id_${userData._id}')">Follow User`
                        }</p>
                    `}
                    <a onclick="unsubUser('${userData._id}', '${userData.username}')">Unsubscribe from User</a>
                    <p class="debug" onclick="copyToClipboard('${userData._id}')">${userData._id}</p>
                </div>
            </div>
        `
    }

    document.getElementById("notificationsDiv").innerHTML=ele
    devMode();
}


function hideNotifications() {
    document.getElementById('notificationsDiv').innerHTML=""
    document.getElementById('showNotificationsButton').innerHTML="Show Notifications"
}

function notificationsPage() {
    changeHeader("?notifications")
    const ele = `
        <div class="menu menu-style">
            <h1>Notifications</h1>
        </div>
            <div class="menu menu-style">
            <div>
                <button class="menuButton menuButton-style" id="showNotificationsButton" onclick="showNotifications()">Show Notifications</button>
                <button class="menuButton menuButton-style" id="showSubscriptionsButton" onclick="showSubscriptions()">Show Subscriptions</button>
                <!--<button class="menuButton menuButton-style" id="notificationSettingsPage" onclick="notificationSettingsPage()">Show Settings</button>-->
            </div>
            <div>
                <div id="notificationsDiv"></div>
            </div>
        </div>
    `
    document.getElementById("mainFeed").innerHTML = ele;
    showNotifications();
}

async function notificationSettingsPage() {
    const res = await sendRequest('/notificationCenter/preferences/', { method: 'GET' });
    if (!res || res.error) return;

    var ele = ``;
    for (const system of res.systemPreferences) {
        console.log(system)
        ele+=notificationPreferenceSystem(system.preferences, system.preferences.sectionTypes, system.system)
    }
    document.getElementById("notificationsDiv").innerHTML = ele;
}

function notificationPreferenceSystem(userPreferences, sectionTypes, system) {
    // if (!userPreferences || !sectionTypes || !system)
    console.log(userPreferences)
    return `
        <div class="menu menu-style">
            <div>
                <p><b>${system.name}</b></p>
                <p>${system.description}</p>
                <button class="menuButton menuButton-style" onclick="revealNotifPrefrences('${system.systemType}')">Show Preferences</button>
            </div>
            <div id="notif_pref_${system.systemType}" style="display:none;>
                <hr class="rounded">
                <p><b>Preferences</b></p>
                ${userPreferences.map((pref) => {
                    return `
                        <div class="menu menu-style">
                            <p>${pref.setting.name}</p>
                            <p>${pref.setting.description}</p>
                            <p>Enabled: ${pref.setting.enabled}</p>
                            <p>Last Updated: ${checkDate(pref.setting.timestampUpdated)}</p>
                        </div>
                    `
                }).join(" ")}
            </div>
        </div>
    `
}

function revealNotifPrefrences(systemType) {
    const ele = document.getElementById(`notif_pref_${systemType}`);
    if (ele.style.display == "none") ele.style.display = "";
    else ele.style.display = "none";
}

async function showNotifications() {
    const notificationAreShownID = `notificationsAreShown`
    if (document.getElementById(notificationAreShownID)) return hideNotifications()
    document.getElementById('showNotificationsButton').innerHTML="Hide Notifcations"
    document.getElementById('showSubscriptionsButton').innerHTML="Show Subscriptions"

    const res = await sendRequest(`/notifications/getList`, { method: 'GET', ignoreError: true });
    if (!res || res.error) return document.getElementById('notificationsDiv').innerHTML=`No Notifications Found`
    
    // var ele = `<hr class="rounded" id="notificationsAreShown"><p id="amount_notifications">${res.amountFound} Notifications</p><hr class="rounded">`
    // ele = ele+`<div><a id="dismissAll" onclick="dismissAll()">dismiss all notifications.</a><hr class="rounded"></div>`;
    var ele = `
        <hr class="rounded" id="${notificationAreShownID}">
        <p id="amount_notifications">${res.notifications.length} Notifications</p>
        <hr class="rounded">
        <div><a id="dismissAll" onclick="dismissAll()">dismiss all notifications.</a><hr class="rounded"></div>
    `;
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

async function showNotificationsV2(indexID) {
    const notificationAreShownID = `notificationsAreShown${indexID ? `_${indexID}`: '' }`
    if (document.getElementById(notificationAreShownID)) return hideNotifications()
    document.getElementById('showNotificationsButton').innerHTML="Hide Notifcations"
    document.getElementById('showSubscriptionsButton').innerHTML="Show Subscriptions"

    const res = await sendRequest(`/notificationCenter/notifications/${indexID ? indexID : ''}`, { method: 'GET' });
    if (!res || res.error) return document.getElementById('showNotificationsButton').innerHTML=`error`
    
    var ele = `
        <hr class="rounded" id="${notificationAreShownID}">
        <p id="amount_notifications">${res.notifs.length} Notifications</p>
        ${res.prevIndex ? `<button class="menuButton menuButton-style" onclick="showNotifications('${res.prevIndex}')">Load previous notifications</button>` : ''}
        ${res.nextIndex ? `<button class="menuButton menuButton-style" onclick="showNotifications('${res.nextIndex}')">Load next notificaitons</button>` : '' }
        <hr class="rounded">
        <div><a id="dismissAll" onclick="dismissAll()">dismiss all notifications.</a><hr class="rounded"></div>
    `;

    for (const notif of res.notifs.reverse()) {
        ele+=`<div class="" id="notification_${notif._id}">`
        
        if (notif.notifSubType == 1) {
            ele += postElementCreateFullEasy(notif.postData);
        } else if (notif.notifSubType == 2) {
            ele += followingFollowerSingleElement(notif.userData, notif?.followData);
        }
        
        ele +=`
                <div class="spacer_5px"></div>
                <p class="debug">type: ${notif.notifType._id}</p>
                <p>${notif.notifType.name}</p>
                <p>${notif.subject}</p>
                <button class="menuButton menuButton-style" onclick="dismissNotification('${notif._id}')">Dismiss Notification.</button>
            </div>
        `
    }
    
    document.getElementById("notificationsDiv").innerHTML=ele
    devMode();
    return;
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
    const res = await sendRequest(`/posts/get/full/${postID}`, { method: 'GET' });
    if (!res || res.error) return showModal("<p>Post was not found</p>")

    const user = res.userData
    if (debug) console.log(user)
    const ele = postElementCreate(res)
    // document.getElementById('mainFeed').innerHTML=ele
    showModal(`<div><h1 class="font_h1-style">Post Found</h1><button class="menuButton menuButton-style" onclick="openPostSeperate('${postID}')">Open Post</button>${ele}</div>`)
}

async function openPostSeperate(postID) {
    closeModal();
    const res = await sendRequest(`/posts/get/full/${postID}`, { method: 'GET' });
    if (!res || res.error) return showModal("<p>Post was not found</p>")

    const user = res.userData
    if (debug) console.log(user)
    const ele = postElementCreate(res)
    document.getElementById('mainFeed').innerHTML=ele
}

async function getUserDataSimple(userID) {
    const res = await sendRequest(`/users/get/basic/${userID}`, { method: 'GET' });
    if (!res || res.error) return 
    else return res
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
    const res = await sendRequest(`/get/developer/`, { method: 'GET' });
    if (!res || res.error) return document.getElementById(`showDevDiv`).innerText = "Error while requesting data"

    var firstEle = `
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
    
    return ele;
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
    const postData = await sendRequest(`/posts/get/full/${postID}`, { method: 'GET', ignoreError: true});

    if (!postData || postData.error) return {error: `${postData.error ? postData.error : "an unknown error"}`};
    if (debug) console.log(postData);
    
    return postData;
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

async function activeSearchBar(rerender=false) {
    if (!rerender && document.getElementById("searchArea").innerHTML) return;

    changeHeader("?searchPage")
    document.getElementById("searchArea").innerHTML = `
        <div class="searchSelect search menu-style">
            <input id="searchBarArea" class="menu-style" onkeyup="searchSocial()" placeholder="Search for Posts and Users...">
        </div>
    `

    document.getElementById('mainFeed').innerHTML = loadingHTML("Searching...");

    const exploreData = await sendRequest(`/search/v2/explore`, { method: 'GET' });
    if (!exploreData || exploreData.error) {
        document.getElementById('mainFeed').innerHTML = `<div class="menu menu-style">
            <h1>Error while rendering explore page</h1>
            <p>${exploreData.error ? exploreData.error : "An unknown error occurred"}</p>
        </div>`;
        return;
    }

    if (debug) console.log(exploreData)
    const ele = `
        ${exploreData.hashtagsFound?.length > 0 ? `<div><h1 class="publicPost posts-styles font_h1-style">Newest Hashtags</h1>` : ""}
        ${exploreData.hashtagsFound?.map(function(hashtagFound) {
            if (debug) console.log(hashtagFound)
            return hashtagElementCreate({tag: hashtagFound.tagText})
        }).join(" ")}
        ${exploreData.usersFound.length > 0 ? `<div><h1 class="publicPost posts-styles font_h1-style">Newest Users</h1>` : ""}
        ${exploreData.usersFound.reverse().map(function(user) {
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
        ${exploreData.postsFound.length > 0 ? `<div><h1 class="publicPost posts-styles font_h1-style">Newest Posts</h1>` : ""}
        ${exploreData.postsFound.reverse().map(function(postArray) {
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
        ${exploreData.postsFound.length > 0 ? `</div>` : ""}
    `;

    document.getElementById('mainFeed').innerHTML = ele ;
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
        if (!stopLoadingFeed) requestAnimationFrame(drawLoadingCircle);
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
    stopLoadingFeed = false;

    if (currentFeed && (feedToUse == currentFeedType)) return buildView(currentFeed)
    if (debug) console.log("loading feed")

    const params = await checkURLParams()
    if (params.paramsFound != false) return 

    document.getElementById('mainFeed').innerHTML=loadingHTML("Loading feed...");
    listenForLoading();
    buildCopostRequests()
    var url = `/feeds/${feedToUse}`
    if (feedToUse == "userFeed" || feedToUse=="allPosts" || "personal") url+="/v2"
    const data = await sendRequest(`${url}`, { method: 'GET', ignoreError: true })
    changeFeedHeader(feedToUse);

    if (data.feedVersion == 2){
        currentFeedType = feedToUse;
        currentFeed = data.posts.reverse();
        prevIndexID = data.prevIndexID;
    
        if (params.paramsFound == false) {
            buildView(data.posts)
            return;
        }
        else return
    }

    if (!data || !data[0]) {
        stopLoadingFeed = true;
        document.getElementById('mainFeed').innerHTML=`
            <div id="loadingSection" class="loading menu menu-style">
                <h1 class="h2-style">You've reached the end of the feed! Check out the other feeds or adjust your personalization settings!</h1>
            </div>
        `
        return;
        // return showModal("<p>There was no data in the feed selected, please load a different feed</p>")
    }
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
            if (document.getElementById("addToBottomProfile")) return addNextIndexProfile();
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
    const postData = await sendRequest(`/posts/get/full/${postID}`, { method: 'GET', headers})
    if (!postData || postData.error) return false;
    const { postData:post, userData:user } = postData;

    await showModal(`
        <h1>Create a Quote Post</h1>
        <div class="postModalActions">
            <button class="menuButton menuButton-style" onclick="createPost({'quoteID':'${postID}'})">Upload Post</button>
            <button class="menuButton menuButton-style" onclick="closeModal()">Close</button>
            <button onclick="getPostSuggestions('modal', '${postID}')" class="menuButton menuButton-style">Get Suggestion</button>
        </div>
        <hr class="rounded">
        <div class="post">
            <div>${postElementCreate({post: post, user: user, type: "basic"})}</div>
        </div>
        <textarea class="postTextArea" id="newPostTextArea"></textarea>
        <div id="foundAIPostSuggestions"></div>
        <div id="foundTaggings"></div>
    `, "hide")
}

async function replyPost(postID) {
    const postData = await sendRequest(`/posts/get/full/${postID}`, { method: 'GET', headers})
    if (!postData || postData.error) return false;
    const { postData:post, userData:user } = postData;

    await showModal(`
        <h1>Create a new Reply</h1>
        <div class="postModalActions">
            <button class="menuButton menuButton-style" onclick="createPost({'replyID':'${postID}'})">Upload Reply</button>
            <button class="menuButton menuButton-style" onclick="closeModal()">Close</button>
            <button onclick="getPostSuggestions('modal', '${postID}')" class="menuButton menuButton-style">Get Suggestion</button>
        </div>
        <hr class="rounded">
        <div class="post">
            <div>${postElementCreate({post: post, user: user, type: "basic"})}</div>
        </div>
        <textarea class="postTextArea" id="newPostTextArea"></textarea>
        <div id="foundAIPostSuggestions"></div>
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
        <div class="publicPost posts-style" onclick="searchResult('${tag.tag}')">
            <p>${tag.tag}</p>
        </div>
    `
}

async function searchResult(input) {
    if (!input) {
        if (debug) console.log("returning to feed")
        changeHeader('?searchPage')
        addWritingToSeachBar('')
        return activeSearchBar(true)
    }
    if (currentSearch == input){
        if (debug) console.log("same search")
        return console.log("same")
    }

    var headerReplace = input;
    
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

async function createPostPage(useModal=false) {
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
        <div class="menu menu-style">
            <h1>Create Post</h1>
        </div>
        <div id="postPageDiv" class="menu menu-style">
            <p><b>Create a new Post</b></p>
            <div class="postPageInput">
            <textarea class="postTextArea" onkeyup="onTypePostPage()" id="newPostTextArea">${data?.content ? data.content : ""}</textarea>
            </div>
            <div class="mainActions">
                <div id="foundTaggings"></div>
                <p class="menuButton menuButton-style" onclick="leavePostPage()">Back</p>
                <p class="menuButton menuButton-style" id="publishFromPostPage" onclick="publishFromPostPage()">Upload Post</p>
                <p class="menuButton menuButton-style" id="mediaCreationButton" onclick="showMediaCreation()">Add Media</p>
                <p class="menuButton menuButton-style" id="pollCreationButton" onclick="showPollCreation()">Add Poll</p>
                <p class="menuButton menuButton-style" id="coposterCreationButton" onclick="showCoPostersCreation()">Add Co-Posters</p>
                <p class="menuButton menuButton-style" id="getSuggestionsButton" onclick="getPostSuggestions('main', '')">Get Suggestion</p>
                <div class="menuButton menuButton-style">
                    <p onclick="exportPostHeaderURL()">Create Post Template</p>
                    <p id="postURL_preview"></p>
                    <p id="postURL_messageURL"></p>
                </div>
            </div>
            <input type="text" id="pollCreateLink" class="addPollOption menu-style" placeholder="Link Poll via ID" ${data.pollID ? `value="${data.pollID}"` : ""}></input>
            <div id="foundAIPostSuggestions"></div>
            <div id="mediaAdd"></div>
        </div>
        <div id="coposterAddingArea"></div>
        <div id="pollCreate"></div>
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
    if (debug) console.log("showing co-posters")
    const coposterAddingArea = document.getElementById("coposterAddingArea");

    if (coposterAddingArea.innerHTML!="") {
        document.getElementById("coposterCreationButton").innerHTML = "Add Co-Posters"

        coposterAddingArea.innerHTML = "";
        return;
    }
    
    coposterAddingArea.innerHTML = `
        <hr class="rounded">
        <div id="copostersShown" class="menu menu-style">
            <h2>Add Coposters</h2><hr class="rounded">

            <div id="addCoPoster">
            </div>
            <div id="foundTaggings_coPostersInput"></div>
        </div>
    `;

    document.getElementById("coposterCreationButton").innerHTML = "Remove Co-Posters"
    const ele = `
        <div class="menu menu-style">
            <p>Co-Posters</p>
            <input type="text" onkeyup="socialTypePost('coPostersInput', true)" id="coPostersInput" class="addPollOption menu-style" placeholder="Add Co-Poster"></input>
            <div id="coPostersDiv"></div>
        </div>
    `;

    document.getElementById("addCoPoster").innerHTML = ele;
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

function pausePostUploadButton() {
    if (debug) console.log("pausing post upload button")
    document.getElementById('publishFromPostPage').innerHTML = "Please Wait"
    document.getElementById('publishFromPostPage').onclick = null;
}

function resumePostUploadButton() {
    if (debug) console.log("resuming post upload button")
    document.getElementById('publishFromPostPage').innerHTML = "Upload Post"
    document.getElementById('publishFromPostPage').onclick = publishFromPostPage;
}

function removeMediaCreation() {
    if (debug) console.log("creating media")
    document.getElementById("mediaAdd").innerHTML = "";
    document.getElementById("mediaCreationButton").onclick=showMediaCreation;
    document.getElementById("mediaCreationButton").innerHTML="Add Media";
}

function showMediaCreation() {
    if (debug) console.log("creating media")
    document.getElementById("mediaCreationButton").onclick=removeMediaCreation;
    document.getElementById("mediaCreationButton").innerHTML="Remove Media";

    const ele = `
        <div class="menu menu-style">
            <h1 class="font_h1-style">Add Media</h1>
        </div>
        <div class="menu menu-style">
            <input type="file" id="interactFile" class="menuButton menuButton-style">
            <button onclick="uploadFile()" id="uploadMedia" class="menuButton menuButton-style">Upload Media</button>
        </div>
    `
    document.getElementById("mediaAdd").innerHTML = ele;
}

async function uploadFile(fromProfile=false) {
    const fileInput = document.getElementById('interactFile');
    const selectFile = fileInput.files[fileInput.files.length-1];
    if (!selectFile) {
        console.error('No file selected');
        return;
    }

    const formData = new FormData();
    formData.append('file', selectFile);

    if (debug) console.log('Uploading file:', selectFile);
    try {
        if (!fromProfile) pausePostUploadButton();
        const fileType = await sendRequest('/cdn/fileType/' + selectFile.name, {method: "GET"});
        if (debug) console.log(fileType);

        if (fileType.error) {
            console.error('Error verifying file:', fileType.error);
            document.getElementById("mediaAdd").innerHTML = `<p>Error uploading file</p>`;
            return;
        }
        
        const finalRes = await sendRequest('/cdn/'+fileType.type, {
            method: 'POST',
            body: formData,
            file: true
        });

        if (debug) console.log('finalRes:', finalRes);
        
        mediaUploadLinks.push(finalRes.cdnURL);
        if (!fromProfile) {
            document.getElementById('newPostTextArea').value = document.getElementById('newPostTextArea').value + `${config[config.current].api_url}/cdn${finalRes.cdnURL}`;
            document.getElementById('newPostTextArea').focus()
    
            displayFile(`${apiURL}/cdn${finalRes.cdnURL}`);
            resumePostUploadButton()
        }
        return finalRes;
    } catch (error) {

        document.getElementById("mediaAdd").innerHTML = `<p>Error uploading file</p>`;
        resumePostUploadButton();
        console.error('Error uploading file:', error);
    }
}

function displayFile(fileURL) {
    const fileContainer = document.getElementById('mediaAdd');
    // fileContainer.innerHTML = ''; // Clear any previous content
    const imageContent = checkForImage(fileURL)
    const img = document.createElement('div');
    img.innerHTML = imageContent.attachments.map(function(attachment) {return `${attachment}`}).join(" ");
    fileContainer.appendChild(img);
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
        <div class="menu menu-style">
        <h2>Create New Poll</h2>
        <hr class="rounded">
        <div class="mainActions">
            <p class="publicPost menuButton menuButton-style" onclick="addExtraOption()">Add Another Option</p>
            <p class="publicPost menuButton menuButton-style" onclick="removeLastOption()">Remove Newest Option</p>
        </div>
        <hr class="rounded">
        <div id="pollCreation">
            <div id="optionAmount"></div>
            <div class="menu menu-style">
                <p><u>Question</u></p>
                <input type="text" id="pollCreateTitle" class="addPollOption menu-style" placeholder="Question">
            </div>
            <div id="options">${addOption(1)}${addOption(2)}</div>
        </div>
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
        <div class="pollOption menu menu-style" id="option_${num}">
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

// AI FEATURES
// summary of post/thread
async function getPostSuggestions(type, postID) {
    const suggestionsDiv = document.getElementById('foundAIPostSuggestions');
    const foundContent = document.getElementById('newPostTextArea').value;
    suggestionsDiv.innerHTML = `<p>Loading Suggestion...</p>`;
    
    const suggestionPost = await sendRequest(`/ai/suggestion/${postID ? postID : ""}`, {
        method: 'POST',
        body: { content: foundContent }
    });

    if (!suggestionPost || suggestionPost.error) {
        return suggestionsDiv.innerHTML = `<p>Suggestion Failed</p>`;
    }
    
    aiSuggestions.push(suggestionPost.response);
    foundAIPostSuggestions.innerHTML = `
        <div class="publicPost posts-style">
            <p>AI Suggestion</p>
            <hr class="rounded">
            <p onclick="useSuggestion(${amountSuggestions})">${suggestionPost.response}</p>
        </div>
    `;
    amountSuggestions++;
}

function useSuggestion(suggestion) {
    document.getElementById('newPostTextArea').value = aiSuggestions[suggestion];
    document.getElementById('foundAIPostSuggestions').innerHTML = "";
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

// For API Use
async function sendRequest(request, { method, body, file, extraHeaders, ignoreError=false }) {
    // add "version" as a possible header, and .replace on the apiURL
    // or force the version be in the request
    var headersEdited = {};

    if (extraHeaders || file) {
        headersEdited = { ...headers };
        if (extraHeaders) {
            for (const header in extraHeaders) {
                headersEdited[header] = extraHeaders[header];
            }
        }

        if (file) {
            for (const header in headersEdited) {
                if (header == 'Content-Type') {
                    // remove header
                    delete headersEdited[header];
                }
            }
        }
    }

    if (debug) console.log(`Sending Request: ${method} ${apiURL}${request}`);

    const response = await fetch(`${apiURL}${request}`, {
        method: method || 'GET',
        body: body ? !file ? JSON.stringify(body) : body : null,
        headers : extraHeaders || file ? headersEdited : headers
    });
    
    try {
        const data = await response.json();
        if (debug) console.log(data);
        if (data.error && !ignoreError) {
            showModal(`<h1>Error Occurred</h1><p>${data.code}: ${data.msg}</p>`);
            return data;
        }

        return data;
    } catch(err) {
        if (!ignoreError) {
            showModal(`<h1>Error Occurred</h1><p>Unknown Error.</p>`);
        }
        return { error : true };
    }
}

function getId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (!match || match.length < 2) return undefined;

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

function openImagePreview(imageURL) {
    showModal(`<div><h1>Image</h1><hr class="rounded"h><img width="60%" height="60%" src="${imageURL}"></img></div>`)
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
                        contentArgs[index] = `<a class="ownUser-style" onclick="userPage('${tag.tagTextOriginal.replace("@", "")}')">${contentArgs[index]}</a>`
                    } else if (tag.tagTextOriginal.startsWith("#")) {
                        contentArgs[index] = `<a class="ownUser-style" onclick="searchResult('${tag.tagTextOriginal.replace("#", "1")}')">${contentArgs[index]}</a>`
                    }
                }
            }
        }
        //if (contentArgs[index].includes(' ')) contentArgs[index] = contentArgs[index].replace(' ', '')
        if (contentArgs[index].startsWith('https://') || (config.current == 'dev' && contentArgs[index].startsWith('http://'))) {
            for (const imageFormat of imageFormats) {
                if (contentArgs[index].endsWith(imageFormat)) {
                    foundImage = true
                   // contentArgs[index] = `<img class="messageImage" src="${contentArgs[index]}"></img>`
                    attachments.push(`<img alt="userImage" class="messageImage" width="320px" src="${contentArgs[index]}" onclick="openImagePreview('${contentArgs[index]}')"></img>`)
                }
            }

            const videoId = getId(contentArgs[index]);
            var foundVideo = false;
            for (const videoFormat of videoFormats) {
                if (foundVideo || !contentArgs[index].includes(videoFormat.urlEnd)) {
                }
                else if (contentArgs[index].startsWith("http://localhost:5002/v1/cdn/static")) {
                    foundImage = true
                    foundVideo = true
                    const URL = contentArgs[index]
                    var videoID = URL.replace("http://localhost:5002/v1/cdn/static/", "")
                    
                    const iframeHuelet = `<iframe src="http://localhost:5002/v1/video_embed/?embed=true&vuid=${videoID}" width="320" height="240" frameborder="0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen="true"></iframe>`
                    attachments.push(iframeHuelet)
                }
                else if (contentArgs[index].startsWith("https://interact-api.novapro.net/v1/cdn/static")) {
                    foundImage = true
                    foundVideo = true
    
                    const URL = contentArgs[index]
                    var videoID = URL.replace("https://interact-api.novapro.net/v1/cdn/static/", "")
                    
                    const iframeHuelet = `<iframe src="https://interact-api.novapro.net/v1/video_embed/?embed=true&vuid=${videoID}" width="320" height="240" frameborder="0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen="true"></iframe>`
                    attachments.push(iframeHuelet)
                }
                else if (contentArgs[index].endsWith(videoFormat.urlEnd)) {
                    // regular video 
                    foundImage = true
                    foundVideo = true
                    //contentArgs[index] = `\n<video width="320" height="240" controls><source src="${contentArgs[index]}" type="video/${videoFormat.type}"></video>`
                    attachments.push(`<video alt="uservideo" width="320" height="240" controls><source src="${contentArgs[index]}" type="video/${videoFormat.type}"></video>`)
                }
            }

            if (videoId) {
                foundImage = true
                const iframeMarkup = `<iframe title="uservideo" width="320" height="240" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
               // contentArgs[index] = iframeMarkup
                attachments.push(iframeMarkup)
            }
            // if (contentArgs[index].startsWith("https://interact.novapro.net/?videoID=") || contentArgs[index].startsWith("https://interact-api.novapro.net/v1/cdn/static")) {
            //     foundImage = true

            //     const URL = contentArgs[index]
            //     var videoID = URL.replace("https://huelet.net/w/", "")

            //     const iframeHuelet = `<iframe src="https://publish.huelet.net/?embed=true&vuid=${videoID}" width="320" height="240" frameborder="0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen="true"></iframe>`
            //     attachments.push(iframeHuelet)
            // }
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
