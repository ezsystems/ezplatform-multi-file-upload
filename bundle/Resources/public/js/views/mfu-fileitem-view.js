/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('mfu-fileitem-view', function (Y) {
    'use strict';

    /**
     * Provides the file item view
     *
     * @module mfu-fileitem-view
     */
    Y.namespace('mfu');

    const CLASS_HIDDEN = 'mfu--hidden';
    const CLASS_DISCOVERYBAR_HIDDEN = 'is-menu-hidden';
    const SELECTOR_BTN_EDIT = '.mfu-file-item__option[data-option="edit"]';
    const SELECTOR_BTN_REMOVE = '.mfu-file-item__option[data-option="remove"]';
    const SELECTOR_BTN_ABORT = '.mfu-file-item__option[data-option="abort"]';
    const SELECTOR_PROGRESS_VALUE = '.mfu-file-item__progress-value';
    const SELECTOR_PROGRESS_STATUS = '.mfu-file-item__progress-status';
    const SELECTOR_UPLOAD_STATUS = '.mfu-file-item__upload-status';
    const SELECTOR_STATUS_DONE = '.mfu-file-item__upload-state--done';
    const SELECTOR_STATUS_INPROGRESS = '.mfu-file-item__upload-state--in-progress';
    const SELECTOR_STATUS_ERROR = '.mfu-file-item__upload-state--error';
    const SELECTOR_FILENAME_LABEL = '.mfu-file-item__filename';
    const EVENTS = {};

    EVENTS[SELECTOR_BTN_ABORT] = {tap: '_abortUpload'};
    EVENTS[SELECTOR_BTN_EDIT] = {tap: '_fireEditContentRequestEvent'};
    EVENTS[SELECTOR_BTN_REMOVE] = {tap: '_fireDeleteFileEvent'};

    /**
     * The File Item view
     *
     * @namespace mfu
     * @class FileItemView
     * @constructor
     * @extends eZ.TemplateBasedView
     */
    Y.mfu.FileItemView = Y.Base.create('mfuFileItemView', Y.eZ.TemplateBasedView, [Y.mfu.Helper.TextFormat], {
        containerTemplate: '<li/>',

        initializer: function () {
            this._addDOMEventHandlers(EVENTS);
        },

        render: function () {
            const container = this.get('container');
            const filesize = this._formatFileSize(this.get('file').blob.size);

            container.setHTML(this.template({
                type: this._detectFileType(),
                fileUploadDoneText: this.get('fileUploadDoneText').replace('{total}', filesize),
                fileUploadStatusText: this._getUploadStatusText(0, filesize),
                progressStatus: '0%',
                filename: this._getFileName(),
            }));

            this.set('formattedFileSize', filesize);

            this._fireUploadFileEvent();

            return this;
        },

        /**
         * Detects file type identifier. Only for rendering purposes.
         *
         * @method _detectFileType
         * @protected
         * @return {String} detected file type identifier
         */
        _detectFileType: function () {
            const filetype = this.get('file').blob.type;
            let type = 'file';

            if (filetype.indexOf('/pdf') > -1) {
                type = 'pdf';
            } else if (filetype.indexOf('video/') > -1) {
                type = 'video';
            } else if (filetype.indexOf('image/') > -1) {
                type = 'image';
            }

            return type;
        },

        /**
         * Sets `xhr` attribute value
         *
         * @method _setXhr
         * @protected
         * @param xhr {XMLHttpRequest} request object
         */
        _setXhr: function (xhr) {
            this._set('xhr', xhr);
        },

        /**
         * Fires `mfuUploadFile` event
         *
         * @method _fireUploadFileEvent
         */
        _fireUploadFileEvent: function () {
            /**
             * Event informs about a file to be uploaded.
             * Listened by {{#crossLink "mfu.Plugin.FileUploadService"}}mfu.Plugin.FileUploadService{{/crossLink}}
             *
             * @event mfuUploadFile
             * @param config {Object} config object
             * @param config.file {File} File object
             * @param config.onabort {Function} on abort callback
             * @param config.onerror {Function} on error callback
             * @param config.onload {Function} on load callback
             * @param config.onprogress {Function} on progress callback
             * @param config.ontimeout {Function} on timeout callback
             * @param config.setXhrCallback {Function} a callback to return a created XHR object
             * @param config.publishedCallback {Function} a callback to invoke when content is published
             * @param config.fileTypeNotAllowedCallback {Function} a callback to invoke when an uploaded file content type is not allowed
             * @param config.maxFileSizeExceededCallback {Function} a callback to invoke when an uploaded file size has exceeded max size
             */
            this.fire('mfuUploadFile', {
                file: this.get('file').blob,
                onprogress: this._updateProgressStatus.bind(this),
                onerror: this._showFileUploadError.bind(this),
                ontimeout: this._showFileUploadError.bind(this),
                onabort: this.destroy.bind(this, {remove: true}),
                onload: this._showUploadedFileInfo.bind(this),
                setXhrCallback: this._setXhr.bind(this),
                publishedCallback: this._setContentInfo.bind(this),
                fileTypeNotAllowedCallback: this._showFileTypeNotAllowedError.bind(this),
                maxFileSizeExceededCallback: this._showMaxFileSizeExceededError.bind(this),
            });
        },

        /**
         * Displays the max file size exceeded error message
         *
         * @method _showMaxFileSizeExceededError
         * @protected
         */
        _showMaxFileSizeExceededError: function () {
            const message = this.get('fileSizeExceededText')
                                .replace('{filesize}', this._formatFileSize(this.get('file').blob.size))
                                .replace('{filename}', this._getFileName());

            this._uiShowErrorMessage(message);
        },

        /**
         * Displays the File Type not allowed error message
         *
         * @method _showFileTypeNotAllowedError
         * @protected
         */
        _showFileTypeNotAllowedError: function () {
            this._uiShowErrorMessage(this.get('fileTypeNotAllowedText').replace('{filename}', this._getFileName()));
        },

        /**
         * Displays an error message in UI
         *
         * @method _uiShowErrorMessage
         * @protected
         * @param message {String} error message
         */
        _uiShowErrorMessage: function (message) {
            const container = this.get('container');
            const errorStatus = container.one(SELECTOR_STATUS_ERROR);

            errorStatus.removeClass(CLASS_HIDDEN);
            errorStatus.setHTML(message);
            container.one(SELECTOR_FILENAME_LABEL).addClass(CLASS_HIDDEN);
            container.one(SELECTOR_STATUS_DONE).addClass(CLASS_HIDDEN);
            container.one(SELECTOR_STATUS_INPROGRESS).addClass(CLASS_HIDDEN);
        },

        /**
         * Update progress status information
         *
         * @method _updateProgressStatus
         * @protected
         * @param event {Object} event facade
         * @param event.loaded {Number} uploaded file size
         * @param event.total {Number} total file size to upload (it differs from actual file size)
         */
        _updateProgressStatus: function (event) {
            const container = this.get('container');
            const fraction = event.loaded / event.total;
            const totalFileSize = this.get('file').blob.size;
            const uploadedSize = fraction * parseInt(totalFileSize, 10);
            const value = parseInt(fraction * 100, 10) + '%';

            container.one(SELECTOR_PROGRESS_VALUE).setStyle('width', value);
            container.one(SELECTOR_PROGRESS_STATUS).setHTML(value);
            container.one(SELECTOR_UPLOAD_STATUS).setHTML(
                this._getUploadStatusText(
                    this._formatFileSize(uploadedSize),
                    this._formatFileSize(totalFileSize)
                )
            );
        },

        /**
         * Gets uploaded status text
         *
         * @method _getUploadStatusText
         * @protected
         * @param loaded {Number} uploaded file size
         * @param total {Number} total uploaded file size
         * @return {String}
         */
        _getUploadStatusText: function (loaded, total) {
            return this.get('fileUploadStatusText').replace('{loaded}', loaded).replace('{total}', total);
        },

        /**
         * Displays an error notification when a file upload request fails.
         * Destroys a view.
         *
         * @method _showFileUploadError
         * @protected
         * @param event {Object} event facade
         */
        _showFileUploadError: function (event) {
            let errorText = this.get('fileUploadUnexpectedErrorText');

            if (event.message) {
                errorText = this.get('fileUploadErrorText')
                    .replace('{message}', `${this._getFileName()} - ${event.message}`);
            } else if (event.target && event.target.hasOwnProperty('status') && event.target.hasOwnProperty('statusText')) {
                let status = event.target.status ?
                    event.target.status :
                    'N/A';
                let message = event.target.statusText ?
                    event.target.statusText :
                    this.get('fileUploadUknownContentTypeText');

                errorText = this.get('fileUploadFailedText')
                    .replace('{statusCode}', status)
                    .replace('{statusText}', `${this._getFileName()} - ${message}`);
            } else if (event.document) {
                errorText = this.get('fileUploadFailedText')
                    .replace('{statusCode}', event.document.ErrorMessage.errorCode)
                    .replace('{statusText}', `${this._getFileName()} - ${event.document.ErrorMessage.errorDescription}`);
            }

            this._fireNotifyEvent({
                text: errorText,
                identifier: 'mfu-upload-failed-' + this._yuid,
                state: 'error',
                timeout: 0,
            });

            this._fireRefreshFilesListEvent();

            this.destroy({remove: true});
        },

        /**
         * Displays a final upload status information
         *
         * @method _showUploadedFileInfo
         * @protected
         * @param event {Object} event facade
         */
        _showUploadedFileInfo: function (event) {
            const container = this.get('container');
            const filename = this._getFileName();

            this._fireNotifyEvent({
                text: this.get('fileStartPublishText').replace('{filename}', filename),
                identifier: 'mfu-file-publishing-' + filename,
                state: 'started',
                timeout: 5,
            });

            container.one(SELECTOR_STATUS_DONE).removeClass(CLASS_HIDDEN);
            container.one(SELECTOR_BTN_ABORT).addClass(CLASS_HIDDEN);
            container.one(SELECTOR_STATUS_INPROGRESS).addClass(CLASS_HIDDEN);
        },

        /**
         * Aborts a file upload
         *
         * @method _abortUpload
         * @protected
         */
        _abortUpload: function () {
            const filename = this._getFileName();
            const xhr = this.get('xhr');

            if (!xhr || typeof xhr.abort !== 'function') {
                this.destroy({remove: true});

                return;
            }

            xhr.abort();
            this._set('xhr');
            this._fireNotifyEvent({
                text: this.get('fileUploadAbortedText').replace('{filename}', filename),
                identifier: 'mfu-file-upload-aborted-' + filename,
                timeout: 10,
            });
        },

        /**
         * Gets file name
         *
         * @method _getFileName
         * @protected
         * @return {String} file name
         */
        _getFileName: function () {
            return this.get('file').blob.name;
        },

        /**
         * Fires a `editContentRequest` event to redirect a user file edit
         *
         * @method _fireEditContentRequestEvent
         * @protected
         */
        _fireEditContentRequestEvent: function () {
            const contentInfo = this.get('contentInfo');

            document.body.classList.remove(CLASS_DISCOVERYBAR_HIDDEN);

            /**
             * Redirects to content editing in PlatformUI.
             * Listened by {{#crossLink "eZ.Plugin.ContentEdit"}}eZ.Plugin.ContentEdit{{/crossLink}}
             *
             * @event editContentRequest
             * @param config.contentInfo {eZ.ContentInfo} content info model
             * @param config.languageCode {String} content language code
             * @param config.contentType {eZ.ContentType} content type model
             */
            this.fire('editContentRequest',{
                contentInfo: contentInfo,
                languageCode: contentInfo.get('mainLanguageCode'),
                contentType: this.get('contentType'),
            });
        },

        /**
         * Fires a `mfuDeleteFile` event to delete a file
         *
         * @method _fireDeleteFileEvent
         * @protected
         */
        _fireDeleteFileEvent: function () {
            const filename = this._getFileName();
            const contentId = this.get('contentInfo').get('id');

            this._fireNotifyEvent({
                state: 'started',
                text: this.get('fileStartDeleteText').replace('{filename}', filename),
                identifier: 'mfu-delete-file-' + contentId,
                timeout: 0,
            });

            /**
             * Event informs about a file to be deleted
             * Listened by {{#crossLink "mfu.Plugin.FileUploadService"}}mfu.Plugin.FileUploadService{{/crossLink}}
             *
             * @event mfuDeleteFile
             * @param config {Object} config object
             * @param config.contentId {String} content REST id
             * @param config.deletedCallback {Function} a callback to invoke when content is deleted
             */
            this.fire('mfuDeleteFile', {
                contentId: contentId,
                deletedCallback: this._handleFileDeletion.bind(this)
            });
        },

        /**
         * Handles file deletion
         *
         * @method _handleFileDeletion
         * @protected
         */
        _handleFileDeletion: function () {
            this._fireNotifyEvent({
                state: 'done',
                text: this.get('fileDeletedText').replace('{filename}', this._getFileName()),
                identifier: 'mfu-delete-file-' + this.get('contentInfo').get('id'),
                timeout: 5,
            });

            this._fireRefreshFilesListEvent();

            this.destroy({remove: true});
        },

        /**
         * Sets published file content info
         *
         * @method _setContentInfo
         * @protected
         * @param contentInfo {eZ.ContentInfoModel} content info model
         * @param contentType {eZ.ContentTypeModel} content type model
         */
        _setContentInfo: function (contentInfo, contentType) {
            const filename = this._getFileName();

            this._set('contentInfo', contentInfo);
            this._set('contentType', contentType);
            this._showContentActionButtons();
            this._fireFilePublishedEvent();
            this._fireRefreshFilesListEvent();
            this._fireNotifyEvent({
                text: this.get('filePublishedText').replace('{filename}', filename),
                identifier: 'mfu-file-publishing-' + filename,
                state: 'done',
                timeout: 5,
            });
        },

        /**
         * Fires file published event
         *
         * @method _fireFilePublishedEvent
         * @protected
         */
        _fireFilePublishedEvent: function () {
            /**
             * Informs the file has been succesfuly uploaded
             * Listened by {{#crossLink "mfu.UploadPopupView"}}mfu.UploadPopupView{{/crossLink}}
             *
             * @event mfuFilePublished
             */
            this.fire('mfuFilePublished');
        },

        /**
         * Displays content action buttons, like an edit button, a remove button
         *
         * @method _showContentActionButtons
         * @protected
         * @return {mfu.FileItemView} the view itself
         */
        _showContentActionButtons: function () {
            const container = this.get('container');

            container.one(SELECTOR_BTN_EDIT).removeClass(CLASS_HIDDEN);
            container.one(SELECTOR_BTN_REMOVE).removeClass(CLASS_HIDDEN);

            return this;
        },

        /**
         * Fires `mfuRefreshList` event
         *
         * @method _fireRefreshFilesListEvent
         * @protected
         */
        _fireRefreshFilesListEvent: function () {
            /**
             * Event informs to refresh a list of files in the subitem box view
             * Listened by {{#crossLink "mfu.Plugin.FileUploadView"}}mfu.Plugin.FileUploadView{{/crossLink}}
             *
             * @event mfuRefreshList
             */
            this.fire('mfuRefreshList');
        },

        /**
         * Fires `notify` event
         *
         * @method _fireNotifyEvent
         * @protected
         * @param notification {Object} notification config
         */
        _fireNotifyEvent: function (notification) {
            /**
             * Displays a notification in the notification bar
             * Listened by {{#crossLink "eZ.Plugin.NotificationHub"}}eZ.Plugin.NotificationHub{{/crossLink}}
             *
             * @event notify
             * @param config.notification {Object} notification config
             */
            this.fire('notify', {notification: notification});
        },

        destructor: function () {
            const contentInfo = this.get('contentInfo');
            const contentType = this.get('contentType');

            if (contentInfo) {
                contentInfo.destroy();
            }

            if (contentType) {
                contentType.destroy();
            }
        }
    }, {
        ATTRS: {
            /**
             * File data hash
             *
             * @attribute file
             * @type {Object}
             */
            file: {},

            /**
             * Content info model
             *
             * @attribute contentInfo
             * @type {eZ.ContentInfo}
             * @readOnly
             */
            contentInfo: {
                readOnly: true,
            },

            /**
             * Content type model
             *
             * @attribute contentType
             * @type {eZ.ContentType}
             * @readOnly
             */
            contentType: {
                readOnly: true,
            },

            /**
             * XHR request object
             *
             * @attribute xhr
             * @type {XMLHttpRequest}
             * @readOnly
             */
            xhr: {
                readOnly: true,
            },

            /**
             * File upload status text
             *
             * @attribute fileUploadStatusText
             * @type {String}
             * @readOnly
             */
            fileUploadStatusText: {
                valueFn: () => Y.eZ.trans('file.upload.status', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * File upload done text
             *
             * @attribute fileUploadDoneText
             * @type {String}
             * @readOnly
             */
            fileUploadDoneText: {
                valueFn: () => Y.eZ.trans('file.upload.done', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * Start fiel publishing text
             *
             * @attribute fileStartPublishText
             * @type {String}
             * @readOnly
             */
            fileStartPublishText: {
                valueFn: () => Y.eZ.trans('publishing.file', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * File published text
             *
             * @attribute filePublishedText
             * @type {String}
             * @readOnly
             */
            filePublishedText: {
                valueFn: () => Y.eZ.trans('file.published', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * File deleted text
             *
             * @attribute fileDeletedText
             * @type {String}
             * @readOnly
             */
            fileDeletedText: {
                valueFn: () => Y.eZ.trans('file.deleted', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * File upload aborted text
             *
             * @attribute fileUploadAbortedText
             * @type {String}
             * @readOnly
             */
            fileUploadAbortedText: {
                valueFn: () => Y.eZ.trans('file.upload.aborted', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * Start deleting file text
             *
             * @attribute fileStartDeleteText
             * @type {String}
             * @readOnly
             */
            fileStartDeleteText: {
                valueFn: () => Y.eZ.trans('deleting.file', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * File upload failed text
             *
             * @attribute fileUploadFailedText
             * @type {String}
             * @readOnly
             */
            fileUploadFailedText: {
                valueFn: () => Y.eZ.trans('file.upload.failed', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * File upload error text
             *
             * @attribute fileUploadErrorText
             * @type {String}
             * @readOnly
             */
            fileUploadErrorText: {
                valueFn: () => Y.eZ.trans('file.upload.error', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * File upload unknown content type text
             *
             * @attribute fileUploadUknownContentTypeText
             * @type {String}
             * @readOnly
             */
            fileUploadUknownContentTypeText: {
                valueFn: () => Y.eZ.trans('file.upload.content.type.uknown', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * File upload unexpected error text
             *
             * @attribute fileUploadUnexpectedErrorText
             * @type {String}
             * @readOnly
             */
            fileUploadUnexpectedErrorText: {
                valueFn: () => Y.eZ.trans('file.upload.unexpected.error', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * File type not allowed error text
             *
             * @attribute fileTypeNotAllowedText
             * @type {String}
             * @readOnly
             */
            fileTypeNotAllowedText: {
                valueFn: () => Y.eZ.trans('file.type.not.allowed', {}, 'fileuploaditem'),
                readOnly: true,
            },

            /**
             * File size exceeded max allowed file size text
             *
             * @attribute fileSizeExceededText
             * @type {String}
             * @readOnly
             */
            fileSizeExceededText: {
                valueFn: () => Y.eZ.trans('file.size.not.allowed', {}, 'fileuploaditem'),
                readOnly: true,
            },
        }
    });
});
