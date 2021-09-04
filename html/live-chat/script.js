var websocketenabled
var ws

checkWebSocket()

function checkWebSocket() {
    if ("WebSocket" in window) {
        document.getElementById("actiondescription").innerHTML = `
            WebSocket is supported by your Browser
        `

        // Let us open a web socket
        ws = new WebSocket("wss://interact-api.novapro.net");  
        console.log(ws)

    } else {
        // The browser doesn't support WebSocket
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
    document.getElementById("messages").innerHTML+=`<p>${message}</p>`;
    var objDiv = document.getElementById("messages");
        console.log(objDiv)

    objDiv.scrollTop = objDiv.scrollHeight;
}

ws.onmessage = function (evt) { 
    var received_msg = evt.data;
    console.log(received_msg)
    addToList(received_msg)
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

    document.getElementById('messageBar').value = ''

    ws.send(input);
}
