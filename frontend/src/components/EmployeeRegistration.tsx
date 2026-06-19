import { useState } from 'react';

export default function EmployeeRegistration() {
  // Поля формы
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ВАЛИДАЦИЯ
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  const hasNoRussianInEmail = !/[а-яА-ЯёЁ]/.test(email);

  const isPassLengthValid = password.length >= 6;
  const hasPassUpper = /[A-Z]/.test(password);
  const hasPassDigit = /\d/.test(password);
  const hasPassSpecial = /[^a-zA-Z0-9а-яА-ЯёЁ\s]/.test(password); 
  const hasPassCyrillic = /[а-яА-ЯёЁ]/.test(password);
  const hasPassSpace = /\s/.test(password);

  const isPasswordFullyValid = isPassLengthValid && hasPassUpper && hasPassDigit && hasPassSpecial && !hasPassCyrillic && !hasPassSpace;
  const isPasswordsMatch = password !== '' && password === confirmPassword;

  const isFormValid = fullName.trim() && isEmailValid && hasNoRussianInEmail && isPasswordFullyValid && isPasswordsMatch;

  // ОБРАБОТЧИК
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      // Достаем токен админа из памяти браузера
      const token = localStorage.getItem('token'); 

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Подтверждаем, что мы админ!
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (response.ok) {
        setMessage(`Сотрудник ${fullName} успешно зарегистрирован!`);
        // Очищаем форму
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        const errData = await response.json();
        setError(errData.message || 'Ошибка при регистрации');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">👤</span> Добавить нового сотрудника
      </h2>

      {/* УВЕДОМЛЕНИЯ */}
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm font-medium">
          <span className="text-xl">✅</span> {message}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
          <span className="text-xl">⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-5">
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
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Временный пароль</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
            placeholder="Создайте надежный пароль"
          />
          
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
            {hasPassCyrillic && <p className="text-xs font-bold text-red-500 mt-2">❌ Нельзя вводить кириллицу</p>}
            {hasPassSpace && <p className="text-xs font-bold text-red-500 mt-1">❌ Пробелы запрещены</p>}
          </div>
        </div>

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
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !isFormValid}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all mt-4"
        >
          {isLoading ? 'Регистрация...' : 'Зарегистрировать сотрудника'}
        </button>
      </form>
    </div>
  );
}