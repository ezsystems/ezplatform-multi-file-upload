<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUploadBundle\Tests\ApplicationConfig\Providers;

use EzSystems\MultiFileUploadBundle\ApplicationConfig\Providers\ContentTypeMappings;

class ContentTypeMappingsTest extends \PHPUnit_Framework_TestCase
{
    public function testGetConfig()
    {
        $locationMappings = [
            [
                'location_id' => 1,
                'mime_type_filter' => [
                    'video/*',
                    'image/*',
                ],
                'mappings' => [
                    [
                        'mime_type' => 'application/msword',
                        'content_type_identifier' => 'file',
                        'content_field_identifier' => 'file',
                    ],
                    [
                        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'content_type_identifier' => 'file',
                        'content_field_identifier' => 'file',
                    ],
                ],
            ],
            [
                'location_id' => 3,
                'mime_type_filter' => [
                    'video/*',
                ],
                'mappings' => [
                    [
                        'mime_type' => 'application/msword',
                        'content_type_identifier' => 'file',
                        'content_field_identifier' => 'file',
                    ],
                ],
            ],
        ];
        $defaultMappings = [
            [
                'mime_type' => 'application/msword',
                'content_type_identifier' => 'file',
                'content_field_identifier' => 'file',
            ],
            [
                'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'content_type_identifier' => 'file',
                'content_field_identifier' => 'file',
            ],
        ];
        $fallbackContentType = [
            'content_type_identifier' => 'file',
            'content_field_identifier' => 'file',
        ];

        $contentTypeMappingsConfig = new ContentTypeMappings($locationMappings, $defaultMappings, $fallbackContentType);

        $expectedArray = [
            'locationMappings' => [
                [
                    'locationId' => 1,
                    'mimeTypeFilter' => [
                        'video/*',
                        'image/*',
                    ],
                    'mappings' => [
                        [
                            'mimeType' => 'application/msword',
                            'contentTypeIdentifier' => 'file',
                            'contentFieldIdentifier' => 'file',
                        ],
                        [
                            'mimeType' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'contentTypeIdentifier' => 'file',
                            'contentFieldIdentifier' => 'file',
                        ],
                    ],
                ],
                [
                    'locationId' => 3,
                    'mimeTypeFilter' => [
                        'video/*',
                    ],
                    'mappings' => [
                        [
                            'mimeType' => 'application/msword',
                            'contentTypeIdentifier' => 'file',
                            'contentFieldIdentifier' => 'file',
                        ],
                    ],
                ],
            ],
            'defaultMappings' => [
                [
                    'mimeType' => 'application/msword',
                    'contentTypeIdentifier' => 'file',
                    'contentFieldIdentifier' => 'file',
                ],
                [
                    'mimeType' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'contentTypeIdentifier' => 'file',
                    'contentFieldIdentifier' => 'file',
                ],
            ],
            'fallbackContentType' => [
                'contentTypeIdentifier' => 'file',
                'contentFieldIdentifier' => 'file',
            ],
        ];

        $this->assertArraySubset($contentTypeMappingsConfig->getConfig(), $expectedArray);
    }

    public function testGetConfigWithEmptyValues()
    {
        $locationMappings = [];
        $defaultMappings = [];
        $fallbackContentType = [
            'content_type_identifier' => null,
            'content_field_identifier' => null,
        ];

        $contentTypeMappingsConfig = new ContentTypeMappings($locationMappings, $defaultMappings, $fallbackContentType);

        $expectedArray = [
            'locationMappings' => [],
            'defaultMappings' => [],
            'fallbackContentType' => [
                'contentTypeIdentifier' => null,
                'contentFieldIdentifier' => null,
            ],
        ];

        $this->assertArraySubset($contentTypeMappingsConfig->getConfig(), $expectedArray);
    }
}
