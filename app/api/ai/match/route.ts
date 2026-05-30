import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { EXPERTS, Category } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const { category, problemDescription, allCategories } = await req.json();

    const experts = allCategories
      ? EXPERTS
      : EXPERTS.filter(e => e.category === (category as Category));

    if (experts.length === 0) {
      return NextResponse.json({ ranked: [] });
    }

    const expertsData = experts.map(e => ({
      id: e.id,
      name: e.name,
      category: e.categoryLabel,
      specializations: e.specializations,
      experience_years: e.experience_years,
      completed_deals: e.completed_deals,
      rating: e.rating,
      bio: e.bio.substring(0, 150),
      cases: e.cases,
    }));

    const prompt = `Ты — AI-матчинг движок платформы Halyk Pro (Казахстан).

Задача клиента: "${problemDescription}"

Доступные специалисты:
${JSON.stringify(expertsData, null, 2)}

Проранжируй специалистов от наиболее подходящего к наименее подходящему для данной задачи.
Особое внимание удели полю "cases" — оно содержит реальные закрытые сделки специалиста.
Если у специалиста есть кейс похожий на задачу клиента — это главный критерий.

Для каждого специалиста дай краткое (1-2 предложения) объяснение почему он подходит, упомяни конкретный кейс если он релевантен.

Верни JSON:
{
  "ranked": [
    {
      "id": "expert_id",
      "score": 0-100,
      "reason": "Краткое объяснение на русском, со ссылкой на конкретный кейс если есть"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI match error:', error);
    const body = await req.json().catch(() => ({ category: 'lawyer', allCategories: false }));
    const experts = body.allCategories
      ? EXPERTS
      : EXPERTS.filter(e => e.category === body.category);
    return NextResponse.json({
      ranked: experts.map((e, i) => ({
        id: e.id,
        score: 90 - i * 5,
        reason: `${e.experience_years} лет опыта, ${e.completed_deals} успешных сделок`,
      })),
    });
  }
}
