import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { CATEGORIES, PROBLEMS } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const { category, problemId, customDescription } = await req.json();

    const cat = CATEGORIES.find(c => c.id === category);
    const problem = PROBLEMS.find(p => p.id === problemId);

    // If AI can answer with preset response, return it immediately
    if (problem?.ai_can_answer && problem.ai_answer) {
      return NextResponse.json({
        needs_expert: false,
        answer: problem.ai_answer,
        disclaimer: 'Это информационный ответ и не является юридической или бухгалтерской консультацией. Для официальной помощи по вашей конкретной ситуации обратитесь к специалисту.',
        suggested_action: 'Если у вас есть специфические обстоятельства, рекомендуем проконсультироваться с верифицированным специалистом.',
      });
    }

    const problemDescription = problem ? `${problem.title}: ${problem.description}` : customDescription || 'Общий вопрос';

    const systemPrompt = `Ты — AI-помощник платформы Halyk Pro для Казахстана. Помогаешь клиентам понять их юридические и бухгалтерские вопросы.

Категория запроса: ${cat?.label || category}
Вопрос пользователя: ${problemDescription}

Отвечай на русском языке. Будь конкретным, кратким и полезным.

Если вопрос простой и информационный — ответь на него.
Если вопрос требует индивидуальной работы специалиста — объясни почему и порекомендуй обратиться к эксперту.

ВАЖНО: В конце ВСЕГДА добавляй disclaimer что это не является официальной консультацией.

Верни ответ в JSON формате:
{
  "needs_expert": boolean,
  "answer": "твой ответ на вопрос",
  "why_expert": "объяснение почему нужен специалист (если needs_expert=true)",
  "disclaimer": "дисклеймер"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: systemPrompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI consult error:', error);
    // Fallback for demo if no API key
    return NextResponse.json({
      needs_expert: true,
      answer: 'Ваш запрос требует индивидуальной работы с документами и анализа вашей конкретной ситуации.',
      why_expert: 'Этот вопрос требует профессионального анализа вашей конкретной ситуации, документов и применимого законодательства РК.',
      disclaimer: 'Это информационный ответ и не является юридической или бухгалтерской консультацией.',
    });
  }
}
