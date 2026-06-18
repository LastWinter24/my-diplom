// frontend/src/pages/Profile.tsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const getRoleNameInRussian = (role: string) => {
  switch(role) {
    case 'ADMIN': return 'Администратор';
    case 'MANAGER': return 'Менеджер';
    case 'CHEF': return 'Шеф-повар';
    case 'EMPLOYEE': return 'Сотрудник';
    default: return role;
  }
};

export default function Profile() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // СТАТИСТИКА
  const [resolvedTasks, setResolvedTasks] = useState(0);
  const [shiftsWorked, setShiftsWorked] = useState(0);
  const [shiftsTotalMonth, setShiftsTotalMonth] = useState(0);

  // ВАЛИДАЦИЯ ПАРОЛЯ В РЕАЛЬНОМ ВРЕМЕНИ
  const isChangingPassword = Boolean(oldPassword || newPassword || confirmPassword);

  const isPassLengthValid = newPassword.length >= 6;
  const hasPassUpper = /[A-Z]/.test(newPassword);
  const hasPassDigit = /\d/.test(newPassword);
  const hasPassSpecial = /[^a-zA-Z0-9а-яА-ЯёЁ\s]/.test(newPassword);
  const hasPassCyrillic = /[а-яА-ЯёЁ]/.test(newPassword);
  const hasPassSpace = /\s/.test(newPassword);

  const isPasswordFullyValid = isPassLengthValid && hasPassUpper && hasPassDigit && hasPassSpecial && !hasPassCyrillic && !hasPassSpace;
  const isPasswordsMatch = newPassword !== '' && newPassword === confirmPassword;

  // Форма валидна, если мы НЕ меняем пароль ИЛИ если меняем и все поля правильные
  const isFormValid = fullName.trim() !== '' && (!isChangingPassword || (oldPassword && isPasswordFullyValid && isPasswordsMatch));

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        //Загружаем основные данные профиля
        const response = await fetch('/api/profile', { headers });
        let currentUserName = '';
        
        if (response.ok) {
          const data = await response.json();
          setFullName(data.fullName);
          setEmail(data.email);
          setRole(data.role);
          setPosition(data.position || '');
          setDepartment(data.department || '');
          setCreatedAt(data.createdAt);
          currentUserName = data.fullName;
          
          if (data.avatarUrl) {
            setAvatarUrl(`/api${data.avatarUrl}`);
          }
        }

        //Загружаем статистику решенных задач
        try {
          const tasksRes = await fetch('/api/tasks/my', { headers });
          if (tasksRes.ok) {
            const tasks = await tasksRes.json();
            const resolvedCount = tasks.filter((t: any) => t.status === 'RESOLVED').length;
            setResolvedTasks(resolvedCount);
          }
        } catch (e) {
          console.error('Ошибка загрузки задач:', e);
        }

        //Загружаем статистику смен за текущий месяц
        try {
          const shiftsRes = await fetch('/api/shifts/all', { headers });
          if (shiftsRes.ok) {
            const allShifts = await shiftsRes.json();
            
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const myShiftsThisMonth = allShifts.filter((s: any) => {
              const shiftDate = new Date(s.date);
              return s.employee.fullName === currentUserName &&
                     shiftDate.getMonth() === currentMonth &&
                     shiftDate.getFullYear() === currentYear;
            });

            const worked = myShiftsThisMonth.filter((s: any) => new Date(s.date) < now).length;
            
            setShiftsTotalMonth(myShiftsThisMonth.length);
            setShiftsWorked(worked);
          }
        } catch (e) {
          console.error('Ошибка загрузки смен:', e);
        }

      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
      }
    };

    fetchProfileData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isChangingPassword) {
      if (!oldPassword) return toast.error('Для смены пароля введите текущий пароль');
      if (!isPasswordFullyValid) return toast.error('Новый пароль не соответствует требованиям безопасности');
      if (!isPasswordsMatch) return toast.error('Новые пароли не совпадают');
    }

    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('fullName', fullName);
    
    if (oldPassword && newPassword) {
      formData.append('oldPassword', oldPassword);
      formData.append('newPassword', newPassword);
    }
    
    if (selectedFile) {
      formData.append('avatar', selectedFile);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        toast.success('Профиль успешно обновлен! 🎉');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Ошибка при обновлении');
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      toast.error('Ошибка соединения с сервером');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayImage = previewUrl || avatarUrl;
  
  const shiftProgressPercent = shiftsTotalMonth > 0 ? Math.round((shiftsWorked / shiftsTotalMonth) * 100) : 0;
  const taskProgressPercent = Math.min((resolvedTasks / 20) * 100, 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">
      <h1 className="text-3xl font-extrabold text-primary-900 mb-8">Настройки профиля</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary-400 to-primary-600"></div>
            <div className="px-8 pb-8 flex flex-col items-center">
              <div className="relative -mt-12 mb-4">
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md overflow-hidden flex items-center justify-center">
                  {displayImage ? (
                    <img src={displayImage} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-primary-100 rounded-full flex items-center justify-center text-3xl font-bold text-primary-600">
                      {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 text-center break-words min-w-0 w-full">{fullName}</h2>
              <p className="text-sm font-bold text-primary-600 uppercase tracking-wider mt-1">{getRoleNameInRussian(role)}</p>
              
              <div className="w-full border-t border-gray-100 mt-6 pt-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-gray-800 font-medium break-words min-w-0">{email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Должность</p>
                  <p className="text-sm text-gray-800 font-medium break-words min-w-0">{position || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Отдел</p>
                  <p className="text-sm text-gray-800 font-medium break-words min-w-0">{department || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Дата регистрации</p>
                  <p className="text-sm text-gray-800 font-medium">{createdAt ? new Date(createdAt).toLocaleDateString('ru-RU') : '—'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] shadow-lg p-8 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <h3 className="text-lg font-bold mb-6 relative z-10">Рабочая статистика</h3>
            <div className="space-y-6 relative z-10">
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Смен в этом месяце (прошло/всего)</span>
                  <span className="font-bold">{shiftsWorked} / {shiftsTotalMonth}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${shiftProgressPercent}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Решено задач</span>
                  <span className="font-bold">{resolvedTasks}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${taskProgressPercent}%` }}></div>
                </div>
              </div>

            </div>
          </div>

        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Редактирование данных</h2>
            
            <form onSubmit={handleSaveProfile} className="space-y-8">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-4">Фото профиля</label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-full border border-gray-200 overflow-hidden flex-shrink-0">
                    {displayImage ? (
                      <img src={displayImage} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                        {fullName ? fullName.charAt(0).toUpperCase() : '👤'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="inline-block bg-primary-50 hover:bg-primary-100 text-primary-600 font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm">
                      Загрузить новое фото
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Рекомендуется квадратное изображение (JPG, PNG)</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">Имя и Фамилия</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-gray-900" 
                />
              </div>

              <div className="pt-8 border-t border-gray-50">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Безопасность</h3>
                  <p className="text-sm text-gray-500 mt-1">Заполните эти поля только в том случае, если хотите изменить пароль.</p>
                </div>
                
                <div className="space-y-5 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Текущий пароль</label>
                    <input 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
                      placeholder="Введите старый пароль"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Новый пароль</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
                        placeholder="Минимум 6 символов"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Повторите новый пароль</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-5 py-3 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all ${confirmPassword && !isPasswordsMatch ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-primary-500'}`}
                        placeholder="Пароли должны совпадать"
                      />
                      {confirmPassword && !isPasswordsMatch && (
                        <p className="text-xs text-red-500 mt-1 font-medium">Пароли не совпадают.</p>
                      )}
                    </div>
                  </div>

                  {/* БЛОК С ПОДСКАЗКАМИ ПОЯВЛЯЕТСЯ ТОЛЬКО ПРИ ВВОДЕ */}
                  {newPassword && (
                    <div className="mt-4 space-y-1.5 bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
                      <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Требования к новому паролю:</p>
                      
                      <p className={`text-xs font-medium flex items-center gap-2 ${isPassLengthValid ? 'text-green-600' : 'text-gray-500'}`}>
                        {isPassLengthValid ? '✅' : '❌'} Минимум 6 символов
                      </p>
                      <p className={`text-xs font-medium flex items-center gap-2 ${hasPassUpper ? 'text-green-600' : 'text-gray-500'}`}>
                        {hasPassUpper ? '✅' : '❌'} Хотя бы одна заглавная буква
                      </p>
                      <p className={`text-xs font-medium flex items-center gap-2 ${hasPassDigit ? 'text-green-600' : 'text-gray-500'}`}>
                        {hasPassDigit ? '✅' : '❌'} Хотя бы одна цифра
                      </p>
                      <p className={`text-xs font-medium flex items-center gap-2 ${hasPassSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                        {hasPassSpecial ? '✅' : '❌'} Спецсимвол (.,!@# и др.)
                      </p>
                      
                      {hasPassCyrillic && (
                        <p className="text-xs font-bold text-red-500 mt-2 pt-2 border-t border-red-50">
                          ❌ Нельзя вводить кириллицу, только QWERTY
                        </p>
                      )}
                      {hasPassSpace && (
                        <p className="text-xs font-bold text-red-500 mt-1">
                          ❌ Пробелы запрещены
                        </p>
                      )}
                    </div>
                  )}

                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !isFormValid}
                  className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:hover:bg-primary-500 text-white font-bold py-3 px-10 rounded-xl shadow-lg shadow-primary-500/30 transition-all active:scale-95"
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}