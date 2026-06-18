// frontend/src/components/Layout.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import AnimatedBackground from './AnimatedBackground';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'success' | 'info' | 'default';
  date: string;
  link: string;
  tab?: string;       
  targetId?: string;  
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(JSON.parse(localStorage.getItem('readNotifs') || '[]'));
  
  //Состояние для открытия/закрытия бокового меню (открыто по умолчанию на ПК, закрыто на мобилках)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Вынесли загрузку уведомлений в отдельную функцию, чтобы таймер всегда получал свежие данные
  const loadNotifications = async (roleToCheck: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    let generatedNotifs: AppNotification[] = [];
    
    const tasksHistoryLimit = new Date();
    tasksHistoryLimit.setDate(tasksHistoryLimit.getDate() - 14);

    try {
      const newsRes = await fetch('http://localhost:3000/news', { headers });
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        newsData.forEach((item: any) => {
          generatedNotifs.push({
            id: `news_${item.id}`,
            title: 'Новая публикация',
            message: item.title,
            type: 'info',
            date: item.createdAt,
            link: '/news',
            targetId: item.id
          });
        });
      }
    } catch (e) { }

    try {
      const tasksRes = await fetch('http://localhost:3000/tasks/all', { headers });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const isManagement = roleToCheck === 'SUPER_ADMIN' || roleToCheck === 'ADMIN' || roleToCheck === 'MANAGER';

        tasksData.forEach((task: any) => {
          const taskDate = new Date(task.updatedAt || task.createdAt);
          if (taskDate < tasksHistoryLimit) return;

          const isShiftIssue = task.title.includes('БОЛЬНИЧНЫЙ') || task.title.includes('ПОИСК ЗАМЕНЫ');

          if (isManagement) {
            if ((task.status === 'NEW' || task.status === 'IN_PROGRESS') && isShiftIssue) {
              generatedNotifs.push({
                id: `task_${task.id}`,
                title: task.priority === 'HIGH' ? '🚨 СРОЧНО' : '🔄 Заявка по смене',
                message: `${task.title} (от ${task.author?.fullName || 'Аноним'})`,
                type: task.priority === 'HIGH' ? 'urgent' : 'default',
                date: task.createdAt,
                link: '/workspace', 
                tab: 'shifts',      
                targetId: task.id   
              });
            } else if (task.status === 'NEW') {
              generatedNotifs.push({
                id: `task_${task.id}`,
                title: 'Новая заявка',
                message: `${task.title} (от ${task.author?.fullName || 'Аноним'})`,
                type: 'default',
                date: task.createdAt,
                link: '/tasks',
                targetId: task.id
              });
            }
          } else {
            if (task.status === 'NEW') {
              generatedNotifs.push({
                id: `new_task_${task.id}`,
                title: 'Новое обращение',
                message: `Создана заявка: "${task.title}"`,
                type: 'default',
                date: task.createdAt,
                link: '/tasks',
                targetId: task.id
              });
            } else if (task.status === 'RESOLVED') {
              generatedNotifs.push({
                id: `resolved_${task.id}`,
                title: '✅ Задача решена',
                message: `Проблема устранена: "${task.title}"`,
                type: 'success',
                date: task.updatedAt || task.createdAt,
                link: '/tasks',
                targetId: task.id
              });
            }
          }
        });
      }
    } catch (e) { }

    generatedNotifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setNotifications(generatedNotifs);
  };

  //Загрузка профиля при входе
  useEffect(() => {
    const initApp = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const profileRes = await fetch('http://localhost:3000/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (profileRes.ok) {
          const data = await profileRes.json();
          setUserRole(data.role);
          setUserName(data.fullName);
          setAvatarUrl(data.avatarUrl);
          
          await loadNotifications(data.role);
        }
      } catch (error) { console.error('Ошибка инициализации', error); }
    };

    initApp();
  }, []);

  //Запуск таймера для реального времени
  useEffect(() => {
    if (!userRole) return; // Ждем, пока загрузится профиль

    const pollingInterval = setInterval(() => {
      loadNotifications(userRole);
    }, 5000);

    return () => clearInterval(pollingInterval);
  }, [userRole]);

  //Закрываем меню на телефонах после клика по ссылке
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const newReadIds = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(newReadIds);
    localStorage.setItem('readNotifs', JSON.stringify(newReadIds));
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!readNotifIds.includes(notif.id)) {
      const newReadIds = [...readNotifIds, notif.id];
      setReadNotifIds(newReadIds);
      localStorage.setItem('readNotifs', JSON.stringify(newReadIds));
    }
    setIsNotifOpen(false); 
    handleNavClick(); // Закрываем меню на телефонах
    navigate(notif.link, { state: { activeTab: notif.tab, scrollToId: notif.targetId } });
  };

  const displayNotifs = notifications.map(n => ({
    ...n,
    isRead: readNotifIds.includes(n.id)
  }));
  const unreadCount = displayNotifs.filter(n => !n.isRead).length;

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive
        ? 'bg-primary-500 text-white font-semibold shadow-md shadow-primary-500/30'
        : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700 font-medium'
    }`;
  };

  const getNotifStyles = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white border-gray-100 opacity-60';
    switch(type) {
      case 'urgent': return 'bg-red-50 border-red-100';
      case 'success': return 'bg-green-50 border-green-100';
      case 'info': return 'bg-blue-50 border-blue-100';
      default: return 'bg-primary-50 border-primary-100';
    }
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'urgent': return '🚨';
      case 'success': return '✅';
      case 'info': return '📰';
      default: return '📋';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative bg-transparent">
      <AnimatedBackground />
      
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            fontWeight: '600',
            padding: '16px 24px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />

      {/* ТЕМНЫЙ ФОН ДЛЯ МОБИЛЬНЫХ (при открытом меню) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* БОКОВОЕ МЕНЮ (САЙДБАР) */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40 bg-white border-r border-gray-100 flex flex-col shadow-2xl md:shadow-sm w-64 transform transition-all duration-300 ease-in-out flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:-ml-64'}
      `}>
        <Link to="/dashboard" onClick={handleNavClick} className="block py-6 px-5 border-b border-gray-100 hover:bg-primary-50/30 transition-colors group outline-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[12px] shadow-md shadow-primary-500/30 flex items-center justify-center text-white text-xl group-hover:scale-105 group-hover:-rotate-3 transition-all flex-shrink-0">🌳</div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-900 to-primary-600 tracking-tight whitespace-nowrap">Две Березки</h1>
              <p className="text-[10px] font-bold text-primary-500/70 uppercase tracking-widest mt-0.5">Портал</p>
            </div>
          </div>
        </Link>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <Link to="/dashboard" onClick={handleNavClick} className={getLinkClass('/dashboard')}>Главная</Link>
          <Link to="/news" onClick={handleNavClick} className={getLinkClass('/news')}>Новости</Link>
          <Link to="/shifts" onClick={handleNavClick} className={getLinkClass('/shifts')}>Мои смены</Link>
          <Link to="/tasks" onClick={handleNavClick} className={getLinkClass('/tasks')}>Задачи</Link>

          {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'CHEF') && (
            <Link to="/workspace" onClick={handleNavClick} className={getLinkClass('/workspace')}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Управление
            </Link>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
            <Link to="/accounting" onClick={handleNavClick} className={getLinkClass('/accounting')}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              Учет и ЗП
            </Link>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
            <Link to="/admin" onClick={handleNavClick} className={getLinkClass('/admin')}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              Пользователи
            </Link>
          )}

          <div className="pt-6 pb-2">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Полезные ссылки</p>
            <div className="space-y-1">
              <Link to="/knowledge" onClick={handleNavClick} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary-700 rounded-xl transition-colors font-medium group">
                <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">📁</span> База знаний
              </Link>
              <Link to="/menu" onClick={handleNavClick} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary-700 rounded-xl transition-colors font-medium group">
                <span className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">🍽️</span> Меню ресторана
              </Link>
              <Link to="/safety" onClick={handleNavClick} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary-700 rounded-xl transition-colors font-medium group">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">📋</span> Инструкции по ТБ
              </Link>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <button onClick={() => { navigate('/profile'); handleNavClick(); }} className="w-full text-left px-4 py-3 text-gray-600 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Мой профиль
          </button>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> Выйти
          </button>
        </div>
      </aside>

      <main className="flex-1 relative flex flex-col h-screen overflow-hidden w-full bg-transparent z-10">
        
        {/* ЕДИНАЯ КНОПКА ГАМБУРГЕР (Для телефонов и ПК) */}
        <div className="absolute top-4 left-4 md:top-6 md:left-8 z-20">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-600 hover:text-primary-500 focus:outline-none transition-colors"
            title="Переключить меню"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>

        {/* ШАПКА: УВЕДОМЛЕНИЯ И ПРОФИЛЬ */}
        <div className="absolute top-4 right-4 md:top-6 md:right-8 z-20 flex items-center gap-3 md:gap-5">
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)} 
              className="p-2 md:p-2.5 text-gray-400 hover:text-primary-500 bg-white shadow-sm border border-gray-100 hover:border-primary-100 rounded-full transition-all relative outline-none"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 md:right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in origin-top-right">
                <div className="p-3 md:p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 text-sm md:text-base">Уведомления</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[10px] md:text-xs font-bold text-primary-500 hover:text-primary-700 transition-colors">Прочитать все</button>
                  )}
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {displayNotifs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">У вас пока нет уведомлений.</div>
                  ) : (
                    <div className="flex flex-col">
                      {displayNotifs.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 md:p-4 border-b border-gray-50 cursor-pointer transition-colors flex gap-3 ${getNotifStyles(notif.type, notif.isRead)} ${notif.isRead ? 'hover:bg-gray-50' : 'hover:brightness-95'}`}
                        >
                          <span className="text-xl md:text-2xl mt-0.5 flex-shrink-0">{getNotifIcon(notif.type)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-xs md:text-sm font-bold pr-2 truncate ${notif.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</h4>
                              <span className="text-[9px] md:text-[10px] text-gray-400 font-medium whitespace-nowrap flex-shrink-0">
                                {new Date(notif.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className={`text-[10px] md:text-xs leading-relaxed break-words ${notif.isRead ? 'text-gray-500' : 'text-gray-700'}`}>{notif.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div onClick={() => navigate('/profile')} className="w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer hover:ring-4 hover:ring-primary-100 transition-all shadow-sm border border-gray-100 overflow-hidden bg-white flex items-center justify-center flex-shrink-0" title="Перейти в профиль">
            {avatarUrl ? (
              <img src={`http://localhost:3000${avatarUrl}`} alt="Аватар пользователя" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-primary-600 text-sm md:text-lg">{userName ? userName.charAt(0).toUpperCase() : '👤'}</span>
            )}
          </div>
        </div>

        {/* КОНТЕНТ */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 pt-20 md:pt-24 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}