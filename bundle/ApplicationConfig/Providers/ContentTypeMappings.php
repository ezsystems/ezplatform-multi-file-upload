<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUploadBundle\ApplicationConfig\Providers;

/**
 * Class responsible for generating PlatformUI configuration for Multi File Upload functionality.
 */
class ContentTypeMappings
{
    /** @var array */
    protected $locationMappings = [];

    /** @var array */
    protected $defaultMappings = [];

    /** @var array */
    protected $fallbackContentType = [];

    /**
     * @param array $locationMappings
     * @param array $defaultMappings
     * @param array $fallbackContentType
     */
    public function __construct(array $locationMappings, array $defaultMappings, array $fallbackContentType)
    {
        $this->locationMappings = $locationMappings;
        $this->defaultMappings = $defaultMappings;
        $this->fallbackContentType = $fallbackContentType;
    }

    /**
     * Returns configuration structure compatbile with PlatformUI.
     *
     * @return array
     */
    public function getConfig()
    {
        $structure = [
            'locationMappings' => [],
            'defaultMappings' => [],
            'fallbackContentType' => $this->buildFallbackContentTypeStructure($this->fallbackContentType),
        ];

        foreach ($this->locationMappings as $locationIdentifier => $locationConfiguration) {
            $structure['locationMappings'][$locationIdentifier] = [
                'locationId' => $locationConfiguration['location_id'],
                'mimeTypeFilter' => $locationConfiguration['mime_type_filter'],
                'mappings' => [],
            ];

            foreach ($locationConfiguration['mappings'] as $mapping) {
                $structure['locationMappings'][$locationIdentifier]['mappings'][] = $this->buildMappingStructure($mapping);
            }
        }

        foreach ($this->defaultMappings as $mapping) {
            $structure['defaultMappings'][] = $this->buildMappingStructure($mapping);
        }

        return $structure;
    }

    /**
     * @param array $mapping
     *
     * @return array
     */
    private function buildMappingStructure(array $mapping)
    {
        return [
            'mimeType' => $mapping['mime_type'],
            'contentTypeIdentifier' => $mapping['content_type_identifier'],
            'contentFieldIdentifier' => $mapping['content_field_identifier'],
        ];
    }

    /**
     * @param array $fallbackContentType
     *
     * @return array
     */
    private function buildFallbackContentTypeStructure(array $fallbackContentType)
    {
        return [
            'contentTypeIdentifier' => $fallbackContentType['content_type_identifier'],
            'contentFieldIdentifier' => $fallbackContentType['content_field_identifier'],
        ];
    }
}
