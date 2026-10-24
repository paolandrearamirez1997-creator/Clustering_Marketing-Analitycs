import React, { useState } from 'react';
import { SlidersHorizontal, AlertCircle, Info, ShieldAlert, Check } from 'lucide-react';
import { AnalysisState, ColumnMetadata, VariableType, VariableUsageDecision } from '../../types';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage3Props {
  state: AnalysisState;
  onUpdateColumnsMeta: (updatedMeta: ColumnMetadata[]) => void;
  onApproveStage: (notes: string) => void;
  onBack: () => void;
}

const TYPE_LABELS: Record<VariableType, string> = {
  numeric_continuous: 'Numérica Continua',
  numeric_discrete: 'Numérica Discreta',
  categorical_nominal: 'Categórica Nominal',
  categorical_ordinal: 'Categórica Ordinal',
  boolean: 'Booleana / Binaria',
  date: 'Fecha / Temporal',
  identifier: 'Identificador Único',
  free_text: 'Texto Libre / Alta Cardinalidad',
};

export const Stage3Classification: React.FC<Stage3Props> = ({
  state,
  onUpdateColumnsMeta,
  onApproveStage,
  onBack,
}) => {
  const [cols, setCols] = useState<ColumnMetadata[]>(state.columnsMeta);

  const handleTypeChange = (colName: string, newType: VariableType) => {
    const updated = cols.map(c => {
      if (c.name === colName) {
        let newDecision = c.usageDecision;
        if (newType === 'identifier') newDecision = 'identifier';
        if (newType === 'free_text' || newType === 'date') newDecision = 'exclude';
        return { ...c, confirmedType: newType, usageDecision: newDecision };
      }
      return c;
    });
    setCols(updated);
    onUpdateColumnsMeta(updated);
  };

  const handleDecisionChange = (colName: string, newDecision: VariableUsageDecision) => {
    const updated = cols.map(c => {
      if (c.name === colName) {
        return { ...c, usageDecision: newDecision };
      }
      return c;
    });
    setCols(updated);
    onUpdateColumnsMeta(updated);
  };

  const includedCount = cols.filter(c => c.usageDecision === 'include').length;
  const excludedCount = cols.filter(c => c.usageDecision === 'exclude').length;
  const idCount = cols.filter(c => c.usageDecision === 'identifier').length;

  const isReady = includedCount >= 2;
  const blockingReasons: string[] = [];
  if (includedCount < 2) {
    blockingReasons.push('Debe incluir al menos 2 variables numéricas o codificables para que el clustering euclidiano tenga sentido geométrico.');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 3: Identificación, Clasificación y Selección de Variables
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Revise la clasificación heurística de tipos de datos. Confirme cuáles variables deben participar en el cálculo de distancias euclidianas del clustering, excluya identificadores únicos para evitar sobreajuste y descarte atributos con alta cardinalidad o varianza nula.
        </p>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800 font-medium block">Variables para Clustering</span>
            <span className="text-xl font-bold text-emerald-950 font-mono tabular-nums">{includedCount}</span>
          </div>
          <span className="text-xs font-mono text-emerald-700 font-semibold">INCLUIDAS</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 font-medium block">Identificadores Únicos</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{idCount}</span>
          </div>
          <span className="text-xs font-mono text-slate-500 font-semibold">PRESERVADAS</span>
        </div>

        <div className="bg-rose-50/60 border border-rose-200 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-800 font-medium block">Variables Excluidas</span>
            <span className="text-xl font-bold text-rose-950 font-mono tabular-nums">{excludedCount}</span>
          </div>
          <span className="text-xs font-mono text-rose-700 font-semibold">DESCARTADAS</span>
        </div>
      </div>

      {/* Scientific Methodological Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900 block mb-0.5">
            Criterio Metodológico de Distancias Euclidianas:
          </span>
          <p>
            K-Means opera en espacios métricos continuos mediante distancia euclidiana <em>L2</em>. Los identificadores únicos (IDs) crean agrupaciones espurias y deben excluirse de las coordenadas. Las variables nominales serán codificadas en la siguiente etapa (One-Hot) para no imponer un orden aritmético artificial.
          </p>
        </div>
      </div>

      {/* Interactive Classification Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <th className="px-4 py-3">Nombre Variable</th>
                <th className="px-4 py-3">Tipo Confirmado</th>
                <th className="px-4 py-3 text-right">Valores Únicos</th>
                <th className="px-4 py-3 text-right">Faltantes (%)</th>
                <th className="px-4 py-3">Muestra de Valores</th>
                <th className="px-4 py-3">Decisión en Modelo</th>
                <th className="px-4 py-3">Recomendación Heurística</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cols.map((col) => {
                const isId = col.usageDecision === 'identifier';
                const isExcluded = col.usageDecision === 'exclude';
                const isIncluded = col.usageDecision === 'include';

                return (
                  <tr key={col.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {col.name}
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={col.confirmedType}
                        onChange={(e) => handleTypeChange(col.name, e.target.value as VariableType)}
                        className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                      >
                        {Object.entries(TYPE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                      {col.uniqueValuesCount}
                    </td>

                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      <span className={col.missingPercentage > 0 ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                        {col.missingPercentage}%
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 max-w-[180px] truncate" title={col.sampleValues.join(', ')}>
                      {col.sampleValues.join(', ')}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md w-fit">
                        <button
                          type="button"
                          onClick={() => handleDecisionChange(col.name, 'include')}
                          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                            isIncluded ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Incluir
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecisionChange(col.name, 'exclude')}
                          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                            isExcluded ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Excluir
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecisionChange(col.name, 'identifier')}
                          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                            isId ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ID
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {col.recommendation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={3}
        stageTitle="Identificación y Clasificación de Variables"
        isReadyToApprove={isReady}
        blockingReasons={blockingReasons}
        approvalRecord={state.stagesApproval[3]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
