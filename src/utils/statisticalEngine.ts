import {
  DescriptiveStats,
  KMeansConfig,
  ClusteringAlgorithmConfig,
  ClusteringAlgorithmType,
  AlgorithmBenchmarkResult,
  PCAResult,
  ScalingMethod,
  ROIScenario,
  ClusterBusinessROI
} from '../types';

/**
 * Calculates complete descriptive statistics for a series of numbers.
 */
export function calculateDescriptiveStats(colName: string, rawValues: any[]): DescriptiveStats {
  const nums = rawValues
    .map(v => (typeof v === 'number' ? v : parseFloat(v)))
    .filter(v => !isNaN(v) && isFinite(v))
    .sort((a, b) => a - b);

  const n = nums.length;
  if (n === 0) {
    return {
      column: colName,
      count: 0,
      mean: 0,
      std: 0,
      median: 0,
      min: 0,
      max: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      skewness: 0,
      kurtosis: 0,
      cv: 0,
      uniqueCount: 0,
    };
  }

  const sum = nums.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Variance & Standard Deviation (sample variance with n-1)
  const sqDiffs = nums.map(v => Math.pow(v - mean, 2));
  const variance = n > 1 ? sqDiffs.reduce((a, b) => a + b, 0) / (n - 1) : 0;
  const std = Math.sqrt(variance);

  // Percentiles
  const getPercentile = (p: number) => {
    const idx = (n - 1) * p;
    const lower = Math.floor(idx);
    const fraction = idx - lower;
    if (lower + 1 < n) {
      return nums[lower] + fraction * (nums[lower + 1] - nums[lower]);
    }
    return nums[lower];
  };

  const min = nums[0];
  const max = nums[n - 1];
  const median = getPercentile(0.5);
  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  // Skewness (Fisher-Pearson standardized third moment)
  let skewness = 0;
  let kurtosis = 0;
  if (std > 0 && n > 2) {
    const m3 = nums.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0);
    skewness = (n / ((n - 1) * (n - 2))) * m3;

    if (n > 3) {
      const m4 = nums.reduce((acc, v) => acc + Math.pow((v - mean) / std, 4), 0);
      kurtosis = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * m4 - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    }
  }

  const cv = mean !== 0 ? (std / Math.abs(mean)) * 100 : 0;
  const uniqueCount = new Set(nums).size;

  return {
    column: colName,
    count: n,
    mean: Number(mean.toFixed(3)),
    std: Number(std.toFixed(3)),
    median: Number(median.toFixed(3)),
    min: Number(min.toFixed(3)),
    max: Number(max.toFixed(3)),
    q1: Number(q1.toFixed(3)),
    q3: Number(q3.toFixed(3)),
    iqr: Number(iqr.toFixed(3)),
    skewness: Number(skewness.toFixed(3)),
    kurtosis: Number(kurtosis.toFixed(3)),
    cv: Number(cv.toFixed(2)),
    uniqueCount,
  };
}

/**
 * Normal PDF formula: 1 / (std * sqrt(2 * pi)) * exp(-0.5 * ((x - mean)/std)^2)
 */
export function normalPDF(x: number, mean: number, std: number): number {
  if (std <= 0) return 0;
  const exponent = -0.5 * Math.pow((x - mean) / std, 2);
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
}

/**
 * Computes histogram bins and overlays theoretical normal curve.
 */
export function computeHistogramData(values: number[], numBins = 10) {
  const clean = values.filter(v => !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
  if (clean.length === 0) return { bins: [], normalCurve: [], min: 0, max: 0, binWidth: 0 };

  const min = clean[0];
  const max = clean[clean.length - 1];
  const range = max - min;
  const binWidth = range === 0 ? 1 : range / numBins;

  const sum = clean.reduce((a, b) => a + b, 0);
  const mean = sum / clean.length;
  const std = Math.sqrt(clean.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(1, clean.length - 1));

  const bins: { label: string; min: number; max: number; count: number; relativeDensity: number }[] = [];
  for (let i = 0; i < numBins; i++) {
    const bMin = min + i * binWidth;
    const bMax = i === numBins - 1 ? max + 0.0001 : min + (i + 1) * binWidth;
    bins.push({
      label: `${bMin.toFixed(1)} - ${bMax.toFixed(1)}`,
      min: bMin,
      max: bMax,
      count: 0,
      relativeDensity: 0,
    });
  }

  clean.forEach(val => {
    for (let i = 0; i < numBins; i++) {
      if (val >= bins[i].min && val < bins[i].max) {
        bins[i].count++;
        break;
      }
    }
  });

  const total = clean.length;
  bins.forEach(b => {
    b.relativeDensity = total > 0 ? (b.count / total) / binWidth : 0;
  });

  // Calculate theoretical normal curve samples
  const normalCurve: { x: number; density: number }[] = [];
  const steps = 30;
  const stepSize = range === 0 ? 1 : range / steps;
  for (let i = 0; i <= steps; i++) {
    const xVal = min + i * stepSize;
    normalCurve.push({
      x: Number(xVal.toFixed(2)),
      density: Number(normalPDF(xVal, mean, std).toFixed(5)),
    });
  }

  return { bins, normalCurve, min, max, binWidth, mean, std };
}

/**
 * Computes Pearson correlation matrix between all numeric features.
 */
export function computeCorrelationMatrix(data: Record<string, number>[], features: string[]) {
  const matrix: number[][] = [];
  const n = data.length;

  // Precompute means and standard deviations
  const stats = features.map(feat => {
    const vals = data.map(d => d[feat] ?? 0);
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(1, n - 1));
    return { feat, vals, mean, std };
  });

  for (let i = 0; i < features.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < features.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        const s1 = stats[i];
        const s2 = stats[j];
        if (s1.std === 0 || s2.std === 0) {
          matrix[i][j] = 0;
        } else {
          let cov = 0;
          for (let k = 0; k < n; k++) {
            cov += (s1.vals[k] - s1.mean) * (s2.vals[k] - s2.mean);
          }
          const r = cov / ((n - 1) * s1.std * s2.std);
          matrix[i][j] = Number(Math.max(-1, Math.min(1, r)).toFixed(3));
        }
      }
    }
  }

  return { features, matrix };
}

/**
 * Feature scaling transformations: Z-Score, Min-Max, Robust.
 */
export function applyFeatureScaling(
  matrix: number[][],
  features: string[],
  method: ScalingMethod
): { scaledMatrix: number[][]; params: Record<string, { center: number; scale: number }> } {
  const numRows = matrix.length;
  const numCols = features.length;
  const scaledMatrix: number[][] = Array.from({ length: numRows }, () => new Array(numCols).fill(0));
  const params: Record<string, { center: number; scale: number }> = {};

  for (let c = 0; c < numCols; c++) {
    const colVals = matrix.map(row => row[c]);
    const sorted = [...colVals].sort((a, b) => a - b);
    const feat = features[c];

    let center = 0;
    let scale = 1;

    if (method === 'zscore') {
      const mean = colVals.reduce((a, b) => a + b, 0) / Math.max(1, numRows);
      const variance = colVals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(1, numRows - 1);
      const std = Math.sqrt(variance);
      center = mean;
      scale = std === 0 ? 1 : std;
    } else if (method === 'minmax') {
      const min = sorted[0] ?? 0;
      const max = sorted[sorted.length - 1] ?? 1;
      center = min;
      scale = max - min === 0 ? 1 : max - min;
    } else if (method === 'robust') {
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
      const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 1;
      const iqr = q3 - q1;
      center = median;
      scale = iqr === 0 ? 1 : iqr;
    }

    params[feat] = { center, scale };

    for (let r = 0; r < numRows; r++) {
      scaledMatrix[r][c] = (matrix[r][c] - center) / scale;
    }
  }

  return { scaledMatrix, params };
}

/**
 * Inverts the scaling formula to return original natural units.
 */
export function inverseTransformValue(val: number, center: number, scale: number): number {
  return val * scale + center;
}

/**
 * Euclidean distance squared between two vectors.
 */
function distSq(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

/**
 * Euclidean distance.
 */
export function euclideanDist(a: number[], b: number[]): number {
  return Math.sqrt(distSq(a, b));
}

/**
 * Manhattan (L1) distance.
 */
export function manhattanDist(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

/**
 * Seeded pseudo-random generator for reproducibility.
 */
function createSeededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Robust K-Means++ algorithm implementation.
 */
export function runKMeansClustering(
  data: number[][],
  config: KMeansConfig
): {
  centroids: number[][];
  assignments: number[];
  inertia: number;
} {
  const { k, initMethod, nInit, maxIter, randomSeed } = config;
  const n = data.length;
  const numFeatures = data[0].length;

  if (n === 0 || k <= 0 || k > n) {
    throw new Error('Configuración inválida para K-Means');
  }

  let bestInertia = Infinity;
  let bestCentroids: number[][] = [];
  let bestAssignments: number[] = new Array(n).fill(0);

  const rng = createSeededRandom(randomSeed);

  // Run nInit restarts and pick solution with minimum inertia (WCSS)
  for (let init = 0; init < nInit; init++) {
    let centroids: number[][] = [];

    if (initMethod === 'k-means++') {
      // 1. Choose first center uniformly at random
      const firstIdx = Math.floor(rng() * n);
      centroids.push([...data[firstIdx]]);

      // 2. Choose remaining centers with probability proportional to D(x)^2
      while (centroids.length < k) {
        const distances: number[] = [];
        let sumDistSq = 0;

        for (let i = 0; i < n; i++) {
          let minDistSq = Infinity;
          for (const c of centroids) {
            const d = distSq(data[i], c);
            if (d < minDistSq) minDistSq = d;
          }
          distances.push(minDistSq);
          sumDistSq += minDistSq;
        }

        const target = rng() * sumDistSq;
        let cumulative = 0;
        let chosenIdx = 0;
        for (let i = 0; i < n; i++) {
          cumulative += distances[i];
          if (cumulative >= target) {
            chosenIdx = i;
            break;
          }
        }
        centroids.push([...data[chosenIdx]]);
      }
    } else {
      // Random centroid initialization
      const indices = new Set<number>();
      while (indices.size < k) {
        indices.add(Math.floor(rng() * n));
      }
      centroids = Array.from(indices).map(idx => [...data[idx]]);
    }

    // Iterative Lloyd algorithm
    let assignments = new Array(n).fill(0);
    let iter = 0;
    let converged = false;

    while (iter < maxIter && !converged) {
      converged = true;

      // Assignment step
      for (let i = 0; i < n; i++) {
        let bestDist = Infinity;
        let bestCluster = 0;
        for (let c = 0; c < k; c++) {
          const d = distSq(data[i], centroids[c]);
          if (d < bestDist) {
            bestDist = d;
            bestCluster = c;
          }
        }
        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          converged = false;
        }
      }

      // Update step (mean of points in cluster)
      const counts = new Array(k).fill(0);
      const sums: number[][] = Array.from({ length: k }, () => new Array(numFeatures).fill(0));

      for (let i = 0; i < n; i++) {
        const c = assignments[i];
        counts[c]++;
        for (let f = 0; f < numFeatures; f++) {
          sums[c][f] += data[i][f];
        }
      }

      for (let c = 0; c < k; c++) {
        if (counts[c] > 0) {
          for (let f = 0; f < numFeatures; f++) {
            centroids[c][f] = sums[c][f] / counts[c];
          }
        } else {
          // Empty cluster fallback: pick random point
          const randIdx = Math.floor(rng() * n);
          centroids[c] = [...data[randIdx]];
        }
      }

      iter++;
    }

    // Calculate inertia (Within-Cluster Sum of Squares)
    let currentInertia = 0;
    for (let i = 0; i < n; i++) {
      currentInertia += distSq(data[i], centroids[assignments[i]]);
    }

    if (currentInertia < bestInertia) {
      bestInertia = currentInertia;
      bestCentroids = centroids.map(c => [...c]);
      bestAssignments = [...assignments];
    }
  }

  return {
    centroids: bestCentroids,
    assignments: bestAssignments,
    inertia: Number(bestInertia.toFixed(3)),
  };
}

/**
 * Robust K-Medoids algorithm (PAM - Partitioning Around Medoids).
 * Unlike K-Means which uses virtual arithmetic means (sensitive to outliers),
 * K-Medoids chooses actual exemplar observations from the dataset as centers,
 * and minimizes L1 (Manhattan) or L2 distance, making it inherently resistant to extreme outliers.
 */
export function runKMedoidsClustering(
  data: number[][],
  config: {
    k: number;
    metric?: 'euclidean' | 'manhattan';
    maxIter?: number;
    randomSeed?: number;
  }
): {
  centroids: number[][];
  assignments: number[];
  inertia: number;
  medoidIndices: number[];
} {
  const { k, metric = 'manhattan', maxIter = 100, randomSeed = 42 } = config;
  const n = data.length;

  if (n === 0 || k <= 0 || k > n) {
    throw new Error('Configuración inválida para K-Medoids');
  }

  const distFn = metric === 'manhattan' ? manhattanDist : euclideanDist;
  const rng = createSeededRandom(randomSeed);

  // 1. Initialize medoids using k-medoids++ initialization
  const medoidIndices: number[] = [];
  const firstIdx = Math.floor(rng() * n);
  medoidIndices.push(firstIdx);

  while (medoidIndices.length < k) {
    const distances: number[] = [];
    let sumDist = 0;

    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      for (const mIdx of medoidIndices) {
        const d = distFn(data[i], data[mIdx]);
        if (d < minDist) minDist = d;
      }
      distances.push(minDist);
      sumDist += minDist;
    }

    const target = rng() * sumDist;
    let cum = 0;
    let chosenIdx = 0;
    for (let i = 0; i < n; i++) {
      cum += distances[i];
      if (cum >= target) {
        chosenIdx = i;
        break;
      }
    }
    if (!medoidIndices.includes(chosenIdx)) {
      medoidIndices.push(chosenIdx);
    } else {
      for (let i = 0; i < n; i++) {
        if (!medoidIndices.includes(i)) {
          medoidIndices.push(i);
          break;
        }
      }
    }
  }

  let assignments = new Array(n).fill(0);
  let iter = 0;
  let changed = true;

  while (iter < maxIter && changed) {
    changed = false;

    // Step A: Assign each point to the closest medoid
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        const d = distFn(data[i], data[medoidIndices[c]]);
        if (d < minDist) {
          minDist = d;
          bestCluster = c;
        }
      }
      assignments[i] = bestCluster;
    }

    // Step B: For each cluster, select the exemplar point that minimizes sum of distances to other cluster members
    for (let c = 0; c < k; c++) {
      const clusterMembers: number[] = [];
      for (let i = 0; i < n; i++) {
        if (assignments[i] === c) {
          clusterMembers.push(i);
        }
      }

      if (clusterMembers.length === 0) continue;

      let bestCandidate = medoidIndices[c];
      let minTotalDist = Infinity;

      for (const candidateIdx of clusterMembers) {
        let totalDist = 0;
        for (const memberIdx of clusterMembers) {
          totalDist += distFn(data[candidateIdx], data[memberIdx]);
        }
        if (totalDist < minTotalDist) {
          minTotalDist = totalDist;
          bestCandidate = candidateIdx;
        }
      }

      if (bestCandidate !== medoidIndices[c]) {
        medoidIndices[c] = bestCandidate;
        changed = true;
      }
    }

    iter++;
  }

  // Calculate inertia as Euclidean WCSS to medoids for standardized comparison
  let totalInertia = 0;
  for (let i = 0; i < n; i++) {
    totalInertia += distSq(data[i], data[medoidIndices[assignments[i]]]);
  }

  const centroids = medoidIndices.map(idx => [...data[idx]]);

  return {
    centroids,
    assignments,
    inertia: Number(totalInertia.toFixed(3)),
    medoidIndices,
  };
}

/**
 * Agglomerative Hierarchical Clustering.
 * Builds a deterministic cluster hierarchy.
 * Supports Ward's linkage (variance minimization), Complete linkage (max distance),
 * Average linkage (mean pairwise distance), and Single linkage.
 */
export function runHierarchicalClustering(
  data: number[][],
  config: {
    k: number;
    linkage?: 'ward' | 'complete' | 'average' | 'single';
  }
): {
  centroids: number[][];
  assignments: number[];
  inertia: number;
} {
  const { k, linkage = 'ward' } = config;
  const n = data.length;
  const numFeatures = data[0].length;

  if (n === 0 || k <= 0 || k > n) {
    throw new Error('Configuración inválida para Clustering Jerárquico');
  }

  // Initialize: each sample is in its own cluster
  let clusters: number[][] = Array.from({ length: n }, (_, i) => [i]);

  // Precompute pairwise distances between all samples
  const sampleDist = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = euclideanDist(data[i], data[j]);
      sampleDist[i][j] = d;
      sampleDist[j][i] = d;
    }
  }

  const computeClusterCentroid = (members: number[]) => {
    const c = new Array(numFeatures).fill(0);
    for (const idx of members) {
      for (let f = 0; f < numFeatures; f++) {
        c[f] += data[idx][f];
      }
    }
    for (let f = 0; f < numFeatures; f++) {
      c[f] /= members.length;
    }
    return c;
  };

  const getClusterDistance = (aMembers: number[], bMembers: number[]) => {
    if (linkage === 'ward') {
      const nA = aMembers.length;
      const nB = bMembers.length;
      const cA = computeClusterCentroid(aMembers);
      const cB = computeClusterCentroid(bMembers);
      let d2 = 0;
      for (let f = 0; f < numFeatures; f++) {
        const diff = cA[f] - cB[f];
        d2 += diff * diff;
      }
      return ((nA * nB) / (nA + nB)) * d2;
    } else if (linkage === 'complete') {
      let maxD = -Infinity;
      for (const i of aMembers) {
        for (const j of bMembers) {
          const d = sampleDist[i][j];
          if (d > maxD) maxD = d;
        }
      }
      return maxD;
    } else if (linkage === 'single') {
      let minD = Infinity;
      for (const i of aMembers) {
        for (const j of bMembers) {
          const d = sampleDist[i][j];
          if (d < minD) minD = d;
        }
      }
      return minD;
    } else {
      let sumD = 0;
      for (const i of aMembers) {
        for (const j of bMembers) {
          sumD += sampleDist[i][j];
        }
      }
      return sumD / (aMembers.length * bMembers.length);
    }
  };

  // Iteratively merge until k clusters remain
  while (clusters.length > k) {
    let bestDist = Infinity;
    let mergeI = 0;
    let mergeJ = 1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = getClusterDistance(clusters[i], clusters[j]);
        if (d < bestDist) {
          bestDist = d;
          mergeI = i;
          mergeJ = j;
        }
      }
    }

    const merged = [...clusters[mergeI], ...clusters[mergeJ]];
    clusters = clusters.filter((_, idx) => idx !== mergeI && idx !== mergeJ);
    clusters.push(merged);
  }

  // Sort clusters by size descending for consistency
  clusters.sort((a, b) => b.length - a.length);

  // Compute final assignments
  const assignments = new Array(n).fill(0);
  for (let c = 0; c < clusters.length; c++) {
    for (const idx of clusters[c]) {
      assignments[idx] = c;
    }
  }

  const centroids = clusters.map(members => computeClusterCentroid(members));

  let totalInertia = 0;
  for (let i = 0; i < n; i++) {
    totalInertia += distSq(data[i], centroids[assignments[i]]);
  }

  return {
    centroids,
    assignments,
    inertia: Number(totalInertia.toFixed(3)),
  };
}

/**
 * Unified executor for any supported clustering algorithm.
 */
export function runUnifiedClustering(
  data: number[][],
  config: ClusteringAlgorithmConfig
): {
  centroids: number[][];
  assignments: number[];
  inertia: number;
  medoidIndices?: number[];
  algorithmName: string;
} {
  if (config.algorithm === 'kmedoids') {
    const res = runKMedoidsClustering(data, {
      k: config.k,
      metric: config.kmedoidsMetric || 'manhattan',
      maxIter: config.maxIter || 100,
      randomSeed: config.randomSeed || 42,
    });
    return {
      ...res,
      algorithmName: `K-Medoids (PAM ${config.kmedoidsMetric === 'manhattan' ? 'L1 Manhattan' : 'L2 Euclidiana'})`,
    };
  } else if (config.algorithm === 'hierarchical') {
    const res = runHierarchicalClustering(data, {
      k: config.k,
      linkage: config.hierarchicalLinkage || 'ward',
    });
    return {
      ...res,
      algorithmName: `Clustering Jerárquico Aglomerativo (Enlace ${config.hierarchicalLinkage?.toUpperCase() || 'WARD'})`,
    };
  } else {
    const res = runKMeansClustering(data, {
      k: config.k,
      initMethod: config.initMethod || 'k-means++',
      nInit: config.nInit || 8,
      maxIter: config.maxIter || 100,
      randomSeed: config.randomSeed || 42,
    });
    return {
      ...res,
      algorithmName: `K-Means (${config.initMethod || 'k-means++'} Euclidiano)`,
    };
  }
}

/**
 * Runs comparative benchmark of all 3 algorithms for the same dataset and k.
 */
export function runAlgorithmComparison(
  data: number[][],
  k: number,
  randomSeed = 42
): AlgorithmBenchmarkResult[] {
  const total = data.length;

  // 1. K-Means
  const kmRes = runKMeansClustering(data, {
    k,
    initMethod: 'k-means++',
    nInit: 6,
    maxIter: 100,
    randomSeed,
  });
  const kmSil = calculateSilhouetteScores(data, kmRes.assignments, k);
  const kmSizes = new Array(k).fill(0);
  kmRes.assignments.forEach(c => kmSizes[c]++);
  const kmPcts = kmSizes.map(s => Number(((s / total) * 100).toFixed(1)));

  // 2. K-Medoids (PAM Manhattan)
  const medRes = runKMedoidsClustering(data, {
    k,
    metric: 'manhattan',
    maxIter: 80,
    randomSeed,
  });
  const medSil = calculateSilhouetteScores(data, medRes.assignments, k);
  const medSizes = new Array(k).fill(0);
  medRes.assignments.forEach(c => medSizes[c]++);
  const medPcts = medSizes.map(s => Number(((s / total) * 100).toFixed(1)));

  // 3. Hierarchical (Ward)
  const hRes = runHierarchicalClustering(data, {
    k,
    linkage: 'ward',
  });
  const hSil = calculateSilhouetteScores(data, hRes.assignments, k);
  const hSizes = new Array(k).fill(0);
  hRes.assignments.forEach(c => hSizes[c]++);
  const hPcts = hSizes.map(s => Number(((s / total) * 100).toFixed(1)));

  return [
    {
      algorithm: 'kmeans',
      name: 'K-Means (k-means++)',
      globalSilhouette: kmSil.globalSilhouette,
      clusterSilhouettes: kmSil.clusterSilhouettes,
      inertiaOrCost: kmRes.inertia,
      outlierRobustness: 'Baja',
      clusterSizes: kmSizes,
      clusterPercentages: kmPcts,
      description: 'Estándar rápido y eficiente para clusters esféricos convexos. Sensible a valores atípicos extremos que distorsionan las medias cuadráticas.',
    },
    {
      algorithm: 'kmedoids',
      name: 'K-Medoids (PAM Manhattan)',
      globalSilhouette: medSil.globalSilhouette,
      clusterSilhouettes: medSil.clusterSilhouettes,
      inertiaOrCost: medRes.inertia,
      outlierRobustness: 'Alta',
      clusterSizes: medSizes,
      clusterPercentages: medPcts,
      description: 'Máxima robustez ante outliers. Los centros son observaciones reales del dataset (medoides) y minimiza la distancia absoluta L1 (Manhattan).',
    },
    {
      algorithm: 'hierarchical',
      name: 'Clustering Jerárquico (Ward)',
      globalSilhouette: hSil.globalSilhouette,
      clusterSilhouettes: hSil.clusterSilhouettes,
      inertiaOrCost: hRes.inertia,
      outlierRobustness: 'Media',
      clusterSizes: hSizes,
      clusterPercentages: hPcts,
      description: 'Aglomeración ascendente determinista que minimiza el incremento de varianza intra-clúster. Sin dependencia de semillas estocásticas.',
    },
  ];
}

/**
 * Computes silhouette coefficients:
 * s(i) = (b(i) - a(i)) / max(a(i), b(i))
 * Rousseeuw, P. J. (1987)
 */
export function calculateSilhouetteScores(
  data: number[][],
  assignments: number[],
  k: number
): { globalSilhouette: number; clusterSilhouettes: number[] } {
  const n = data.length;
  if (k <= 1 || n <= k) {
    return { globalSilhouette: 0, clusterSilhouettes: new Array(k).fill(0) };
  }

  const clusterIndices: number[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) {
    clusterIndices[assignments[i]].push(i);
  }

  // Precompute distances or compute on-the-fly
  const sampleSilhouettes: number[] = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    const ownCluster = assignments[i];
    const ownClusterMembers = clusterIndices[ownCluster];

    // a(i): mean intra-cluster distance
    let a_i = 0;
    if (ownClusterMembers.length > 1) {
      let sumDist = 0;
      for (const idx of ownClusterMembers) {
        if (idx !== i) {
          sumDist += euclideanDist(data[i], data[idx]);
        }
      }
      a_i = sumDist / (ownClusterMembers.length - 1);
    }

    // b(i): minimum mean distance to any other cluster
    let b_i = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === ownCluster) continue;
      const otherMembers = clusterIndices[c];
      if (otherMembers.length === 0) continue;
      let sumDist = 0;
      for (const idx of otherMembers) {
        sumDist += euclideanDist(data[i], data[idx]);
      }
      const meanDist = sumDist / otherMembers.length;
      if (meanDist < b_i) {
        b_i = meanDist;
      }
    }

    if (b_i === Infinity) b_i = 0;

    const maxDenom = Math.max(a_i, b_i);
    sampleSilhouettes[i] = maxDenom === 0 ? 0 : (b_i - a_i) / maxDenom;
  }

  const globalSilhouette = sampleSilhouettes.reduce((a, b) => a + b, 0) / n;

  const clusterSilhouettes: number[] = [];
  for (let c = 0; c < k; c++) {
    const members = clusterIndices[c];
    if (members.length === 0) {
      clusterSilhouettes.push(0);
    } else {
      const avg = members.reduce((acc, idx) => acc + sampleSilhouettes[idx], 0) / members.length;
      clusterSilhouettes.push(Number(avg.toFixed(3)));
    }
  }

  return {
    globalSilhouette: Number(globalSilhouette.toFixed(3)),
    clusterSilhouettes,
  };
}

/**
 * Computes Elbow and Silhouette progression for k in [2, maxK].
 */
export function evaluateElbowAndSilhouette(
  data: number[][],
  minK = 2,
  maxK = 8,
  seed = 42
): { k: number; inertia: number; silhouette: number }[] {
  const results: { k: number; inertia: number; silhouette: number }[] = [];
  const maxLimit = Math.min(maxK, data.length - 1);

  for (let k = minK; k <= maxLimit; k++) {
    const km = runKMeansClustering(data, {
      k,
      initMethod: 'k-means++',
      nInit: 5,
      maxIter: 100,
      randomSeed: seed + k,
    });

    const sil = calculateSilhouetteScores(data, km.assignments, k);

    results.push({
      k,
      inertia: km.inertia,
      silhouette: sil.globalSilhouette,
    });
  }

  return results;
}

/**
 * Computes 2D Principal Component Analysis (PCA) projection.
 * Projects multidimensional points & centroids to the 2 leading eigenvectors.
 */
export function computePCA2D(
  data: number[][],
  assignments: number[],
  centroids: number[][],
  rowIds?: (string | number)[]
): PCAResult {
  const n = data.length;
  const p = data[0].length;

  if (p < 2) {
    // If only 1 feature, project with y = 0
    return {
      points: data.map((d, i) => ({ x: d[0], y: 0, cluster: assignments[i], id: rowIds?.[i] })),
      centroids: centroids.map((c, idx) => ({ x: c[0], y: 0, cluster: idx })),
      explainedVarianceRatio: [1.0, 0],
    };
  }

  // 1. Center the data
  const means = new Array(p).fill(0);
  for (let j = 0; j < p; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += data[i][j];
    means[j] = sum / n;
  }

  const centered: number[][] = Array.from({ length: n }, () => new Array(p).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      centered[i][j] = data[i][j] - means[j];
    }
  }

  // 2. Covariance matrix (p x p)
  const cov: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let r = 0; r < p; r++) {
    for (let c = r; c < p; c++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += centered[i][r] * centered[i][c];
      }
      const val = sum / Math.max(1, n - 1);
      cov[r][c] = val;
      cov[c][r] = val;
    }
  }

  // 3. Power iteration to find top 2 eigenvectors & eigenvalues
  const findDominantEigen = (matrix: number[][], maxIter = 50) => {
    let vec = new Array(p).fill(0).map(() => Math.random() - 0.5);
    // normalize
    let norm = Math.sqrt(vec.reduce((a, b) => a + b * b, 0));
    vec = vec.map(v => v / (norm || 1));

    let eigenvalue = 0;
    for (let it = 0; it < maxIter; it++) {
      const nextVec = new Array(p).fill(0);
      for (let r = 0; r < p; r++) {
        for (let c = 0; c < p; c++) {
          nextVec[r] += matrix[r][c] * vec[c];
        }
      }
      norm = Math.sqrt(nextVec.reduce((a, b) => a + b * b, 0));
      eigenvalue = norm;
      if (norm === 0) break;
      vec = nextVec.map(v => v / norm);
    }

    return { vec, eigenvalue };
  };

  const e1 = findDominantEigen(cov);

  // Deflate matrix to find second principal component
  const covDeflated: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let r = 0; r < p; r++) {
    for (let c = 0; c < p; c++) {
      covDeflated[r][c] = cov[r][c] - e1.eigenvalue * e1.vec[r] * e1.vec[c];
    }
  }
  const e2 = findDominantEigen(covDeflated);

  // Calculate total variance (trace of covariance matrix)
  let totalVar = 0;
  for (let i = 0; i < p; i++) totalVar += cov[i][i];
  if (totalVar === 0) totalVar = 1;

  const ev1 = Math.min(1, Math.max(0, e1.eigenvalue / totalVar));
  const ev2 = Math.min(1, Math.max(0, e2.eigenvalue / totalVar));

  // 4. Project points onto e1 and e2
  const points = centered.map((row, i) => {
    let x = 0;
    let y = 0;
    for (let j = 0; j < p; j++) {
      x += row[j] * e1.vec[j];
      y += row[j] * e2.vec[j];
    }
    return {
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      cluster: assignments[i],
      id: rowIds?.[i],
    };
  });

  // Project centroids
  const projectedCentroids = centroids.map((cRow, idx) => {
    let x = 0;
    let y = 0;
    for (let j = 0; j < p; j++) {
      const diff = cRow[j] - means[j];
      x += diff * e1.vec[j];
      y += diff * e2.vec[j];
    }
    return {
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      cluster: idx,
    };
  });

  return {
    points,
    centroids: projectedCentroids,
    explainedVarianceRatio: [Number(ev1.toFixed(3)), Number(ev2.toFixed(3))],
  };
}

/**
 * Computes ANOVA F-statistic between clusters to rank features by discriminative power.
 */
export function computeFeatureImportance(
  originalRows: Record<string, number>[],
  assignments: number[],
  features: string[],
  k: number
): { feature: string; fScore: number; pValueApprox: string }[] {
  const n = originalRows.length;
  if (n <= k || k <= 1) return features.map(f => ({ feature: f, fScore: 0, pValueApprox: '> 0.05' }));

  const clusterSizes = new Array(k).fill(0);
  assignments.forEach(c => clusterSizes[c]++);

  const results = features.map(feat => {
    const allVals = originalRows.map(r => r[feat] ?? 0);
    const globalMean = allVals.reduce((a, b) => a + b, 0) / n;

    // Between-cluster sum of squares (SSB)
    let ssb = 0;
    // Within-cluster sum of squares (SSW)
    let ssw = 0;

    for (let c = 0; c < k; c++) {
      const cMembers = allVals.filter((_, idx) => assignments[idx] === c);
      if (cMembers.length === 0) continue;
      const cMean = cMembers.reduce((a, b) => a + b, 0) / cMembers.length;

      ssb += cMembers.length * Math.pow(cMean - globalMean, 2);
      for (const val of cMembers) {
        ssw += Math.pow(val - cMean, 2);
      }
    }

    const dfBetween = k - 1;
    const dfWithin = n - k;
    const msb = dfBetween > 0 ? ssb / dfBetween : 0;
    const msw = dfWithin > 0 ? ssw / dfWithin : 1;
    const fScore = msw > 0 ? msb / msw : 0;

    return {
      feature: feat,
      fScore: Number(fScore.toFixed(2)),
      pValueApprox: fScore > 3.0 ? '< 0.01' : fScore > 1.5 ? '< 0.05' : '> 0.05',
    };
  });

  return results.sort((a, b) => b.fScore - a.fScore);
}

/**
 * Calculates ROI model with 3 risk-adjusted scenarios.
 * Formula: ROI = ((Beneficios incrementales - Costos incrementales) / Costos incrementales) * 100
 */
export function buildROIScenarios(
  targetPopulation: number,
  investmentPerCustomer: number,
  incrementalSpendPerCustomer: number,
  margin: number, // 0 to 1
  horizonMonths: number
): {
  conservador: ROIScenario;
  base: ROIScenario;
  optimista: ROIScenario;
} {
  const calcScenario = (name: string, costMult: number, revMult: number): ROIScenario => {
    const inv = targetPopulation * investmentPerCustomer * costMult;
    const opCosts = inv * 0.15 * (horizonMonths / 12);
    const totalCosts = inv + opCosts;

    const grossRevenue = targetPopulation * incrementalSpendPerCustomer * (horizonMonths / 12) * revMult;
    const grossMarginRevenue = grossRevenue * margin;
    const netBenefits = grossMarginRevenue - opCosts;

    const incrementalNetProfit = grossMarginRevenue - totalCosts;
    const roi = totalCosts > 0 ? (incrementalNetProfit / totalCosts) * 100 : 0;
    const payback = roi > 0 ? (totalCosts / (grossMarginRevenue / horizonMonths)) : horizonMonths * 2;

    return {
      name,
      initialInvestment: Math.round(inv),
      incrementalOperatingCosts: Math.round(opCosts),
      incrementalGrossRevenue: Math.round(grossRevenue),
      contributionMarginPercent: Math.round(margin * 100),
      incrementalNetBenefits: Math.round(grossMarginRevenue),
      roiPercent: Number(roi.toFixed(1)),
      paybackMonths: Number(Math.min(horizonMonths * 2, Math.max(1, payback)).toFixed(1)),
    };
  };

  return {
    conservador: calcScenario('Conservador', 1.15, 0.75),
    base: calcScenario('Base', 1.0, 1.0),
    optimista: calcScenario('Optimista', 0.9, 1.35),
  };
}
