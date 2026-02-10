import { parseNaturalLanguage } from '../api/natural-language.js';

export interface CopilotRequest {
  prompt: string;
}

export const handleCopilotRequest = (request: CopilotRequest) => {
  return parseNaturalLanguage(request.prompt);
};
