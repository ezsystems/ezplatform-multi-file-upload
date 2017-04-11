/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('mfu-uploadpopup-view', function (Y) {
    'use strict';

    /**
     * Provides the upload form popup view.
     *
     * @module mfu-uploadpopup-view
     */
    Y.namespace('mfu');

    const CLASS_POPUP_OPENED = 'mfu-popup-opened';
    const CLASS_DISCOVERYBAR_HIDDEN = 'is-menu-hidden';
    const CLASS_POPUP_OVERLAY = 'mfu-popup-overlay';
    const CLASS_HIDDEN = 'mfu-popup--hidden';
    const SELECTOR_CONTENT = '.mfu-popup__content';
    const SELECTOR_LIST = '.mfu-popup__files-list';
    const SELECTOR_TITLE = '.mfu-popup__list-title';
    const SELECTOR_BTN_CLOSE = '.mfu-popup__btn--close';

    /**
     * The subitem box view. It allows the user to choose how the subitems are
     * displayed.
     *
     * @namespace mfu
     * @class UploadPopupView
     * @constructor
     * @extends eZ.TemplateBasedView
     */
    Y.mfu.UploadPopupView = Y.Base.create('mfuUploadPopupView', Y.eZ.TemplateBasedView, [], {
        events: {[SELECTOR_BTN_CLOSE]: {tap: '_hidePopup'}},

        initializer: function () {
            this.on('mfuFileItemView:destroy', this._removeFileFromUploadedFiles, this);
            this.after('activeChange', this._toggleFormActiveState, this);
            this.after('activeChange', this._renderPopupOverlay, this);
            this.after('displayedChange', this._toggleDisplay, this);
            this.after('displayedChange', this._uiToggleAppSideViewsState, this);
            this.after('uploadedFilesChange', this._uiUpdateFilesListTitle, this);
            this.after('mfuFileItemView:destroy', this._attemptToHidePopup, this);
            this.after('mfuFileItemView:editContentRequest', this._hidePopup, this);
            this.after('mfuFileItemView:mfuFilePublished', this._updateFileUploadedState, this);
        },

        render: function () {
            this.get('container').setHTML(this.template(this.getAttrs()));

            this._renderUploadForm();

            return this._toggleDisplay();
        },

        /**
         * Shows/hides popup
         *
         * @method _toggleDisplay
         * @protected
         * @return {mfu.UploadPopupView} the view itself
         */
        _toggleDisplay: function () {
            var methodName = this.get('displayed') ? 'removeClass' : 'addClass';

            this.get('container')[methodName](CLASS_HIDDEN);

            return this;
        },

        /**
         * Toggles active state of upload form view
         *
         * @method _toggleFormActiveState
         * @protected
         * @param event {Object} event facade
         */
        _toggleFormActiveState: function (event) {
            this.get('uploadForm').set('active', event.newVal);
        },

        /**
         * Renders popup overlay
         *
         * @method _renderPopupOverlay
         * @protected
         * @param event {Object} event facade
         * @return {mfu.UploadPopupView} the view itself
         */
        _renderPopupOverlay: function (event) {
            if (!event.newVal) {
                return this;
            }

            const node = this.get('container').getDOMNode();
            const parentNode = node.parentNode;
            const overlay = document.createElement('div');

            overlay.classList.add(CLASS_POPUP_OVERLAY);

            parentNode.insertBefore(overlay, node);
            parentNode.removeChild(node);
            overlay.appendChild(node);

            return this;
        },

        /**
         * Renders popup overlay
         *
         * @method _renderUploadForm
         * @protected
         */
        _renderUploadForm: function () {
            const uploadForm = this.get('uploadForm');

            this.get('container').one(SELECTOR_CONTENT).setHTML(uploadForm.render().get('container'));
        },

        /**
         * Updates uploaded files list
         *
         * @method _updateUploadedFilesList
         * @protected
         * @param event {Object} event facade
         * @return {Boolean}
         */
        _updateUploadedFilesList: function (event) {
            event = event._event;

            const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;

            this._renderListItems(files);

            return true;
        },

        /**
         * Updates uploaded files list
         *
         * @method _renderListItems
         * @protected
         * @param files {FileList} a list of all the local files available on the data transfer
         */
        _renderListItems: function (files) {
            files = ([].slice.call(files)).map(this._buildFileHash);

            const fragment = Y.one(document.createDocumentFragment());
            const items = files.reduce(this._renderFileItem.bind(this), fragment);

            this._set('uploadedFiles', [...this.get('uploadedFiles'), ...files]);

            this.get('container').one(SELECTOR_LIST).append(items);
        },

        /**
         * Builds file hash containing the file blob and date added info
         *
         * @method _buildFileHash
         * @protected
         * @param file {File} file data
         * @return {Object} file hash
         */
        _buildFileHash: function (file) {
            return {
                blob: file,
                added: Date.now(),
                isUploaded: false,
            };
        },

        /**
         * Renders a single file item
         *
         * @method _renderFileItem
         * @protected
         * @param fragment {DocumentFragment} document fragment
         * @param file {Object} file hash
         * @return {DocumentFragment} updated document fragment
         */
        _renderFileItem: function (fragment, file) {
            let itemView = new Y.mfu.FileItemView({
                file: Object.freeze(file),
                bubbleTargets: this
            });

            fragment.appendChild(itemView.render().get('container'));

            return fragment;
        },

        /**
         * Toggles app side views state.
         * Allows to cover the app container completely with an overlay.
         *
         * @method _uiToggleAppSideViewsState
         * @protected
         * @param event {Object} event facade
         */
        _uiToggleAppSideViewsState: function (event) {
            const methodName = event.newVal ? 'add' : 'remove';

            document.body.classList[methodName](CLASS_POPUP_OPENED);
            document.body.classList[methodName](CLASS_DISCOVERYBAR_HIDDEN);
        },

        /**
         * Hides a popup if there's less than one file on the list
         *
         * @method _attemptToHidePopup
         * @protected
         * @param event {Object} event facade
         */
        _attemptToHidePopup: function (event) {
            const targetFile = event.target.get('file');

            if (!targetFile) {
                return;
            }

            const files = this.get('uploadedFiles').filter(this._excludeFile.bind(this, targetFile));

            this._set('uploadedFiles', files);

            if (!files.length) {
                this._hidePopup();
            }
        },

        /**
         * Does the comparison between a provided file hash and a file hash from an array.
         * Returns truthy when file hashes don't have the same file names and time added info.
         *
         * @method _excludeFile
         * @protected
         * @param file {Object} a file hash of file to be compared against
         * @param item {Object} a file hash of file from an array to be compared with
         * @return {Boolean}
         */
        _excludeFile: (file, item) => !(file.added === item.added && file.blob.name === item.blob.name),

        /**
         * Hides popup
         *
         * @method _hidePopup
         * @protected
         */
        _hidePopup: function () {
            this.set('displayed', false);
        },

        /**
         * Starts uploading dropped files
         *
         * @method uploadFiles
         * @param event {Object} event facade
         */
        uploadFiles: function (event) {
            /**
             * [FUNNY FACT]
             *
             * If you use rename the param from event to something else
             * and you will still try to pass the variable called `event`
             * as a param of `uploadFiles` method then it will pass the JS event
             * instead of undefined.
             */

            this.get('uploadForm').uploadFiles(event);
        },

        /**
         * Updates a title of uploaded files list
         *
         * @method _uiUpdateFilesListTitle
         * @protected
         * @return {mfu.UploadPopupView} the view itself
         */
        _uiUpdateFilesListTitle: function () {
            const allFiles = this.get('uploadedFiles');
            const uploadedFiles = allFiles.filter(file => file.isUploaded);

            this.get('container')
                .one(SELECTOR_TITLE)
                .setHTML(this.get('uploadedText')
                    .replace('{uploaded}', uploadedFiles.length)
                    .replace('{total}', allFiles.length)
                );

            return this;
        },

        /**
         * Removes a file hash reference from a list of uploaded files
         *
         * @method _removeFileFromUploadedFiles
         * @protected
         * @param event {Object} event facade
         */
        _removeFileFromUploadedFiles: function (event) {
            const uploadedFiles = this.get('uploadedFiles');

            this._set('uploadedFiles', uploadedFiles.filter(this._excludeFile.bind(this, event.target.get('file'))));
        },

        /**
         * Updates file uploaded state info
         *
         * @method _updateFileUploadedState
         * @protected
         * @param event {Object} event facade
         */
        _updateFileUploadedState: function (event) {
            const uploadedFiles = this.get('uploadedFiles');
            const file = event.target.get('file');
            const updatedFiles = uploadedFiles.map(item => {
                if (item.added !== file.added || item.blob.name !== file.blob.name) {
                    return item;
                }

                return {
                    blob: item.blob,
                    added: item.added,
                    isUploaded: true,
                };
            });

            this._set('uploadedFiles', updatedFiles);
        },

        destructor: function () {
            this.get('uploadForm').destroy({remove: true});
        }
    }, {
        ATTRS: {
            /**
             * Displayed flag
             *
             * @attribute displayed
             * @default false
             * @type {Boolean}
             */
            displayed: {
                value: false
            },

            /**
             * File upload form
             *
             * @attribute uploadForm
             * @type {Function}
             * @readOnly
             */
            uploadForm: {
                valueFn: function () {
                    return new Y.mfu.UploadFormView({
                        bubbleTargets: this,
                        onDropCallback: this._updateUploadedFilesList.bind(this)
                    });
                },
                readOnly: true,
            },

            /**
             * List of uploaded files
             *
             * @attribute uploadedFiles
             * @type {Array}
             * @readOnly
             */
            uploadedFiles: {
                value: [],
                readOnly: true,
            },

            /**
             * Uploaded title text
             *
             * @attribute uploadedText
             * @type {String}
             * @readOnly
             */
            uploadedText: {
                valueFn: () => Y.eZ.trans('uploaded.info', {}, 'uploadpopup'),
                readOnly: true,
            },
        }
    });
});
