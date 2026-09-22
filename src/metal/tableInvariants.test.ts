/**
 * 표 조회형 함수의 **행 불변식** 스윕.
 *
 * 왜 있는가: 2026-09-15에 ASME B16.5 flange 표에서 **행이 21개인데 표준은 24개**이고 raised-face
 * 두께가 섞여 있는 결함이 나왔다(formulab 0.47.0에서 교정). 그 결함은 어떤 게이트도 잡지 못했다 —
 * 타입은 맞고, 값은 숫자이고, 개별 골든 테스트는 그 행을 겨누지 않았기 때문이다. 같은 클래스의
 * 결함이 pipe·thread·screw 표에도 있을 수 있는데, **표를 한 번 더 베껴 쓰는 테스트는 아무것도
 * 증명하지 못한다**(같은 오타를 두 번 쓰면 통과한다).
 *
 * 그래서 이 스윕이 검사하는 것은 **값이 아니라 값들 사이의 관계**다 — 표에서 독립적으로 도출되고,
 * 표준을 재진술하지 않으며, 한 행만 틀려도 깨지는 것:
 *
 *   ① 단조성 — 치수가 호칭 순서대로 커진다
 *   ② 물리적 성립 — 벽두께 < 반지름, 탭드릴 < 외경, 여유구멍 > 나사 외경
 *   ③ 도출 관계 — 탭드릴 ≈ 외경 − 피치 (ISO metric 100% 나사 관례), 미국계는 피치 = 25.4/tpi
 *   ④ 참조 무결성 — DN↔NPS 매핑이 가리키는 행이 실재한다
 *
 * ⚠️ **불변식은 «그럴듯한 것»이 아니라 «실제로 참인 것»이어야 한다.** 초안에 «XXS ≥ SCH160»을
 * 넣었다가 뺐다 — ASME B36.10에서 XXS는 고정 두께라 8" 이상에서 SCH160이 XXS를 넘어선다(표의
 * 실제 값이 그렇고, 그것이 맞다). 표를 의심하기 전에 불변식을 의심해야 한다.
 */
import { describe, it, expect } from 'vitest';
import { pipeSpec, getPipeSizes } from './pipeSpec.js';
import { thread, getMetricSizes, getUnifiedSizes } from './thread.js';
import { screw, getDesignations } from './screw.js';
import { flangeSpec, getFlangeSizes } from './flangeSpec.js';
import { awgProperties } from '../electronics/awg.js';

describe('표 불변식 — ASME B36.10 배관 치수', () => {
  const sizes = getPipeSizes();

  it('호칭이 커지면 바깥지름도 반드시 커진다', () => {
    const ods = sizes.map((nps) => ({ nps, od: pipeSpec({ standard: 'ANSI', nominalSize: nps, schedule: 'SCH40' }).outerDiameter }));
    for (let i = 1; i < ods.length; i++) {
      expect(ods[i].od, `${ods[i].nps} 의 OD 가 ${ods[i - 1].nps} 보다 크지 않다`).toBeGreaterThan(ods[i - 1].od);
    }
  });

  it('번호가 붙은 스케줄은 번호 순서대로 두꺼워진다 (SCH5 < 10 < 40 < 80 < 160)', () => {
    const ladder = ['SCH5', 'SCH10', 'SCH40', 'SCH80', 'SCH160'] as const;
    for (const nps of sizes) {
      const walls = ladder
        .map((s) => {
          try {
            return { s, t: pipeSpec({ standard: 'ANSI', nominalSize: nps, schedule: s }).wallThickness };
          } catch {
            return null; // 그 호칭에 없는 스케줄은 건너뛴다
          }
        })
        .filter((x): x is { s: (typeof ladder)[number]; t: number } => x !== null);
      for (let i = 1; i < walls.length; i++) {
        expect(walls[i].t, `${nps} ${walls[i].s} 가 ${walls[i - 1].s} 보다 두껍지 않다`).toBeGreaterThan(walls[i - 1].t);
      }
    }
  });

  it('벽두께는 반지름보다 얇다 (안지름이 남아야 관이다)', () => {
    for (const nps of sizes) {
      const r = pipeSpec({ standard: 'ANSI', nominalSize: nps, schedule: 'SCH40' });
      expect(r.wallThickness, `${nps}`).toBeLessThan(r.outerDiameter / 2);
      expect(r.innerDiameter, `${nps}`).toBeGreaterThan(0);
      expect(r.innerDiameter).toBeCloseTo(r.outerDiameter - 2 * r.wallThickness, 6);
    }
  });
});

describe('표 불변식 — 나사 규격', () => {
  it('ISO 미터 보통나사: 탭드릴 ≈ 외경 − 피치, 그리고 반드시 외경보다 작다', () => {
    for (const size of getMetricSizes()) {
      const r = thread({ type: 'metric', size });
      expect(r.tapDrill, `${size} 탭드릴이 외경 이상`).toBeLessThan(r.majorDiameter);
      // 100% 나사 관례. 표의 반올림 폭을 고려해 0.1 mm 허용.
      expect(Math.abs(r.tapDrill - (r.majorDiameter - r.pitch)), `${size}: 탭드릴 ${r.tapDrill} vs 외경−피치 ${r.majorDiameter - r.pitch}`).toBeLessThanOrEqual(0.1);
    }
  });

  // ⚠️ `ThreadResult.pitch` 는 metric 에서 **mm**, unified 에서 **TPI** 다(타입 주석이 그렇게 적고
  // 있고, 소비자도 단위를 구분해 표시한다). 초안은 이 사실을 모르고 mm 로 읽어 실패했다 —
  // 표가 아니라 불변식이 틀린 경우였다. unified 는 mm 로 환산한 뒤에 같은 관계를 적용한다.
  // 🔴 **알려진 이상치 1건 — 허용오차를 늘려 흡수하지 않는다.** 나머지 10행은 전부 ±0.078 mm 안인데
  // `5/8-11` 만 −0.176 mm 로 다음 큰 편차의 2배가 넘는다. ASME B1.1 원문을 확보하지 못해
  // **추측해 고치지 않았고**(formulab CLAUDE.md §6(a) — 표준 없이 «그럴듯한» 값을 재구성하지 말 것),
  // 대신 이 자리에 못 박아 **더 흔들리면 깨지게** 했다. 정본:
  // `claudedocs/issues/ISSUE-formulab-20260922-unified-thread-tap-drill-outlier.md`
  const UNIFIED_TAP_DRILL_OUTLIERS: Record<string, number> = { '5/8-11': -0.176 };

  it('미국계 나사: 탭드릴 ≈ 외경 − 25.4/tpi (pitch 필드는 TPI 다)', () => {
    for (const size of getUnifiedSizes()) {
      const r = thread({ type: 'unified', size });
      const pitchMm = 25.4 / r.pitch;
      const dev = r.tapDrill - (r.majorDiameter - pitchMm);
      expect(r.tapDrill, `${size} 탭드릴이 외경 이상`).toBeLessThan(r.majorDiameter);
      const known = UNIFIED_TAP_DRILL_OUTLIERS[size];
      if (known !== undefined) {
        // 이상치는 «값이 이만큼 어긋나 있다»를 그대로 고정한다 — 해소되면 이 단언이 먼저 깨진다.
        expect(dev, `${size}: 알려진 이상치의 편차가 바뀌었다`).toBeCloseTo(known, 3);
      } else {
        expect(Math.abs(dev), `${size}: 탭드릴 ${r.tapDrill} vs 외경−피치 ${r.majorDiameter - pitchMm}`).toBeLessThanOrEqual(0.1);
      }
    }
  });

  it('외경은 호칭 순서대로 커진다 (metric)', () => {
    const ds = getMetricSizes().map((s) => ({ s, d: thread({ type: 'metric', size: s }).majorDiameter }));
    for (let i = 1; i < ds.length; i++) {
      expect(ds[i].d, `${ds[i].s} 외경이 ${ds[i - 1].s} 보다 크지 않다`).toBeGreaterThan(ds[i - 1].d);
    }
  });
});

describe('표 불변식 — ISO 273 나사 여유구멍', () => {
  const sizes = getDesignations();
  const both = (d: string) => ({
    coarse: screw({ designation: d, pitchType: 'coarse' }),
    fine: screw({ designation: d, pitchType: 'fine' }),
  });

  it('여유구멍은 나사 외경보다 크고, close < free 순서다', () => {
    for (const size of sizes) {
      const r = both(size).coarse;
      expect(r.clearanceClose, `${size} close 구멍이 나사보다 작다`).toBeGreaterThan(r.nominalDiameter);
      expect(r.clearanceFree, `${size} free 가 close 보다 크지 않다`).toBeGreaterThan(r.clearanceClose);
    }
  });

  it('보통피치 > 가는피치, 둘 다 양수', () => {
    for (const size of sizes) {
      const { coarse, fine } = both(size);
      expect(coarse.pitch, `${size}`).toBeGreaterThan(0);
      expect(fine.pitch, `${size}`).toBeGreaterThan(0);
      expect(coarse.pitch, `${size}: 보통피치가 가는피치보다 크지 않다`).toBeGreaterThan(fine.pitch);
    }
  });

  it('탭드릴 = 외경 − 피치 이고 골지름보다 크지 않다', () => {
    for (const size of sizes) {
      const r = both(size).coarse;
      expect(r.tapDrill, `${size}`).toBeCloseTo(r.nominalDiameter - r.pitch, 2);
      expect(r.minorDiameter, `${size}: 골지름이 탭드릴보다 크다`).toBeLessThanOrEqual(r.tapDrill);
    }
  });

  it('호칭이 커지면 피치와 여유구멍도 줄지 않는다', () => {
    const rows = sizes.map((d) => both(d).coarse);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].nominalDiameter, `${rows[i].designation}`).toBeGreaterThan(rows[i - 1].nominalDiameter);
      expect(rows[i].pitch, `${rows[i].designation} 보통피치가 이전 호칭보다 작다`).toBeGreaterThanOrEqual(rows[i - 1].pitch);
      expect(rows[i].clearanceClose, `${rows[i].designation} close 구멍이 이전 호칭보다 작다`).toBeGreaterThan(rows[i - 1].clearanceClose);
    }
  });
});

describe('표 불변식 — ASME B16.5 플랜지', () => {
  const sizes = getFlangeSizes();
  const CLASSES = ['150', '300', '600'] as const;
  const at = (nps: string, cls: (typeof CLASSES)[number]) =>
    flangeSpec({ standard: 'ASME_B16_5', nominalSize: nps, pressureClass: cls });

  it('기하 포섭: 레이즈드페이스 < 볼트원 < 플랜지 바깥지름', () => {
    for (const nps of sizes) {
      for (const cls of CLASSES) {
        const r = at(nps, cls);
        expect(r.raisedFaceDiameter, `${nps}" class ${cls}: RF가 볼트원보다 작지 않다`).toBeLessThan(r.boltCircleDiameter);
        expect(r.boltCircleDiameter, `${nps}" class ${cls}: 볼트원이 플랜지 OD보다 작지 않다`).toBeLessThan(r.outerDiameter);
      }
    }
  });

  /**
   * 🔴 이 불변식이 이 파일이 존재하는 이유다. 2026-09-15 이전 표는 **대부분 행의 raised-face 열에
   * 배관 OD가 들어 있었다** — 배관 OD는 등급과 무관하지만 «그래서 맞다»가 아니라 **다른 양**이었다.
   * B16.5에서 RF 지름은 class 150~600 구간에서 호칭에만 의존하므로, 등급 간 불일치는 곧 전사 사고다.
   */
  it('레이즈드페이스 지름은 등급(150·300·600)이 달라도 같다', () => {
    for (const nps of sizes) {
      const rf = CLASSES.map((c) => at(nps, c).raisedFaceDiameter);
      expect(new Set(rf).size, `${nps}": RF가 등급마다 다르다 — ${rf.join(' / ')}`).toBe(1);
    }
  });

  it('같은 호칭에서 등급이 올라가면 두께·무게가 줄지 않는다', () => {
    for (const nps of sizes) {
      const rows = CLASSES.map((c) => at(nps, c));
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].thickness, `${nps}" class ${CLASSES[i]} 두께가 ${CLASSES[i - 1]} 보다 얇다`).toBeGreaterThanOrEqual(rows[i - 1].thickness);
        expect(rows[i].weight, `${nps}" class ${CLASSES[i]} 무게가 ${CLASSES[i - 1]} 보다 가볍다`).toBeGreaterThanOrEqual(rows[i - 1].weight);
        expect(rows[i].outerDiameter, `${nps}" class ${CLASSES[i]} OD가 ${CLASSES[i - 1]} 보다 작다`).toBeGreaterThanOrEqual(rows[i - 1].outerDiameter);
      }
    }
  });

  it('같은 등급에서 호칭이 커지면 치수가 커지고 볼트 수가 줄지 않는다', () => {
    for (const cls of CLASSES) {
      const rows = sizes.map((n) => ({ n, ...at(n, cls) }));
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].outerDiameter, `class ${cls} ${rows[i].n}" OD`).toBeGreaterThan(rows[i - 1].outerDiameter);
        expect(rows[i].boltCircleDiameter, `class ${cls} ${rows[i].n}" 볼트원`).toBeGreaterThan(rows[i - 1].boltCircleDiameter);
        expect(rows[i].raisedFaceDiameter, `class ${cls} ${rows[i].n}" RF`).toBeGreaterThan(rows[i - 1].raisedFaceDiameter);
        expect(rows[i].boltHoles, `class ${cls} ${rows[i].n}" 볼트 수가 이전 호칭보다 적다`).toBeGreaterThanOrEqual(rows[i - 1].boltHoles);
      }
    }
  });

  it('볼트 구멍 수는 4의 배수다 (원주 대칭 배치)', () => {
    for (const nps of sizes) {
      for (const cls of CLASSES) {
        const r = at(nps, cls);
        expect(r.boltHoles % 4, `${nps}" class ${cls}: 볼트 ${r.boltHoles}개`).toBe(0);
      }
    }
  });
});

describe('표 불변식 — AWG 기하급수 (ASTM B258)', () => {
  // AWG는 표가 아니라 **기하급수 공식**이다: d = 0.127 × 92^((36−n)/39) mm.
  // 그래서 검사 대상도 행이 아니라 그 급수가 실제로 갖는 성질이다.
  const GAUGES = Array.from({ length: 41 }, (_, i) => i); // 0 … 40

  it('게이지가 커지면 지름·단면적은 단조 감소하고 저항은 단조 증가한다', () => {
    const rows = GAUGES.map((awg) => awgProperties({ awg, material: 'copper', tempC: 20 }));
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].diameterMm, `AWG ${i}`).toBeLessThan(rows[i - 1].diameterMm);
      expect(rows[i].areaMm2, `AWG ${i}`).toBeLessThan(rows[i - 1].areaMm2);
      expect(rows[i].resistancePerM, `AWG ${i} 저항이 이전 게이지보다 크지 않다`).toBeGreaterThan(rows[i - 1].resistancePerM);
    }
  });

  it('6 게이지 차 ≈ 지름 2배, 3 게이지 차 ≈ 단면적 2배 (급수의 정의적 성질)', () => {
    for (let n = 0; n + 6 <= 40; n++) {
      const a = awgProperties({ awg: n, material: 'copper', tempC: 20 });
      const b = awgProperties({ awg: n + 6, material: 'copper', tempC: 20 });
      expect(a.diameterMm / b.diameterMm, `AWG ${n} vs ${n + 6}`).toBeCloseTo(2, 1);
    }
    for (let n = 0; n + 3 <= 40; n++) {
      const a = awgProperties({ awg: n, material: 'copper', tempC: 20 });
      const b = awgProperties({ awg: n + 3, material: 'copper', tempC: 20 });
      expect(a.areaMm2 / b.areaMm2, `AWG ${n} vs ${n + 3} 단면적비`).toBeCloseTo(2, 1);
    }
  });

  it('표준 앵커: AWG 10 = 0.1019 in · AWG 0 = 0.3249 in (ASTM B258)', () => {
    // 급수식이 맞다는 것은 단조성만으로는 증명되지 않는다 — 표준이 공표한 지점에 실제로 닿아야 한다.
    expect(awgProperties({ awg: 10, material: 'copper', tempC: 20 }).diameterMm / 25.4).toBeCloseTo(0.1019, 4);
    expect(awgProperties({ awg: 0, material: 'copper', tempC: 20 }).diameterMm / 25.4).toBeCloseTo(0.3249, 4);
  });
});
