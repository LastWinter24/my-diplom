// frontend/src/pages/RestaurantMenu.tsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; 

interface MenuDay {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

const FALLBACK_MENU: MenuDay[] = [
  { day: 'Понедельник', breakfast: 'Омлет с сыром, тосты', lunch: 'Борщ, котлета с пюре', dinner: 'Рыба на пару, рис' },
  { day: 'Вторник', breakfast: 'Овсяная каша, ягоды', lunch: 'Грибной суп, паста с курицей', dinner: 'Гречка с овощами' },
  { day: 'Среда', breakfast: 'Сырники со сгущенкой', lunch: 'Солянка, гуляш', dinner: 'Салат Цезарь, запеченный картофель' },
  { day: 'Четверг', breakfast: 'Блинчики с джемом', lunch: 'Куриный бульон, плов', dinner: 'Запеченная индейка' },
  { day: 'Пятница', breakfast: 'Яичница с беконом', lunch: 'Уха, рыбные котлеты', dinner: 'Овощное рагу' },
  { day: 'Суббота', breakfast: 'Круассаны с шоколадом', lunch: 'Гороховый суп, пицца', dinner: 'Стейк из говядины' },
  { day: 'Воскресенье', breakfast: 'Вафли, свежие фрукты', lunch: 'Крем-суп из брокколи, лазанья', dinner: 'Запеченный лосось' },
];

export default function RestaurantMenu() {
  const [menuData, setMenuData] = useState<MenuDay[]>(FALLBACK_MENU);
  const [loading, setLoading] = useState(true);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [todayIndex, setTodayIndex] = useState(0);

  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [userName, setUserName] = useState('Сотрудник');

  useEffect(() => {
    const day = new Date().getDay(); 
    const index = day === 0 ? 6 : day - 1;
    setCurrentSlide(index);
    setTodayIndex(index);
  }, []);

  useEffect(() => {
    fetch('http://localhost:3000/pages/home')
      .then(res => res.json())
      .then(data => {
        if (data && data.content) {
          try {
            const parsed = JSON.parse(data.content);
            if (Array.isArray(parsed.restaurantMenu) && parsed.restaurantMenu.length === 7) {
              setMenuData(parsed.restaurantMenu);
            }
          } catch (e) { }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:3000/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (data.fullName) setUserName(data.fullName); })
        .catch(() => {});
    }
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % menuData.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + menuData.length) % menuData.length);

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch('http://localhost:3000/pages/feedback');
      const data = await res.json();
      let existingFeedbacks = [];
      if (data && data.content) {
        try { existingFeedbacks = JSON.parse(data.content); } catch (e) {}
      }
      
      const newFeedback = {
        id: Date.now().toString(),
        text: feedbackText,
        author: userName,
        date: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      };
      existingFeedbacks.unshift(newFeedback);

      const saveRes = await fetch('http://localhost:3000/pages/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: JSON.stringify(existingFeedbacks) })
      });

      if (!saveRes.ok) throw new Error('Сетевая ошибка');

      toast.success('Спасибо! Ваше пожелание отправлено шеф-повару 👨‍🍳'); // ИЗМЕНЕНО НА ТОСТ
      setFeedbackText(''); 
    } catch (err) {
      toast.error('Ошибка при отправке. Попробуйте позже.'); // ИЗМЕНЕНО НА ТОСТ
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <div className="p-20 text-center text-gray-500 animate-pulse">Загрузка меню...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
      
      <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner flex-shrink-0">🍽️</div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Меню ресторана</h1>
          <p className="text-gray-500 text-lg">Вкусное и полезное расписание питания для сотрудников на всю неделю.</p>
        </div>
      </div>

      <div className="relative mx-auto">
        <div 
          className="relative bg-primary-600 rounded-[2rem] shadow-xl shadow-primary-500/30 px-6 md:px-12 py-14 min-h-[400px] flex items-center justify-center text-white overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: "linear-gradient(to bottom right, rgba(16, 185, 129, 0.9), rgba(4, 120, 87, 0.95)), url('https://images.unsplash.com/photo-1495195134817-a1691359a41c?q=80&w=1500&auto=format&fit=crop')" }}
        >
          <button onClick={prevSlide} className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 p-3 hover:bg-white/10 rounded-full hover:scale-110 transition-all z-20 outline-none backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>

          <div className="w-full overflow-hidden px-2 md:px-8">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {menuData.map((menu, idx) => (
                <div key={idx} className="w-full flex-shrink-0 flex flex-col items-center justify-center min-w-0">
                  <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl md:text-4xl font-black tracking-wide drop-shadow-md uppercase">{menu.day}</h2>
                      {idx === todayIndex && <span className="bg-white text-primary-600 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">Сегодня</span>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors flex flex-col items-center text-center group min-w-0">
                      <span className="text-4xl mb-3 drop-shadow-sm group-hover:scale-110 transition-transform">🥐</span>
                      <p className="text-primary-100 text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Завтрак</p>
                      <h3 className="text-xl font-bold leading-snug break-words min-w-0 w-full">{menu.breakfast || '—'}</h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors flex flex-col items-center text-center group min-w-0">
                      <span className="text-4xl mb-3 drop-shadow-sm group-hover:scale-110 transition-transform">🥣</span>
                      <p className="text-primary-100 text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Обед</p>
                      <h3 className="text-xl font-bold leading-snug break-words min-w-0 w-full">{menu.lunch || '—'}</h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors flex flex-col items-center text-center group min-w-0">
                      <span className="text-4xl mb-3 drop-shadow-sm group-hover:scale-110 transition-transform">🥗</span>
                      <p className="text-primary-100 text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Ужин</p>
                      <h3 className="text-xl font-bold leading-snug break-words min-w-0 w-full">{menu.dinner || '—'}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={nextSlide} className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 p-3 hover:bg-white/10 rounded-full hover:scale-110 transition-all z-20 outline-none backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        
        <div className="flex justify-center space-x-2 mt-6">
          {menuData.map((_, i) => (
            <div key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === currentSlide ? 'w-8 bg-primary-500' : 'w-2 bg-gray-300 hover:bg-primary-300'}`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center text-2xl">⏰</div>
            <h2 className="text-2xl font-bold text-gray-900">Режим работы</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
              <div className="flex items-center gap-3"><span className="text-xl">☕</span> <span className="font-bold text-gray-800">Завтрак</span></div>
              <span className="font-bold text-orange-600">07:00 - 10:30</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
              <div className="flex items-center gap-3"><span className="text-xl">🍲</span> <span className="font-bold text-gray-800">Обед</span></div>
              <span className="font-bold text-orange-600">12:30 - 15:00</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
              <div className="flex items-center gap-3"><span className="text-xl">🌙</span> <span className="font-bold text-gray-800">Ужин</span></div>
              <span className="font-bold text-orange-600">18:00 - 21:00</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-2xl">📜</div>
            <h2 className="text-2xl font-bold text-gray-900">Правила посещения</h2>
          </div>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">1</span>
              <p className="text-gray-600 text-sm leading-relaxed">Пожалуйста, <span className="font-semibold text-gray-800">не выносите посуду и приборы</span> за пределы обеденной зоны.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">2</span>
              <p className="text-gray-600 text-sm leading-relaxed">После еды <span className="font-semibold text-gray-800">относите подносы</span> на специальный стеллаж для грязной посуды.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">3</span>
              <p className="text-gray-600 text-sm leading-relaxed">Соблюдайте дресс-код: посещение ресторана в грязной рабочей спецодежде запрещено.</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[2rem] shadow-lg p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 left-20 w-32 h-32 bg-primary-500 opacity-20 rounded-full blur-xl"></div>
        
        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Есть пожелания по меню?</h2>
          <p className="text-gray-400">Наш шеф-повар всегда рад вашим идеям и предложениям!</p>
        </div>
        
        <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitFeedback()}
            placeholder="Например: Хочу больше сырников..." 
            className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64 backdrop-blur-md"
          />
          <button 
            onClick={handleSubmitFeedback}
            disabled={isSubmittingFeedback || !feedbackText.trim()}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:hover:bg-primary-500 text-white font-bold rounded-xl transition-colors shadow-md shadow-primary-500/20 whitespace-nowrap"
          >
            {isSubmittingFeedback ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>

    </div>
  );
}