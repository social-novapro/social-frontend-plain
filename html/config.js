var config = {
    // "prod" or "dev" only
    "current" : "dev",
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

// var wsURL = `${config ? `${config.current == "prod" ? config.prod.websocket_url : config.dev.websocket_url}` : 'https://interact-api.novapro.net/v1' }`
// var redirectURL = `${config ? `${config.current == "prod" ? config.prod.hosted_url : config.dev.hosted_url}` : 'https://interact-api.novapro.net/v1' }`
// var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`
