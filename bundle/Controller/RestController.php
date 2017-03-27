<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUploadBundle\Controller;

use eZ\Publish\API\Repository\ContentTypeService;
use eZ\Publish\API\Repository\LocationService;
use EzSystems\MultiFileUpload\API\Repository\PermissionReportServiceInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Class RestController.
 *
 * @todo: This endpoint is currently serving a functionality which should be already handled by REST API,
 *        please deprecate once EZP-26001 is implemented.
 */
class RestController
{
    /** @var \eZ\Publish\API\Repository\ContentTypeService */
    protected $contentTypeService;

    /** @var \EzSystems\MultiFileUpload\API\Repository\PermissionReportServiceInterface */
    protected $permissionReportService;

    /**
     * @param \eZ\Publish\API\Repository\ContentTypeService $contentTypeService
     * @param \eZ\Publish\API\Repository\LocationService $locationService
     * @param \EzSystems\MultiFileUpload\API\Repository\PermissionReportServiceInterface $permissionReportService
     */
    public function __construct(
        ContentTypeService $contentTypeService,
        LocationService $locationService,
        PermissionReportServiceInterface $permissionReportService
    ) {
        $this->contentTypeService = $contentTypeService;
        $this->locationService = $locationService;
        $this->permissionReportService = $permissionReportService;
    }

    /**
     * @param int $contentTypeId
     * @param int $parentLocationId
     * @param \Symfony\Component\HttpFoundation\Request $request
     *
     * @return \EzSystems\MultiFileUpload\API\Repository\Values\PermissionReport
     */
    public function checkPermission($contentTypeId, $parentLocationId, Request $request)
    {
        if (!$request->isXmlHttpRequest()) {
            throw new BadRequestHttpException('The request is not an AJAX request');
        }

        $contentType = $this->contentTypeService->loadContentType($contentTypeId);
        $parentLocation = $this->locationService->loadLocation($parentLocationId);

        return $this->permissionReportService->canUserCreateContent($contentType, $parentLocation);
    }
}
