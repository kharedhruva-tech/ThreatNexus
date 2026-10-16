import { GraphData, GraphEntity, GraphRelationship, GraphFilter } from '../types/graph';
import { INITIAL_GRAPH_DATA, DEMO_ENTITIES, DEMO_RELATIONSHIPS } from '../demo/graphData';

export interface IGraphService {
  getGraphData(): Promise<GraphData>;
  getEntityById(id: string): Promise<GraphEntity | null>;
  getRelationshipsForEntity(id: string): Promise<GraphRelationship[]>;
  searchEntities(filter: GraphFilter): Promise<GraphEntity[]>;
  findPathBetweenEntities(sourceId: string, targetId: string): Promise<string[]>;
}

class MockGraphService implements IGraphService {
  private data: GraphData = INITIAL_GRAPH_DATA;

  async getGraphData(): Promise<GraphData> {
    return Promise.resolve({ ...this.data });
  }

  async getEntityById(id: string): Promise<GraphEntity | null> {
    const entity = this.data.nodes.find((n) => n.id.toLowerCase() === id.toLowerCase() || n.name.toLowerCase() === id.toLowerCase());
    return Promise.resolve(entity || null);
  }

  async getRelationshipsForEntity(id: string): Promise<GraphRelationship[]> {
    const relationships = this.data.edges.filter(
      (e) => e.sourceId.toLowerCase() === id.toLowerCase() || e.targetId.toLowerCase() === id.toLowerCase()
    );
    return Promise.resolve(relationships);
  }

  async searchEntities(filter: GraphFilter): Promise<GraphEntity[]> {
    let result = [...this.data.nodes];

    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.id.toLowerCase().includes(q) ||
          n.name.toLowerCase().includes(q) ||
          n.label.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filter.selectedTypes && filter.selectedTypes.length > 0) {
      result = result.filter((n) => filter.selectedTypes.includes(n.type));
    }

    if (filter.riskLevels && filter.riskLevels.length > 0) {
      result = result.filter((n) => filter.riskLevels.includes(n.riskLevel));
    }

    return Promise.resolve(result);
  }

  async findPathBetweenEntities(sourceId: string, targetId: string): Promise<string[]> {
    // Deterministic predefined path for E-101 to E-102
    if (
      (sourceId === 'E-101' && targetId === 'E-102') ||
      (sourceId === 'E-102' && targetId === 'E-101')
    ) {
      return Promise.resolve(['E-104', 'E-103', 'E-101', 'E-105', 'E-102']);
    }

    // Simple BFS for other synthetic nodes
    const queue: string[][] = [[sourceId]];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (current === targetId) {
        return Promise.resolve(path);
      }

      const neighbors = this.data.edges
        .filter((e) => e.sourceId === current || e.targetId === current)
        .map((e) => (e.sourceId === current ? e.targetId : e.sourceId));

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return Promise.resolve([]);
  }
}

export const graphService = new MockGraphService();
