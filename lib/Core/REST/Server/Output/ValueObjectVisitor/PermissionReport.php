<?php
/**
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\MultiFileUpload\Core\REST\Server\Output\ValueObjectVisitor;

use eZ\Publish\Core\REST\Common\Output\Generator;
use eZ\Publish\Core\REST\Common\Output\ValueObjectVisitor;
use eZ\Publish\Core\REST\Common\Output\Visitor;

class PermissionReport extends ValueObjectVisitor
{
    /**
     * Visit struct returned by controllers.
     *
     * @param \eZ\Publish\Core\REST\Common\Output\Visitor $visitor
     * @param \eZ\Publish\Core\REST\Common\Output\Generator $generator
     * @param \EzSystems\MultiFileUpload\API\Repository\Values\PermissionReport $data
     */
    public function visit(Visitor $visitor, Generator $generator, $data)
    {
        $generator->startObjectElement('PermissionReport');

        $generator->startValueElement('parentLocationId', $data->parentLocationId);
        $generator->endValueElement('parentLocationId');

        $generator->startValueElement('contentTypeId', $data->contentTypeId);
        $generator->endValueElement('contentTypeId');

        $generator->startValueElement('module', $data->module);
        $generator->endValueElement('module');

        $generator->startValueElement('function', $data->function);
        $generator->endValueElement('function');

        $generator->startValueElement('allowed', $data->allowed);
        $generator->endValueElement('allowed');

        $generator->endObjectElement('PermissionReport');
    }
}
