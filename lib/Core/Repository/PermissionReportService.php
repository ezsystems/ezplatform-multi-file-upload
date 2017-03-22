<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUpload\Core\Repository;

use eZ\Publish\API\Repository\ContentService;
use eZ\Publish\API\Repository\LocationService;
use eZ\Publish\API\Repository\PermissionResolver;
use eZ\Publish\API\Repository\Values\Content\Location;
use eZ\Publish\API\Repository\Values\ContentType\ContentType;
use eZ\Publish\API\Repository\Values\User\UserReference;
use EzSystems\MultiFileUpload\API\Repository\PermissionReportServiceInterface;
use EzSystems\MultiFileUpload\API\Repository\Values\PermissionReport;

/**
 * Concrete implementation of PermissionReport service.
 */
class PermissionReportService implements PermissionReportServiceInterface
{
    /** @var \eZ\Publish\API\Repository\PermissionResolver */
    protected $permissionResolver;

    /** @var \eZ\Publish\API\Repository\ContentService */
    protected $contentService;

    /** @var \eZ\Publish\API\Repository\LocationService */
    protected $locationService;

    /**
     * @param \eZ\Publish\API\Repository\PermissionResolver $permissionResolver
     * @param \eZ\Publish\API\Repository\ContentService $contentService
     * @param \eZ\Publish\API\Repository\LocationService $locationService
     */
    public function __construct(
        PermissionResolver $permissionResolver,
        ContentService $contentService,
        LocationService $locationService
    ) {
        $this->permissionResolver = $permissionResolver;
        $this->contentService = $contentService;
        $this->locationService = $locationService;
    }

    /**
     * @param \eZ\Publish\API\Repository\Values\ContentType\ContentType $contentType
     * @param \eZ\Publish\API\Repository\Values\Content\Location $parentLocation
     * @param \eZ\Publish\API\Repository\Values\User\UserReference|null $userReference
     *
     * @return \EzSystems\MultiFileUpload\API\Repository\Values\PermissionReport
     */
    public function canUserCreateContent(
        ContentType $contentType,
        Location $parentLocation,
        UserReference $userReference = null
    ) {
        $module = 'content';
        $function = 'create';

        if (null !== $userReference) {
            $this->permissionResolver->setCurrentUserReference($userReference);
        }

        $contentCreateStruct = $this->contentService->newContentCreateStruct($contentType, $contentType->mainLanguageCode);
        $locationCreateStruct = $this->locationService->newLocationCreateStruct($parentLocation->id);

        $permissionReport = new PermissionReport([
            'contentTypeId' => $contentType->id,
            'parentLocationId' => $parentLocation->id,
            'module' => $module,
            'function' => $function,
            'allowed' => $this->permissionResolver->canUser(
                $module,
                $function,
                $contentCreateStruct,
                [$locationCreateStruct]
            ),
        ]);

        return $permissionReport;
    }
}
