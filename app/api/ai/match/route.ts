import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { EXPERTS, Category } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const { category, problemDescription } = await req.json();

    const experts = EXPERTS.filter(e => e.category === (category as Category));

    if (experts.length === 0) {
      return NextResponse.json({ ranked: [] });
    }

    const expertsData = experts.map(e => ({
      id: e.id,
      name: e.name,
      specializations: e.specializations,
      experience_years: e.experience_years,
      completed_deals: e.completed_deals,
      rating: e.rating,
      bio: e.bio.substring(0, 150),
    }));

    const prompt = `Ты — AI-матчинг движок платформы Halyk Pro (Казахстан).

Задача клиента: "${problemDescription}"

Доступные специалисты:
${JSON.stringify(expertsData, null, 2)}

Проранжируй специалистов от наиболее подходящего к наименее подходящему для данной задачи.

Для каждого специалиста дай краткое (1-2 предложения) объяснение почему он подходит или не подходит.

Верни JSON:
{
  "ranked": [
    {
      "id": "expert_id",
      "score": 0-100,
      "reason": "Краткое объяснение на русском"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 400,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI match error:', error);
    // Fallback: return experts in default order with generic reasons
    const category = (await req.json().catch(() => ({ category: 'lawyer' }))).category;
    const experts = EXPERTS.filter(e => e.category === category);
    return NextResponse.json({
      ranked: experts.map((e, i) => ({
        id: e.id,
        score: 90 - i * 5,
        reason: `${e.experience_years} лет опыта, ${e.completed_deals} успешных сделок`,
      })),
    });
  }
}
