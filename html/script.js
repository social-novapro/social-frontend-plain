// add option to have searching put in address bar (so it doesnt spam history), look for places that uses changeHeader()

/*
    new idea
        have a basic feed page, without likes, comments, etc.
        once you login, you can choose to see 
            - discover feed (default when not logged in)
            - custom feed (default when logged in)
            - following feed (just people you follow)

    check if there are messages to be read
    make a secondary message area
// function that checks if user is logged in
if (checkLoginUser()) {
    // if user is logged in, show the logout button
    document.getElementById("logoutButton").innerHTML = `
        <button class="buttonStyled" onclick="logout()">Logout</button>
    `
} else {
    // if user is not logged in, show the login button
    document.getElementById("logoutButton").innerHTML = `
        <button class="buttonStyled" onclick="login()">Login</button>
    `
}

// if user is logged in, show the post button
if (checkLoginUser()) {
    document.getElementById("postButton").innerHTML = `
        <button class="buttonStyled" onclick="postbar()">Post</button>
    `
} else {
    document.getElementById("postButton").innerHTML = ``
}

// Ping server to see if user is logged in
async function checkLoginUser() {
    const headers = {
        'Authorization': 'Bearer my-token',
        'My-Custom-Header': 'foobar'
    };

    const checkLogin = await axios.get(`${APIv1}/check/login`, { headers })
    return checkLogin.data
}
*/

var apiURL = `${config ? `${config.current == "prod" ? config.prod.api_url : config.dev.api_url}` : 'https://interact-api.novapro.net/v1' }`

// const apiURL = `http://localhost:5002/v1`
// const apiURL = `https://interact-api.novapro.net/v1`

var headers = {
    'Content-Type': 'application/json',
    "devtoken" : "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
    "apptoken" : "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
}

var currentUserLogin = { }
/*var currentUserLogin = {
    "accesstoken" : "d023ed40-95ff-42aa-962b-e19475ebd317",
    "userid" : "d825813d-95d2-46eb-868a-ae2e850eab92"
}*/

var currentPage
// need usertoken, and userid for sending

var searching
var currentFeed 

var LOCAL_STORAGE_LOGIN_USER_TOKEN ='social.loginUserToken'
// let loginUserToken = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)

var debug = false

var mobileClient = checkifMobile();

function checkifMobile() {
    const width = document.getElementById("html").clientWidth
        console.log(width)
    if (width < 900) {
        return true;
    } else {
        return false;
    }
}

// good luck
if (location.protocol !== 'https:' && !((/localhost|(127|192\.168|10)\.(\d{1,3}\.?){2,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.(\d{1,3}\.?){2}/).test(location.hostname))) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
else {
    if (!('fetch' in window)) {
      if (debug) console.log('Fetch API not found, please upgrade your browser.');
        showModal(`Please upgrade your browser to use Interact!`)
    }
    else checkLogin()
}
// CHANGES URL OF BROWSER
function changeHeader(newLink) {
    let stateObj = { id: "100" };
    window.history.replaceState(stateObj, "Socket", "/" + newLink);
}

async function checkURLParams() {
    var paramsInfo = {
        paramsFound: false
    }

    const params = new URLSearchParams(window.location.search)
    const ifUsername = params.has('username')
    const ifPostID = params.has("postID")
    const ifSearch = params.has("search")
    const ifLoginRequest = params.has("login")
    const ifNewAccountLogin = params.has("newAccount")

    if (ifUsername) {
        paramsFound = true
        paramsInfo.paramsFound = true
        const usernameSearch = params.get('username')
        userPage(usernameSearch)
    }
    else if (ifPostID) {
        paramsFound = true
        paramsInfo.paramsFound = true

        const postIDSearch = params.get('postID')
        // postPage()
        postHtml(postIDSearch)
        // return userPage(usernameSearch)
    }
    else if (ifSearch) {
        paramsFound = true
        paramsInfo.paramsFound = true

        const searchSearching = params.get('search')
        searchResult(searchSearching)
        addWritingToSeachBar(searchSearching)
    }
    else if (ifLoginRequest) {
        paramsFound = true
        paramsInfo.paramsFound = true

        loginPage()
    }
    else if (ifNewAccountLogin) {
        paramsFound = true
        paramsInfo.paramsFound = true

        loginSplashScreen()
    }
   
    return paramsInfo
}

function postElementCreate({ post, user, type, hideParent, hideReplies }) {
    var timesince
    if (post.timePosted) timesince = checkDate(post.timePosted)
    const imageContent = checkForImage(post.content)
    const owner = post.userID == currentUserLogin.userID ? true : false;

    const options = {
        hideParent : hideParent ? true : false, 
        hideReplies : hideReplies ? true : false,
        owner: owner,
    }
    
    // imageContent.attachments
    if (imageContent.imageFound)if (debug) console.log(imageContent.attachments)
    if (type=="basic"){
        return `
             <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ?  onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}${user.verified ? ' <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" viewBox="0 0 666 375" enable-background="new 0 0 666 375" xml:space="preserve">
<path fill="#000000" opacity="1.000000" stroke="none" d=" M439.000000,376.000000   C294.201294,376.000000 149.902588,375.986053 5.603960,376.081573   C2.050483,376.083954 0.885947,375.590363 0.890329,371.605957   C1.024639,249.468750 1.023087,127.331345 0.891224,5.194132   C0.887167,1.437054 1.848106,0.914227 5.303982,0.915704   C224.418030,1.009308 443.532104,1.007618 662.646179,0.928118   C665.961304,0.926916 667.123718,1.245397 667.119080,5.144268   C666.973877,127.448074 666.979675,249.752090 667.101685,372.055969   C667.105225,375.591461 666.249695,376.092987 662.945740,376.087921   C588.463989,375.973480 513.981934,376.000000 439.000000,376.000000  z"/>
<path fill="#09B561" opacity="1.000000" stroke="none" d=" M484.165649,222.177521   C469.242981,240.806717 464.494354,262.944672 459.879028,285.169952   C458.167206,293.413177 455.871948,301.533752 454.041962,309.754608   C453.333771,312.936218 451.720367,314.313782 448.502380,315.054047   C429.192871,319.496063 409.975861,324.341766 390.654877,328.731201   C383.430817,330.372406 378.002777,335.077972 371.944397,338.625732   C358.105042,346.729919 344.594849,355.397308 330.978912,363.880798   C328.678650,365.314026 326.899170,365.474091 324.315002,363.845245   C306.692932,352.737885 289.037048,341.669800 271.100494,331.083099   C264.530945,327.205566 256.542938,326.942291 249.202576,325.074951   C234.809021,321.413300 220.299057,318.204376 205.812714,314.916199   C202.554092,314.176514 201.799927,311.704254 201.176941,309.109528   C196.819138,290.959381 192.252853,272.852814 188.317749,254.610550   C186.612244,246.704224 182.270264,240.351730 178.286102,233.742569   C169.750229,219.582687 161.056259,205.514679 152.188446,191.560654   C149.814331,187.824829 152.355591,185.526062 153.854675,183.046692   C161.128433,171.016556 168.165176,158.805145 176.138580,147.246155   C184.919754,134.516144 189.091614,120.341545 192.167053,105.507202   C194.781647,92.895653 198.148743,80.440582 201.150452,67.908516   C201.945389,64.589752 203.432922,62.670528 207.254105,61.812321   C226.413696,57.509205 245.436035,52.595886 264.591370,48.272449   C271.326935,46.752201 276.527405,42.649338 282.136536,39.298195   C296.606415,30.653246 310.838776,21.607977 325.088104,12.599347   C327.404175,11.135107 329.087280,11.982285 330.939728,13.126999   C348.072998,23.714508 365.262970,34.212097 382.306335,44.942474   C389.402161,49.409946 397.602509,49.852585 405.338928,51.839790   C420.189697,55.654419 435.212250,58.805080 450.182587,62.145836   C453.133820,62.804436 453.396484,65.082703 453.943329,67.338509   C458.573639,86.440186 463.374969,105.502480 467.766449,124.658783   C469.184906,130.846283 472.501526,135.910721 475.636841,141.126251   C483.384369,154.014069 491.303802,166.798569 499.169739,179.615036   C499.945465,180.879028 500.726685,182.163742 501.682068,183.288757   C504.416351,186.508469 504.541504,189.544708 502.169342,193.220383   C496.072754,202.667053 490.296600,212.320511 484.165649,222.177521  z"/>
<path fill="#010502" opacity="1.000000" stroke="none" d=" M272.324799,322.427124   C252.547333,317.581726 233.151520,312.777283 213.679520,308.304443   C210.163803,307.496857 208.798477,305.872406 208.050858,302.575256   C204.369827,286.341095 200.123337,270.226349 196.818924,253.919022   C194.864594,244.274368 189.596725,236.507263 184.763672,228.429749   C177.330017,216.005829 169.678696,203.710297 161.971100,191.453735   C160.428986,189.001480 161.060928,187.219757 162.370895,185.084198   C172.464783,168.628479 182.384445,152.064590 192.619278,135.697540   C195.310989,131.393066 195.732285,126.610809 196.870728,121.987457   C200.810776,105.986389 204.535812,89.931679 208.230194,73.871506   C208.859360,71.136414 210.068649,69.688492 212.949448,69.029854   C228.529785,65.467751 243.989151,61.340252 259.638123,58.128105   C269.183533,56.168793 277.448273,52.003578 285.537170,46.911755   C298.777771,38.577061 312.253418,30.616091 325.510254,22.306599   C327.805542,20.867899 329.192383,21.868055 330.865601,22.899578   C344.184448,31.110617 357.715637,39.002602 370.742706,47.653492   C381.031219,54.485775 392.487213,57.371002 404.215942,59.988453   C417.050903,62.852783 429.794189,66.127029 442.623291,69.019196   C445.642334,69.699806 446.473755,71.453163 447.104523,74.117989   C451.131073,91.128609 455.727448,108.016594 459.279510,125.122849   C461.546234,136.039032 468.432770,144.221481 473.725006,153.350189   C480.067108,164.289780 486.822754,174.998688 493.694427,185.616501   C495.669739,188.668655 494.174500,190.563599 492.797272,192.802200   C483.029755,208.678375 473.219208,224.528168 463.492218,240.429092   C459.040192,247.706894 458.649628,256.269012 456.446259,264.234100   C452.897369,277.062836 450.017548,290.083832 447.144806,303.087585   C446.405701,306.433167 444.788757,307.625793 441.625366,308.337646   C426.032410,311.846619 410.554657,315.885773 394.917633,319.173645   C386.069702,321.033997 378.323608,324.886383 370.797180,329.577484   C357.518677,337.853668 344.148132,345.982422 330.890594,354.291718   C328.646973,355.697906 327.103577,355.831299 324.683228,354.328522   C307.429657,343.616241 290.032104,333.135864 272.324799,322.427124  z"/>
<path fill="#01BE62" opacity="1.000000" stroke="none" d=" M198.430054,222.512390   C192.181808,212.253006 186.223587,202.240982 179.999405,192.397125   C178.256439,189.640549 178.108093,187.632797 179.925140,184.787857   C187.626511,172.729935 194.796936,160.327423 202.675400,148.390060   C207.685364,140.799026 209.720505,132.306274 211.866150,123.793663   C214.957092,111.530716 217.901428,99.225777 220.584305,86.868416   C221.296829,83.586494 222.730988,82.092430 225.898849,81.369728   C237.254364,78.779175 248.458801,75.378532 259.913757,73.408844   C274.437836,70.911407 286.724396,64.016617 298.809113,56.262959   C307.489319,50.693676 316.429718,45.530521 325.127411,39.987507   C327.446838,38.509331 329.117554,39.189808 331.033264,40.375210   C343.910370,48.343128 356.962708,56.043098 369.618042,64.348351   C377.124725,69.274757 385.624359,70.709381 393.934174,72.877708   C405.846222,75.985970 417.833282,78.827942 429.855347,81.479713   C433.202606,82.218040 434.373688,83.914284 435.079254,87.009438   C438.741638,103.075043 442.750519,119.062721 446.300537,135.152161   C447.249176,139.451660 449.785187,142.649582 451.916840,146.164307   C459.684113,158.971054 467.433136,171.792709 475.479767,184.423508   C477.512817,187.614792 477.317200,189.795013 475.355072,192.878326   C466.154297,207.336426 457.091919,221.887177 448.267395,236.577393   C445.506226,241.173981 445.401733,246.783218 444.129272,251.934479   C440.936218,264.860992 437.888947,277.824799 434.941315,290.809570   C434.306091,293.607971 433.034241,294.934906 430.168365,295.575043   C420.099915,297.824005 410.181702,300.819366 400.052795,302.706787   C384.430237,305.617920 370.227051,311.412659 357.166504,320.502502   C348.984558,326.196960 340.140167,330.931061 331.741425,336.327057   C328.809570,338.210724 326.627472,338.093628 323.680145,336.231262   C310.738800,328.053802 297.446350,320.422089 284.643890,312.038574   C277.368103,307.274139 269.066803,306.386017 261.121735,304.218292   C249.408524,301.022461 237.520081,298.459259 225.676300,295.758026   C222.707962,295.081024 221.378723,293.613892 220.674805,290.558502   C217.275726,275.805237 213.183197,261.202484 210.122101,246.384064   C208.261612,237.377594 203.246063,230.282166 198.430054,222.512390  z"/>
<path fill="#010301" opacity="1.000000" stroke="none" d=" M301.087463,215.926636   C322.665588,194.403976 343.992920,173.115738 365.297729,151.804947   C373.416412,143.684021 381.525696,135.552750 389.545807,127.334946   C391.707214,125.120247 393.214935,124.871017 395.529633,127.332695   C401.576660,133.763596 407.859528,139.977081 414.167328,146.155807   C416.170593,148.118057 416.689697,149.221664 414.277649,151.610626   C388.388702,177.251938 362.657928,203.053070 336.901276,228.827850   C325.374664,240.362564 313.807465,251.859039 302.449493,263.558105   C300.163330,265.912964 299.142273,265.573059 297.027557,263.444305   C278.847168,245.143204 260.592773,226.914230 242.200012,208.826874   C239.224304,205.900543 238.530991,204.111511 242.019974,200.987183   C247.838577,195.776749 253.313766,190.153809 258.630646,184.423492   C261.580109,181.244690 263.478363,180.626358 266.869965,184.194901   C276.504791,194.332397 286.560608,204.071518 296.531189,213.885712   C297.656555,214.993423 298.336151,217.445221 301.087463,215.926636  z"/>
</svg>' : ''} : '>Unknown User'} | ${timesince}</p>

            <div class="postContent" id="postContentArea_${post._id}">
                <div class="textAreaPost">
                    <p id="postContent_${post._id}">${imageContent.content}</p>
                    ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                </div>
            </div>
        `
    }
    
    return `
        <div id="postElement_${post._id}" class="postElement">
            ${!hideParent==true && post.isReply ? `
                <div id="parent_${post._id}"></div>` 
            : `` } 
            <div class="publicPost areaPost" id="postdiv_${post._id}">
                ${!hideParent==true && post.isReply ? `
                    ${ post.replyData ? `
                        <p onclick="viewParentPost('${post._id}', '${post.replyData.postID}')" id="parentViewing_${post._id}">This was a reply, click here to see.</p>
                    ` : ``}
                `: ``}
               <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ?  onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}${user.verified ? ' <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" viewBox="0 0 666 375" enable-background="new 0 0 666 375" xml:space="preserve">
<path fill="#000000" opacity="1.000000" stroke="none" d=" M439.000000,376.000000   C294.201294,376.000000 149.902588,375.986053 5.603960,376.081573   C2.050483,376.083954 0.885947,375.590363 0.890329,371.605957   C1.024639,249.468750 1.023087,127.331345 0.891224,5.194132   C0.887167,1.437054 1.848106,0.914227 5.303982,0.915704   C224.418030,1.009308 443.532104,1.007618 662.646179,0.928118   C665.961304,0.926916 667.123718,1.245397 667.119080,5.144268   C666.973877,127.448074 666.979675,249.752090 667.101685,372.055969   C667.105225,375.591461 666.249695,376.092987 662.945740,376.087921   C588.463989,375.973480 513.981934,376.000000 439.000000,376.000000  z"/>
<path fill="#09B561" opacity="1.000000" stroke="none" d=" M484.165649,222.177521   C469.242981,240.806717 464.494354,262.944672 459.879028,285.169952   C458.167206,293.413177 455.871948,301.533752 454.041962,309.754608   C453.333771,312.936218 451.720367,314.313782 448.502380,315.054047   C429.192871,319.496063 409.975861,324.341766 390.654877,328.731201   C383.430817,330.372406 378.002777,335.077972 371.944397,338.625732   C358.105042,346.729919 344.594849,355.397308 330.978912,363.880798   C328.678650,365.314026 326.899170,365.474091 324.315002,363.845245   C306.692932,352.737885 289.037048,341.669800 271.100494,331.083099   C264.530945,327.205566 256.542938,326.942291 249.202576,325.074951   C234.809021,321.413300 220.299057,318.204376 205.812714,314.916199   C202.554092,314.176514 201.799927,311.704254 201.176941,309.109528   C196.819138,290.959381 192.252853,272.852814 188.317749,254.610550   C186.612244,246.704224 182.270264,240.351730 178.286102,233.742569   C169.750229,219.582687 161.056259,205.514679 152.188446,191.560654   C149.814331,187.824829 152.355591,185.526062 153.854675,183.046692   C161.128433,171.016556 168.165176,158.805145 176.138580,147.246155   C184.919754,134.516144 189.091614,120.341545 192.167053,105.507202   C194.781647,92.895653 198.148743,80.440582 201.150452,67.908516   C201.945389,64.589752 203.432922,62.670528 207.254105,61.812321   C226.413696,57.509205 245.436035,52.595886 264.591370,48.272449   C271.326935,46.752201 276.527405,42.649338 282.136536,39.298195   C296.606415,30.653246 310.838776,21.607977 325.088104,12.599347   C327.404175,11.135107 329.087280,11.982285 330.939728,13.126999   C348.072998,23.714508 365.262970,34.212097 382.306335,44.942474   C389.402161,49.409946 397.602509,49.852585 405.338928,51.839790   C420.189697,55.654419 435.212250,58.805080 450.182587,62.145836   C453.133820,62.804436 453.396484,65.082703 453.943329,67.338509   C458.573639,86.440186 463.374969,105.502480 467.766449,124.658783   C469.184906,130.846283 472.501526,135.910721 475.636841,141.126251   C483.384369,154.014069 491.303802,166.798569 499.169739,179.615036   C499.945465,180.879028 500.726685,182.163742 501.682068,183.288757   C504.416351,186.508469 504.541504,189.544708 502.169342,193.220383   C496.072754,202.667053 490.296600,212.320511 484.165649,222.177521  z"/>
<path fill="#010502" opacity="1.000000" stroke="none" d=" M272.324799,322.427124   C252.547333,317.581726 233.151520,312.777283 213.679520,308.304443   C210.163803,307.496857 208.798477,305.872406 208.050858,302.575256   C204.369827,286.341095 200.123337,270.226349 196.818924,253.919022   C194.864594,244.274368 189.596725,236.507263 184.763672,228.429749   C177.330017,216.005829 169.678696,203.710297 161.971100,191.453735   C160.428986,189.001480 161.060928,187.219757 162.370895,185.084198   C172.464783,168.628479 182.384445,152.064590 192.619278,135.697540   C195.310989,131.393066 195.732285,126.610809 196.870728,121.987457   C200.810776,105.986389 204.535812,89.931679 208.230194,73.871506   C208.859360,71.136414 210.068649,69.688492 212.949448,69.029854   C228.529785,65.467751 243.989151,61.340252 259.638123,58.128105   C269.183533,56.168793 277.448273,52.003578 285.537170,46.911755   C298.777771,38.577061 312.253418,30.616091 325.510254,22.306599   C327.805542,20.867899 329.192383,21.868055 330.865601,22.899578   C344.184448,31.110617 357.715637,39.002602 370.742706,47.653492   C381.031219,54.485775 392.487213,57.371002 404.215942,59.988453   C417.050903,62.852783 429.794189,66.127029 442.623291,69.019196   C445.642334,69.699806 446.473755,71.453163 447.104523,74.117989   C451.131073,91.128609 455.727448,108.016594 459.279510,125.122849   C461.546234,136.039032 468.432770,144.221481 473.725006,153.350189   C480.067108,164.289780 486.822754,174.998688 493.694427,185.616501   C495.669739,188.668655 494.174500,190.563599 492.797272,192.802200   C483.029755,208.678375 473.219208,224.528168 463.492218,240.429092   C459.040192,247.706894 458.649628,256.269012 456.446259,264.234100   C452.897369,277.062836 450.017548,290.083832 447.144806,303.087585   C446.405701,306.433167 444.788757,307.625793 441.625366,308.337646   C426.032410,311.846619 410.554657,315.885773 394.917633,319.173645   C386.069702,321.033997 378.323608,324.886383 370.797180,329.577484   C357.518677,337.853668 344.148132,345.982422 330.890594,354.291718   C328.646973,355.697906 327.103577,355.831299 324.683228,354.328522   C307.429657,343.616241 290.032104,333.135864 272.324799,322.427124  z"/>
<path fill="#01BE62" opacity="1.000000" stroke="none" d=" M198.430054,222.512390   C192.181808,212.253006 186.223587,202.240982 179.999405,192.397125   C178.256439,189.640549 178.108093,187.632797 179.925140,184.787857   C187.626511,172.729935 194.796936,160.327423 202.675400,148.390060   C207.685364,140.799026 209.720505,132.306274 211.866150,123.793663   C214.957092,111.530716 217.901428,99.225777 220.584305,86.868416   C221.296829,83.586494 222.730988,82.092430 225.898849,81.369728   C237.254364,78.779175 248.458801,75.378532 259.913757,73.408844   C274.437836,70.911407 286.724396,64.016617 298.809113,56.262959   C307.489319,50.693676 316.429718,45.530521 325.127411,39.987507   C327.446838,38.509331 329.117554,39.189808 331.033264,40.375210   C343.910370,48.343128 356.962708,56.043098 369.618042,64.348351   C377.124725,69.274757 385.624359,70.709381 393.934174,72.877708   C405.846222,75.985970 417.833282,78.827942 429.855347,81.479713   C433.202606,82.218040 434.373688,83.914284 435.079254,87.009438   C438.741638,103.075043 442.750519,119.062721 446.300537,135.152161   C447.249176,139.451660 449.785187,142.649582 451.916840,146.164307   C459.684113,158.971054 467.433136,171.792709 475.479767,184.423508   C477.512817,187.614792 477.317200,189.795013 475.355072,192.878326   C466.154297,207.336426 457.091919,221.887177 448.267395,236.577393   C445.506226,241.173981 445.401733,246.783218 444.129272,251.934479   C440.936218,264.860992 437.888947,277.824799 434.941315,290.809570   C434.306091,293.607971 433.034241,294.934906 430.168365,295.575043   C420.099915,297.824005 410.181702,300.819366 400.052795,302.706787   C384.430237,305.617920 370.227051,311.412659 357.166504,320.502502   C348.984558,326.196960 340.140167,330.931061 331.741425,336.327057   C328.809570,338.210724 326.627472,338.093628 323.680145,336.231262   C310.738800,328.053802 297.446350,320.422089 284.643890,312.038574   C277.368103,307.274139 269.066803,306.386017 261.121735,304.218292   C249.408524,301.022461 237.520081,298.459259 225.676300,295.758026   C222.707962,295.081024 221.378723,293.613892 220.674805,290.558502   C217.275726,275.805237 213.183197,261.202484 210.122101,246.384064   C208.261612,237.377594 203.246063,230.282166 198.430054,222.512390  z"/>
<path fill="#010301" opacity="1.000000" stroke="none" d=" M301.087463,215.926636   C322.665588,194.403976 343.992920,173.115738 365.297729,151.804947   C373.416412,143.684021 381.525696,135.552750 389.545807,127.334946   C391.707214,125.120247 393.214935,124.871017 395.529633,127.332695   C401.576660,133.763596 407.859528,139.977081 414.167328,146.155807   C416.170593,148.118057 416.689697,149.221664 414.277649,151.610626   C388.388702,177.251938 362.657928,203.053070 336.901276,228.827850   C325.374664,240.362564 313.807465,251.859039 302.449493,263.558105   C300.163330,265.912964 299.142273,265.573059 297.027557,263.444305   C278.847168,245.143204 260.592773,226.914230 242.200012,208.826874   C239.224304,205.900543 238.530991,204.111511 242.019974,200.987183   C247.838577,195.776749 253.313766,190.153809 258.630646,184.423492   C261.580109,181.244690 263.478363,180.626358 266.869965,184.194901   C276.504791,194.332397 286.560608,204.071518 296.531189,213.885712   C297.656555,214.993423 298.336151,217.445221 301.087463,215.926636  z"/>
</svg>' : ''} : '>Unknown User'} | ${timesince}</p>

                <div class="postContent" id="postContentArea_${post._id}">
                    <div class="textAreaPost">
                        <p id="postContent_${post._id}">${imageContent.content}</p>
                        ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                    </div>
                    ${post.replyingPostID ? `<a class="replyingPost" href="#postElement_${post.replyingPostID}">Press here</a>` : ``}
                    ${post.quoteReplyPostID && post.quotedPost && post.quotedUser ? `<hr><div>${postElementCreate({post: post.quotedPost, user: post.quotedUser, type: "basic"})}</div>` : ''}
                    <div class="PostAttachments">
                        ${imageContent.image ? `<div>${imageContent.attachments.map(function(attachment) {return `${attachment}`}).join(" ")}</div>`:''}
                    </div>
                </div>
                <p class="debug">${post._id} - from: ${post.userID}</p>
                <div class="actionOptions pointerCursor"> 
                    ${post.totalLikes ? 
                        `<p onclick="likePost('${post._id}')" id="likePost_${post._id}">${post.totalLikes} likes</p>` :
                        `<p onclick="likePost('${post._id}')" id="likePost_${post._id}">like</p>`
                    }
                    ${post.totalReplies ? 
                        `<p onclick="replyPost('${post._id}')">${post.totalReplies} replies</p>` : 
                        `<p onclick="replyPost('${post._id}')">reply</p>`
                    }
                    ${post.totalQuotes ? 
                        `<p onclick="quotePost('${post._id}')">${post.totalQuotes} quotes</p>` : 
                        `<p id="quoteButton_${post._id}">
                            <p onclick="quotePost('${post._id}')">quote</p>
                        </p>`
                    }
                    ${!mobileClient ? `
                        ${post.userID == currentUserLogin.userID ? `
                            <p onclick="deletePost('${post._id}')">delete post</p>
                            <p id='editButton_${post._id}'>
                                <p onclick="editPost('${post._id}', '${post.edited}')">edit post</p>
                            </p>
                        ` : ''}
                    ` : ''}
                    </p>
                    <p id="popupactions_${post._id}" onclick="popupActions('${post._id}', '${options.hideParent}', '${options.hideReplies}', '${options.owner}')">more</p>
                </div>
            </div>
        </div>
    `
}

async function popupActions(postID, hideParent, hideReplies, owner) {
    // options = JSON.parse(options)
    var elementPopup = document.getElementById(`popupOpen_${postID}`);
    if (elementPopup) return elementPopup.remove();

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="popupOpen_${postID}" class="publicPost" style="position: element(#popupactions_${postID});">
            ${owner && mobileClient? `
                <p>Owner Actions</p>
                <p>---</p>
                <p onclick="deletePost('${postID}')">delete post</p>
                <p id='editButton_${postID}'>
                    <p onclick="editPost('${postID}')">edit post</p>
                </p>
            ` : ``}
            <p>Menu Actions</p>
            <p>---</p>
            <p class="pointerCursor" onclick="saveBookmark('${postID}')" id="saveBookmark_${postID}">Save to Bookmarks</p>
            <p class="pointerCursor" onclick="showEditHistory('${postID}')" id="editHistory_${postID}">Check Edit History</p>
            <p class="pointerCursor" onclick="showLikes('${postID}')" id="likedBy_${postID}">Check Who Liked</p>
            ${hideReplies != true ? `<p class="pointerCursor" onclick="viewReplies('${postID}')" id="replies_${postID}">Check Replies</p>` : ``}
        </div>
    `;
};

async function viewParentPost(postID, parentPostID) {
    if (document.getElementById(`openedParent_${postID}`)) {
        document.getElementById(`parentViewing_${postID}`).innerText = "This was a reply, click here to see.";
        return document.getElementById(`openedParent_${postID}`).remove();
    }

    const response = await fetch(`${apiURL}/get/post/${parentPostID}`, {
        method: 'GET',
        headers
        // body: JSON.stringify(body)
    });
    
    const postData = await response.json();
    if (debug) console.log(postData);

    if (postData.deleted == true || !postData.userID) {
        document.getElementById(`parent_${postID}`).innerHTML = `
            <div class="publicPost areaPost" id="openedParent_${postID}">
                <div class="publicPost areaPost">
                    <p>Parent post has been deleted.</p>
                </div>
            </div>
        `;
        document.getElementById(`parentViewing_${postID}`).innerText = "Close parent post.";

        return;
    }

    const userRes = await fetch(`${apiURL}/get/userByID/${postData.userID}`, {
        method: 'GET',
        headers
        // body: JSON.stringify(body)
    });
   
    const userData = await userRes.json();

    const postEle = postElementCreate({post: postData, user: userData});
    document.getElementById(`parent_${postID}`).innerHTML = `
        <div class="publicPost areaPost" id="openedParent_${postID}">${postEle}</div>
    `;
    document.getElementById(`parentViewing_${postID}`).innerText = "Close parent post.";

}

// async function 
async function viewReplies(postID) {
    if (document.getElementById(`repliesOpened_${postID}`)) {
        document.getElementById(`replies_${postID}`).innerText = "Check replies";

        return document.getElementById(`repliesOpened_${postID}`).remove();
    }

    // if ()
    // http://localhost:5002/v1/get/postReplies/71f9a348-aa28-4443-a39d-4247620e43ce
    const response = await fetch(`${apiURL}/get/postReplies/${postID}`, {
        method: 'GET',
        headers
        // body: JSON.stringify(body)
    });
    const replyData = await response.json();
    if (debug) console.log(replyData)
    if (replyData.code) {
        document.getElementById(`postElement_${postID}`).innerHTML+=`
            <div id="repliesOpened_${postID}" class="publicPost" style="position: element(#popupactions_${postID});">
                <p>Replies</p>
                <p>---</p>
                There are no replies yet on this post.
            </div>
        `;
        if (debug) console.log("no replies")
        return ;
    }
    // array

    var ele = ``;
    for (const reply of replyData.replies) {
        // if (reply!=null) {
            const userRes = await fetch(`${apiURL}/get/userByID/${reply.userID}`, {
                method: 'GET',
                headers
                // body: JSON.stringify(body)
            });
            const userData = await userRes.json();
            if (debug) console.log(userData)
            ele+=postElementCreate({post: reply, user: userData, hideParent: true });
        // }
    }

    document.getElementById(`postElement_${postID}`).innerHTML+=`
        <div id="repliesOpened_${postID}" class="publicPost" style="position: element(#popupactions_${postID});">
            <p>Replies</p>
            <p>---</p>
            ${ele}
        </div>
    `;

    document.getElementById(`replies_${postID}`).innerText = "Close replies";
    // get message
    // postElementCreate

}

async function saveBookmark(postID, list) {
    const body = {
        postID,
        listname: list ? list : "main"
    }
    const response = await fetch(`${apiURL}/post/savePost/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    // if (!response.ok) return document.getElementById(`saveBookmark_${postID}`).innerText = "Error while saving"
    const res = await response.json();
    if (debug) console.log(res)
    if (res.error) return document.getElementById(`saveBookmark_${postID}`).innerText = `Error: ${res.error}`;
    document.getElementById(`saved post to bookmarks`)
}

async function showLikes(postID) {
    const response = await fetch(`${apiURL}/get/postLikedBy/${postID}`, {
        method: 'GET',
        headers,
    });

    const likedBy = await response.json();
    if (debug) console.log(likedBy.peopleLiked);
    if (!response.ok || !likedBy.peopleLiked) return document.getElementById(`likedBy_${postID}`).innerHTML = `Could not find any people who liked the post.`;

    var newElement = `<p>Liked By:</p>`;
    for (const people of likedBy.peopleLiked) {
        newElement+=`<p onclick="userHtml('${people.userID}')">${people.username}</p>`
    };

    document.getElementById(`likedBy_${postID}`).innerHTML=newElement;
}

async function showEditHistory(postID) {
    const response = await fetch(`${apiURL}/get/postEditHistory/${postID}`, {
        method: 'GET',
        headers,
    });

    const editData = await response.json();
    if (debug) console.log(editData);
    if (!response.ok || !editData.edits) return document.getElementById(`editHistory_${postID}`).innerHTML = `Could not find any edits.`;

    var newElement = `<p>Edit History:</p>`;
    for (const edit of editData.edits.reverse()) {
        newElement+=`<p>${edit.content}</p>`
    };

    document.getElementById(`editHistory_${postID}`).innerHTML=newElement;
};

// async function postPage() {

// }
async function userPage(username) {
    searching = true

    const response = await fetch(`${apiURL}/get/username/${username}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await response.json() 

    userHtml(userData._id)

    return 
}

/*
    Login user token layout
    { 
        "usertoken"
        "apptoken"
        "accesstoken"
        "userid"
    }
*/

// /*

async function createPostModal() {
    await showModal(`
        <h1>Create a new Post</h1>
        <div class="postModalActions">
            <p onclick="createPost()">Upload Post</p>
            <p onclick="closeModal()">Close</p>
        </div>
        <textarea class="postTextArea" onkeyup="socialTypePost()" id="newPostTextArea"></textarea>
        <div id="foundTaggings"></div>
    `, "hide")
}

async function socialTypePost() {
    return false; // remove once feature is done

    const content = document.getElementById('newPostTextArea').value
    const foundTags = await findTag(content)
    if (foundTags.found == false) {
        if (document.getElementById('taggingsOpened')) {
            document.getElementById('foundTaggings').innerHTML=""
        }
        return false;
    };

    var taggings = ""
    if (debug) console.log("!!")
    for (const index of foundTags.results) {
        taggings+=`
            <div class=""onclick="autoCompleteUser('${index.user.username}')">
                <p>${index.user.username}</p>
                ${index.user.description ? `<p>${index.user.description}</p>` : ``}
                <p>${index.possiblity}% match</p>
            </div>
        `
    }
    if (debug) console.log(taggings)
    document.getElementById('foundTaggings').innerHTML=`
        <div id="taggingsOpened"></div>
        ${taggings}
    `
}

async function autoCompleteUser(username) {
    const content = document.getElementById('newPostTextArea').value
    const contentArgs = content.split(" ")

    // replaces with new value
    contentArgs[contentArgs.length-1] = `@${username}`;

    
    document.getElementById('newPostTextArea').value = contentArgs.join(" ")
}

async function findTag(content) {
    const contentArgs = content.split(/[ ]+/)
    const searchUser = contentArgs[contentArgs.length-1];

    if (searchUser==''||searchUser=="@") return { found: false };
    if (!searchUser.startsWith("@")) return { found: false };
    const response = await fetch(`${apiURL}/get/taguserSearch/${searchUser.replace("@", "")}`, {
        method: 'GET',
        headers,
    });
    
    if (debug) console.log(response)
    const res = await response.json();
    if (debug) console.log(res)
    if (res.error) return { found: false };
    if (!res) return { found: false }
    if (!res[0]) return { found: false }
    return {found: true, results: res};
}

document.addEventListener('keypress', logKey);

function logKey(e) {
    if (e.key == '/') {
        searchBar()
        document.getElementById('searchBarArea').focus()
    }
}

/*
async function showModal(html, showClose) {
    document.getElementById('modalContainer').classList.add("showModal");
    document.getElementById('modal').innerHTML = html

    if (showClose == "hide") return
    else return showModalClose()
}

async function showModalClose() {
    document.getElementById('modal').innerHTML+=`
        <button class="buttonStyled" onclick="closeModal()">Close</button>
    `
}

async function closeModal() {
    document.getElementById('modalContainer').classList.remove("showModal")    
}
*/

// LOGIN INFO 
async function checkLogin() {
    if (debug) console.log(loginUserToken)

    var loginUserToken = false

    const userStorageLogin = localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN)
    if (userStorageLogin) {
        currentUserLogin = JSON.parse(userStorageLogin)
        if (debug) console.log(headers)
        if (debug) console.log(currentUserLogin.accessToken)
        if (debug) console.log(currentUserLogin.userToken)
        if (debug) console.log(currentUserLogin.userID)

        headers.accesstoken = currentUserLogin.accessToken
        headers.usertoken = currentUserLogin.userToken
        headers.userid = currentUserLogin.userID

        loginUserToken = true
    }
    
    if (!loginUserToken) return loginSplashScreen()
    else await getFeed()
}

// USER LOGIN SPLASH SCREEN 
async function loginSplashScreen() {
    return window.location.href='/begin'
    /*document.getElementById("mainFeed").innerHTML = `
        <div class="publicPost signInDiv">
            <h1>Your not signed in!</h1>
            <p>Please Sign into Interact to Proceed!</p>
            <button class="buttonStyled" onclick="loginPage()">Log into Your Account</button>
            <button class="buttonStyled" onclick="createUserPage()">Create an Account</button>
        </div>
    `*/
}

// USER LOGIN PAGE 
async function loginPage() {
    document.getElementById("mainFeed").innerHTML = `
        <h1>Please Login!</h1>
        <form onsubmit="sendLoginRequest()" id="signInForm">
            <div>
                <p>Enter Username:</p>
                <p><input id="userUsernameLogin" placeholder="Username" type="text" name="username"></p>
            </div>
            <div>
                <p>Enter Password</p>
                <p><input id="userPasswordLogin" placeholder="Password" type="password" name="password"></p>
            </div>
            <input class="buttonStyled" type="submit">
        </form>
    `
        document.getElementById("signInForm").addEventListener("submit", function (e) { e.preventDefault()})
}

async function sendLoginRequest() {
    var usernameLogin = document.getElementById('userUsernameLogin').value;
    var passwordLogin = document.getElementById('userPasswordLogin').value;

    headers.username = usernameLogin
    headers.password = passwordLogin
    
    const response = await fetch(`${apiURL}Priv/get/userLogin/`, {
        method: 'GET',
        headers,
    })

    // if (response.status != 200) 
    if (debug) console.log(response)
    const userData = await response.json()
    if (debug) console.log(userData)
   //  currentUserLogin = userData.accessToken
    if (response.ok) {
        if (userData.public._id) currentUserLogin.userid = userData.public._id

        saveLoginUser(userData)
        // save user token to cookie
        // setCookie(currentUser,cvalue,exdays) {}
        return await getFeed()
    }

    else return showModal(`<p>Error: ${userData.code}\n${userData.msg}</p>`)

    if (userData.login === true) {
        return await getFeed()
    }
}

/*
function createUserPage() {
    document.getElementById("mainFeed").innerHTML = `
        <h1>Please Create an Account!</h1>
        <p id="errorMessage"></p>
        <form onsubmit="createNewUserRequest()" id="createUserForm">
            <div> 
                <p>Enter Your New Username:</p>
                <input type="text" id="usernameCreate" placeholder="Username" type="text" name="username">
            </div>
            <div> 
                <p>Enter Your New Displayname:</p>
                <input type="text" id="displaynameCreate" placeholder="Displayname">
            </div>
            <div> 
                <p>Enter Your New Password:</p>
                <input id="passwordCreate" placeholder="Password" type="password" name="password">
            </div>
            <div> 
                <p>Enter Your Description:</p>
                <input type="text" id="descriptionCreate" placeholder="Description">
            </div>
            <div> 
                <p>Enter Your Pronouns:</p>
                <input type="text" id="pronounsCreate" placeholder="Pronouns">
            </div>
            <input class="buttonStyled" type="submit">
        </form>
    `
    document.getElementById("createUserForm").addEventListener("submit", function (e) { e.preventDefault()})
}


async function createNewUserRequest() {
    var usernameCreate = document.getElementById('usernameCreate').value;
    var displaynameCreate = document.getElementById('displaynameCreate').value;
    var passwordCreate = document.getElementById('passwordCreate').value;
    var descriptionCreate = document.getElementById('descriptionCreate').value;
    var pronounsCreate = document.getElementById('pronounsCreate').value;

    const data = { 
        "username" : usernameCreate, 
        "displayName" : displaynameCreate,
        "password" : passwordCreate,
        "description": descriptionCreate,
        "pronouns": pronounsCreate
    };

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    const response = await fetch(`${apiURL}Priv/post/newUser`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    if (debug) console.log(response)
    const responseParsed = await response.json()
    if (debug) console.log(responseParsed)
    if (response.ok) {
        // save user token to cookie
        // setCookie(currentUser,cvalue,exdays) {}
        return await getFeed()
    }
    else return document.getElementById('errorMessage').innerHTML=`Error: ${responseParsed.code}, ${responseParsed.msg}`
}
*/

// CHANGES MAIN FEED BUTTON TO PROFILE
function goBackFeedFromProfile() {
    document.getElementById("page2").innerHTML = `Profile` 
    searching = false

    return checkLogin()
}

// USER PROFILE PAGE
async function profile() {
    checkLogin()
    removeSearchBar()
    searching = true

    userHtml(currentUserLogin.userID)
        // editable after

    currentPage = "profile"
}

async function userEdit(action) {
    const newValue = document.getElementById(`userEdit_${action}_text`).value
    headers[`new${action.toLowerCase()}`] = newValue

    const response = await fetch(`${apiURL}/put/userEdit`, {
        method: 'PUT',
        headers
    })
    const newUser = await response.json()
    if (!response.ok) return console.log("error")

    // return window.location.href = `${document.getElementById('userEdit_username_text').value}`
    console.log(newUser)
}

async function postHtml(postID) {
    const postRes = await fetch(`${apiURL}/get/post/${postID}`, {
        method: 'GET',
        headers,
    })

    const postData = await postRes.json()

    if (!postData || !postRes.ok || postData.deleted) return console.log("error with post");

    const userRes = await fetch(`${apiURL}/get/userByID/${postData.userID}`, {
        method: 'GET',
        headers,
    })
    
    const userData = await userRes.json();
    const ele = postElementCreate({post: postData, user: userData});
    document.getElementById("mainFeed").innerHTML = ele

    return 
    if (postRes.isReply) {

    } else {

    }
    // const ele = ``;


    /*
    | Mother of post  (recursivly)
    |
    | Actual Post (will be main, large)

        scrolls down to actual post, +  half of mother post vieable

        loads one comment index (most recent)
    */
}

async function userHtml(userID) {
    const response = await fetch(`${apiURL}/get/user/${userID}`, {
        method: 'GET',
        headers,
    })
    
    const profileData = await response.json()

    var timesince
    if (profileData.userData.creationTimestamp) timesince = checkDate(profileData.userData.creationTimestamp)

    var clientUser = profileData.userData._id === currentUserLogin.userID ? true : false
    if (profileData?.userData?.displayName) document.title = `${profileData?.userData?.displayName} | Interact`
    
    profileData.postData.reverse()
    // profileData.included.post ? profileData.postData.reverse() : profileData.postData = []
    document.getElementById("mainFeed").innerHTML =  `
        ${profileData.userData?.profileURL != null  || clientUser ? 
            `
                <div class="userInfo">
                    <p><b>Profile Image</b></p>
                    ${profileData.userData?.profileURL != null ?  `
                        <img class="profileUserHtmlLarge" src="${profileData.userData.profileURL}"></img>
                    ` : ``}
                    ${clientUser ? `
                        <form id="userEdit_profileImage" class="contentMessage" onsubmit="userEdit('profileImage')">
                            <input id="userEdit_profileImage_text" type="text" class="userEditForm" value="${profileData.userData.profileURL}">
                        </form>
                    ` : `` }
                </div>
            ` : ``
        }
        <div class="userInfo">
            <p><b>Notifications</b></p>
            <a id="notificationSub" onclick="subNotifi('${profileData.userData._id}')">Subscribe</a>
            ${clientUser ? 
                `
                    <div>
                        <button class="buttonStyled" id="showNotificationsButton" onclick="showNotifications()">Show Notifications</button>
                        <div id="notificationsDIv"></div>
                    </div>
                    <div>
                        <button class="buttonStyled" id="showSubscriptionsButton" onclick="showSubscriptions()">Show Subscriptions</button>
                        <div id="subscriptionsDiv"></div>
                    </div>
                ` : `` 
            }
        </div>
        <div class="userInfo">
            <p><b>Display Name</b></p>
            ${clientUser ? 
                `
                    <form id="userEdit_displayName" class="contentMessage" onsubmit="userEdit('displayName')">
                        <input id="userEdit_displayName_text" type="text" class="userEditForm" value="${profileData.userData.displayName}">
                    </form>
                ` : `
                    <p>${profileData.userData.displayName}</p>
                `
            }
        </div>
        <div class="userInfo">
            <p><b>Username</b></p>
            ${clientUser ? 
                `
                    <form id="userEdit_username" class="contentMessage" onsubmit="userEdit('username')">
                        <input type="text" id="userEdit_username_text" class="userEditForm" value="${profileData.userData.username}">
                    </form>
                ` : `
                    <p>${profileData.userData.username}</p>
                `
            }
        </div>
        ${profileData.userData.statusTitle  || clientUser ? 
            `
                <div class="userInfo">
                    <p><b>Status</b></p>
                    ${clientUser ?
                        `
                            <form id="userEdit_status" class="contentMessage" onsubmit="userEdit('status')">
                                <input type="text" id="userEdit_status_text" class="userEditForm" value="${profileData.userData.statusTitle}">
                            </form> 
                        ` : `
                            <p>${profileData.userData.statusTitle}</p>
                        `
                    }
                </div>
            ` : ``
        }
        <div class="userInfo">
            <p><b>Description</b></p>
            ${clientUser ? 
                `
                    <form id="userEdit_description" class="contentMessage" onsubmit="userEdit('description')">
                        <input type="text" id="userEdit_description_text" class="userEditForm" value="${profileData.userData.description}">
                    </form>
                ` : `
                    <p>${profileData.userData.description}</p>
                `
            }
        </div> 
        ${clientUser ?
            `
                <div class="userInfo">
                    <p><b>Bookmarks</b></p>
                    <button class="buttonStyled" id="showBookmarksButton" onclick="showBookmarks()">Show Bookmarks</button>
                    <div id="bookmarksdiv"></div>
                </div>
            ` : ``
        }
        ${clientUser ?
            `
                <div class="userInfo">
                    <p><b>Developer</b></p>
                    <button class="buttonStyled" id="showDevOptionsButton" onclick="showDevOptions()">Show Dev Settings</button>
                    <div id="showDevDiv"></div>
                </div>
            ` : ``
        }
        ${profileData.verified ? 
            `
                <div class="userInfo">
                    <p>Verified</p>
                </div>
            ` : `
                ${clientUser ? 
                `
                    <div class="userInfo">
                        <p><b>Verify ✔️</b></p>
                        <div class="searchSelect search">
                            <input id="content_request_verification"  placeholder="Why do you want to verify?">
                            <button onclick="requestVerification()">Request</button>
                        </div>
                    </div>
                ` : ``}
            `
            /*
             <form onsubmit="requestVerification()" id="verifyUserForm">
                    <input type="text" id="content_request_verification" placeholder="Why do you want to verify?">
                </form>
            */
        }   
    
        ${profileData.userData.pronouns || clientUser ? 
            `
                <div class="userInfo"><p><b>Pronouns</b></p>
                    ${clientUser ? 
                        `
                            <form id="userEdit_pronouns" class="contentMessage" onsubmit="userEdit('pronouns')">
                                <input type="text" id="userEdit_pronouns_text" class="userEditForm" value="${profileData.userData.pronouns}">
                            </form>
                        ` : `
                            <p>${profileData.userData.pronouns}</p>
                        `
                    }
                </div>
            ` : ``
        }
        ${profileData.userData.creationTimestamp ? 
            `  
                <div class="userInfo">
                    <p><b>Creation</b></p>
                    <p>${timesince}</p>
                </div>
            `: ``
        }
        ${profileData.included.posts ? `
            <div class="userInfo">
                <p><b>Posts</b></p>
                <p>${profileData.postData.length}</p>
            </div>
            <hr class="rounded">
            ${profileData.postData.map(function(post) {
                return postElementCreate({post: post, user: profileData.userData})                
            }).join(" ")}
        ` : ``}
    `

    if (clientUser) {
        document.getElementById("userEdit_displayName").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_username").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_description").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_pronouns").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_status").addEventListener("submit", function (e) { e.preventDefault()})
        document.getElementById("userEdit_profileImage").addEventListener("submit", function (e) { e.preventDefault()})
    }
  
    return document.getElementById("navSection2").innerHTML = `
        <div id="page2Nav" class="nav-link" onclick="switchNav(5)">
            <span class="material-symbols-outlined nav-button";>home</span>
            <span class="link-text pointerCursor" id="page1">Feed</span>
        </div>
    `
}

async function subNotifi(subUser) {
    const response = await fetch(`${apiURL}/post/subUser/${subUser}`, {
        method: 'POST',
        headers
    });
    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok || res.error) return document.getElementById('notificationSub').innerHTML=`error`

    document.getElementById('notificationSub').innerHTML=`done`
}

async function unsubUser(userID, username) {
    const response = await fetch(`${apiURL}/delete/unsubUser/${userID}`, {
        method: 'DELETE',
        headers
    });
    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok || res.error) return document.getElementById(`subList_${userID}`).innerHTML=`error while unsubscribing`

    document.getElementById(`subList_${userID}`).innerHTML=`Unsubscribed to <a onclick="userHtml('${userID}')">${username}</a>.`
}

function hideBookmarks() {
    document.getElementById('bookmarksdiv').innerHTML=""
    document.getElementById('showBookmarksButton').innerHTML="Show Bookmarks"
}

async function showBookmarks() {
    if (document.getElementById('bookmarksAreShown')) return hideBookmarks()
    document.getElementById('showBookmarksButton').innerHTML="Hide Bookmarks"

    const response = await fetch(`${apiURL}/get/bookmarks/`, {
        method: 'GET',
        headers
    });

    // if (!response.ok) return document.getElementById(`saveBookmark_${postID}`).innerText = "Error while saving"
    const res = await response.json();
    if (debug) console.log(res)
    // if (res.error) return document.getElementById(`saveBookmark_${postID}`).innerText = `Error: ${res.error}`;

    var obj = {} // { list: name, saves: [] }
    for (const list of res.lists) {
        obj[list.name] = []
    }

    for (const save of res.saves) {
        // console.log(save.listname)
        obj[save.bookmarkList].push(save._id)
    }

    var ele = `<hr class="rounded" id="bookmarksAreShown">`

    for (const listname in obj) {
        var list = obj[listname]
        ele+=`
            <div>
                <p>${listname}</p>
                <hr class="rounded">
        `
        for (const save of list) {
            if (debug) console.log(save)
            const newData = await getPostAndProfileData(save)
            if (newData.error) ele+=`<p>error</p>`
            else ele+= postElementCreate({post: newData.postData, user: newData.profileData, type : "basic"})
            // ele+=
        }
        ele+=`</div>`
    }

    document.getElementById("bookmarksdiv").innerHTML=ele
    if (debug) console.log(obj)
}

function hideSubscriptions() {
    document.getElementById('subscriptionsDiv').innerHTML=""
    document.getElementById('showSubscriptionsButton').innerHTML="Show Subscriptions"
}

async function showSubscriptions() {
    if (document.getElementById('subscriptionsAreShown')) return hideSubscriptions()
    document.getElementById('showSubscriptionsButton').innerHTML="Hide Subscriptions"
    const response = await fetch(`${apiURL}/get/subscriptions/`, {
        method: 'GET',
        headers
    });
    // console.log(response)

    // if (!response.ok) return document.getElementById(`saveBookmark_${postID}`).innerText = "Error while saving"
    `
        [
            {
                _id: "d1f32225-a940-48ed-bff9-22efd5636cbd",
                __v: 0, 
                subscribed: [
                    { 
                        _id: "d1f32225-a940-48ed-bff9-22efd5636cbd", 
                        timestamp: 1657607591942
                    }, {
                        _id: "d2ac792f-0f5a-443d-8453-f8396e1b6303", 
                        timestamp: 1658554148695
                    }
                ]
            }, {
                _id: "6ceae342-2ca2-48ec-8ce3-0e39caebe989",
                __v: 0,
                subscribed: [{
                    _id: "d2ac792f-0f5a-443d-8453-f8396e1b6303", 
                    timestamp: 1658554289386
                }]
            }
        ]
    `
    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok) return document.getElementById('showSubscriptionsButton').innerHTML=`error`
    

    var ele = `<hr class="rounded" id="subscriptionsAreShown"><p>${res.length} Subscriptions</p><hr class="rounded">`

    for (const sub of res.reverse()) {
        const userData = await getUserDataSimple(sub._id) 
        ele = ele + `
            <div id="subList_${userData._id}">
                <div>
                    <a onclick="userHtml('${userData._id}')">${userData.username}</a>
                </div>
                <div>
                    <a onclick="unsubUser('${userData._id}', '${userData.username}')">unsub from user.</a>
                </div>
            </div>
        `
    }

    document.getElementById("subscriptionsDiv").innerHTML=ele
}


function hideNotifications() {
    document.getElementById('notificationsDiv').innerHTML=""
    document.getElementById('showNotificationsButton').innerHTML="Show Notifications"
}

async function showNotifications() {
    if (document.getElementById('notificationsAreShown')) return hideNotifications()
    document.getElementById('showNotificationsButton').innerHTML="Hide Notifcations"

    const response = await fetch(`${apiURL}/get/notifications/`, {
        method: 'GET',
        headers
    });

    // if (!response.ok) return document.getElementById(`saveBookmark_${postID}`).innerText = "Error while saving"
    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok) return document.getElementById('showNotificationsButton').innerHTML=`error`
    

    var ele = `<hr class="rounded" id="bookmarksAreShown"><p id="amount_notifications">${res.amountFound} Notifications</p><hr class="rounded">`
    /*
        type: String (one)
            1: someone followed
            2: someone unfollowed
            3: someone liked post
            4: someone unliked post
            5: someone posted
            6: someone mentioned you

        var returnData = {
            amountFound: interactUserNotifications.notifications.length,
            notifications: []
        };
    */

    // console.log(res)

    for (const notifi of res.notifications.reverse()) {
        switch (notifi.type) {
            case 5:
                const userData = await getUserDataSimple(notifi.userID) 
                ele+=`
                    <div class="buttonStyled" id="notification_${notifi._id}">
                        <a onclick="showPost('${notifi.postID}')"><b>${userData.username}</b> has posted! (click to see)</a>
                        <p onclick="dismissNotification('${notifi._id}')">Dismiss Notification.</p>
                    </div>
                `
                break;
            case 7: 
                const userData2 = await getUserDataSimple(notifi.userID)
                ele+=`
                    <div class="buttonStyled" id="notification_${notifi._id}">
                        <a onclick="showPost('${notifi.postID}')"><b>${userData2.username}</b> quoted your post!(click to see)</a>
                        <p onclick="dismissNotification('${notifi._id}')">Dismiss Notification.</p> 
                    </div>
                `
            default:
                break;
        }
    }
   
    document.getElementById("notificationsDIv").innerHTML=ele
}
async function dismissNotification(notificationID) {
    const response = await fetch(`${apiURL}/delete/dismissNotification/${notificationID}`, {
        method: 'DELETE',
        headers
    });
    const res = await response.json();
    if (!response.ok) return ;

    if (res.success == false) return;
    document.getElementById(`notification_${notificationID}`).remove();

    var input = document.getElementById("amount_notifications").innerText
    console.log(input)
    var newInput = input.replace(" Notifications", "")
    console.log(input)
    console.log(newInput)

    newInput--
    console.log(newInput)

    document.getElementById("amount_notifications").innerHTML=`${newInput} Notifications` 
};

async function showPost(postID) {
    const response = await fetch(`${apiURL}/get/post/${postID}`, {
        method: 'GET',
        headers
    });

    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok) return 

    const user = await getUserDataSimple(res.userID)
    if (debug) console.log(user)
    const ele = postElementCreate({post: res, user: user})
    document.getElementById('mainFeed').innerHTML=ele
}
/*
`
    <button class="buttonStyled" id="showNotificationsButton" onclick="showNotifications()">Show Notifications</button>
    <div id="notificationsDIv"></div>
`
*/

async function getUserDataSimple(userID) {
    const response = await fetch(`${apiURL}/get/userByID/${userID}`, {
        method: 'GET',
        headers
    });

    const res = await response.json();
    if (debug) console.log(res)
    if (!response.ok) return 
    else  return res
}

async function hideDevOptions() {
    document.getElementById('showDevDiv').innerHTML=""
    document.getElementById('showDevOptionsButton').innerHTML="Show Dev Settings"
}

function revealDevOptions(option, index){
    switch (option) {
        case "devToken":
            const eledevtoken = document.getElementById('devToken');
            if (eledevtoken.classList.contains("blur")) eledevtoken.classList.remove('blur')   
            else eledevtoken.classList.add('blur')
            break;
        case "appTokens":
            const eleapptokens = document.getElementById(`appToken_${index}`);
            if (eleapptokens.classList.contains("blur")) eleapptokens.classList.remove('blur')   
            else eleapptokens.classList.add('blur')
           
            break;
        case "appAccess":
            const eleaccess = document.getElementById(`appAccess_${index}`);
            if (eleaccess.classList.contains("blur")) eleaccess.classList.remove('blur')   
            else eleaccess.classList.add('blur')
           
            break
        default:
            break;
    }
}

async function showDevOptions() {
    if (document.getElementById('showDevAreShown')) return hideDevOptions()
    document.getElementById('showDevOptionsButton').innerHTML="Hide Developer Settings"

    const response = await fetch(`${apiURL}/get/developer/`, {
        method: 'GET',
        headers
    });

    if (!response.ok) return document.getElementById(`showDevDiv`).innerText = "Error while requesting data"
    const res = await response.json();
    if (debug) console.log(res)

    var firstEle = `
        <hr class="rounded" id="showDevAreShown">
        <p>Account Status</p>
        <div class="userInfo">
            ${res.developer ? `<p>You have an Interact Developer Account</p>`:``}
            ${res.applications&&res.AppTokens ? `<p>You have ${res.AppTokens.length} Approved Applications</p>`: ``}
            ${res.allowedApplications&&res.AppAccesses ? `<p>${res.AppAccesses.length} Connected Applications`: ``} 
        </div>
    `;

    var devAccEle='';
    if (res.developer&&res.DeveloperToken) {
        devAccEle=`
            <hr class="rounded">
            <p>Developer Account</p>
            <div class="userInfo">
                ${res.DeveloperToken._id ? `<p>devToken: <p onclick="revealDevOptions('devToken')" id="devToken" class="blur">${res.DeveloperToken._id}</p>`:``}
                ${res.DeveloperToken.premium ? `<p>Premium Dev Account</p>`:`<p>Regular Dev Account</p>`}
                ${res.DeveloperToken.creationTimestamp ? `<p>Dev account created: ${checkDate(res.DeveloperToken.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
                ${res.DeveloperToken._id ? `<p onclick="copyToClipboard('${res.DeveloperToken._id}')">Copy Token</p>` : ""}
            </div>
        `;

    } else {
        devAccEle=`
            <hr class="rounded">
            <p>Developer Account</p>
            <div class="userInfo" id="devAcc">
                <p>Signup for a developer account.</p>
                <div class="searchSelect search">
                    <button onclick="requestDevToken()">Signup</button>
                </div>
            </div>
        `
    };

    var appTokensEle='<hr class="rounded"><p>App Token</p>';

    // list of app token
    var amount=0;
    if (res.applications&&res.AppTokens) {
        appTokensEle=`<hr class="rounded"><p>App Token${res.AppTokens.length>=2 ? 's': ''}</p><div id="appTokenList">`
        
        // var amount=0;
        for (const appToken of res.AppTokens.reverse()) {
            amount++;
            appTokensEle+=`
                <div class="userInfo">
                    <p>appToken #${amount} of ${res.AppTokens.length}</p>
                    <p>app name: ${appToken.appName ? appToken.appName : `Unknown`}
                    ${appToken._id ? `<p>appToken: <p onclick="revealDevOptions('appTokens', ${amount})" id="appToken_${amount}" class="blur">${appToken._id}</p>`:``}
                    ${appToken._id ? `<p onclick="copyToClipboard('${appToken._id}')">Copy Token</p>` : ""}
                    <p>API Uses: ${appToken.APIUses? appToken.APIUses : `0`}
                    ${appToken.creationTimestamp ? `<p>Application created: ${checkDate(appToken.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
                </div>
            `;
        };
        appTokensEle+="</div>"
    };
    // create new app token
    if (res.developer) {
        appTokensEle+=`
            <div class="userInfo" id="newAppToken">
                <p>Generate New App Token</p>
                <p>Please input an application name</p>
                <div class="searchSelect search">
                    <input id="appName_AppTokenRequest" placeholder="Application Name:">
                </div>
                <button onclick="requestAppToken(${amount})">Generate Token</button>
            </div>
        `
    }

    var appAccessEle=`<hr class="rounded"><p>App Connections</p>`;
    if (res.allowedApplications&&res.AppTokens) {
        var amount=0;
        for (const appAccess of res.AppAccesses) {
            amount++;
            appAccessEle+=`
                <div class="userInfo">
                    <p>appAccess ${amount} of ${res.AppAccesses.length}</p>
                    ${appAccess.appToken ? `<p>Using appToken: <p onclick="revealDevOptions('appAccess', ${amount})" id="appAccess_${amount}" class="blur">${appAccess.appToken}</p>`:``}
                </div>
            `;
        };
    };
    
    var ele = firstEle+devAccEle+appTokensEle+appAccessEle;
    
    document.getElementById("showDevDiv").innerHTML=ele;
    return;
};

function copyToClipboard(data) {
    navigator.clipboard.writeText(data);
}

async function requestAppToken(amount) {
    const newAmount = amount+1;
    const appName = document.getElementById('appName_AppTokenRequest').value;
    if (debug) console.log(appName);
    const userDevToken = document.getElementById('devToken').innerText;
    if (debug) console.log(userDevToken);
    document.getElementById('newAppToken').innerHTML="loading";

    if (!appName){
        return document.getElementById('newAppToken').innerText="Failed! Please input a new app name!";

    };
    if (!userDevToken) {
        return document.getElementById('newAppToken').innerText="Failed! No user dev token, please request a developer account!";
    };
    const data = {
        appname: appName,
        userdevtoken: userDevToken
    }
    const requestRes = await fetch(`${apiURL}Priv/post/newAppToken`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    const appTokenData = await requestRes.json();
    if (debug) console.log(appTokenData)
    if (!requestRes.ok || requestRes.error) return console.log({error: `${requestRes?.error ? requestRes.error : "an unknown error"}`});

    const newEle = `
        <div class="userInfo">
            <p>NEW TOKEN</p>
            <p>appToken #${newAmount}</p>
            <p>app name: ${appTokenData.appName ? appTokenData.appName : `Unknown`}
            ${appTokenData._id ? `<p>appToken: <p onclick="revealDevOptions('appTokens', ${newAmount})" id="appToken_${newAmount}" class="blur">${appTokenData._id}</p>`:``}
            ${appTokenData._id ? `<p onclick="copyToClipboard('${appTokenData._id}')">Copy Token</p>` : ""}
            <p>API Uses: ${appTokenData.APIUses? appTokenData.APIUses : `0`}
            ${appTokenData.creationTimestamp ? `<p>Application created: ${checkDate(appTokenData.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
        </div>
    `;
    const newRequestEle = `
        <p>Generate New App Token</p>
        <p>Please input an application name</p>
        <div class="searchSelect search">
            <input id="appName_AppTokenRequest" placeholder="Application Name:">
        </div>
        <button onclick="requestAppToken(${newAmount})">Generate Token</button>
    `
    document.getElementById('newAppToken').innerHTML=newRequestEle
    document.getElementById('appTokenList').innerHTML+=newEle;
}

async function requestDevToken() {
    document.getElementById('devAcc').innerHTML="loading";

    const requestRes = await fetch(`${apiURL}Priv/post/newDev`, {
        method: 'POST',
        headers
    });

    const devData = await requestRes.json();
    if (!requestRes.ok || devData.error) return console.log({error: `${devData?.error ? devData.error : "an unknown error"}`});

    const newEle = `
        ${devData._id ? `<p>devToken: <p onclick="revealDevOptions('devToken')" id="devToken" class="blur">${devData._id}</p>`:``}
        ${devData.premium ? `<p>Premium Dev Account</p>`:`<p>Regular Dev Account</p>`}
        ${devData.creationTimestamp ? `<p>Dev account created: ${checkDate(devData.creationTimestamp)}</p>`:`<p>Unknown creation date</p>`}
    `;

    document.getElementById('devAcc').innerHTML=newEle;
};

async function getPostAndProfileData(postID) {
    const postRes = await fetch(`${apiURL}/get/post/${postID}`, {
        method: 'GET', 
        headers
    });

    const postData = await postRes.json();

    if (!postRes.ok || postData.error) return {error: `${postData.error ? postData.error : "an unknown error"}`};
    if (debug) console.log(postData);

    const profileRes = await fetch(`${apiURL}/get/userByID/${postData.userID}`, {
        method: 'GET',
        headers,
    });

    const profileData = await profileRes.json();
    if (debug) console.log(profileData);

    if (!profileRes.ok || profileData.error) return {error: `${profileData.error ? profileData.error : "an unknown error"}`};


    return { "postData" : postData, "profileData": profileData };
}

async function requestVerification() {
    var input = document.getElementById('content_request_verification').value
    if (debug) console.log(input)

    const data = { 
        "content" : input,
    };
    // closeModal()

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    fetch(`${apiURL}/post/requestVerify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    }).then(res => {
        console.log(res)
    })
    /*const response = await fetch(`${apiURL}/post/requestVerify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });*/

    // const verification = await response.json()
    // if (debug) console.log(verification)
}

// MAKES SEARCH BAR APPEAR
function searchBar() {

}

function activeSearchBar() {
    document.getElementById("searchArea").innerHTML = `
        <div class="searchSelect search">
            <input id="searchBarArea" onkeyup="searchSocial()" placeholder="Search for Posts and Users...">
        </div>
    `
    document.getElementById('searchBar').innerHTML = `
        <button class="buttonStyled" onclick="unactiveSearchBar()" id="page6">Remove Search</button>
    `
}
function unactiveSearchBar() {
    document.getElementById("searchArea").innerHTML = ``
    document.getElementById('searchBar').innerHTML = `
        <button class="buttonStyled" onclick="activeSearchBar()" id="page6">Search</button>
    `
}

function postBar() {
    document.getElementById("postBar").innerHTML = `
        <form id="searchBar" class="searchSelect search" onsubmit="createPost()">
            <input type="text" id="newPostTextArea" placeholder="Type out your next update...">
        </form>
    `

    /* 
    <div class="searchSelect search">
        <input type="text" id="postBarArea" placeholder="Type out your next update...">
        <button class="buttonStyled" onclick="postbarPublish()">Publish Update</button>
    </div>
    */
}

// MAKES SEARCHBAR DISAPPEAR
function removeSearchBar() {
    document.getElementById("searchBar").innerHTML = ``
}

// SIGN UP PAGE
async function signupSocial() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="signup">
            <div class="main-feed">
                <h1>Dummy signup page</h1>
            </div>
            <div class="userInfo">
                <input type="text" id="usernameProfile" placeholder="Your username">
            </div>
                <div class="userInfo">
                <input type="text" id="displaynameProfile" placeholder="Your displayname">
            </div>
        </div>
    `
}

function saveLoginUser(userLoginToken) {
    localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(userLoginToken))
}

function checkLoginUser() {
  if (debug) console.log(localStorage.getItem(LOCAL_STORAGE_LOGIN_USER_TOKEN))
   //  localStorage.setItem(LOCAL_STORAGE_LOGIN_USER_TOKEN, JSON.stringify(userLoginToken))
}

// DEBUGGING MODE
function devMode() {
    debug = getCookie("debugMode");
    if (debug == "true") addDebug()
    else removeDebug()
}

// ADDING DEBUG INFO TO EVERYTHING
function addDebug() {
    for (debugging of document.getElementsByClassName("debug")) {
        debugging.classList.add("debug-shown"); 
    }
}

// REMOVES DEBUG INFO FROM EVERYTHING
function removeDebug() {
    for (debugging of document.getElementsByClassName("debug")) {
        debugging.classList.remove("debug-shown"); 
    }
}

// SWITCHING DEBUGGING MODE
function debugModeSwitch() {
    if(!debug) {
        setCookie("debugMode", true, 365);
        addDebug()
        debug = true
    } else {
        setCookie("debugMode", false, 365);
        removeDebug()
        debug = false
    }
}

// CHECK DEBUG COOKIE
function checkCookie() {
    var showmenu = getCookie("debugMode");

    if (showmenu == "true") {
        openSideBar()
        return;
    } if (showmenu == false) {
        closeSideBar()
        return;
    } else {
        setCookie("debugMode", false, 365)
        return;
    } 
}

// Cookie Settings
function setCookie(cname,cvalue,exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// GET REQUESTED COOKIE
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');

    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        } if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }

    return "";
}

// GET DATA FROM API FOR MAIN FEED
async function getFeed() {
    document.getElementById('mainFeed').innerHTML=``
    searchBar()
    // postBar()

    if (currentFeed) return buildView(currentFeed)
    if (debug) console.log("loading feed")

    const response = await fetch(`${apiURL}/get/allPosts`, { method: 'GET', headers})
    var data = await response.json()

    currentFeed = data.reverse()

    const params = await checkURLParams()

    if (params.paramsFound == false) return buildView(data)
    else return
}

// EASTER EGG
function test() {
    removeSearchBar()

    document.getElementById("mainFeed").innerHTML = `
        <div class="mainNameEasterEgg"> 
            <h1>You pressed the logo!!</h1>
            <p>You pressed the header name, thats pretty cool of you! Thank you for checking out interact!</p>
            <p>Press the button below to go back!</p>
            <button class="buttonStyled" onclick="switchNav(5)">Main Feed!</button>
        </div>
    `
}

function checkDate(time){
    var timeNum = 0
    if (!isNaN(time)) timeNum = parseFloat(time)
    else timeNum = time
    const date = dateFromEpoch(timeNum)
    
    return date
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

// BUILDING MAIN FEED
function buildView(posts) {
    if (searching) return

   // const userDiv = document.createElement("div") 
   // userDiv.innerHTML=`<div id="test"></div>`

   // // document.getElementById("mainFeed").append(userDiv)
   // document.getElementById('test').innerText=`test`


    document.getElementById("mainFeed").innerHTML = `
        ${posts.map(function(postArray) {
            return postElementCreate({post: postArray.postData, user: postArray.userData})
            /* 
            return `
                <div class="postArea">
                    <div class="subheaderMessage">
                        <p 
                            ${user ? ` onclick="userHtml('${post.userID}')" 
                            class="${user._id == currentUserLogin.userID ? "ownUser" : "otherUser"}"
                        >
                            ${user.displayName} @${user.username}` : '>Unknown User'} | ${timesince ? timesince : ""}</p> 
                        </p>
                    </div>
                    <p class="contentMessage">${post.content}</p>
                    <p class="debug">${post._id} - from: ${post.userID}</p>
                </div>
            `*/
            
            /* 
            return `
                <div class="publicPost">
                    <h2 ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}` : '>Unknown User'}</h2>
                    <p>${timesince}</p>
                    <p>${post.content}</p>
                    <p class="debug">${post._id} - from (${post.userID})</p>
                    <button class="buttonStyled" id="${post._id}" onclick="blankFunction('like')">like</button> | <button class="buttonStyled" onclick="blankFunction('repost')">repost</button> | <button class="buttonStyled" onclick="blankFunction('reply')">reply</button>
                </div>
            `
            */

        }).join(" ")}
    `
    devMode()
}
async function deletePost(postID) {
    if (debug) console.log(`deleting post ${postID}`)
    const response = await fetch(`${apiURL}/delete/removePost/${postID}`, { method: 'DELETE', headers})

    if (response.status == 200)  {
        if (debug) console.log("post deleted")
        document.getElementById(`popupOpen_${postID}`).remove()
        return document.getElementById(`postdiv_${postID}`).remove()
    }
    else return showModal("Error", "Something went wrong, please try again later")
}
//postContent_${post._id}

function editPost(postID, edited) {
    if (debug) console.log(`editing post ${postID}`)

    const oldMessage = document.getElementById(`postContent_${postID}`).innerText

    if (debug) console.log(oldMessage)
    document.getElementById(`postContentArea_${postID}`).innerHTML = `
        <form id="editPostForm" class="contentMessage"onsubmit="submitEdit('${postID}')">
            <input type="text" id="editPostInput" class="contentMessage contentMessageFormEdit" value="${oldMessage}">
        </form>
    `
    document.getElementById(`editButton_${postID}`).innerHTML=`<p onclick='cancelEdit("${postID}", "${oldMessage}", "${edited}")'>cancel edit</p>`
   // editButton_${post._id}

    document.getElementById(`editPostInput`).focus()
    document.getElementById("editPostForm").addEventListener("submit", function (e) { e.preventDefault()})

    // if (response.status == 200) return document.getElementById(`postdiv_${postID}`).remove()
    // else return showModal("Error", "Something went wrong, please try again later")
}

async function cancelEdit(postID, content, edited) {
    if (debug) console.log(`cancelling edit of post ${postID}`)

    const postData = await fetch(`${apiURL}/get/post/${postID}`, { method: 'GET', headers})
    if (!postData.ok) return showModal("Error", "Something went wrong, please try again later")
    const post = await postData.json()
    if (debug) console.log(post)
    const userData = await fetch(`${apiURL}/get/userByID/${post.userID}`, { method: 'GET', headers})
    if (debug) console.log(userData)
    if (!userData.ok) return showModal("Error", "Something went wrong, please try again later")

    const user = await userData.json()
    if (debug) console.log(user)
    return document.getElementById(`postElement_${postID}`).innerHTML = postElementCreate({post, user})
}

async function submitEdit(postID) {
    if (debug) console.log(postID)

    const newEdit = document.getElementById('editPostInput').value
    const data = {'postID': postID, 'content': newEdit}

    const response = await fetch(`${apiURL}/put/editPost`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    })
    
    if (debug) console.log(response)
    if (!response.status == 200) return showModal("Error something went wrong, please try again later")

    const editData = await response.json()

    if (debug) console.log(editData)
    const imageContent = checkForImage(editData.new.content)

    document.getElementById(`editButton_${postID}`).innerHTML=`<a onclick='editPost("${postID}")'>edit post</a>`

    return document.getElementById(`postContentArea_${postID}`).innerHTML = `
        <div class="textAreaPost">
            <p id="postContent_${postID}">${imageContent.content} </p>
            ${editData.new.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
        </div>
        <div class="PostAttachments">
            ${imageContent.image ? `<div>${imageContent.attachments.map(function(attachment) {return `${attachment}`}).join(" ")}</div>`:''}
        </div>
    `  
}
async function quotePost(postID) {
    const postResponse = await fetch(`${apiURL}/get/post/${postID}`, { method: 'GET', headers})
    if (!postResponse.ok) return showModal(`<h1>Error</h1><p>something went wrong</p>`)
    const post = await postResponse.json()
    const userResponse = await fetch(`${apiURL}/get/userByID/${post.userID}`, { method: 'GET', headers })
        
    if (!userResponse.ok) return showModal(`<h1>Error</h1><p>something went wrong</p>`)
    const user = await userResponse.json()
    if (debug) console.log(user)
    await showModal(`
        <h1>Create a new Post</h1>
        <div class="postModalActions">
            <p onclick="createPost({'quoteID':'${postID}'})">Upload Post</p>
            <p onclick="closeModal()">Close</p>
        </div>
        <div class="post">
            <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}` : '>Unknown User'}</p>
            <div class="postContent" id="postContentArea_${post._id}">
                <div class="textAreaPost">
                    <p id="postContent_${post._id}">${post.content}</p>
                    ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                </div>
            </div>
        </div>
        <textarea class="postTextArea" onkeyup="socialTypePost()" id="newPostTextArea"></textarea>
        <div id="foundTaggings"></div>
    `, "hide")
}

async function replyPost(postID) {
    const postResponse = await fetch(`${apiURL}/get/post/${postID}`, { method: 'GET', headers})
    if (!postResponse.ok) return showModal(`<h1>Error</h1><p>something went wrong</p>`)
    const post = await postResponse.json()
    const userResponse = await fetch(`${apiURL}/get/userByID/${post.userID}`, { method: 'GET', headers })
        
    if (!userResponse.ok) return showModal(`<h1>Error</h1><p>something went wrong</p>`)
    const user = await userResponse.json()
    if (debug) console.log(user)
    await showModal(`
        <h1>Create a new Reply</h1>
        <div class="postModalActions">
            <p onclick="createPost({'replyID':'${postID}'})">Upload Reply</p>
            <p onclick="closeModal()">Close</p>
        </div>
        <div class="post">
            <p class="pointerCursor ${post.userID == currentUserLogin.userID ? "ownUser" : "otherUser"}" ${user ? ` onclick="userHtml('${post.userID}')"> ${user.displayName} @${user.username}` : '>Unknown User'}</p>
            <div class="postContent" id="postContentArea_${post._id}">
                <div class="textAreaPost">
                    <p id="postContent_${post._id}">${post.content}</p>
                    ${post.edited ? `<p><i class="edited"> (edited)</i></p>` : `` }
                </div>
            </div>
        </div>
        <textarea class="postTextArea" onkeyup="socialTypePost()" id="newPostTextArea"></textarea>
        <div id="foundTaggings"></div>
    `, "hide")
}
function checkIfLiked(postID) {
    if (document.getElementById(`likePost_${postID}`).classList.contains("likedColour")) return true
    else return false
}

async function likePost(postID) {
    if (debug) console.log("liking post")

    const postIsLiked = checkIfLiked(postID)

    var data 
    if (postIsLiked) {
        if (debug) console.log("liking post")
        const response = await fetch(`${apiURL}/delete/unlikePost/${postID}`, { method: 'DELETE', headers})
        data = await response.json()



        if (!response.ok || data.error) return 
        document.getElementById(`likePost_${postID}`).classList.remove("likedColour");
        document.getElementById(`likePost_${postID}`).innerText = `${data.totalLikes} likes`
    }
    else {
        if (debug) console.log("liking post")
        const response = await fetch(`${apiURL}/put/likePost/${postID}`, { method: 'PUT', headers})

        data = await response.json()

        if (!response.ok || data.error) return 

        document.getElementById(`likePost_${postID}`).classList.add("likedColour");
        document.getElementById(`likePost_${postID}`).innerText = `${data.totalLikes} likes`
    }
    
    if (debug) console.log(data)

   
}

// USER DATA FOR FEED
async function getUserData(userID) {
    const response = await fetch(`${apiURL}/get/user/${userID}`, {
        method: 'GET',
        headers,
    });
    return response.json()
}

var currentSearch

// SEARCHING
async function searchSocial() {
    var input = document.getElementById('searchBarArea').value;
    searching = false
    searchResult(input)
}
async function addWritingToSeachBar(input) {
    document.getElementById('searchBarArea').value = input
}

async function searchResult(input) {
    if (!input) {
        if (debug) console.log("returning to feed")
        changeHeader('')

        return getFeed()
    }
    if (currentSearch == input){
        if (debug) console.log("same search")
        return console.log("same")
    }

    currentSearch = input
    searching = true
    headers.lookupkey = input

    changeHeader(`?search=${input}`)

    const response = await fetch(`${apiURL}/get/search/`, {
        method: 'GET',
        headers,
    });  

    var data = await response.json()

    if (debug) console.log("loading search")

    if (debug) console.log(data)
    
    if (!data.postsFound[0] && !data.usersFound[0]) return document.getElementById("mainFeed").innerHTML= `<div class="publicPost searchUser"><p>no results were found, try to seach something else.</div>`
    else console.log(data.postsFound)

    document.getElementById("mainFeed").innerHTML = `
        ${data.usersFound.reverse().map(function(user) {
            var timesince
            if (user.creationTimestamp) timesince = checkDate(user.creationTimestamp)
            
            return `
                <div class="publicPost searchUser">
                    <p class="${user._id == currentUserLogin.userID ? "ownUser" : "otherUser"}" onclick="userHtml('${user._id}')"> ${user.displayName} @${user.username} | ${user.creationTimestamp ? timesince : '' }</p>
                    <p>${user.description ? user.description : "no description"}</p>
                    <p>Following: ${user.followingCount} | Followers: ${user.followerCount}</p>
                    <p class="debug">${user._id}</p>
                </div>
            `
        }).join(" ")}
        ${data.postsFound.reverse().map(function(postArray) {
            return postElementCreate({post: postArray.postData, user: postArray.userData})
        }).join(" ")}
    `

    devMode()
    searching = false
}

async function createPostPage() {

}

/*
// BASE FOR CREATING POSTS (posts when you press create post)
async function createPost() {
    const data = { 
        "userID" : currentUserLogin.userid, 
        "content" : document.getElementById('newPostTextArea').value
    };

    
    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    const response = await fetch(`${apiURL}/post/createPost`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    if (debug) console.log(response.json())

    document.getElementById("mainFeed").innerHTML = `
        <h1>Your post was sent!</h1>
    `
}
*/
// PUBLISH WRITTEN POST
async function createPost(params) {
    if (debug) console.log(params)
  //   var input = document.getElementById('postBarArea').value;
    var input = document.getElementById('newPostTextArea').value
    if (debug) console.log(input)

    var quoted 
    if (params?.quoteID) quoted = params.quoteID
    else quoted=undefined

    var replied
    if (params?.replyID) replied = params.replyID
    else replied=undefined

    const data = { 
        "userID" : currentUserLogin.userID, 
        "content" : input,
        "quoteReplyPostID" : quoted,
        "replyingPostID" : replied
    };

    closeModal()

    if (debug) console.log(currentUserLogin) 
    if (debug) console.log(data)

    const response = await fetch(`${apiURL}/post/createPost`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    const postData = await response.json()
    if (debug) console.log(postData)

    if (response.ok) return showModal(`<h1>Your post was sent!</h1> <p>${postData.content}</p>`)
    else return showModal(`<h1>something went wrong.</h1> <p>${postData.code}\n${postData.msg}</p>`)
}

// BLANK FUNCTION FOR LATER BUTTONS TO LIKE / REPLY / REPOST
function blankFunction(action) {
  console.log(`a dummy ${action} was requested`)
}

function removeEditUser() {
    document.getElementById("mainFeed").innerHTML = ``
    document.getElementById("resultEditUsername").innerHTML = ``
}

function editUser() {
    document.getElementById("mainFeed").innerHTML = `
        <div class="username">
            <input id="newUsername"></input>
            <div id="resultEditUsername"></div>
            <button class="buttonStyled" onclick=renameUsername()>Edit Username</button>
        </div>
    `
}

// EDIT DISPLAY NAME
async function renameUsername() {
    const newUsername = document.getElementById('newUsername').value;
    // editUsernameFrontend
    if (!newUsername) {
        document.getElementById("resultEditUsername").innerHTML = `
            <p>You did not enter a new username</p>
        `
    }
    else {
        const data = {
            userID: currentUserLogin.userID,
            newUsername
        }   
    
        const response = await fetch(`${apiURL}/put/editUsername`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });

        const newData = await response.json()
    
        document.getElementById("resultEditUsername").innerHTML = `
            <p>Changed username! from ${newData.before.username} to ${newData.new.username}</p>
        `
    }
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

    var attachments = []
    for (index = 0; index < contentArgs.length; index++) {
        if (contentArgs[index].startsWith('https://')) {
            for (const imageFormat of imageFormats) {
                if (contentArgs[index].endsWith(imageFormat)) {
                    foundImage = true
                   // contentArgs[index] = `<img class="messageImage" src="${contentArgs[index]}"></img>`
                    attachments.push(`<img alt="userImage" class="messageImage" width="100px" src="${contentArgs[index]}"></img>`)
                }
            }

            for (const videoFormat of videoFormats) {
                if (contentArgs[index].endsWith(videoFormat.urlEnd)) {
                    foundImage = true
                    //contentArgs[index] = `\n<video width="320" height="240" controls><source src="${contentArgs[index]}" type="video/${videoFormat.type}"></video>`
                    attachments.push(`<video alt="uservideo" width="320" height="240" controls><source src="${contentArgs[index]}" type="video/${videoFormat.type}"></video>`)
                }
            }
            const videoId = getId(contentArgs[index]);

            if (videoId) {
                foundImage = true
                const iframeMarkup = `<iframe title="uservideo" width="320" height="240" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
               // contentArgs[index] = iframeMarkup
                attachments.push(iframeMarkup)
            }

            if (contentArgs[index].startsWith("https://huelet.net/w/")) {
                foundImage = true

                const URL = contentArgs[index]
                var videoID = URL.replace("https://huelet.net/w/", "")

                const iframeHuelet = `<iframe src="https://publish.huelet.net/?embed=true&vuid=${videoID}" width="320" height="240" frameborder="0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen="true"></iframe>`
                attachments.push(iframeHuelet)
            }
        }
    }

    return {"image" : foundImage, "content": contentArgs.join(" "), attachments}
}
