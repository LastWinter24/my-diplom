// frontend/src/pages/SafetyRules.tsx
import { useState, useEffect } from 'react';

interface SafetyRule { id: string; title: string; content: string; }

const FALLBACK_RULES: SafetyRule[] = [
  { id: '1', title: 'Пожарная безопасность', content: 'Каждый сотрудник обязан знать расположение огнетушителей и планов эвакуации на своем рабочем месте. Курение на территории отеля строго запрещено вне отведенных мест.' },
  { id: '2', title: 'Первая медицинская помощь', content: 'Аптечки первой помощи находятся на ресепшене, кухне и в комнате отдыха персонала. В случае травмы немедленно сообщите руководству и вызовите скорую помощь.' }
];

export default function SafetyRules() {
  const [rules, setRules] = useState<SafetyRule[]>(FALLBACK_RULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/pages/home')
      .then(res => res.json())
      .then(data => {
        if (data && data.content) {
          try {
            const parsed = JSON.parse(data.content);
            if (Array.isArray(parsed.safetyRules) && parsed.safetyRules.length > 0) {
              setRules(parsed.safetyRules);
            }
          } catch (e) { }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center text-gray-500 animate-pulse">Загрузка инструкций...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* ИЗМЕНЕНО: Защита шапки от длинного текста */}
      <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
        <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner flex-shrink-0">📋</div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 break-words">Инструкции по ТБ</h1>
          <p className="text-gray-500 text-lg break-words">Техника безопасности и правила поведения в экстренных ситуациях.</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 text-gray-700 space-y-10 leading-relaxed overflow-hidden">
        {rules.map((rule, idx) => (
          <div key={rule.id} className="min-w-0">
            {/* ИЗМЕНЕНО: Защита заголовка правила */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-start gap-3 min-w-0">
              <span className="bg-blue-50 text-blue-500 w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5">{idx + 1}</span>
              <span className="break-words min-w-0 flex-1">{rule.title}</span>
            </h2>
            {/* ИЗМЕНЕНО: Рендер HTML из ReactQuill */}
            <div 
              className="pl-14 text-gray-600 break-words min-w-0 custom-html-content"
              dangerouslySetInnerHTML={{ __html: rule.content }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}