import React, { useState, useMemo, useCallback } from 'react';
import {
  AnalysisState,
  ColumnMetadata,
  ImputationConfig,
  KMeansConfig,
  ClusteringAlgorithmConfig,
  ClusteringAlgorithmType,
  ScalingMethod,
  SectorEconomic,
  StageApproval,
  CentroidDetail,
  BusinessRule,
} from './types';
import { BENCHMARK_DATASETS, inspectColumns } from './data/benchmarkDatasets';
import { executeEncoding, executeImputation } from './utils/dataTransformPipeline';
import {
  calculateDescriptiveStats,
  computeCorrelationMatrix,
  applyFeatureScaling,
  evaluateElbowAndSilhouette,
  runKMeansClustering,
  runUnifiedClustering,
  runAlgorithmComparison,
  calculateSilhouetteScores,
  computePCA2D,
  computeFeatureImportance,
  inverseTransformValue,
  euclideanDist,
} from './utils/statisticalEngine';
import {
  generateStrategicProfiles,
  generateStrategicPlans,
  initializeClusterROIModels,
} from './utils/strategicSynthesis';

import { AppHeader } from './components/layout/AppHeader';
import { StageProgressBar, STAGE_TITLES } from './components/layout/StageProgressBar';
import { ExecutiveReportModal } from './components/report/ExecutiveReportModal';

// Stages
import { Stage1Upload } from './components/stages/Stage1Upload';
import { Stage2Exploration } from './components/stages/Stage2Exploration';
import { Stage3Classification } from './components/stages/Stage3Classification';
import { Stage4Encoding } from './components/stages/Stage4Encoding';
import { Stage5Imputation } from './components/stages/Stage5Imputation';
import { Stage6ExploratoryStats } from './components/stages/Stage6ExploratoryStats';
import { Stage7Normalization } from './components/stages/Stage7Normalization';
import { Stage8OptimalK } from './components/stages/Stage8OptimalK';
import { Stage9KMeans } from './components/stages/Stage9KMeans';
import { Stage10Centroids } from './components/stages/Stage10Centroids';
import { Stage11BusinessROI } from './components/stages/Stage11BusinessROI';
import { Stage12Profiling } from './components/stages/Stage12Profiling';
import { Stage13CommercialStrategies } from './components/stages/Stage13CommercialStrategies';

/**
 * Builds full analysis state from raw data and config parameters.
 */
function buildFullPipeline(
  rawRows: Record<string, any>[],
  fileName: string,
  fileSizeBytes: number,
  sector: SectorEconomic,
  subsector: string,
  existingMeta?: ColumnMetadata[],
  existingImputationConfig?: ImputationConfig,
  scalingMethod: ScalingMethod = 'zscore',
  customK?: number,
  clusteringConfigOverride?: Partial<ClusteringAlgorithmConfig>
): AnalysisState {
  // 1. Column heuristics
  const columnsMeta = existingMeta || inspectColumns(rawRows);

  // 2. Imputation config & execution
  const imputationConfig: ImputationConfig = existingImputationConfig || {};
  columnsMeta.forEach(col => {
    if (!imputationConfig[col.name]) {
      imputationConfig[col.name] = col.confirmedType.startsWith('numeric') ? 'median' : 'mode';
    }
  });

  const { imputedRows } = executeImputation(rawRows, columnsMeta, imputationConfig);

  // 3. Descriptive Stats for numeric columns
  const numericCols = columnsMeta.filter(c => c.confirmedType.startsWith('numeric'));
  const descriptiveStats = numericCols.map(col =>
    calculateDescriptiveStats(
      col.name,
      imputedRows.map(r => r[col.name])
    )
  );

  // 4. Pearson Correlation
  const numericNames = numericCols.map(c => c.name);
  const correlationMatrix = computeCorrelationMatrix(imputedRows, numericNames);

  // 5. Encoding
  const { encodedRows, encodedFeaturesList, transformationLog } = executeEncoding(
    imputedRows,
    columnsMeta
  );

  // 6. Scaling
  const rawNumericMatrix = encodedRows.map(row =>
    encodedFeaturesList.map(feat => row[feat] ?? 0)
  );

  const { scaledMatrix, params: scalingParams } = applyFeatureScaling(
    rawNumericMatrix,
    encodedFeaturesList,
    scalingMethod
  );

  // 7. Elbow & Silhouette Evaluation for K = 2 to 7
  const kEvaluation = evaluateElbowAndSilhouette(scaledMatrix, 2, Math.min(7, rawRows.length - 1), 42);

  // Find best K (heuristic: balance max silhouette & elbow)
  let bestK = 3;
  if (kEvaluation.length > 0) {
    const sortedBySil = [...kEvaluation].sort((a, b) => b.silhouette - a.silhouette);
    bestK = sortedBySil[0].k;
  }
  const chosenK = customK || bestK;

  // 8. Clustering Execution (Supports K-Means, K-Medoids PAM Manhattan, or Hierarchical Ward)
  const finalClusteringConfig: ClusteringAlgorithmConfig = {
    algorithm: 'kmeans',
    k: chosenK,
    initMethod: 'k-means++',
    nInit: 8,
    maxIter: 100,
    randomSeed: 42,
    kmedoidsMetric: 'manhattan',
    hierarchicalLinkage: 'ward',
    ...clusteringConfigOverride,
  };

  const finalKMeansConfig: KMeansConfig = {
    k: chosenK,
    initMethod: finalClusteringConfig.initMethod,
    nInit: finalClusteringConfig.nInit,
    maxIter: finalClusteringConfig.maxIter,
    randomSeed: finalClusteringConfig.randomSeed,
  };

  const clusterResult = runUnifiedClustering(scaledMatrix, finalClusteringConfig);
  const silhouetteEval = calculateSilhouetteScores(scaledMatrix, clusterResult.assignments, chosenK);

  // Comparative benchmark of all 3 algorithms for user exploration
  const algorithmComparison = runAlgorithmComparison(scaledMatrix, chosenK, finalClusteringConfig.randomSeed);

  // Population counts
  const clusterSizes = new Array(chosenK).fill(0);
  clusterResult.assignments.forEach(c => clusterSizes[c]++);
  const totalRows = rawRows.length;
  const clusterPercentages = clusterSizes.map(s => Number(((s / totalRows) * 100).toFixed(1)));

  // Inter-centroid distances
  const interCentroidDistances: number[][] = [];
  for (let i = 0; i < chosenK; i++) {
    interCentroidDistances[i] = [];
    for (let j = 0; j < chosenK; j++) {
      interCentroidDistances[i][j] = euclideanDist(clusterResult.centroids[i], clusterResult.centroids[j]);
    }
  }

  const clusteringMetrics = {
    algorithm: finalClusteringConfig.algorithm,
    algorithmName: clusterResult.algorithmName,
    k: chosenK,
    inertia: clusterResult.inertia,
    globalSilhouette: silhouetteEval.globalSilhouette,
    clusterSilhouettes: silhouetteEval.clusterSilhouettes,
    clusterSizes,
    clusterPercentages,
    interCentroidDistances,
    warningSmallClusters: clusterPercentages.some(p => p < 5),
    medoidIndices: clusterResult.medoidIndices,
  };

  // 9. PCA 2D Projection
  const idCol = columnsMeta.find(c => c.usageDecision === 'identifier')?.name;
  const rowIds = idCol ? imputedRows.map(r => r[idCol]) : undefined;
  const pcaResult = computePCA2D(scaledMatrix, clusterResult.assignments, clusterResult.centroids, rowIds);

  // 10. Compute ANOVA Feature Importance
  const featureRankings = computeFeatureImportance(
    encodedRows,
    clusterResult.assignments,
    encodedFeaturesList,
    chosenK
  );

  // 11. Centroids in Natural Original Units
  const originalIncludedNumericCols = columnsMeta.filter(
    c => c.usageDecision === 'include' && c.confirmedType.startsWith('numeric')
  );

  const centroids: CentroidDetail[] = clusterResult.centroids.map((cRow, cIdx) => {
    const means: Record<string, number> = {};
    const deltasVsGlobal: Record<string, number> = {};

    originalIncludedNumericCols.forEach(col => {
      const featName = col.name;
      const colIdxInEncoded = encodedFeaturesList.indexOf(featName);
      if (colIdxInEncoded !== -1) {
        const scaledMean = cRow[colIdxInEncoded];
        const { center, scale } = scalingParams[featName] || { center: 0, scale: 1 };
        const naturalMean = inverseTransformValue(scaledMean, center, scale);
        means[featName] = Number(naturalMean.toFixed(2));

        const globalStat = descriptiveStats.find(s => s.column === featName);
        if (globalStat && globalStat.mean !== 0) {
          const delta = ((naturalMean - globalStat.mean) / Math.abs(globalStat.mean)) * 100;
          deltasVsGlobal[featName] = Number(delta.toFixed(1));
        } else {
          deltasVsGlobal[featName] = 0;
        }
      }
    });

    // Categorical frequencies in this cluster
    const clusterRows = imputedRows.filter((_, idx) => clusterResult.assignments[idx] === cIdx);
    const nominalCols = columnsMeta.filter(c => c.confirmedType === 'categorical_nominal');
    const categoryDistributions: Record<string, Record<string, number>> = {};

    nominalCols.forEach(col => {
      const counts: Record<string, number> = {};
      clusterRows.forEach(r => {
        const val = String(r[col.name] ?? 'N/A');
        counts[val] = (counts[val] || 0) + 1;
      });
      const dist: Record<string, number> = {};
      const cTotal = clusterRows.length;
      Object.keys(counts).forEach(k => {
        dist[k] = Number(((counts[k] / cTotal) * 100).toFixed(1));
      });
      categoryDistributions[col.name] = dist;
    });

    // Top differentiating features for this cluster
    const keyDifferentiatingFeatures = featureRankings.slice(0, 3).map(fr => {
      const colIdx = encodedFeaturesList.indexOf(fr.feature);
      const isHigher = colIdx !== -1 ? cRow[colIdx] > 0 : true;
      return {
        feature: fr.feature,
        score: fr.fScore,
        direction: (isHigher ? 'higher' : 'lower') as 'higher' | 'lower',
      };
    });

    return {
      clusterIndex: cIdx,
      clusterName: `Segmento ${cIdx + 1}`,
      size: clusterSizes[cIdx],
      percentage: clusterPercentages[cIdx],
      means,
      deltasVsGlobal,
      categoryDistributions,
      keyDifferentiatingFeatures,
    };
  });

  // 12. Strategic Profiles
  const profiles = generateStrategicProfiles(centroids, sector);
  // sync centroid cluster names with generated strategic names
  centroids.forEach((c, idx) => {
    if (profiles[idx]) c.clusterName = profiles[idx].name;
  });

  // 13. Strategic Commercial Plans
  const strategies = generateStrategicPlans(profiles, centroids, sector);

  // 14. ROI Models
  const roiModels = initializeClusterROIModels(centroids, profiles);

  // Initial stage approvals
  const stagesApproval: Record<number, StageApproval> = {};
  STAGE_TITLES.forEach(st => {
    stagesApproval[st.id] = {
      stageId: st.id,
      title: st.title,
      status: st.id === 1 ? 'approved' : 'pending',
    };
  });

  return {
    sector,
    subsector,
    fileName,
    fileSizeBytes,
    rawRows,
    columnsMeta,
    imputationConfig,
    imputedRows,
    encodedRows,
    encodedFeaturesList,
    transformationLog,
    descriptiveStats,
    correlationMatrix,
    businessRules: [],
    scalingMethod,
    scaledMatrix,
    scalingParams,
    kEvaluation,
    recommendedK: bestK,
    kSelectionJustification: 'Inflexión clara en la varianza explicada intra-clúster y coeficiente de silueta coherente con la capacidad operativa del sector.',
    kmeansConfig: finalKMeansConfig,
    clusteringConfig: finalClusteringConfig,
    selectedAlgorithm: finalClusteringConfig.algorithm,
    algorithmComparison,
    clusteringMetrics,
    clusterAssignments: clusterResult.assignments,
    pcaResult,
    centroids,
    roiModels,
    profiles,
    strategies,
    currentStage: 1,
    stagesApproval,
  };
}

export default function App() {
  // Initialize with Benchmark Dataset 1 (Telecom)
  const defaultPreset = BENCHMARK_DATASETS[0];

  const [state, setState] = useState<AnalysisState>(() =>
    buildFullPipeline(
      defaultPreset.data,
      'Telecomunicaciones_Consumo_Benchmark.xlsx',
      120 * 180,
      defaultPreset.sector,
      defaultPreset.subsector
    )
  );

  const [isReportOpen, setIsReportOpen] = useState(false);

  // Invalidate downstream stages when earlier stage is modified
  const invalidateDownstreamFrom = useCallback((stageId: number) => {
    setState(prev => {
      const updatedApprovals = { ...prev.stagesApproval };
      for (let s = stageId + 1; s <= 13; s++) {
        if (updatedApprovals[s]) {
          updatedApprovals[s] = {
            ...updatedApprovals[s],
            status: 'needs_review',
          };
        }
      }
      return { ...prev, stagesApproval: updatedApprovals };
    });
  }, []);

  // Handler for Stage 1 upload
  const handleUpdateData = useCallback(
    (
      newRows: Record<string, any>[],
      fileName: string,
      sizeBytes: number,
      sector: SectorEconomic,
      subsector: string
    ) => {
      const newState = buildFullPipeline(
        newRows,
        fileName,
        sizeBytes,
        sector,
        subsector
      );
      setState(newState);
    },
    []
  );

  // Handler for Stage 3 column metadata update
  const handleUpdateColumnsMeta = useCallback(
    (updatedMeta: ColumnMetadata[]) => {
      setState(prev => {
        const recomputed = buildFullPipeline(
          prev.rawRows,
          prev.fileName,
          prev.fileSizeBytes,
          prev.sector,
          prev.subsector,
          updatedMeta,
          prev.imputationConfig,
          prev.scalingMethod,
          prev.clusteringConfig?.k || 3,
          prev.clusteringConfig
        );
        return {
          ...recomputed,
          currentStage: prev.currentStage,
          stagesApproval: prev.stagesApproval,
        };
      });
      invalidateDownstreamFrom(3);
    },
    [invalidateDownstreamFrom]
  );

  // Handler for Stage 5 imputation config update
  const handleUpdateImputation = useCallback(
    (config: ImputationConfig) => {
      setState(prev => {
        const recomputed = buildFullPipeline(
          prev.rawRows,
          prev.fileName,
          prev.fileSizeBytes,
          prev.sector,
          prev.subsector,
          prev.columnsMeta,
          config,
          prev.scalingMethod,
          prev.clusteringConfig?.k || 3,
          prev.clusteringConfig
        );
        return {
          ...recomputed,
          currentStage: prev.currentStage,
          stagesApproval: prev.stagesApproval,
        };
      });
      invalidateDownstreamFrom(5);
    },
    [invalidateDownstreamFrom]
  );

  // Handler for Stage 6 business rules update
  const handleUpdateBusinessRules = useCallback((rules: BusinessRule[]) => {
    setState(prev => ({ ...prev, businessRules: rules }));
  }, []);

  // Handler for Stage 7 scaling method update
  const handleUpdateScalingMethod = useCallback(
    (method: ScalingMethod) => {
      setState(prev => {
        const recomputed = buildFullPipeline(
          prev.rawRows,
          prev.fileName,
          prev.fileSizeBytes,
          prev.sector,
          prev.subsector,
          prev.columnsMeta,
          prev.imputationConfig,
          method,
          prev.clusteringConfig?.k || 3,
          prev.clusteringConfig
        );
        return {
          ...recomputed,
          currentStage: prev.currentStage,
          stagesApproval: prev.stagesApproval,
        };
      });
      invalidateDownstreamFrom(7);
    },
    [invalidateDownstreamFrom]
  );

  // Handler for Stage 8 K selection
  const handleUpdateKSelection = useCallback(
    (k: number, justification: string) => {
      setState(prev => {
        const recomputed = buildFullPipeline(
          prev.rawRows,
          prev.fileName,
          prev.fileSizeBytes,
          prev.sector,
          prev.subsector,
          prev.columnsMeta,
          prev.imputationConfig,
          prev.scalingMethod,
          k,
          { ...prev.clusteringConfig, k }
        );
        return {
          ...recomputed,
          kSelectionJustification: justification,
          currentStage: prev.currentStage,
          stagesApproval: prev.stagesApproval,
        };
      });
      invalidateDownstreamFrom(8);
    },
    [invalidateDownstreamFrom]
  );

  // Handler for Stage 9 Clustering execution
  const handleRunClustering = useCallback(
    (config: ClusteringAlgorithmConfig) => {
      setState(prev => {
        const recomputed = buildFullPipeline(
          prev.rawRows,
          prev.fileName,
          prev.fileSizeBytes,
          prev.sector,
          prev.subsector,
          prev.columnsMeta,
          prev.imputationConfig,
          prev.scalingMethod,
          config.k,
          config
        );
        return {
          ...recomputed,
          currentStage: prev.currentStage,
          stagesApproval: prev.stagesApproval,
        };
      });
      invalidateDownstreamFrom(9);
    },
    [invalidateDownstreamFrom]
  );

  // Stage Approval Action
  const handleApproveStage = useCallback((stageId: number, notes: string) => {
    setState(prev => {
      const nowStr = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const updatedApprovals = {
        ...prev.stagesApproval,
        [stageId]: {
          stageId,
          title: STAGE_TITLES.find(s => s.id === stageId)?.title || `Etapa ${stageId}`,
          status: 'approved' as const,
          approvedAt: nowStr,
          approvedBy: 'Consultor Líder',
          userNotes: notes,
        },
      };

      const nextStage = Math.min(13, stageId + 1);

      return {
        ...prev,
        stagesApproval: updatedApprovals,
        currentStage: nextStage,
      };
    });
  }, []);

  // Jump to specific stage
  const handleSelectStage = useCallback((stageId: number) => {
    setState(prev => ({ ...prev, currentStage: stageId }));
  }, []);

  // Reset analysis
  const handleReset = useCallback(() => {
    const firstPreset = BENCHMARK_DATASETS[0];
    setState(
      buildFullPipeline(
        firstPreset.data,
        'Telecomunicaciones_Consumo_Benchmark.xlsx',
        120 * 180,
        firstPreset.sector,
        firstPreset.subsector
      )
    );
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <AppHeader
        state={state}
        onOpenReport={() => setIsReportOpen(true)}
        onReset={handleReset}
      />

      {/* 13-Stage Progress Nav */}
      <StageProgressBar
        currentStage={state.currentStage}
        stagesApproval={state.stagesApproval}
        onSelectStage={handleSelectStage}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {state.currentStage === 1 && (
          <Stage1Upload
            state={state}
            onUpdateData={handleUpdateData}
            onApproveStage={(notes) => handleApproveStage(1, notes)}
          />
        )}

        {state.currentStage === 2 && (
          <Stage2Exploration
            state={state}
            onApproveStage={(notes) => handleApproveStage(2, notes)}
            onBack={() => handleSelectStage(1)}
          />
        )}

        {state.currentStage === 3 && (
          <Stage3Classification
            state={state}
            onUpdateColumnsMeta={handleUpdateColumnsMeta}
            onApproveStage={(notes) => handleApproveStage(3, notes)}
            onBack={() => handleSelectStage(2)}
          />
        )}

        {state.currentStage === 4 && (
          <Stage4Encoding
            state={state}
            onApproveStage={(notes) => handleApproveStage(4, notes)}
            onBack={() => handleSelectStage(3)}
          />
        )}

        {state.currentStage === 5 && (
          <Stage5Imputation
            state={state}
            onUpdateImputation={handleUpdateImputation}
            onApproveStage={(notes) => handleApproveStage(5, notes)}
            onBack={() => handleSelectStage(4)}
          />
        )}

        {state.currentStage === 6 && (
          <Stage6ExploratoryStats
            state={state}
            onUpdateBusinessRules={handleUpdateBusinessRules}
            onApproveStage={(notes) => handleApproveStage(6, notes)}
            onBack={() => handleSelectStage(5)}
          />
        )}

        {state.currentStage === 7 && (
          <Stage7Normalization
            state={state}
            onUpdateScalingMethod={handleUpdateScalingMethod}
            onApproveStage={(notes) => handleApproveStage(7, notes)}
            onBack={() => handleSelectStage(6)}
          />
        )}

        {state.currentStage === 8 && (
          <Stage8OptimalK
            state={state}
            onUpdateKSelection={handleUpdateKSelection}
            onApproveStage={(notes) => handleApproveStage(8, notes)}
            onBack={() => handleSelectStage(7)}
          />
        )}

        {state.currentStage === 9 && (
          <Stage9KMeans
            state={state}
            onRunClustering={handleRunClustering}
            onApproveStage={(notes) => handleApproveStage(9, notes)}
            onBack={() => handleSelectStage(8)}
          />
        )}

        {state.currentStage === 10 && (
          <Stage10Centroids
            state={state}
            onApproveStage={(notes) => handleApproveStage(10, notes)}
            onBack={() => handleSelectStage(9)}
          />
        )}

        {state.currentStage === 11 && (
          <Stage11BusinessROI
            state={state}
            onUpdateROIModels={(updated) => setState(prev => ({ ...prev, roiModels: updated }))}
            onApproveStage={(notes) => handleApproveStage(11, notes)}
            onBack={() => handleSelectStage(10)}
          />
        )}

        {state.currentStage === 12 && (
          <Stage12Profiling
            state={state}
            onUpdateProfiles={(updated) => setState(prev => ({ ...prev, profiles: updated }))}
            onApproveStage={(notes) => handleApproveStage(12, notes)}
            onBack={() => handleSelectStage(11)}
          />
        )}

        {state.currentStage === 13 && (
          <Stage13CommercialStrategies
            state={state}
            onUpdateStrategies={(updated) => setState(prev => ({ ...prev, strategies: updated }))}
            onApproveStage={(notes) => handleApproveStage(13, notes)}
            onOpenReport={() => setIsReportOpen(true)}
            onBack={() => handleSelectStage(12)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <span>Cluster Intelligence · Sistema de Segmentación Estratégica y Analítica de Clústeres</span>
          <span className="font-mono text-[11px] text-slate-400">
            K-Means++ · Silhouette (Rousseeuw 1987) · PCA 2D · ROI Parametrizado
          </span>
        </div>
      </footer>

      {/* Boardroom Executive Report Modal */}
      {isReportOpen && (
        <ExecutiveReportModal state={state} onClose={() => setIsReportOpen(false)} />
      )}
    </div>
  );
}
