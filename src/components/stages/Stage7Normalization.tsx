import React, { useState } from 'react';
import { Scale, Check, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { AnalysisState, ScalingMethod } from '../../types';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage7Props {
  state: AnalysisState;
  onUpdateScalingMethod: (method: ScalingMethod) => void;
  onApproveStage: (notes: string) => void;
  onBack: () => void;
}

const METHODS: { id: ScalingMethod; name: string; formula: string; desc: string; bestFor: string }[] = [
  {
    id: 'zscore',
    name: 'Estandarización Z-Score (StandardScaler)',
    formula: 'z = (x - μ) / σ',
    desc: 'Transforma cada variable para tener media μ = 0 y desviación típica σ = 1.',
    bestFor: 'Recomendado estándar cuando las variables tienen distribución aproximadamente acampanada.',
  },
  {
    id: 'minmax',
    name: 'Normalización Min-Max [0, 1]',
    formula: 'x_norm = (x - x_min) / (x_max - x_min)',
    desc: 'Escala todos los valores al intervalo estrictamente delimitado [0, 1].',
    bestFor: 'Ideal cuando se combinan variables continuas con variables booleanas o dummies 0-1.',
  },
  {
    id: 'robust',
    name: 'Escalado Robusto (RobustScaler)',
    formula: 'x_rob = (x - Mediana) / IQR',
    desc: 'Utiliza la mediana y el rango intercuartílico (Q3 - Q1), insensible a colas pesadas.',
    bestFor: 'Óptimo ante presencia de valores atípicos (outliers) extremos en facturación o montos.',
  },
];

export const Stage7Normalization: React.FC<Stage7Props> = ({
  state,
  onUpdateScalingMethod,
  onApproveStage,
  onBack,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<ScalingMethod>(state.scalingMethod);
  const features = state.encodedFeaturesList;

  const handleSelect = (method: ScalingMethod) => {
    setSelectedMethod(method);
    onUpdateScalingMethod(method);
  };

  // Compute preview sample of before vs after scaling for first 5 rows and first 4 features
  const previewFeatures = features.slice(0, 4);
  const rawPreview = state.encodedRows.slice(0, 5);
  const scaledPreview = state.scaledMatrix.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 7: Normalización y Estandarización de Escalas
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Alineación de unidades de medida para el cálculo de distancias euclidianas. Sin estandarización, las variables con magnitudes numéricas elevadas (ej: ingresos en miles de USD) dominarían artificialmente las distancias sobre variables en escalas reducidas (ej: llamadas o días).
        </p>
      </div>

      {/* Method Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {METHODS.map((m) => {
          const isSelected = selectedMethod === m.id;
          return (
            <div
              key={m.id}
              onClick={() => handleSelect(m.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-400 text-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                    Método de Escalado
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <h3 className="text-sm font-bold">{m.name}</h3>
                <div className={`mt-2 font-mono text-xs px-2 py-1 rounded ${isSelected ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-800'}`}>
                  {m.formula}
                </div>
                <p className={`text-xs mt-2.5 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                  {m.desc}
                </p>
              </div>
              <div className={`mt-4 pt-2 border-t text-[11px] ${isSelected ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                {m.bestFor}
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Mathematical Methodological Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900 block mb-0.5">
            Fundamento Matemático de la Distancia Euclidiana:
          </span>
          <p>
            La distancia euclidiana entre dos observaciones <em>i</em> y <em>j</em> es <code>d(i, j) = √[Σ (x_ik - x_jk)²]</code>. La estandarización equipara la ponderación de cada dimensión en la métrica. Los parámetros de centrado y dispersión se guardan rigurosamente para desnormalizar e interpretar los centroides finales en sus unidades de negocio originales.
          </p>
        </div>
      </div>

      {/* Comparative Matrix: Before vs After Transformation */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900">
            Comparativa Directa: Escala Original vs Escala Normalizada ({selectedMethod.toUpperCase()})
          </span>
          <span className="text-[11px] font-mono text-slate-500">Primeras 5 observaciones</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Before */}
          <div className="p-4">
            <span className="text-xs font-semibold text-slate-700 block mb-2 font-mono">
              Valores en Unidades Originales:
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1 px-2 w-8">#</th>
                    {previewFeatures.map(f => (
                      <th key={f} className="py-1 px-2 max-w-[100px] truncate" title={f}>{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {rawPreview.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="py-1 px-2 text-slate-400">{rIdx + 1}</td>
                      {previewFeatures.map(f => (
                        <td key={f} className="py-1 px-2 tabular-nums text-slate-800">
                          {row[f] ?? 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* After */}
          <div className="p-4 bg-slate-50/50">
            <span className="text-xs font-semibold text-emerald-800 block mb-2 font-mono">
              Valores Tras Estandarización ({selectedMethod}):
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1 px-2 w-8">#</th>
                    {previewFeatures.map(f => (
                      <th key={f} className="py-1 px-2 max-w-[100px] truncate" title={f}>{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {scaledPreview.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="py-1 px-2 text-slate-400">{rIdx + 1}</td>
                      {previewFeatures.map((_, cIdx) => (
                        <td key={cIdx} className="py-1 px-2 tabular-nums text-emerald-900 font-semibold">
                          {row[cIdx]?.toFixed(3) ?? '0.000'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={7}
        stageTitle="Normalización y Estandarización"
        isReadyToApprove={state.scaledMatrix.length > 0}
        approvalRecord={state.stagesApproval[7]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
