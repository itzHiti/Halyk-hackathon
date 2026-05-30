import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { CATEGORIES, PROBLEMS } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const { messages, category, problemId } = await req.json();

    const cat = CATEGORIES.find(c => c.id === category);
    const problem = PROBLEMS.find(p => p.id === problemId);

    // First message with preset answer — return immediately
    if (messages.length === 1 && problem?.ai_can_answer && problem.ai_answer) {
      return NextResponse.json({
        message: problem.ai_answer + '\n\n_Это информационный ответ и не является официальной консультацией._',
        suggest_expert: false,
      });
    }

    const systemMessage = `Ты — AI-помощник платформы Halyk Pro (Казахстан). Помогаешь клиентам разобраться в их юридических и бухгалтерских вопросах в формате живого диалога.

Контекст: ${cat?.label || category}${problem ? `. Тема: ${problem.title}` : ''}

Правила:
- Отвечай на русском, конкретно и полезно
- Задавай уточняющие вопросы если нужно понять ситуацию глубже
- Если вопрос требует работы специалиста с документами — честно скажи об этом
- Не пиши огромные тексты — будь лаконичным
- НЕ добавляй disclaimer в каждый ответ, только если отвечаешь на конкретный правовой вопрос

Верни JSON:
{
  "message": "твой ответ",
  "suggest_expert": true/false (true если считаешь что пора подключить специалиста)
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        ...messages,
      ],
      response_format: { type: 'json_object' },
      max_tokens: 600,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI consult error:', error);
    return NextResponse.json({
      message: 'Для решения вашего вопроса потребуется работа специалиста с вашими документами и конкретными обстоятельствами дела.',
      suggest_expert: true,
    });
  }
}
