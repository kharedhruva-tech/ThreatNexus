import { RiskLevel } from './graph';

export interface DemoScenario {
  id: string; // e.g. 'SCN-01'
  title: string;
  codename: string;
  category: 'APT_INTRUSION' | 'SUPPLY_CHAIN' | 'INSIDER_EXFILTRATION' | 'RANSOMWARE';
  difficulty: 'INTERMEDIATE' | 'ADVANCED' | 'COMPLEX';
  estimatedHops: number;
  initialEntityId: string;
  nextEntityId: string;
  description: string;
  objective: string;
  riskLevel: RiskLevel;
  entitiesInvolved: string[];
  keyHighlights: string[];
  crossSessionBridge: {
    firstSessionEntity: string;
    secondSessionEntity: string;
    missingLinkSummary: string;
    graphRetrievalExplanation: string;
  };
  isSimulated: boolean;
}
