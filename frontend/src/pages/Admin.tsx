// frontend/src/pages/Admin.tsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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
    case 'SUPER_ADMIN': return 'Главный администратор';
    case 'ADMIN': return 'Администратор';
    case 'MANAGER': return 'Менеджер';
    case 'CHEF': return 'Шеф-повар';
    default: return 'Сотрудник';
  }
};

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
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
      const response = await fetch('http://localhost:3000/profile', {
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
      const response = await fetch('http://localhost:3000/auth/users', {
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

  // ФУНКЦИЯ ДЛЯ БЫСТРОГО СОХРАНЕНИЯ ДОЛЖНОСТИ И ОТДЕЛА
  const handleFieldChange = async (userId: string, field: 'position' | 'department', value: string, currentValue: string | null) => {
    const trimmedValue = value.trim() || null;
    const currentTrimmed = currentValue?.trim() || null;
    
    // Если ничего не поменялось - не дергаем сервер
    if (trimmedValue === currentTrimmed) return; 
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/auth/users/${userId}`, {
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
      const response = await fetch(`http://localhost:3000/auth/users/${userId}`, {
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
      const response = await fetch(`http://localhost:3000/auth/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (response.ok) {
        toast.success(newStatus ? 'Пользователь активирован ✅' : 'Пользователь заблокирован 🚫');
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: newStatus } : u));
      } else {
        toast.error('Ошибка обновления статуса');
      }
    } catch (error) {
      toast.error('Ошибка соединения с сервером');
    }
  };

  const requestRoleChange = (userId: string, newRole: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Изменение роли',
      message: 'Вы уверены, что хотите изменить права доступа этого сотрудника?',
      onConfirm: () => handleRoleChange(userId, newRole)
    });
  };

  const requestStatusChange = (userId: string, currentStatus: boolean) => {
    const actionText = currentStatus ? 'заблокировать' : 'разблокировать';
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? 'Блокировка доступа' : 'Восстановление доступа',
      message: `Вы уверены, что хотите ${actionText} этого сотрудника?`,
      onConfirm: () => handleStatusChange(userId, !currentStatus)
    });
  };

  const getRoleSelectClass = (role: string) => {
    if (role === 'SUPER_ADMIN') return 'text-red-600 font-black border-red-200 bg-red-50';
    if (role === 'ADMIN') return 'text-purple-600 font-bold border-purple-200 bg-purple-50';
    return 'text-gray-700 font-medium border-gray-200 bg-gray-50';
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Загрузка...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[2rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex justify-between items-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-2">Панель Администратора</h1>
          <p className="text-gray-400">Управление пользователями и правами доступа</p>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center hidden md:block">
          <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mb-1">Всего в базе</p>
          <p className="text-3xl font-black text-white">{users.length} <span className="text-lg font-medium text-gray-400">чел.</span></p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="p-5 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest w-1/3">Сотрудник</th>
                <th className="p-5 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest w-1/4">Должность / Отдел</th>
                <th className="p-5 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Роль в системе</th>
                <th className="p-5 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Доступ</th>
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
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        {user.avatarUrl ? (
                          <img src={`http://localhost:3000${user.avatarUrl}`} className="w-12 h-12 rounded-full object-cover border border-gray-100 flex-shrink-0" alt="" />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${getAvatarColor(user.fullName)}`}>
                            {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate flex items-center gap-2">
                            {user.fullName}
                            {isUserSuperAdmin && <span title="Главный администратор" className="text-red-500 text-base">👑</span>}
                            {isMe && <span className="bg-primary-100 text-primary-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Вы</span>}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      {/* НОВЫЙ БЛОК: Инлайн-редактирование должности и отдела */}
                      <div className={`flex flex-col gap-1 ${isProtected ? "pointer-events-none opacity-70" : ""}`}>
                        <input 
                          type="text" 
                          defaultValue={user.position || ''} 
                          placeholder="Должность не указана"
                          onBlur={(e) => handleFieldChange(user.id, 'position', e.target.value, user.position)}
                          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                          className="font-bold text-gray-700 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-primary-500 focus:bg-white rounded px-2 py-1 outline-none transition-all w-full placeholder-gray-300"
                        />
                        <input 
                          type="text" 
                          defaultValue={user.department || ''} 
                          placeholder="Отдел не указан"
                          onBlur={(e) => handleFieldChange(user.id, 'department', e.target.value, user.department)}
                          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                          className="text-xs text-gray-400 bg-transparent border border-transparent hover:border-gray-200 focus:border-primary-500 focus:bg-white rounded px-2 py-1 outline-none transition-all w-full placeholder-gray-300"
                        />
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex justify-center">
                        {isProtected ? (
                          <div className={`w-full max-w-[220px] rounded-xl px-4 py-2.5 text-center border cursor-default flex items-center justify-center opacity-80 ${getRoleSelectClass(user.role)}`}>
                            {translateRole(user.role)}
                          </div>
                        ) : (
                          <select 
                            value={user.role} 
                            onChange={(e) => requestRoleChange(user.id, e.target.value)}
                            className={`w-full max-w-[220px] rounded-xl px-4 py-2.5 outline-none transition-all text-center border cursor-pointer focus:ring-2 focus:ring-primary-500 hover:brightness-95 ${getRoleSelectClass(user.role)}`}
                          >
                            {(iAmSuperAdmin || isUserSuperAdmin) && (
                              <option value="SUPER_ADMIN" className="text-red-600 font-bold">Главный администратор</option>
                            )}
                            <option value="ADMIN" className="text-purple-600 font-bold">Администратор</option>
                            <option value="MANAGER" className="text-gray-700 font-normal">Менеджер</option>
                            <option value="CHEF" className="text-gray-700 font-normal">Шеф-повар</option>
                            <option value="EMPLOYEE" className="text-gray-700 font-normal">Сотрудник</option>
                          </select>
                        )}
                      </div>
                    </td>

                    <td className="p-5">
                      <div className={`flex flex-col items-center justify-center gap-1 ${isProtected ? "pointer-events-none opacity-50" : ""}`}>
                        <button
                          onClick={() => requestStatusChange(user.id, user.isActive)}
                          disabled={isProtected}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${user.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${user.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                          {user.isActive ? 'Активен' : 'Заблокирован'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-fade-in">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">⚠️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >Отмена</button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary-500/30"
              >Да, уверен</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}