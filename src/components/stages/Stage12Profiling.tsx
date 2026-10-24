import React, { useState } from 'react';
import { Users, CheckCircle2, AlertTriangle, Edit3, Compass, Sparkles, ShieldAlert } from 'lucide-react';
import { AnalysisState, SegmentProfile } from '../../types';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage12Props {
  state: AnalysisState;
  onUpdateProfiles: (updatedProfiles: SegmentProfile[]) => void;
  onApproveStage: (notes: string) => void;
  onBack: () => void;
}

const CLUSTER_COLORS = ['#0284C7', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#0D9488'];

export const Stage12Profiling: React.FC<Stage12Props> = ({
  state,
  onUpdateProfiles,
  onApproveStage,
  onBack,
}) => {
  const [profiles, setProfiles] = useState<SegmentProfile[]>(state.profiles || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleNameChange = (idx: number, newName: string) => {
    const updated = profiles.map((p, i) => (i === idx ? { ...p, name: newName } : p));
    setProfiles(updated);
    onUpdateProfiles(updated);
  };

  const handleTaglineChange = (idx: number, newTagline: string) => {
    const updated = profiles.map((p, i) => (i === idx ? { ...p, archetypeTagline: newTagline } : p));
    setProfiles(updated);
    onUpdateProfiles(updated);
  };

  const isReady = profiles.length >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 12: Perfilamiento de Segmentos por Sector Económico ({state.sector.toUpperCase()})
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Fichas ejecutivas de arquetipos de clientes construidas a partir de la evidencia empírica observada. Los nombres y descriptores reflejan comportamientos reales sin asumir estereotipos infundados.
        </p>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profiles.map((profile, idx) => {
          const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
          const isEditing = editingIndex === idx;

          return (
            <div
              key={profile.clusterIndex}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header row of card */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                      <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">
                        Clúster {profile.clusterIndex} · {profile.population} observaciones ({profile.sharePercentage}%)
                      </span>
                    </div>

                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleNameChange(idx, e.target.value)}
                        className="w-full mt-1 px-2 py-1 text-sm font-bold text-slate-900 border border-slate-300 rounded"
                      />
                    ) : (
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {profile.name}
                      </h3>
                    )}

                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.archetypeTagline}
                        onChange={(e) => handleTaglineChange(idx, e.target.value)}
                        className="w-full mt-1 px-2 py-1 text-xs text-slate-600 border border-slate-300 rounded"
                      />
                    ) : (
                      <p className="text-xs text-slate-500 mt-0.5 italic">
                        "{profile.archetypeTagline}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setEditingIndex(isEditing ? null : idx)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                    title="Editar nombre y lema del segmento"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Behavioral & Observed Traits */}
                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block mb-1">
                      Comportamientos Observados en Datos:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                      {profile.observedBehaviors.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-800 block mb-1">
                      Necesidades y Puntos de Dolor Identificados:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                      {profile.unmetNeeds.map((need, nIdx) => (
                        <li key={nIdx}>{need}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-800 block mb-1 text-emerald-800">
                      Oportunidades Comerciales Prioritarias:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                      {profile.commercialOpportunities.map((opp, oIdx) => (
                        <li key={oIdx}>{opp}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-800 block mb-1 text-amber-800">
                      Riesgos y Limitaciones de Información:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                      {profile.risksAndConstraints.map((risk, rIdx) => (
                        <li key={rIdx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer Trust Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Nivel de Confianza: <strong className="text-slate-800 font-sans">{profile.confidenceLevel}</strong></span>
                <span>Sector: {state.sector}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={12}
        stageTitle="Perfilamiento de Segmentos por Sector"
        isReadyToApprove={isReady}
        approvalRecord={state.stagesApproval[12]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
