import React from 'react';
import { Download, FileSpreadsheet, FileText, RotateCcw, Sparkles } from 'lucide-react';
import { AnalysisState } from '../../types';
import { exportAnalysisToExcel, exportEnrichedDataCSV } from '../../utils/exportHelpers';

interface AppHeaderProps {
  state: AnalysisState;
  onOpenReport: () => void;
  onReset: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ state, onOpenReport, onReset }) => {
  const isAnalysisReady = state.currentStage >= 9 && state.clusterAssignments.length > 0;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-semibold text-base shadow-sm">
          CI
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Cluster Intelligence
          </span>
          <div className="text-[11px] text-slate-500 whitespace-nowrap">
            {state.fileName ? `${state.fileName} · ${state.sector.toUpperCase()}` : 'Analítica & Segmentación de Mercados'}
          </div>
        </div>
      </div>

      {/* Zone 2: Contextual Navigation Info */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600">
        <span className="text-slate-400">Flujo Metodológico</span>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <span className="font-semibold text-slate-900">Etapa {state.currentStage} de 13</span>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <span className="text-slate-500">
          {state.stagesApproval[state.currentStage]?.title || 'Configuración'}
        </span>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {isAnalysisReady && (
          <>
            <button
              onClick={() => exportAnalysisToExcel(state)}
              title="Descargar libro Excel con datos enriquecidos, centroides y ROI"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => exportEnrichedDataCSV(state)}
              title="Exportar base de datos enriquecida con clústeres en CSV"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV</span>
            </button>
          </>
        )}

        <button
          onClick={onOpenReport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm transition-colors whitespace-nowrap"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Informe Ejecutivo</span>
        </button>

        <button
          onClick={onReset}
          title="Reiniciar análisis y volver a cargar datos"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
