// var websocketenabled
var ws
var roomID
var defaultRoomID = "0001"
var loginUserToken = false
var currentUserLogin = { }
var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
var sendTypeStop
var amountTyping
var baseURL
var headers = {
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}
var verifiedConnection = false
var loadingMessages = [];
// console.log(config.dev.websocket_url)
var wsURL = `${config ? `${config.current == "prod" ? config.prod.websocket_url : config.dev.websocket_url}` : 'https://interact-api.novapro.net/v1' }`

if (location.protocol !== 'https:' && !((/localhost|(127|192\.168|10)\.(\d{1,3}\.?){2,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3}\.?){2}/).test(location.hostname))) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
else {
    checkLogin()
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
document.getElementById("messageTypingForm").addEventListener("submit", function (e) { e.preventDefault()})

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

    if (!loginUserToken) return window.location.href = "/begin/?redirect=live-chat";
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
                case 01:
                    
                    break;
                case 02:
                    if (!data.message) return
                    if (!data.message.user) addToList(data, data.message.content, data.user, data.message.timeStamp )
                    else addToList(data.message.content, data.message.user)
                    break;
                case 03:
                    removeFromList(data)
                    break;
                case 05:
                    editFromList(data)
                    break;
                case 06:
                    if (!data.userJoin) return
                    if (!data.userJoin.user) addToList(data, data.userJoin.content, data.user, data.userJoin.timeStamp)
                    else addToList(data, data.userJoin.content, data.userJoin.user)
                    changeUserCount(data.userJoin.currentUsers)
                    break;
                case 07:
                    if (!data.userLeave) return
                    if (!data.userLeave.user) addToList(data, data.userLeave.content, data.user, data.userLeave.timeStamp)
                    else addToList(data, data.userLeave.content, data.userLeave.user )
                    changeUserCount(data.userLeave.currentUsers)
                    break;
                case 08:
                    if (data.user._id == currentUserLogin.userID) return
                    else userTyping(data)
                    break;
                case 09:
                    if (data.user._id == currentUserLogin.userID) return
                    else userTyping(data)
                    break;
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
                    }
                    else if (data.mesType==2) {
                        verifiedConnection = true
                        // const oldmessages = {
                        //     type: 11,
                        //     apiVersion: "1.0",
                        //     userID: currentUserLogin.userID,
                        // }
                        // ws.send(JSON.stringify(oldmessages))
                    }
                    else if (data.mesType==4) {
                        loadMessages();
                    }
                    break;
                case 11: 
                    if (!data.success || !data.message) {
                        updateReplyContent(data.messageID, "deleted")
                    } else {
                        updateReplyContent(data.messageID, data.messageData.message.content)
                    }
                    break;
                default:
                    alert("unhandled event occured")
                    break;
            }
        };
            
        ws.onclose = function() {  
            // websocket is closed.
            document.getElementById("actiondescription").innerHTML = `
                Connection is closed...
            `
        };
    } else {
        document.getElementById("actiondescription").innerHTML = `
            WebSocket NOT supported by your Browser!
        `
    }
}

function clientStopTyping(typingTime) {
    if (clientTypingAct.typingTime != typingTime) return // console.log'/')

    const messageSend = {
        type: 09,
        apiVersion: "1.0",
        userID: currentUserLogin.userID,
        typing: false,
    }

    ws.send(JSON.stringify(messageSend))
}

function clientUserType() {
    const input = document.getElementById('messageBar').value
    if (sendTypeStop) clearTimeout(sendTypeStop)
    
    if (!input) {
        clientTypingAct.typing = false
        clientTypingAct.typingTime = 0

        const messageSend = {
            type: 09,
            apiVersion: "1.0",
            userID: currentUserLogin.userID,
            typing: false,
        }
    
        return ws.send(JSON.stringify(messageSend))
    }
    
    const messageSend = {
        type: 08,
        apiVersion: "1.0",
        userID: currentUserLogin.userID,
        userTyping: true,
    }

    const timeTyping = getTime()

    clientTypingAct.typing = true
    clientTypingAct.typingTime = timeTyping

    ws.send(JSON.stringify(messageSend))

    sendTypeStop = setTimeout(function() { clientStopTyping(timeTyping); }, 4000)
}

function userTyping(data) {
    if (data.type==08) {
        var addUser = `<p id="userTyping-${data.user._id}">${data.user.username}</p>`//<p id="typingMainText"> is typing...</p>
        if (document.getElementById(`userTyping-${data.user._id}`)) return // console.log"user is already typing")
        else document.getElementById("userTyping").innerHTML += addUser
    }
    if (data.type==09) {
        var removeUser = document.getElementById(`userTyping-${data.user._id}`)
        if (removeUser) removeUser.remove()
    }
}

function addToList(data, content, user, timeStamp, message) {
    var timesince
    if (timeStamp) timesince = checkDate(timeStamp)
    // console.log(data)
    const imageContent = checkForImage(content)

    // console.log(data.message)
    document.getElementById("messages").innerHTML+=`
        <div class="message" id="${data._id}">
            ${data.message?.replyTo ? `
                <p style="font-size: 8;" class="edited contentMessage replyToMessage replyTo_${data.message.replyTo}" onclick="highlightMessage('${data.message.replyTo}')" id="replyContent_${data._id}"><i>${getContent(data.message.replyTo)}</i></p>
            `: ""}
            <p class="subheaderMessage ${user._id == currentUserLogin.userID ? "ownUser" : "otherUser"}">${user.displayName} @${user.username} | ${timesince}</p>
            <div class="contentMainArea" id="contentMainArea_${data._id}">
                <p class="contentMessage" id="contentArea_${data._id}">${imageContent.content}</p>
                ${data.message?.edited ? '<p class="edited contentMessage"><i>(edited)</i></p>' : ''}
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

function getContent(messageID) {
    const content = document.getElementById(`contentArea_${messageID}`);
    if (content) return content.innerHTML;
    else {
        loadingMessages.push(messageID)
        return "loading..."
    };
}
function loadMessages() {
    if (loadingMessages.length == 0) return

    for (const msg of loadingMessages) {
        const messageSend = {
            type: 11,
            apiVersion: "1.0",
            userID: currentUserLogin.userID,
            messageID: msg,
        }
        loadingMessages.shift();
        ws.send(JSON.stringify(messageSend))
    }
}

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
        replyID: undefined
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
    deleteReplyContent(_id)
    document.getElementById(_id).remove()
}

function editFromList(data) {
    const { _id } = data
    updateReplyContent(_id, data.newMessage.content)
    document.getElementById(`contentMainArea_${_id}`).innerHTML = `<p class="contentMessage" id="contentArea_${_id}">${data.newMessage.content}</p><p class="edited"><i>(edited)</i></p>`
}

function deleteReplyContent(_id) {
    const elements = document.getElementsByClassName(`replyTo_${_id}`);
    for (const ele of elements) {
        ele.innerHTML = `<i>deleted reply</i>`;
    }
}

function updateReplyContent(id, content) {
    const elements = document.getElementsByClassName(`replyTo_${id}`);
    for (const ele of elements) {
        ele.innerHTML = `<i>${content}</i>`
    }
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
    const hoursRaw = date.getHours()
    const hours = `${hoursRaw > 12 ? hoursRaw - 12 : hoursRaw}`;
    const minutes = date.getMinutes();

    return `${monthReadable} ${day}, ${year} at ${hours}:${minutes} ${hoursRaw > 12 ? 'PM' : 'AM'}`
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

function changeUserCount(newUserCount) {
    document.getElementById("userCount").innerHTML = `Current User Count: ${newUserCount}`  
}

function checkURLParams() {
    const params = new URLSearchParams(window.location.search)
    const ifRoom = params.has('room')

    if (ifRoom) {
        const roomSearch = params.get('room')
        return {"param":true, paramTypes: [ {"paramName":"room", "roomID":roomSearch}]}
    }

    return {"param":false}
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