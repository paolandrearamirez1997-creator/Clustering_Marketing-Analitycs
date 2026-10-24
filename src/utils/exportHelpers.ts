import * as XLSX from 'xlsx';
import { AnalysisState } from '../types';

/**
 * Exports enriched dataset and analysis summaries to a multi-sheet Excel (.xlsx) workbook.
 */
export function exportAnalysisToExcel(state: AnalysisState) {
  const wb = XLSX.utils.book_new();

  // 1. Enriched Data sheet
  const enrichedRows = state.imputedRows.map((row, idx) => ({
    ...row,
    _Cluster_Asignado: `Cluster ${state.clusterAssignments[idx] ?? 'N/A'}`,
    _Cluster_ID: state.clusterAssignments[idx] ?? 0,
    _PC1_X: state.pcaResult?.points[idx]?.x ?? 0,
    _PC2_Y: state.pcaResult?.points[idx]?.y ?? 0,
  }));
  const wsEnriched = XLSX.utils.json_to_sheet(enrichedRows);
  XLSX.utils.book_append_sheet(wb, wsEnriched, 'Base_Enriquecida');

  // 2. Centroids sheet
  if (state.centroids && state.centroids.length > 0) {
    const centroidRows: any[] = [];
    state.centroids.forEach(c => {
      const rowObj: any = {
        Cluster_ID: c.clusterIndex,
        Nombre_Segmento: c.clusterName,
        N_Clientes: c.size,
        Porcentaje_Poblacion: `${c.percentage}%`,
      };
      Object.keys(c.means).forEach(feat => {
        rowObj[`Media_${feat}`] = c.means[feat];
        rowObj[`Delta_%_vs_Global_${feat}`] = `${c.deltasVsGlobal[feat] > 0 ? '+' : ''}${c.deltasVsGlobal[feat]}%`;
      });
      centroidRows.push(rowObj);
    });
    const wsCentroids = XLSX.utils.json_to_sheet(centroidRows);
    XLSX.utils.book_append_sheet(wb, wsCentroids, 'Centroides_Originales');
  }

  // 3. Evaluation Metrics sheet
  if (state.clusteringMetrics) {
    const m = state.clusteringMetrics;
    const metricsData = [
      { Metrica: 'Número Óptimo de Clústeres (k)', Valor: m.k },
      { Metrica: 'Inertia Global (WCSS)', Valor: m.inertia },
      { Metrica: 'Coeficiente de Silueta Global (Rousseeuw 1987)', Valor: m.globalSilhouette },
      { Metrica: 'Algoritmo de Clustering', Valor: m.algorithmName || 'K-Means++ Euclidiano' },
      { Metrica: 'Método de Escalado', Valor: state.scalingMethod },
      { Metrica: 'Sector Económico', Valor: state.sector },
      { Metrica: 'Subsector / Vertical', Valor: state.subsector },
    ];
    m.clusterSilhouettes.forEach((sil, idx) => {
      metricsData.push({
        Metrica: `Silueta Específica Clúster ${idx}`,
        Valor: sil,
      });
    });
    const wsMetrics = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(wb, wsMetrics, 'Metricas_Validacion');
  }

  // 4. ROI & Financial Models sheet
  if (state.roiModels && state.roiModels.length > 0) {
    const roiRows: any[] = [];
    state.roiModels.forEach(model => {
      Object.keys(model.scenarios).forEach(scenKey => {
        const sc = model.scenarios[scenKey as keyof typeof model.scenarios];
        roiRows.push({
          Cluster_ID: model.clusterIndex,
          Nombre_Segmento: model.clusterName,
          Poblacion_Objetivo: model.targetPopulation,
          Escenario: sc.name,
          Inversion_Inicial_USD: sc.initialInvestment,
          Costos_Operativos_USD: sc.incrementalOperatingCosts,
          Ingresos_Brutos_Incrementales_USD: sc.incrementalGrossRevenue,
          Margen_Contribucion_Pct: `${sc.contributionMarginPercent}%`,
          Beneficios_Netos_USD: sc.incrementalNetBenefits,
          ROI_Porcentual: `${sc.roiPercent}%`,
          Payback_Meses: sc.paybackMonths,
        });
      });
    });
    const wsROI = XLSX.utils.json_to_sheet(roiRows);
    XLSX.utils.book_append_sheet(wb, wsROI, 'Modelo_ROI_Escenarios');
  }

  // 5. Commercial Strategies sheet
  if (state.strategies && state.strategies.length > 0) {
    const stratRows = state.strategies.map(s => ({
      Cluster_ID: s.clusterIndex,
      Nombre_Segmento: s.clusterName,
      Prioridad_Estrategica_1_a_10: s.priorityScore,
      Oferta_Producto: s.productStrategy.offeringTitle,
      Detalle_Producto: s.productStrategy.description,
      Funcionalidades_Prioritarias: s.productStrategy.priorityFeatures.join('; '),
      Estrategia_Precios: s.pricingStrategy.model,
      Descuentos_o_Paquetes: s.pricingStrategy.discountOrBundle,
      Innovacion_Digital: s.innovationStrategy.digitalExperience,
      Propuesta_Valor_Comunicacion: s.communicationStrategy.valueProposition,
      Canales_Recomendados: s.communicationStrategy.preferredChannels.join(', '),
      Accion_Fidelizacion: s.communicationStrategy.retentionAction,
      Criterios_Exito_Plan: s.implementationPlan.successCriteria,
    }));
    const wsStrats = XLSX.utils.json_to_sheet(stratRows);
    XLSX.utils.book_append_sheet(wb, wsStrats, 'Estrategias_Comerciales');
  }

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Cluster_Intelligence_Analisis_${state.sector}_${dateStr}.xlsx`);
}

/**
 * Exports enriched dataset with cluster IDs and coordinates as CSV.
 */
export function exportEnrichedDataCSV(state: AnalysisState) {
  const enrichedRows = state.imputedRows.map((row, idx) => ({
    ...row,
    cluster_id: state.clusterAssignments[idx] ?? 0,
    cluster_nombre: state.centroids[state.clusterAssignments[idx]]?.clusterName ?? `Cluster ${state.clusterAssignments[idx]}`,
    pca_dim1: state.pcaResult?.points[idx]?.x ?? 0,
    pca_dim2: state.pcaResult?.points[idx]?.y ?? 0,
  }));

  const ws = XLSX.utils.json_to_sheet(enrichedRows);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `base_enriquecida_clusters_${state.sector}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
