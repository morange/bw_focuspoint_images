/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */
define(["require", "exports", "TYPO3/CMS/Core/Contrib/imagesloaded.pkgd.min", "TYPO3/CMS/Backend/Modal", "jquery", "jquery-ui/draggable", "jquery-ui/resizable"], function (require, exports, ImagesLoaded, Modal, $) {
    "use strict";
    /**
     * Module: TYPO3/CMS/BwFocuspointImages/FocuspointWizard
     * Contains all logic for the image crop GUI including setting focusAreas
     * @exports TYPO3/CMS/BwFocuspointImages/FocuspointWizard
     */
    var FocuspointWizard = (function () {
        function FocuspointWizard() {
            this.panelGroupSelector = '#accordion-cropper-variants';
            this.cropImageSelector = '#t3js-crop-image';
            this.focusPointContainerSelector = '#focuspoint-container';
        }
        FocuspointWizard.prototype.calculateRelativeX = function (width) {
            var image = this.currentModal.find(this.cropImageSelector);
            var imageWidth = $(image).width();
            return Math.round((width / imageWidth) * 1e3) / 1e3;
        };
        FocuspointWizard.prototype.calculateAbsoluteX = function (width) {
            if (width === void 0) { width = 0.33; }
            var image = this.currentModal.find(this.cropImageSelector);
            var imageWidth = $(image).width();
            return Math.round((width * imageWidth) * 1e3) / 1e3;
        };
        FocuspointWizard.prototype.calculateRelativeY = function (height) {
            var image = this.currentModal.find(this.cropImageSelector);
            var imageHeight = $(image).height();
            return Math.round((height / imageHeight) * 1e3) / 1e3;
        };
        FocuspointWizard.prototype.calculateAbsoluteY = function (height) {
            if (height === void 0) { height = 0.33; }
            var image = this.currentModal.find(this.cropImageSelector);
            var imageHeight = $(image).height();
            return Math.round((height * imageHeight) * 1e3) / 1e3;
        };
        FocuspointWizard.prototype.onBoxChange = function (box) {
            var width = $(box).width();
            var height = $(box).height();
            var position = $(box).position();
            var left = position.left;
            var top = position.top;
            var focuspointBoxId = parseInt($(box).attr('data-focuspointBoxId'));
            this.data[focuspointBoxId].width = this.calculateRelativeX(width);
            this.data[focuspointBoxId].height = this.calculateRelativeY(height);
            this.data[focuspointBoxId].x = this.calculateRelativeX(left);
            this.data[focuspointBoxId].y = this.calculateRelativeY(top);
        };
        FocuspointWizard.prototype.onInputChange = function (input) {
            var focuspointPanelId = parseInt($(input).attr('data-focuspointPanelId'));
            var fieldname = $(input).attr('name');
            this.data[focuspointPanelId][fieldname] = $(input).val();
        };
        FocuspointWizard.prototype.deleteFocuspoint = function (focuspointId) {
            // remove html elements
            $(this.focusBoxes[focuspointId]).trigger('remove');
            $(this.inputPanels[focuspointId]).trigger('remove');
            // remove from class members
            this.focusBoxes.slice(focuspointId, 1);
            this.inputPanels.slice(focuspointId, 1);
            this.data.splice(focuspointId, 1);
            // rename remaining focus points
            $(this.focusBoxes).each(function (i, e) {
                $(e).find('span').html((i + 1).toString());
            });
            $(this.inputPanels).each(function (i, e) {
                $(e).find('span[data-nr]').attr('data-nr', i + 1);
            });
        };
        FocuspointWizard.prototype.initFocusBox = function (box) {
            // register jquery-ui/draggable
            $(box).draggable({
                containment: "parent",
                stop: this.onBoxChange.bind(this, box),
            });
            // register jquery-ui/resizable
            if ($(box).hasClass('ui-resizable')) {
                $(box).resizable({
                    handles: "n, e, w, s, se, sw, nw, ne",
                    containment: "parent",
                    minWidth: 20,
                    minHeight: 20,
                    stop: this.onBoxChange.bind(this, box),
                });
            }
            // set onload position and size
            var focuspoint = this.data[$(box).attr('data-focuspointBoxId')];
            $(box).css('width', this.calculateAbsoluteX(focuspoint.width) + 'px');
            $(box).css('height', this.calculateAbsoluteY(focuspoint.height) + 'px');
            $(box).css('top', this.calculateAbsoluteY(focuspoint.y) + 'px');
            $(box).css('left', this.calculateAbsoluteX(focuspoint.x) + 'px');
            // show element
            $(box).removeClass('focuspoint-item-hidden');
            // bind delete event
            var removeEvent = function () {
                $(box).off();
                $(box).remove();
            };
            $(box).bind('delete', removeEvent.bind(null, box));
        };
        FocuspointWizard.prototype.addNewFocuspoint = function (focuspointBoxId) {
            if (focuspointBoxId === void 0) { focuspointBoxId = -1; }
            // check if appended or created from data
            if (focuspointBoxId === -1) {
                focuspointBoxId = this.data.length;
                this.data[focuspointBoxId] = this.getEmptyFocuspoint();
            }
            var focuspointBoxIdReadableString = (focuspointBoxId + 1).toString();
            // copy dummys
            // 1. box dummy
            var newBox = this.currentModal.find('.focuspoint-item.focuspoint-item-dummy').first()
                .clone()
                .appendTo(this.focusPointContainerSelector)
                .attr('data-focuspointBoxId', focuspointBoxId)
                .addClass('focuspoint-item-hidden')
                .removeClass('focuspoint-item-dummy')
                .find('span')
                .html(focuspointBoxIdReadableString)
                .parent();
            // 2. panel dummy
            var newPanel = this.currentModal.find('.panel.panel-dummy').first()
                .clone()
                .appendTo(this.panelGroupSelector)
                .addClass('panel-hidden')
                .removeClass('panel-dummy');
            // update all input inside panel: set new id (= offset in this.data)
            $(newPanel).find('[data-focuspointPanelId]').attr('data-focuspointPanelId', focuspointBoxId);
            // update panel elements that need unique id (e.g. for accordion)
            $(newPanel).find('[data-append-id]').each(function (i, el) {
                $(el).attr('data-append-id').split(',').forEach(function (attr) {
                    $(el).attr(attr, $(el).attr(attr) + (focuspointBoxId + 1));
                });
            });
            // init new elements
            this.initFocusBox(newBox);
            this.initInputPanel(newPanel);
            // add elements to the class
            this.focusBoxes.push(newBox);
            this.inputPanels.push(newPanel);
        };
        FocuspointWizard.prototype.onCancelButtonClick = function (e) {
            e.preventDefault();
            this.currentModal.modal('hide');
            this.destroy();
        };
        FocuspointWizard.prototype.onSaveButtonClick = function (e) {
            e.preventDefault();
            this.save(this.data);
            this.currentModal.modal('hide');
        };
        FocuspointWizard.prototype.save = function (data) {
            var focusPoints = JSON.stringify(data);
            var hiddenField = $("#" + this.trigger.attr('data-field'));
            hiddenField.val(focusPoints);
        };
        FocuspointWizard.prototype.initInputPanel = function (panel) {
            var _this = this;
            var panelInputs = $(panel).find('[data-focuspointPanelId]');
            var focuspointPanelId = parseInt(panelInputs.first().attr('data-focuspointPanelId'));
            var focuspoint = this.data[focuspointPanelId] ? this.data[focuspointPanelId] : {};
            // for all inputs: set data and eventListener
            panelInputs.each(function (i, input) {
                var inputValue = focuspoint[$(input).attr('name')] ? focuspoint[$(input).attr('name')] : '';
                // set value
                switch ($(input).prop('tagName')) {
                    case 'INPUT':
                    case 'TEXTAREA':
                        $(input).val(inputValue);
                        break;
                    case 'SELECT':
                        $('option', input).prop('selected', false);
                        $('option[value="' + inputValue + '"]', input).prop('selected', true);
                        break;
                }
                // bind events
                $(input).off('input').on('input', _this.onInputChange.bind(_this, input));
            });
            // bind remove event
            var removeEvent = function () {
                $(panel).off();
                $(panel).remove();
            };
            $(panel).bind('remove', removeEvent.bind(null, panel));
            // bind delete button event
            $(panel).find('[data-delete]').off('click').on('click', function (e, button) {
                e.preventDefault();
                _this.deleteFocuspoint(focuspointPanelId);
            });
            // show panel
            $(panel).removeClass('panel-hidden');
        };
        FocuspointWizard.prototype.initInputPanels = function () {
            var _this = this;
            this.inputPanels.forEach(function (panel) {
                _this.initInputPanel(panel);
            });
        };
        FocuspointWizard.prototype.getEmptyFocuspoint = function () {
            var o = {
                x: 0.3,
                y: 0.3,
                width: 0.3,
                height: 0.3
            };
            var defaultWidth = this.currentModal.find('.panel.panel-dummy [data-focuspointPanelId][name="width"]').val();
            var defaultHeight = this.currentModal.find('.panel.panel-dummy [data-focuspointPanelId][name="height"]').val();
            var defaultSize = defaultWidth > defaultHeight ? defaultWidth : defaultHeight;
            o.width = defaultSize;
            o.height = defaultSize;
            if (defaultSize != 0.3) {
                o.x = (1 - o.width) / 2;
                o.y = (1 - o.height) / 2;
            }
            return o;
        };
        /**
         * @method init
         * @desc Initializes the Focus Point UI and sets up all the event bindings for the UI
         * @private
         */
        FocuspointWizard.prototype.init = function () {
            var _this = this;
            var image = this.currentModal.find(this.cropImageSelector);
            var imageHeight = $(image).height();
            var imageWidth = $(image).width();
            var hiddenField = $("#" + this.trigger.attr('data-field'));
            var data = hiddenField.val();
            if (!data || data == "") {
                data = "[]";
            }
            // If we have data already set we assume an internal reinit eg. after resizing
            this.data = $.isEmptyObject(this.data) ? JSON.parse(data) : this.data;
            // Initialize our class members
            this.focusBoxes = [];
            this.inputPanels = [];
            // create focuspoints from data
            for (var i = 0; i < this.data.length; i++) {
                this.addNewFocuspoint(i);
            }
            // Bind New button
            this.currentModal.find('[data-method=new]').off('click').on('click', function (e) {
                e.preventDefault();
                _this.addNewFocuspoint(-1);
            });
            // Bind resize event
            $(window).resize(this.onWindowResize.bind(this));
        };
        FocuspointWizard.prototype.onWindowResize = function () {
            var self = this;
            // update position and size of every focuspoint
            $(this.focusBoxes).each(function (i, box) {
                var focuspoint = self.data[i];
                $(box).css('width', self.calculateAbsoluteX(focuspoint.width) + 'px');
                $(box).css('height', self.calculateAbsoluteY(focuspoint.height) + 'px');
                $(box).css('top', self.calculateAbsoluteY(focuspoint.y) + 'px');
                $(box).css('left', self.calculateAbsoluteX(focuspoint.x) + 'px');
            });
        };
        /**
         * @method initializeFocuspointModal
         * @desc Initialize the focuspoint modal and dispatch the focuspoint init
         * @private
         */
        FocuspointWizard.prototype.initializeFocuspointModal = function () {
            var _this = this;
            var image = this.currentModal.find(this.cropImageSelector);
            ImagesLoaded(image, function () {
                setTimeout(function () {
                    _this.init();
                }, 100);
            });
        };
        ;
        FocuspointWizard.prototype.show = function (is7up) {
            var _this = this;
            var modalTitle = this.trigger.data('modalTitle');
            var buttonDismissText = this.trigger.data('buttonDismissText');
            var buttonSaveText = this.trigger.data('buttonSaveText');
            var imageUri = this.trigger.data('url');
            var buttons = [
                {
                    btnClass: 'btn-default',
                    dataAttributes: {
                        method: 'dismiss',
                    },
                    text: buttonDismissText,
                    icon: 'actions-close',
                    trigger: this.onCancelButtonClick.bind(this)
                },
                {
                    btnClass: 'btn-primary',
                    icon: 'actions-document-save',
                    dataAttributes: {
                        method: 'save',
                    },
                    text: buttonSaveText,
                    trigger: this.onSaveButtonClick.bind(this)
                },
            ];
            if (is7up) {
                this.currentModal = Modal.advanced({
                    type: 'ajax',
                    content: imageUri,
                    size: Modal.sizes.full,
                    style: Modal.styles.dark,
                    title: modalTitle,
                    ajaxCallback: this.initializeFocuspointModal.bind(this),
                    buttons: buttons,
                });
            }
            else {
                this.currentModal = Modal.loadUrl(modalTitle, -2, buttons, imageUri, this.initializeFocuspointModal.bind(this));
            }
            this.currentModal.addClass('modal-dark');
            this.currentModal.addClass('modal-focuspoints');
            this.currentModal.find('.modal-body')
                .addClass('cropper')
                .addClass('modal-body-focuspoints');
            this.currentModal.on('hide.bs.modal', function (e) {
                _this.destroy();
            });
            // Do not dismiss the modal when clicking beside it to avoid data loss
            this.currentModal.data('bs.modal').options.backdrop = 'static';
        };
        /**
         * @method destroy
         * @desc Destroy the FocuspointWizard
         * @private
         */
        FocuspointWizard.prototype.destroy = function () {
            if (this.currentModal) {
                this.currentModal = null;
                this.data = null;
            }
        };
        FocuspointWizard.prototype.initializeTrigger = function (is7up) {
            var _this = this;
            var triggerHandler = function (e) {
                e.preventDefault();
                _this.trigger = $(e.currentTarget);
                _this.show(is7up);
            };
            $('.t3js-focuspoint-trigger').off('click').click(triggerHandler);
        };
        return FocuspointWizard;
    }());
    return new FocuspointWizard();
});