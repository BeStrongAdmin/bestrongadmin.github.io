import { Injectable } from '@angular/core';
import rawData from '../data/bestrong_exercises.json';
import exerciseImagesMap from '../data/exercise_images_map.json';

export interface Exercise {
  id: string;
  name_es: string;
  name_en: string;
  movement_pattern: string;
  fatigue_score?: number;
  stimulus_score?: number;
  priority_rank?: number;
  emphasis?: string;
  contraindications?: string[];
  ideal_for?: string[];
  best_for_level?: string[];
  primary_muscle_es: string[];
  primary_muscle_en?: string;
  secondary_muscles_es?: string[];
  secondary_muscles_en?: string[];
  equipment_es?: string[];
  equipment_en?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  exerciseLevel?: 'beginner' | 'intermediate' | 'advanced';
  presets?: {
    beginner: { sets: number; repsRange: { hypertrophy: string; strength: string; endurance: string } };
    intermediate: { sets: number; repsRange: { hypertrophy: string; strength: string; endurance: string } };
    advanced: { sets: number; repsRange: { hypertrophy: string; strength: string; endurance: string } };
  };
  is_compound?: boolean;
  is_isolation?: boolean;
  img_src?: string;
  popularity?: number;
}

function normalizeMuscles(muscles: any): string[] {
  if (!muscles) return [];
  const rawArray = Array.isArray(muscles) ? muscles : [muscles];
  const normalized: string[] = [];
  for (const muscle of rawArray) {
    const m = String(muscle).trim();
    if (['Deltoides', 'Deltoides anterior', 'Deltoides medio', 'Deltoides posterior', 'Hombro'].includes(m)) {
      normalized.push('Hombros');
    } else if (['Pectorales', 'Pectoral'].includes(m)) {
      normalized.push('Pecho');
    } else if (['Femoral', 'Isquios'].includes(m)) {
      normalized.push('Isquiotibiales');
    } else if (['Pantorrillas'].includes(m)) {
      normalized.push('Gemelos');
    } else {
      normalized.push(m);
    }
  }
  return [...new Set(normalized)];
}

@Injectable({
  providedIn: 'root'
})
export class ExercisesService {
  private exercises: Exercise[] = [];
  private exerciseMap = new Map<string, Exercise>();

  constructor() {
    this.loadExercises();
  }

  private loadExercises(): void {
    const rawList = (rawData as any)?.exercises || (rawData as any)?.default?.exercises || rawData;
    if (Array.isArray(rawList)) {
      this.exercises = rawList.map((ex: any) => {
        const mapped: Exercise = {
          ...ex,
          primary_muscle_es: normalizeMuscles(ex.primary_muscle_es),
          secondary_muscles_es: normalizeMuscles(ex.secondary_muscles_es)
        };
        this.exerciseMap.set(mapped.id, mapped);
        return mapped;
      });
    }
  }

  getAll(): Exercise[] {
    return this.exercises;
  }

  getById(id: string): Exercise | undefined {
    return this.exerciseMap.get(id);
  }

  getForPattern(pattern: string, emphasis?: string): Exercise[] {
    let list = this.exercises.filter(e => {
      if (!e.movement_pattern) return false;
      const pat = e.movement_pattern.toLowerCase().trim();
      const targetPat = pattern.toLowerCase().trim();

      if (pat === targetPat) return true;
      if (targetPat === 'core' && (pat.includes('core') || pat.includes('ab') || pat === 'spinal_flexion')) return true;
      if (targetPat === 'squat' && pat.includes('squat')) return true;
      if (targetPat === 'hinge' && (pat.includes('hinge') || pat.includes('deadlift'))) return true;
      return false;
    });

    if (emphasis) {
      const filteredByEmphasis = list.filter(e => e.emphasis && e.emphasis.toLowerCase() === emphasis.toLowerCase());
      if (filteredByEmphasis.length > 0) {
        list = filteredByEmphasis;
      }
    }

    return list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  getMuscles(): string[] {
    const set = new Set<string>();
    for (const ex of this.exercises) {
      for (const m of ex.primary_muscle_es) {
        if (m) set.add(m);
      }
    }
    return Array.from(set).sort();
  }

  private imageMap: Record<string, string> = exerciseImagesMap as Record<string, string>;

  search(query: string, muscleFilter?: string, patternFilter?: string): Exercise[] {
    const q = query.toLowerCase().trim();
    return this.exercises.filter(ex => {
      if (muscleFilter && muscleFilter !== 'all') {
        const hasMuscle = ex.primary_muscle_es.some(m => m.toLowerCase() === muscleFilter.toLowerCase());
        if (!hasMuscle) return false;
      }

      if (patternFilter && patternFilter !== 'all') {
        if (ex.movement_pattern?.toLowerCase() !== patternFilter.toLowerCase()) {
          return false;
        }
      }

      if (!q) return true;

      const nameEs = ex.name_es?.toLowerCase() || '';
      const nameEn = ex.name_en?.toLowerCase() || '';
      return nameEs.includes(q) || nameEn.includes(q) || ex.id.toLowerCase().includes(q);
    });
  }

  getImageUrl(idOrImgSrc?: string): string {
    if (!idOrImgSrc) return '';
    const clean = idOrImgSrc.replace('.gif', '').replace('.png', '').replace('.jpg', '');
    if (this.imageMap[clean]) {
      return this.imageMap[clean];
    }
    const ex = this.exerciseMap.get(idOrImgSrc);
    if (ex && ex.img_src) {
      const exKey = ex.img_src.replace('.gif', '').replace('.png', '').replace('.jpg', '');
      if (this.imageMap[exKey]) {
        return this.imageMap[exKey];
      }
    }
    return '';
  }

  getMusclesForExercises(ids: string[]): string[] {
    const set = new Set<string>();
    for (const id of ids) {
      const ex = this.exerciseMap.get(id);
      if (ex) {
        for (const m of ex.primary_muscle_es) {
          if (m) set.add(m);
        }
      }
    }
    return Array.from(set);
  }
}
