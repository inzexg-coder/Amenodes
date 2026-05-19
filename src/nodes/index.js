import { NumberNode, metadata as numberMeta } from './NumberNode.js';
import { ConstantNode, metadata as constantMeta } from './ConstantNode.js';
import { GroupNode, metadata as groupMeta } from './GroupNode.js';
import { CalcNode, metadata as calcMeta } from './CalcNode.js';
import { OutputNode, metadata as outputMeta } from './OutputNode.js';
import { MapNode, metadata as mapMeta } from './MapNode.js';
import { ConfidenceIntervalNode, metadata as confidenceMeta } from './ConfidenceIntervalNode.js';

export const NODES = [
  { type: 'number', NodeClass: NumberNode, metadata: numberMeta },
  { type: 'constant', NodeClass: ConstantNode, metadata: constantMeta },
  { type: 'group', NodeClass: GroupNode, metadata: groupMeta },
  { type: 'calc', NodeClass: CalcNode, metadata: calcMeta },
  { type: 'output', NodeClass: OutputNode, metadata: outputMeta },
  { type: 'map', NodeClass: MapNode, metadata: mapMeta },
  { type: 'confidenceInterval', NodeClass: ConfidenceIntervalNode, metadata: confidenceMeta },
];
