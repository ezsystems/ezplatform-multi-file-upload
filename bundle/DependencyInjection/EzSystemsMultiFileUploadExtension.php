<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUploadBundle\DependencyInjection;

use Symfony\Component\Config\FileLocator;
use Symfony\Component\Config\Resource\FileResource;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use Symfony\Component\DependencyInjection\Loader;
use Symfony\Component\HttpKernel\DependencyInjection\ConfigurableExtension;
use Symfony\Component\Yaml\Yaml;
use EzSystems\PlatformUIBundle\DependencyInjection\PlatformUIExtension;

class EzSystemsMultiFileUploadExtension extends ConfigurableExtension implements PrependExtensionInterface, PlatformUIExtension
{
    /** These keys are used to overwrite parameters */
    const CONFIGURATION_PARAMETERS = [
        'location_mappings',
        'default_mappings',
        'fallback_content_type',
        'max_file_size',
    ];

    /**
     * {@inheritdoc}
     */
    public function loadInternal(array $config, ContainerBuilder $container)
    {
        $loader = new Loader\YamlFileLoader($container, new FileLocator(__DIR__ . '/../Resources/config'));
        $loader->load('default_settings.yml');
        $loader->load('services.yml');

        $this->applyParametersFromConfiguration($config, $container);
    }

    /**
     * {@inheritdoc}
     */
    public function prepend(ContainerBuilder $container)
    {
        $this->prependYui($container);
        $this->prependCss($container);
    }

    /**
     * @param array $config
     * @param \Symfony\Component\DependencyInjection\ContainerBuilder $container
     */
    private function applyParametersFromConfiguration(array $config, ContainerBuilder $container)
    {
        foreach (static::CONFIGURATION_PARAMETERS as $key) {
            if (isset($config[$key])) {
                $container->setParameter('ez_systems.multifile_upload.' . $key, $config[$key]);
            }
        }
    }

    /**
     * @param \Symfony\Component\DependencyInjection\ContainerBuilder $container
     */
    private function prependYui(ContainerBuilder $container)
    {
        // Directories where public resources are stored (relative to web/ directory).
        $container->setParameter('multifile_upload.public_dir', 'bundles/ezsystemsmultifileupload');

        $yuiConfigFile = __DIR__ . '/../Resources/config/yui.yml';
        $config = Yaml::parse(file_get_contents($yuiConfigFile));
        $container->prependExtensionConfig('ez_platformui', $config);
        $container->addResource(new FileResource($yuiConfigFile));
    }

    /**
     * @param \Symfony\Component\DependencyInjection\ContainerBuilder $container
     */
    private function prependCss(ContainerBuilder $container)
    {
        $cssConfigFile = __DIR__ . '/../Resources/config/css.yml';
        $config = Yaml::parse(file_get_contents($cssConfigFile));
        $container->prependExtensionConfig('ez_platformui', $config);
        $container->addResource(new FileResource($cssConfigFile));
    }

    public function getTranslationDomains()
    {
        return [
            'uploadform',
            'uploadpopup',
            'fileuploaditem',
            'pluginfileupload',
        ];
    }
}
