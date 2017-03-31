<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUploadBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

class Configuration implements ConfigurationInterface
{
    /**
     * {@inheritDoc}
     */
    public function getConfigTreeBuilder()
    {
        $treeBuilder = new TreeBuilder();
        $rootNode = $treeBuilder->root('ez_systems_multi_file_upload');

        $rootNode
            ->validate()
            ->always(function($v){
                if (empty($v['location_mappings'])) {
                    unset($v['location_mappings']);
                }

                if (empty($v['default_mappings'])) {
                    unset($v['default_mappings']);
                }

                return $v;
            })
            ->end()
            ->children()
                ->arrayNode('location_mappings')
                    ->info('Let\'s you assign mappings bound to location')
                    ->prototype('array')
                        ->children()
                            ->scalarNode('content_type_identifier')
                                ->isRequired()
                                ->cannotBeEmpty()
                            ->end()
                            ->arrayNode('mime_type_filter')
                                ->defaultValue([])
                                ->prototype('scalar')->end()
                            ->end()
                            ->arrayNode('mappings')
                                ->info('Configure mappings between mime-type and content type identifier')
                                ->isRequired()
                                ->cannotBeEmpty()
                                ->prototype('array')
                                    ->children()
                                        ->scalarNode('mime_type')
                                            ->isRequired()
                                            ->cannotBeEmpty()
                                        ->end()
                                        ->scalarNode('content_type_identifier')
                                            ->isRequired()
                                            ->cannotBeEmpty()
                                        ->end()
                                        ->scalarNode('content_field_identifier')
                                            ->isRequired()
                                            ->cannotBeEmpty()
                                        ->end()
                                        ->scalarNode('name_field_identifier')
                                            ->isRequired()
                                            ->cannotBeEmpty()
                                        ->end()
                                    ->end()
                                ->end()
                            ->end()
                        ->end()
                    ->end()
                ->end()
                ->arrayNode('default_mappings')
                    ->info('These mappings are used as a fallback in case there are no entries under `locations` key')
                    ->prototype('array')
                        ->children()
                            ->scalarNode('mime_type')
                                ->isRequired()
                                ->cannotBeEmpty()
                            ->end()
                            ->scalarNode('content_type_identifier')
                                ->isRequired()
                                ->cannotBeEmpty()
                            ->end()
                            ->scalarNode('content_field_identifier')
                                ->isRequired()
                                ->cannotBeEmpty()
                            ->end()
                            ->scalarNode('name_field_identifier')
                                ->isRequired()
                                ->cannotBeEmpty()
                            ->end()
                        ->end()
                    ->end()
                ->end()
                ->arrayNode('fallback_content_type')
                    ->info('This content type will be used for files with no mime type mapping')
                    ->validate()
                        ->always(function($v){
                            if (
                                empty($v['content_type_identifier'])
                                || empty($v['content_field_identifier'])
                            ) {
                                $v = [
                                    'content_type_identifier' => null,
                                    'content_field_identifier' => null,
                                    'name_field_identifier' => null,
                                ];
                            }

                            return $v;
                        })
                    ->end()
                    ->children()
                        ->scalarNode('content_type_identifier')
                            ->defaultNull()
                        ->end()
                        ->scalarNode('content_field_identifier')
                            ->defaultNull()
                        ->end()
                        ->scalarNode('name_field_identifier')
                            ->defaultValue('name') // should work for most content types
                        ->end()
                    ->end()
                ->end()
                ->integerNode('max_file_size')
                    ->defaultValue(64000000) // 64MB
                    ->cannotBeEmpty()
                ->end()
            ->end()
        ;

        return $treeBuilder;
    }
}
