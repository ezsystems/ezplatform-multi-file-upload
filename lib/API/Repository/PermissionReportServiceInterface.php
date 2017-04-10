<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUpload\API\Repository;

use eZ\Publish\API\Repository\Values\Content\Location;
use eZ\Publish\API\Repository\Values\ContentType\ContentType;
use eZ\Publish\API\Repository\Values\User\UserReference;

/**
 * Interface for a service producing PermissionReports.
 */
interface PermissionReportServiceInterface
{
    /**
     * Returns PermissionReport regarding content:create permission for the contentType in location.
     *
     * @param \eZ\Publish\API\Repository\Values\ContentType\ContentType $contentType
     * @param \eZ\Publish\API\Repository\Values\Content\Location $parentLocation
     * @param \eZ\Publish\API\Repository\Values\User\UserReference $userReference
     *
     * @return \EzSystems\MultiFileUpload\API\Repository\Values\PermissionReport
     */
    public function canUserCreateContent(ContentType $contentType, Location $parentLocation, UserReference $userReference = null);
}
