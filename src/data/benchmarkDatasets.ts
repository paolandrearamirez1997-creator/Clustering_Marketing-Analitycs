import * as XLSX from 'xlsx';
import { ColumnMetadata, SectorEconomic, VariableType } from '../types';

export interface PresetDataset {
  id: string;
  name: string;
  sector: SectorEconomic;
  subsector: string;
  description: string;
  rowCount: number;
  data: Record<string, any>[];
}

/**
 * Pre-calibrated high-fidelity synthetic benchmark datasets reflecting real industry schemas.
 */
export const BENCHMARK_DATASETS: PresetDataset[] = [
  {
    id: 'telecom_fidelizacion',
    name: 'Telecomunicaciones: Consumo, ARPU y Retención',
    sector: 'telecomunicaciones',
    subsector: 'Telefonía Móvil y Fibra Óptica',
    description: '120 clientes residenciales y pyme con métricas de facturación (ARPU), antigüedad, consumo de datos, llamadas al call center y tipo de contrato.',
    rowCount: 120,
    data: generateTelecomData(120),
  },
  {
    id: 'retail_rfm',
    name: 'Retail Omnicanal: Segmentación RFM y Ticket Promedio',
    sector: 'retail_ecommerce',
    subsector: 'Moda y Tecnología Multicanal',
    description: '130 compradores con análisis de Recencia, Frecuencia, Valor Monetario total, ticket promedio, tasa de devoluciones y canal favorito.',
    rowCount: 130,
    data: generateRetailData(130),
  },
  {
    id: 'banca_patrimonial',
    name: 'Banca y Finanzas: Perfil Transaccional y Riesgo Crediticio',
    sector: 'banca_finanzas',
    subsector: 'Banca Personas y Tarjetas de Crédito',
    description: '115 clientes bancarios con saldo medio, score crediticio, ingresos mensuales estimados, tasa de uso de tarjeta y número de productos.',
    rowCount: 115,
    data: generateBankingData(115),
  },
  {
    id: 'saas_b2b',
    name: 'B2B SaaS: ARR, Adopción y Salud de Cuenta',
    sector: 'b2b_saas',
    subsector: 'Software Cloud Enterprise',
    description: '100 empresas B2B con ARR en USD, licencias activas contratadas, frecuencia de uso diario (horas), score NPS y tickets de soporte de alta prioridad.',
    rowCount: 100,
    data: generateSaaSData(100),
  },
];

function pseudoRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateTelecomData(n: number) {
  const rng = pseudoRandom(101);
  const planes = ['Prepago', 'Pospago Básico', 'Pospago Avanzado', 'Pospago Corporativo'];
  const canales = ['App Móvil', 'Tienda Física', 'Call Center', 'Web'];

  const rows: Record<string, any>[] = [];

  for (let i = 1; i <= n; i++) {
    // Generate 3 organic archetype clusters with natural dispersion
    const archetype = i % 3; // 0: Estudiantes/Prepago bajo, 1: Familiar/Medio, 2: Heavy users / Pro
    let arpu = 0;
    let datosGB = 0;
    let antiguedad = 0;
    let llamadasSoporte = 0;
    let plan = '';
    let retrasoPagos = 0;

    if (archetype === 0) {
      arpu = 12 + rng() * 14;
      datosGB = 3 + rng() * 6;
      antiguedad = Math.floor(4 + rng() * 18);
      llamadasSoporte = Math.floor(rng() * 3);
      plan = rng() > 0.3 ? 'Prepago' : 'Pospago Básico';
      retrasoPagos = rng() > 0.7 ? 1 : 0;
    } else if (archetype === 1) {
      arpu = 38 + rng() * 22;
      datosGB = 18 + rng() * 20;
      antiguedad = Math.floor(14 + rng() * 36);
      llamadasSoporte = Math.floor(1 + rng() * 4);
      plan = rng() > 0.4 ? 'Pospago Avanzado' : 'Pospago Básico';
      retrasoPagos = rng() > 0.85 ? 1 : 0;
    } else {
      arpu = 85 + rng() * 45;
      datosGB = 60 + rng() * 55;
      antiguedad = Math.floor(24 + rng() * 50);
      llamadasSoporte = Math.floor(rng() * 2);
      plan = 'Pospago Corporativo';
      retrasoPagos = rng() > 0.95 ? 1 : 0;
    }

    // introduce intentional minor missing value for realistic imputation testing (~3% chance)
    const hasNull = rng() < 0.035;

    rows.push({
      id_cliente: `TEL-${1000 + i}`,
      antiguedad_meses: Math.round(antiguedad),
      consumo_datos_gb: Number(datosGB.toFixed(1)),
      gasto_mensual_arpu: hasNull ? null : Number(arpu.toFixed(2)),
      llamadas_soporte: llamadasSoporte,
      tipo_plan: plan,
      canal_preferido: canales[Math.floor(rng() * canales.length)],
      retrasos_pago: retrasoPagos,
      servicios_adicionales: Math.floor(rng() * 4),
    });
  }
  return rows;
}

function generateRetailData(n: number) {
  const rng = pseudoRandom(202);
  const categorias = ['Moda y Calzado', 'Electrónica', 'Hogar y Decoración', 'Belleza y Cuidado'];
  const canales = ['E-commerce Web', 'App Móvil', 'Tienda Flagship', 'Marketplace'];

  const rows: Record<string, any>[] = [];

  for (let i = 1; i <= n; i++) {
    const clusterMode = i % 4;
    let recenciaDias = 0;
    let frecuenciaAnual = 0;
    let valorMonetario = 0;
    let ticketPromedio = 0;
    let tasaDevolucion = 0;

    if (clusterMode === 0) {
      // VIP Champions
      recenciaDias = Math.floor(3 + rng() * 15);
      frecuenciaAnual = Math.floor(16 + rng() * 22);
      valorMonetario = 2400 + rng() * 3200;
      tasaDevolucion = Number((2 + rng() * 5).toFixed(1));
    } else if (clusterMode === 1) {
      // Clientes Potenciales / Promedio
      recenciaDias = Math.floor(20 + rng() * 45);
      frecuenciaAnual = Math.floor(6 + rng() * 8);
      valorMonetario = 650 + rng() * 800;
      tasaDevolucion = Number((4 + rng() * 8).toFixed(1));
    } else if (clusterMode === 2) {
      // Clientes en Riesgo / Inactivos
      recenciaDias = Math.floor(120 + rng() * 160);
      frecuenciaAnual = Math.floor(1 + rng() * 3);
      valorMonetario = 180 + rng() * 260;
      tasaDevolucion = Number((10 + rng() * 14).toFixed(1));
    } else {
      // Cazadores de Descuentos / Nuevo Ingreso
      recenciaDias = Math.floor(10 + rng() * 30);
      frecuenciaAnual = Math.floor(2 + rng() * 4);
      valorMonetario = 120 + rng() * 220;
      tasaDevolucion = Number((6 + rng() * 10).toFixed(1));
    }

    ticketPromedio = valorMonetario / Math.max(1, frecuenciaAnual);
    const hasNull = rng() < 0.04;

    rows.push({
      id_cliente: `RET-${2000 + i}`,
      recencia_dias: recenciaDias,
      frecuencia_anual: frecuenciaAnual,
      valor_monetario_usd: Number(valorMonetario.toFixed(2)),
      ticket_promedio_usd: hasNull ? null : Number(ticketPromedio.toFixed(2)),
      tasa_devoluciones_pct: tasaDevolucion,
      canal_predilecto: canales[Math.floor(rng() * canales.length)],
      categoria_principal: categorias[Math.floor(rng() * categorias.length)],
      es_suscriptor_newsletter: rng() > 0.45 ? 1 : 0,
    });
  }
  return rows;
}

function generateBankingData(n: number) {
  const rng = pseudoRandom(303);
  const segmentos = ['Personas Estándar', 'Banca Preferente', 'Banca Patrimonial VIP'];
  const rows: Record<string, any>[] = [];

  for (let i = 1; i <= n; i++) {
    const archetype = i % 3;
    let saldo = 0;
    let score = 0;
    let ingreso = 0;
    let usoTarjeta = 0;
    let numProductos = 0;
    let antiguedad = 0;

    if (archetype === 0) {
      saldo = 400 + rng() * 1600;
      score = Math.floor(580 + rng() * 90);
      ingreso = 1200 + rng() * 1100;
      usoTarjeta = Number((60 + rng() * 35).toFixed(1));
      numProductos = Math.floor(1 + rng() * 2);
      antiguedad = Math.floor(1 + rng() * 4);
    } else if (archetype === 1) {
      saldo = 5500 + rng() * 8500;
      score = Math.floor(690 + rng() * 80);
      ingreso = 3800 + rng() * 2800;
      usoTarjeta = Number((30 + rng() * 30).toFixed(1));
      numProductos = Math.floor(3 + rng() * 3);
      antiguedad = Math.floor(4 + rng() * 8);
    } else {
      saldo = 32000 + rng() * 65000;
      score = Math.floor(790 + rng() * 60);
      ingreso = 11000 + rng() * 14000;
      usoTarjeta = Number((15 + rng() * 20).toFixed(1));
      numProductos = Math.floor(5 + rng() * 4);
      antiguedad = Math.floor(8 + rng() * 12);
    }

    const hasNull = rng() < 0.03;

    rows.push({
      id_cliente_banco: `BNC-${3000 + i}`,
      saldo_cuenta_usd: hasNull ? null : Number(saldo.toFixed(2)),
      score_crediticio: score,
      ingreso_mensual_estimado: Number(ingreso.toFixed(2)),
      tasa_uso_tarjeta_pct: usoTarjeta,
      num_productos_activos: numProductos,
      antiguedad_anios: antiguedad,
      segmento_bancario: segmentos[archetype],
      reclamos_anio_actual: Math.floor(rng() * 2),
    });
  }
  return rows;
}

function generateSaaSData(n: number) {
  const rng = pseudoRandom(404);
  const tiers = ['Starter Cloud', 'Growth Pro', 'Enterprise Dedicated'];
  const industrias = ['Fintech', 'Healthtech', 'Logística B2B', 'Retail Tech', 'Educación'];
  const rows: Record<string, any>[] = [];

  for (let i = 1; i <= n; i++) {
    const archetype = i % 3;
    let arr = 0;
    let licencias = 0;
    let horasUso = 0;
    let nps = 0;
    let ticketsCriticos = 0;
    let onboardingDias = 0;

    if (archetype === 0) {
      arr = 3600 + rng() * 5400;
      licencias = Math.floor(5 + rng() * 15);
      horasUso = Number((1.5 + rng() * 2.0).toFixed(1));
      nps = Math.floor(5 + rng() * 4);
      ticketsCriticos = Math.floor(rng() * 3);
      onboardingDias = Math.floor(10 + rng() * 18);
    } else if (archetype === 1) {
      arr = 18000 + rng() * 26000;
      licencias = Math.floor(25 + rng() * 60);
      horasUso = Number((4.5 + rng() * 3.5).toFixed(1));
      nps = Math.floor(8 + rng() * 3);
      ticketsCriticos = Math.floor(rng() * 2);
      onboardingDias = Math.floor(25 + rng() * 30);
    } else {
      arr = 75000 + rng() * 85000;
      licencias = Math.floor(120 + rng() * 250);
      horasUso = Number((7.0 + rng() * 4.0).toFixed(1));
      nps = Math.floor(9 + rng() * 2);
      ticketsCriticos = Math.floor(1 + rng() * 3);
      onboardingDias = Math.floor(45 + rng() * 40);
    }

    const hasNull = rng() < 0.03;

    rows.push({
      id_cuenta_saas: `SAS-${4000 + i}`,
      arr_anual_usd: Number(arr.toFixed(2)),
      licencias_activas: licencias,
      horas_uso_diario_equipo: hasNull ? null : horasUso,
      nps_satisfaccion: Math.min(10, nps),
      tickets_soporte_p1: ticketsCriticos,
      tiempo_onboarding_dias: onboardingDias,
      plan_contratado: tiers[archetype],
      vertical_cliente: industrias[Math.floor(rng() * industrias.length)],
    });
  }
  return rows;
}

/**
 * Parses user-uploaded file buffer (CSV, TSV, TXT, XLS, XLSX) into structured JS objects.
 */
export async function parseUploadedFile(file: File): Promise<{
  rows: Record<string, any>[];
  columns: string[];
  fileName: string;
  sizeBytes: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: null,
          raw: false,
        });

        if (rawRows.length === 0) {
          throw new Error('El archivo no contiene filas con datos o está vacío.');
        }

        // Clean headers and rows
        const originalCols = Object.keys(rawRows[0]);
        const cleanedRows = rawRows.map(row => {
          const cleanRow: Record<string, any> = {};
          originalCols.forEach(col => {
            const trimmedCol = col.trim();
            let val = row[col];
            if (val === '' || val === undefined || val === 'null' || val === 'NA' || val === 'N/A') {
              val = null;
            } else if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
              // Convert clean numeric string to number
              val = Number(val);
            }
            cleanRow[trimmedCol] = val;
          });
          return cleanRow;
        });

        const columns = Object.keys(cleanedRows[0]);

        resolve({
          rows: cleanedRows,
          columns,
          fileName: file.name,
          sizeBytes: file.size,
        });
      } catch (err: any) {
        reject(new Error(`Error al procesar el archivo: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Fallo de lectura del archivo seleccionado.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Automated statistical heuristic column classification.
 */
export function inspectColumns(rows: Record<string, any>[]): ColumnMetadata[] {
  if (rows.length === 0) return [];
  const colNames = Object.keys(rows[0]);
  const n = rows.length;

  return colNames.map(col => {
    const rawValues = rows.map(r => r[col]);
    const nonNullValues = rawValues.filter(v => v !== null && v !== undefined && v !== '');
    const missingCount = n - nonNullValues.length;
    const missingPercentage = Number(((missingCount / n) * 100).toFixed(1));

    const uniqueSet = new Set(nonNullValues);
    const uniqueCount = uniqueSet.size;
    const sampleValues = nonNullValues.slice(0, 5);

    // Heuristics
    const colLower = col.toLowerCase();
    const isIdByName =
      colLower.includes('id') ||
      colLower.includes('codigo') ||
      colLower.includes('rut') ||
      colLower.includes('dni') ||
      colLower.includes('key') ||
      colLower.includes('uuid');

    const numericValues = nonNullValues.filter(v => typeof v === 'number' || (!isNaN(Number(v)) && typeof v !== 'boolean'));
    const isMostlyNumeric = nonNullValues.length > 0 && numericValues.length / nonNullValues.length > 0.85;

    let detectedType: VariableType = 'categorical_nominal';
    let usageDecision: 'include' | 'exclude' | 'identifier' = 'include';
    let recommendation = 'Variable candidata estándar para clustering';

    if (uniqueCount === n && isIdByName) {
      detectedType = 'identifier';
      usageDecision = 'identifier';
      recommendation = 'Identificador único (excluir de cálculo de distancias)';
    } else if (uniqueCount === 1) {
      detectedType = 'categorical_nominal';
      usageDecision = 'exclude';
      recommendation = 'Variable constante sin varianza (se recomienda excluir)';
    } else if (isMostlyNumeric) {
      // Check if continuous or discrete
      const hasDecimals = numericValues.some(v => Number(v) % 1 !== 0);
      if (hasDecimals || uniqueCount > 20) {
        detectedType = 'numeric_continuous';
        usageDecision = 'include';
        recommendation = 'Numérica continua (ideal para clustering tras estandarización)';
      } else if (uniqueCount === 2) {
        detectedType = 'boolean';
        usageDecision = 'include';
        recommendation = 'Variable binaria / booleana';
      } else {
        detectedType = 'numeric_discrete';
        usageDecision = 'include';
        recommendation = 'Numérica discreta';
      }
    } else {
      // String / categorical
      if (uniqueCount > 25 && !isIdByName) {
        detectedType = 'free_text';
        usageDecision = 'exclude';
        recommendation = 'Alta cardinalidad / Texto libre (puede introducir distorsiones)';
      } else if (uniqueCount === 2) {
        detectedType = 'boolean';
        usageDecision = 'include';
        recommendation = 'Variable categórica binaria';
      } else {
        detectedType = 'categorical_nominal';
        usageDecision = 'include';
        recommendation = 'Categórica nominal (requiere One-Hot Encoding)';
      }
    }

    return {
      name: col,
      detectedType,
      confirmedType: detectedType,
      uniqueValuesCount: uniqueCount,
      missingValuesCount: missingCount,
      missingPercentage,
      sampleValues,
      usageDecision,
      recommendation,
    };
  });
}
