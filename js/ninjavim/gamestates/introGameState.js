var IntroGameState = function (game) {
    this.config = NinjaVim.config;
    this.game = game;
};

IntroGameState.prototype = {
    init: function () {
        this.context = this;
        this.numberOfColumns = this.config.numberOfColumns;
        this.numberOfRows = this.config.numberOfRows;
        this.tileWidth = this.game.world.width / this.numberOfColumns;
        this.tileHeight = this.game.world.height / this.numberOfRows;
        this.cursorLocationManager = new CursorLocationManager(this.numberOfColumns, this.numberOfRows, this.config);
        this.cursorSpriteManager = new CursorSpriteManager(this.game, this.config);
        this.keyboardHandlerManager = new KeyboardHandlerManager(this.context, new PhaserKeyboard(this.game));
        this.tilesCharacterManager = new TilesCharacterManager(this.numberOfRows, this.numberOfColumns);
        this.tilesSpriteManager = new TilesSpriteManager(this.config.numberOfColumns, this.config.numberOfRows);
        this.destroyerWithCoinSoundEffect = new DestroyerWithCoinSoundEffect(this.game, this.config);

        this.game.stage.backgroundColor = this.config.backgroundColor;
    },
    create: function () {
        this._initializeVimContext();
        this._prepareBackground();
        this._generateSpritesToCollect();
        this.cursorSpriteManager.createSprite(this.tileWidth, this.tileHeight);
        this.startGameTime();

        this.gameIsFinished = false;
    },
    update: function () {
        this._shiftButtonProcessor();
        this._cursorAndStarCollisionProcessor();
        this._finishGameProcessor();
    },
    _initializeVimContext: function() {
        this.vimContext = new VimContext(this.cursorLocationManager, this.cursorSpriteManager, this.tilesCharacterManager, this.keyboardHandlerManager);
        this.vimContext.setKeyboardHandler(new NormalModeKeyboardHandler(this.vimContext));
    },
    _shiftButtonProcessor: function () {
        this.keyboardHandlerManager.isShiftDown ? this.vimContext.setShiftPressed() : this.vimContext.setShiftReleased();
    },
    _cursorAndStarCollisionProcessor: function () {
        var cursorColumn = this.cursorLocationManager.getCursorLocation().column;
        var cursorRow = this.cursorLocationManager.getCursorLocation().row;
        if (this.tilesSpriteManager.getSpriteFromLocation(cursorColumn, cursorRow)) {
            this.tilesSpriteManager.destroySprite(cursorColumn, cursorRow, this.destroyerWithCoinSoundEffect);
        }
    },
    _generateGrass: function () {
        var grassTileBuilder = new GrassTileBuilder(this.game, this.config);
        for (var col = 0; col < this.config.numberOfColumns; ++col) {
            for (var row = 0; row < this.config.numberOfRows; ++row) {
                this.tilesSpriteManager.buildSpriteWithoutSaving(col, row, grassTileBuilder);
            }
        }
    },
    _generateSpritesToCollect: function () {
        var tileBuilder = new CoinTileBuilder(this.game, this.config);
        this._createSpiralPatternOfCoins(tileBuilder);
    },
    _restartGame: function() {
        this.game.state.start('intro');
    },
    _finishGameProcessor: function () {
        if (this.tilesSpriteManager.isEmpty() && !this.gameIsFinished) {
            this.gameIsFinished = true;
            this.game.time.events.add(Phaser.Timer.SECOND * 3, this._restartGame, this);
            this._showMessageBox();
        }
    },
    _prepareBackground : function() {
        this._generateGrass();
        var hjkl = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, this.config.hjklSprite);
        hjkl.anchor.set(0.5);
        hjkl.alpha = 0.4;
    },
    _showMessageBox: function () {
        var messageBox = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY - 100, 'message_box');
        messageBox.originalWidth = messageBox.width;
        messageBox.originalHeight = messageBox.height;
        messageBox.anchor.set(0.5);
        messageBox.alpha = 0.9;
        messageBox.scale.setTo(0.3);

        var text = "Total Time: " + this.getElapsedTimeInSeconds() + 's';
        var message = this.game.add.text(0, 0, text, {font: '64px Arial', fill: '#FFFFFF', wordWrap: true, wordWrapWidth: messageBox.originalWidth, align: 'center'});
        message.anchor.set(0.5);
        messageBox.addChild(message);
    },
    _createSpiralPatternOfCoins: function (tileBuilder) {
        var leftBorder = 0;
        var upBorder = 0;
        var rightBorder = this.config.numberOfColumns - 1;
        var bottomBorder = this.config.numberOfRows - 1;

        var column = 0;
        var row = 0;
        var stillProcessing = true;
        while (stillProcessing) {
            stillProcessing = false;
            //going right
            for (column, row = upBorder; column < rightBorder; ++column) {
                this.tilesSpriteManager.buildSprite(column, row, tileBuilder);
                stillProcessing = true;
            }
            rightBorder -= 2;

            //going down
            for (row; row < bottomBorder; ++row) {
                this.tilesSpriteManager.buildSprite(column, row, tileBuilder);
                stillProcessing = true;
            }
            bottomBorder -= 2;

            //going left
            for (column; column > leftBorder; --column) {
                this.tilesSpriteManager.buildSprite(column, row, tileBuilder);
                stillProcessing = true;
            }
            leftBorder += 2;

            //going up until upborder + 2
            for (row; row > upBorder + 2; --row) {
                this.tilesSpriteManager.buildSprite(column, row, tileBuilder);
                stillProcessing = true;
            }
            upBorder += 2;
        }
    }
};
