/**
 * 「최고위험 전사 결함군」 표의 구조 불변식.
 *
 * `CLAUDE.md` §6이 지목한 그 표들이다 — NIOSH 승수 · REBA 표 · ISO 2859 샘플링 플랜 · AP 매트릭스.
 * 2026-07에 이 부류에서 **독립적인 전사 슬립 4건**이 나왔다(이웃 축의 밴드를 복사 · 불규칙 셀을
 * 단조 패턴으로 매끄럽게 만듦 · 외삽값 창작 · 열 누락에 의한 off-by-one).
 *
 * §6(d)가 요구하는 것이 이것이다: **표준이 진술하는 구조 불변식을 테스트한다.** 셀 값을 다시 적는
 * 것은 골든 테스트가 아니고(§6(c)), 같은 오타를 두 번 쓰면 통과한다. 여기서 검사하는 성질은
 * 표준 자신이 정의상 보장하는 것들이라 **표를 보지 않고도 참이어야 한다** — 그래서 전사 슬립이
 * 이 성질을 깨면 표가 틀렸다고 말할 수 있다.
 *
 * 공개 API로 구동한다 — 표 상수를 직접 읽지 않는다. 밴드 매핑·합산·판정까지 포함한 경로 전체가
 * 불변식을 지키는지가 실제로 묻고 싶은 것이기 때문이다.
 */
import { describe, it, expect } from 'vitest';
import { aql, AQL_LOT_SIZE_RANGES } from './aql.js';
import { ergonomicRisk } from '../safety/ergonomicRisk.js';
import type { InspectionLevel } from './types.js';
import type { RebaInput, NioshInput } from '../safety/types.js';
import { nioshLifting, NIOSH_LOAD_CONSTANT_KG } from '../safety/nioshLifting.js';

describe('ISO 2859-1 샘플링 플랜 — 구조 불변식', () => {
  const AQLS = [0.065, 0.1, 0.15, 0.25, 0.4, 0.65, 1.0, 1.5, 2.5, 4.0, 6.5, 10, 15, 25];
  const LOTS = [2, 8, 15, 25, 50, 90, 150, 280, 500, 1200, 3200, 10000, 35000, 150000, 500000, 1000000];
  const LEVELS: InspectionLevel[] = ['S-1', 'S-2', 'S-3', 'S-4', 'I', 'II', 'III'];

  it('단일 샘플링 정상검사에서 Re = Ac + 1 이다 (전 조합)', () => {
    for (const lotSize of LOTS) {
      for (const aqlLevel of AQLS) {
        const r = aql({ lotSize, aqlLevel, inspectionLevel: 'II' });
        expect(r.rejectNumber, `lot ${lotSize} · AQL ${aqlLevel}: Ac=${r.acceptNumber} Re=${r.rejectNumber}`).toBe(r.acceptNumber + 1);
      }
    }
  });

  it('AQL 이 느슨해지면 합격판정개수는 줄지 않는다', () => {
    for (const lotSize of LOTS) {
      let prev = -1;
      for (const aqlLevel of AQLS) {
        const r = aql({ lotSize, aqlLevel, inspectionLevel: 'II' });
        // 적용된 열이 요청과 다를 수 있다(표의 화살표 관례) — 그때는 비교를 건너뛴다.
        if (r.appliedAql !== undefined && r.appliedAql !== aqlLevel) continue;
        expect(r.acceptNumber, `lot ${lotSize} · AQL ${aqlLevel} 에서 Ac 가 감소`).toBeGreaterThanOrEqual(prev);
        prev = r.acceptNumber;
      }
    }
  });

  it('로트가 커지면 시료 수는 줄지 않는다', () => {
    for (const aqlLevel of [0.65, 1.0, 2.5, 4.0]) {
      let prev = 0;
      for (const lotSize of LOTS) {
        const r = aql({ lotSize, aqlLevel, inspectionLevel: 'II' });
        expect(r.sampleSize, `AQL ${aqlLevel} · lot ${lotSize} 에서 시료 수가 감소`).toBeGreaterThanOrEqual(prev);
        prev = r.sampleSize;
      }
    }
  });

  it('검사 수준이 엄격해지면(S-1→III) 시료 수는 줄지 않는다', () => {
    for (const lotSize of LOTS) {
      let prev = 0;
      for (const level of LEVELS) {
        const r = aql({ lotSize, aqlLevel: 1.0, inspectionLevel: level });
        expect(r.sampleSize, `lot ${lotSize} · level ${level} 에서 시료 수가 감소`).toBeGreaterThanOrEqual(prev);
        prev = r.sampleSize;
      }
    }
  });

  it('로트 구간표는 빈틈도 겹침도 없이 이어진다', () => {
    for (let i = 1; i < AQL_LOT_SIZE_RANGES.length; i++) {
      const prev = AQL_LOT_SIZE_RANGES[i - 1];
      const cur = AQL_LOT_SIZE_RANGES[i];
      expect(cur.from, `구간 ${i}: ${prev.upTo} 다음이 ${cur.from}`).toBe(prev.upTo + 1);
      expect(cur.upTo, `구간 ${i} 상한이 하한보다 작다`).toBeGreaterThan(cur.from - 1);
    }
    expect(AQL_LOT_SIZE_RANGES[AQL_LOT_SIZE_RANGES.length - 1].upTo).toBe(Infinity);
  });
});

describe('REBA — 자세가 나빠지면 위험 점수는 내려가지 않는다', () => {
  /** 중립 자세. 한 축만 바꿔 가며 단조성을 본다. */
  const NEUTRAL: RebaInput = {
    trunkAngle: 0, trunkTwisted: false, trunkSideBent: false,
    neckAngle: 0, neckTwisted: false, neckSideBent: false,
    legSupport: 'bilateral', kneeFlexion: 0,
    upperArmAngle: 0, shoulderRaised: false, armAbducted: false, armSupported: false,
    lowerArmAngle: 90,
    wristAngle: 0, wristTwisted: false,
    loadKg: 0, shockOrRapidBuildup: false,
    staticPosture: false, repeatedSmallRange: false, rapidLargeChange: false,
    coupling: 'good',
  };

  // ⚠️ **굴곡(+) 방향만 쓴다.** REBA는 신전(−)도 위험으로 치므로 부호 있는 각도에 대해서는
  // 단조가 아니다 — 0 을 지나며 점수가 다시 올라간다. 단조성은 「한쪽 방향으로 나빠질 때」의
  // 성질이고, 그 범위에서만 참이다.
  /**
   * 🔴 **최종 점수만 보면 눈이 먼다.** Table C 는 낮은 구간에서 포화한다 — 예컨대 C[1][1] 와
   * C[2][1] 이 둘 다 1 이라, Table A 의 셀이 2 → 1 로 망가져도 최종 REBA 점수는 그대로다.
   * (뮤테이션으로 실측: Trunk=3/Neck=1/Legs=1 셀을 2→1 로 바꿨더니 `rebaScore` 단조성은 통과했다.)
   * 그래서 **중간 점수 A·B 의 단조성을 함께 단언**한다 — 그쪽이 표 자신의 성질이고, 합성 단계가
   * 가리지 못한다.
   */
  const sweep = (label: string, mutate: (v: number) => Partial<RebaInput>, values: number[], axis: 'A' | 'B' | null = null) => {
    it(`${label} 가 커지면 REBA 점수가 줄지 않는다${axis ? ` (중간 점수 ${axis} 포함)` : ''}`, () => {
      let prevTotal = -1;
      let prevAxis = -1;
      for (const v of values) {
        const r = ergonomicRisk({ ...NEUTRAL, ...mutate(v) });
        expect(r.rebaScore, `${label}=${v} 에서 점수가 ${prevTotal} → ${r.rebaScore} 로 감소`).toBeGreaterThanOrEqual(prevTotal);
        prevTotal = r.rebaScore;
        if (axis) {
          const cur = axis === 'A' ? r.scoreA : r.scoreB;
          expect(cur, `${label}=${v} 에서 중간 점수 ${axis} 가 ${prevAxis} → ${cur} 로 감소`).toBeGreaterThanOrEqual(prevAxis);
          prevAxis = cur;
        }
      }
    });
  };

  sweep('몸통 굴곡', (v) => ({ trunkAngle: v }), [0, 5, 15, 25, 45, 60, 75, 90], 'A');
  sweep('목 굴곡', (v) => ({ neckAngle: v }), [0, 5, 10, 20, 30, 45], 'A');
  sweep('위팔 각도', (v) => ({ upperArmAngle: v }), [0, 10, 20, 30, 45, 60, 90, 120], 'B');
  sweep('손목 각도', (v) => ({ wristAngle: v }), [0, 5, 10, 15, 20, 30], 'B');
  sweep('취급 하중', (v) => ({ loadKg: v }), [0, 2, 5, 8, 10, 15, 25]);

  it('점수는 REBA 정의역 1~15 안에 있고 위험 등급과 정합한다', () => {
    const cases: RebaInput[] = [
      NEUTRAL,
      { ...NEUTRAL, trunkAngle: 90, neckAngle: 45, upperArmAngle: 120, loadKg: 25, coupling: 'unacceptable', staticPosture: true },
      { ...NEUTRAL, trunkAngle: 30, upperArmAngle: 60, loadKg: 8 },
    ];
    for (const c of cases) {
      const r = ergonomicRisk(c);
      expect(r.rebaScore).toBeGreaterThanOrEqual(1);
      expect(r.rebaScore).toBeLessThanOrEqual(15);
      // 등급 경계는 Hignett & McAtamney 2000: 1 / 2-3 / 4-7 / 8-10 / 11-15
      const expected =
        r.rebaScore === 1 ? 'negligible'
        : r.rebaScore <= 3 ? 'low'
        : r.rebaScore <= 7 ? 'medium'
        : r.rebaScore <= 10 ? 'high' : 'very-high';
      expect(r.riskLevel, `점수 ${r.rebaScore} 의 등급`).toBe(expected);
    }
  });

  it('커플링·활동 점수는 위험을 낮추지 않는다', () => {
    const base = ergonomicRisk({ ...NEUTRAL, trunkAngle: 30, upperArmAngle: 45 });
    for (const coupling of ['good', 'fair', 'poor', 'unacceptable'] as const) {
      const r = ergonomicRisk({ ...NEUTRAL, trunkAngle: 30, upperArmAngle: 45, coupling });
      expect(r.rebaScore, `coupling ${coupling}`).toBeGreaterThanOrEqual(base.rebaScore);
    }
    const withActivity = ergonomicRisk({ ...NEUTRAL, trunkAngle: 30, upperArmAngle: 45, staticPosture: true, repeatedSmallRange: true });
    expect(withActivity.rebaScore).toBeGreaterThanOrEqual(base.rebaScore);
  });
});

describe('NIOSH 94-110 승수 표 — 구조 불변식', () => {
  /** 기준 조건. 한 축만 바꿔 가며 승수 자신의 단조성을 본다. */
  const BASE: NioshInput = {
    horizontalDistance: 25, verticalDistance: 75, verticalTravel: 25,
    asymmetryAngle: 0, frequency: 1, duration: 'short',
    coupling: 'good', loadWeight: 10,
  };
  const FREQS = [0.2, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const DURATIONS = ['short', 'medium', 'long'] as const;

  it('모든 승수는 0 이상 1 이하이고, RWL 은 하중상수 23 kg 를 넘지 않는다', () => {
    for (const duration of DURATIONS) {
      for (const frequency of FREQS) {
        for (const coupling of ['good', 'fair', 'poor'] as const) {
          const r = nioshLifting({ ...BASE, duration, frequency, coupling });
          for (const [name, m] of [['hm', r.hm], ['vm', r.vm], ['dm', r.dm], ['am', r.am], ['fm', r.fm], ['cm', r.cm]] as const) {
            expect(m, `${name} = ${m} (duration ${duration} · f ${frequency})`).toBeGreaterThanOrEqual(0);
            expect(m, `${name} = ${m} (duration ${duration} · f ${frequency})`).toBeLessThanOrEqual(1);
          }
          expect(r.rwl, `RWL ${r.rwl} > LC 23`).toBeLessThanOrEqual(NIOSH_LOAD_CONSTANT_KG);
          expect(r.rwl).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  /**
   * 🔴 **승법 합성은 0 으로 흡수한다.** FM 이 0 인 구간에서는 RWL 이 0 이라, 다른 승수가 망가져도
   * 최종값이 그대로다 — cycle-409 에서 REBA Table C 의 포화가 Table A 결함을 가린 것과 같은 형태다.
   * 그래서 **승수 자신**(`r.fm`·`r.cm`)의 단조성을 단언한다(`SIP-409-01`).
   */
  it('빈도가 올라가면 FM 은 줄어들기만 한다 (각 작업시간대에서)', () => {
    for (const duration of DURATIONS) {
      let prev = Infinity;
      for (const frequency of FREQS) {
        const { fm } = nioshLifting({ ...BASE, duration, frequency });
        expect(fm, `duration ${duration} · f ${frequency}: FM 이 ${prev} → ${fm} 로 증가`).toBeLessThanOrEqual(prev);
        prev = fm;
      }
    }
  });

  it('작업시간이 길어지면 FM 은 줄어들기만 한다 (short ≥ medium ≥ long)', () => {
    for (const frequency of FREQS) {
      const fms = DURATIONS.map((duration) => nioshLifting({ ...BASE, duration, frequency }).fm);
      for (let i = 1; i < fms.length; i++) {
        expect(fms[i], `f ${frequency}: ${DURATIONS[i]} FM ${fms[i]} > ${DURATIONS[i - 1]} FM ${fms[i - 1]}`).toBeLessThanOrEqual(fms[i - 1]);
      }
    }
  });

  it('V ≥ 75cm 의 FM 은 V < 75cm 보다 작지 않다 (낮은 자세가 더 제한적이다)', () => {
    for (const duration of DURATIONS) {
      for (const frequency of FREQS) {
        const low = nioshLifting({ ...BASE, duration, frequency, verticalDistance: 40 }).fm;
        const high = nioshLifting({ ...BASE, duration, frequency, verticalDistance: 100 }).fm;
        expect(high, `duration ${duration} · f ${frequency}: V<75 ${low} > V≥75 ${high}`).toBeGreaterThanOrEqual(low);
      }
    }
  });

  it('커플링 품질이 나빠지면 CM 은 줄어들기만 한다 (good ≥ fair ≥ poor)', () => {
    for (const verticalDistance of [40, 100]) {
      const cms = (['good', 'fair', 'poor'] as const).map((coupling) => nioshLifting({ ...BASE, coupling, verticalDistance }).cm);
      for (let i = 1; i < cms.length; i++) {
        expect(cms[i], `V ${verticalDistance}: CM 이 커졌다 ${cms[i - 1]} → ${cms[i]}`).toBeLessThanOrEqual(cms[i - 1]);
      }
    }
  });

  it('수평거리가 멀어지면 RWL 은 줄어들기만 한다', () => {
    let prev = Infinity;
    for (const horizontalDistance of [25, 30, 35, 40, 45, 50, 55, 60]) {
      const { rwl } = nioshLifting({ ...BASE, horizontalDistance });
      expect(rwl, `H ${horizontalDistance}: RWL 이 ${prev} → ${rwl} 로 증가`).toBeLessThanOrEqual(prev);
      prev = rwl;
    }
  });

  it('기준 조건(모든 승수 1)에서 RWL = 하중상수 23 kg', () => {
    // H=25 · V=75 · D=25 · A=0 · f=0.2/short · good coupling → 전 승수 1.0 이 NIOSH 의 정의다.
    const r = nioshLifting({
      horizontalDistance: 25, verticalDistance: 75, verticalTravel: 25,
      asymmetryAngle: 0, frequency: 0.2, duration: 'short', coupling: 'good', loadWeight: 10,
    });
    expect(r.hm).toBeCloseTo(1, 2);
    expect(r.vm).toBeCloseTo(1, 2);
    expect(r.am).toBeCloseTo(1, 2);
    expect(r.fm).toBeCloseTo(1, 2);
    expect(r.cm).toBeCloseTo(1, 2);
    expect(r.rwl).toBeCloseTo(NIOSH_LOAD_CONSTANT_KG * r.dm, 1);
  });
});
