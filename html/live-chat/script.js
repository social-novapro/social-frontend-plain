var websocketenabled
var ws
var roomID
var defaultRoomID = "0001"
var loginUserToken = false
var currentUserLogin = { }
const LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'

// LOGIN INFO 
checkLogin()
document.getElementById("messageTypingForm").addEventListener("submit", function (e) { e.preventDefault()})

async function checkLogin() {
    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    if (userStorageLogin) {
        currentUserLogin = JSON.parse(userStorageLogin)
        loginUserToken = true
    }

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

function checkWebSocket() {
    if ("WebSocket" in window) {
        document.getElementById("actiondescription").innerHTML = `
            WebSocket is supported by your Browser
        `

        //ws = new WebSocket("wss://interact-api.novapro.net");  
        ws = new WebSocket(`ws://localhost:5002/?userID=${currentUserLogin.public._id}`);  

        ws.onmessage = function (evt) { 
            const data = JSON.parse(evt.data)

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
      //ws = new WebSocket("ws://10.232.151.148:5002/");  
       //10.232.151.148:5500
    } else {
        document.getElementById("actiondescription").innerHTML = `
            WebSocket NOT supported by your Browser!
        `
    }
}

/*
ws.onopen = function() {
    ws.send("Message to send");

    document.getElementById("actiondescription").innerHTML = `
        Message is sent...
    `
};
*/

function addToList(data, content, user, timeStamp, message) {
// function addToList(message) {
    var timesince
    if (timeStamp) timesince = checkDate(timeStamp)
    
   // const timesince = checkDate(timeStamp)
    const imageContent = checkForImage(content)

   // if (user._id == currentUserLogin.public._id) {
        document.getElementById("messages").innerHTML+=`
            <div class="message" id="${data._id}">
                <p class="subheaderMessage ${user._id == currentUserLogin.public._id ? "ownUser" : "otherUser"}">${user.displayName} @${user.username} | ${timesince}</p>
                <p class="contentMessage" id="contentArea_${data._id}">${imageContent.content}</p>
                ${data.type==2 && user._id == currentUserLogin.public._id  ? `<a onclick="deleteMessage('${data._id}')">Delete</a>` : ``}
                ${data.type==2 && user._id == currentUserLogin.public._id ? `<a onclick="editMessage('${data._id}')">Edit</a>` : ``}
            </div>
        `;  
    /*}
    else {
        document.getElementById("messages").innerHTML+=`
            <div class="message" id="${data._id}">
                <p class="subheaderMessage otherUser">${user.displayName} @${user.username} | ${timesince}</p>
                <p class="contentMessage" id="contentArea_${data._id}">${imageContent.content}</p>
            </div>
        `;
    }*/

    var objDiv = document.getElementById("messages");

    objDiv.scrollTop = objDiv.scrollHeight;
}

function deleteMessage(id) {
    const messageSend = {
        type: 03,
        apiVersion: "1.0",
        userID: currentUserLogin.public._id,
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
    document.getElementById(`contentArea_${_id}`).innerHTML = ``
}

function checkDate(time){
    var timeNum = 0
    if (!isNaN(time)) timeNum = parseFloat(time)
    else timeNum = time
    
    function getTime() {
        const d = new Date();
        const currentTime = d.getTime()
        return currentTime
    }
    var currentTime = getTime()

    const diff = (currentTime - timeNum)
    const date = dateFromEpoch(timeNum)
    const timesince = timeSinceEpoch(diff)
    return date
    // return `${date}, ${timesince}`
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

    const messageSend = {
        type: 02,
        apiVersion: "1.0",
    //    roomID,
        message: {
            userID: currentUserLogin.public._id,
            content: input	
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
                        <img class="messageImage" src="${contentArgs[index]}"></img>
                    `
                }
            }

            for (const videoFormat of videoFormats) {
                if (contentArgs[index].endsWith(videoFormat.urlEnd)) {
                    foundImage = true
                    contentArgs[index] = `
                        <video width="320" height="240" controls>
                            <source src="${contentArgs[index]}" type="video/${videoFormat.type}">
                        </video>
                    `
                }
            }
        }
    }

    return {"image" : foundImage, "content": contentArgs.join(" ")}
}