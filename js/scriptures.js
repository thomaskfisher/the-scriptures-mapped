/*global window*/
/*jslint browser: true*/

const Scriptures = (function () {
    "use strict";
    //CONSTANTS ---------------------------------------------------

    //PRIVATE VARIABLES -------------------------------------------------
    let books = {};
    let volumes = [];

    //PRIVATE METHOD DECLARATIONS -----------------------------------------
    let ajax;
    let bookChapterValid;
    let cacheBooks;
    let init;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let onHashChanged;


    //PRIVATE METHODS ---------------------------------------------------
    ajax = function (url, successCallback, failureCallback) {
        let request = new XMLHttpRequest();
        request.open("GET", url, true);

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                let data = JSON.parse(request.responseText);

                if (typeof successCallback === "function") {
                    successCallback(data);
                }
            } else {
                if (typeof failureCallback === "function") {
                    failureCallback(request);
                }
            }
        };
        request.onerror = failureCallback;
        request.send();
    };

    bookChapterValid = function (bookId, chapter) {
        let book = books[bookId];

        if (book === undefined || chapter < 0 || chapter > book.numChapters) {
            return false;
        }

        if (chapter === 0 && book.numChapters > 0) {
            return false;
        }

        return true;
    }

    cacheBooks = function (callback) {
        volumes.forEach(function (volume) {
            let volumeBooks = [];
            let bookId = volume.minBookId;

            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            }
            volume.books = volumeBooks;
        });

        if (typeof callback === "function") {
            callback();
        }
    };

    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;

        ajax(
            "http://scriptures.byu.edu/mapscrip/model/books.php",
            function (data) {
                books = data;
                booksLoaded = true;

                if (volumesLoaded) {
                    cacheBooks(callback);
                }
            }
        );
        ajax(
            "http://scriptures.byu.edu/mapscrip/model/volumes.php",
            function (data) {
                volumes = data;
                volumesLoaded = true;

                if (booksLoaded) {
                    cacheBooks(callback);
                }
            }
        );
    };

    navigateBook = function (bookId) {
        document.getElementById("scriptures").innerHTML = "<div>" + bookId + "</div>";
    };

    navigateChapter = function (bookId, chapter) {
        document.getElementById("scriptures").innerHTML = "<div>" + bookId + ", " + chapter + "</div>";
    };

    navigateHome = function (volumeId) {
        //NEEDSWORK: if volumenID is set, display just that volume
        let html = "<div>The Old Testament</div>"
                    + "<div>The New Testament</div>"
                    + "<div>The Book of Mormon</div>"
                    + "<div>Doctrine and Covenants</div>"
                    + "<div>The Pearl of Great Price</div>"
                    + "<div>Selected volume: " + volumeId + "</div>";

        document.getElementById("scriptures").innerHTML = html;
    };

    onHashChanged = function () {
        let bookId;
        let chapter;
        let ids = [];
        let volumeId;

        if (location.hash !== "" && location.hash.length > 1) {
            // Remove leading # and split the string on colon delimiters
            ids = location.hash.substring(1).split(":");
        }
        if (ids.length <= 0) {
            navigateHome();
        } else if (ids.length === 1){
            //Display single volume's table of contents
            volumeId = Number(ids[0]);

            if (volumeId < volumes[0].id || volumeId > volumes[volumes.length - 1].id) {
                navigateHome();
            } else {
                navigateHome(volumeId)
            }
        } else if (ids.length === 2) {
            // NEEDSWORK: display book's list of chapters
            bookId = Number(ids[1]);

            if (books[bookId] === undefined) {
                navigateHome();
            } else {
                navigateBook(bookId);
            }
        }
        else {
            //display chapter contents
            bookId = Number(ids[1]);
            chapter = Number(ids[2]);

            if (!bookChapterValid(bookId, chapter)) {
                navigateHome();
            } else {
                navigateChapter(bookId, chapter);
            }
        }
    };


    //PUBLIC API ---------------------------------------------------
    return {
        init(callback) {
            init(callback);
        },
        onHashChanged(eventHandler) {
            onHashChanged(eventHandler);
        },
    };
}());
