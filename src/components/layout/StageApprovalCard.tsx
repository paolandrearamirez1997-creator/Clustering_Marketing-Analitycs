import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertTriangle, ShieldCheck } from 'lucide-react';
import { StageApproval } from '../../types';

interface StageApprovalCardProps {
  stageId: number;
  stageTitle: string;
  isReadyToApprove: boolean;
  blockingReasons?: string[];
  approvalRecord?: StageApproval;
  onApprove: (notes: string) => void;
  onBack?: () => void;
  onInvalidateDownstream?: () => void;
}

export const StageApprovalCard: React.FC<StageApprovalCardProps> = ({
  stageId,
  stageTitle,
  isReadyToApprove,
  blockingReasons = [],
  approvalRecord,
  onApprove,
  onBack,
}) => {
  const [userNotes, setUserNotes] = useState(approvalRecord?.userNotes || '');
  const isApproved = approvalRecord?.status === 'approved';

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Punto de Aprobación Metodológica
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-600">
                Etapa {stageId} de 13
              </span>
              {isApproved && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprobada {approvalRecord.approvedAt ? `el ${approvalRecord.approvedAt}` : ''}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-slate-900 mt-1">
              Validación y Aprobación: {stageTitle}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Revise cuidadosamente las conclusiones de esta etapa antes de consolidar y habilitar el siguiente módulo analítico.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-center">
            {stageId > 1 && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Etapa Anterior</span>
              </button>
            )}

            <button
              type="button"
              disabled={!isReadyToApprove}
              onClick={() => onApprove(userNotes)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md shadow-sm transition-all ${
                isReadyToApprove
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-75'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isApproved ? 'Guardar Cambios y Continuar' : 'Aprobar y Desbloquear Siguiente Etapa'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {blockingReasons.length > 0 && !isReadyToApprove && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-900">
                  Condiciones pendientes para aprobación metodológica:
                </p>
                <ul className="mt-1 list-disc list-inside text-xs text-amber-800 space-y-0.5">
                  {blockingReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Justificación técnica / Notas de decisión metodológica (Opcional):
          </label>
          <input
            type="text"
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Ej: Se validó la ausencia de nulos y la pertinencia de las 6 variables seleccionadas para el sector..."
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>
      </div>
    </div>
  );
};
