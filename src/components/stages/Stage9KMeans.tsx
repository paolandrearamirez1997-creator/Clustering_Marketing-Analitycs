import React, { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2, Info, Compass, Sparkles, Scale, Layers, HelpCircle, ArrowRight } from 'lucide-react';
import { AnalysisState, ClusteringAlgorithmConfig, ClusteringAlgorithmType, AlgorithmBenchmarkResult } from '../../types';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage9Props {
  state: AnalysisState;
  onRunClustering: (config: ClusteringAlgorithmConfig) => void;
  onApproveStage: (notes: string) => void;
  onBack: () => void;
}

const CLUSTER_COLORS = ['#0284C7', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#0D9488'];

const ALGORITHM_INFO: Record<
  ClusteringAlgorithmType,
  {
    name: string;
    subtitle: string;
    outlierRobustness: 'Baja' | 'Alta' | 'Media';
    badgeColor: string;
    description: string;
    outlierExplanation: string;
  }
> = {
  kmeans: {
    name: 'K-Means (k-means++)',
    subtitle: 'Particionamiento Euclidiano por Medias Aritméticas',
    outlierRobustness: 'Baja',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    description: 'Algoritmo clásico y de alta velocidad que minimiza la suma de distancias al cuadrado (WCSS). Adecuado para grupos de forma esférica y dimensiones homogéneas.',
    outlierExplanation: 'Sensibilidad a outliers: Al calcular medias aritméticas elevadas al cuadrado (L2), un valor atípico extremo (ej. un cliente con gasto desproporcionado) arrastra significativamente la posición del centroide.',
  },
  kmedoids: {
    name: 'K-Medoids (PAM - Partitioning Around Medoids)',
    subtitle: 'Centrado en Puntos Reales de la Muestra con Métrica L1',
    outlierRobustness: 'Alta',
    badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    description: 'Utiliza observaciones reales del dataset como centros (medoides) y minimiza la suma de distancias absolutas (Manhattan o Euclidiana). Es el análogo multidimensional de la mediana.',
    outlierExplanation: 'Máxima robustez: Los medoides no pueden ser desplazados a regiones vacías por observaciones anómalas. Un cliente con facturación atípica no distorsiona el núcleo del segmento.',
  },
  hierarchical: {
    name: 'Clustering Jerárquico Aglomerativo',
    subtitle: 'Construcción Ascendente de Árbol de Varianza (Ward)',
    outlierRobustness: 'Media',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
    description: 'Enfoque determinista que comienza con cada observación en su propio clúster y las fusiona secuencialmente. No requiere inicializaciones aleatorias ni reinicios estocásticos.',
    outlierExplanation: 'Buena robustez estructural: Permite aislar observaciones anómalas en ramas independientes del dendrograma antes de fusionar los grupos principales de mercado.',
  },
};

export const Stage9KMeans: React.FC<Stage9Props> = ({
  state,
  onRunClustering,
  onApproveStage,
  onBack,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<ClusteringAlgorithmType>(
    state.clusteringConfig?.algorithm || state.selectedAlgorithm || 'kmeans'
  );

  const [config, setConfig] = useState<ClusteringAlgorithmConfig>(
    state.clusteringConfig || {
      algorithm: selectedAlgo,
      k: state.kmeansConfig?.k || 3,
      randomSeed: 42,
      initMethod: 'k-means++',
      nInit: 8,
      maxIter: 100,
      kmedoidsMetric: 'manhattan',
      hierarchicalLinkage: 'ward',
    }
  );

  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);

  const metrics = state.clusteringMetrics;
  const pca = state.pcaResult;
  const comparison = state.algorithmComparison || [];

  const handleAlgorithmChange = (algo: ClusteringAlgorithmType) => {
    setSelectedAlgo(algo);
    const updated = { ...config, algorithm: algo };
    setConfig(updated);
    onRunClustering(updated);
  };

  const handleExecute = () => {
    onRunClustering(config);
  };

  const isExecuted = Boolean(metrics && state.clusterAssignments.length > 0);
  const isReady = isExecuted && (metrics?.clusterSizes.every(s => s >= 3) ?? false);

  const blockingReasons: string[] = [];
  if (!isExecuted) blockingReasons.push('Debe ejecutar el algoritmo seleccionado para calcular las asignaciones.');
  if (metrics?.warningSmallClusters) {
    blockingReasons.push('Se detectaron segmentos con tamaño inferior al umbral recomendado (< 5% de la población). Revise el valor de k o el algoritmo.');
  }

  // PCA coordinate scale mapping
  const points = pca?.points || [];
  const centroids = pca?.centroids || [];
  const allX = points.map(p => p.x).concat(centroids.map(c => c.x));
  const allY = points.map(p => p.y).concat(centroids.map(c => c.y));
  const minX = Math.min(...allX, -2);
  const maxX = Math.max(...allX, 2);
  const minY = Math.min(...allY, -2);
  const maxY = Math.max(...allY, 2);

  const mapX = (x: number) => 30 + ((x - minX) / (maxX - minX || 1)) * 440;
  const mapY = (y: number) => 210 - ((y - minY) / (maxY - minY || 1)) * 170;

  const currentAlgoMeta = ALGORITHM_INFO[selectedAlgo];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 9: Selección del Algoritmo de Clustering y Comparación de Robustez
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Seleccione y compare en tiempo real <strong>K-Means</strong> frente a alternativas como <strong>K-Medoids (PAM)</strong> o <strong>Clustering Jerárquico</strong> para evaluar la resistencia frente a valores atípicos (outliers) y distribuciones no esféricas.
        </p>
      </div>

      {/* Algorithm Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['kmeans', 'kmedoids', 'hierarchical'] as ClusteringAlgorithmType[]).map((algoKey) => {
          const info = ALGORITHM_INFO[algoKey];
          const isSelected = selectedAlgo === algoKey;

          return (
            <div
              key={algoKey}
              onClick={() => handleAlgorithmChange(algoKey)}
              className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-400 text-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      isSelected ? 'bg-slate-800 text-emerald-300 border-slate-700' : info.badgeColor
                    }`}
                  >
                    Robustez Outliers: {info.outlierRobustness}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>

                <h3 className="text-sm font-bold">{info.name}</h3>
                <p className={`text-xs mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {info.subtitle}
                </p>

                <p className={`text-xs mt-3 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                  {info.description}
                </p>
              </div>

              <div className={`mt-4 pt-2.5 border-t text-[11px] ${isSelected ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                {algoKey === 'kmedoids' && '✓ Recomendado si existen clientes con montos extremos o dispersos.'}
                {algoKey === 'kmeans' && '✓ Rápido y estándar si las variables presentan simetría adecuada.'}
                {algoKey === 'hierarchical' && '✓ Solución jerárquica determinista independiente de inicialización.'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Algorithm Benchmark Comparison Table */}
      {comparison.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-semibold text-slate-900">
                Comparativa Simultánea de Rendimiento para k = {config.k}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Evaluación estandarizada en el mismo espacio métrico
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-sans font-medium">
                  <th className="px-4 py-2.5">Algoritmo</th>
                  <th className="px-4 py-2.5 text-center">Robustez Outliers</th>
                  <th className="px-4 py-2.5 text-right">Silueta Global</th>
                  <th className="px-4 py-2.5 text-right">Inercia / Costo</th>
                  <th className="px-4 py-2.5">Distribución de Tamaños</th>
                  <th className="px-4 py-2.5 text-right font-sans">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {comparison.map((bench) => {
                  const isCurrent = selectedAlgo === bench.algorithm;
                  const isMaxSil = bench.globalSilhouette === Math.max(...comparison.map(c => c.globalSilhouette));

                  return (
                    <tr
                      key={bench.algorithm}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrent ? 'bg-slate-50/80 font-semibold' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-sans font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {isCurrent && <span className="w-2 h-2 rounded-full bg-slate-900" />}
                          <span>{bench.name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${
                            bench.outlierRobustness === 'Alta'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : bench.outlierRobustness === 'Media'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {bench.outlierRobustness}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={`font-bold ${isMaxSil ? 'text-emerald-700 font-extrabold' : 'text-slate-800'}`}>
                          {bench.globalSilhouette.toFixed(3)}
                        </span>
                        {isMaxSil && (
                          <span className="ml-1 text-[10px] text-emerald-800 font-sans font-semibold">
                            (Máxima)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {Math.round(bench.inertiaOrCost).toLocaleString()}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-sans">
                          {bench.clusterPercentages.map((pct, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                              title={`Clúster ${cIdx}: ${bench.clusterSizes[cIdx]} clientes`}
                            >
                              C{cIdx}: {pct}%
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-sans">
                        {isCurrent ? (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
                            Activo
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAlgorithmChange(bench.algorithm)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors"
                          >
                            Activar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hyperparameters Config Panel for Selected Algorithm */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Parámetros de Ejecución: {currentAlgoMeta.name}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {currentAlgoMeta.outlierExplanation}
            </p>
          </div>
          <button
            onClick={handleExecute}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start md:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Recalcular {currentAlgoMeta.name}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-xs font-mono">
          <div>
            <label className="block text-slate-500 text-[11px] font-sans mb-1">Clústeres (k):</label>
            <input
              type="number"
              min={2}
              max={10}
              value={config.k}
              onChange={(e) => setConfig({ ...config, k: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-semibold"
            />
          </div>

          {selectedAlgo === 'kmeans' && (
            <>
              <div>
                <label className="block text-slate-500 text-[11px] font-sans mb-1">Inicialización:</label>
                <select
                  value={config.initMethod}
                  onChange={(e) => setConfig({ ...config, initMethod: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-sans text-xs"
                >
                  <option value="k-means++">k-means++ (Robusto)</option>
                  <option value="random">Aleatoria Simple</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-sans mb-1">Reinicios (n_init):</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={config.nInit}
                  onChange={(e) => setConfig({ ...config, nInit: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-sans mb-1">Máx. Iteraciones:</label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={config.maxIter}
                  onChange={(e) => setConfig({ ...config, maxIter: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-sans mb-1">Semilla (Seed):</label>
                <input
                  type="number"
                  value={config.randomSeed}
                  onChange={(e) => setConfig({ ...config, randomSeed: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-emerald-800"
                />
              </div>
            </>
          )}

          {selectedAlgo === 'kmedoids' && (
            <>
              <div>
                <label className="block text-slate-500 text-[11px] font-sans mb-1">Métrica de Medoide:</label>
                <select
                  value={config.kmedoidsMetric}
                  onChange={(e) => setConfig({ ...config, kmedoidsMetric: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-sans text-xs"
                >
                  <option value="manhattan">L1 Manhattan (Máxima Robustez Outliers)</option>
                  <option value="euclidean">L2 Euclidiana</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-sans mb-1">Máx. Iteraciones PAM:</label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={config.maxIter}
                  onChange={(e) => setConfig({ ...config, maxIter: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-sans mb-1">Semilla (Seed):</label>
                <input
                  type="number"
                  value={config.randomSeed}
                  onChange={(e) => setConfig({ ...config, randomSeed: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-emerald-800"
                />
              </div>

              <div className="flex items-center text-xs text-slate-600 font-sans pt-5">
                <span>Centros: Puntos reales de la muestra</span>
              </div>
            </>
          )}

          {selectedAlgo === 'hierarchical' && (
            <>
              <div className="sm:col-span-2">
                <label className="block text-slate-500 text-[11px] font-sans mb-1">Criterio de Enlace (Linkage):</label>
                <select
                  value={config.hierarchicalLinkage}
                  onChange={(e) => setConfig({ ...config, hierarchicalLinkage: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-sans text-xs"
                >
                  <option value="ward">Ward (Minimiza Varianza Intra-Clúster)</option>
                  <option value="complete">Enlace Completo (Distancia Máxima)</option>
                  <option value="average">Enlace Promedio (Distancia Media UPGMA)</option>
                  <option value="single">Enlace Simple (Distancia Mínima)</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center text-xs text-slate-600 font-sans pt-5">
                <span>Dendrograma aglomerativo determinista sin aleatoriedad</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Metrics Summary Strip */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
            <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider block">Algoritmo Activo</span>
            <span className="text-sm font-bold text-slate-900 truncate block font-sans" title={metrics.algorithmName}>
              {metrics.algorithmName}
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
            <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider block">Silueta Global</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-700 tabular-nums">
                {metrics.globalSilhouette}
              </span>
              <span className="text-[11px] font-sans text-slate-500">
                ({metrics.globalSilhouette > 0.5 ? 'Buena' : metrics.globalSilhouette > 0.3 ? 'Aceptable' : 'Débil'})
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
            <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider block">Inercia / Costo</span>
            <span className="text-xl font-bold text-slate-900 tabular-nums">{metrics.inertia}</span>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
            <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider block">PCA Varianza Explicada</span>
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {pca ? `${Math.round((pca.explainedVarianceRatio[0] + pca.explainedVarianceRatio[1]) * 100)}%` : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* 2D PCA Scatter Visualization & Cluster Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scatter Plot */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Espacio de Proyección Bidimensional PCA ({metrics?.algorithmName})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                PC1 ({pca ? Math.round(pca.explainedVarianceRatio[0] * 100) : 0}% var) vs PC2 ({pca ? Math.round(pca.explainedVarianceRatio[1] * 100) : 0}% var). Los símbolos con círculo y número representan los centros/medoides del clúster.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {metrics?.clusterSizes.map((_, cIdx) => (
                <div key={cIdx} className="flex items-center gap-1 font-mono text-[11px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length] }}
                  />
                  <span>C{cIdx}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Scatter Viewport */}
          <div className="h-72 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 240">
              <line x1="30" y1="120" x2="470" y2="120" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="250" y1="20" x2="250" y2="220" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2,2" />

              {/* Data points */}
              {points.map((pt, idx) => {
                const cx = mapX(pt.x);
                const cy = mapY(pt.y);
                const color = CLUSTER_COLORS[pt.cluster % CLUSTER_COLORS.length];
                const isSelected = selectedPoint?.idx === idx;

                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6 : 3.5}
                    fill={color}
                    opacity={isSelected ? 1 : 0.75}
                    stroke={isSelected ? '#0F172A' : '#FFFFFF'}
                    strokeWidth={isSelected ? 2 : 0.5}
                    className="cursor-pointer transition-all hover:opacity-100 hover:r-5"
                    onClick={() => setSelectedPoint({ idx, pt, raw: state.imputedRows[idx] })}
                  />
                );
              })}

              {/* Centroids / Medoids markers */}
              {centroids.map((c, cIdx) => {
                const cx = mapX(c.x);
                const cy = mapY(c.y);
                const color = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];

                return (
                  <g key={`centroid-${cIdx}`} className="cursor-pointer">
                    <circle cx={cx} cy={cy} r={9} fill={color} stroke="#FFFFFF" strokeWidth="2.5" />
                    <text
                      x={cx}
                      y={cy + 3.5}
                      textAnchor="middle"
                      className="text-[10px] fill-white font-bold font-mono"
                    >
                      {cIdx}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Inspection Tooltip Banner */}
          {selectedPoint && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono flex items-center justify-between">
              <div>
                <span className="font-sans font-semibold text-slate-800">
                  Registro #{selectedPoint.idx + 1} · Asignado a: Clúster {selectedPoint.pt.cluster} ({metrics?.algorithmName})
                </span>
                <div className="text-[11px] text-slate-600 mt-0.5 truncate max-w-xl">
                  {Object.entries(selectedPoint.raw)
                    .slice(0, 4)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ')}
                </div>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-slate-400 hover:text-slate-700 text-[11px] font-sans"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Cluster Distribution & Silhouettes List */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Desglose de Segmentos
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Tamaño poblacional y siluetas del modelo {metrics?.algorithmName}.
            </p>
          </div>

          {metrics && (
            <div className="space-y-3">
              {metrics.clusterSizes.map((size, cIdx) => {
                const pct = metrics.clusterPercentages[cIdx];
                const sil = metrics.clusterSilhouettes[cIdx];
                const color = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];
                const isSmall = pct < 5;

                return (
                  <div key={cIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                        <span>Clúster {cIdx}</span>
                        {metrics.medoidIndices && (
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded font-medium">
                            Medoide #{metrics.medoidIndices[cIdx] + 1}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-600 tabular-nums">
                        {size} clientes ({pct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                      <span>Silueta de Grupo: {sil.toFixed(2)}</span>
                      {isSmall ? (
                        <span className="text-amber-700 font-sans font-semibold">Grupo Marginal (&lt;5%)</span>
                      ) : (
                        <span className="text-emerald-700 font-sans font-medium">Tamaño Viable</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={9}
        stageTitle={`Ejecución de Clustering: ${currentAlgoMeta.name}`}
        isReadyToApprove={isReady}
        blockingReasons={blockingReasons}
        approvalRecord={state.stagesApproval[9]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
