/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('mfu-subitembox-view', function (Y) {
    'use strict';

    /**
     * Provides the subitem box view.
     *
     * @module mfu-subitembox-view
     */
    Y.namespace('mfu');

    const SELECTOR_SUBITEMS = '.mfu-box__subitem-boxes';

    /**
     * The subitem box view.
     * It allows the user to choose how the subitems are displayed.
     *
     * @namespace mfu
     * @class SubitemBoxView
     * @constructor
     * @extends eZ.SubitemBoxView
     */
    Y.mfu.SubitemBoxView = Y.Base.create('mfuSubitemBoxView', Y.eZ.SubitemBoxView, [], {
        initializer: function () {
            this.after('activeChange', this._toggleMfuViewsActiveState, this);
        },

        render: function () {
            this.constructor.superclass.render.apply(this, arguments);

            return this._renderUploadForm()._renderUploadPopup();
        },

        /**
         * Renders upload form view
         *
         * @method _renderUploadForm
         * @protected
         * @return {mfu.SubitemBoxView} the view itself
         */
        _renderUploadForm: function () {
            this.get('container').one(SELECTOR_SUBITEMS).prepend(this.get('uploadForm').render().get('container'));

            return this;
        },

        /**
         * Renders upload popup view
         *
         * @method _renderUploadPopup
         * @protected
         * @return {mfu.SubitemBoxView} the view itself
         */
        _renderUploadPopup: function () {
            this.get('container').append(this.get('uploadPopup').render().get('container'));

            return this;
        },

        /**
         * Toggles active state of form view and popup form view
         *
         * @method _toggleMfuViewsActiveState
         * @protected
         * @param event {Object} event facade
         * @return {mfu.SubitemBoxView} the view itself
         */
        _toggleMfuViewsActiveState: function (event) {
            [this.get('uploadPopup'), this.get('uploadForm')].forEach(view => view.set('active', event.newVal));
        },

        /**
         * Renders the subitem view
         *
         * @method _renderSubitemView
         * @protected
         * @param {mfu.SubitemBoxView} view
         */
        _renderSubitemView: function (view) {
            this.get('container')
                .addClass(this._generateViewClassName(Y.eZ.SubitemBoxView.NAME))
                .one(SELECTOR_SUBITEMS).setHTML(view.render().get('container'));
        },

        /**
         * Displays an upload popup
         *
         * @method _showUploadPopup
         * @protected
         * @param event {Object} event facade
         * @return {Boolean}
         */
        _showUploadPopup: function (event) {
            event.preventDefault();
            event.stopPropagation();

            this.get('uploadPopup')
                .set('displayed', true)
                .uploadFiles(event);

            return false;
        },

        destructor: function () {
            [this.get('uploadForm'), this.get('uploadPopup')].forEach(view => {
                view.removeTarget(this);
                view.destroy({remove: true});
            });
        }
    }, {
        ATTRS: {
            /**
             * Upload form view instance
             *
             * @attribute uploadForm
             * @type {mfu.UploadFormView}
             * @readOnly
             */
            uploadForm: {
                valueFn: function () {
                    return new Y.mfu.UploadFormView({
                        bubbleTargets: this,
                        onDropCallback: this._showUploadPopup.bind(this)
                    });
                },
                readOnly: true,
            },

            /**
             * Upload popup view instance
             *
             * @attribute uploadPopup
             * @type {mfu.UploadPopupView}
             * @readOnly
             */
            uploadPopup: {
                valueFn: function () {
                    return new Y.mfu.UploadPopupView({bubbleTargets: this});
                },
                readOnly: true,
            }
        }
    });
});
