/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('mfu-text-format-helper', function (Y) {
    'use strict';
    /**
     * The text format helper
     *
     * @module mfu-text-format-helper
     */

    Y.namespace('mfu.Helper');

    /**
     * The helper is responsible for formatting text
     *
     * @namespace mfu.Helper
     * @class TextFormat
     * @constructor
     * @extends Base
     */
    Y.mfu.Helper.TextFormat = Y.Base.create('textFormatHelper', Y.Base, [], {
        /**
         * Formats a file size information
         *
         * @method _formatFileSize
         * @protected
         * @param bytes {Number} file size in bytes
         * @return {String} formatted file size information
         */
        _formatFileSize: function (bytes) {
            const units = ['bytes', 'KB', 'MB', 'GB'];
            const kilobyte = 1024;
            let size = parseInt(bytes, 10) || 0;
            let unitIndex = 0;
            let decimalUnits;

            while (size >= kilobyte) {
                size = size / kilobyte;
                unitIndex++;
            }

            decimalUnits = unitIndex < 1 ? 0 : 1;

            return (size.toFixed(size >= 10 || decimalUnits) + ' ' + units[unitIndex]);
        },
    });
});
