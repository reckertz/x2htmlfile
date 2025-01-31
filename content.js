// content.js
let originalnodes = []; // von query gegen DOM
let articles = []; // aufbereitet aus der Anwendung aus originalnodes
let seen = new Set(); // zur Duplikatkontrolle
let lastarticle = -1; // initialisierung: noch nichts passiert, Fortschreibung aus der Anwendung
let classrules = {};
let classnorules = {};
let hashcodes = new Set();
let timelineDiv;
let stopRecording = false;
let observer;
let loopisactive = true;

let dofinal = false;
let retryprotcount = 0;

let oldlen = 0;
let newlen = 0;

// Verbindung zum Popup-Skript herstellen
let port;
/**
 * Listener für die Requests von popup
 * startThreadData - startet die Durchführung, ruft autoScrollAndObserve
 * finishThreadData - beendet die Durchführung, setzt stopRecording=true ...
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    async function handleResponse() {
        console.log("request.action:" + request.action);
        if (request.action === "startThreadData") {
            initAllGlobals();
            port = chrome.runtime.connect({
                name: "content_to_popup"
            });
            console.log(">>>startThreadData detected<<<<");
            port.postMessage({
                text: "startThreadData detected"
            });
            autoScrollWrapper();
            // Starten aktuelle Seite und dann automatisch Blättern
            let result = {
                message: "gestartet"
            };
            sendResponse({
                result
            });
        }

        if (request.action === "cancelThreadData") {
            console.log("cancelThreadData detected");
            stopRecording = true;
            let iloop = 0;
            while (dofinal === false || iloop < 10) {
                // Warten auf Godot
                await new Promise(resolve => setTimeout(resolve, 500));
                iloop++;
            }
            dofinal = true;
            console.log("cancelThreadData:" + articles.length);
            console.log("classrules:" + Object.keys(classrules).length);
            console.log("classnorules:" + Object.keys(classnorules).length);
            let result = {
                error: false,
                message: "OK-canceled",
                
            };
            console.log("sendResponse mit result");
            sendResponse({
                result
            });
        }

        if (request.action === "finishThreadData") {
            console.log("finishThreadData detected");
            stopRecording = true;
            let iloop = 0;
            while (dofinal === false || iloop < 10) {
                // Warten auf Godot
                await new Promise(resolve => setTimeout(resolve, 500));
                iloop++;
            }
            dofinal = true;
            console.log("finishThreadData:" + articles.length);
            console.log("classrules:" + Object.keys(classrules).length);
            console.log("classnorules:" + Object.keys(classnorules).length);
            let result = {
                error: false,
                message: "OK",
                url: window.location.href,
                articles: articles,
                classrules: classrules,
                classnorules: classnorules
            };
            console.log("sendResponse mit result");
            sendResponse({
                result
            });
        }
    }
    console.log("start handleResponse:", request.action);
    handleResponse();
    // Return true to let Chrome know the response is asynchronous
    return true;
});

function initAllGlobals() {
    originalnodes = []; // von query gegen DOM
    articles = []; // aufbereitet aus der Anwendung aus originalnodes
    seen = new Set(); // zur Duplikatkontrolle
    lastarticle = -1; // initialisierung: noch nichts passiert, Fortschreibung aus der Anwendung
    classrules = {};
    classnorules = {};
    hashcodes = new Set();
    timelineDiv;
    stopRecording = false;
    observer;
    loopisactive = true;

    dofinal = false;
    retryprotcount = 0;

    oldlen = 0;
    newlen = 0;
}



async function autoScrollWrapper() {
    // Beendigung von autoScroll sollte über finishThreadData erfolgen - heisse Sache
    let result = await autoScroll();
    console.log("after autoScroll");
    dofinal = true;
}

/**
 * autoScroll - Initialisierung und Endlosschleife, bis der User unterbricht
 * returns result (automatisch gewrapped als result, aber einfach nutzbar)
 */
async function autoScroll() {
    // Kontrollvariablen
    // holen der URL für die Dokumentation
    // Positionieren an den Anfang
    timelineDiv = document.querySelector('div[aria-label="Timeline: Konversation"]');
    if (timelineDiv === null) {
        timelineDiv = document.querySelector('div[aria-label="Home-Timeline"]');
    }
    timelineDiv.scrollIntoView({
        behavior: "auto", // smooth
        block: "start",
        inline: "start" // "nearest"
    });
    // Warte eine gewisse Zeit, z.B. 1 Sekunde
    await new Promise(resolve => setTimeout(resolve, 1000));
    // initial articles laden
    let nodes = document.querySelectorAll("article");
    nodes.forEach(function (node, inode) {
        let text = node.textContent;
        port.postMessage({
            text: "initial:" + text.substring(0, 50)
        });
        console.log(">>>initial:" + text.substring(0, 50) + "<<<");

        let article = {
            origin: "initial",
            status: "open",
            text: text,
            hashstring: calcHashString(text),
            node: node,
            html: "empty"
        };
        // check und reload
        if (hashcodes.has(article.hashstring)) {
            console.log("*****DUPLICATE FOUND***** (Hashcode on INITIAL)");
            port.postMessage({
                text: "initial: DUPLICATE"
            });
            return; // ignore
        } else {
            hashcodes.add(article.hashstring);
        }
        if (text.length > 100) {
            text = text.substring(0, 100);
        }
        console.log("initial:", inode, text);
        seen.add(node);
        articles.push(article);
    });
    console.log('***Initial divs detected:' + articles.length);
    // observer = new MutationObserver(handleNewArticles);
    // if (node.nodeType === Node.ELEMENT_NODE && node.matches('article')) { // div.css-175oi2r[data-testid="cellInnerDiv"]')) {
    observer = new MutationObserver((mutationsList) => {
        console.log("mutationsList:" + mutationsList.length);
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                let news = [];
                mutation.addedNodes.forEach(newnode => {
                    if (newnode.tagName === "DIV") {
                        let node = newnode.querySelector('article');
                        if (node === null) {
                            return;
                        }
                        let text = node.textContent;
                        port.postMessage({
                            text: "observer:" + text.substring(0, 50)
                        });
                        console.log(">>>observer:" + text.substring(0, 100) + "<<<");
                        let article = {
                            origin: "observer",
                            status: "open",
                            text: text,
                            hashstring: calcHashString(text),
                            node: node,
                            html: "empty"
                        };
                        // check und reload
                        if (hashcodes.has(article.hashstring)) {
                            console.log("*****DUPLICATE FOUND-hash***** (Hashcode on OBSERVER)");
                            port.postMessage({
                                text: "observer: DUPLICATE"
                            });
                            return; // ignore
                        }
                        if (seen.has(node)) {
                            console.log("*****DUPLICATE FOUND-node***** (Hashcode on OBSERVER)");
                            port.postMessage({
                                text: "observer: DUPLICATE"
                            });
                            return; // ignore
                        }
                        hashcodes.add(article.hashstring);
                        seen.add(node);
                        let inode = articles.length;
                        console.log("observer-stored:", inode, text);
                        articles.push(article);
                    }
                });
            }
        } // for
    });
    // Optionen für den Observer
    const config = {
        childList: true, // Beobachte das Hinzufügen/Entfernen von Kindelementen
        subtree: true // Beobachte Änderungen in allen Unterelementen
    };
    // Starte den Observer auf dem Bezug
    observer.observe(timelineDiv, config);

    // hier gehen die Loop-Steuerungen los
    for (let i = 0; i < 1000; i++) {
        console.log(">>>MAINLOOP: " + i);
        if (stopRecording === true) {
            console.log("STOPPED in MAINLOOP");
            break;
        }
        // abarbeiten der articles, die noch open sind
        let icount = 0;
        let len = articles.length;
        oldlen = len; // für den finalen Vergleich bei Abbruch
        for (let j = 0; j < len; j++) {
            let article = articles[j];
            if (article.status !== "open") {
                // bereits bearbeitet
                continue;
            }
            icount++;
            let result = await checkArticle(article);
        }
        // hier auf neue Seite
        if (stopRecording === true) {
            console.log("STOPPED in AFTER article loop");
            break;
        }
        let actlen = articles.length;
        //if (icount > 0 || len !== actlen) {
        // Verarbeiten neuer Artikel aus observer
        console.log(">>>nach observer:", len, actlen);
        if (actlen > len) {
            continue;
        }
        // positionieren auf letzten article
        let node = articles[articles.length - 1].node;
        node.scrollIntoView({ //node.scrollIntoView({
            behavior: "auto", // smooth
            block: "end",
            inline: "start" // "nearest"
        });
        // hier eigentliches Blättern
        for (let ipage = 0; ipage < 5; ipage++) {
            window.scrollBy({
                top: window.innerHeight, // 1000
                behavior: "smooth"
            });
            let ms = 1000 + (ipage * 250);
            await new Promise(resolve => setTimeout(resolve, ms));
            // hier sollte vom observer schon etwas passiert sein!!!
            let newlen = articles.length;
            if (newlen > actlen) {
                break;
            }
        }
        let newlen = articles.length;
        console.log(">>>nach scrollBy:", actlen, newlen);
        if (newlen > actlen) {
            continue;
        }
        if (stopRecording === true) {
            console.log("STOPPED after idle scrollBy");
            break;
        }
    }
    // Verhindern, dass noch weitere, neue article kommen!
    if (stopRecording === true) {
        observer.disconnect();
        observer = null;
        console.log("STOPPED observer");
    }
    newlen = articles.length;
    if (newlen > oldlen) {
        let icount = 0;
        for (let j = oldlen; j < newlen; j++) {
            let article = articles[j];
            if (article.status !== "open") {
                // bereits bearbeitet
                continue;
            }
            icount++;
            let result = await checkArticle(article);
            console.log("*****Postprocessing: " + icount + " *****");
        }
        console.log("*****Postprocessing - finished: " + icount + " *****");
        port.postMessage({
            text: "*****Postprocessing: " + icount + " *****"
        });
    }
    console.log("*****Ende des Thread erreicht*****");
    port.postMessage({
        text: "*****Ende des Thread erreicht*****"
    });
    return;
} // function


async function checkArticle(article) {
    let node = article.node;
    let ret = {};
    let msgtext = article.text.substring(0, 50);
    if (typeof node === "undefined" || node === null) {
        article.html = "";
        article.status = "checked";
        return {
            error: true,
            message: "node undefined",
            dorepeat: false
        }
    }
    for (let itry = 0; itry < 5; itry++) {
        let container = null;
        let alink = node.querySelector("a[role=link");
        if (alink !== null) {
            container = alink;
        } else {
            let tweetPhoto = node.querySelector("div[data-testid=tweetPhoto]");
            if (tweetPhoto !== null) {
                container = tweetPhoto;
            } else {
                let videoPlayer = node.querySelector("div[data-testid=videoPlayer]");
                if (videoPlayer !== null) {
                    container = videoPlayer;
                }
            }
        }
        if (container !== null) {
            let video = container.querySelector("video");
            let img = container.querySelector("img");
            let svg = container.querySelector("svg"); //TODO: nochmal prüfen
            if (video === null && img === null) {
                console.log("REPEAT:" + itry + " " + msgtext);
                if (itry === 4) {
                    retryprotcount++;
                    if (retryprotcount <= 10) {
                        console.log(container.outerHTML);
                    }
                }
                if (itry === 0) {
                    port.postMessage({
                        text: "REPEAT:" + itry + " " + msgtext
                    });
                } else {
                    port.postMessage({
                        text: "REPEAT:" + itry
                    });
                }
                if (itry === 0) {
                    container.scrollIntoView({ //node.scrollIntoView({
                        behavior: "auto", // smooth
                        block: "start",
                        inline: "start" // "nearest"
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 500));
                ret.error = true;
                ret.message = "retry:" + itry;
                article.status = "checked";
                continue;
            } else {
                ret.error = false;
                ret.message = "retry:" + itry;
                prepHTML(article);
                article.status = "checked";
                break;
            }
        }
        // TODO: clone und diesen modifizieren
        prepHTML(article);
        ret.error = false;
        ret.message = "retry:" + itry;
        article.status = "checked";
        break;
    } // for
    return ret; // error, message; article sollte implizit geändert werden
}

/**
 * prepHTML - article.html erzeugen aus clone von article.node
 * @param {*} article 
 */
function prepHTML(article) {
    // erst die oberste Ebene abfackeln
    let originalNode = article.node;
    let classNames = Array.from(originalNode.classList);
    classNames.forEach(function (className, iname) {
        if (typeof classrules[className] === "undefined") {
            let rules = getCSSRulesForClass(className);
            classrules[className] = rules;
        }
    });
    let computedStyle = originalNode.style;
    originalNode.savedstyle = getComputedStyleAsString(computedStyle); // top-Level
    // now loop all subnodes
    const allSubnodes = originalNode.querySelectorAll('*'); // für Manipulationen
    allSubnodes.forEach(function (node, inode) {
        // Auswertung abhängige classes
        let classNames = Array.from(node.classList);
        classNames.forEach(function (className, iname) {
            if (typeof classrules[className] === "undefined") {
                let rules = getCSSRulesForClass(className);
                classrules[className] = rules;
            }
        });
        //prepNodeLayout(node)
        let computedStyle = node.style;
        node.savedstyle = getComputedStyleAsString(computedStyle);
        // TODO: später selektive style-Direktiven nach node.tagName 
    });
    let clonedNode = originalNode.cloneNode(true);
    // im clonedNode erfolgt jetzt die Aufarbeitung
    clonedNode.style = clonedNode.savedstyle;
    delete clonedNode.savedstyle;
    const clonedSubnodes = clonedNode.querySelectorAll('*'); // für Manipulationen
    clonedSubnodes.forEach(function (node, inode) {
        if (node.tagName === "A") {
            let href = node.getAttribute("href");
            if (!href.startsWith("http")) {
                node.setAttribute("href", "https://x.com" + href);
            }
        }
        if (node.tagName === "IMG") {
            let src = node.getAttribute("src");
            if (!src.startsWith("http")) {
                node.setAttribute("src", "https://x.com" + src);
            }
            let hiddenelement = closest(node, 'div[style*="visibility: hidden"]');
            if (hiddenelement !== null) {
                console.log("corrected: visiblitiy hidden");
                hiddenelement.style.visibility = "visible";
            }
        }
        if (node.tagName === "VIDEO") {
            let poster = node.getAttribute("poster");
            if (typeof poster === "string" && poster.length > 0) {
                if (!poster.startsWith("http")) {
                    node.setAttribute("poster", "https://x.com" + poster);
                }
            }
        }
        // hier wird es kriminell: wenn div data-testid="videoPlayer" kein video-tag hat, dann nochmal aufrufen
        if (node.tagName === "DIV" && node.getAttribute("data-testid") === "videoPlayer") {
            let video = node.querySelector("video");
            if (video === null) {
                // nochmal aufrufen und warten?
                console.log("*** video ohne poster!!!");
            }
        }
        // auch kriminell: div data-testid="tweetPhoto" kann das img noch fehlen, also auch dann nochmal positionieren
        if (node.tagName === "DIV" && typeof node.getAttribute("data-testid") === "tweetPhoto") {
            let img = node.querySelector("img");
            if (img === null) {
                // nochmal aufrufen und warten?
                console.log("*** Photo ohne Image!!!");
            }
        }
    });
    article.html = clonedNode.outerHTML;
    return;
}

// Function to find the closest ancestor matching a selector
function closest(element, selector) {
    // Get the parent element
    while ((element = element.parentElement) && !((element.matches || element.msMatchesSelector).call(element, selector)));
    return element;
}

function getComputedStyleAsString(computedStyles) {
    //const computedStyles = window.getComputedStyle(element);
    let styleString = '';
    for (let i = 0; i < computedStyles.length; i++) {
        const style = computedStyles[i];
        const value = computedStyles.getPropertyValue(style);
        if (value !== "none") {
            styleString += `${style}: ${value};`;
        }
    }
    return styleString;
}


function getCSSRulesForClass(className) {
    let rules = [];
    for (let sheet of document.styleSheets) {
        try {
            for (let rule of sheet.cssRules) {
                if (rule.selectorText && rule.selectorText.includes(`.${className}`)) {
                    rules.push(rule.cssText);
                }
            }
        } catch (e) {
            console.logor("Stylesheet konnte nicht gelesen werden:", e);
        }
    }
    return rules;
}



function calcHashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        // Der ASCII-Code des aktuellen Zeichens wird addiert und durch 33 rotiert
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    let hashcode = (hash >>> 0).toString(16)
    // Konvertiere den Hash in eine positive Zahl und in eine hexadezimale Darstellung
    return hashcode; // >>> 0 wandelt die Zahl in eine unsigned 32-bit Integer um
}