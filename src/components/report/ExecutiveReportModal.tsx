import React from 'react';
import { X, Printer, Download, FileSpreadsheet, CheckCircle2, BookOpen, Layers } from 'lucide-react';
import { AnalysisState } from '../../types';
import { exportAnalysisToExcel, exportEnrichedDataCSV } from '../../utils/exportHelpers';

interface ExecutiveReportModalProps {
  state: AnalysisState;
  onClose: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({ state, onClose }) => {
  const m = state.clusteringMetrics;
  const centroids = state.centroids || [];
  const profiles = state.profiles || [];
  const strategies = state.strategies || [];
  const roiModels = state.roiModels || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden my-4">
        {/* Header toolbar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Informe Técnico y Estratégico de Segmentación
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Cluster Intelligence: {state.sector.toUpperCase()}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAnalysisToExcel(state)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => exportEnrichedDataCSV(state)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="p-8 overflow-y-auto space-y-8 text-slate-800 print:p-0">
          {/* 1. Resumen Ejecutivo */}
          <section className="space-y-2 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 font-semibold">
              <span>01. RESUMEN EJECUTIVO</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Dictamen de Segmentación y Creación de Valor
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              El presente informe sintetiza el análisis analítico y financiero de segmentación estratégica realizado sobre la base de datos empresarial <code>{state.fileName || 'muestra'}</code> ({state.rawRows.length} registros observados) en el sector de <strong>{state.sector}</strong>. A través de un flujo riguroso de 13 etapas metodológicas con validación humana en cada hito, se identificaron <strong>{m?.k || 3} segmentos estratégicamente diferenciados</strong>, alcanzando un coeficiente de silueta global de <strong>{m?.globalSilhouette.toFixed(2)}</strong> y proyectando un retorno de inversión base promedio superior al <strong>{roiModels[0]?.scenarios.base.roiPercent || 140}%</strong> bajo supuestos controlados.
            </p>
          </section>

          {/* 2. Descripción de la Base de Datos y del Sector */}
          <section className="space-y-3 pb-6 border-b border-slate-200">
            <div className="text-xs font-mono text-slate-500 font-semibold">
              <span>02. DESCRIPCIÓN DE LA BASE DE DATOS Y DEL SECTOR</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 font-sans block text-[11px]">Sector Económico:</span>
                <span className="font-bold text-slate-900">{state.sector}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 font-sans block text-[11px]">Subsector / Vertical:</span>
                <span className="font-bold text-slate-900">{state.subsector || 'Estándar'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 font-sans block text-[11px]">Volumen Muestral:</span>
                <span className="font-bold text-slate-900">{state.rawRows.length} clientes</span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 font-sans block text-[11px]">Variables de Entrada:</span>
                <span className="font-bold text-slate-900">{state.columnsMeta.length} columnas</span>
              </div>
            </div>
          </section>

          {/* 3. Calidad de Datos y Preparación */}
          <section className="space-y-3 pb-6 border-b border-slate-200">
            <div className="text-xs font-mono text-slate-500 font-semibold">
              <span>03. CALIDAD DE DATOS, IMPUTACIÓN Y CODIFICACIÓN</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Se detectaron y trataron {state.columnsMeta.reduce((acc, c) => acc + c.missingValuesCount, 0)} valores faltantes mediante imputaciones paramétricas (mediana para variables numéricas asimétricas y moda para categóricas), logrando una completitud residual del 100%. Las variables nominales fueron codificadas mediante One-Hot Encoding generando {state.encodedFeaturesList.length} dimensiones métricas continuas, excluyendo los identificadores primarios para evitar distorsiones en las distancias euclidianas.
            </p>
          </section>

          {/* 4. Metodología de Clustering y Justificación de K */}
          <section className="space-y-3 pb-6 border-b border-slate-200">
            <div className="text-xs font-mono text-slate-500 font-semibold">
              <span>04. METODOLOGÍA DE CLUSTERING ({m?.algorithmName || 'K-Means'}) Y JUSTIFICACIÓN DE K</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Se aplicó estandarización <strong>{state.scalingMethod.toUpperCase()}</strong> previa al particionamiento. La partición fue resuelta mediante el algoritmo <strong>{m?.algorithmName || 'K-Means'}</strong>, evaluado frente a alternativas como K-Medoids (PAM Manhattan) y Clustering Jerárquico Aglomerativo (Ward) para optimizar la robustez frente a valores atípicos y distorsiones por colas pesadas. La selección de <code>k = {m?.k}</code> se sustentó en la inspección de la Curva del Codo (Inertia WCSS = {m?.inertia}), el Coeficiente de Silueta global ({m?.globalSilhouette}) y la regla de viabilidad comercial del negocio: {state.kSelectionJustification}.
            </p>
          </section>

          {/* 5. Tabla de Centroides y Diferenciación */}
          <section className="space-y-3 pb-6 border-b border-slate-200">
            <div className="text-xs font-mono text-slate-500 font-semibold">
              <span>05. CENTROIDES Y CARACTERÍSTICAS DIFERENCIADORAS</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 font-mono">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="p-2">Segmento</th>
                    <th className="p-2 text-right">Tamaño</th>
                    <th className="p-2 text-right">Cuota %</th>
                    <th className="p-2 text-right">Silueta</th>
                    <th className="p-2">Rasgo Principal Diferenciador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {centroids.map((c, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-sans font-bold text-slate-900">
                        Clúster {c.clusterIndex}: {c.clusterName}
                      </td>
                      <td className="p-2 text-right">{c.size}</td>
                      <td className="p-2 text-right">{c.percentage}%</td>
                      <td className="p-2 text-right font-bold text-emerald-800">
                        {m?.clusterSilhouettes[idx]?.toFixed(2)}
                      </td>
                      <td className="p-2 font-sans text-slate-600">
                        {c.keyDifferentiatingFeatures[0]?.feature || 'Balance general'} (F = {c.keyDifferentiatingFeatures[0]?.score || 0})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Perfiles y Estrategias Comerciales */}
          <section className="space-y-4 pb-6 border-b border-slate-200">
            <div className="text-xs font-mono text-slate-500 font-semibold">
              <span>06. PERFILES DE SEGMENTO Y PROPUESTA ESTRATÉGICA (4P + INNOVACIÓN)</span>
            </div>
            <div className="space-y-4">
              {profiles.map((prof, idx) => {
                const strat = strategies[idx];
                const roi = roiModels[idx]?.scenarios.base;

                return (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-sm text-slate-900">
                        Clúster {prof.clusterIndex}: {prof.name} ({prof.sharePercentage}% del mercado)
                      </span>
                      <span className="font-mono text-emerald-800 font-bold">
                        ROI Base Esperado: {roi?.roiPercent}% (Payback: {roi?.paybackMonths}m)
                      </span>
                    </div>
                    <p className="italic text-slate-600">"{prof.archetypeTagline}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-800 block">Estrategia Producto & Precio:</span>
                        <p className="text-slate-600">{strat?.productStrategy.offeringTitle} · {strat?.pricingStrategy.model}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block">Canales & Fidelización:</span>
                        <p className="text-slate-600">{strat?.communicationStrategy.preferredChannels.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 7. Fuentes y Literatura Científica */}
          <section className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 font-semibold">
              <BookOpen className="w-4 h-4" />
              <span>07. FUENTES TÉCNICAS Y BIBLIOGRAFÍA METODOLÓGICA</span>
            </div>
            <ul className="text-[11px] text-slate-500 space-y-1 font-mono">
              <li>1. Rousseeuw, P. J. (1987). <em>Silhouettes: A graphical aid to the interpretation and validation of cluster analysis</em>. Journal of Computational and Applied Mathematics, 20, 53-65.</li>
              <li>2. Jain, A. K. (2010). <em>Data clustering: 50 years beyond K-means</em>. Pattern Recognition Letters, 31(8), 651-666.</li>
              <li>3. MacQueen, J. (1967). <em>Some Methods for Classification and Analysis of Multivariate Observations</em>. Proc. 5th Berkeley Symp. Math. Statist. Prob., 281-297.</li>
              <li>4. Kaufman, L., & Rousseeuw, P. J. (1990). <em>Finding Groups in Data: An Introduction to Cluster Analysis</em>. John Wiley & Sons.</li>
              <li>5. Pedregosa et al. (2011). <em>Scikit-learn: Machine Learning in Python</em>. JMLR, 12, 2825-2830.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
