// High-Performance Multivariate Isolation Forest (iForest)
// Implements Liu, Ting & Zhou (2008) standard unsupervised isolation forest algorithm.

export interface IsolationForestConfig {
  numTrees: number;
  subsampleSize: number;
  maxDepth: number;
}

export interface IsolationTreeNode {
  isLeaf: boolean;
  size?: number;
  splitFeature?: number;
  splitValue?: number;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
}

// Average path length of unsuccessful search in BST
function c(n: number): number {
  if (n <= 1) return 1;
  if (n === 2) return 1;
  const euler = 0.5772156649;
  return 2 * (Math.log(n - 1) + euler) - (2 * (n - 1)) / n;
}

export class IsolationForest {
  private trees: IsolationTreeNode[] = [];
  private subsampleSize: number;
  private numTrees: number;
  private maxDepth: number;
  private featureNames: string[];

  constructor(
    featureNames: string[],
    config: Partial<IsolationForestConfig> = {}
  ) {
    this.featureNames = featureNames;
    this.numTrees = config.numTrees || 60;
    this.subsampleSize = config.subsampleSize || 256;
    this.maxDepth = config.maxDepth || Math.ceil(Math.log2(this.subsampleSize));
  }

  public fit(data: number[][]): void {
    if (data.length === 0) return;
    this.trees = [];

    const actualSubsample = Math.min(this.subsampleSize, data.length);

    for (let t = 0; t < this.numTrees; t++) {
      // Subsample randomly without replacement
      const sampleIndices = new Set<number>();
      while (sampleIndices.size < actualSubsample) {
        sampleIndices.add(Math.floor(Math.random() * data.length));
      }
      const sample = Array.from(sampleIndices).map(idx => data[idx]);

      const tree = this.buildTree(sample, 0);
      this.trees.push(tree);
    }
  }

  private buildTree(sample: number[][], currentDepth: number): IsolationTreeNode {
    if (sample.length <= 1 || currentDepth >= this.maxDepth) {
      return { isLeaf: true, size: sample.length };
    }

    const numFeatures = sample[0].length;
    // Pick random feature that has variation
    const featureOrder = Array.from({ length: numFeatures }, (_, i) => i).sort(() => Math.random() - 0.5);

    for (const feat of featureOrder) {
      let minVal = Infinity;
      let maxVal = -Infinity;
      for (let i = 0; i < sample.length; i++) {
        const v = sample[i][feat];
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }

      if (maxVal > minVal) {
        const splitValue = minVal + Math.random() * (maxVal - minVal);
        const left: number[][] = [];
        const right: number[][] = [];

        for (let i = 0; i < sample.length; i++) {
          if (sample[i][feat] < splitValue) {
            left.push(sample[i]);
          } else {
            right.push(sample[i]);
          }
        }

        return {
          isLeaf: false,
          splitFeature: feat,
          splitValue,
          left: this.buildTree(left, currentDepth + 1),
          right: this.buildTree(right, currentDepth + 1)
        };
      }
    }

    return { isLeaf: true, size: sample.length };
  }

  private pathLength(x: number[], node: IsolationTreeNode, currentDepth: number): number {
    if (node.isLeaf) {
      return currentDepth + c(node.size || 1);
    }

    const feat = node.splitFeature!;
    const val = x[feat];

    if (val < node.splitValue!) {
      return this.pathLength(x, node.left!, currentDepth + 1);
    } else {
      return this.pathLength(x, node.right!, currentDepth + 1);
    }
  }

  // Predict anomaly score between 0.0 (normal) and 1.0 (extreme anomaly)
  public score(x: number[]): number {
    if (this.trees.length === 0) return 0.2;

    let totalPath = 0;
    for (let i = 0; i < this.trees.length; i++) {
      totalPath += this.pathLength(x, this.trees[i], 0);
    }

    const avgPath = totalPath / this.trees.length;
    const norm = c(this.subsampleSize);
    // Standard isolation score equation: s = 2 ^ (-E(h(x)) / c(n))
    const s = Math.pow(2, -avgPath / norm);
    return Math.max(0, Math.min(1, Number(s.toFixed(4))));
  }
}
