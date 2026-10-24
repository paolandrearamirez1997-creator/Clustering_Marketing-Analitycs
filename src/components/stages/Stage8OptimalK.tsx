import React, { useState } from 'react';
import { Target, TrendingDown, Award, Info, Check, HelpCircle } from 'lucide-react';
import { AnalysisState } from '../../types';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage8Props {
  state: AnalysisState;
  onUpdateKSelection: (k: number, justification: string) => void;
  onApproveStage: (notes: string) => void;
  onBack: () => void;
}

export const Stage8OptimalK: React.FC<Stage8Props> = ({
  state,
  onUpdateKSelection,
  onApproveStage,
  onBack,
}) => {
  const [selectedK, setSelectedK] = useState<number>(state.kmeansConfig.k || state.recommendedK || 3);
  const [justification, setJustification] = useState<string>(
    state.kSelectionJustification ||
      'Se selecciona k=3 debido a la inflexión en el método del codo y una silueta representativa, permitiendo una diferenciación comercial clara y ejecutable para el equipo comercial.'
  );

  const kEval = state.kEvaluation;

  const handleKChange = (k: number) => {
    setSelectedK(k);
    onUpdateKSelection(k, justification);
  };

  const handleJustificationChange = (text: string) => {
    setJustification(text);
    onUpdateKSelection(selectedK, text);
  };

  // Find max/min for chart scaling
  const maxInertia = Math.max(...kEval.map(e => e.inertia));
  const minInertia = Math.min(...kEval.map(e => e.inertia));
  const maxSil = Math.max(...kEval.map(e => e.silhouette));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 8: Definición y Selección del Número Óptimo de Clústeres (k)
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Evaluación conjunta mediante el <strong>Método del Codo (Inertia WCSS)</strong> y el <strong>Coeficiente de Silueta</strong> (Rousseeuw, 1987), contrastados con la viabilidad comercial y la capacidad operativa del sector.
        </p>
      </div>

      {/* Recommended Choice Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Diagnóstico Metodológico Recomendado
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            k = {state.recommendedK} Segmentos Estratégicos
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Presenta el mejor balance entre cohesión interna (WCSS), separación entre centroides y capacidad de ejecución comercial en {state.sector}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[2, 3, 4, 5, 6].map((kVal) => (
            <button
              key={kVal}
              onClick={() => handleKChange(kVal)}
              className={`w-9 h-9 rounded-md font-mono text-xs font-bold transition-all ${
                selectedK === kVal
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              k={kVal}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Interactive Charts: Elbow and Silhouette */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Elbow Curve */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-900">
                1. Curva del Codo (Inertia / WCSS)
              </h4>
              <p className="text-[11px] text-slate-500">
                Suma de cuadrados de distancias intra-clúster. Se busca el punto de inflexión.
              </p>
            </div>
          </div>

          <div className="h-52 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
              <line x1="20" y1="140" x2="380" y2="140" stroke="#E2E8F0" strokeWidth="1" />
              {/* Polyline */}
              {kEval.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#0F172A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={kEval
                    .map((item, idx) => {
                      const x = 30 + (idx / (kEval.length - 1)) * 340;
                      const y = 130 - ((item.inertia - minInertia) / (maxInertia - minInertia || 1)) * 110;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Data points */}
              {kEval.map((item, idx) => {
                const x = 30 + (idx / (kEval.length - 1)) * 340;
                const y = 130 - ((item.inertia - minInertia) / (maxInertia - minInertia || 1)) * 110;
                const isCurrent = selectedK === item.k;

                return (
                  <g key={item.k} className="cursor-pointer" onClick={() => handleKChange(item.k)}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isCurrent ? 6 : 4}
                      fill={isCurrent ? '#059669' : '#0F172A'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text x={x} y={155} textAnchor="middle" className="text-[10px] font-mono fill-slate-500">
                      k={item.k}
                    </text>
                    <text x={x} y={y - 8} textAnchor="middle" className={`text-[9px] font-mono ${isCurrent ? 'fill-emerald-700 font-bold' : 'fill-slate-600'}`}>
                      {Math.round(item.inertia)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Silhouette Curve */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-900">
                2. Coeficiente de Silueta Global
              </h4>
              <p className="text-[11px] text-slate-500">
                Mide cohesión vs separación inter-clúster (Rousseeuw 1987). Valores &gt; 0.4 indican buena separación.
              </p>
            </div>
          </div>

          <div className="h-52 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
              <line x1="20" y1="140" x2="380" y2="140" stroke="#E2E8F0" strokeWidth="1" />
              {/* Polyline */}
              {kEval.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={kEval
                    .map((item, idx) => {
                      const x = 30 + (idx / (kEval.length - 1)) * 340;
                      const y = 130 - (item.silhouette / (maxSil * 1.2 || 1)) * 110;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Data points */}
              {kEval.map((item, idx) => {
                const x = 30 + (idx / (kEval.length - 1)) * 340;
                const y = 130 - (item.silhouette / (maxSil * 1.2 || 1)) * 110;
                const isCurrent = selectedK === item.k;

                return (
                  <g key={item.k} className="cursor-pointer" onClick={() => handleKChange(item.k)}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isCurrent ? 6 : 4}
                      fill={isCurrent ? '#059669' : '#0F172A'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text x={x} y={155} textAnchor="middle" className="text-[10px] font-mono fill-slate-500">
                      k={item.k}
                    </text>
                    <text x={x} y={y - 8} textAnchor="middle" className={`text-[10px] font-mono font-bold ${isCurrent ? 'fill-emerald-700' : 'fill-slate-600'}`}>
                      {item.silhouette.toFixed(2)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Justification & Business Context Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <label className="block text-xs font-semibold text-slate-900">
          Justificación Metodológica y Comercial del Valor de k Seleccionado *
        </label>
        <p className="text-xs text-slate-500">
          El principio rector exige que el número de segmentos no sea fijado de manera arbitraria o puramente estadística. Describa cómo este número de grupos se articula con los recursos y capacidades del negocio.
        </p>
        <textarea
          rows={3}
          value={justification}
          onChange={(e) => handleJustificationChange(e.target.value)}
          placeholder="Registre aquí los motivos de negocio para la cantidad de segmentos elegida..."
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
        />
      </div>

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={8}
        stageTitle="Selección del Número de Clústeres (k)"
        isReadyToApprove={selectedK >= 2 && justification.trim().length > 10}
        blockingReasons={
          justification.trim().length <= 10
            ? ['Debe documentar una justificación de negocio para el valor de k seleccionado.']
            : []
        }
        approvalRecord={state.stagesApproval[8]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
