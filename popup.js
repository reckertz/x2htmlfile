let html = "";
document.getElementById("startThread").disabled = false;

document.getElementById('startThread').addEventListener('click', () => {
    let list = document.getElementById("myList");
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    } 
    document.getElementById("startThread").disabled = true;
    document.getElementById("cancelThread").disabled = false;
    document.getElementById("finishThread").disabled = false;
    document.getElementById("pleasewait").style.display = "none";

    addMessage("___Start Requested", 1);
    try {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "startThreadData"
            }, (response) => {
                if (response && response.result) {
                    addMessage("***" + JSON.stringify(response.result), 2);
                }
            });
        });
    } catch (err) {
        debugger;
        console.log(err.stack);
        addMessage(err.stack, 1);
    }
});

// laufender Nachrichtenempfang
// Höre auf die Verbindung vom Content-Skript
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === "content_to_popup") {
        port.onMessage.addListener(function (msg) {
            //console.log("Daten von content.js erhalten:", msg);
            console.log("received:" + msg.text);
            addMessage(msg.text);
            // Hier kannst du das erhaltene msg-Objekt weiterverarbeiten
        });
    }
});


function addMessage(message, level) {
    // level 1 - popup, level 2 - contents
    let list = document.getElementById("myList");
    // Erstellen des neuen LI-Elements
    let newItem = document.createElement("li");
    newItem.textContent = message;
    if (typeof level === "undefined" || level === 2) {
        newItem.style.backgroundColor = "mistyrose";
    } else {
        newItem.style.backgroundColor = "silver";
    }
    // Einfügen des neuen LI-Elements am Beginn der Liste
    let liCount0 = list.getElementsByTagName("li").length;
    list.insertBefore(newItem, list.firstChild);
    let liCount = list.getElementsByTagName("li").length;
    // Wenn die Anzahl der LI-Elemente größer als 50 ist, löschen wir das letzte Element
    if (liCount > 50) {
        list.removeChild(list.lastElementChild);
    }
}

document.getElementById('cancelThread').addEventListener('click', () => {
    document.getElementById("startThread").disabled = true;
    document.getElementById("cancelThread").disabled = true;
    document.getElementById("finishThread").disabled = true;
    document.getElementById("pleasewait").style.display = "inline-block";

    addMessage("___Cancel Requested", 1);
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "cancelThreadData"
        }, (response) => {
            if (response && response.result) {
                let msg = response.result.message;
                msg += " " + response.result.error;
                addMessage("###" + msg, 2);
                document.getElementById("pleasewait").style.display = "none";
                document.getElementById("startThread").disabled = false;
            }
        });
    });
});



document.getElementById('finishThread').addEventListener('click', function () {

    document.getElementById("startThread").disabled = true;
    document.getElementById("cancelThread").disabled = true;
    document.getElementById("finishThread").disabled = true;
    document.getElementById("pleasewait").style.display = "inline-block";

    addMessage("___Finish Requested", 1);
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "finishThreadData"
        }, (response) => {
            if (response && response.result) {
                let msg = response.result.message;
                msg += " " + response.result.error;
                msg += "=>" + response.result.articles.length;
                addMessage("###" + msg, 2);

                let classkeys = Object.keys(response.result.classrules);
                classkeys = classkeys.sort();
                let classarray = [];
                classkeys.forEach(function (classkey, ikey) {
                    classarray.push(response.result.classrules[classkey]);
                });
                addMessage("###" + msg, 2);
                try {
                    html = "";
                    html = '<!DOCTYPE html>';
                    html += '<html>';
                    html += "<head>";
                    html += '<meta http-equiv="content-type" content="text/html; charset=utf-8"/>';
                    html += "<title>" + "X-Thread" + "</title>";
                    html += "<style type='text/css'>\n";
                    html += classarray.join("\n");
                    html += "</style>";
                    html += "</head>";
                    html += "<body>";
                    html += "<a href='" + response.result.url + "' target='_blank'>";
                    html += "<h3>" + response.result.url + "</h3>";
                    html += "</a>";
                    // es muss articles[i].html ausgewertet werden!!!
                    response.result.articles.forEach(function (article, iarticle) {
                        if (article.html !== "empty" && article.html.length > 0) {
                            html += "<div class='C517'>";
                            html += article.html;
                            html += "</div>";
                        }
                    });
                    html += "</body>";
                    html += "</html>";
                    msg = " html-string:" + html.length;
                    addMessage("###" + msg, 2);
                    const blob = new Blob([html], {
                        type: 'text/html'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    let fname = "P" + Math.floor(Math.random() * 1000000) + 1;
                    a.download = fname + ".html";
                    a.click();
                    document.getElementById("pleasewait").style.display = "none";
                    document.getElementById("startThread").disabled = false;
                } catch (err) {
                    msg = " ERROR:" + err.stack;
                    addMessage("___" + msg, 1);
                    document.getElementById("pleasewait").style.display = "none";
                    document.getElementById("startThread").disabled = false;
                }
            }
        });
    });
});
addMessage("___" + "start popup.js", 1);