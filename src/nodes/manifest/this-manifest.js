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

// import { MyNode, metadata as myNodeMeta } from '../MyNode.js';

// ═══════════════════════════════════════════════════════════════════════
//  MANIFEST
// ═══════════════════════════════════════════════════════════════════════

export const nodesManifest = [
  { ctor: NumberNode, metadata: numberMeta },
  { ctor: ConstantNode, metadata: constantMeta },
  { ctor: GroupNode, metadata: groupMeta },
  { ctor: CalcNode, metadata: calcMeta },
  { ctor: OutputNode, metadata: outputMeta },
  { ctor: MapNode, metadata: mapMeta },
  { ctor: ConfidenceIntervalNode, metadata: confidenceMeta },
  
  // { ctor: MyNode, metadata: myNodeMeta },
];
