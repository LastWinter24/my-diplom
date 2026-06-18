// frontend/src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  
  // Режимы: 'login' | 'register' | 'verify'
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');

  // Поля формы
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [verificationCode, setVerificationCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ВАЛИДАЦИЯ В РЕАЛЬНОМ ВРЕМЕНИ
  
  // Почта: только англ буквы, цифры, символы + обязательный домен
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  // Проверка, что в почте нет русских букв
  const hasNoRussianInEmail = !/[а-яА-ЯёЁ]/.test(email);

  // Пароль: проверки
  const isPassLengthValid = password.length >= 6;
  const hasPassUpper = /[A-Z]/.test(password);
  const hasPassDigit = /\d/.test(password); // НОВОЕ: Хотя бы одна цифра
  // Спецсимвол: любой символ, который НЕ является буквой, цифрой или пробелом (включая точки, запятые и т.д.)
  const hasPassSpecial = /[^a-zA-Z0-9а-яА-ЯёЁ\s]/.test(password); 
  
  // Строгие запреты (показываем ошибку только если юзер нарушил)
  const hasPassCyrillic = /[а-яА-ЯёЁ]/.test(password);
  const hasPassSpace = /\s/.test(password);

  // Итоговая валидация пароля
  const isPasswordFullyValid = isPassLengthValid && hasPassUpper && hasPassDigit && hasPassSpecial && !hasPassCyrillic && !hasPassSpace;
  
  // Проверка совпадения паролей
  const isPasswordsMatch = password !== '' && password === confirmPassword;

  // Итоговая проверка формы регистрации
  const isRegisterFormValid = fullName.trim() && isEmailValid && hasNoRussianInEmail && isPasswordFullyValid && isPasswordsMatch;

  // ОБРАБОТЧИКИ

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        const errData = await response.json();
        setError(errData.message || 'Неверная почта или пароль');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRegisterFormValid) return;
    
    setError('');
    setIsLoading(true);

    try {
      //Просим бэкенд сгенерировать и отправить код на почту
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        // Код улетел! Переключаем на экран ввода 6 цифр
        setMode('verify');
      } else {
        const errData = await response.json();
        setError(errData.message || 'Ошибка отправки кода');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      //Отправляем все данные + КОД на финальную регистрацию
      const regResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, code: verificationCode }),
      });

      if (regResponse.ok) {
        // Если всё супер, сразу логинимся
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        if (loginRes.ok) {
          const data = await loginRes.json();
          localStorage.setItem('token', data.access_token);
          navigate('/dashboard');
        }
      } else {
        const errData = await regResponse.json();
        setError(errData.message || 'Неверный код подтверждения');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  // РЕНДЕР

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in break-words min-w-0 my-8">
        
        {/* Шапка с логотипом */}
        <div className="p-8 text-center bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-lg shadow-green-500/30 flex items-center justify-center text-white text-3xl">
              🌳
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-900 to-green-600 tracking-tight">Две Березки</h1>
              <p className="text-xs font-bold text-green-500/70 uppercase tracking-widest mt-1">Портал сотрудников</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          
          {/* ПЕРЕКЛЮЧАТЕЛЬ ВХОД / РЕГИСТРАЦИЯ */}
          {mode !== 'verify' && (
            <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8">
              <button 
                onClick={() => { setMode('login'); setError(''); }} 
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all outline-none ${mode === 'login' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Вход
              </button>
              <button 
                onClick={() => { setMode('register'); setError(''); }} 
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all outline-none ${mode === 'register' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Регистрация
              </button>
            </div>
          )}

          {/* ВЫВОД ОШИБКИ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
              <span className="text-xl flex-shrink-0">⚠️</span> 
              <span className="break-words min-w-0">{error}</span>
            </div>
          )}

          {/* ФОРМА ВХОДА */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Электронная почта</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  placeholder="admin@mail.ru"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Пароль</label>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all mt-4"
              >
                {isLoading ? 'Загрузка...' : 'Войти в систему'}
              </button>
            </form>
          )}

          {/* ФОРМА РЕГИСТРАЦИИ */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Имя и Фамилия</label>
                <input 
                  type="text" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  placeholder="Иван Иванов"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Электронная почта</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all ${email && (!isEmailValid || !hasNoRussianInEmail) ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-green-500'}`}
                  placeholder="employee@mail.ru"
                />
                {email && !hasNoRussianInEmail && <p className="text-xs text-red-500 mt-1 font-medium">Использование кириллицы запрещено.</p>}
                {email && hasNoRussianInEmail && !isEmailValid && <p className="text-xs text-red-500 mt-1 font-medium">Введите корректный формат (например, @mail.ru).</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Придумайте пароль</label>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  placeholder="Создайте надежный пароль"
                />
                
                {/* Подсказки по паролю */}
                <div className="mt-3 space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Требования к паролю:</p>
                  
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
                  
                  {/* Ошибки, которые показываются только при нарушении */}
                  {hasPassCyrillic && (
                    <p className="text-xs font-bold text-red-500 mt-2">
                      ❌ Нельзя вводить кириллицу, только QWERTY
                    </p>
                  )}
                  {hasPassSpace && (
                    <p className="text-xs font-bold text-red-500 mt-1">
                      ❌ Пробелы запрещены
                    </p>
                  )}
                </div>
              </div>

              {/* ПОЛЕ ПОВТОРА ПАРОЛЯ */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Повторите пароль</label>
                <input 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all ${confirmPassword && !isPasswordsMatch ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-green-500'}`}
                  placeholder="Пароли должны совпадать"
                />
                {confirmPassword && !isPasswordsMatch && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Пароли не совпадают.</p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !isRegisterFormValid}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-green-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all mt-4"
              >
                {isLoading ? 'Отправка...' : 'Зарегистрироваться'}
              </button>
            </form>
          )}

          {/* ФОРМА ПОДТВЕРЖДЕНИЯ ПОЧТЫ  */}
          {mode === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-6 text-center animate-fade-in">
              <div className="text-5xl mb-4">📧</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Проверьте почту</h3>
                <p className="text-sm text-gray-500">Мы отправили 6-значный код подтверждения на адрес <br/><span className="font-bold text-gray-800 break-words">{email}</span></p>
              </div>
              
              <div>
                <input 
                  type="text" 
                  maxLength={6}
                  required 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all text-center text-2xl font-black tracking-[0.5em]"
                  placeholder="000000"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading || verificationCode.length < 6}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all"
              >
                {isLoading ? 'Проверка...' : 'Подтвердить аккаунт'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setMode('register')} 
                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Вернуться назад
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}