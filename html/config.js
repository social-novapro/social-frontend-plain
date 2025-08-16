var config = {
    // "prod" or "dev" only
    "current" : "prod",
    "dev" : {
        "api_url" : "http://localhost:5002/v1",
        "websocket_url" : "ws://localhost:5002/",
        "hosted_url" : "http://localhost:5500/"
    },
    "prod" : {
        "api_url" : "https://interact-api.novapro.net/v1",    
        "websocket_url" : "wss://interact-api.novapro.net/",
        "hosted_url" : "https://interact.novapro.net/"
    }
}

var hostedUrl = `${config ? `${config.current == "prod" ? config.prod.hosted_url : config.dev.hosted_url}` : 'https://interact.novapro.net/' }`
var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`
var wsURL = `${config ? `${config.current == "prod" ? config.prod.websocket_url : config.dev.websocket_url}` : 'wss://interact-api.novapro.net/' }`

var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}