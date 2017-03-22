/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('mfu-uploadform-view', function (Y) {
    'use strict';

    /**
     * Provides the upload form popup view.
     *
     * @module mfu-uploadform-view
     */
    Y.namespace('mfu');

    const CLASS_FORM = 'mfu-form__container';
    const CLASS_DRAGOVER = 'mfu-form__container--drag-over';
    const SELECTOR_SUBITEMS = '.mfu__subitem-boxes';
    const SELECTOR_INPUT = '.mfu-form__input';
    const SELECTOR_BTN = '.mfu-form___btn--select-files';
    const SELECTOR_FORM = '.mfu-form__container';
    const SELECTOR_INPUT_FILES = '#mfu-files';
    const EVENTS = {};

    EVENTS[SELECTOR_BTN] = {tap: '_uiSelectFiles'};
    EVENTS[SELECTOR_INPUT] = {
        input: '_uploadFiles',
        change: '_uploadFiles'
    };
    EVENTS[SELECTOR_FORM] = {
        dragenter: '_uiSetDragState',
        dragover: '_uiSetDragState',
        dragleave: '_uiRemoveDragState',
        drop: '_uploadFiles'
    };

    /**
     * The subitem box view. It allows the user to choose how the subitems are
     * displayed.
     *
     * @namespace mfu
     * @class UploadFormView
     * @constructor
     * @extends eZ.TemplateBasedView
     */
    Y.mfu.UploadFormView = Y.Base.create('mfuUploadFormView', Y.eZ.TemplateBasedView, [], {
        containerTemplate: '<form/>',

        initializer: function () {
            this._addDOMEventHandlers(EVENTS);

            window.addEventListener('drop', this._preventDefaultAction, false);
            window.addEventListener('dragover', this._preventDefaultAction, false);

            this.after('activeChange', this._fireGetAllowedMimeTypesEvent, this);
        },

        render: function () {
            var container = this.get('container');

            container.setHTML(this.template({}));
            container.getDOMNode().multiple = true;

            return this;
        },

        /**
         * Fires the `mfuGetAllowedMimeTypes` event
         *
         * @method _fireGetAllowedMimeTypesEvent
         * @protected
         * @param event {Object} event facade
         */
        _fireGetAllowedMimeTypesEvent: function (event) {
            if (!event.newVal) {
                return;
            }

            /**
             * Gets allowed mime types filter info.
             * Listened by {{#crossLink "mfu.Plugin.FileUploadService"}}mfu.Plugin.FileUploadService{{/crossLink}}
             *
             * @event mfuGetAllowedMimeTypes
             * @param config.callback {Function} event callback
             */
            this.fire('mfuGetAllowedMimeTypes', {
                callback: this._uiUpdateAcceptAttribute.bind(this)
            });
        },

        /**
         * Updates files input field `accept` attribute's value
         *
         * @method _uiUpdateAcceptAttribute
         * @protected
         * @param allowedMimeTypes {Array} list of allowed mime types
         */
        _uiUpdateAcceptAttribute: function (allowedMimeTypes) {
            const inputFileField = this.get('container').one(SELECTOR_INPUT_FILES);

            if (!allowedMimeTypes || !allowedMimeTypes.length) {
                inputFileField.removeAttribute('accept');

                return;
            }

            inputFileField.setAttribute('accept', allowedMimeTypes.join());
        },

        /**
         * Starts uploading files
         *
         * @method _uploadFiles
         * @protected
         * @param event {Object} event facade
         */
        _uploadFiles: function (event) {
            const onDropCallback = this.get('onDropCallback');

            this._uiRemoveDragState();

            if (!onDropCallback(event)) {
                return;
            }
        },

        /**
         * Starts uploading files
         *
         * @method uploadFiles
         * @param event {Object} form upload files event
         */
        uploadFiles: function (event) {
            if (!event ||
                (event._event.dataTransfer && !event._event.dataTransfer.files.length) ||
                (event._event.target.files && !event._event.target.files.length)) {
                return;
            }

            this._uploadFiles(event);
        },

        /**
         * Prevents from executing default actions
         *
         * @method _preventDefaultAction
         * @protected
         * @param event {Object} event facade
         */
        _preventDefaultAction: function (event) {
            event.preventDefault();
            event.stopPropagation();
        },

        /**
         * Sets dragover state on the form container
         *
         * @method _uiSetDragState
         * @protected
         */
        _uiSetDragState: function () {
            this.get('container').one(SELECTOR_FORM).addClass(CLASS_DRAGOVER);
        },

        /**
         * Removes dragover state from the form container
         *
         * @method _uiRemoveDragState
         * @protected
         */
        _uiRemoveDragState: function () {
            this.get('container').one(SELECTOR_FORM).removeClass(CLASS_DRAGOVER);
        },

        /**
         * Open a file select popup
         *
         * @method _uiSelectFiles
         * @protected
         */
        _uiSelectFiles: function () {
            this.get('container').one(SELECTOR_INPUT).getDOMNode().click();
        },
    }, {
        ATTRS: {
            /**
             * On file drop callback
             *
             * @attribute onDropCallback
             * @type {Function}
             * @writeOnce 'initOnly'
             */
            onDropCallback: {
                valueFn: () => true,
                writeOnce: 'initOnly'
            },
        }
    });
});
