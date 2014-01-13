( function() {

    /**
     * Books are on the overworld and can provide tips/help content. This class
     * will manage their contents, which one you're viewing, etc.
     * @type {Object}
     */
    window.game.BookManager = {

        /**
         * Which book you're currently reading. This points to an object in
         * bookInfo.
         */
        readingBook: null,

        /**
         * Any textboxes created by the book that you're reading. This class
         * will handle creating/displaying/removing them as opposed to passing
         * this off to the TextManager. I did it this way so that every time you
         * close any book, you can simply remove every textbox from this class.
         * If the TextManager managed that, then you'd have to selectively
         * remove the ones that the book spawned.
         * @type {Array}
         */
        textBoxes: [],

        /**
         * An array of objects with id, tileX, and tileY, representing a book on
         * the overworld.
         * @type {Array:Object}
         */
        bookInfo: [
            {
                id: 0,
                tileX: 0,
                tileY: 0,
            },
            {
                id: 1,
                tileX: 2,
                tileY: 4,
            },
            {
                id: 2,
                tileX: 4,
                tileY: 7,
            },
            {
                id: 3,
                tileX: 0,
                tileY: 9,
            },
            {
                id: 4,
                tileX: 3,
                tileY: 13,
            },
            {
                id: 5,
                tileX: 7,
                tileY: 12,
            },
            {
                id: 6,
                tileX: 7,
                tileY: 3,
            },
        ],

        /**
         * Tells which books you've already read so that we can modify their
         * graphics accordingly.
         * 
         * Key: bookID (Number)
         * Value: true (Boolean, constant)
         * @type {Object}
         */
        booksRead: {},

        /**
         * If a book exists at the specified tile coordinates, then this will
         * open that book.
         * @param  {Number} tileX - the tile X
         * @param  {Number} tileY - the tile Y
         * @return {Boolean}       - true if you did indeed find a book
         */
        openBookIfOneExistsHere: function(tileX, tileY) {
            for (var i = 0; i < this.bookInfo.length; i++) {
                var info = this.bookInfo[i];
                if ( tileX == info.tileX && tileY == info.tileY ) {
                    this.readingBook = info;
                    break;
                }
            };

            var foundABook = this.readingBook != null;

            if ( foundABook ) {
                var id = this.readingBook.id;
                this.changeBookGraphic(id);

                var html = 'No content set';
                var title = 'No title set';
                game.GameStateManager.enterReadingABookState();

                var types = [game.PlaceableUnitType.ARCHER, game.PlaceableUnitType.WARRIOR, game.PlaceableUnitType.WIZARD];
                var imgTags = ['','',''];
                var numNonBlankCharImages = 0;
                for (var i = 0; i < types.length; i++) {
                    var graphicIndexes = game.UnitManager.getUnitCostume(types[i], -1);
                    if ( graphicIndexes != null ) {
                        imgTags[i] = '<img src="' + charSheet.get1x1Sprite(graphicIndexes[0], true) + '" style="vertical-align:bottom"/>';
                        numNonBlankCharImages++;
                    }
                };

                if ( id == 0 ) {
                    var spawnerImgTag = 
                        '<img src="' + envSheet.get1x1Sprite(game.Graphic.SPAWNER, true) + '" style="vertical-align:bottom"/>';
                    var diamondImgTag = 
                        '<img src="' + iconSheet.get1x1Sprite(game.Graphic.BLUE_DIAMOND, true) + '" style="vertical-align:baseline"/>';

                    var purchaseString = '';
                    if ( numNonBlankCharImages ) {
                        purchaseString += ' (';
                        var didFirst = false;
                        if ( imgTags[0] != '' ) {
                            purchaseString += imgTags[0];
                            if ( numNonBlankCharImages == 2 ) purchaseString += ' or ';
                            if ( numNonBlankCharImages == 3 ) purchaseString += ', ';
                            didFirst = true;
                        }
                        if ( imgTags[1] != '' ) {
                            purchaseString += imgTags[1];
                            if ( numNonBlankCharImages == 2 && !didFirst ) purchaseString += ' or ';
                            if ( numNonBlankCharImages == 3 ) purchaseString += ', or ';
                        }
                        if ( imgTags[2] != '' ) purchaseString += imgTags[2];
                        purchaseString += ')';
                    }
                    var diamondsString = '<span style="color:#00bbbb">diamonds</span>';

                    html = '<div>Use ' + diamondsString + ' ' + diamondImgTag + ' to purchase units' + purchaseString + ', then click the ' + spawnerImgTag + ' to enter a world.' +
                        '</div><br/><div>These books can provide valuable information; make sure to read them all!</div>';
                    title = 'The Book of Beginnings';
                } else if ( id == 1 ) {
                    var coinImgTag = 
                        '<img src="' + iconSheet.get1x1Sprite(game.Graphic.GOLD_COIN, true) + '" style="vertical-align:baseline"/>';
                    title = 'Paperback of Placement';
                    html = '<div>You\'re given coins ' + coinImgTag + ' at the beginning of each world so that you can place your units. After placing a unit, it will move and attack on its own.<br/><br/>Choose its location wisely! </div>';
                } else if ( id == 2 ) {
                    title = 'Vision Volume';
                    html = '<div>The black shroud you see is fog; you can see the terrain beneath it, but not enemies, treasure, or any other mysteries.<br/><br/>It helps to explore it quickly!</div>';
                } else if ( id == 3 ) {
                    title = 'Minigame Manuscript';
                    html = '<div>After beating a world, you can choose to fight groups of enemies. The harder the enemies, the more diamonds you\'ll get!</div>';
                } else if ( id == 4 ) {
                    var extraInstructions = '';
                    if ( game.playerUsedKeyboard ) {
                        extraInstructions = '(by presing "I" on your keyboard) ';
                    }
                    title = 'Inventory Album';
                    html = '<div>Open your inventory ' + extraInstructions + ' to see your items.<br/><br/>Here, you can equip items (like swords or shields) to an entire <i>class</i> of units at a time. You can also use items like potions and gems.</div>';
                } else if ( id == 5 ) {
                    title = 'Scroll of Skills';
                    html = '<div>Units gain abilities as they level up. They use these abilities randomly in battles. <ul><li>Archers can summon pets</li><li>Warriors get new combat skills</li><li>Wizards gain support abilities</li></ul></div>';
                } else if ( id == 6 ) {
                    title = 'Quest Quarto';
                    var extraInstructions = '';
                    var oldManImg = '<img src="' + charSheet.get1x1Sprite(game.Graphic.KING_1, false) + '" style="vertical-align:bottom"/>';
                    if ( game.playerUsedKeyboard ) {
                        extraInstructions = '(by presing "Q" on your keyboard) ';
                    }
                    html = '<div>Open your quest log ' + extraInstructions + ' to see any quests you were given.<br/><br/>Helpful people (' + oldManImg + ') will give you quests, and when you complete them, you\'ll be rewarded!</div>';
                }

                game.BookDialog.setHtml(html);
                game.BookDialog.setTitle(title);
                game.BookDialog.show();
            }

            return foundABook;
        },

        /**
         * This will "close" a book by changing its graphic. We exploit the
         * positioning of books on the spritesheet to accomplish this; the open
         * book is always one row above the closed book.
         * @param  {Number} bookID - the ID of the book in bookInfo.
         */
        changeBookGraphic: function(bookID) {
            var bookInfo = null;
            for (var i = 0; i < this.bookInfo.length; i++) {
                if ( this.bookInfo[i].id == bookID ) {
                    bookInfo = this.bookInfo[i];
                    break;
                }
            };

            // 'changedGraphicAlready' is only injected in this function; it
            // 'will be undefined otherwise.
            if ( bookInfo == null || bookInfo.changedGraphicAlready ) return;

            this.booksRead[bookID] = true;
            bookInfo.changedGraphicAlready = true;

            var tileX = bookInfo.tileX;
            var tileY = bookInfo.tileY;
            game.overworldMap.extraLayer[tileY * game.overworldMap.numCols + tileX] -= envSheet.getNumSpritesPerRow();
        },

        /**
         * Call this when the browser size changes.
         */
        browserSizeChanged: function() {
            var browserWidth = $(window).width();
            var browserHeight = $(window).height();

            for (var i = 0; i < this.textBoxes.length; i++) {
                var textbox = this.textBoxes[i];
                textbox.setMaxWidth(textbox.initialMaxWidth);
            };
        },

        draw: function(ctx) {
            for (var i = 0; i < this.textBoxes.length; i++) {
                this.textBoxes[i].draw(ctx);
            };
        },

        /**
         * Call this when you've loaded a game save. It'll set the correct book
         * graphics.
         */
        loadedGameSave: function() {
            for(key in this.booksRead) {
                this.changeBookGraphic(key);
            };
        },

        /**
         * Call this when you exit the "reading a book" state so that the
         * contents of the book can be cleaned up.
         */
        stopReadingBook: function() {
            game.BookDialog.hide();
            this.readingBook = null;
            this.textBoxes = [];
        }

    };
}()); 