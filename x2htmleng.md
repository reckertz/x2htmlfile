# Chrome Extension "x2htmlfile"

## Introduction

This Chrome extension allows users to save and provide tweets from both the conversation timeline and the home timeline as an HTML file.

## Installation

Download the extension: Download the extension from [your website or GitHub repository].

-   Open Chrome Extensions:

    -   Open Google Chrome.
    -   Enter `chrome://extensions/` in the address bar and press Enter.

-   Load the extension:

    -   Enable developer mode in the top right corner.
    -   Click on "Load unpacked extension" and select the directory containing the extension files.

## Usage

### Features

x2htmlfile saves displayed tweets from X (formerly Twitter) and provides them as an HTML file for download from the browser.

Please note that x2htmlfile works as follows:

-   It positions itself on the first tweet and saves the data.
-   It automatically scrolls through and saves all available tweets.
-   The user can stop the scrolling or initiate the HTML file generation at any time.

### Step-by-Step Guide

-   Activate the extension: Ensure the extension is enabled.

-   Position the display at the beginning: either by pressing F5 or using the icon in the browser.

-   Launch x2htmlfile by clicking on the browser icon.

-   Click on "**Start Recording Tweets**" to begin recording tweets.

    -   Tweets will be scrolled through automatically.
    -   The display will update in real time.
    -   A log is displayed in the x2htmlfile interface.

-   Click on "**Stop Recording and Download HTML-File**" to end the recording and trigger the download of the HTML file.

    -   Note: Stopping is not immediate; tweets that have already been displayed will still be saved.
    -   During processing, a "**Please Wait**" message is displayed, which disappears once the file is ready.
    -   The browser’s standard functions handle the file download, and it is up to the user to organize the saved files.
    -   The generated HTML file can be viewed and printed from the browser.

-   Click on "**Cancel Recording**" to abort the recording process. It may take a moment to close ongoing operations properly, and no HTML file will be provided.

### Potential Issues

-   Extension not working: Ensure that developer mode is enabled and the extension is correctly installed.
-   If **Twitter is in dark mode**, text contrast may be poor. It is recommended to use a light background for better readability.
-   Tweets may have **blank spaces instead of images** due to slow loading from external servers. Repeating the saving process is recommended in such cases.
-   **"Show probable spam" button**: This button may not be identifiable as its text varies depending on the user's language.
-   **"Show more replies, including potentially offensive content"** button: This button is also language-dependent and may vary in appearance.
-   The **"Show more"** notice cannot be resolved in the HTML display; instead, clicking on an image or name will lead to the article or the author’s timeline.
-   **Advertisements** change dynamically, meaning different results may have different layouts.
-   **Videos** may not play in the generated HTML file due to missing embedded content; links are under review.

## Technical Details

x2htmlfile is a Chrome extension with the following components:

-   `manifest.json` -- Configuration file for the Chrome extension.

-   `icon.png` -- Icon for accessing the Chrome extension from the browser.

-   `popup.html` -- User interface for the extension.

-   `popup.js` -- Support functions for `popup.html` and event communication with `content.js`.

    -   `startThread` -- Starts recording in `content.js`.
    -   `cancelThread` -- Cancels recording in `content.js`.
    -   `finishThread` -- Ends recording, prepares the HTML file, and triggers the download.

-   `content.js` -- Core functions of the Chrome extension.

    -   Communication between `popup.js` and `content.js` occurs via events, with continuous feedback from `content.js`.

    -   A central Chrome listener handles commands for `startThreadData`, `cancelThreadData`, and `finishThreadData`.

    -   Continuous feedback is managed via `chrome.runtime.connect` and `port.postMessage`, providing a robust solution.

    -   `autoScroll()` is the central function for retrieving tweets from X (Twitter).

        -   Initially, visible tweets are captured and added to a central tweet table.
        -   A `MutationObserver` is started to detect and capture new tweets.
        -   Tweets in the central table are processed asynchronously in parallel with the `MutationObserver`.

            -   Each tweet is checked for completeness.
            -   If incomplete, the asynchronous loop continues until data is fully loaded.
            -   Relative links are converted to full links pointing to [https://x.com](https://x.com/).
            -   An HTML section (div) is generated for each tweet.

        -   The endless loop is terminated by a flag triggered by a cancel or finish event.

            -   `autoScroll` processes all tweets in the table before terminating.

Additional functions in `content.js` support the main features:

-   `checkArticle` checks if tweets provided as `article` elements are complete.
-   `prepHTML` prepares the HTML code for each tweet.
-   `initAllGlobals` initializes global variables used across functions in `content.js`.
-   `closest` is a helper function equivalent to jQuery's `closest`.
-   `getComputedStyleAsString` retrieves all style directives as a string.
-   `getCSSRulesForClass` retrieves style rules based on class definitions.
-   `calcHashString` is a helper function for hashcode calculation, used as HTML elements often lack trivial IDs.

## License

MIT License

## Contact

For more information or support, contact us via GitHub.
