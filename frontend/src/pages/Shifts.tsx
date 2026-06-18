// frontend/src/pages/Shifts.tsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  department: string;
  status: string;
  actualStartTime?: string;
  actualEndTime?: string;
  isLookingForSwap?: boolean; 
  employee?: { fullName: string; avatarUrl?: string | null }; 
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

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [exchangeShifts, setExchangeShifts] = useState<Shift[]>([]); 
  const [loading, setLoading] = useState(true);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  
  const [weekOffset, setWeekOffset] = useState(0); 
  const [translatePct, setTranslatePct] = useState(-100); 
  const [isTransitioning, setIsTransitioning] = useState(false); 

  // СОСТОЯНИЕ ДЛЯ КРАСИВОЙ МОДАЛКИ
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmBtnText?: string;
    confirmBtnColor?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchMyShifts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [myRes, exchangeRes, profileRes] = await Promise.all([
        fetch('/api/shifts/my', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/shifts/exchange', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (myRes.ok) setShifts(await myRes.json());
      if (exchangeRes.ok) setExchangeShifts(await exchangeRes.json());
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.hourlyRate) setHourlyRate(profileData.hourlyRate);
      }
      
    } catch (err) {
      toast.error('Ошибка загрузки смен');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyShifts();
  }, []);

  // ФУНКЦИИ ВЫЗОВА МОДАЛОК
  const requestShiftTask = (shift: Shift, actionType: 'SICK' | 'SWAP') => {
    const isSick = actionType === 'SICK';
    setConfirmModal({
      isOpen: true,
      title: isSick ? 'Оформление больничного' : 'Выставить на биржу',
      message: isSick 
        ? 'Вы уверены, что хотите открыть больничный? Руководству будет отправлен запрос на снятие вас с этой смены.' 
        : 'Выставить эту смену на Биржу? Другие сотрудники смогут её забрать, пока менеджер не найдет замену.',
      confirmBtnText: isSick ? 'Отправить запрос' : 'Выставить',
      confirmBtnColor: isSick ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/30',
      onConfirm: () => executeShiftTask(shift, actionType)
    });
  };

  const requestTakeExchangeShift = (shiftId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Взять смену',
      message: 'Вы уверены, что хотите забрать эту смену себе? Она автоматически добавится в ваш график.',
      confirmBtnText: 'Да, забрать',
      confirmBtnColor: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30',
      onConfirm: () => executeTakeExchangeShift(shiftId)
    });
  };

  const requestStatusUpdate = (id: string, newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    const isStarting = newStatus === 'IN_PROGRESS';
    setConfirmModal({
      isOpen: true,
      title: isStarting ? 'Начало смены' : 'Завершение смены',
      message: `Вы уверены, что хотите ${isStarting ? 'начать' : 'завершить'} смену прямо сейчас? Время будет зафиксировано в системе.`,
      confirmBtnText: isStarting ? 'Начать смену' : 'Завершить смену',
      confirmBtnColor: isStarting ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30' : 'bg-red-500 hover:bg-red-600 shadow-red-500/30',
      onConfirm: () => executeShiftStatusUpdate(id, newStatus)
    });
  };

  // ФУНКЦИИ ИСПОЛНЕНИЯ (ЛОГИКА)
  const executeShiftTask = async (shift: Shift, actionType: 'SICK' | 'SWAP') => {
    const isSick = actionType === 'SICK';
    const shiftDate = new Date(shift.date).toLocaleDateString('ru-RU');
    
    const title = isSick ? `🚨 БОЛЬНИЧНЫЙ: Смена ${shiftDate}` : `🔄 ПОИСК ЗАМЕНЫ: Смена ${shiftDate}`;
    const content = isSick
      ? `Пожалуйста, снимите меня со смены ${shiftDate} (${shift.startTime} - ${shift.endTime}, отдел: ${shift.department}). Я заболел.`
      : `Смена ${shiftDate} (${shift.startTime} - ${shift.endTime}, отдел: ${shift.department}) выставлена на биржу.`;

    try {
      const token = localStorage.getItem('token');
      
      if (!isSick) {
        await fetch(`/api/shifts/${shift.id}/swap-request`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, content, type: 'PROBLEM', priority: isSick ? 'HIGH' : 'MEDIUM' })
      });

      if (response.ok) {
        toast.success(isSick ? 'Заявка отправлена руководству! 🤒' : 'Смена выставлена на Биржу! 🔄');
        fetchMyShifts(); 
      }
    } catch (err) { toast.error('Ошибка сети.'); }
  };

  const executeTakeExchangeShift = async (shiftId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/shifts/${shiftId}/take`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Поздравляем! Смена добавлена в ваш график. 🎉');
        fetchMyShifts();
      } else {
        toast.error('Не удалось взять смену. Возможно, её уже забрал кто-то другой!');
        fetchMyShifts();
      }
    } catch (e) { toast.error('Ошибка сети'); }
  };

  const executeShiftStatusUpdate = async (id: string, newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/shifts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(newStatus === 'IN_PROGRESS' ? 'Смена успешно начата! Хорошей работы! ✨' : 'Смена завершена. Отдыхайте! ☕');
        fetchMyShifts();
      }
    } catch (e) { toast.error('Ошибка сети'); }
  };

  const getWeekData = (offset: number, allShifts: Shift[]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1 + (offset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let totalHours = 0;
    let shiftsThisWeek = 0;

    allShifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      if (shiftDate >= startOfWeek && shiftDate <= endOfWeek && (shift.status === 'COMPLETED' || shiftDate < now)) {
        shiftsThisWeek++;
        let startH, startM, endH, endM;
        if (shift.actualStartTime && shift.actualEndTime) {
          const actStart = new Date(shift.actualStartTime);
          const actEnd = new Date(shift.actualEndTime);
          startH = actStart.getHours(); startM = actStart.getMinutes();
          endH = actEnd.getHours(); endM = actEnd.getMinutes();
        } else {
          [startH, startM] = shift.startTime.split(':').map(Number);
          [endH, endM] = shift.endTime.split(':').map(Number);
        }
        let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (durationMinutes < 0) durationMinutes += 24 * 60;
        totalHours += Math.round((durationMinutes / 60) * 10) / 10;
      }
    });

    const formatDate = (date: Date) => date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const weekLabel = offset === 0 ? 'Текущая неделя' : `${formatDate(startOfWeek)} — ${formatDate(endOfWeek)}`;
    return { totalHours, shiftsThisWeek, weekLabel };
  };

  const slides = [ getWeekData(weekOffset - 1, shifts), getWeekData(weekOffset, shifts), getWeekData(weekOffset + 1, shifts) ];

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true); setTranslatePct(0); 
    setTimeout(() => { setIsTransitioning(false); setWeekOffset(prev => prev - 1); setTranslatePct(-100); }, 500); 
  };
  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true); setTranslatePct(-200); 
    setTimeout(() => { setIsTransitioning(false); setWeekOffset(prev => prev + 1); setTranslatePct(-100); }, 500);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingShifts = shifts.filter(s => new Date(s.date) >= today && s.status !== 'COMPLETED').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastShifts = shifts.filter(s => new Date(s.date) < today || s.status === 'COMPLETED').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-fade-in relative">
      <h1 className="text-3xl font-bold text-primary-900">Мой график работы</h1>

      {loading ? (
        <p className="text-gray-500">Загрузка расписания...</p>
      ) : (
        <>
          {/* СЛАЙДЕР */}
          <div className="relative overflow-hidden w-full py-2">
            <div className="flex w-full" style={{ transform: `translateX(${translatePct}%)`, transition: isTransitioning ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none' }}>
              {slides.map((slide, index) => (
                <div key={index} className="min-w-full flex-shrink-0 px-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg shadow-primary-500/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4 border-b border-primary-400/30 pb-4">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors focus:outline-none"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
                        <span className="font-semibold text-primary-50 tracking-wide text-sm uppercase">{slide.weekLabel}</span>
                        <button onClick={handleNext} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors focus:outline-none"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
                      </div>
                      
                      <div>
                        <h2 className="text-primary-100 font-medium mb-1">Отработано за период</h2>
                        <div className="flex items-end gap-2">
                          <span className="text-5xl font-bold">{slide.totalHours}</span>
                          <span className="text-xl font-medium mb-1 opacity-80">часов</span>
                        </div>
                        
                        {hourlyRate > 0 && (
                          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 shadow-sm">
                            <span className="text-sm font-medium text-primary-50">К выплате:</span>
                            <span className="text-lg font-bold text-white">~ {Math.round(slide.totalHours * hourlyRate).toLocaleString('ru-RU')} ₽</span>
                          </div>
                        )}

                        <p className="text-sm mt-4 text-primary-100 opacity-90 flex gap-2 items-center">
                          <span>Смен: {slide.shiftsThisWeek}</span>
                          {hourlyRate > 0 && (
                            <>
                              <span>•</span>
                              <span>Ставка: {hourlyRate} ₽/ч</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
                      <h2 className="text-gray-500 font-medium mb-2">Норма времени</h2>
                      <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                        <div className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min((slide.totalHours / 40) * 100, 100)}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-400 text-right">{slide.totalHours} из 40 ч.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* БИРЖА СМЕН */}
          {exchangeShifts.length > 0 && (
            <div className="pt-4 animate-fade-in">
              <h2 className="text-xl font-bold text-orange-600 mb-6 flex items-center gap-2">
                <span className="animate-bounce">🔄</span> Биржа смен (Доступны для взятия)
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {exchangeShifts.map(shift => (
                  <div key={shift.id} className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           {shift.employee?.avatarUrl ? (
                             <img src={`/api${shift.employee.avatarUrl}`} alt="" className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
                           ) : (
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border border-white shadow-sm ${getAvatarColor(shift.employee?.fullName || '')}`}>
                               {shift.employee?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                             </div>
                           )}
                           <div>
                             <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-0.5">{new Date(shift.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                             <p className="text-sm text-gray-700">Отдает: <span className="font-bold">{shift.employee?.fullName}</span></p>
                           </div>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-lg">{shift.department}</span>
                      </div>
                      <p className="text-3xl font-extrabold text-gray-900 mb-4">{shift.startTime} - {shift.endTime}</p>
                    </div>
                    <button onClick={() => requestTakeExchangeShift(shift.id)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-orange-500/20">
                      Забрать смену себе
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ПРЕДСТОЯЩИЕ СМЕНЫ */}
          <div className="pt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><span className="text-primary-500">📅</span> Предстоящие смены</h2>
            
            {upcomingShifts.length === 0 ? (
              <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-gray-100 text-center"><span className="text-6xl mb-4 block">☕</span><h2 className="text-xl font-bold text-gray-800 mb-2">Выходные!</h2><p className="text-gray-500">У вас пока нет назначенных смен в будущем.</p></div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {upcomingShifts.map(shift => {
                  const shiftDateObj = new Date(shift.date);
                  const isToday = shiftDateObj.toDateString() === new Date().toDateString();
                  const isInProgress = shift.status === 'IN_PROGRESS';
                  const isLookingForSwap = shift.isLookingForSwap;

                  return (
                    <div key={shift.id} className={`bg-white p-6 rounded-2xl border shadow-sm transition-all relative overflow-hidden group flex flex-col justify-between
                        ${isInProgress ? 'border-primary-400 ring-4 ring-primary-50' : isLookingForSwap ? 'border-orange-200 bg-orange-50/20' : 'border-gray-100 hover:shadow-md'}
                      `}
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${isInProgress ? 'bg-green-500 animate-pulse' : isLookingForSwap ? 'bg-orange-400' : 'bg-primary-500'}`}></div>
                      
                      <div>
                        <div className="flex justify-between items-start mb-4 pl-2">
                          <div>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                              {shiftDateObj.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                              {isToday && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] uppercase">Сегодня</span>}
                              {isLookingForSwap && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[10px] uppercase">На бирже</span>}
                            </p>
                            <p className="text-3xl font-bold text-gray-900">{shift.startTime} - {shift.endTime}</p>
                          </div>
                          <span className="text-sm font-bold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-xl border border-primary-100">{shift.department}</span>
                        </div>

                        {isInProgress && shift.actualStartTime && (
                          <p className="pl-2 text-sm text-green-600 font-bold mb-4 flex items-center gap-2"><span className="animate-spin">⏳</span> Смена идет с {new Date(shift.actualStartTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                        {isLookingForSwap && (
                          <p className="pl-2 text-sm text-orange-500 font-medium mb-4 flex items-center gap-2">👀 Ожидает, пока кто-то заберет...</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 pl-2 pt-4 mt-2 border-t border-gray-50">
                        {isToday && !isLookingForSwap && (
                          <>
                            {shift.status === 'SCHEDULED' && (
                              <button onClick={() => requestStatusUpdate(shift.id, 'IN_PROGRESS')} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-green-500/30 flex items-center justify-center gap-2">▶ Начать смену</button>
                            )}
                            {shift.status === 'IN_PROGRESS' && (
                              <button onClick={() => requestStatusUpdate(shift.id, 'COMPLETED')} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-red-500/30 flex items-center justify-center gap-2">⏹ Завершить смену</button>
                            )}
                          </>
                        )}

                        {!isInProgress && !isLookingForSwap && (
                          <div className={`flex gap-3 transition-opacity ${isToday ? 'opacity-50 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <button onClick={() => requestShiftTask(shift, 'SWAP')} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2 rounded-xl text-sm transition-colors flex justify-center items-center gap-2">🔄 Отдать смену</button>
                            <button onClick={() => requestShiftTask(shift, 'SICK')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl text-sm transition-colors flex justify-center items-center gap-2">🤒 Заболел</button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* АРХИВ */}
          {pastShifts.length > 0 && (
            <div className="pt-8 mt-8 border-t border-gray-200 border-dashed">
              <h2 className="text-lg font-bold text-gray-400 mb-4 pl-2">Архив (Прошедшие и завершенные смены)</h2>
              <div className="space-y-3 opacity-70 hover:opacity-100 transition-opacity duration-300">
                {pastShifts.map(shift => (
                  <div key={shift.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center hover:bg-white transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold text-gray-700">{new Date(shift.date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}</p>
                        {shift.status === 'COMPLETED' && (<span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Отработано</span>)}
                        {shift.status === 'MISSED' && (<span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Прогул</span>)}
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{shift.department}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-gray-600 font-bold bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">{shift.startTime} - {shift.endTime}</div>
                      {shift.actualEndTime && shift.actualStartTime && (
                        <p className="text-[10px] text-gray-400 font-medium mt-1.5 uppercase tracking-wider">Факт: {new Date(shift.actualStartTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})} - {new Date(shift.actualEndTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* КАСТОМНАЯ МОДАЛКА ПОДТВЕРЖДЕНИЯ */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-fade-in">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              ⚠️
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className={`flex-1 px-6 py-3 text-white font-bold rounded-xl transition-colors shadow-lg ${confirmModal.confirmBtnColor || 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/30'}`}
              >
                {confirmModal.confirmBtnText || 'Да, уверен'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}