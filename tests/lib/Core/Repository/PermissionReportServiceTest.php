<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUpload\Tests\Core\Repository;

use eZ\Publish\API\Repository\Values\Content\ContentCreateStruct;
use eZ\Publish\API\Repository\Values\Content\ContentInfo;
use eZ\Publish\API\Repository\Values\Content\Location;
use eZ\Publish\API\Repository\Values\Content\LocationCreateStruct;
use eZ\Publish\API\Repository\Values\ContentType\ContentType;
use eZ\Publish\API\Repository\Values\User\UserReference;
use eZ\Publish\Core\Repository\ContentService;
use eZ\Publish\Core\Repository\ContentTypeService;
use eZ\Publish\Core\Repository\LocationService;
use eZ\Publish\Core\Repository\Permission\PermissionResolver;
use EzSystems\MultiFileUpload\API\Repository\Values\PermissionReport;
use EzSystems\MultiFileUpload\Core\Repository\PermissionReportService;

class PermissionReportServiceTest extends \PHPUnit_Framework_TestCase
{
    /** @var \eZ\Publish\API\Repository\Values\Content\Location */
    protected $galleryLocation;

    /** @var \eZ\Publish\API\Repository\Values\Content\Location */
    protected $folderLocation;

    /** @var \eZ\Publish\API\Repository\PermissionResolver */
    protected $permissionResolver;

    /** @var \eZ\Publish\API\Repository\ContentService */
    protected $contentService;

    /** @var \eZ\Publish\API\Repository\ContentTypeService */
    protected $contentTypeService;

    /** @var \eZ\Publish\API\Repository\LocationService */
    protected $locationService;

    /** @var array */
    protected $locationMappings = [];

    /** @var array */
    protected $defaultMappings = [];

    /** @var array */
    protected $fallbackContentType = [];

    public function setUp()
    {
        $this->contentService = $this->getMockBuilder(ContentService::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->locationService = $this->getMockBuilder(LocationService::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->permissionResolver = $this->getMockBuilder(PermissionResolver::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->contentTypeService = $this->getMockBuilder(ContentTypeService::class)
            ->disableOriginalConstructor()
            ->getMock();

        $gallery = $this->getLocationAndContentTypeMocks(51, 31, 'gallery');
        $folder = $this->getLocationAndContentTypeMocks(52, 32, 'folder');

        $this->galleryLocation = $gallery['location'];
        $this->folderLocation = $folder['location'];

        $imageContentType = $this->getContentTypeMock();
        $videoContentType = $this->getContentTypeMock();
        $fileContentType = $this->getContentTypeMock();

        $imageContentCreateStruct = $this->getMockBuilder(ContentCreateStruct::class)
            ->getMock();
        $videoContentCreateStruct = $this->getMockBuilder(ContentCreateStruct::class)
            ->getMock();
        $fileContentCreateStruct = $this->getMockBuilder(ContentCreateStruct::class)
            ->getMock();

        $this->contentTypeService
            ->method('loadContentType')
            ->willReturnMap([
                [31, $gallery['contentType']],
                [32, $folder['contentType']],
            ]);

        $this->locationService
            ->method('newLocationCreateStruct')
            ->willReturnMap([
                [51, $gallery['locationCreateStruct']],
                [52, $folder['locationCreateStruct']],
            ]);

        $this->contentTypeService
            ->method('loadContentTypeByIdentifier')
            ->willReturnMap([
                ['image', $imageContentType],
                ['video', $videoContentType],
                ['file', $fileContentType],
            ]);

        $this->contentService
            ->method('newContentCreateStruct')
            ->willReturnMap([
                [$imageContentType, 'en-EN', $imageContentCreateStruct],
                [$videoContentType, 'en-EN', $videoContentCreateStruct],
                [$fileContentType, 'en-EN', $fileContentCreateStruct],
            ]);

        $this->permissionResolver
            ->method('canUser')
            ->willReturnMap([
                [
                    'content',
                    'create',
                    $imageContentCreateStruct,
                    [$gallery['locationCreateStruct']],
                    true,
                ],
                [
                    'content',
                    'create',
                    $videoContentCreateStruct,
                    [$gallery['locationCreateStruct']],
                    false,
                ],
                [
                    'content',
                    'create',
                    $fileContentCreateStruct,
                    [$gallery['locationCreateStruct']],
                    true,
                ],
                [
                    'content',
                    'create',
                    $imageContentCreateStruct,
                    [$folder['locationCreateStruct']],
                    true,
                ],
                [
                    'content',
                    'create',
                    $videoContentCreateStruct,
                    [$folder['locationCreateStruct']],
                    false,
                ],
                [
                    'content',
                    'create',
                    $fileContentCreateStruct,
                    [$folder['locationCreateStruct']],
                    true,
                ],
            ]);

        $this->locationMappings = [
            [
                'content_type_identifier' => 'gallery',
                'mime_type_filter' => [
                    'video/*',
                    'image/*',
                ],
                'mappings' => [
                    [
                        'mime_types' => [
                            'image/jpeg',
                            'image/jpg',
                            'image/pjpeg',
                            'image/pjpg',
                            'image/png',
                            'image/bmp',
                            'image/gif',
                            'image/tiff',
                            'image/x-icon',
                            'image/webp',
                        ],
                        'content_type_identifier' => 'image',
                        'content_field_identifier' => 'image',
                        'name_field_identifier' => 'name',
                    ],
                    [
                        'mime_types' => [
                            'video/avi',
                            'video/mpeg',
                            'video/quicktime',
                            'video/mp4',
                            'video/webm',
                            'video/3gpp',
                            'video/x-msvideo',
                            'video/ogg',
                        ],
                        'content_type_identifier' => 'video',
                        'content_field_identifier' => 'file',
                        'name_field_identifier' => 'name',
                    ],
                ],
            ],
        ];
        $this->defaultMappings = [
            [
                'mime_types' => [
                    'image/svg+xml',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'application/pdf',
                ],
                'content_type_identifier' => 'file',
                'content_field_identifier' => 'file',
                'name_field_identifier' => 'name',
            ],
        ];
        $this->fallbackContentType = [
            'content_type_identifier' => 'file',
            'content_field_identifier' => 'file',
            'name_field_identifier' => 'name',
        ];
    }

    public function testCanUserCreateContentUsingLocationMapping()
    {
        $permissionReportService = new PermissionReportService(
            $this->permissionResolver,
            $this->contentService,
            $this->contentTypeService,
            $this->locationService,
            $this->locationMappings,
            $this->defaultMappings,
            $this->fallbackContentType
        );

        $permissionReport = $permissionReportService->canUserCreateContent($this->galleryLocation);

        $this->assertInstanceOf(PermissionReport::class, $permissionReport);
        $this->assertEquals('51', $permissionReport->parentLocationId);
        $this->assertEquals('content', $permissionReport->module);
        $this->assertEquals('create', $permissionReport->function);
        $this->assertEquals(['image'], $permissionReport->allowedContentTypes);
    }

    public function testCanUserCreateContentUsingDefaultAndFallbackMappings()
    {
        $permissionReportService = new PermissionReportService(
            $this->permissionResolver,
            $this->contentService,
            $this->contentTypeService,
            $this->locationService,
            $this->locationMappings,
            $this->defaultMappings,
            $this->fallbackContentType
        );

        $permissionReport = $permissionReportService->canUserCreateContent($this->folderLocation);

        $this->assertInstanceOf(PermissionReport::class, $permissionReport);
        $this->assertEquals('52', $permissionReport->parentLocationId);
        $this->assertEquals('content', $permissionReport->module);
        $this->assertEquals('create', $permissionReport->function);
        $this->assertEquals(['file'], $permissionReport->allowedContentTypes);
    }

    public function testCanUserCreateContentWithInjectedUser()
    {
        $userReference = $this->getMockBuilder(UserReference::class)
            ->disableOriginalConstructor()
            ->getMock();

        $this->permissionResolver
            ->expects($this->once())
            ->method('setCurrentUserReference')
            ->with($userReference);

        $permissionReportService = new PermissionReportService(
            $this->permissionResolver,
            $this->contentService,
            $this->contentTypeService,
            $this->locationService,
            $this->locationMappings,
            $this->defaultMappings,
            $this->fallbackContentType
        );

        $permissionReport = $permissionReportService->canUserCreateContent(
            $this->galleryLocation,
            $userReference
        );

        $this->assertInstanceOf(PermissionReport::class, $permissionReport);
        $this->assertEquals('51', $permissionReport->parentLocationId);
        $this->assertEquals('content', $permissionReport->module);
        $this->assertEquals('create', $permissionReport->function);
        $this->assertEquals(['image'], $permissionReport->allowedContentTypes);
    }

    /**
     * @return \PHPUnit_Framework_MockObject_MockObject
     */
    private function getContentTypeMock()
    {
        $fileContentType = $this->getMockBuilder(ContentType::class)
            ->getMock();
        $fileContentType->method('__get')
            ->willReturnMap([
                ['mainLanguageCode', 'en-EN'],
            ]);

        return $fileContentType;
    }

    /**
     * @param int $locationId
     * @param int $contentTypeId
     * @param string $contentTypeIdentifier
     *
     * @return array
     */
    private function getLocationAndContentTypeMocks($locationId, $contentTypeId, $contentTypeIdentifier)
    {
        $locationCreateStruct = $this->getMockBuilder(LocationCreateStruct::class)
            ->getMock();
        $location = $this->getMockBuilder(Location::class)
            ->getMock();
        $locationContentType = $this->getMockBuilder(ContentType::class)
            ->getMock();
        $locationContentInfo = $this->getMockBuilder(ContentInfo::class)
            ->getMock();

        $location
            ->method('getContentInfo')
            ->willReturn($locationContentInfo);
        $locationContentType
            ->method('__get')
            ->with('identifier')
            ->willReturn($contentTypeIdentifier);
        $locationContentInfo
            ->method('__get')
            ->with('contentTypeId')
            ->willReturn($contentTypeId);
        $location
            ->method('__get')
            ->with('id')
            ->willReturn($locationId);

        return [
            'location' => $location,
            'contentType' => $locationContentType,
            'contentInfo' => $locationContentInfo,
            'locationCreateStruct' => $locationCreateStruct,
        ];
    }
}
