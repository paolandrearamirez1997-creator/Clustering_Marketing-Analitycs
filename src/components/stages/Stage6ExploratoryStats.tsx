import React, { useState } from 'react';
import { BarChart3, TrendingUp, Filter, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { AnalysisState, BusinessRule, DescriptiveStats } from '../../types';
import { computeHistogramData } from '../../utils/statisticalEngine';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage6Props {
  state: AnalysisState;
  onUpdateBusinessRules: (rules: BusinessRule[]) => void;
  onApproveStage: (notes: string) => void;
  onBack: () => void;
}

export const Stage6ExploratoryStats: React.FC<Stage6Props> = ({
  state,
  onUpdateBusinessRules,
  onApproveStage,
  onBack,
}) => {
  const stats = state.descriptiveStats;
  const [selectedFeature, setSelectedFeature] = useState<string>(
    stats[0]?.column || ''
  );
  const [rules, setRules] = useState<BusinessRule[]>(state.businessRules || []);
  const [newRuleCol, setNewRuleCol] = useState(stats[0]?.column || '');
  const [newRuleOp, setNewRuleOp] = useState<'>' | '<' | '>=' | '<=' | '=='>('>');
  const [newRuleVal, setNewRuleVal] = useState<number>(50);
  const [newRuleLabel, setNewRuleLabel] = useState('Cliente Alto Valor');

  // Compute histogram data for currently selected feature
  const currentStat = stats.find(s => s.column === selectedFeature);
  const rawValues = state.imputedRows.map(r => r[selectedFeature]).filter(v => typeof v === 'number');
  const hist = computeHistogramData(rawValues, 10);

  // Add rule handler
  const handleAddRule = () => {
    if (!newRuleCol) return;
    const rule: BusinessRule = {
      id: `rule-${Date.now()}`,
      column: newRuleCol,
      operator: newRuleOp,
      val1: newRuleVal,
      label: newRuleLabel || `${newRuleCol} ${newRuleOp} ${newRuleVal}`,
      description: `Condición de negocio: ${newRuleCol} ${newRuleOp} ${newRuleVal}`,
    };
    const updated = [...rules, rule];
    setRules(updated);
    onUpdateBusinessRules(updated);
  };

  const handleRemoveRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    onUpdateBusinessRules(updated);
  };

  // Find max bin count for scaling SVG histogram bars
  const maxBinCount = Math.max(1, ...hist.bins.map(b => b.count));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 6: Análisis Exploratorio, Estadística Descriptiva e Histogramas
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Evaluación rigurosa de las distribuciones empíricas frente a la curva normal teórica <em>N(μ, σ²)</em>, detección de asimetrías y curtosis, análisis de correlación bivariada y establecimiento de reglas de negocio para la segmentación.
        </p>
      </div>

      {/* Comprehensive Statistics Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900">
            Resumen Paramétrico y No Paramétrico de Variables Numéricas
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {stats.length} variables cuantitativas
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <th className="px-3.5 py-2.5">Variable</th>
                <th className="px-3.5 py-2.5 text-right">Media (μ)</th>
                <th className="px-3.5 py-2.5 text-right">Desv. Est (σ)</th>
                <th className="px-3.5 py-2.5 text-right">Mediana</th>
                <th className="px-3.5 py-2.5 text-right">Mín - Máx</th>
                <th className="px-3.5 py-2.5 text-right">IQR (Q3-Q1)</th>
                <th className="px-3.5 py-2.5 text-right">Asimetría</th>
                <th className="px-3.5 py-2.5 text-right">Curtosis</th>
                <th className="px-3.5 py-2.5 text-right">CV (%)</th>
                <th className="px-3.5 py-2.5 text-center">Diagnóstico Normalidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {stats.map(s => {
                const isSelected = s.column === selectedFeature;
                const isSkewed = Math.abs(s.skewness) > 1.0;
                const isNormalLikely = Math.abs(s.skewness) < 0.5 && Math.abs(s.kurtosis) < 1.0;

                return (
                  <tr
                    key={s.column}
                    onClick={() => setSelectedFeature(s.column)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-100/90 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3.5 py-2.5 font-semibold text-slate-900 font-mono">
                      {s.column}
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-800">{s.mean}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-800">{s.std}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-800">{s.median}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-600">
                      [{s.min}, {s.max}]
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-800">{s.iqr}</td>
                    <td className={`px-3.5 py-2.5 text-right tabular-nums ${isSkewed ? 'text-amber-700 font-bold' : 'text-slate-800'}`}>
                      {s.skewness}
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-800">{s.kurtosis}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-800">{s.cv}%</td>
                    <td className="px-3.5 py-2.5 text-center font-sans text-[11px]">
                      {isNormalLikely ? (
                        <span className="text-emerald-700 font-medium">Aproximadamente Normal</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Asimétrica / No Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Diagnostic: Histogram with Theoretical Normal PDF Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Histograma Empírico vs Curva Normal Teórica N(μ, σ²)
              </h3>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                Variable: <span className="font-mono text-emerald-800">{selectedFeature}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 bg-slate-200 border border-slate-300 rounded-xs inline-block" /> Frecuencia
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-3 h-0.5 bg-emerald-600 inline-block" /> PDF Normal
              </span>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="h-64 w-full relative pt-4 pb-6">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Gridlines */}
              <line x1="0" y1="180" x2="500" y2="180" stroke="#E2E8F0" strokeWidth="1" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />

              {/* Histogram bars */}
              {hist.bins.map((bin, idx) => {
                const totalBins = hist.bins.length;
                const barWidth = 460 / totalBins;
                const x = 20 + idx * barWidth;
                const barHeight = (bin.count / maxBinCount) * 160;
                const y = 180 - barHeight;

                return (
                  <g key={idx} className="group">
                    <rect
                      x={x + 2}
                      y={y}
                      width={Math.max(4, barWidth - 4)}
                      height={barHeight}
                      fill="#CBD5E1"
                      className="hover:fill-slate-400 transition-colors"
                      rx="1"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={195}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-500 font-mono"
                    >
                      {bin.min.toFixed(0)}
                    </text>
                    {bin.count > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={Math.max(15, y - 4)}
                        textAnchor="middle"
                        className="text-[10px] fill-slate-700 font-mono font-bold"
                      >
                        {bin.count}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Normal curve polynomial/spline path */}
              {hist.normalCurve.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={hist.normalCurve
                    .map((pt, i) => {
                      const totalSteps = hist.normalCurve.length - 1;
                      const x = 20 + (i / totalSteps) * 460;
                      // scale density relative to max bar density
                      const maxNorm = Math.max(...hist.normalCurve.map(c => c.density));
                      const y = 180 - (pt.density / (maxNorm || 1)) * 150;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 font-mono">
            <span>Media: {currentStat?.mean}</span>
            <span>Mediana: {currentStat?.median}</span>
            <span>Desv. Est.: {currentStat?.std}</span>
            <span>Asimetría: {currentStat?.skewness}</span>
          </div>
        </div>

        {/* Business Rules & Thresholds Panel */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Reglas de Negocio y Umbrales
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Defina umbrales específicos del sector para enriquecer la interpretación estratégica.
            </p>
          </div>

          <div className="space-y-2 bg-slate-50 p-3 rounded-md border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-800 block">Agregar Nuevo Umbral:</span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newRuleCol}
                onChange={(e) => setNewRuleCol(e.target.value)}
                className="px-2 py-1 text-xs bg-white border border-slate-200 rounded"
              >
                {stats.map(s => (
                  <option key={s.column} value={s.column}>{s.column}</option>
                ))}
              </select>
              <select
                value={newRuleOp}
                onChange={(e) => setNewRuleOp(e.target.value as any)}
                className="px-2 py-1 text-xs bg-white border border-slate-200 rounded"
              >
                <option value=">">&gt; Mayor que</option>
                <option value=">=">&gt;= Mayor o igual</option>
                <option value="<">&lt; Menor que</option>
                <option value="<=">&lt;= Menor o igual</option>
                <option value="==">== Igual a</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={newRuleVal}
                onChange={(e) => setNewRuleVal(Number(e.target.value))}
                placeholder="Valor"
                className="w-1/3 px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono"
              />
              <input
                type="text"
                value={newRuleLabel}
                onChange={(e) => setNewRuleLabel(e.target.value)}
                placeholder="Etiqueta comercial"
                className="w-2/3 px-2 py-1 text-xs bg-white border border-slate-200 rounded"
              />
            </div>
            <button
              onClick={handleAddRule}
              className="w-full mt-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Guardar Regla de Negocio</span>
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">Reglas Activas:</span>
            {rules.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay reglas registradas aún.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {rules.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">{r.label}</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {r.column} {r.operator} {r.val1}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveRule(r.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pearson Correlation Heatmap */}
      {state.correlationMatrix && state.correlationMatrix.features.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Matriz de Correlación Lineal Bivariada (Pearson r)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Valores cercanos a +1 indican correlación positiva fuerte; cercanos a -1 indican relación inversa.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="text-center text-xs border-collapse font-mono">
              <thead>
                <tr>
                  <th className="p-2 text-left font-sans text-slate-400 font-normal">Variables</th>
                  {state.correlationMatrix.features.map(f => (
                    <th key={f} className="p-2 text-slate-700 font-semibold max-w-[100px] truncate" title={f}>
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.correlationMatrix.features.map((rowFeat, rIdx) => (
                  <tr key={rowFeat}>
                    <td className="p-2 text-left font-sans font-semibold text-slate-800 max-w-[120px] truncate" title={rowFeat}>
                      {rowFeat}
                    </td>
                    {state.correlationMatrix.matrix[rIdx].map((rVal, cIdx) => {
                      const abs = Math.abs(rVal);
                      let bg = 'bg-slate-50 text-slate-700';
                      if (rIdx === cIdx) {
                        bg = 'bg-slate-200 text-slate-900 font-bold';
                      } else if (rVal > 0.5) {
                        bg = 'bg-emerald-100 text-emerald-900 font-semibold';
                      } else if (rVal < -0.5) {
                        bg = 'bg-rose-100 text-rose-900 font-semibold';
                      } else if (abs > 0.25) {
                        bg = rVal > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800';
                      }

                      return (
                        <td key={cIdx} className={`p-2 border border-white tabular-nums ${bg}`}>
                          {rVal.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={6}
        stageTitle="Análisis Exploratorio y Estadísticas Descriptivas"
        isReadyToApprove={stats.length > 0}
        approvalRecord={state.stagesApproval[6]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
