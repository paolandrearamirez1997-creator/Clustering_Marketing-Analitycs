import { ColumnMetadata, ImputationConfig } from '../types';

/**
 * Executes user-selected imputation on dataset rows.
 */
export function executeImputation(
  rawRows: Record<string, any>[],
  columnsMeta: ColumnMetadata[],
  imputationConfig: ImputationConfig
): {
  imputedRows: Record<string, any>[];
  imputationSummary: { column: string; method: string; imputedCount: number }[];
} {
  const n = rawRows.length;
  const summary: { column: string; method: string; imputedCount: number }[] = [];

  // Filter out rows if user selected 'drop_row' on any column with nulls
  const dropCols = Object.keys(imputationConfig).filter(k => imputationConfig[k] === 'drop_row');
  let filteredRows = rawRows.filter(row => {
    for (const c of dropCols) {
      if (row[c] === null || row[c] === undefined || row[c] === '') return false;
    }
    return true;
  });

  // Calculate statistics for imputation
  const colFillValues: Record<string, any> = {};

  columnsMeta.forEach(col => {
    const method = imputationConfig[col.name] || 'median';
    const nonNullVals = filteredRows
      .map(r => r[col.name])
      .filter(v => v !== null && v !== undefined && v !== '');

    let fillVal: any = 0;

    if (method === 'mean') {
      const sum = nonNullVals.reduce((a, b) => a + Number(b), 0);
      fillVal = nonNullVals.length > 0 ? Number((sum / nonNullVals.length).toFixed(2)) : 0;
    } else if (method === 'median') {
      const nums = nonNullVals.map(Number).sort((a, b) => a - b);
      if (nums.length === 0) fillVal = 0;
      else {
        const mid = Math.floor(nums.length / 2);
        fillVal = nums.length % 2 !== 0 ? nums[mid] : Number(((nums[mid - 1] + nums[mid]) / 2).toFixed(2));
      }
    } else if (method === 'mode') {
      const freq: Record<string, number> = {};
      nonNullVals.forEach(v => {
        const str = String(v);
        freq[str] = (freq[str] || 0) + 1;
      });
      let maxCount = -1;
      let modeVal = nonNullVals[0];
      Object.keys(freq).forEach(k => {
        if (freq[k] > maxCount) {
          maxCount = freq[k];
          modeVal = k;
        }
      });
      fillVal = modeVal;
    } else if (method === 'unknown_category') {
      fillVal = 'Desconocido';
    }

    colFillValues[col.name] = fillVal;
  });

  // Apply imputation
  const imputedRows = filteredRows.map(row => {
    const copy = { ...row };
    columnsMeta.forEach(col => {
      const val = copy[col.name];
      if (val === null || val === undefined || val === '') {
        copy[col.name] = colFillValues[col.name];
      }
    });
    return copy;
  });

  columnsMeta.forEach(col => {
    const missingOriginal = rawRows.filter(r => r[col.name] === null || r[col.name] === undefined || r[col.name] === '').length;
    summary.push({
      column: col.name,
      method: imputationConfig[col.name] || 'median',
      imputedCount: missingOriginal,
    });
  });

  return { imputedRows, imputationSummary: summary };
}

/**
 * Encodes nominal categoricals (One-Hot), booleans, and numeric variables.
 * Excludes identifiers and excluded variables from distance calculations.
 */
export function executeEncoding(
  imputedRows: Record<string, any>[],
  columnsMeta: ColumnMetadata[]
): {
  encodedRows: Record<string, number>[];
  encodedFeaturesList: string[];
  transformationLog: { originalCol: string; action: string; outputCols: string[] }[];
} {
  const transformationLog: { originalCol: string; action: string; outputCols: string[] }[] = [];
  const includedCols = columnsMeta.filter(c => c.usageDecision === 'include');

  // Discover categorical distinct levels for One-Hot Encoding
  const oneHotMaps: Record<string, string[]> = {};

  includedCols.forEach(col => {
    if (col.confirmedType === 'categorical_nominal') {
      const uniqueVals = Array.from(new Set(imputedRows.map(r => String(r[col.name])))).sort();
      // Drop first dummy if desired or keep all for descriptive symmetry
      oneHotMaps[col.name] = uniqueVals;
      const dummyCols = uniqueVals.map(val => `${col.name}_${val.replace(/\s+/g, '_')}`);
      transformationLog.push({
        originalCol: col.name,
        action: `One-Hot Encoding (${uniqueVals.length} categorías)`,
        outputCols: dummyCols,
      });
    } else if (col.confirmedType === 'boolean') {
      transformationLog.push({
        originalCol: col.name,
        action: 'Conversión binaria a [0, 1]',
        outputCols: [col.name],
      });
    } else if (col.confirmedType === 'numeric_continuous' || col.confirmedType === 'numeric_discrete') {
      transformationLog.push({
        originalCol: col.name,
        action: 'Preservación numérica para escalado posterior',
        outputCols: [col.name],
      });
    } else {
      transformationLog.push({
        originalCol: col.name,
        action: 'Excluida o sin transformación numérica directa',
        outputCols: [],
      });
    }
  });

  // Track all final numeric feature names
  const encodedFeaturesList: string[] = [];
  includedCols.forEach(col => {
    if (col.confirmedType === 'categorical_nominal') {
      oneHotMaps[col.name].forEach(catVal => {
        encodedFeaturesList.push(`${col.name}_${catVal.replace(/\s+/g, '_')}`);
      });
    } else if (col.confirmedType === 'boolean' || col.confirmedType === 'numeric_continuous' || col.confirmedType === 'numeric_discrete') {
      encodedFeaturesList.push(col.name);
    }
  });

  // Transform each row into a pure numeric dictionary
  const encodedRows: Record<string, number>[] = imputedRows.map(row => {
    const encRow: Record<string, number> = {};

    includedCols.forEach(col => {
      const val = row[col.name];

      if (col.confirmedType === 'categorical_nominal') {
        const strVal = String(val);
        oneHotMaps[col.name].forEach(catVal => {
          const dummyName = `${col.name}_${catVal.replace(/\s+/g, '_')}`;
          encRow[dummyName] = strVal === catVal ? 1 : 0;
        });
      } else if (col.confirmedType === 'boolean') {
        encRow[col.name] = (val === true || val === 1 || String(val).toLowerCase() === 'true' || String(val).toLowerCase() === 'si') ? 1 : 0;
      } else if (col.confirmedType === 'numeric_continuous' || col.confirmedType === 'numeric_discrete') {
        encRow[col.name] = typeof val === 'number' ? val : (parseFloat(val) || 0);
      }
    });

    return encRow;
  });

  return {
    encodedRows,
    encodedFeaturesList,
    transformationLog,
  };
}
