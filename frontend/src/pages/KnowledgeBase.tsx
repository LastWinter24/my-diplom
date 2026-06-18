// frontend/src/pages/KnowledgeBase.tsx
import { useState, useEffect } from 'react';

interface KnowledgeItem { id: string; title: string; content: string; }

const FALLBACK_ITEMS: KnowledgeItem[] = [
  { id: '1', title: 'Как оформить отпуск?', content: 'Для оформления отпуска необходимо написать заявление в отдел кадров за 14 дней до предполагаемой даты.' },
  { id: '2', title: 'Регламент работы с VIP-гостями', content: 'VIP-гостям предоставляется комплимент от отеля при заселении и приоритетное обслуживание.' },
  { id: '3', title: 'Корпоративные скидки', content: 'Каждый сотрудник имеет скидку 20% на меню ресторана и 30% на проживание родственников.' },
];

export default function KnowledgeBase() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/pages/home')
      .then(res => res.json())
      .then(data => {
        if (data && data.content) {
          try {
            const parsed = JSON.parse(data.content);
            if (Array.isArray(parsed.knowledgeBase) && parsed.knowledgeBase.length > 0) {
              setItems(parsed.knowledgeBase);
            }
          } catch (e) { }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center text-gray-500 animate-pulse">Загрузка базы знаний...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* ИЗМЕНЕНО: Защита шапки */}
      <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
        <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner flex-shrink-0">📁</div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 break-words">База знаний отеля</h1>
          <p className="text-gray-500 text-lg break-words">Сборник регламентов, ответов на частые вопросы и правил работы.</p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
            <button 
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors outline-none gap-4"
            >
              {/* ИЗМЕНЕНО: Защита заголовка аккордеона */}
              <span className="font-bold text-gray-800 text-lg flex items-start gap-3 min-w-0 flex-1">
                <span className="text-orange-400 font-black mt-0.5 flex-shrink-0">+</span> 
                <span className="break-words min-w-0 flex-1">{item.title}</span>
              </span>
              <svg className={`w-6 h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ${openId === item.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className={`transition-all duration-300 ease-in-out ${openId === item.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {/* ИЗМЕНЕНО: Рендер HTML из ReactQuill */}
              <div 
                className="p-6 pt-0 text-gray-600 border-t border-gray-50 mt-2 leading-relaxed break-words min-w-0 custom-html-content"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}