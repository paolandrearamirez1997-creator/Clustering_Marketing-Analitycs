import React, { useState } from 'react';
import { Eye, Layers, Copy, Hash, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AnalysisState } from '../../types';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage2Props {
  state: AnalysisState;
  onApproveStage: (notes: string) => void;
  onBack: () => void;
}

export const Stage2Exploration: React.FC<Stage2Props> = ({ state, onApproveStage, onBack }) => {
  const [viewMode, setViewMode] = useState<'head' | 'all'>('head');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const rows = state.rawRows;
  const cols = state.columnsMeta;
  const totalRows = rows.length;
  const totalCols = cols.length;

  // Duplicate rows detection
  const seenJson = new Set<string>();
  let duplicateRowCount = 0;
  rows.forEach(r => {
    const json = JSON.stringify(r);
    if (seenJson.has(json)) {
      duplicateRowCount++;
    } else {
      seenJson.add(json);
    }
  });

  // Empty columns detection
  const emptyCols = cols.filter(c => c.missingPercentage === 100);
  // Constant columns (unique count = 1)
  const constantCols = cols.filter(c => c.uniqueValuesCount === 1);
  // Identifiers
  const potentialIds = cols.filter(c => c.detectedType === 'identifier');

  // Rows to display
  const displayedRows = viewMode === 'head' 
    ? rows.slice(0, 5) 
    : rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const totalPages = Math.ceil(totalRows / rowsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 2: Exploración Inicial de los Datos y Diagnóstico Estructural
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Visualice las primeras 5 observaciones de la muestra (<code>head()</code>), verifique la integridad tabular, identifique registros duplicados, columnas vacías o invariantes, y examine la coherencia dimensional.
        </p>
      </div>

      {/* Structural Diagnostics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
          <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider block">Registros (N)</span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">{totalRows}</span>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
          <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider block">Variables (P)</span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">{totalCols}</span>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
          <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider block">Filas Duplicadas</span>
          <span className={`text-lg font-bold tabular-nums ${duplicateRowCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {duplicateRowCount}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
          <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider block">Columnas Vacías</span>
          <span className={`text-lg font-bold tabular-nums ${emptyCols.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {emptyCols.length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
          <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider block">Columnas Constantes</span>
          <span className={`text-lg font-bold tabular-nums ${constantCols.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {constantCols.length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs">
          <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider block">Identificadores (ID)</span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">{potentialIds.length}</span>
        </div>
      </div>

      {/* Warnings & Structural Checks */}
      {(duplicateRowCount > 0 || emptyCols.length > 0 || constantCols.length > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Observaciones de Diagnóstico Estructural:</span>
          </div>
          {duplicateRowCount > 0 && (
            <p>· Se detectaron {duplicateRowCount} filas idénticas duplicadas en la base cargada.</p>
          )}
          {emptyCols.length > 0 && (
            <p>· Las columnas <strong>{emptyCols.map(c => c.name).join(', ')}</strong> están 100% vacías y deben ser excluidas.</p>
          )}
          {constantCols.length > 0 && (
            <p>· Las columnas <strong>{constantCols.map(c => c.name).join(', ')}</strong> poseen varianza cero (valor único) y no aportan poder de separación de clústeres.</p>
          )}
        </div>
      )}

      {/* Head Table Viewport */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-semibold text-slate-900">
              {viewMode === 'head' ? 'Vista Preliminar: head(5) primeras filas' : `Visualización Paginada (Filas ${(currentPage - 1) * rowsPerPage + 1} a ${Math.min(currentPage * rowsPerPage, totalRows)})`}
            </span>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
            <button
              onClick={() => setViewMode('head')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'head' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              head(5)
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paginado Completo
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <th className="px-3.5 py-2.5 w-12 font-mono text-slate-400">#</th>
                {cols.map((col) => (
                  <th key={col.name} className="px-3.5 py-2.5 whitespace-nowrap">
                    <div>
                      <span className="font-semibold text-slate-800">{col.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">
                        {col.detectedType}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRows.map((row, rIdx) => {
                const actualIndex = viewMode === 'head' ? rIdx + 1 : (currentPage - 1) * rowsPerPage + rIdx + 1;
                return (
                  <tr key={rIdx} className="hover:bg-slate-50 transition-colors font-mono text-[11px]">
                    <td className="px-3.5 py-2 text-slate-400">{actualIndex}</td>
                    {cols.map((col) => {
                      const val = row[col.name];
                      const isNull = val === null || val === undefined || val === '';
                      return (
                        <td key={col.name} className={`px-3.5 py-2 whitespace-nowrap ${isNull ? 'text-rose-500 italic font-sans' : 'text-slate-700'}`}>
                          {isNull ? 'null' : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {viewMode === 'all' && (
          <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Página {currentPage} de {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-slate-100 disabled:opacity-50 hover:bg-slate-200 rounded text-xs font-medium"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-slate-100 disabled:opacity-50 hover:bg-slate-200 rounded text-xs font-medium"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={2}
        stageTitle="Exploración Inicial de Datos"
        isReadyToApprove={totalRows > 0 && totalCols > 1}
        blockingReasons={totalRows === 0 ? ['La base no contiene registros válidos'] : []}
        approvalRecord={state.stagesApproval[2]}
        onApprove={(notes) => onApproveStage(notes)}
        onBack={onBack}
      />
    </div>
  );
};
