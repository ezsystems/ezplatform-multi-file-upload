/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('mfu-fileupload-plugin', function (Y) {
    'use strict';

    /**
     * Provides the Multiple File Upload plugins
     *
     * @module mfu-fileupload-plugin
     */
    Y.namespace('mfu.Plugin');

    const VIEW_PLUGIN_NAME = 'mfuFileUploadViewPlugin';
    const SERVICE_PLUGIN_NAME = 'mfuFileUploadServicePlugin';
    const VIEWS = ['locationViewView'];
    const SERVICES = ['locationViewViewService'];

    /**
     * The Multiple File Upload View plugin
     *
     * @namespace mfu.Plugin
     * @class FileUploadView
     * @constructor
     * @extends Plugin.Base
     */
    Y.mfu.Plugin.FileUploadView = Y.Base.create(VIEW_PLUGIN_NAME, Y.Plugin.Base, [], {
        initializer: function () {
            var host = this.get('host');

            host._set('subitemBox', this._setSubItemBoxView());
            host.on('*:mfuRefreshList', this._refreshSubItemBoxViewItems, this);
            host.on('activeChange', this._toggleSubItemBoxViewActiveState, this);
        },

        /**
         * Toggles subitem box view active state
         *
         * @method _toggleSubItemBoxViewActiveState
         * @param event {Object} event facade
         */
        _toggleSubItemBoxViewActiveState: function (event) {
            const contentType = this.get('host').get('contentType');

            if (contentType && contentType.get('isContainer')) {
                this.get('subitemBoxView').set('active', event.newVal);
            }
        },

        /**
         * Sets a {{#crossLink "mfu.SubitemBoxView"}}mfu.SubitemBoxView{{/crossLink}} instance
         * as the host's `subitemBox` attribute value
         *
         * @method _setSubItemBoxView
         * @protected
         * @returns {mfu.SubitemBoxView|null}
         */
        _setSubItemBoxView: function () {
            const host = this.get('host');
            const contentType = host.get('contentType');

            if (contentType && contentType.get('isContainer')) {
                let subitemBoxView = new Y.mfu.SubitemBoxView({
                    location: host.get('location'),
                    content: host.get('content'),
                    contentType: contentType,
                    config: host.get('config'),
                    bubbleTargets: host,
                });

                this.set('subitemBoxView', subitemBoxView);

                return subitemBoxView;
            }

            return null;
        },

        /**
         * Refreshes a list of files in a subitem box view instance
         *
         * @method _refreshSubItemBoxViewItems
         * @protected
         */
        _refreshSubItemBoxViewItems: function () {
            const box = this.get('subitemBoxView');
            const subItemListView = box._getSubitemView(box.get('subitemViewIdentifier'));

            subItemListView._refresh();
            subItemListView.after('loadingChange', () => box.updateSubItemsCountLabel(subItemListView.get('items').length));
        },
    }, {
        NS: VIEW_PLUGIN_NAME,
        ATTRS: {
            /**
             * A subitem box view instance
             *
             * @attribute subitemBoxView
             * @type {mfu.SubitemBoxView}
             */
            subitemBoxView: {}
        }
    });

    /**
     * The Multiple File Upload Service plugin
     *
     * @namespace mfu.Plugin
     * @class FileUploadService
     * @constructor
     * @extends eZ.Plugin.ViewServiceBase
     */
    Y.mfu.Plugin.FileUploadService = Y.Base.create(SERVICE_PLUGIN_NAME, Y.eZ.Plugin.ViewServiceBase, [], {
        initializer: function () {
            const host = this.get('host');

            /**
             * Detected content type mapping
             *
             * @property _detectedContentTypeMapping
             * @type {Object}
             */
            this._detectedContentTypeMapping = {};

            this._setContentTypeMappings();

            host.on('mfuFileItemView:mfuUploadFile', this._initFileUpload, this);
            host.on('mfuFileItemView:mfuDeleteFile', this._deleteContent, this);
            host.on('mfuUploadFormView:mfuGetAllowedMimeTypes', this._setAllowedMimeTypesInfo, this);
        },

        /**
         * Sets view attributes values based on provided content type mapping configuration from backend
         *
         * @method _setContentTypeMappings
         * @protected
         */
        _setContentTypeMappings: function () {
            const config = this.get('host').get('app').get('config.multiFileUpload');

            this._set('contentTypeDefaultMappings', config.defaultMappings);
            this._set('defaultContentType', config.fallbackContentType);
            this._set('contentTypeByLocationMappings', config.locationMappings);
        },

        /**
         * Retrieves information about allowed mime types
         *
         * @method _setAllowedMimeTypesInfo
         * @protected
         * @param event {Object} event facade
         * @param event.callback {Function} a callback where allowed mime types are passed into
         */
        _setAllowedMimeTypesInfo: function (event) {
            const contentTypeIdentifier = this.get('host').get('contentType').get('identifier');
            const locationMappings = this._findLocationMappings(contentTypeIdentifier);
            const allowedMimeTypes = locationMappings ? locationMappings.mimeTypeFilter : [];

            event.callback(allowedMimeTypes);
        },

        /**
         * Finds a location mappings based on provided location content type identifier
         *
         * @method _findLocationMappings
         * @protected
         * @param identifier {String} location content type identifier
         * @return {Object}
         */
        _findLocationMappings: function (identifier) {
            return this.get('contentTypeByLocationMappings').find(item => item.contentTypeIdentifier === identifier);
        },

        /**
         * Initializes a file upload process
         *
         * @method _initFileUpload
         * @protected
         * @param event {Object} event facade
         * @param event.file {File} file object
         * @param event.onabort {Function} on abort callback
         * @param event.onerror {Function} on error callback
         * @param event.onload {Function} on load callback
         * @param event.onprogress {Function} on progress callback
         * @param event.ontimeout {Function} on timeout callback
         * @param event.setXhrCallback {Function} a callback to return a created XHR object
         * @param event.publishedCallback {Function} a callback to invoke when content is published
         */
        _initFileUpload: function (event) {
            const capi = this.get('host').get('capi');
            const data = {file: event.file};

            if (!this._checkFileTypeAllowed(event.file)) {
                event.fileTypeNotAllowedCallback();

                return;
            }

            this._detectContentType(event.file)
                .then(this._createContentStruct.bind(this, data))
                .then(this._transformFileToBase64.bind(this))
                .then(this._updateContentStructWithFileMeta.bind(this))
                .then(this._createContent.bind(this, {
                    upload: {
                        onabort: event.onabort,
                        onerror: event.onerror,
                        onload: event.onload,
                        onprogress: event.onprogress,
                        ontimeout: event.ontimeout,
                    },
                    onerror: event.onerror,
                    onloadstart: this._retrieveXhrObject.bind(this, event.setXhrCallback),
                    setXhrCallback: event.setXhrCallback,
                    publishedCallback: event.publishedCallback
                }))
                .catch(event.onerror.bind(event.target));
        },

        /**
         * Checks if a provided file has an allowed file type
         *
         * @method _checkFileTypeAllowed
         * @protected
         * @param file {File} File object
         * @return {Boolean} true if file type is allowed
         */
        _checkFileTypeAllowed: function (file) {
            const contentTypeIdentifier = this.get('host').get('contentType').get('identifier');
            const locationMapping = this._findLocationMappings(contentTypeIdentifier);

            if (!locationMapping) {
                return true;
            }

            return !!locationMapping.mappings.find(item => item.mimeType === file.type);
        },

        /**
         * Detects a content type based on file mime type
         *
         * @method _detectContentType
         * @protected
         * @param file {File} a File object
         * @return {Promise}
         */
        _detectContentType: function (file) {
            this._detectedContentTypeMapping = this._detectContentTypeMapping(file);

            return new Promise((resolve, reject) => {
                this.get('host')
                    .get('capi')
                    .getContentTypeService()
                    .loadContentTypeByIdentifier(
                        this._detectedContentTypeMapping.contentTypeIdentifier,
                        this._resolvePromiseCallback.bind(this, resolve, reject)
                    );
            });
        },

        /**
         * Detects a content type based on a mapping provided by backend
         *
         * @method _detectContentTypeMapping
         * @protected
         * @param file {File} File object
         * @return {Object} detected content type mapping
         */
        _detectContentTypeMapping: function (file) {
            const contentTypeIdentifier = this.get('host').get('contentType').get('identifier');
            const locationMapping = this._findLocationMappings(contentTypeIdentifier);
            const mappings = locationMapping ? locationMapping.mappings : this.get('contentTypeDefaultMappings');

            return this._findMimeTypeMapping(mappings, file) || this.get('defaultContentType');
        },

        /**
         * Finds an element that has the same mapped file mimeType as a provided file type
         *
         * @method _findMimeTypeMapping
         * @protected
         * @param mappings {Array} list of mappings
         * @param file {File} File object
         * @return {Boolean}
         */
        _findMimeTypeMapping: (mappings, file) => mappings.find(item => item.mimeType === file.type),

        /**
         * Resolves/rejects a promise
         *
         * @method _resolvePromiseCallback
         * @protected
         * @param resolve {Function} success callback
         * @param reject {Function} error callback
         * @param error {Boolean} error flag
         * @param response {Object} xhr response
         */
        _resolvePromiseCallback: function (resolve, reject, error, response) {
            if (error) {
                reject(response);

                return;
            }

            resolve(response);
        },

        /**
         * Creates a content struct
         *
         * @method _createContentStruct
         * @protected
         * @param data {Object} data hash
         * @param response {Object} xhr response
         * @return {Object} updated data hash
         */
        _createContentStruct: function (data, response) {
            const host = this.get('host');
            const contentService = host.get('capi').getContentService();
            const locationStruct = contentService.newLocationCreateStruct(host.get('location').get('id'));
            const languageCode = host.get('languageCode');
            const contentType = response.document.ContentTypeInfoList.ContentType[0];

            data.struct = contentService.newContentCreateStruct(contentType._href, locationStruct, languageCode, true);
            data.contentType = contentType;

            return data;
        },

        /**
         * Transforms a file into Base64 hash
         *
         * @method _transformFileToBase64
         * @protected
         * @param data {Object} data hash
         * @return {Promise}
         */
        _transformFileToBase64: function (data) {
            const fileReader = this.get('fileReader');

            return new Promise((resolve, reject) => {
                fileReader.addEventListener('load', resolve.bind(this, data), false);
                fileReader.addEventListener('error', reject.bind(this), false);
                fileReader.readAsDataURL(data.file);
            });
        },

        /**
         * Discovers data field identifier where the file meta data will be stored
         *
         * @method _discoverDataFieldIdentifier
         * @protected
         * @return {String} content type identifier
         */
        _discoverDataFieldIdentifier: function () {
            return this._detectedContentTypeMapping.contentFieldIdentifier;
        },

        /**
         * Updates a content struct with file meta data
         *
         * @method _updateContentStructWithFileMeta
         * @protected
         * @param data {Object} data hash
         * @return {Object} updated data hash
         */
        _updateContentStructWithFileMeta: function (data) {
            data.struct.addField('name', data.file.name);
            data.struct.addField(this._discoverDataFieldIdentifier(), {
                fileName: data.file.name,
                data: this.get('fileReader').result.replace(/^.*;base64,/, ''),
            });

            return data;
        },

        /**
         * Creates content from uploaded file
         *
         * @method _createContent
         * @protected
         * @param callbacks {Object} a set of callbacks
         * @param data {Object} data hash
         */
        _createContent: function (callbacks, data) {
            this.get('host')
                .get('capi')
                .getContentService()
                .createContent(
                    data.struct,
                    callbacks,
                    this._attemptToPublishContent.bind(this, callbacks.onerror, callbacks.publishedCallback)
                );
        },

        /**
         * Retrieves an initialized XHR object and passes it further
         *
         * @method _retrieveXhrObject
         * @protected
         * @param callback {Function} a callback to invoke with a retrieved XHR object
         * @param event {Object} event facade
         */
        _retrieveXhrObject: function (callback, event) {
            callback(event.target);
        },

        /**
         * Attempts to publish content if request finshed successfully and is ready
         *
         * @method _attemptToPublishContent
         * @protected
         * @param errorCallback {Function} error callback
         * @param publishedCallback {Function} content published callback
         * @param error {Boolean} error flag
         * @param response {Object} REST response
         */
        _attemptToPublishContent: function (errorCallback, publishedCallback, error, response) {
            if (error && response.status > 0) {
                errorCallback(response);

                return;
            } else if (response.status === 0) {
                return;
            }

            this._publishContent(response.document.Content, errorCallback, publishedCallback);
        },

        /**
         * Publishes content of already uploaded file
         *
         * @method _publishContent
         * @protected
         * @param content {Object} content hash
         * @param errorCallback {Function} error callback
         * @param publishedCallback {Function} content published callback
         */
        _publishContent: function (content, errorCallback, publishedCallback) {
            this.get('host')
                .get('capi')
                .getContentService()
                .publishVersion(
                    content.CurrentVersion.Version._href,
                    this._loadContentModels.bind(this, content, errorCallback, publishedCallback)
                );
        },

        /**
         * Loads content models.
         * When all models are loaded with data,
         * then invokes a `publishedCallback` to inform a target view about a finished process.
         *
         * @method _loadContentModels
         * @protected
         * @param content {Object} content hash
         * @param errorCallback {Function} error callback
         * @param publishedCallback {Function} content published callback
         * @param error {Boolean} error flag
         * @param response {Object} content publish response
         */
        _loadContentModels: function (content, errorCallback, publishedCallback, error, response) {
            if (error) {
                errorCallback(response);

                return;
            }

            const capi = this.get('host').get('capi');
            const contentInfo = new Y.eZ.ContentInfo({id: content._href});
            const contentType = new Y.eZ.ContentType({id: content.ContentType._href});
            const promises = [
                new Promise((resolve, reject) => contentInfo.load({api: capi}, this._resolvePromiseCallback.bind(this, resolve, reject))),
                new Promise((resolve, reject) => contentType.load({api: capi}, this._resolvePromiseCallback.bind(this, resolve, reject))),
            ];

            Promise
                .all(promises)
                .then(() => publishedCallback(contentInfo, contentType))
                .catch(errorCallback);
        },

        /**
         * Deletes a content (file/image)
         *
         * @method _deleteContent
         * @protected
         * @param event {Object} event facade
         * @param event.contentId {Object} content REST id
         * @param event.deletedCallback {Object} a callback to invoke when content is deleted
         */
        _deleteContent: function (event) {
            this.get('host')
                .get('capi')
                .getContentService()
                .deleteContent(event.contentId, event.deletedCallback);
        }
    }, {
        NS: SERVICE_PLUGIN_NAME,
        ATTRS: {
            /**
             * Content type identifiers map (by mime type)
             *
             * @attribute contentTypeDefaultMappings
             * @type {Object}
             * @readOnly
             */
            contentTypeDefaultMappings: {
                readOnly: true
            },

            /**
             * Uploaded file default content type
             *
             * @attibute defaultContentType
             * @type {Object}
             * @readOnly
             */
            defaultContentType: {
                readOnly: true
            },

            /**
             * Uploaded files content type mappings by location
             *
             * @attibute contentTypeByLocationMappings
             * @type {Array}
             * @readOnly
             */
            contentTypeByLocationMappings: {
                value: [],
                readOnly: true
            },

            /**
             * FileReader object instance
             *
             * @attribute fileReader
             * @type {FileReader}
             * @readOnly
             */
            fileReader: {
                valueFn: () => new FileReader(),
                readOnly: true
            },
        }
    });

    Y.eZ.PluginRegistry.registerPlugin(Y.mfu.Plugin.FileUploadView, VIEWS);
    Y.eZ.PluginRegistry.registerPlugin(Y.mfu.Plugin.FileUploadService, SERVICES);
});
