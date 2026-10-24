import React, { useState } from 'react';
import { Package, Tag, Lightbulb, MessageSquare, DollarSign, Calendar, CheckCircle2, Award, FileText } from 'lucide-react';
import { AnalysisState, CommercialStrategy } from '../../types';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage13Props {
  state: AnalysisState;
  onUpdateStrategies: (updated: CommercialStrategy[]) => void;
  onApproveStage: (notes: string) => void;
  onOpenReport: () => void;
  onBack: () => void;
}

const CLUSTER_COLORS = ['#0284C7', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#0D9488'];

export const Stage13CommercialStrategies: React.FC<Stage13Props> = ({
  state,
  onUpdateStrategies,
  onApproveStage,
  onOpenReport,
  onBack,
}) => {
  const [selectedClusterIdx, setSelectedClusterIdx] = useState<number>(0);
  const strategies = state.strategies || [];

  const currentStrategy = strategies[selectedClusterIdx];
  const isReady = strategies.length > 0;
  const isApproved = state.stagesApproval[13]?.status === 'approved';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Etapa 13: Estrategias Comerciales por Segmento (Matriz 4P + Innovación + ROI + Plan)
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-4xl">
            Formulación táctica de iniciativas específicas por clúster: Producto, Precio, Innovación, Comunicación, Rentabilidad y Plan de Implementación con KPIs y responsables asignados.
          </p>
        </div>

        {isApproved && (
          <button
            onClick={onOpenReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap self-start md:self-auto"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ver Informe Ejecutivo Completo</span>
          </button>
        )}
      </div>

      {/* Segment Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-lg overflow-x-auto">
        {strategies.map((strat, idx) => {
          const isSelected = selectedClusterIdx === idx;
          const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];

          return (
            <button
              key={strat.clusterIndex}
              onClick={() => setSelectedClusterIdx(idx)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                isSelected ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
              <span>Clúster {strat.clusterIndex}: {strat.clusterName}</span>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                Prioridad {strat.priorityScore}/10
              </span>
            </button>
          );
        })}
      </div>

      {currentStrategy && (
        <div className="space-y-6">
          {/* Tactical 4P + Innovation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Producto */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Package className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  1. Estrategia de Producto y Portafolio
                </h3>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {currentStrategy.productStrategy.offeringTitle}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  {currentStrategy.productStrategy.description}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Funcionalidades Prioritarias:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-600">
                  {currentStrategy.productStrategy.priorityFeatures.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 2. Precio */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Tag className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  2. Estrategia de Precio y Monetización
                </h3>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {currentStrategy.pricingStrategy.model}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  {currentStrategy.pricingStrategy.discountOrBundle}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-slate-700 block mb-0.5">
                  Justificación Económica:
                </span>
                <p>{currentStrategy.pricingStrategy.rationale}</p>
              </div>
            </div>

            {/* 3. Innovación */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  3. Innovación & Experiencia Digital
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                {currentStrategy.innovationStrategy.digitalExperience}
              </p>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Nuevas Capacidades Clave:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-600">
                  {currentStrategy.innovationStrategy.capabilities.map((cap, i) => (
                    <li key={i}>{cap}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4. Comunicación */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  4. Comunicación & Mensajes Clave
                </h3>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-700 block">
                  Propuesta de Valor Central:
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  "{currentStrategy.communicationStrategy.valueProposition}"
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div>
                  <span className="font-semibold text-slate-700">Canales Recomendados: </span>
                  <span>{currentStrategy.communicationStrategy.preferredChannels.join(', ')}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Acción de Retención: </span>
                  <span>{currentStrategy.communicationStrategy.retentionAction}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Action Plan & KPIs Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-semibold text-slate-900">
                  Plan de Acción Táctico e Indicadores de Éxito (KPIs)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Criterio de Éxito: {currentStrategy.implementationPlan.successCriteria}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <th className="px-4 py-2.5 w-1/2">Iniciativa / Acción Táctica</th>
                    <th className="px-4 py-2.5">Responsable</th>
                    <th className="px-4 py-2.5 text-center">Plazo (Mes)</th>
                    <th className="px-4 py-2.5">KPI Clave de Seguimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentStrategy.implementationPlan.actionItems.map((item, iIdx) => (
                    <tr key={iIdx} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        {item.action}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-sans">
                        {item.owner}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono tabular-nums text-slate-800 font-bold">
                        M+{item.monthDeadline}
                      </td>
                      <td className="px-4 py-2.5 text-emerald-800 font-mono text-[11px]">
                        {item.kpi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategic Prioritization Matrix */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 mb-3">
              Matriz Comparativa de Priorización Estratégica
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                    <th className="py-2 px-3 font-sans font-medium">Segmento</th>
                    <th className="py-2 px-3 text-center">Prioridad (1-10)</th>
                    <th className="py-2 px-3 text-center">Atractivo Comercial</th>
                    <th className="py-2 px-3 text-center">Factibilidad Operativa</th>
                    <th className="py-2 px-3 text-right">ROI Esperado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {strategies.map((strat) => {
                    const roi = state.roiModels[strat.clusterIndex]?.scenarios.base.roiPercent ?? 0;
                    return (
                      <tr key={strat.clusterIndex} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                          Clúster {strat.clusterIndex}: {strat.clusterName}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-900">
                          {strat.priorityScore}/10
                        </td>
                        <td className="py-2 px-3 text-center font-sans">
                          {strat.priorityScore >= 8 ? (
                            <span className="text-emerald-800 font-semibold">Muy Alto</span>
                          ) : (
                            <span className="text-slate-600 font-medium">Moderado</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-sans text-slate-600">
                          {strat.priorityScore >= 8 ? 'Inmediata' : 'Mediano Plazo'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-800">
                          {roi}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={13}
        stageTitle="Estrategias Comerciales por Segmento"
        isReadyToApprove={isReady}
        approvalRecord={state.stagesApproval[13]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
