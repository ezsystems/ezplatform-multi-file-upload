<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUpload\Core\Repository;

use eZ\Publish\API\Repository\ContentService;
use eZ\Publish\API\Repository\ContentTypeService;
use eZ\Publish\API\Repository\LocationService;
use eZ\Publish\API\Repository\PermissionResolver;
use eZ\Publish\API\Repository\Values\Content\Location;
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

    /**
     * @param \eZ\Publish\API\Repository\PermissionResolver $permissionResolver
     * @param \eZ\Publish\API\Repository\ContentService $contentService
     * @param \eZ\Publish\API\Repository\ContentTypeService $contentTypeService
     * @param \eZ\Publish\API\Repository\LocationService $locationService
     * @param array $locationMappings
     * @param array $defaultMappings
     * @param array $fallbackContentType
     */
    public function __construct(
        PermissionResolver $permissionResolver,
        ContentService $contentService,
        ContentTypeService $contentTypeService,
        LocationService $locationService,
        array $locationMappings,
        array $defaultMappings,
        array $fallbackContentType
    ) {
        $this->permissionResolver = $permissionResolver;
        $this->contentService = $contentService;
        $this->contentTypeService = $contentTypeService;
        $this->locationService = $locationService;
        $this->locationMappings = $locationMappings;
        $this->defaultMappings = $defaultMappings;
        $this->fallbackContentType = $fallbackContentType;
    }

    /**
     * @param \eZ\Publish\API\Repository\Values\Content\Location $parentLocation
     * @param \eZ\Publish\API\Repository\Values\User\UserReference|null $userReference
     *
     * @return \EzSystems\MultiFileUpload\API\Repository\Values\PermissionReport
     */
    public function canUserCreateContent(
        Location $parentLocation,
        UserReference $userReference = null
    ) {
        if (null !== $userReference) {
            $this->permissionResolver->setCurrentUserReference($userReference);
        }

        $locationCreateStruct = $this->locationService->newLocationCreateStruct($parentLocation->id);
        $mappings = $this->getContentTypeIdentifierMappingsForLocation($parentLocation);
        $allowedContentTypes = [];

        foreach ($mappings as $contentTypeIdentifier) {
            $contentType = $this->contentTypeService->loadContentTypeByIdentifier(
                $contentTypeIdentifier
            );
            $contentCreateStruct = $this->contentService->newContentCreateStruct(
                $contentType,
                $contentType->mainLanguageCode
            );
            $isAllowed = $this->permissionResolver->canUser(
                'content',
                'create',
                $contentCreateStruct,
                [$locationCreateStruct]
            );

            if ($isAllowed) {
                $allowedContentTypes[] = $contentTypeIdentifier;
            }
        }

        return new PermissionReport([
            'parentLocation' => $parentLocation,
            'parentLocationId' => $parentLocation->id,
            'module' => 'content',
            'function' => 'create',
            'allowedContentTypes' => array_unique($allowedContentTypes),
        ]);
    }

    /**
     * @param \eZ\Publish\API\Repository\Values\Content\Location $parentLocation
     *
     * @return array
     */
    private function getContentTypeIdentifierMappingsForLocation(Location $parentLocation)
    {
        $locationContentType = $this->contentTypeService->loadContentType($parentLocation->getContentInfo()->contentTypeId);
        $mappings = [];

        foreach ($this->locationMappings as $locationMapping) {
            if ($locationMapping['content_type_identifier'] === $locationContentType->identifier) {
                $mappings = $locationMapping['mappings'];
                break;
            }
        }

        $mappings = !empty($mappings)
            ? $mappings
            : array_merge($this->defaultMappings, [$this->fallbackContentType]);

        return $this->getUniqueContentTypeIdentifiersFromMappings($mappings);
    }

    /**
     * @param array $mappings
     *
     * @return array
     */
    private function getUniqueContentTypeIdentifiersFromMappings(array $mappings)
    {
        return array_unique(array_column($mappings, 'content_type_identifier'));
    }
}
