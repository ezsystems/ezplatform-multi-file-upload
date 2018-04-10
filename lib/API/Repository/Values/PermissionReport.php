<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUpload\API\Repository\Values;

use eZ\Publish\API\Repository\Values\ValueObject;

class PermissionReport extends ValueObject
{
    /** @var \eZ\Publish\API\Repository\Values\Content\Location */
    public $parentLocation;

    /** @var int */
    public $parentLocationId;

    /** @var string */
    public $module;

    /** @var string */
    public $function;

    /** @var string[] */
    public $allowedContentTypes;
}
