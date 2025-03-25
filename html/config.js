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
