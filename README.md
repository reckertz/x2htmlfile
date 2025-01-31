# x2htmlfile
Extract X- (Twitter) Tweets and export as HTML-File

# Chrome-Erweiterung \"x2htmlfile\"

## Einführung

Diese Chrome-Erweiterung ermöglicht es Benutzern, Tweets sowohl aus der
Konversations-Timeline als auch der Home-Timeline als HTML-Datei zu
speichern und bereitzustellen.

## Installation

Download der Erweiterung: Laden Sie die Erweiterung von \[Ihre Website
oder GitHub-Repository\] herunter.

-   Chrome Erweiterungen öffnen:

    -   Öffnen Sie Google Chrome.
    -   Geben Sie chrome://extensions/ in die Adressleiste ein und
        drücken Sie Enter.

-   Erweiterung laden:

    -   Aktivieren Sie den Entwicklermodus in der oberen rechten Ecke.
    -   Klicken Sie auf \"Entpackte Erweiterung laden\" und wählen Sie
        das Verzeichnis aus, in dem sich die Erweiterungsdateien
        befinden.

## Nutzung

### Funktionen

x2htmlfile sichert angezeigte Tweets aus X (ehemals Twitter) und stellt
sie als HTML-Datei zum Download aus dem Browser bereit.

Zu beachten ist dass x2htmlfile wie folgt vorgeht:

-   es wird auf den ersten Tweet positioniert und diese Daten werden
    gesichert
-   es werden alle Tweets, die vorhanden sind, durch automatisches
    Blättern angezeigt und dabei gesichert
-   der Nutzer kann dabei jederzeit die Bereitstellung der HTML-Datei
    oder den Abbruch des Blätterns veranlassen

### Schritt-für-Schritt Anleitung

-   Erweiterung aktivieren: Stellen Sie sicher, dass die Erweiterung
    aktiviert ist.

-   Positionieren Sie die Anzeige auf den Anfang: entweder mit F5 oder
    durch das Icon im Browser

-   Rufen Sie x2htmlfile auf durch Click auf das Icon im Browser

-   Clicken Sie auf „**Start Recording Tweets**" und starten dadurch die
    Aufzeichnung der Tweets

    -   Es werden die Tweets durchgeblättert
    -   Im Browser wird die Anzeige jeweils automatisch aktualisiert
    -   Dazu wird ein Protokoll in der Anzeige von x2htmlfile ausgegeben

-   Clicken Sie auf „**Stop Recording and Download HTML-File**", dadurch
    wird die Aufzeichnung beendet und die Bereitstellung der HTML-Datei
    ausgelöst

    -   Achtung: der Stop erfolgt nicht unmittelbar, sondern es werden
        erst die Tweets, auf die bereits geblättert wurde, gesichert
    -   Während die interne Aufbereitung erfolgt, wird ein Hinweis
        „**Please Wait**" eingeblendet, der Hinweis verschwindet
        automatisch, wenn die Bereitstellung erfolgt
    -   die Bereitstellung und Speicherung erfolgt durch
        Standardfunktionen des Browsers, es liegt am Nutzer, die
        HTML-Dateien strukturiert abzulegen
    -   die erzeugte HTML-Datei kann dann mit dem Browser angezeigt
        werden und aus dem Browser heraus gedruckt werden

-   Clicken sie auf „**Cancel Recording**", wenn die Aufzeichnung
    abgebrochen werden soll, es dauert auch hier wieder einen kleinen
    Moment, bis die laufenden Arbeiten ordnungsgemäß geschlossen werden,
    es erfolgt keine Bereitstellung einer HTML-Datei

### Eventuelle Probleme

-   Erweiterung funktioniert nicht: Stellen Sie sicher, dass der
    Entwicklermodus aktiviert ist und die Erweiterung korrekt
    installiert wurde.
-   Wenn **Twitter im dark-mode** angezeigt wird, dann erscheint Text
    nicht mehr kontrastreich, Empfehlung daher: mit hellem Hintergrund
    arbeiten, dann stimmt der Textkontrast.
-   Tweets haben **leere Flächen statt Bilder**, dieser Fehler kann
    durch zu langsame Ladezeiten von externen Servern entstehen. Dieser
    Fehler kann technisch nicht sinnvoll vermieden werden, als Lösung
    wird empfohlen, die Sicherung zu wiederholen.

<!-- -->

-   **Button „Wahrscheinlichen Spam anzeigen"** -- der Button ist formal
    nicht identifizierbar, die Betextung erfolgt in userspezifischer
    Landessprache, das kann eine hohe Variation haben.
-   Anzeige „Weitere Antworten anzeigen, inklusive solcher, die
    beleidigende Inhalte enthalten können", darauf folgt ein** Button
    „Anzeigen"** -- der Button ist formal nicht erkennbar, die Betextung
    erfolgt in userspezifischer Landessprache
-   Der** Hinweis „Mehr anzeigen"** kann aus der Anzeige der HTML-Datei
    nicht aufgelöst werden, stattdessen kann entweder ein Bild
    angeclickt werden oder der Name, um auf den Artikel oder die
    Timeline des Autors zu kommen.
-   **Werbung** wechselt -- unterschiedliche Aufrufe können daher zu
    unterschiedlichem Layout im Ergebnis im htmlFile führen
-   Videos können u.U. aus der erzeugten HTML-Datei bei der Anzeige im
    Browser nicht abgespielt werden -- weil z.B. nur ein Bild angezeigt
    wird, der Link dazu wird noch geprüft

## Technische Details

x2htmlfile ist eine Chrome-Extension mit folgenden Komponenten:

-   manifest.json -- Konfigurationsdatei für die Chrome-Extension

-   icon.png -- Icon für den Aufruf der Chrome-Extension aus dem
    Chrome-Browser heraus

-   popup.html -- Benutzerinterface für die Arbeit mit der
    Chrome-Extension

-   popup.js -- Unterstützungsfunktionen für popup.html und Aufrufe an
    content.js Events

    -   startThread -- Starten der Aufzeichnung in content.js
    -   cancelThread -- Abbruch der Aufzeichnung in content.js
    -   finishThread -- Beendigung der Aufzeichnung, Aufbereitung der
        HTML-Datei und Bereitstellung der HTML-Datei zum Download

-   content.js -- Kernfunktionen der Chrome-Extension

    -   popup.js und content.js verständigen sich über Events und
        zusätzlich gibt es kontinuierliche Rückmeldungen aus content.js
        an popup.js

    -   es gibt einen zentralen chrome Listener, der die Kommandos für
        startThreadData, cancelThreadData und finishThreadData erkennt
        und umsetzt

    -   für die laufenden Rückmeldungen wird chrome.runtime.connect
        genutzt und port.postMessage, eine eleganten und robuste Lösung

    -   autoScroll() ist die zentrale Funktion zur Abfrage der Tweets,
        die von X (Twitter) bereitgestellt werden

        -   Es werden zunächst die Tweets übernommen, die bereits
            angezeigt werden, diese werden in die zentrale Tweet-Tabelle
            übernommen

        -   danach wird ein MutationsObserver gestartet, der so
            konfiguriert wird, dass er neue Tweets erkennen und
            bereitstellen kann. Die Bereitstellung erfolgt in einer
            zentralen Tweet-Tabelle

        -   in einer asynchronen Loop-Logik wird die zentrale
            Tweet-Tabelle abgearbeitet. Diese Abarbeitung geschieht
            parallel zum MutationsObserver. Je Tweet gilt

            -   Prüfung auf Vollständigkeit
            -   asynchrone Loop-Logik, wenn die Daten noch nicht
                vollständig sind
            -   Überarbeitung relativer Links und Umsetzung auf Links zu
                [https://x.com](https://x.com/)
            -   Erzeugung eines HTML-Abschnitts (div) je Tweet

        -   Die Beendigung der Abarbeitung im „endless loop" wird
            ausgelöst durch ein Flag, das aus dem Cancel- oder dem
            Finish-Event gesetzt wird

            -   in autoScroll werden alle bereits geladenen Tweets, die
                sich in der zentralen Tabelle befinden, noch
                abgearbeitet, bevor autoScroll beendet wird

Weitere Funktionen in content.js dienen den o.a. Hauptfunktionen:

-   checkArticle prüft Tweets, die technisch mit tagName article
    bereitgestellt werden, auf Vollständigkeit
-   prepHTML bereitet den HTML-Code je Tweet auf
-   initAllGlobals -- initialisiert alle Variablen, die in content.js
    funktionsübergreifend genutzt werden
-   closest -- technisch Hilfsfunktion, entspricht closest von jQuery
-   getComputedStyleAsString -- technische Hilfsfunktion für die
    Zusammenstellung aller Style-Direktiven als String
-   getCSSRulesForClass -- technische Hilfsfunktion für die Übernahme
    der style-Direktiven, die sich aus Class-Vorgaben ergeben
-   calcHashString -- Hilfsfunktion für eine Hashcode-Berechnung, diese
    Funktion wird ersatzweise genutzt, weil es keine trivialen id's zu
    den HTML-Elementen gibt

## 

MIT-Lizenz

## 

Für weitere Informationen oder Support, kontaktieren Sie uns über Github
