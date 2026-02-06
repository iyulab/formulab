import type { MaterialStandard, MaterialGradeConverterInput, MaterialGradeConverterResult } from './types.js';

interface GradeEntry {
  astm: string | null;
  en: string | null;
  jis: string | null;
  gb: string | null;
  ks: string | null;
  category: string;
  notes: string;
}

/**
 * Material grade equivalence table
 * @reference ASTM, EN, JIS, GB, KS standards cross-reference
 */
const GRADE_TABLE: GradeEntry[] = [
  // Structural Steel
  { astm: 'A36', en: 'S235JR', jis: 'SS400', gb: 'Q235B', ks: 'SS400', category: 'structural_steel', notes: 'General structural steel, Fy ≈ 250 MPa' },
  { astm: 'A572 Gr.50', en: 'S355JR', jis: 'SM490A', gb: 'Q345B', ks: 'SM490A', category: 'structural_steel', notes: 'High-strength low-alloy structural steel, Fy ≈ 345 MPa' },
  { astm: 'A283 Gr.C', en: 'S235JRG2', jis: 'SGD400', gb: 'Q235A', ks: 'SGD400', category: 'structural_steel', notes: 'Low/intermediate tensile strength plates' },
  { astm: 'A992', en: 'S355J2', jis: 'SM490B', gb: 'Q345C', ks: 'SM490B', category: 'structural_steel', notes: 'Wide-flange structural shapes' },

  // Stainless Steel
  { astm: 'A240 304', en: '1.4301', jis: 'SUS304', gb: '06Cr19Ni10', ks: 'STS304', category: 'stainless', notes: 'Austenitic 18/8 stainless, most common grade' },
  { astm: 'A240 304L', en: '1.4307', jis: 'SUS304L', gb: '022Cr19Ni10', ks: 'STS304L', category: 'stainless', notes: 'Low-carbon 304 for welding applications' },
  { astm: 'A240 316', en: '1.4401', jis: 'SUS316', gb: '06Cr17Ni12Mo2', ks: 'STS316', category: 'stainless', notes: 'Molybdenum-bearing austenitic, marine grade' },
  { astm: 'A240 316L', en: '1.4404', jis: 'SUS316L', gb: '022Cr17Ni12Mo2', ks: 'STS316L', category: 'stainless', notes: 'Low-carbon 316 for welding applications' },
  { astm: 'A240 430', en: '1.4016', jis: 'SUS430', gb: '10Cr17', ks: 'STS430', category: 'stainless', notes: 'Ferritic stainless, decorative/automotive trim' },
  { astm: 'A240 410', en: '1.4006', jis: 'SUS410', gb: '12Cr13', ks: 'STS410', category: 'stainless', notes: 'Martensitic stainless, general purpose' },

  // Machine Structural Steel
  { astm: 'A29 1045', en: 'C45E', jis: 'S45C', gb: '45', ks: 'SM45C', category: 'machine_structural', notes: 'Medium carbon steel, Fy ≈ 530 MPa (quenched & tempered)' },
  { astm: 'A29 1020', en: 'C22E', jis: 'S20C', gb: '20', ks: 'SM20C', category: 'machine_structural', notes: 'Low carbon steel for carburizing' },
  { astm: 'A29 4140', en: '42CrMo4', jis: 'SCM440', gb: '42CrMo', ks: 'SCM440', category: 'machine_structural', notes: 'Cr-Mo alloy steel, high hardenability' },
  { astm: 'A29 4340', en: '34CrNiMo6', jis: 'SNCM439', gb: '40CrNiMoA', ks: 'SNCM439', category: 'machine_structural', notes: 'Ni-Cr-Mo alloy steel, aerospace grade' },

  // Tool Steel
  { astm: 'A681 D2', en: '1.2379', jis: 'SKD11', gb: 'Cr12Mo1V1', ks: 'STD11', category: 'tool_steel', notes: 'Cold-work tool steel, high wear resistance' },
  { astm: 'A681 H13', en: '1.2344', jis: 'SKD61', gb: '4Cr5MoSiV1', ks: 'STD61', category: 'tool_steel', notes: 'Hot-work tool steel, die casting' },
  { astm: 'A681 S7', en: '1.2357', jis: 'SKS7', gb: '5CrW2Si', ks: 'STS7', category: 'tool_steel', notes: 'Shock-resistant tool steel' },

  // Spring Steel
  { astm: 'A29 9260', en: '60Si7', jis: 'SUP7', gb: '60Si2Mn', ks: 'SPS7', category: 'spring_steel', notes: 'Silicon-manganese spring steel' },
  { astm: 'A29 5160', en: '55Cr3', jis: 'SUP9', gb: '55CrMnA', ks: 'SPS9', category: 'spring_steel', notes: 'Chromium spring steel, leaf springs' },

  // Pressure Vessel
  { astm: 'A516 Gr.70', en: 'P355GH', jis: 'SGV480', gb: 'Q345R', ks: 'SGV480', category: 'pressure_vessel', notes: 'Moderate/low temperature pressure vessel plate' },
];

/**
 * Build lookup map for fast search
 */
function buildLookup(): Map<string, GradeEntry> {
  const map = new Map<string, GradeEntry>();
  for (const entry of GRADE_TABLE) {
    const standards: { key: MaterialStandard; val: string | null }[] = [
      { key: 'ASTM', val: entry.astm },
      { key: 'EN', val: entry.en },
      { key: 'JIS', val: entry.jis },
      { key: 'GB', val: entry.gb },
      { key: 'KS', val: entry.ks },
    ];
    for (const { key, val } of standards) {
      if (val != null) {
        map.set(`${key}:${val.toUpperCase()}`, entry);
      }
    }
  }
  return map;
}

const LOOKUP = buildLookup();

/**
 * Convert material grade between ASTM, EN, JIS, GB, and KS standards
 *
 * @reference ASTM, EN, JIS, GB, KS cross-reference tables
 * @param input - Source standard and grade designation
 * @returns Equivalent grades in all 5 standards with category info
 */
export function materialGradeConverter(input: MaterialGradeConverterInput): MaterialGradeConverterResult {
  const key = `${input.standard}:${input.grade.toUpperCase()}`;
  const entry = LOOKUP.get(key);

  if (!entry) {
    return {
      astm: null,
      en: null,
      jis: null,
      gb: null,
      ks: null,
      category: 'unknown',
      notes: `Grade "${input.grade}" not found in ${input.standard} standard`,
    };
  }

  return { ...entry };
}
