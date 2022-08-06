// var websocketenabled
var ws
var currentGroup = null
var roomID
var defaultRoomID = "0001"
var loginUserToken = false
var currentUserLogin = { }
var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var sendTypeStop
var amountTyping

crypto = crypto || window.crypto;
// var baseURL
var headers = {
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}
var verifiedConnection = false

// console.log(config.dev.websocket_url)
var wsURL = `${config ? `${config.current == "prod" ? config.prod.websocket_url : config.dev.websocket_url}` : 'https://interact-api.novapro.net/v1' }`
var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`

if (location.protocol !== 'https:' && !((/localhost|(127|192\.168|10)\.(\d{1,3}\.?){2,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3}\.?){2}/).test(location.hostname))) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
} else {
    checkLogin()
}

async function launchEnc(){
    const userTokenAsSalt = await crypto.subtle.digest("SHA-256", localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN));
    let password = await crypto.subtle.digest("SHA-256", document.getElementById("encPassword").value);
    let key = new TextEncoder(password);
    key = await crypto.subtle.importKey("raw", key, "PBKDF2", false, ["deriveBits", "deriveKey"]);
    key = await crypto.subtle.deriveKey({
        "name":"PBKDF2", 
        salt:userTokenAsSalt, 
        "iterations":100000, 
        "hash": "SHA-256"
    }, 
    key, 
    {
        "name": "AES-GCM",
        "length": 256
    }, true, ["encrypt", "decrypt"]);
    let storedKey = crypto.subtle.exportKey("raw", key);
    localStorage.setItem("PBKDF2Key", storedKey);

    

}



function sendTokensDebug() {
    const authSend = {
        type: 10,
        apiVersion: "1.0",
        userID: currentUserLogin.userID,
        mesType: 2,
        tokens: headers
    }

    ws.send(JSON.stringify(authSend))
}

setDimennsions()
// document.getElementById("messageTypingForm").addEventListener("submit", function (e) { e.preventDefault()})
function setDimennsions() {
    var height = document.getElementById("html").clientHeight
    var width = document.getElementById("html").clientWidth

    // var width = window.innerWidth;
    // console.log(width)
    width = width - 200
    // console.log(width)
    // console.log(document.getElementById('mainGroupArea').style.width)

    document.getElementById('currentGroupsArea').style.width="100px"
    document.getElementById('mainGroupArea').style.width=`${width}px`
    document.getElementById('currentGroupsAreaRight').style.width="100px"
}

var clientTypingAct = {
    typing: false,
    typingTime: 0,
}

function getTime() {
    const d = new Date();
    const currentTime = d.getTime()
    return currentTime
}

async function checkLogin() {
    // console.log'running 3')

    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    if (userStorageLogin) {
        currentUserLogin = JSON.parse(userStorageLogin)
        headers.accesstoken = currentUserLogin.accessToken
        headers.usertoken = currentUserLogin.userToken
        headers.userid = currentUserLogin.userID
        // console.logheaders)
        loginUserToken = true
    }
    // console.log'running 4')

    if (!loginUserToken) return window.location.href = "/begin/?live-chat";
    else return checkWebSocket()
}

// checkWebSocket()
// checkRoomID()

function checkRoomID() {
    const paramsData = checkURLParams()
    if (paramsData.param) {
        for (const currentParam of paramsData.paramTypes) {
            roomID = currentParam.roomID
            if (currentParam.roomID) return roomID
        }
    }
    return defaultRoomID
}

function createNewGroup() {
    var ele = `
        <h1>Create a new group</h1>
        <div class="messageType">
            <form onsubmit="addUsers()" onkeyup="searchUsers()" id="groupCreateForm">
                <input type="text" id="groupCreateInput" placeholder="Tag your users!">
            </form>
            <form id="groupNameForm">
                <input type="text" id="newGroupName" placeholder="Choose a new group name!">
            </form>
        </div>
        <a onclick="createGroup()">Create</a>
        <p>Amount Users Added<p id="amountUsersNewGroup">0</p></p>
        <div id="currentlyAdded"></div>
        <div id="possibleAdds" class="borderArea"></div>
    `

    document.getElementById("mainGroupArea").innerHTML=ele
    document.getElementById("groupCreateForm").addEventListener("submit", function (e) { e.preventDefault()})
    document.getElementById("groupNameForm").addEventListener("submit", function (e) { e.preventDefault()})

}

async function searchUsers() {
    const searchUser = document.getElementById('groupCreateInput').value
    if (!searchUser) return document.getElementById('possibleAdds').innerHTML=``
    
    const response = await fetch(`${apiURL}/get/taguserSearch/${searchUser}`, {
        method: 'GET',
        headers,
    });
    // console.log(response)

    const res = await response.json();
    // if (debug) console.log(res)
    if (res.error) return;
    var usersEle=""
    for (const index of res) {
        usersEle+=`
            <div class="borderArea" onclick="changeUserAddInput('${index.user.username}')">
                <p>${index.user.username}</p>
                ${index.user.discription ? `<p>${index.user.description}</p>` : ``}
                <p>${index.possiblity}% match</p>
            </div>
        `
    }
    document.getElementById('possibleAdds').innerHTML=usersEle
}
function changeUserAddInput(username) {
    document.getElementById('groupCreateInput').value=username
}
function addUsers() {
    var amountUsers = document.getElementById("amountUsersNewGroup").innerText
    var value = document.getElementById("groupCreateInput").value
    const num = parseInt(amountUsers)
    const newNum = num+1
    document.getElementById("amountUsersNewGroup").innerText=newNum
    document.getElementById('currentlyAdded').innerHTML+=`<p id="userAdd_${newNum}">${value}</p>`
    document.getElementById("groupCreateInput").value=""
    document.getElementById('possibleAdds').innerHTML=""
}

async function createGroup() {
    var members = parseInt(document.getElementById("amountUsersNewGroup").innerText)
    var groupName = document.getElementById("newGroupName").value;
    var addingMembers = []

    for (let i=0; i<members; i++) {
        const username = document.getElementById(`userAdd_${i+1}`).innerText
        const response = await fetch(`${apiURL}/get/username/${username}`, {
            method: 'GET',
            headers,
        });
    
        const res = await response.json();
        // if (debug) console.log(res)
        // console.log(res)
        if (res.error) return;
        addingMembers.push(res._id)
    }

    const sendData =  {
        type: 202,
        addUsers: addingMembers,
        groupName
    }
    // console.log(sendData)
    ws.send(JSON.stringify(sendData))
    document.getElementById("mainGroupArea").innerText="<p>Created Group.</p>"
}


function checkWebSocket() {
    // console.log'running 5')

    if ("WebSocket" in window) {
        document.getElementById("actiondescription").innerHTML = `
            WebSocket is supported by your Browser
        `

        ws = new WebSocket(`${wsURL}?userID=${currentUserLogin.userID}`)

        ws.onopen = function() {
           // ws.send({'test': 'test'})
         //   ws.close()
        }

        ws.onmessage = function (evt) { 
            const data = JSON.parse(evt.data)
            /*
            const authSend = {
                "type": 10,
                "apiVersion": "1.0",
                "userID": currentUserLogin.userID,
                "tokens": headers,
            };
            console.log(authSend)
            
            ws.send(JSON.stringify(authSend));*/
            // console.log(data)
            //console.log(data.type)

            switch (data.type) {
                case 10:
                    if (data.mesType==1) {
                        const authSend = {
                            type: 10,
                            apiVersion: "1.0",
                            userID: currentUserLogin.userID,
                            mesType: 2,
                            tokens: headers
                        }
                        ws.send(JSON.stringify(authSend))
                    } else if (data.mesType==4) {
                        verifiedConnection = true
                        ws.send(JSON.stringify({
                            type: 201,
                            apiVersion: "1.0"
                        }))
                    }
                    break;

                case 200: 
                    break;
                case 201: 
                    createSidebar(data)
                    break;
                case 204: 
                    if (data.groupID)  {
                        removeGroupFromList(data.groupID)
                    }
                    break;
                case 210:
                    // if (data.message._id == currentGroup) {
                        addToGroupDM(data)
                    // }
                    break;
                case 211: 
                /*
                    type: 211,
                    user,
                    index: responseData.index,
                    messages: responseData.messages,
                        user
                        message
                    groupData: responseData.groupData
                */
                    for (const message of data.messages) {
                        addToGroupDM(message)
                    }
                    // console.log('211')
                    break;
                case 404:
                    break;
                    
                    break;
            }
        };
            
        ws.onclose = function() {  
            // websocket is closed.
            document.getElementById("actiondescription").innerHTML = `
                Connection is closed...
                <p onclick="checkWebSocket()">Click to reconnect.</p>
            `
        };
    } else {
        document.getElementById("actiondescription").innerHTML = `
            WebSocket NOT supported by your Browser!
        `
    }
}

function removeGroupFromList(groupID) {
    const foundSidebar = document.getElementById(`sidebarGroup_${groupID}`);
    const foundMain = document.getElementById(`openedGroup_${groupID}`);
    if (foundSidebar) foundSidebar.remove();
    if (foundMain) foundMain.remove();
    return true;
};

async function createSidebar(userGroupsData) {
    var sidebarEle = `<div id="action"></div>`

    for (const group of userGroupsData.userGroups.groups) {
        // console.log(group)
        const data = await getGroupData({ groupID: group._id })
        if (!data.error) {
            /*
                groupData : {
                    __v: 0
                    _id: "e4374fc6-8e39-4bc1-ade9-aa87054d1adc"
                    created: 1659060056257
                    groupName: "New Group."
                    owner: "d1f32225-a940-48ed-bff9-22efd5636cbd"
                    users: [
                        _id: "d1f32225-a940-48ed-bff9-22efd5636cbd"
                    ]
                },
                success: true
            */

            sidebarEle+=`
                <div id="sidebarGroup_${data.groupData._id}" onclick="openGroup('${data.groupData._id}')">
                    <p>${data?.groupData?.groupName}</p>
                </div>
            `
        }
    }
    document.getElementById("currentGroupsArea").innerHTML=sidebarEle
}

function sendGroupMessage(groupID) {
    var input = document.getElementById('groupMessageBar').value;
    if (!input) return document.getElementById("actiondescription").innerHTML = `There is no text included`        
    document.getElementById('groupMessageBar').value = "";

    var sendData = {
        groupID,
        "content" : input,
        type: 210
    }

    ws.send(JSON.stringify(sendData))
}

function clearAction() {
    document.getElementById("action").innerHTML=""

}

function addToGroupDM(data) {
    /*
        var sendNewMessage = {
            type: 210,
            user,
            message: newMessage.messageData,
            group: newMessage.groupData
        }
    */

    if (data.message.groupID != currentGroup) {
        document.getElementById("action").innerHTML = `<p onclick="openGroup('${data.message.groupID}')">new message</p><hr />`
        setTimeout(clearAction, 5000);
    }
    console.log(data)
    if (!data.user) return
    if (!data.message) return

    var timestamp = data.message.timestamp
    var messageID = data.message._id
    var userID = data.user._id
    var groupID = data.message.groupID
    var username = data.user.username
    var displayName = data.user.displayName
    var content = data.message.content

    var timesince
    if (timestamp) timesince = checkDate(timestamp)
    // console.log(data)
    const imageContent = checkForImage(content)

    // console.log(data.message)
    document.getElementById(`messages_${groupID}`).innerHTML+=`
        <div class="message" id="${messageID}">
            <p class="subheaderMessage ${userID == currentUserLogin.userID ? "ownUser" : "otherUser"}">${displayName} @${username} | ${timesince}</p>
            <div class="contentMainArea" id="contentMainArea_${messageID}">
                <p class="contentMessage" id="contentArea_${messageID}">${imageContent.content}</p>
            </div>
            <div class="messageActions">
            </div>
        </div>
    `;

    /*
    document.getElementById("messages_").innerHTML+=`
        <div class="message" id="${messageID}">
            <p class="subheaderMessage ${userID == currentUserLogin.userID ? "ownUser" : "otherUser"}">${displayName} @${username} | ${timesince}</p>
            <div class="contentMainArea" id="contentMainArea_${messageID}">
                <p class="contentMessage" id="contentArea_${messageID}">${imageContent.content}</p>
                ${data.message?.edited ? '<p class="edited contentMessage"><i>(edited)</i></p>' : ''}
                ${data.message?.replyTo ? `<a class="edited contentMessage" href="#${data.message.replyTo}" onclick="highlightMessage('${data.message.replyTo}')"><i>(replying)</i></a>` : ''}
            </div>
            <div class="messageActions">
                <div id="replyDiv_${data._id}"><p onclick="replyToMessage('${messageID}')">Reply</p></div>
                ${data.type==2 && user._id == currentUserLogin.userID  ?  `
                    <p id="deleteButton_${messageID}"><p onclick="deleteMessage('${messageID}')">Delete</p></p>
                    <div id="editButton_${data._id}"><p onclick="editMessage('${messageID}', '${data.message.edited ? true : false}')">Edit</p></div>
                ` : `` }
            </div>
        </div>
    `;
    */

    // var objDiv = document.getElementById("messages");

    // objDiv.scrollTop = objDiv.scrollHeight;
};

async function openGroup(groupID) {
    currentGroup = groupID
    document.getElementById("mainGroupArea").innerHTML=""
    document.getElementById("currentGroupsAreaRight").innerHTML=""

    const data = await getGroupData({ groupID }) 

    document.getElementById('mainGroupArea').innerHTML=`
        <div id="openedGroup_${groupID}">
            <p>Pretend like i opened a new chat! ${groupID}</p>
            <hr></hr>
            <div class="messageType">
                <form onsubmit="sendGroupMessage('${groupID}')" id="messageGroupBar">
                    <input type="text" id="groupMessageBar" spellCheck="false" placeholder="Type your message!">
                </form>
            </div>
            <hr></hr>
            <div id="messages_${groupID}"></div>
        </div>
    ` 
    document.getElementById("messageGroupBar").addEventListener("submit", function (e) { e.preventDefault()})


    var rightSideBarEle = `
        <p onclick="deleteGroup('${groupID}')">Delete.</p>
    `
    // <p onclick="addUser()">Add User.</p>

    for (const user of data.groupData.users) {
        const userData = await getUserDataSimple(user._id)
        if (!userData.error) {
            // console.log(userData)
            rightSideBarEle+=`
                <div>
                    <p>${userData.username}</p>
                </div>
            `
              // <p>${userData.displayName}</p>
        }
    }

    ws.send(JSON.stringify({
        type: 211,
        userID: currentUserLogin.userID,
        groupID
    }))

    document.getElementById("currentGroupsAreaRight").innerHTML=rightSideBarEle
}

function deleteGroup(groupID) {
    ws.send(JSON.stringify({
        type: 204,
        groupID
    }))
}

async function getGroupData({ groupID }) {
    const response = await fetch(`${apiURL}/get/groupData/${groupID}`, {
        method: 'GET',
        headers,
    });
    // console.log(response)

    const res = await response.json();
    // if (debug) console.log(res)
    if (res.error) return res;
    else return res
}

async function getUserDataSimple(userID) {
    const response = await fetch(`${apiURL}/get/userByID/${userID}`, {
        method: 'GET',
        headers
    });

    const res = await response.json();
    // if (debug) console.log(res)
    if (!response.ok) return 
    else return res
}
// function clientStopTyping(typingTime) {
//     if (clientTypingAct.typingTime != typingTime) return // console.log'/')

//     const messageSend = {
//         type: 09,
//         apiVersion: "1.0",
//         userID: currentUserLogin.userID,
//         typing: false,
//     }

//     ws.send(JSON.stringify(messageSend))
// }

// function clientUserType() {
//     const input = document.getElementById('messageBar').value
//     if (sendTypeStop) clearTimeout(sendTypeStop)
    
//     if (!input) {
//         clientTypingAct.typing = false
//         clientTypingAct.typingTime = 0

//         const messageSend = {
//             type: 09,
//             apiVersion: "1.0",
//             userID: currentUserLogin.userID,
//             typing: false,
//         }
    
//         return ws.send(JSON.stringify(messageSend))
//     }
    
//     const messageSend = {
//         type: 08,
//         apiVersion: "1.0",
//         userID: currentUserLogin.userID,
//         userTyping: true,
//     }

//     const timeTyping = getTime()

//     clientTypingAct.typing = true
//     clientTypingAct.typingTime = timeTyping

//     ws.send(JSON.stringify(messageSend))

//     sendTypeStop = setTimeout(function() { clientStopTyping(timeTyping); }, 4000)
// }

// function userTyping(data) {
//     if (data.type==08) {
//         var addUser = `<p id="userTyping-${data.user._id}">${data.user.username}</p>`//<p id="typingMainText"> is typing...</p>
//         if (document.getElementById(`userTyping-${data.user._id}`)) return // console.log"user is already typing")
//         else document.getElementById("userTyping").innerHTML += addUser
//     }
//     if (data.type==09) {
//         var removeUser = document.getElementById(`userTyping-${data.user._id}`)
//         if (removeUser) removeUser.remove()
//     }
// }

function addToList(data, content, user, timeStamp, message) {
    var timesince
    if (timeStamp) timesince = checkDate(timeStamp)
    // console.log(data)
    const imageContent = checkForImage(content)

    // console.log(data.message)
    document.getElementById("messages").innerHTML+=`
        <div class="message" id="${data._id}">
            <p class="subheaderMessage ${user._id == currentUserLogin.userID ? "ownUser" : "otherUser"}">${user.displayName} @${user.username} | ${timesince}</p>
            <div class="contentMainArea" id="contentMainArea_${data._id}">
                <p class="contentMessage" id="contentArea_${data._id}">${imageContent.content}</p>
                ${data.message?.edited ? '<p class="edited contentMessage"><i>(edited)</i></p>' : ''}
                ${data.message?.replyTo ? `<a class="edited contentMessage" href="#${data.message.replyTo}" onclick="highlightMessage('${data.message.replyTo}')"><i>(replying)</i></a>` : ''}
            </div>
            <div class="messageActions">
                <div id="replyDiv_${data._id}"><p onclick="replyToMessage('${data._id}')">Reply</p></div>
                ${data.type==2 && user._id == currentUserLogin.userID  ?  `
                    <p id="deleteButton_${data._id}"><p onclick="deleteMessage('${data._id}')">Delete</p></p>
                    <div id="editButton_${data._id}"><p onclick="editMessage('${data._id}', '${data.message.edited ? true : false}')">Edit</p></div>
                ` : `` }
            </div>
        </div>
    `;

    var objDiv = document.getElementById("messages");

    objDiv.scrollTop = objDiv.scrollHeight;
};

function cancelReply(id) {
    document.getElementById(`contentArea_${id}`).classList.remove("replyingEle");
    document.getElementById(`replyDiv_${id}`).innerHTML= `
        <p onclick="replyToMessage('${id}')">Cancel</p>
    `;
};

function highlightMessage(id) {
    document.getElementById(`contentArea_${id}`).classList.add("replyingEle");
    setTimeout(function () {
        document.getElementById(`contentArea_${id}`).classList.remove("replyingEle");
    }, 5000);
    // document.getElementById(`contentArea_${id}`).classList.add("activeHighlight");
};

function checkIfActiveReply() {
    var returnObj = {
        foundActive: false,
        replyID: null
    };

    if(document.getElementById(`activeReply`)) {
        returnObj.foundActive=true;
        const classList = document.getElementById(`activeReply`).classList;

        for (var i=0; i<classList.length; i++) {
            if (classList[i].startsWith('id_')) {
                returnObj.replyID = classList[i].replace('id_', '');
            };
        };
    };

    return returnObj;
};

function replyToMessage(id) {
    // const ele = document.getElementById(id);
    const lookForReply = checkIfActiveReply();

    if (lookForReply.foundActive) cancelReply(lookForReply.replyID);
    // if (document.getElementsByClassName(`activeHighlight`)) document.getElementsByClassName.remove

    document.getElementById(`contentArea_${id}`).classList.add("replyingEle");
    document.getElementById(`replyDiv_${id}`).innerHTML= `
        <p id="activeReply" class="id_${id}" onclick="cancelReply('${id}')">Reply</p>
    `;
} ;

function cancelEdit(id, content, edited) {
    document.getElementById(`contentMainArea_${id}`).innerHTML = `
        <p class="contentMessage" id="contentArea_${id}">${content}</p>
        ${edited ? '<p class="edited contentMessage"><i>(edited)</i></p>' : ''}
    `
    document.getElementById(`editButton_${id}`).innerHTML = `<p onclick="editMessage('${id}', '${edited ? true : false}')">Edit</p>`
}

function editMessage(id, edited) {
    const oldMessage = document.getElementById(`contentArea_${id}`).innerHTML
    document.getElementById(`editButton_${id}`).innerHTML = `<p onclick="cancelEdit('${id}', '${oldMessage}', '${edited ? true : false}')">Cancel</p>`
    document.getElementById(`contentArea_${id}`).innerHTML = `
        <form class="contentMessage" onsubmit="submitEditedMessage('${id}')" id="editArea_${id}">
            <input type="text" class="contentMessage" id="editMessageBar_${id}" value="${oldMessage}">
        </form>
    `
    // <a onclick="cancelEdit('${id}')">Cancel</a>

    document.getElementById(`editMessageBar_${id}`).focus()
}

function submitEditedMessage(id) {
    const newEdit = document.getElementById(`editMessageBar_${id}`).value
    if (!newEdit) return document.getElementById('actiondescription').innerHTML="no new edits"
    if (!id) return document.getElementById('actiondescription').innerHTML="no id"

    const messageSend = {
        type: 05,
        apiVersion: "1.0",
        userID: currentUserLogin.userID,
        editMessage: {
            postID: id,
            content: newEdit,
            timeStamp: getTime(),
        }
    }

    ws.send(JSON.stringify(messageSend))

    document.getElementById(`editButton_${id}`).innerHTML=`<p onclick="editMessage('${id}')">Edit</p>`
    document.getElementById(`contentMainArea_${id}`).innerHTML = `<p class="contentMessage" id="contentArea_${id}">${messageSend.editMessage.content}</p><p class="edited"><i>(edited)</i></p>`
}

function deleteMessage(id) {
    const messageSend = {
        type: 03,
        apiVersion: "1.0",
        userID: currentUserLogin.userID,
        messageToDelete: id,
    }

    ws.send(JSON.stringify(messageSend))
}

function removeFromList(data) {
    const { _id } = data
    document.getElementById(_id).remove()
}

function editFromList(data) {
    const { _id } = data
    document.getElementById(`contentMainArea_${_id}`).innerHTML = `<p class="contentMessage" id="contentArea_${_id}">${data.newMessage.content}</p><p class="edited"><i>(edited)</i></p>`
}

function checkDate(time){
    var timeNum = 0
    if (!isNaN(time)) timeNum = parseFloat(time)
    else timeNum = time
    
    var currentTime = getTime()

    const diff = (currentTime - timeNum)
    const date = dateFromEpoch(timeNum)
    const timesince = timeSinceEpoch(diff)
    return date
    // return `${date}, ${timesince}`
}

function dateFromEpoch(time) {
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

function timeSinceEpoch(diff) {
    var years = Math.floor(diff / 31556952000)
    var days = Math.floor(diff / 86400000) % 365
    var hours = Math.floor(diff / 3600000) % 24;
    var minutes = Math.floor(diff / 60000) % 60;
    var seconds = Math.floor(diff / 1000) % 60;

    if (!minutes) return `${seconds}s`
    if (!hours) return `${minutes}m ${seconds}s`
    if (!days) return `${hours}h ${minutes}m ${seconds}s`
    if (!years) return `${days}d ${hours}h ${minutes}m ${seconds}s`
    else return `${years}y ${days}d ${hours}h ${minutes}m ${seconds}s`
}

function sendmessage() {
    var input = document.getElementById('messageBar').value;
    if (!input) return document.getElementById("actiondescription").innerHTML = `There is no text included`        

    const lookForReply = checkIfActiveReply();
    if (lookForReply.foundActive) cancelReply(lookForReply.replyID);

    const messageSend = {
        type: 02,
        apiVersion: "1.0",
    //    roomID,
        message: {
            userID: currentUserLogin.userID,
            content: input,
            replyTo: lookForReply.replyID
        }
    }

    ws.send(JSON.stringify(messageSend))

    document.getElementById('messageBar').value = ''
}

// function checkURLParams() {
//     const params = new URLSearchParams(window.location.search)
//     const ifRoom = params.has('room')

//     if (ifRoom) {
//         const roomSearch = params.get('room')
//         return {"param":true, paramTypes: [ {"paramName":"room", "roomID":roomSearch}]}
//     }

//     return {"param":false}
// }

function getId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
}

function checkForImage(content) {
    const imageFormats = ['.jpg', '.png','.jpeg', '.svg', '.gif']
    const videoFormats = [{'urlEnd': '.mp4', "type": 'mp4'}, {'urlEnd':'.mov','type':'mp4'}, {'urlEnd':'.ogg', 'type': 'ogg'}]

    const contentArgs = content.split(/[ ]+/)
    var foundImage = false

    for (index = 0; index < contentArgs.length; index++) {
        if (contentArgs[index].startsWith('https://')) {
            for (const imageFormat of imageFormats) {
                if (contentArgs[index].endsWith(imageFormat)) {
                    foundImage = true
                    contentArgs[index] = `
                        <img alt="userImage" class="messageImage" src="${contentArgs[index]}"></img>
                    `
                }
            }

            for (const videoFormat of videoFormats) {
                if (contentArgs[index].endsWith(videoFormat.urlEnd)) {
                    foundImage = true
                    contentArgs[index] = `
                        <video alt="uservideo" width="320" height="240" controls>
                            <source src="${contentArgs[index]}" type="video/${videoFormat.type}">
                        </video>
                    `
                }
            }
            
            const videoId = getId(contentArgs[index]);

            if (videoId) {
                foundImage = true
                const iframeMarkup = `<iframe title="uservideo" width="320" height="240" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                contentArgs[index] = iframeMarkup
            }

            if (contentArgs[index].startsWith("https://huelet.net/w/")) {
                foundImage = true

                const URL = contentArgs[index]
                var videoID = URL.replace("https://huelet.net/w/", "")

                const iframeHuelet = `<iframe src="https://publish.huelet.net/?embed=true&vuid=${videoID}" width="320" height="240" frameborder="0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen="true"></iframe>`
                contentArgs[index] = iframeHuelet
            }
        }
    }

    return {"image" : foundImage, "content": contentArgs.join(" ")}
}