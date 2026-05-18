export interface AcademicBackgroundRequest {
  institution: string;

  career: string;

  studyLevelId?: number | null;

  currentSemester: string | number;

  careerDurationSemesters: number;

  studiesInRegion: boolean;

  hadPreviousBenefit: boolean;
}
