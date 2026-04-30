// github actions

export class Edge {
  constructor(id, sourceId, targetId, port = 'main') {
    this.id = id;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.sourcePort = port;
  }

  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      sourcePort: this.sourcePort
    };
  }
}
