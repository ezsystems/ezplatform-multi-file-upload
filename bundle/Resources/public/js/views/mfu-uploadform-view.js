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
    const CLASS_INACTIVE = 'mfu-form--inactive';
    const CLASS_DRAGOVER = 'mfu-form__container--drag-over';
    const SELECTOR_SUBITEMS = '.mfu__subitem-boxes';
    const SELECTOR_INPUT = '.mfu-form__input';
    const SELECTOR_BTN = ':not(.mfu-form--inactive) .mfu-form___btn--select-files';
    const SELECTOR_FORM = '.mfu-form__container';
    const SELECTOR_FORM_ACTIVE = '.mfu-form__container:not(.mfu-form--inactive)';
    const SELECTOR_INACTIVE = '.mfu-form--inactive';
    const SELECTOR_FILESIZE_INFO = '.mfu-form__limit-info';
    const EVENTS = {};

    EVENTS[SELECTOR_BTN] = {tap: '_uiSelectFiles'};
    EVENTS[SELECTOR_INPUT] = {
        change: '_uploadFiles'
    };
    EVENTS[SELECTOR_FORM_ACTIVE] = {
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
    Y.mfu.UploadFormView = Y.Base.create('mfuUploadFormView', Y.eZ.TemplateBasedView, [Y.mfu.Helper.TextFormat], {
        containerTemplate: '<form/>',

        initializer: function () {
            this._addDOMEventHandlers(EVENTS);

            window.addEventListener('drop', this._preventDefaultAction, false);
            window.addEventListener('dragover', this._preventDefaultAction, false);

            this.after('activeChange', this._fireGetAllowedMimeTypesEvent, this);
            this.after('activeChange', this._fireGetMaxFileSizeLimitEvent, this);
            this.after('activeChange', this._fireCheckPermissions, this);
            this.after('isFormActiveChange', this._uiToggleFormState, this);
        },

        render: function () {
            var container = this.get('container');

            container.setHTML(this.template({}));
            container.getDOMNode().multiple = true;

            return this;
        },

        /**
         * Fires the `mfuCheckPermissions` event
         *
         * @method _fireCheckPermissions
         * @protected
         * @param event {Object} event facade
         */
        _fireCheckPermissions: function (event) {
            if (!event.newVal) {
                return;
            }

            /**
             * Checks for content create permissions for a logged in user.
             * Listened by {{#crossLink "mfu.Plugin.FileUploadService"}}mfu.Plugin.FileUploadService{{/crossLink}}
             *
             * @event mfuCheckPermissions
             * @param config.permissionsStateCallback {Function} a callback to be invoked when permissions state is received
             * @param config.errorCallback {Function} an error callback
             */
            this.fire('mfuCheckPermissions', {
                permissionsStateCallback: this._setFormActiveState.bind(this),
                errorCallback: this._uiShowError.bind(this)
            });
        },

        /**
         * Sets the `isFormActive` attribute value
         *
         * @method _setFormActiveState
         * @protected
         * @param isFormActive {Boolean} is form active flag
         */
        _setFormActiveState: function (isFormActive) {
            this._set('isFormActive', isFormActive);
        },

        /**
         * Toggles the form container availability state
         *
         * @method _uiToggleFormState
         * @protected
         * @param event {Object} event facade
         */
        _uiToggleFormState: function (event) {
            const methodName = event.newVal ? 'removeClass' : 'addClass';

            this.get('container').one(SELECTOR_FORM)[methodName](CLASS_INACTIVE);
        },

        /**
         * Displays an error notification bar
         *
         * @method _uiShowError
         * @protected
         */
        _uiShowError: function () {
            /**
             * Displays a notification in the notification bar
             * Listened by {{#crossLink "eZ.Plugin.NotificationHub"}}eZ.Plugin.NotificationHub{{/crossLink}}
             *
             * @event notify
             * @param config.notification {Object} notification config
             * @param config.notification.text {String} notification message text
             * @param config.notification.identifier {String} notification identifier
             * @param config.notification.state {String} notification state
             * @param config.notification.timeout {Number} notification timeout (in seconds)
             */
            this.fire('notify', {
                notification: {
                    text: this.get('checkPermissionsErrorText'),
                    identifier: 'mfu-file-upload-permission-check-error',
                    state: 'error',
                    timeout: 0,
                }
            });
        },

        /**
         * Fires the `mfuGetMaxFileSizeLimit` event
         *
         * @method _fireGetMaxFileSizeLimitEvent
         * @protected
         * @param event {Object} event facade
         */
        _fireGetMaxFileSizeLimitEvent: function (event) {
            if (!event.newVal) {
                return;
            }

            /**
             * Gets a max file size limit info.
             * Listened by {{#crossLink "mfu.Plugin.FileUploadService"}}mfu.Plugin.FileUploadService{{/crossLink}}
             *
             * @event mfuGetMaxFileSizeLimit
             * @param config.callback {Function} a callback where the size limit info should be passed into
             */
            this.fire('mfuGetMaxFileSizeLimit', {
                callback: this._uiUpdateFileSizeLimitLabel.bind(this)
            });
        },

        /**
         * Update the max file size info label
         *
         * @method _uiUpdateFileSizeLimitLabel
         * @protected
         * @param limit {String} max file size limit
         */
        _uiUpdateFileSizeLimitLabel: function (limit) {
            this.get('container')
                .one(SELECTOR_FILESIZE_INFO)
                .setHTML(this.get('maxFileSizeText').replace('{filesize}', this._formatFileSize(limit)));
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
            const inputFileField = this.get('container').one(SELECTOR_INPUT);

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

            if (this.get('container').one(SELECTOR_INACTIVE) || !this._checkHasEventFileData(event) || !onDropCallback(event)) {
                return;
            }
        },

        /**
         * Checks whether a given object contains file upload data
         *
         * @method _checkHasEventFileData
         * @protected
         * @param event {Object} event facade
         * @return {Boolean}
         */
        _checkHasEventFileData: (event) => {
            return (event && event._event &&
                (
                    (event._event.dataTransfer && event._event.dataTransfer.files.length) ||
                    (event._event.target.files && event._event.target.files.length))
                );
        },

        /**
         * Starts uploading files
         *
         * @method uploadFiles
         * @param event {Object} form upload files event
         */
        uploadFiles: function (event) {
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
                writeOnce: 'initOnly',
            },

            /**
             * Max file size info text
             *
             * @attribute maxFileSizeText
             * @type {String}
             * @readOnly
             */
            maxFileSizeText: {
                valueFn: () => Y.eZ.trans('max.file.size.info', {}, 'uploadform'),
                readOnly: true,
            },

            /**
             * Form active state flag
             *
             * @attribute isFormActive
             * @type {Boolean}
             * @default false
             * @readOnly
             */
            isFormActive: {
                value: false,
                readOnly: true,
            },

            /**
             * Check permissions error text
             *
             * @attribute checkPermissionsErrorText
             * @type {String}
             * @readOnly
             */
            checkPermissionsErrorText: {
                valueFn: () => Y.eZ.trans('file.upload.permissions.check.error', {}, 'uploadform'),
                readOnly: true,
            },
        }
    });
});
