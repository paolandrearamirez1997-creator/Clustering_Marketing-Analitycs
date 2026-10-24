import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { StageApproval } from '../../types';

interface StageProgressBarProps {
  currentStage: number;
  stagesApproval: Record<number, StageApproval>;
  onSelectStage: (stageId: number) => void;
}

export const STAGE_TITLES: { id: number; title: string; shortTitle: string }[] = [
  { id: 1, title: 'Carga de Archivo & Sector Económico', shortTitle: 'Carga & Sector' },
  { id: 2, title: 'Exploración Inicial & Diagnóstico Estructural', shortTitle: 'Exploración Head()' },
  { id: 3, title: 'Identificación & Clasificación de Variables', shortTitle: 'Clasificación Variables' },
  { id: 4, title: 'Preparación, Codificación & Dummies', shortTitle: 'Codificación' },
  { id: 5, title: 'Limpieza de Datos Faltantes & Imputación', shortTitle: 'Imputación' },
  { id: 6, title: 'Análisis Exploratorio & Reglas de Negocio', shortTitle: 'Estadística & Histogramas' },
  { id: 7, title: 'Normalización & Estandarización de Escalas', shortTitle: 'Escalado Z-Score' },
  { id: 8, title: 'Selección del Número Óptimo de Clústeres (k)', shortTitle: 'Método del Codo & Silueta' },
  { id: 9, title: 'Ejecución Algoritmo K-Means & PCA 2D', shortTitle: 'K-Means & Proyección' },
  { id: 10, title: 'Análisis de Centroides & Relevancia', shortTitle: 'Centroides Originales' },
  { id: 11, title: 'Interpretación de Negocio & Evaluación ROI', shortTitle: 'Simulación ROI' },
  { id: 12, title: 'Perfilamiento de Segmentos por Sector', shortTitle: 'Perfiles de Clúster' },
  { id: 13, title: 'Estrategias Comerciales & Plan de Acción', shortTitle: 'Estrategias 4P+I+R' },
];

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  currentStage,
  stagesApproval,
  onSelectStage,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-2.5 overflow-x-auto scrollbar-thin">
      <div className="flex items-center gap-1.5 min-w-[1100px]">
        {STAGE_TITLES.map((stage) => {
          const approval = stagesApproval[stage.id];
          const isCurrent = currentStage === stage.id;
          const isApproved = approval?.status === 'approved';
          const isReview = approval?.status === 'needs_review';
          const isUnlocked = isApproved || stage.id <= currentStage;

          let badgeBg = 'bg-slate-100 text-slate-500 hover:bg-slate-200';
          if (isCurrent) {
            badgeBg = 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900';
          } else if (isApproved) {
            badgeBg = 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100';
          } else if (isReview) {
            badgeBg = 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100';
          }

          return (
            <button
              key={stage.id}
              onClick={() => {
                if (isUnlocked) onSelectStage(stage.id);
              }}
              disabled={!isUnlocked}
              title={`${stage.id}. ${stage.title} (${approval?.status || 'pendiente'})`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${badgeBg} ${
                !isUnlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <span className="font-mono font-semibold text-[11px] opacity-80">
                {String(stage.id).padStart(2, '0')}.
              </span>
              <span>{stage.shortTitle}</span>
              {isApproved && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              {isReview && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              {!isApproved && !isReview && !isCurrent && (
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
