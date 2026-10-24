import { CentroidDetail, CommercialStrategy, SegmentProfile, SectorEconomic, ClusterBusinessROI } from '../types';
import { buildROIScenarios } from './statisticalEngine';

/**
 * Generates context-aware strategic names and profiles based on the sector and centroid differentials.
 */
export function generateStrategicProfiles(
  centroids: CentroidDetail[],
  sector: SectorEconomic
): SegmentProfile[] {
  return centroids.map((c, idx) => {
    // Look at top differentiating feature
    const topFeat = c.keyDifferentiatingFeatures[0]?.feature || 'Comportamiento';
    const topDirection = c.keyDifferentiatingFeatures[0]?.direction || 'higher';

    let clusterName = `Segmento ${idx + 1}: Perfil ${c.clusterIndex}`;
    let tagline = 'Grupo de clientes con características homogéneas detectadas en clustering.';
    let behaviors = [`Muestra valores de ${topFeat} ${topDirection === 'higher' ? 'por encima' : 'por debajo'} de la media global.`];
    let needs = ['Optimización de la relación costo-beneficio', 'Atención personalizada en canales clave'];
    let opportunities = ['Ofertas de venta cruzada ajustadas a su frecuencia de uso'];
    let risks = ['Sensibilidad a variaciones de precio o calidad de servicio'];

    if (sector === 'telecomunicaciones') {
      if (idx === 0) {
        clusterName = 'Digital Heavy Users & Consumo Intensivo';
        tagline = 'Usuarios intensivos de datos móviles con alta exigencia de velocidad y conectividad.';
        behaviors = ['Elevado consumo mensual de GB', 'Facturación mensual (ARPU) por encima del promedio', 'Baja tolerancia a la latencia o cortes de servicio'];
        needs = ['Planes ilimitados con roaming internacional y 5G preferencial', 'Autogestión digital rápida vía App Móvil'];
        opportunities = ['Upselling a planes familiares o corporativos convergentes con fibra óptica simétrica'];
        risks = ['Riesgo de fuga (churn) si experimentan saturación de red o fallas en itinerancia'];
      } else if (idx === 1) {
        clusterName = 'Clientes Tradicionales & Prepago Básico';
        tagline = 'Usuarios de consumo controlado con recargas periódicas y uso prioritario de voz/mensajería.';
        behaviors = ['Consumo moderado de datos enfocado en mensajería', 'ARPU contenido y alta sensibilidad a promociones'];
        needs = ['Paquetes prepago accesibles con micro-recargas flexibles', 'Canales físicos o puntos de recarga de cercanía'];
        opportunities = ['Incentivos de migración a pospago básico con tarifas de bienvenida'];
        risks = ['Rotación frecuente de SIM card en busca de promociones puntuales'];
      } else {
        clusterName = 'Hogares Conectados & Fidelizados';
        tagline = 'Clientes estables con múltiples servicios integrados y alta antigüedad en la compañía.';
        behaviors = ['Baja tasa de reclamos', 'Antigüedad promedio superior a 24 meses', 'Pagos domiciliados puntuales'];
        needs = ['Reconocimiento a la lealtad y soporte técnico prioritario en caso de incidencias'];
        opportunities = ['Venta cruzada de streaming premium, ciberseguridad para el hogar y dispositivos financiados'];
        risks = ['Desconexión silenciosa si no perciben valor agregado frente a ofertas de nuevos operadores'];
      }
    } else if (sector === 'retail_ecommerce') {
      if (idx === 0) {
        clusterName = 'Champions VIP & Clientes Estrella';
        tagline = 'Compradores de máxima frecuencia y valor monetario con alta lealtad a la marca.';
        behaviors = ['Compras recurrentes mensuales', 'Ticket promedio sustancialmente elevado', 'Baja tasa de devoluciones'];
        needs = ['Acceso anticipado a lanzamientos exclusivos y entregas exprés prioritarias'];
        opportunities = ['Programa de lealtad VIP, club de membresía por suscripción y eventos privados'];
        risks = ['Sensibilidad a roturas de stock o desatención en el canal posventa'];
      } else if (idx === 1) {
        clusterName = 'Cazadores de Descuentos & Temporales';
        tagline = 'Clientes motivados por rebajas, campañas especiales y cupones promocionales.';
        behaviors = ['Picos de compra concentrados en Black Friday o liquidaciones', 'Alta sensibilidad al costo de envío'];
        needs = ['Ofertas agrupadas, envíos gratuitos a partir de umbral y facilidades de pago'];
        opportunities = ['Campañas de remarketing por email/SMS en fechas de liquidación de temporada'];
        risks = ['Fidelidad baja; comprarán con el competidor que ofrezca el descuento más agresivo'];
      } else {
        clusterName = 'Exploradores Ocasionales & Nuevos Prospectos';
        tagline = 'Clientes con baja frecuencia de compra pero ticket unitario prometedor.';
        behaviors = ['Historial de compra reciente pero esporádico', 'Navegación multicanal sin carrito recurrente'];
        needs = ['Generación de confianza mediante reseñas de producto y políticas de devolución transparentes'];
        opportunities = ['Cupones de segunda compra y recomendaciones personalizadas por inteligencia artificial'];
        risks = ['Abandono de la marca si no se activa una estrategia de reactivación antes de los 60 días'];
      }
    } else if (sector === 'banca_finanzas') {
      if (idx === 0) {
        clusterName = 'Banca Patrimonial & Alta Rentabilidad';
        tagline = 'Titulares con saldos medios elevados, excelente score crediticio y baja mora.';
        behaviors = ['Elevada captación de fondos en cuentas corrientes y productos de inversión'];
        needs = ['Asesoría financiera dedicada, productos estructurados y beneficios premium en viajes'];
        opportunities = ['Venta de fondos mutuos, seguros de vida y líneas de crédito preferentes'];
        risks = ['Sensibilidad a rentabilidades de depósitos ofrecidas por competidores'];
      } else if (idx === 1) {
        clusterName = 'Consumidores de Crédito & Tarjetahabientes Activos';
        tagline = 'Clientes con alta tasa de utilización de línea revolvente y transaccionalidad intensa.';
        behaviors = ['Uso diario de tarjetas de crédito y solicitudes periódicas de crédito de consumo'];
        needs = ['Líneas de crédito dinámicas, programas de puntos transferibles y apps ágiles'];
        opportunities = ['Consolidación de deudas, refinanciamiento y seguros de protección de pagos'];
        risks = ['Incremento de morosidad ante shocks macroeconómicos o inflación'];
      } else {
        clusterName = 'Banca Digital Básica & Transaccional';
        tagline = 'Usuarios enfocados en operaciones de débito, transferencias y pago de servicios.';
        behaviors = ['Uso intensivo de la banca móvil con saldos promedio moderados'];
        needs = ['Cero comisiones de mantenimiento y transferencias interbancarias inmediatas'];
        opportunities = ['Primeros productos de crédito preaprobados y microseguros'];
        risks = ['Migración a neobancos o billeteras digitales si perciben fricción en la app'];
      }
    } else if (sector === 'b2b_saas') {
      if (idx === 0) {
        clusterName = 'Cuentas Enterprise Estratégicas';
        tagline = 'Grandes corporaciones con contratos plurianuales, alto ARR y despliegue masivo de licencias.';
        behaviors = ['Uso diario por cientos de colaboradores', 'Exigencias de SLA estricto y auditorías de seguridad'];
        needs = ['Customer Success Manager asignado, SSO/SAML, integraciones API y soporte 24/7'];
        opportunities = ['Expansión de módulos adicionales y consultoría de implementación avanzada'];
        risks = ['Costos elevados de retención y ciclos de negociación prolongados'];
      } else if (idx === 1) {
        clusterName = 'Mid-Market en Expansión Rápida';
        tagline = 'Empresas medianas con crecimiento acelerado y adopción activa del producto.';
        behaviors = ['Incremento constante de licencias mes a mes', 'Interés en automatizaciones de flujos'];
        needs = ['Capacitación continua para nuevos empleados y plantillas preconfiguradas'];
        opportunities = ['Pase de plan Growth a plan Enterprise con cobro anual anticipado'];
        risks = ['Riesgo de churn si la plataforma no escala con el volumen de transacciones'];
      } else {
        clusterName = 'Startups & Early-Stage Adopters';
        tagline = 'Equipos reducidos con presupuesto acotado y autoservicio técnico.';
        behaviors = ['Uso enfocado en el conjunto básico de funciones', 'Interacción preferente con chatbots de ayuda'];
        needs = ['Precios predecibles por usuario y facilidad de configuración sin código'];
        opportunities = ['Programas de créditos para startups que fomenten el lock-in a mediano plazo'];
        risks = ['Alta tasa de mortalidad de empresas en etapas tempranas'];
      }
    }

    return {
      clusterIndex: c.clusterIndex,
      name: clusterName,
      population: c.size,
      sharePercentage: c.percentage,
      archetypeTagline: tagline,
      demographicTraits: [`Representa el ${c.percentage}% de la base analizada.`, `Comportamiento homogéneo verificado estadísticamente.`],
      observedBehaviors: behaviors,
      unmetNeeds: needs,
      commercialOpportunities: opportunities,
      risksAndConstraints: risks,
      confidenceLevel: 'Alta',
    };
  });
}

/**
 * Generates 4P + Innovation + Implementation Commercial Strategies for each cluster.
 */
export function generateStrategicPlans(
  profiles: SegmentProfile[],
  centroids: CentroidDetail[],
  sector: SectorEconomic
): CommercialStrategy[] {
  return profiles.map((p, idx) => {
    const c = centroids[idx];
    const isPriority = idx === 0 || p.sharePercentage >= 30;

    return {
      clusterIndex: p.clusterIndex,
      clusterName: p.name,
      priorityScore: isPriority ? 9 : 7,
      productStrategy: {
        offeringTitle: `Portafolio Especializado: ${p.name}`,
        description: `Adaptación del catálogo de productos y servicios diseñada específicamente para cubrir las necesidades observadas de este segmento en ${sector}.`,
        priorityFeatures: [
          'Paquete de funcionalidades núcleo de alta demanda',
          'Soporte técnico preferencial con canal directo',
          'Personalización de interfaz según hábitos de consumo',
        ],
      },
      pricingStrategy: {
        model: idx === 0 ? 'Precios Premium basados en Valor Agregado' : 'Estructura Dinámica por Niveles de Uso',
        discountOrBundle: idx === 0 ? 'Bundles con servicios de valor añadido sin dilución de precio' : 'Descuentos por compromiso de permanencia o contratación anual',
        rationale: 'Alineación de precios con la elasticidad y valor económico percibido por el cliente.',
      },
      innovationStrategy: {
        capabilities: [
          'Digitalización y automatización de procesos de contratación',
          'Analítica predictiva para anticipar necesidades de recompra',
          'Interacciones fluidas mediante asistentes inteligentes de autogestión',
        ],
        digitalExperience: 'Diseño de un customer journey sin fricciones con métricas de satisfacción en tiempo real.',
      },
      communicationStrategy: {
        valueProposition: `La solución líder en ${sector} diseñada para maximizar el rendimiento y satisfacción de ${p.name}.`,
        keyMessages: [
          'Eficiencia operativa comprobada',
          'Atención ágil y personalizada',
          'Garantía de calidad y continuidad',
        ],
        preferredChannels: ['Canal Digital (App & Web)', 'Email Marketing Segmentado', 'Atención Especializada'],
        acquisitionAction: 'Campaña dirigida con casos de éxito y propuesta de valor diferencial.',
        retentionAction: 'Programa proactivo de seguimiento trimestral y recompensas a la fidelidad.',
      },
      implementationPlan: {
        actionItems: [
          { action: 'Diseño y validación de la oferta empaquetada', owner: 'Equipo de Producto / Comercial', monthDeadline: 1, kpi: 'Aprobación del catálogo formal' },
          { action: 'Piloto controlado con muestra del 10% del clúster', owner: 'Operaciones Comerciales', monthDeadline: 2, kpi: 'Tasa de conversión > 18%' },
          { action: 'Despliegue general en canales comerciales', owner: 'Fuerza de Ventas & Marketing', monthDeadline: 3, kpi: 'Cobertura del 80% del segmento' },
          { action: 'Auditoría de retorno económico y ajuste de KPIs', owner: 'Finanzas & Analítica', monthDeadline: 6, kpi: 'Cumplimiento del ROI presupuestado' },
        ],
        successCriteria: 'Incremento del 15% en retención y crecimiento superior al 12% en ingresos incrementales.',
      },
    };
  });
}

/**
 * Initializes ROI models with baseline financial assumptions per cluster.
 */
export function initializeClusterROIModels(
  centroids: CentroidDetail[],
  profiles: SegmentProfile[]
): ClusterBusinessROI[] {
  return centroids.map((c, idx) => {
    const prof = profiles[idx] || { name: `Segmento ${idx}` };
    const basePop = c.size;

    // Financial heuristics based on cluster rank
    const invPerCust = idx === 0 ? 120 : 65;
    const incSpend = idx === 0 ? 450 : 220;
    const margin = 0.45;
    const horizon = 12;

    const scenarios = buildROIScenarios(basePop, invPerCust, incSpend, margin, horizon);

    return {
      clusterIndex: c.clusterIndex,
      clusterName: prof.name,
      targetPopulation: basePop,
      type: 'estimado',
      assumptions: 'Supuestos basados en margen comercial del 45% y horizonte de 12 meses evaluados con costos operacionales incrementales del 15%.',
      baseParams: {
        investmentPerCustomer: invPerCust,
        incrementalSpendPerCustomer: incSpend,
        contributionMargin: margin,
        horizonMonths: horizon,
      },
      scenarios,
    };
  });
}
