import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  
  // Поля формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ОБРАБОТЧИК ВХОДА
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
          
          {/* ВЫВОД ОШИБКИ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
              <span className="text-xl flex-shrink-0">⚠️</span> 
              <span className="break-words min-w-0">{error}</span>
            </div>
          )}

          {/* ФОРМА ВХОДА */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Электронная почта</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="employee@mail.ru"
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

        </div>
      </div>
    </div>
  );
}