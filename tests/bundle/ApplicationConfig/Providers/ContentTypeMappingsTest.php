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
                'content_type_identifier' => 1,
                'mime_type_filter' => [
                    'video/*',
                    'image/*',
                ],
                'mappings' => [
                    [
                        'mime_types' => [
                            'image/jpeg',
                            'image/png',
                        ],
                        'content_type_identifier' => 'image',
                        'content_field_identifier' => 'image',
                        'name_field_identifier' => 'name',
                    ],
                ],
            ],
            [
                'content_type_identifier' => 3,
                'mime_type_filter' => [
                    'application/msword',
                ],
                'mappings' => [
                    [
                        'mime_types' => [
                            'application/msword'
                        ],
                        'content_type_identifier' => 'file',
                        'content_field_identifier' => 'file',
                        'name_field_identifier' => 'name',
                    ],
                ],
            ],
        ];
        $defaultMappings = [
            [
                'mime_types' => [
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ],
                'content_type_identifier' => 'file',
                'content_field_identifier' => 'file',
                'name_field_identifier' => 'name',
            ],
        ];
        $fallbackContentType = [
            'content_type_identifier' => 'file',
            'content_field_identifier' => 'file',
            'name_field_identifier' => 'name',
        ];
        $maxFileSize = 64000000;

        $contentTypeMappingsConfig = new ContentTypeMappings(
            $locationMappings,
            $defaultMappings,
            $fallbackContentType,
            $maxFileSize
        );

        $expectedArray = [
            'locationMappings' => [
                [
                    'contentTypeIdentifier' => 1,
                    'mimeTypeFilter' => [
                        'video/*',
                        'image/*',
                    ],
                    'mappings' => [
                        [
                            'mimeTypes' => [
                                'image/jpeg',
                                'image/png',
                            ],
                            'contentTypeIdentifier' => 'image',
                            'contentFieldIdentifier' => 'image',
                            'nameFieldIdentifier' => 'name',
                        ],
                    ],
                ],
                [
                    'contentTypeIdentifier' => 3,
                    'mimeTypeFilter' => [
                        'application/msword',
                    ],
                    'mappings' => [
                        [
                            'mimeTypes' => [
                                'application/msword',
                            ],
                            'contentTypeIdentifier' => 'file',
                            'contentFieldIdentifier' => 'file',
                            'nameFieldIdentifier' => 'name',
                        ],
                    ],
                ],
            ],
            'defaultMappings' => [
                [
                    'mimeTypes' => [
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    ],
                    'contentTypeIdentifier' => 'file',
                    'contentFieldIdentifier' => 'file',
                    'nameFieldIdentifier' => 'name',
                ],
            ],
            'fallbackContentType' => [
                'contentTypeIdentifier' => 'file',
                'contentFieldIdentifier' => 'file',
                'nameFieldIdentifier' => 'name',
            ],
            'maxFileSize' => 64000000,
        ];

        $this->assertArraySubset($expectedArray, $contentTypeMappingsConfig->getConfig());
    }

    public function testGetConfigWithEmptyValues()
    {
        $locationMappings = [];
        $defaultMappings = [];
        $fallbackContentType = [
            'content_type_identifier' => null,
            'content_field_identifier' => null,
            'name_field_identifier' => null,
        ];
        $maxFileSize = null;

        $contentTypeMappingsConfig = new ContentTypeMappings($locationMappings, $defaultMappings, $fallbackContentType, $maxFileSize);

        $expectedArray = [
            'locationMappings' => [],
            'defaultMappings' => [],
            'fallbackContentType' => [
                'contentTypeIdentifier' => null,
                'contentFieldIdentifier' => null,
                'nameFieldIdentifier' => null,
            ],
            'maxFileSize' => null,
        ];

        $this->assertArraySubset($contentTypeMappingsConfig->getConfig(), $expectedArray);
    }
}
