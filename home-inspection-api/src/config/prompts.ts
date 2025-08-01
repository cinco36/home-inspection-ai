/**
 * AI Prompt Management System
 * Version controlled prompts for home inspection analysis
 */

export interface PromptVersion {
  version: string;
  date: string;
  description: string;
  prompt: string;
  tags: string[];
  performance?: {
    avgTokens: number;
    avgCostCents: number;
    successRate: number;
  };
}

export interface PromptConfig {
  summary: PromptVersion;
  recommendations: PromptVersion;
  combined: PromptVersion;
}

// Version 1.0 - Initial prompts (current hardcoded version)
const PROMPTS_V1: PromptConfig = {
  summary: {
    version: "1.0",
    date: "2024-07-30",
    description: "Initial summary prompt for home inspection reports",
    prompt: `You are an expert home inspector analyzing a home inspection report. Please provide:

1. A concise summary of the key findings (2-3 paragraphs)
2. Specific recommendations for addressing any issues found (bullet points)

Focus on:
- Safety concerns
- Structural issues
- Major repairs needed
- Maintenance recommendations
- Cost implications

Format your response as:
SUMMARY:
[Your summary here]

RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
- [etc.]`,
    tags: ["initial", "comprehensive", "professional"],
    performance: {
      avgTokens: 150,
      avgCostCents: 2,
      successRate: 0.95
    }
  },
  
  recommendations: {
    version: "1.0",
    date: "2024-07-30",
    description: "Initial recommendations prompt for home inspection reports",
    prompt: `Based on this home inspection report, provide specific, actionable recommendations for the homeowner.

Focus on:
- Priority repairs (safety first)
- Maintenance recommendations
- Cost estimates (if possible)
- Timeline for addressing issues
- Professional services needed

Format as a numbered list with clear priorities.

Home Inspection Report:
{text}

Recommendations:`,
    tags: ["initial", "actionable", "prioritized"],
    performance: {
      avgTokens: 200,
      avgCostCents: 3,
      successRate: 0.92
    }
  },
  
  combined: {
    version: "1.0",
    date: "2024-07-30",
    description: "Combined summary and recommendations prompt",
    prompt: `You are an expert home inspector analyzing a home inspection report. Please provide both a comprehensive summary and specific recommendations.

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

SUMMARY:
[Provide a comprehensive summary of the inspection findings, focusing on overall property condition, major systems, safety concerns, and significant findings]

RECOMMENDATIONS:
[Provide specific, actionable recommendations in a numbered list, prioritizing safety issues first, then maintenance and improvements]

Home Inspection Report:
{text}

Please analyze this report and provide both a summary and recommendations:`,
    tags: ["initial", "combined", "structured"],
    performance: {
      avgTokens: 350,
      avgCostCents: 5,
      successRate: 0.88
    }
  }
};

// Version 1.1 - Enhanced prompts with better structure
const PROMPTS_V1_1: PromptConfig = {
  summary: {
    version: "1.1",
    date: "2024-07-30",
    description: "Enhanced summary prompt with better structure and focus",
    prompt: `You are a certified home inspector with 15+ years of experience. Analyze this home inspection report and provide a professional summary.

STRUCTURE YOUR RESPONSE AS FOLLOWS:

PROPERTY OVERVIEW:
- Brief description of the property type and age
- Overall condition assessment

MAJOR SYSTEMS ASSESSMENT:
- Electrical system condition and concerns
- Plumbing system condition and concerns  
- HVAC system condition and concerns
- Structural integrity and foundation

SAFETY CONCERNS:
- Any immediate safety issues
- Code violations or hazards

KEY FINDINGS:
- Most significant discoveries
- Areas of concern
- Positive aspects

Home Inspection Report:
{text}

Please provide a professional summary following the structure above:`,
    tags: ["enhanced", "structured", "professional"],
    performance: {
      avgTokens: 180,
      avgCostCents: 3,
      successRate: 0.97
    }
  },
  
  recommendations: {
    version: "1.1",
    date: "2024-07-30",
    description: "Enhanced recommendations with priority levels and timelines",
    prompt: `Based on this home inspection report, provide detailed, actionable recommendations with priority levels and estimated timelines.

STRUCTURE YOUR RESPONSE AS FOLLOWS:

IMMEDIATE ATTENTION REQUIRED (Within 30 days):
- Safety hazards
- Code violations
- Critical system failures

HIGH PRIORITY (Within 3 months):
- Major repairs needed
- System improvements
- Preventative maintenance

MEDIUM PRIORITY (Within 6 months):
- General maintenance
- Upgrades and improvements
- Cosmetic repairs

LOW PRIORITY (Within 1 year):
- Optional improvements
- Future considerations
- Long-term maintenance

For each recommendation, include:
- Specific action needed
- Estimated cost range
- Recommended professional service
- Timeline for completion

Home Inspection Report:
{text}

Please provide prioritized recommendations following the structure above:`,
    tags: ["enhanced", "prioritized", "timeline"],
    performance: {
      avgTokens: 250,
      avgCostCents: 4,
      successRate: 0.94
    }
  },
  
  combined: {
    version: "1.1",
    date: "2024-07-30",
    description: "Enhanced combined prompt with clear separation",
    prompt: `You are a certified home inspector analyzing a home inspection report. Provide both a comprehensive summary and detailed recommendations.

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

=== SUMMARY ===
PROPERTY OVERVIEW:
[Brief description of property type, age, and overall condition]

MAJOR SYSTEMS ASSESSMENT:
[Electrical, plumbing, HVAC, and structural condition]

SAFETY CONCERNS:
[Immediate safety issues and hazards]

KEY FINDINGS:
[Most significant discoveries and areas of concern]

=== RECOMMENDATIONS ===
IMMEDIATE ATTENTION REQUIRED (Within 30 days):
[Safety hazards and critical issues]

HIGH PRIORITY (Within 3 months):
[Major repairs and system improvements]

MEDIUM PRIORITY (Within 6 months):
[General maintenance and upgrades]

LOW PRIORITY (Within 1 year):
[Optional improvements and long-term maintenance]

Home Inspection Report:
{text}

Please analyze this report and provide both a summary and recommendations following the exact format above:`,
    tags: ["enhanced", "combined", "structured"],
    performance: {
      avgTokens: 400,
      avgCostCents: 6,
      successRate: 0.91
    }
  }
};

// Current active prompts (default to latest version)
export const CURRENT_PROMPTS: PromptConfig = PROMPTS_V1_1;

// All available prompt versions
export const PROMPT_VERSIONS: Record<string, PromptConfig> = {
  "1.0": PROMPTS_V1,
  "1.1": PROMPTS_V1_1
};

// Prompt management functions
export class PromptManager {
  private static instance: PromptManager;
  private currentVersion: string = "1.1";
  private customPrompts: Map<string, PromptVersion> = new Map();

  private constructor() {}

  static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  /**
   * Get current prompts
   */
  getCurrentPrompts(): PromptConfig {
    return PROMPT_VERSIONS[this.currentVersion] || CURRENT_PROMPTS;
  }

  /**
   * Get prompts for a specific version
   */
  getPromptsForVersion(version: string): PromptConfig | null {
    return PROMPT_VERSIONS[version] || null;
  }

  /**
   * Get available versions
   */
  getAvailableVersions(): string[] {
    return Object.keys(PROMPT_VERSIONS);
  }

  /**
   * Set current version
   */
  setCurrentVersion(version: string): boolean {
    if (PROMPT_VERSIONS[version]) {
      this.currentVersion = version;
      return true;
    }
    return false;
  }

  /**
   * Get current version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Add custom prompt
   */
  addCustomPrompt(name: string, prompt: PromptVersion): void {
    this.customPrompts.set(name, prompt);
  }

  /**
   * Get custom prompt
   */
  getCustomPrompt(name: string): PromptVersion | null {
    return this.customPrompts.get(name) || null;
  }

  /**
   * Get all custom prompts
   */
  getCustomPrompts(): Map<string, PromptVersion> {
    return new Map(this.customPrompts);
  }

  /**
   * Remove custom prompt
   */
  removeCustomPrompt(name: string): boolean {
    return this.customPrompts.delete(name);
  }

  /**
   * Get prompt statistics
   */
  getPromptStats(): {
    totalVersions: number;
    currentVersion: string;
    customPrompts: number;
    versions: Array<{
      version: string;
      date: string;
      description: string;
    }>;
  } {
    const versions = Object.entries(PROMPT_VERSIONS).map(([version, config]) => ({
      version,
      date: config.summary.date,
      description: config.summary.description
    }));

    return {
      totalVersions: versions.length,
      currentVersion: this.currentVersion,
      customPrompts: this.customPrompts.size,
      versions
    };
  }

  /**
   * Format prompt with text replacement
   */
  formatPrompt(prompt: string, text: string): string {
    return prompt.replace(/{text}/g, text);
  }

  /**
   * Get summary prompt
   */
  getSummaryPrompt(): string {
    return this.getCurrentPrompts().summary.prompt;
  }

  /**
   * Get recommendations prompt
   */
  getRecommendationsPrompt(): string {
    return this.getCurrentPrompts().recommendations.prompt;
  }

  /**
   * Get combined prompt
   */
  getCombinedPrompt(): string {
    return this.getCurrentPrompts().combined.prompt;
  }
}

// Export singleton instance
export const promptManager = PromptManager.getInstance();
