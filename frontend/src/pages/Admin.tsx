import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import EmployeeRegistration from '../components/EmployeeRegistration';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  position: string | null;
  department: string | null;
  isActive: boolean;
  avatarUrl: string | null;
}

const AVATAR_COLORS = [
  'bg-orange-100 text-orange-600', 'bg-green-100 text-green-600', 'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600', 'bg-rose-100 text-rose-600', 'bg-yellow-100 text-yellow-700',
];

const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

const translateRole = (role: string) => {
  switch(role) {
    case 'SUPER_ADMIN': return 'Главный админ';
    case 'ADMIN': return 'Администратор';
    case 'MANAGER': return 'Менеджер';
    case 'CHEF': return 'Шеф-повар';
    default: return 'Сотрудник';
  }
};

const getRoleSelectClass = (role: string) => {
  if (role === 'SUPER_ADMIN') return 'text-red-600 font-black border-red-200 bg-red-50';
  if (role === 'ADMIN') return 'text-purple-600 font-bold border-purple-200 bg-purple-50';
  return 'text-gray-700 font-medium border-gray-200 bg-gray-50';
};

// --- КАСТОМНЫЙ ВЫПАДАЮЩИЙ СПИСОК ---
const CustomRoleSelect = ({ user, iAmSuperAdmin, isUserSuperAdmin, requestRoleChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    ...(iAmSuperAdmin || isUserSuperAdmin ? [{ value: 'SUPER_ADMIN', label: 'Главный админ', className: 'text-red-600 font-bold' }] : []),
    { value: 'ADMIN', label: 'Админ', className: 'text-purple-600 font-bold' },
    { value: 'MANAGER', label: 'Менеджер', className: 'text-gray-700 font-medium' },
    { value: 'CHEF', label: 'Шеф', className: 'text-gray-700 font-medium' },
    { value: 'EMPLOYEE', label: 'Сотрудник', className: 'text-gray-700 font-medium' }
  ];

  return (
    <div className="relative w-full min-w-[100px] sm:min-w-[140px]" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-[10px] sm:text-sm rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-4 sm:py-2.5 transition-all border cursor-pointer hover:brightness-95 flex items-center justify-between gap-1 select-none shadow-sm ${getRoleSelectClass(user.role)}`}
      >
        <span className="truncate flex-1 text-left">{translateRole(user.role)}</span>
        <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-[100] top-full left-0 mt-1 w-full min-w-[140px] bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => {
                if (opt.value !== user.role) requestRoleChange(user.id, opt.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm cursor-pointer hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0 ${opt.className} ${opt.value === user.role ? 'bg-gray-50' : ''}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'users' | 'register'>('users');
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUserRole(data.role);
        setCurrentUserId(data.id);
      }
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = async (userId: string, field: 'position' | 'department', value: string, currentValue: string | null) => {
    const trimmedValue = value.trim() || null;
    const currentTrimmed = currentValue?.trim() || null;
    
    if (trimmedValue === currentTrimmed) return; 
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [field]: trimmedValue })
      });

      if (response.ok) {
        toast.success('Данные обновлены! ✨');
        setUsers(users.map(u => u.id === userId ? { ...u, [field]: trimmedValue } : u));
      } else {
        toast.error('Ошибка сохранения');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Ошибка соединения с сервером');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        toast.success('Права доступа обновлены! 🔒');
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        toast.error('Ошибка обновления прав');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Ошибка соединения с сервером');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (response.ok) {
        toast.success(newStatus ? 'Активирован ✅' : 'Заблокирован 🚫');
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: newStatus } : u));
      } else {
        toast.error('Ошибка статуса');
      }
    } catch (error) {
      toast.error('Ошибка соединения с сервером');
    }
  };

  const requestRoleChange = (userId: string, newRole: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Изменение роли',
      message: 'Изменить права доступа этого сотрудника?',
      onConfirm: () => handleRoleChange(userId, newRole)
    });
  };

  const requestStatusChange = (userId: string, currentStatus: boolean) => {
    const actionText = currentStatus ? 'заблокировать' : 'разблокировать';
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? 'Блокировка' : 'Восстановление',
      message: `Уверены, что хотите ${actionText} этого сотрудника?`,
      onConfirm: () => handleStatusChange(userId, !currentStatus)
    });
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Загрузка...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[2rem] p-6 md:p-10 text-white shadow-xl relative overflow-hidden flex justify-between items-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Панель Администратора</h1>
          <p className="text-gray-400 text-sm md:text-base">Управление пользователями</p>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8 max-w-sm w-full">
        <button 
          onClick={() => { setActiveTab('users'); fetchUsers(); }} 
          className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all outline-none ${activeTab === 'users' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Сотрудники
        </button>
        <button 
          onClick={() => setActiveTab('register')} 
          className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all outline-none ${activeTab === 'register' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Новый профиль
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          {/* Отступ pb-32 не дает менюшке обрезаться снизу */}
          <div className="overflow-x-auto custom-scrollbar pb-32">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="p-2 sm:p-5 border-b border-gray-100 text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Сотрудник</th>
                  <th className="p-2 sm:p-5 border-b border-gray-100 text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Должность</th>
                  <th className="p-2 sm:p-5 border-b border-gray-100 text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Роль</th>
                  <th className="p-2 sm:p-5 border-b border-gray-100 text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Доступ</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const iAmSuperAdmin = currentUserRole === 'SUPER_ADMIN';
                  const iAmAdmin = currentUserRole === 'ADMIN';
                  const isUserSuperAdmin = user.role === 'SUPER_ADMIN';
                  const isMe = user.id === currentUserId;

                  let isProtected = false;
                  if (iAmAdmin && (isUserSuperAdmin || user.role === 'ADMIN')) isProtected = true;
                  if (isMe) isProtected = true;

                  return (
                    <tr key={user.id} className={`border-b border-gray-50 last:border-0 transition-colors ${isProtected ? 'bg-gray-50/30' : 'hover:bg-gray-50/50'}`}>
                      <td className="p-2 sm:p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                          {user.avatarUrl ? (
                            <img src={`/api${user.avatarUrl}`} className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-100 flex-shrink-0" alt="" />
                          ) : (
                            <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-lg flex-shrink-0 ${getAvatarColor(user.fullName)}`}>
                              {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0 max-w-[100px] sm:max-w-full">
                            <p className="font-bold text-gray-900 text-[11px] sm:text-base break-words flex flex-wrap items-center gap-1">
                              {user.fullName}
                              {isUserSuperAdmin && <span title="Главный администратор" className="text-red-500 text-xs sm:text-base">👑</span>}
                            </p>
                            <p className="text-[9px] sm:text-xs text-gray-500 break-words">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-2 sm:p-5">
                        <div className={`flex flex-col gap-1 w-[80px] sm:w-auto ${isProtected ? "pointer-events-none opacity-70" : ""}`}>
                          <input 
                            type="text" 
                            defaultValue={user.position || ''} 
                            placeholder="Не указано"
                            onBlur={(e) => handleFieldChange(user.id, 'position', e.target.value, user.position)}
                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                            className="font-bold text-gray-700 text-[10px] sm:text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-primary-500 focus:bg-white rounded px-1 sm:px-2 py-1 outline-none transition-all w-full placeholder-gray-300"
                          />
                          <input 
                            type="text" 
                            defaultValue={user.department || ''} 
                            placeholder="Не указано"
                            onBlur={(e) => handleFieldChange(user.id, 'department', e.target.value, user.department)}
                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                            className="text-[9px] sm:text-xs text-gray-400 bg-transparent border border-transparent hover:border-gray-200 focus:border-primary-500 focus:bg-white rounded px-1 sm:px-2 py-1 outline-none transition-all w-full placeholder-gray-300"
                          />
                        </div>
                      </td>

                      <td className="p-2 sm:p-5">
                        <div className="flex justify-center">
                          {isProtected ? (
                            <div className={`w-full text-[10px] sm:text-sm rounded-lg sm:rounded-xl px-1 py-1.5 sm:px-4 sm:py-2.5 text-center border cursor-default flex items-center justify-center opacity-80 ${getRoleSelectClass(user.role)}`}>
                              {translateRole(user.role)}
                            </div>
                          ) : (
                            <CustomRoleSelect 
                              user={user} 
                              iAmSuperAdmin={iAmSuperAdmin} 
                              isUserSuperAdmin={isUserSuperAdmin} 
                              requestRoleChange={requestRoleChange} 
                            />
                          )}
                        </div>
                      </td>

                      <td className="p-2 sm:p-5">
                        <div className={`flex flex-col items-center justify-center gap-1 ${isProtected ? "pointer-events-none opacity-50" : ""}`}>
                          <button
                            onClick={() => requestStatusChange(user.id, user.isActive)}
                            disabled={isProtected}
                            className={`relative inline-flex h-5 w-9 sm:h-7 sm:w-12 items-center rounded-full transition-colors focus:outline-none ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 sm:h-5 sm:w-5 transform rounded-full bg-white transition-transform ${user.isActive ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in flex justify-center px-4">
           <EmployeeRegistration />
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all animate-fade-in">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-4 sm:mb-6 shadow-inner">⚠️</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm sm:text-base font-bold rounded-xl transition-colors"
              >Отмена</button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-primary-500 hover:bg-primary-600 text-white text-sm sm:text-base font-bold rounded-xl transition-colors shadow-lg shadow-primary-500/30"
              >Да, уверен</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}