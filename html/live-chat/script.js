var websocketenabled
var ws

checkWebSocket()

function checkWebSocket() {
    if ("WebSocket" in window) {
        document.getElementById("actiondescription").innerHTML = `
            WebSocket is supported by your Browser
        `

        ws = new WebSocket("wss://interact-api.novapro.net");  
        // ws = new WebSocket("ws://localhost:5002/");  

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
    
function addToList(message, user) {
    document.getElementById("messages").innerHTML+=`<p class="message ${user}">${message}</p>`;
    var objDiv = document.getElementById("messages");

    objDiv.scrollTop = objDiv.scrollHeight;
}

ws.onmessage = function (evt) { 
    const data = JSON.parse(evt.data)
    console.log(data)
    
    if (data.type == 06) {
        addToList(data.userJoin.content, data.userJoin.user)
        console.log("someone joined")
        console.log(data.userJoin.currentUsers)
        changeUserCount(data.userJoin.currentUsers)
    }
    else if (data.type == 02) {
        console.log(data)
        addToList(data.message.content, data.message.user )
    }
    else if (data.type == 07) {
        addToList(data.userLeave.content, data.userLeave.user)
        console.log("someone left")
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
        message: {
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