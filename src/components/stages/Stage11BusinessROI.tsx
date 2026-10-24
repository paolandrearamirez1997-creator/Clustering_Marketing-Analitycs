import React, { useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Calculator, Sliders, Layers } from 'lucide-react';
import { AnalysisState, ClusterBusinessROI } from '../../types';
import { buildROIScenarios } from '../../utils/statisticalEngine';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage11Props {
  state: AnalysisState;
  onUpdateROIModels: (updatedModels: ClusterBusinessROI[]) => void;
  onApproveStage: (notes: string) => void;
  onBack: () => void;
}

export const Stage11BusinessROI: React.FC<Stage11Props> = ({
  state,
  onUpdateROIModels,
  onApproveStage,
  onBack,
}) => {
  const [selectedClusterIdx, setSelectedClusterIdx] = useState<number>(0);
  const [models, setModels] = useState<ClusterBusinessROI[]>(state.roiModels || []);

  const currentModel = models[selectedClusterIdx];

  const handleParamChange = (
    field: 'investmentPerCustomer' | 'incrementalSpendPerCustomer' | 'contributionMargin' | 'horizonMonths',
    val: number
  ) => {
    const updated = models.map((m, idx) => {
      if (idx === selectedClusterIdx) {
        const newParams = { ...m.baseParams, [field]: val };
        const newScenarios = buildROIScenarios(
          m.targetPopulation,
          newParams.investmentPerCustomer,
          newParams.incrementalSpendPerCustomer,
          newParams.contributionMargin,
          newParams.horizonMonths
        );
        return { ...m, baseParams: newParams, scenarios: newScenarios };
      }
      return m;
    });

    setModels(updated);
    onUpdateROIModels(updated);
  };

  const isReady = models.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 11: Interpretación de Negocio y Evaluación Financiera del ROI
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Modelación económica del retorno de inversión comercial bajo la fórmula estándar{' '}
          <code>ROI (%) = ((Beneficios Incrementales - Costos Incrementales) / Costos Incrementales) × 100</code>.
          Simulación en tres escenarios de riesgo (Conservador, Base, Optimista).
        </p>
      </div>

      {/* Cluster Tab Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-lg overflow-x-auto">
        {models.map((m, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedClusterIdx(idx)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
              selectedClusterIdx === idx ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Clúster {m.clusterIndex}: {m.clusterName}</span>
            <span className="font-mono text-emerald-800 font-bold text-[11px]">
              ROI Base: {m.scenarios.base.roiPercent}%
            </span>
          </button>
        ))}
      </div>

      {currentModel && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Parameters Inputs */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Calculator className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Parámetros Financieros (Clúster {currentModel.clusterIndex})
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-600 font-sans text-xs mb-1">
                  Población Objetivo Asignada:
                </label>
                <input
                  type="text"
                  disabled
                  value={`${currentModel.targetPopulation} clientes`}
                  className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-sans text-xs mb-1">
                  Inversión en Captación/Retención por Cliente ($):
                </label>
                <input
                  type="number"
                  min={1}
                  value={currentModel.baseParams.investmentPerCustomer}
                  onChange={(e) => handleParamChange('investmentPerCustomer', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-sans text-xs mb-1">
                  Ingreso Bruto Incremental Esperado / Cliente ($):
                </label>
                <input
                  type="number"
                  min={1}
                  value={currentModel.baseParams.incrementalSpendPerCustomer}
                  onChange={(e) => handleParamChange('incrementalSpendPerCustomer', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-sans text-xs mb-1">
                  Margen de Contribución (%):
                </label>
                <input
                  type="number"
                  step={0.05}
                  min={0.05}
                  max={1.0}
                  value={currentModel.baseParams.contributionMargin}
                  onChange={(e) => handleParamChange('contributionMargin', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 font-sans">
                  Ej: 0.40 = 40% de margen bruto tras costos directos
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-sans text-xs mb-1">
                  Horizonte de Evaluación (Meses):
                </label>
                <input
                  type="number"
                  min={3}
                  max={36}
                  value={currentModel.baseParams.horizonMonths}
                  onChange={(e) => handleParamChange('horizonMonths', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 block">Tipo de Estimación:</span>
              <span>ROI Estimado con Supuestos Parametrizados (requiere validación con piloto comercial).</span>
            </div>
          </div>

          {/* 3 Risk-Adjusted Scenarios Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Conservador */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Escenario Conservador
                  </span>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                      {currentModel.scenarios.conservador.roiPercent}%
                    </span>
                    <span className="text-xs text-slate-500 block font-mono">Retorno ROI</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Inversión Total:</span>
                    <span>${currentModel.scenarios.conservador.initialInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beneficio Neto:</span>
                    <span>${currentModel.scenarios.conservador.incrementalNetBenefits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payback:</span>
                    <span>{currentModel.scenarios.conservador.paybackMonths} meses</span>
                  </div>
                </div>
              </div>

              {/* Base */}
              <div className="bg-emerald-50/60 border border-emerald-300 rounded-lg p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block">
                      Escenario Base (Esperado)
                    </span>
                    <span className="px-1.5 py-0.5 bg-emerald-200/80 text-emerald-950 font-sans font-bold text-[10px] rounded">
                      Focal
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-emerald-950 tabular-nums">
                      {currentModel.scenarios.base.roiPercent}%
                    </span>
                    <span className="text-xs text-emerald-800 block font-mono">Retorno ROI</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-200 text-[11px] font-mono space-y-1 text-emerald-900">
                  <div className="flex justify-between">
                    <span>Inversión Total:</span>
                    <span>${currentModel.scenarios.base.initialInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beneficio Neto:</span>
                    <span>${currentModel.scenarios.base.incrementalNetBenefits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payback:</span>
                    <span className="font-bold">{currentModel.scenarios.base.paybackMonths} meses</span>
                  </div>
                </div>
              </div>

              {/* Optimista */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Escenario Optimista
                  </span>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                      {currentModel.scenarios.optimista.roiPercent}%
                    </span>
                    <span className="text-xs text-slate-500 block font-mono">Retorno ROI</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Inversión Total:</span>
                    <span>${currentModel.scenarios.optimista.initialInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beneficio Neto:</span>
                    <span>${currentModel.scenarios.optimista.incrementalNetBenefits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payback:</span>
                    <span>{currentModel.scenarios.optimista.paybackMonths} meses</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cross-Cluster Comparative Table */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">
                  Comparativa de Retorno Financiero entre Todos los Segmentos
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Horizonte: {currentModel.baseParams.horizonMonths} meses
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                      <th className="py-2 px-3">Segmento</th>
                      <th className="py-2 px-3 text-right">Población</th>
                      <th className="py-2 px-3 text-right">Inversión Base ($)</th>
                      <th className="py-2 px-3 text-right">Beneficio Neto ($)</th>
                      <th className="py-2 px-3 text-right font-bold text-slate-800">ROI Base (%)</th>
                      <th className="py-2 px-3 text-right">Payback (meses)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {models.map(m => (
                      <tr key={m.clusterIndex} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                          Clúster {m.clusterIndex}: {m.clusterName}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-700">
                          {m.targetPopulation}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-700">
                          ${m.scenarios.base.initialInvestment.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-700">
                          ${m.scenarios.base.incrementalNetBenefits.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-bold text-emerald-800">
                          {m.scenarios.base.roiPercent}%
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-700">
                          {m.scenarios.base.paybackMonths}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={11}
        stageTitle="Interpretación de Negocio y Evaluación del ROI"
        isReadyToApprove={isReady}
        approvalRecord={state.stagesApproval[11]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
