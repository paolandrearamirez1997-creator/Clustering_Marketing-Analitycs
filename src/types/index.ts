/**
 * Data structures and domain types for Cluster Intelligence
 */

export type SectorEconomic = 
  | 'telecomunicaciones'
  | 'retail_ecommerce'
  | 'banca_finanzas'
  | 'b2b_saas'
  | 'salud_farmaceutica'
  | 'consumo_masivo'
  | 'logistica_transporte'
  | 'turismo_hospitalidad'
  | 'energia_utilities'
  | 'otro';

export type VariableType = 
  | 'numeric_continuous'
  | 'numeric_discrete'
  | 'categorical_nominal'
  | 'categorical_ordinal'
  | 'boolean'
  | 'date'
  | 'identifier'
  | 'free_text';

export type VariableUsageDecision = 'include' | 'exclude' | 'identifier';

export interface ColumnMetadata {
  name: string;
  detectedType: VariableType;
  confirmedType: VariableType;
  uniqueValuesCount: number;
  missingValuesCount: number;
  missingPercentage: number;
  sampleValues: (string | number | boolean)[];
  usageDecision: VariableUsageDecision;
  recommendation: string;
  ordinalOrder?: string[]; // Optional user specified ordering
}

export type ImputationMethod = 'mean' | 'median' | 'mode' | 'unknown_category' | 'drop_row';

export interface ImputationConfig {
  [columnName: string]: ImputationMethod;
}

export type ScalingMethod = 'zscore' | 'minmax' | 'robust';

export interface DescriptiveStats {
  column: string;
  count: number;
  mean: number;
  std: number;
  median: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  cv: number; // Coefficient of variation %
  uniqueCount: number;
}

export interface BusinessRule {
  id: string;
  column: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | 'between';
  val1: number;
  val2?: number;
  label: string;
  description: string;
}

export type ClusteringAlgorithmType = 'kmeans' | 'kmedoids' | 'hierarchical';

export interface KMeansConfig {
  k: number;
  initMethod: 'k-means++' | 'random';
  nInit: number;
  maxIter: number;
  randomSeed: number;
}

export interface ClusteringAlgorithmConfig {
  algorithm: ClusteringAlgorithmType;
  k: number;
  randomSeed: number;
  // K-Means specific
  initMethod: 'k-means++' | 'random';
  nInit: number;
  maxIter: number;
  // K-Medoids specific
  kmedoidsMetric: 'euclidean' | 'manhattan';
  // Hierarchical specific
  hierarchicalLinkage: 'ward' | 'complete' | 'average' | 'single';
}

export interface AlgorithmBenchmarkResult {
  algorithm: ClusteringAlgorithmType;
  name: string;
  globalSilhouette: number;
  clusterSilhouettes: number[];
  inertiaOrCost: number;
  outlierRobustness: 'Alta' | 'Media' | 'Baja';
  clusterSizes: number[];
  clusterPercentages: number[];
  description: string;
}

export interface ClusterEvaluationMetrics {
  algorithm: ClusteringAlgorithmType;
  algorithmName: string;
  k: number;
  inertia: number;
  globalSilhouette: number;
  clusterSilhouettes: number[];
  clusterSizes: number[];
  clusterPercentages: number[];
  interCentroidDistances: number[][];
  warningSmallClusters: boolean;
  medoidIndices?: number[];
}

export interface PCAResult {
  points: { x: number; y: number; cluster: number; id?: string | number }[];
  centroids: { x: number; y: number; cluster: number }[];
  explainedVarianceRatio: [number, number]; // [PC1, PC2]
}

export interface CentroidDetail {
  clusterIndex: number;
  clusterName: string;
  size: number;
  percentage: number;
  // Natural un-normalized original units:
  means: Record<string, number>;
  // Difference in % vs overall population mean
  deltasVsGlobal: Record<string, number>;
  // Categorical distributions in cluster
  categoryDistributions: Record<string, Record<string, number>>;
  // ANOVA F or discriminative power score
  keyDifferentiatingFeatures: { feature: string; score: number; direction: 'higher' | 'lower' }[];
}

export interface ROIScenario {
  name: string; // 'Conservador' | 'Base' | 'Optimista'
  initialInvestment: number;
  incrementalOperatingCosts: number;
  incrementalGrossRevenue: number;
  contributionMarginPercent: number; // e.g. 40%
  incrementalNetBenefits: number; // incrementalGrossRevenue * margin - costs
  roiPercent: number;
  paybackMonths: number;
}

export interface ClusterBusinessROI {
  clusterIndex: number;
  clusterName: string;
  targetPopulation: number;
  type: 'historico' | 'estimado' | 'potencial';
  assumptions: string;
  baseParams: {
    investmentPerCustomer: number;
    incrementalSpendPerCustomer: number;
    contributionMargin: number; // 0 to 1
    horizonMonths: number;
  };
  scenarios: {
    conservador: ROIScenario;
    base: ROIScenario;
    optimista: ROIScenario;
  };
}

export interface SegmentProfile {
  clusterIndex: number;
  name: string;
  population: number;
  sharePercentage: number;
  archetypeTagline: string;
  demographicTraits: string[];
  observedBehaviors: string[];
  unmetNeeds: string[];
  commercialOpportunities: string[];
  risksAndConstraints: string[];
  confidenceLevel: 'Alta' | 'Media' | 'Baja';
}

export interface CommercialStrategy {
  clusterIndex: number;
  clusterName: string;
  priorityScore: number; // 1 to 10
  productStrategy: {
    offeringTitle: string;
    description: string;
    priorityFeatures: string[];
  };
  pricingStrategy: {
    model: string;
    discountOrBundle: string;
    rationale: string;
  };
  innovationStrategy: {
    capabilities: string[];
    digitalExperience: string;
  };
  communicationStrategy: {
    valueProposition: string;
    keyMessages: string[];
    preferredChannels: string[];
    acquisitionAction: string;
    retentionAction: string;
  };
  implementationPlan: {
    actionItems: { action: string; owner: string; monthDeadline: number; kpi: string }[];
    successCriteria: string;
  };
}

export type StageStatus = 'pending' | 'in_progress' | 'needs_review' | 'approved' | 'error';

export interface StageApproval {
  stageId: number;
  title: string;
  status: StageStatus;
  approvedAt?: string;
  approvedBy?: string;
  userNotes?: string;
}

export interface AnalysisState {
  // Sector & Meta
  sector: SectorEconomic;
  subsector: string;
  fileName: string;
  fileSizeBytes: number;

  // Raw & processed data
  rawRows: Record<string, any>[];
  columnsMeta: ColumnMetadata[];
  imputationConfig: ImputationConfig;
  imputedRows: Record<string, any>[];

  // Transformations
  encodedRows: Record<string, number>[];
  encodedFeaturesList: string[];
  transformationLog: { originalCol: string; action: string; outputCols: string[] }[];

  // Statistics & Rules
  descriptiveStats: DescriptiveStats[];
  correlationMatrix: { features: string[]; matrix: number[][] };
  businessRules: BusinessRule[];

  // Scaling
  scalingMethod: ScalingMethod;
  scaledMatrix: number[][]; // normalized numerical data for clustering
  scalingParams: Record<string, { center: number; scale: number }>;

  // Optimal K & Clustering
  kEvaluation: { k: number; inertia: number; silhouette: number }[];
  recommendedK: number;
  kSelectionJustification: string;
  kmeansConfig: KMeansConfig;
  clusteringConfig: ClusteringAlgorithmConfig;
  selectedAlgorithm: ClusteringAlgorithmType;
  algorithmComparison?: AlgorithmBenchmarkResult[];
  clusteringMetrics?: ClusterEvaluationMetrics;
  clusterAssignments: number[]; // cluster id per row
  pcaResult?: PCAResult;

  // Business outputs
  centroids: CentroidDetail[];
  roiModels: ClusterBusinessROI[];
  profiles: SegmentProfile[];
  strategies: CommercialStrategy[];

  // Workflow progress & validation
  currentStage: number; // 1 to 13
  stagesApproval: Record<number, StageApproval>;
}
