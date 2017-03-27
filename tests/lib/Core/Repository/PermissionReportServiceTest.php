<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUpload\Tests\Core\Repository;

use eZ\Publish\API\Repository\Values\Content\ContentCreateStruct;
use eZ\Publish\API\Repository\Values\Content\Location;
use eZ\Publish\API\Repository\Values\Content\LocationCreateStruct;
use eZ\Publish\API\Repository\Values\ContentType\ContentType;
use eZ\Publish\Core\Repository\ContentService;
use eZ\Publish\Core\Repository\LocationService;
use eZ\Publish\Core\Repository\Permission\PermissionResolver;
use eZ\Publish\Core\Repository\Values\User\UserReference;
use EzSystems\MultiFileUpload\API\Repository\Values\PermissionReport;
use EzSystems\MultiFileUpload\Core\Repository\PermissionReportService;

class PermissionReportServiceTest extends \PHPUnit_Framework_TestCase
{
    /** @var \eZ\Publish\API\Repository\Values\ContentType\ContentType */
    protected $contentType;

    /** @var \eZ\Publish\API\Repository\Values\Content\Location */
    protected $location;

    /** @var \eZ\Publish\API\Repository\PermissionResolver */
    protected $permissionResolver;

    /** @var \eZ\Publish\API\Repository\ContentService */
    protected $contentService;

    /** @var \eZ\Publish\API\Repository\LocationService */
    protected $locationService;

    public function setUp()
    {
        // Initializing mock objects
        $contentCreateStruct = $this->getMockBuilder(ContentCreateStruct::class)->getMock();
        $locationCreateStruct = $this->getMockBuilder(LocationCreateStruct::class)->getMock();
        $this->contentType = $this->getMockBuilder(ContentType::class)->getMock();
        $this->location = $this->getMockBuilder(Location::class)->getMock();
        $this->contentService = $this->getMockBuilder(ContentService::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->locationService = $this->getMockBuilder(LocationService::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->permissionResolver = $this->getMockBuilder(PermissionResolver::class)
            ->disableOriginalConstructor()
            ->getMock();

        // Mocking method calls
        $this->contentType
            ->expects($this->any())
            ->method('__get')
            ->withConsecutive(
                [$this->equalTo('mainLanguageCode')],
                [$this->equalTo('id')]
            )
            ->willReturnOnConsecutiveCalls(
                'en-EN',
                12
            );
        $this->location
            ->method('__get')
            ->with('id')
            ->willReturn(30);
        $this->contentService
            ->method('newContentCreateStruct')
            ->with($this->contentType, 'en-EN')
            ->willReturn($contentCreateStruct);
        $this->locationService
            ->method('newLocationCreateStruct')
            ->with(30)
            ->willReturn($locationCreateStruct);
        $this->permissionResolver
            ->method('canUser')
            ->with('content', 'create', $contentCreateStruct, [$locationCreateStruct])
            ->willReturn(true);
    }

    public function testCanUserCreateContent()
    {
        $permissionReportService = new PermissionReportService(
            $this->permissionResolver,
            $this->contentService,
            $this->locationService
        );
        $permissionReport = $permissionReportService->canUserCreateContent($this->contentType, $this->location);

        $this->assertInstanceOf(PermissionReport::class, $permissionReport);
        $this->assertEquals('12', $permissionReport->contentTypeId);
        $this->assertEquals('30', $permissionReport->parentLocationId);
        $this->assertEquals('content', $permissionReport->module);
        $this->assertEquals('create', $permissionReport->function);
        $this->assertTrue($permissionReport->allowed);
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
            $this->locationService
        );
        $permissionReport = $permissionReportService->canUserCreateContent(
            $this->contentType,
            $this->location,
            $userReference
        );

        $this->assertInstanceOf(PermissionReport::class, $permissionReport);
        $this->assertEquals('12', $permissionReport->contentTypeId);
        $this->assertEquals('30', $permissionReport->parentLocationId);
        $this->assertEquals('content', $permissionReport->module);
        $this->assertEquals('create', $permissionReport->function);
        $this->assertTrue($permissionReport->allowed);
    }
}
