import React from 'react';
import { ArrowRight, Binary, CheckCircle2, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { AnalysisState } from '../../types';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage4Props {
  state: AnalysisState;
  onApproveStage: (notes: string) => void;
  onBack: () => void;
}

export const Stage4Encoding: React.FC<Stage4Props> = ({ state, onApproveStage, onBack }) => {
  const log = state.transformationLog;
  const features = state.encodedFeaturesList;
  const encodedPreview = state.encodedRows.slice(0, 5);

  const isReady = features.length >= 2;
  const blockingReasons: string[] = [];
  if (features.length < 2) {
    blockingReasons.push('Se requieren al menos 2 dimensiones numéricas codificadas para el espacio métrico.');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 4: Preparación de Variables, Codificación y Dummies
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Transformación formal de variables para el espacio euclidiano. Las variables categóricas nominales se codifican mediante <strong>One-Hot Encoding</strong> para evitar la imposición de relaciones ordinales arbitrarias, mientras que las binarias se mapean a <code>[0, 1]</code> y los identificadores quedan rigurosamente excluidos del cálculo de distancias.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
          <span className="text-xs font-sans text-slate-500 block">Variables Originales Incluidas</span>
          <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {state.columnsMeta.filter(c => c.usageDecision === 'include').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
          <span className="text-xs font-sans text-slate-500 block">Dimensiones Métricas Finales (P*)</span>
          <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
            {features.length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
          <span className="text-xs font-sans text-slate-500 block">Identificadores Protegidos (Excluidos)</span>
          <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {state.columnsMeta.filter(c => c.usageDecision === 'identifier').length}
          </span>
        </div>
      </div>

      {/* Traceability Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-semibold text-slate-900">
            Tabla de Trazabilidad y Pipeline de Transformación
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-medium bg-slate-50/50">
                <th className="px-4 py-2.5 w-1/4">Variable Fuente</th>
                <th className="px-4 py-2.5 w-1/3">Técnica / Tratamiento Metodológico</th>
                <th className="px-4 py-2.5">Columnas Numéricas Resultantes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {log.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 font-semibold text-slate-900 font-mono">
                    {item.originalCol}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Binary className="w-3.5 h-3.5 text-slate-400" />
                      {item.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {item.outputCols.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {item.outputCols.map(outCol => (
                          <span
                            key={outCol}
                            className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200"
                          >
                            {outCol}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Excluida de la matriz de distancias</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Encoded Matrix Preview */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900">
            Vista Previa de la Matriz Numérica Codificada (Primeras 5 Filas)
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {state.encodedRows.length} registros × {features.length} atributos
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <th className="px-3 py-2 w-10 text-slate-400 font-mono">#</th>
                {features.map(f => (
                  <th key={f} className="px-3 py-2 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {encodedPreview.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50">
                  <td className="px-3 py-1.5 text-slate-400">{rIdx + 1}</td>
                  {features.map(f => (
                    <td key={f} className="px-3 py-1.5 tabular-nums text-slate-800 whitespace-nowrap">
                      {row[f] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={4}
        stageTitle="Preparación de Variables y Codificación"
        isReadyToApprove={isReady}
        blockingReasons={blockingReasons}
        approvalRecord={state.stagesApproval[4]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
