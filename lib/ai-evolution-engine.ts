// AI Evolution Engine for UPLim Language Development
import { generateText } from 'ai';
import { UPLIM_IDEOLOGY, validateAgainstIdeology, type IdeologyViolation } from './uplim-ideology';

export type EvolutionProposal = {
  id: string;
  type: 'syntax' | 'feature' | 'optimization' | 'library' | 'tool';
  title: string;
  description: string;
  rationale: string;
  examples: string[];
  ideologyAlignment: number; // 0-100
  violations: IdeologyViolation[];
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  createdAt: Date;
};

export class UPLimEvolutionEngine {
  private proposals: EvolutionProposal[] = [];
  
  async generateEvolutionProposal(context: string): Promise<EvolutionProposal> {
    const systemPrompt = `Ти - AI-архітектор мови програмування UPLim.

ІДЕОЛОГІЯ UPLim:
${JSON.stringify(UPLIM_IDEOLOGY, null, 2)}

ТВОЯ ЗАДАЧА:
Генеруй нові ідеї для розвитку мови UPLim, які СТРОГО дотримуються її ідеології.

ПРАВИЛА:
1. НЕ копіюй синтаксис інших мов (JS, Python, Rust, Go)
2. Зберігай простоту та читабельність
3. Завжди пріоритезуй безпеку
4. Думай про cross-platform сумісність
5. Всі фічі мають бути швидкими

ФОРМАТ ВІДПОВІДІ (JSON):
{
  "type": "syntax|feature|optimization|library|tool",
  "title": "Коротка назва",
  "description": "Детальний опис",
  "rationale": "Чому це потрібно UPLim",
  "examples": ["приклад коду 1", "приклад коду 2"]
}`;

    const { text } = await generateText({
      model: process.env.OLLAMA_MODEL || 'openai/gpt-4o-mini',
      prompt: `Контекст: ${context}\n\nЗгенеруй пропозицію для розвитку UPLim:`,
      system: systemPrompt,
    });

    // Parse AI response
    let proposalData;
    try {
      proposalData = JSON.parse(text);
    } catch {
      proposalData = {
        type: 'feature',
        title: 'AI Generated Proposal',
        description: text,
        rationale: 'Generated from context',
        examples: []
      };
    }

    // Validate against ideology
    const fullText = `${proposalData.title} ${proposalData.description} ${proposalData.examples.join(' ')}`;
    const violations = validateAgainstIdeology(fullText);
    
    // Calculate ideology alignment score
    const alignmentScore = this.calculateAlignmentScore(proposalData, violations);

    const proposal: EvolutionProposal = {
      id: `prop-${Date.now()}`,
      type: proposalData.type,
      title: proposalData.title,
      description: proposalData.description,
      rationale: proposalData.rationale,
      examples: proposalData.examples,
      ideologyAlignment: alignmentScore,
      violations,
      status: violations.filter(v => v.severity === 'critical').length > 0 ? 'rejected' : 'pending',
      createdAt: new Date()
    };

    this.proposals.push(proposal);
    return proposal;
  }

  private calculateAlignmentScore(proposal: any, violations: IdeologyViolation[]): number {
    let score = 100;
    
    violations.forEach(v => {
      switch (v.severity) {
        case 'critical': score -= 50; break;
        case 'high': score -= 25; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });
    
    // Bonus for using UPLim keywords
    const uplimKeywords = UPLIM_IDEOLOGY.core_principles.simplicity.syntax_keywords;
    const text = JSON.stringify(proposal).toLowerCase();
    uplimKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 2;
    });
    
    return Math.max(0, Math.min(100, score));
  }

  async autoEvolveSyntax(currentSyntax: string[]): Promise<string[]> {
    const proposal = await this.generateEvolutionProposal(
      `Поточний синтаксис: ${currentSyntax.join(', ')}. Запропонуй покращення.`
    );
    
    if (proposal.ideologyAlignment > 70 && proposal.status !== 'rejected') {
      return [...currentSyntax, ...proposal.examples];
    }
    
    return currentSyntax;
  }

  getProposals(filter?: { status?: EvolutionProposal['status'], minAlignment?: number }) {
    let filtered = this.proposals;
    
    if (filter?.status) {
      filtered = filtered.filter(p => p.status === filter.status);
    }
    
    if (filter?.minAlignment) {
      filtered = filtered.filter(p => p.ideologyAlignment >= filter.minAlignment);
    }
    
    return filtered.sort((a, b) => b.ideologyAlignment - a.ideologyAlignment);
  }

  approveProposal(id: string) {
    const proposal = this.proposals.find(p => p.id === id);
    if (proposal && proposal.violations.filter(v => v.severity === 'critical').length === 0) {
      proposal.status = 'approved';
      return true;
    }
    return false;
  }
}

export const evolutionEngine = new UPLimEvolutionEngine();
