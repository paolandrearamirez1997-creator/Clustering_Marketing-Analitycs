import React, { useState } from 'react';
import { Target, TrendingUp, TrendingDown, ArrowUpDown, Award, CheckCircle2, Layers } from 'lucide-react';
import { AnalysisState, CentroidDetail } from '../../types';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage10Props {
  state: AnalysisState;
  onApproveStage: (notes: string) => void;
  onBack: () => void;
}

const CLUSTER_COLORS = ['#0284C7', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#0D9488'];

export const Stage10Centroids: React.FC<Stage10Props> = ({ state, onApproveStage, onBack }) => {
  const [selectedClusterIdx, setSelectedClusterIdx] = useState<number>(0);
  const centroids = state.centroids;
  const metrics = state.clusteringMetrics;

  const currentCentroid: CentroidDetail | undefined = centroids[selectedClusterIdx];
  const originalFeatures = Object.keys(currentCentroid?.means || {});

  const isReady = centroids && centroids.length >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 10: Análisis de Centroides y Validación de Segmentos
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Interpretación de los vectores centroides en sus unidades de medida originales (USD, días, horas, unidades) tras revertir las transformaciones de escala. Identificación de rasgos distintivos y brechas porcentuales frente al promedio global del mercado.
        </p>
      </div>

      {/* Cluster Tab Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-lg overflow-x-auto">
        {centroids.map((c, idx) => {
          const isSelected = selectedClusterIdx === idx;
          const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];

          return (
            <button
              key={idx}
              onClick={() => setSelectedClusterIdx(idx)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                isSelected ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
              <span>Clúster {idx}: {c.clusterName}</span>
              <span className="font-mono text-[11px] text-slate-500 font-normal">
                ({c.percentage}%)
              </span>
            </button>
          );
        })}
      </div>

      {/* Deep Dive for Selected Centroid */}
      {currentCentroid && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Centroid Feature Means Table in Original Natural Units */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Perfil Numérico Desnormalizado: Clúster {currentCentroid.clusterIndex}
                </span>
                <span className="text-[11px] text-slate-500">
                  {currentCentroid.size} clientes ({currentCentroid.percentage}% del total)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <th className="px-4 py-2.5">Variable Cuantitativa</th>
                    <th className="px-4 py-2.5 text-right font-mono">Media Clúster</th>
                    <th className="px-4 py-2.5 text-right font-mono">Promedio Global</th>
                    <th className="px-4 py-2.5 text-right font-mono">Diferencial (Δ%)</th>
                    <th className="px-4 py-2.5">Diagnóstico Conductual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {originalFeatures.map((feat) => {
                    const cMean = currentCentroid.means[feat];
                    const delta = currentCentroid.deltasVsGlobal[feat] ?? 0;
                    const isPositive = delta > 0;
                    const isSignificant = Math.abs(delta) >= 15;

                    // Global mean approximation
                    const globalMean = state.descriptiveStats.find(s => s.column === feat)?.mean ?? cMean;

                    return (
                      <tr key={feat} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-semibold text-slate-900 font-mono">
                          {feat}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-900 font-bold">
                          {cMean}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                          {globalMean}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isPositive ? '+' : ''}{delta}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-sans text-xs text-slate-600">
                          {isSignificant ? (
                            isPositive ? (
                              <span className="text-emerald-800 font-medium">
                                Significativamente superior a la media
                              </span>
                            ) : (
                              <span className="text-amber-800 font-medium">
                                Notoriamente inferior al mercado
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">Alineado al promedio global</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Differentiating Power & Categorical Distributions */}
          <div className="space-y-4">
            {/* Top Discriminant Features (ANOVA F-Ratio) */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 mb-3">
                <Award className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Variables Más Diferenciadoras (Poder F)
                </h4>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Métricas con mayor dispersión inter-clúster que explican la unicidad de este grupo:
              </p>

              <div className="space-y-2">
                {currentCentroid.keyDifferentiatingFeatures.map((df, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 block font-mono">
                        {df.feature}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {df.direction === 'higher' ? 'Sobresale por valores altos' : 'Sobresale por valores bajos'}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      F = {df.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorical Proportions (Not dummy numbers!) */}
            {Object.keys(currentCentroid.categoryDistributions || {}).length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 mb-3">
                  Composición Categórica del Clúster
                </h4>
                <div className="space-y-3">
                  {Object.entries(currentCentroid.categoryDistributions).map(([catCol, dist]) => (
                    <div key={catCol} className="space-y-1">
                      <span className="text-xs font-mono font-semibold text-slate-800 block">
                        {catCol}:
                      </span>
                      <div className="space-y-1">
                        {Object.entries(dist).map(([level, share]) => (
                          <div key={level} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 truncate max-w-[140px]">{level}</span>
                            <span className="font-mono text-slate-900 font-semibold">{share}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inter-Centroid Distance Matrix */}
      {metrics?.interCentroidDistances && metrics.interCentroidDistances.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Matriz de Distancias Euclidianas entre Centroides (Separación Inter-Clúster)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Valores altos reflejan clústeres fuertemente diferenciados e impermeables.
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="text-center text-xs border-collapse font-mono">
              <thead>
                <tr>
                  <th className="p-2 text-left font-sans text-slate-400 font-normal">Centroide</th>
                  {centroids.map((c, idx) => (
                    <th key={idx} className="p-2 text-slate-700 font-semibold">
                      Clúster {idx}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.interCentroidDistances.map((rowDist, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-2 text-left font-sans font-semibold text-slate-800">
                      Clúster {rIdx} ({centroids[rIdx]?.clusterName})
                    </td>
                    {rowDist.map((dVal, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-2 border border-white tabular-nums ${
                          rIdx === cIdx ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-800 font-semibold'
                        }`}
                      >
                        {dVal.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={10}
        stageTitle="Análisis de Centroides y Validación de Segmentos"
        isReadyToApprove={isReady}
        approvalRecord={state.stagesApproval[10]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
