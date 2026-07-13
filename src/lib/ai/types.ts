export interface PreVisitSummary {
  urgencyLevel: "Low" | "Medium" | "High";
  chiefComplaint: string;
  suggestedQuestions: string[];
}

export interface AIProvider {
  generatePreVisitSummary(symptoms: string): Promise<PreVisitSummary | null>;
}
