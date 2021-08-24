const feedAPIURl = 'https://interact-api.novapro.net/v1/get/allPosts'
//const feedAPIURl = 'http://localhost:5002/v1/get/allPosts'
getFeed()
async function getFeed() {
    const response = await fetch(feedAPIURl)
    console.log(response)
    buildView(response)
}


function buildView(posts) {
    console.log(posts)
    document.getElementById("all-versions").innerHTML = `
        <div class="main-feed">
            <div>
                ${versionHistory.map(function(mainVersion) {
                    mainVersion.versions.map(function(version) {
                        totalUpdates = totalUpdates + 1

                        version.updates.map(function(update) {
                            totalFeatures = totalFeatures + 1    
                        })
                    })
                }).join(" ")}
                <a>
                    Main Updates: ${versionHistory.length}<br>
                    Total Builds: ${totalUpdates}<br>
                    Total Features: ${totalFeatures}
                </a>
            </div>
            <div>
                <h1 class="main-heading"><u>Version History:</u></h1>
                <a class="history-order">Lastest - Oldest</a>  
            </div>
            <div class="history-shortcuts">
                <h1><u class="heading">Shortcuts:</u></h1>

                <ul class="versions-shortcut">
                    ${versionHistory.map(function(mainVersion) {
                        return `
                        <li class="version-num-shortcut">
                            <a href="#${mainVersion.id}" class="version-shortcut">Version ${mainVersion.mainUpdate}: ${mainVersion.landmark}</a>
                        </li>
                        `
                    }).join(" ")}
                </ul>
            </div>
            ${versionHistory.map(function(mainVersion) {
                return `
                    <div id="${mainVersion.id}" class="version-info-main">
                        <h1>Version ${mainVersion.mainUpdate}: ${mainVersion.landmark}</h1>
                        <a>${mainVersion.headline}</a>
                    </div>
                    <div class="history-div2">
                        ${mainVersion.versions.map(function(version){
                                return `
                                    <div class="version-num-history">
                                        <h1>${version.version} (${version.build})</h1>
                                        <a>
                                            ${version.updates.map(function(update){
                                                return `
                                                    ${update}<br>
                                                `
                                            }).join(" ")}
                                        </a>
                                    </div>
                                `
                        }).join(" ")}
                    </div>
                `
            }).join(" ")}
        </div>
    `
}