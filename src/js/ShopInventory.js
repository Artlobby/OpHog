( function() {

    /**
     * Amount of time that needs to go by (in seconds) until the shop's
     * inventory is refreshed with new items.
     * @type {Number}
     */
    window.game.INITIAL_SHOP_INVENTORY_REFRESH_TIME = 5;

	/**
	 * Inventory for the shop. This inherits from game.Inventory
	 */
	window.game.ShopInventory = function ShopInventory() {
		this.base = game.Inventory;
		this.base(true);
	};

	window.game.ShopInventory.prototype = new game.Inventory;

    window.game.ShopInventory.prototype.init = function() {
        // Add equippable slots
        for (var i = 0; i < 10; i++) {
            var newSlot = new game.ShopSlot(game.SlotTypes.EQUIP);
            this.addSlot(newSlot);
        };

        // Add usable slots
        for (var i = 0; i < 10; i++) {
            var newSlot = new game.ShopSlot(game.SlotTypes.USABLE);
            this.addSlot(newSlot);
        };

        this.generateItems();

        /**
         * Time in seconds until the inventory refreshes with new items
         * @type {Number}
         */
        this.timeUntilNewInventoryItems = game.INITIAL_SHOP_INVENTORY_REFRESH_TIME;
    };

    window.game.ShopInventory.prototype.generateItems = function() {
        for (var i = 0; i < this.slots.length; i++) {
            var slot = this.slots[i];
            slot.setItem(game.GenerateRandomInventoryItem(slot.isUsableSlot()));
        };
    };

	window.game.ShopInventory.prototype.addSlot = function(slot) {
		game.Inventory.prototype.addSlot.call(this, slot);

        // Tell the UI that we've added a slot so it will add the graphic
        // to the UI.
        game.ShopUI.addedSlot(slot);
	};

    window.game.ShopInventory.prototype.update = function(deltaInSeconds) {
        this.timeUntilNewInventoryItems -= deltaInSeconds;
        if (this.timeUntilNewInventoryItems < 0) {
            this.generateItems();
            this.timeUntilNewInventoryItems = game.INITIAL_SHOP_INVENTORY_REFRESH_TIME;
        }
    };

}()); 