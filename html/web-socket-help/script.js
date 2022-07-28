var ws

setup()

function setup() {
    document.getElementById("currentConnection").innerHTML = `There is currently no connection to a websocket.`
    document.getElementById("currentConnectionStatus").innerHTML = `Disconnected.`
    
    if ("WebSocket" in window) document.getElementById("actiondescription").innerHTML = `WebSocket is supported by your Browser`
    else return document.getElementById("actiondescription").innerHTML = `WebSocket NOT supported by your Browser!`

    document.getElementById("postBar").innerHTML = `
        <form id="searchBar" class="searchSelect search" onsubmit="createConnection()">
            <input type="text" id="newConnection" placeholder="What websocket would you like to connect to?">
        </form>
    `
    document.getElementById("searchBar").addEventListener("submit", function (e) { e.preventDefault()})

}

async function createConnection() {
    const newConnection = document.getElementById("newConnection").value
    
    ws = new WebSocket(newConnection)
    ws.onopen = function() {
        document.getElementById("currentConnection").innerHTML = `${newConnection}`
        document.getElementById("currentConnectionStatus").innerHTML = `Connected.`
        document.getElementById("input").innerHTML = `
            <form id="inputBar" class="searchSelect search" onsubmit="sendMessage()">
                <input type="text" id="newInput" placeholder="What would you like to send?">
            </form>
        `
    }

    ws.onmessage = function (evt) {
        console.log(evt)
        const data = JSON.parse(evt.data)
// ws://localhost:5002/
        document.getElementById("recieved").innerHTML+=`<p>${evt.data}\n</p>`
    }
    ws.onclose = function (evt) {
        document.getElementById("currentConnectionStatus").innerHTML = `Disconnected.`

    }
    ws.onerror = function () {
        document.getElementById("currentConnectionStatus").innerHTML = `Disconnected (error).`

    }
}

async function sendMessage() {

}
