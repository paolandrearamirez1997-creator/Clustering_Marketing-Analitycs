import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { AnalysisState, SectorEconomic } from '../../types';
import { BENCHMARK_DATASETS, parseUploadedFile } from '../../data/benchmarkDatasets';
import { StageApprovalCard } from '../layout/StageApprovalCard';

interface Stage1Props {
  state: AnalysisState;
  onUpdateData: (
    rows: Record<string, any>[],
    fileName: string,
    fileSizeBytes: number,
    sector: SectorEconomic,
    subsector: string
  ) => void;
  onApproveStage: (notes: string) => void;
}

const SECTOR_OPTIONS: { id: SectorEconomic; label: string }[] = [
  { id: 'telecomunicaciones', label: 'Telecomunicaciones y Conectividad' },
  { id: 'retail_ecommerce', label: 'Retail Omnicanal & Comercio Electrónico' },
  { id: 'banca_finanzas', label: 'Banca, Servicios Financieros & Fintech' },
  { id: 'b2b_saas', label: 'B2B Software as a Service (SaaS)' },
  { id: 'consumo_masivo', label: 'Consumo Masivo & Bienes de Consumo (CPG)' },
  { id: 'salud_farmaceutica', label: 'Salud, Clínicas & Farmacéutica' },
  { id: 'logistica_transporte', label: 'Logística, Cadena de Suministro & Movilidad' },
  { id: 'turismo_hospitalidad', label: 'Turismo, Hotelería & Viajes' },
  { id: 'energia_utilities', label: 'Energía, Gas & Servicios Públicos' },
  { id: 'otro', label: 'Otro Sector Empresarial' },
];

export const Stage1Upload: React.FC<Stage1Props> = ({ state, onUpdateData, onApproveStage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSector, setSelectedSector] = useState<SectorEconomic>(state.sector);
  const [subsectorInput, setSubsectorInput] = useState(state.subsector);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePresetSelect = (presetId: string) => {
    const preset = BENCHMARK_DATASETS.find(p => p.id === presetId);
    if (!preset) return;
    setErrorMsg(null);
    setSelectedSector(preset.sector);
    setSubsectorInput(preset.subsector);
    onUpdateData(
      preset.data,
      `${preset.name}.xlsx`,
      preset.data.length * 180,
      preset.sector,
      preset.subsector
    );
  };

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const parsed = await parseUploadedFile(file);
      onUpdateData(
        parsed.rows,
        parsed.fileName,
        parsed.sizeBytes,
        selectedSector,
        subsectorInput
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el archivo seleccionado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const hasData = state.rawRows.length > 0;
  const isReady = hasData && selectedSector.length > 0;
  const blockingReasons: string[] = [];
  if (!hasData) blockingReasons.push('Debe cargar un archivo de datos (CSV, XLS, XLSX) o seleccionar una base de referencia.');
  if (!selectedSector) blockingReasons.push('Debe seleccionar el sector económico correspondiente.');

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Etapa 1: Carga de Archivos y Selección del Sector Económico
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-4xl">
          Cargue la base de datos de su organización en formato tabular (CSV, TXT, XLS, XLSX) o seleccione uno de los conjuntos de datos de prueba calibrados. Especifique el sector económico para parametrizar las reglas de negocio y los perfiles estratégicos.
        </p>
      </div>

      {/* Preset Quick-Load Banners */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-semibold text-slate-900">
            Conjuntos de Datos de Referencia (Carga Inmediata para Demostración):
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BENCHMARK_DATASETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className="p-3 text-left bg-white border border-slate-200 hover:border-slate-400 rounded-md shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                  {preset.name}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {preset.description}
                </p>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100 pt-1.5 font-mono">
                <span>{preset.rowCount} registros</span>
                <span className="text-emerald-700 font-sans font-medium text-[11px]">Cargar muestra →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
              isDragging
                ? 'border-slate-900 bg-slate-100'
                : 'border-slate-300 hover:border-slate-400 bg-white'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.tsv,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {isProcessing ? 'Procesando archivo...' : 'Arrastre su archivo aquí o haga clic para explorar'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Formatos soportados: CSV, XLS, XLSX, TXT (delimitado). Máximo 50 MB recomendado.
            </p>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              La base original se preservará intacta y las transformaciones se operarán sobre copias inmutables.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Configuration Column: Sector & Subsector */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Parámetros del Negocio
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Sector Económico Principal *
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as SectorEconomic)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {SECTOR_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subsector o Categoría Específica (Opcional)
            </label>
            <input
              type="text"
              value={subsectorInput}
              onChange={(e) => setSubsectorInput(e.target.value)}
              placeholder="Ej: Telefonía Móvil y Fibra, B2B SaaS ARR..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Active Data Diagnostic Badge */}
          {hasData && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Base cargada exitosamente</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-sans">Archivo:</span>
                  <span className="font-semibold text-slate-900 truncate block" title={state.fileName}>
                    {state.fileName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Tamaño:</span>
                  <span className="font-semibold text-slate-900">
                    {(state.fileSizeBytes / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Registros (filas):</span>
                  <span className="font-semibold text-slate-900">{state.rawRows.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Variables (columnas):</span>
                  <span className="font-semibold text-slate-900">
                    {state.columnsMeta.length || Object.keys(state.rawRows[0] || {}).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stage Approval Card */}
      <StageApprovalCard
        stageId={1}
        stageTitle="Carga de Archivos y Selección de Sector"
        isReadyToApprove={isReady}
        blockingReasons={blockingReasons}
        approvalRecord={state.stagesApproval[1]}
        onApprove={(notes) => onApproveStage(notes)}
      />
    </div>
  );
};
