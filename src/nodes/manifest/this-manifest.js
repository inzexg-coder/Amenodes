// ═══════════════════════════════════════════════════════════════════════
//  IMPORTS
// ═══════════════════════════════════════════════════════════════════════

import { NumberNode, metadata as numberMeta } from '../NumberNode.js';
import { ConstantNode, metadata as constantMeta } from '../ConstantNode.js';
import { GroupNode, metadata as groupMeta } from '../GroupNode.js';
import { CalcNode, metadata as calcMeta } from '../CalcNode.js';
import { OutputNode, metadata as outputMeta } from '../OutputNode.js';
import { MapNode, metadata as mapMeta } from '../MapNode.js';
import { ConfidenceIntervalNode, metadata as confidenceMeta } from '../ConfidenceIntervalNode.js';
import { MeanNode, metadata as meanMeta } from '../MeanNode.js';

// import { MyNode, metadata as myNodeMeta } from '../MyNode.js';

// ═══════════════════════════════════════════════════════════════════════
//  MANIFEST
// ═══════════════════════════════════════════════════════════════════════

export const nodesManifest = [
  { ctor: NumberNode, metadata: numberMeta, fileName: 'number.js' },
  { ctor: ConstantNode, metadata: constantMeta, fileName: 'constant.js' },
  { ctor: GroupNode, metadata: groupMeta, fileName: 'group.js' },
  { ctor: CalcNode, metadata: calcMeta, fileName: 'calc.js' },
  { ctor: OutputNode, metadata: outputMeta, fileName: 'output.js' },
  { ctor: MapNode, metadata: mapMeta, fileName: 'map.js' },
  { ctor: ConfidenceIntervalNode, metadata: confidenceMeta, fileName: 'confidenceInterval.js' },
  { ctor: MeanNode, metadata: meanMeta, fileName: 'mean.js' },

// { ctor: MyNode, metadata: myNodeMeta, fileName: 'node.js' },
];
