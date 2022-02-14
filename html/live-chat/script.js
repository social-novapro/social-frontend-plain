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

    if (!loginUserToken) return window.location.href = "../index.html";
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

            if (data.type == 02) {
                if (!data.message) return
                if (!data.message.user) addToList(data.message.content, data.message.userID, data.message.timeStamp )
                else addToList(data.message.content, data.message.user)
            }
            else if (data.type == 06) {
                if (!data.userJoin) return
                if (!data.userJoin.user) addToList(data.userJoin.content, data.userJoin.userID, data.userJoin.timeStamp)
                else addToList(data.userJoin.content, data.userJoin.user)
                changeUserCount(data.userJoin.currentUsers)
            }
            else if (data.type == 07) {
                if (!data.userLeave) return
                if (!data.userLeave.user) addToList(data.userLeave.content, data.userLeave.userID, data.userLeave.timeStamp)
                else addToList(data.userLeave.content, data.userLeave.user, )
                changeUserCount(data.userLeave.currentUsers)
            }
            else {
                addToList("un-handled event occurred")
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
   
function addToListNew(message) {
    const timesince = checkDate(message.timeStamp)
    const imageContent = checkForImage(content)

    var userStyle

    if (user = currentUserLogin.public._id) userStyle = "ownUser"
    else if (user == "ownUser" || user == "otherUser") userStyle=user
    else userStyle = "otherUser"

    document.getElementById("messages").innerHTML+=`
        <div class="message" id="messageID(later)">
            <p class="subheaderMessage ${userStyle}">${timesince}</p>
            <p class="contentMessage ${userStyle}">${imageContent.content}</p>
        </div>
    `;

    var objDiv = document.getElementById("messages");
    objDiv.scrollTop = objDiv.scrollHeight;
}

function addToList(content, user, timeStamp) {
    var timesince
    if (timeStamp) timesince = checkDate(timeStamp)
    
   // const timesince = checkDate(timeStamp)
    const imageContent = checkForImage(content)

    var userStyle

    if (user == currentUserLogin.public._id) userStyle = "ownUser"
    else userStyle = "otherUser"

    if (!timeStamp){
        document.getElementById("messages").innerHTML+=`
            <div class="message" id="messageID(later)">
                <p class="subheaderMessage ${userStyle}">unknown</p>
                <p class="contentMessage ${userStyle}">${imageContent.content}</p>
            </div>
        `;
    }
    else {
        document.getElementById("messages").innerHTML+=`
            <div class="message" id="messageID(later)">
                <p class="subheaderMessage ${userStyle}">${timesince}</p>
                <p class="contentMessage ${userStyle}">${imageContent.content}</p>
            </div>
        `;
    }

    var objDiv = document.getElementById("messages");

    objDiv.scrollTop = objDiv.scrollHeight;
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
    if (!input) {
        document.getElementById("actiondescription").innerHTML = `
            There is no text included
        `        
        return 
    }

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
    document.getElementById("userCount").innerHTML = `
        Current User Count: ${newUserCount}
    `  
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