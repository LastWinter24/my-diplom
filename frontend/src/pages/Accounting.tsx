// frontend/src/pages/Accounting.tsx
import { useState, useEffect, useRef } from 'react';

interface AccountingRecord {
  id: string;
  fullName: string;
  position?: string;
  role: string;
  avatarUrl?: string | null;
  hourlyRate: number;
  totalHours: number;
  totalSalary: number;
}

const AVATAR_COLORS = [
  'bg-orange-100 text-orange-600', 'bg-green-100 text-green-600', 'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600', 'bg-rose-100 text-rose-600', 'bg-yellow-100 text-yellow-700'
];

const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

const getRoleName = (role: string) => {
  switch(role) {
    case 'ADMIN': return 'Администратор';
    case 'MANAGER': return 'Менеджер';
    case 'CHEF': return 'Шеф-повар';
    case 'EMPLOYEE': return 'Сотрудник';
    default: return role;
  }
};

const MONTHS = [
  { value: 1, label: 'Январь' }, { value: 2, label: 'Февраль' }, { value: 3, label: 'Март' },
  { value: 4, label: 'Апрель' }, { value: 5, label: 'Май' }, { value: 6, label: 'Июнь' },
  { value: 7, label: 'Июль' }, { value: 8, label: 'Август' }, { value: 9, label: 'Сентябрь' },
  { value: 10, label: 'Октябрь' }, { value: 11, label: 'Ноябрь' }, { value: 12, label: 'Декабрь' }
];

export default function Accounting() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  
  const [records, setRecords] = useState<AccountingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Для редактирования ставки
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<string>('');

  //Состояния для кастомных выпадающих списков месяца и года
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  // Закрытие списков при клике вне их области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) setIsMonthOpen(false);
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) setIsYearOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAccounting = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/shifts/accounting?year=${year}&month=${month}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRecords(await res.json());
      }
    } catch (e) {
      console.error('Ошибка загрузки данных:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounting();
  }, [year, month]);

  const handleSaveRate = async (userId: string) => {
    const rate = parseFloat(tempRate);
    if (isNaN(rate) || rate < 0) return alert('Введите корректную ставку');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/shifts/accounting/${userId}/rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rate })
      });
      if (res.ok) {
        setEditingRateId(null);
        fetchAccounting(); // Перезапрашиваем данные для пересчета ЗП
      }
    } catch (e) {
      alert('Ошибка при сохранении ставки');
    }
  };

  const totalPayout = records.reduce((sum, rec) => sum + rec.totalSalary, 0);
  const totalHoursAll = records.reduce((sum, rec) => sum + rec.totalHours, 0);

  const YEARS = [year - 1, year, year + 1];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-fade-in">
      
      {/* ШАПКА И ФИЛЬТРЫ */}
      <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 relative z-20">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Учет и Отчеты</h1>
          <p className="text-gray-500 text-lg">Контроль отработанного времени и расчет зарплаты.</p>
        </div>
        
        {/* ИЗМЕНЕНО: КАСТОМНЫЕ СЕЛЕКТОРЫ МЕСЯЦА И ГОДА */}
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 shadow-inner">
          
          {/* Выбор месяца */}
          <div className="relative" ref={monthRef}>
            <button 
              onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
              className="bg-white border border-gray-200 text-gray-800 font-bold py-2.5 px-4 rounded-xl outline-none hover:bg-gray-50 hover:border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all shadow-sm flex items-center justify-between w-36"
            >
              <span>{MONTHS.find(m => m.value === month)?.label}</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            {isMonthOpen && (
              <div className="absolute z-50 top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                {MONTHS.map(m => (
                  <div 
                    key={m.value} 
                    onClick={() => { setMonth(m.value); setIsMonthOpen(false); }}
                    className={`p-3 cursor-pointer text-sm font-bold transition-colors border-b border-gray-50 last:border-0 ${month === m.value ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'}`}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Выбор года */}
          <div className="relative" ref={yearRef}>
            <button 
              onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }}
              className="bg-white border border-gray-200 text-gray-800 font-bold py-2.5 px-4 rounded-xl outline-none hover:bg-gray-50 hover:border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all shadow-sm flex items-center justify-between w-28"
            >
              <span>{year}</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            {isYearOpen && (
              <div className="absolute z-50 top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-fade-in">
                {YEARS.map(y => (
                  <div 
                    key={y} 
                    onClick={() => { setYear(y); setIsYearOpen(false); }}
                    className={`p-3 cursor-pointer text-sm font-bold transition-colors border-b border-gray-50 last:border-0 ${year === y ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'}`}
                  >
                    {y}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* СВОДКА */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-[2rem] text-white shadow-lg shadow-green-500/20 flex flex-col justify-center">
          <p className="text-green-100 font-medium uppercase tracking-wider text-sm mb-2">Итого к выплате (Сумма)</p>
          <p className="text-5xl font-extrabold">{totalPayout.toLocaleString('ru-RU')} <span className="text-2xl font-medium">₽</span></p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-2">Отработано всеми сотрудниками</p>
          <p className="text-5xl font-extrabold text-gray-800">{Math.round(totalHoursAll)} <span className="text-2xl font-medium text-gray-500">часов</span></p>
        </div>
      </div>

      {/* ТАБЛИЦА */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative z-10">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Загрузка данных за период...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">Нет активных сотрудников</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Сотрудник</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Отработано</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Ставка (₽/час)</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Сумма к выплате</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        {rec.avatarUrl ? (
                          <img src={`http://localhost:3000${rec.avatarUrl}`} className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm" alt="" />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${getAvatarColor(rec.fullName)}`}>
                            {rec.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-gray-900 text-lg">{rec.fullName}</p>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">{rec.position || getRoleName(rec.role)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className="font-bold text-gray-800 text-xl">{rec.totalHours}</span>
                      <span className="text-gray-400 text-sm ml-1">ч.</span>
                    </td>
                    <td className="p-6 text-center">
                      {editingRateId === rec.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <input 
                            type="number" 
                            autoFocus
                            value={tempRate} 
                            onChange={e => setTempRate(e.target.value)} 
                            className="w-24 text-center px-3 py-2 border border-green-500 rounded-lg outline-none focus:ring-2 focus:ring-green-200 font-bold"
                          />
                          <button onClick={() => handleSaveRate(rec.id)} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors shadow-sm">✓</button>
                          <button onClick={() => setEditingRateId(null)} className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors shadow-sm">✕</button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => { setEditingRateId(rec.id); setTempRate(rec.hourlyRate.toString()); }}
                          className="inline-flex items-center gap-2 cursor-pointer group px-4 py-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <span className="font-bold text-gray-800 text-lg">{rec.hourlyRate} ₽</span>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <span className="font-extrabold text-green-600 text-2xl bg-green-50 px-4 py-2 rounded-xl">
                        {rec.totalSalary.toLocaleString('ru-RU')} ₽
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}