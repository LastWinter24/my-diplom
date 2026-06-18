// frontend/src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Memo { id: string; title: string; content: string; }
interface ManagementMember { id: string; userId: string; fullName: string; position?: string; avatarUrl?: string | null; }

//Интерфейс для динамических ссылок
interface UsefulLink { id: string; title: string; url: string; icon: string; colorClass: string; }

interface HomeData { 
  title: string; 
  subtitle: string; 
  welcomeText: string; 
  memos: Memo[]; 
  management?: ManagementMember[]; 
  links?: UsefulLink[]; 
}

// Расшифровка кодов погоды
const getWeatherInfo = (code: number) => {
  if (code === 0) return { text: 'Ясно', icon: '☀️' };
  if (code >= 1 && code <= 3) return { text: 'Облачно', icon: '⛅' };
  if (code === 45 || code === 48) return { text: 'Туман', icon: '🌫️' };
  if (code >= 51 && code <= 67) return { text: 'Дождь', icon: '🌧️' };
  if (code >= 71 && code <= 86) return { text: 'Снег', icon: '❄️' };
  if (code >= 95) return { text: 'Гроза', icon: '⛈️' };
  return { text: 'Осадки', icon: '🌦️' };
};

const DEFAULT_CITIES = [
  { id: '1', name: 'Мантурово', admin1: 'Костромская область', latitude: 58.33, longitude: 44.76 },
  { id: '2', name: 'Москва', admin1: 'Москва', latitude: 55.75, longitude: 37.61 },
  { id: '3', name: 'Санкт-Петербург', admin1: 'Санкт-Петербург', latitude: 59.93, longitude: 30.31 },
  { id: '4', name: 'Кострома', admin1: 'Костромская область', latitude: 57.76, longitude: 40.92 },
  { id: '5', name: 'Ярославль', admin1: 'Ярославская область', latitude: 57.62, longitude: 39.87 },
  { id: '6', name: 'Нижний Новгород', admin1: 'Нижегородская область', latitude: 56.32, longitude: 44.00 },
];

export default function Dashboard() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Состояния погоды
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);
  const [location, setLocation] = useState({ name: 'Мантурово', lat: 58.33, lon: 44.76 });
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  
  const [fullHourlyData, setFullHourlyData] = useState<any[]>([]);
  const [weeklyWeather, setWeeklyWeather] = useState<any[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // Поиск городов
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>(DEFAULT_CITIES);

  useEffect(() => {
    fetch('http://localhost:3000/pages/home')
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.content) {
          try {
            const parsed = typeof resData.content === 'string' && resData.content.trim().startsWith('{') 
              ? JSON.parse(resData.content) 
              : resData.content;
            setData(parsed); 
          } catch (e) { }
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  // Загрузка погоды
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Europe%2FMoscow&forecast_days=10`);
        const data = await res.json();
        
        setCurrentWeather({
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          pressure: Math.round(data.current.surface_pressure * 0.750062),
          humidity: data.current.relative_humidity_2m,
          wind: Math.round(data.current.wind_speed_10m * 10) / 10,
          ...getWeatherInfo(data.current.weather_code)
        });

        const allHours = data.hourly.time.map((time: string, idx: number) => ({
          timeStr: new Date(time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          temp: Math.round(data.hourly.temperature_2m[idx]),
          ...getWeatherInfo(data.hourly.weather_code[idx])
        }));
        setFullHourlyData(allHours);

        const week = data.daily.time.map((date: string, index: number) => ({
          fullDateStr: new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
          date: new Date(date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' }),
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          precip: data.daily.precipitation_probability_max?.[index] || 0,
          ...getWeatherInfo(data.daily.weather_code[index])
        }));
        
        setWeeklyWeather(week);
        setSelectedDayIndex(0);
      } catch (err) { console.error('Ошибка погоды', err); }
    };
    fetchWeather();
  }, [location]);

  useEffect(() => {
    if (searchQuery.length === 0) {
      setSearchResults(DEFAULT_CITIES);
      return;
    }
    const search = async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&language=ru&count=5`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (e) { }
    };
    const timeoutId = setTimeout(search, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const selectedDayHours = fullHourlyData.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24);
  const CHART_WIDTH = 24 * 64; 
  const CHART_HEIGHT = 50;
  const temps = selectedDayHours.map(h => h?.temp || 0);
  const minTemp = Math.min(...temps) || 0;
  const maxTemp = Math.max(...temps) || 1;
  const tempRange = Math.max(maxTemp - minTemp, 1);
  const getX = (index: number) => index * 64 + 32; 
  const getY = (temp: number) => CHART_HEIGHT - 10 - ((temp - minTemp) / tempRange) * (CHART_HEIGHT - 20);
  const points = selectedDayHours.map((h, i) => `${getX(i)},${getY(h.temp)}`).join(' ');

  if (loading) return <div className="p-10 text-center text-gray-500">Загрузка...</div>;

  const content = data || { title: 'Добро пожаловать', subtitle: 'Портал', welcomeText: '', memos: [], management: [], links: [] };
  const memos = content.memos || [];
  const management = content.management || [];
  const links = content.links || []; // Читаем сохраненные ссылки
  
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % memos.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + memos.length) % memos.length);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 overflow-x-hidden animate-fade-in">
      
      {/* 1. БАННЕР */}
      <div className="bg-slate-900 rounded-[2rem] shadow-xl border border-slate-800 p-10 md:p-16 flex flex-col items-center text-center relative overflow-hidden">
        {/* Фирменное мягкое свечение (как на карточке меню) */}
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-slate-700/30 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <p className="text-gray-400 font-extrabold uppercase tracking-widest text-sm mb-4 bg-slate-800/80 border border-slate-700 px-4 py-1.5 rounded-lg inline-block shadow-sm">
            {content.subtitle}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight max-w-4xl text-balance w-full px-4 drop-shadow-md">
            {content.title}
          </h1>
          {/* ИЗМЕНЕНО: Рендер HTML из ReactQuill (С учетом темного фона!) */}
          <div 
            className="text-lg text-gray-400 max-w-2xl font-medium leading-relaxed custom-html-content [&_strong]:text-white"
            dangerouslySetInnerHTML={{ __html: content.welcomeText }}
          />
        </div>
      </div>

      {/* 2. КАРУСЕЛЬ ПАМЯТОК */}
      {memos.length > 0 && (
        <div className="relative max-w-4xl mx-auto">
          <div className="relative bg-primary-500 rounded-[1.5rem] shadow-lg shadow-primary-500/30 px-12 py-10 min-h-[160px] flex items-center justify-center text-white overflow-hidden">
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:scale-110 transition-all z-20 outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
            <div className="w-full overflow-hidden">
              <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {memos.map((memo) => (
                  <div key={memo.id} className="w-full flex-shrink-0 text-center px-4 md:px-8">
                    <p className="text-sm font-medium mb-1 uppercase tracking-wider opacity-90">{memo.title}</p>
                    {/* ИЗМЕНЕНО: Рендер HTML (С учетом яркого фона!) */}
                    <div 
                      className="text-2xl md:text-3xl font-bold custom-html-content [&_strong]:text-white [&_p]:mb-1"
                      dangerouslySetInnerHTML={{ __html: memo.content }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:scale-110 transition-all z-20 outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>
      )}

      {/* 3. СЕТКА ВИДЖЕТОВ */}
      <div className={`flex flex-col md:flex-row w-full overflow-hidden pt-4 relative transition-all duration-700 ${isWeatherExpanded ? 'gap-0' : 'gap-6'}`}>
        
        {/* ВИДЖЕТ ПОГОДЫ */}
        <div 
          className={`transition-all duration-700 ease-in-out flex-shrink-0 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col relative z-10
            ${isWeatherExpanded ? 'w-full p-6 md:p-8' : 'w-full md:w-[calc(33.333%-1rem)] p-6'}
          `}
        >
          {/* Шапка с кнопками */}
          <div className="flex items-center justify-between mb-4 gap-4 relative">
            <div className="relative flex-1 min-w-0">
              <button onClick={() => setIsSearchingCity(!isSearchingCity)} className="w-full text-left flex items-center gap-1.5 group outline-none">
                <span className="text-primary-500 text-2xl md:text-3xl flex-shrink-0">📍</span> 
                <span className="text-2xl md:text-3xl font-extrabold text-gray-900 truncate hover:text-primary-600 transition-colors">
                  {location.name}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-300 flex-shrink-0 group-hover:text-primary-500 transition-transform ${isSearchingCity ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {isSearchingCity && (
                <div className="absolute top-full mt-3 left-0 bg-white shadow-2xl border border-gray-100 p-3 rounded-2xl w-72 z-50 animate-fade-in">
                  <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск города..." className="w-full px-4 py-3 bg-gray-50 focus:border-primary-300 rounded-xl outline-none text-sm mb-2" />
                  <ul className="max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {searchQuery.length === 0 && <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-1">Популярные</p>}
                    {searchResults.map(city => (
                      <li key={city.id} onClick={() => { setLocation({ name: city.name, lat: city.latitude, lon: city.longitude }); setIsSearchingCity(false); setSearchQuery(''); }} className="px-4 py-3 hover:bg-primary-50 hover:text-primary-700 cursor-pointer text-sm rounded-xl transition-colors flex flex-col">
                        <span className="font-bold">{city.name}</span>
                        <span className="text-xs text-gray-500">{city.admin1 || city.country}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setIsSearchingCity(false)} className="w-full text-sm font-medium text-gray-400 hover:text-gray-600 mt-2 py-2">Отмена</button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsWeatherExpanded(!isWeatherExpanded)} 
              className="bg-gray-50 hover:bg-primary-50 text-gray-400 hover:text-primary-600 p-3 rounded-xl transition-colors outline-none flex-shrink-0"
              title={isWeatherExpanded ? 'Свернуть' : 'Развернуть подробный прогноз'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-500 ${isWeatherExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 mb-2 w-full">
            <div className="flex items-center gap-4 md:gap-6">
              <span className="text-6xl md:text-7xl drop-shadow-sm">{currentWeather?.icon || '⏳'}</span>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                    {currentWeather?.temp ? `${currentWeather.temp > 0 ? '+' : ''}${currentWeather.temp}°` : '...'}
                  </span>
                </div>
                <span className="text-gray-500 font-medium text-lg md:text-xl mt-1">{currentWeather?.text || 'Загрузка...'}</span>
              </div>
            </div>

            {/* Карточки 2x2 */}
            <div className={`transition-all duration-700 ease-in-out overflow-hidden flex-shrink-0
              ${isWeatherExpanded ? 'max-h-[500px] opacity-100 md:max-w-[360px] w-full mt-4 md:mt-0' : 'max-h-0 md:max-w-0 opacity-0 w-0 m-0'}
            `}>
              <div className="grid grid-cols-2 gap-3 min-w-[280px]">
                <div className="flex items-center gap-3 bg-orange-50/70 border border-orange-100/50 p-3 rounded-2xl">
                   <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center text-xl shadow-sm text-orange-500">🌡️</div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Ощущается</span>
                     <span className="text-sm font-bold text-gray-800">{currentWeather?.feelsLike > 0 ? '+' : ''}{currentWeather?.feelsLike}°</span>
                   </div>
                </div>
                <div className="flex items-center gap-3 bg-blue-50/70 border border-blue-100/50 p-3 rounded-2xl">
                   <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center text-xl shadow-sm">💨</div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Ветер</span>
                     <span className="text-sm font-bold text-gray-800">{currentWeather?.wind} м/с</span>
                   </div>
                </div>
                <div className="flex items-center gap-3 bg-purple-50/70 border border-purple-100/50 p-3 rounded-2xl">
                   <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center text-xl shadow-sm">🧭</div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Давление</span>
                     <span className="text-sm font-bold text-gray-800">{currentWeather?.pressure} мм</span>
                   </div>
                </div>
                <div className="flex items-center gap-3 bg-cyan-50/70 border border-cyan-100/50 p-3 rounded-2xl">
                   <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center text-xl shadow-sm">💧</div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Влажность</span>
                     <span className="text-sm font-bold text-gray-800">{currentWeather?.humidity}%</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Расширенная версия: График + 10 Дней */}
          {isWeatherExpanded && (
            <div className="flex flex-col mt-8 animate-fade-in">
              <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 md:p-5 mb-8 shadow-inner">
                <div className="flex justify-between items-center mb-4 px-1">
                  <h4 className="font-bold text-gray-800 text-lg">Почасовой прогноз</h4>
                  <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg">
                    {weeklyWeather[selectedDayIndex]?.fullDateStr || ''}
                  </span>
                </div>
                <div className="overflow-x-auto pb-4 custom-scrollbar">
                  {selectedDayHours.length > 0 ? (
                    <div className="relative h-[150px]" style={{ width: `${CHART_WIDTH}px` }}>
                      <div className="flex absolute top-0 left-0 w-full z-10">
                        {selectedDayHours.map((hour, idx) => (
                          <div key={idx} className="w-16 flex flex-col items-center">
                            <span className="text-xs font-bold text-gray-500 mb-2">{hour.timeStr}</span>
                            <span className="text-2xl mb-2">{hour.icon}</span>
                            <span className="text-sm font-bold text-gray-900 mb-2">{hour.temp > 0 ? '+' : ''}{hour.temp}°</span>
                          </div>
                        ))}
                      </div>
                      <svg className="absolute left-0 top-[85px] w-full h-[50px] pointer-events-none z-0" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none">
                        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {selectedDayHours.map((h, i) => (
                          <circle key={i} cx={getX(i)} cy={getY(h.temp)} r="4" fill="white" stroke="#3b82f6" strokeWidth="2.5" />
                        ))}
                      </svg>
                    </div>
                  ) : (
                     <p className="text-center text-gray-400 py-4">Нет данных по часам</p>
                  )}
                </div>
              </div>

              <div className="pb-2">
                <h4 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Прогноз на 10 дней</h4>
                <div className="flex gap-3 overflow-x-auto pt-2 pb-4 px-1 custom-scrollbar">
                  {weeklyWeather.map((day, idx) => {
                    const isActive = idx === selectedDayIndex;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedDayIndex(idx)}
                        className={`flex flex-col items-center justify-between rounded-2xl p-4 min-w-[100px] flex-shrink-0 transition-all cursor-pointer group
                          ${isActive 
                            ? 'bg-white shadow-md border-2 border-primary-500 scale-[1.02]' 
                            : 'bg-gray-50 hover:bg-white hover:shadow-md border-2 border-transparent hover:border-gray-200'
                          }`}
                      >
                        <span className={`text-sm font-bold capitalize mb-1 ${isActive ? 'text-primary-700' : 'text-gray-800'}`}>
                          {idx === 0 ? 'Сегодня' : day.date.split(',')[0]}
                        </span>
                        <span className="text-xs text-gray-400 mb-3">{day.date.split(', ')[1]}</span>
                        <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{day.icon}</span>
                        <div className="flex gap-2 text-sm font-bold mb-3">
                          <span className="text-gray-900">{day.tempMax > 0 ? '+' : ''}{day.tempMax}°</span>
                          <span className="text-gray-400">{day.tempMin > 0 ? '+' : ''}{day.tempMin}°</span>
                        </div>
                        <div className={`w-full rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold
                          ${isActive ? 'bg-primary-50 text-primary-700' : 'bg-blue-50/50 text-blue-600'}
                        `}>
                          💧 {day.precip}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ДИНАМИЧЕСКИЕ ССЫЛКИ И РУКОВОДСТВО */}
        <div className={`transition-all duration-700 ease-in-out flex flex-col md:flex-row gap-6 flex-shrink-0 mt-6 md:mt-0 ${isWeatherExpanded ? 'w-0 opacity-0 translate-x-20 pointer-events-none absolute' : 'w-full md:w-[calc(66.666%-0.5rem)] opacity-100 translate-x-0 relative'}`}>
          
          {/* ССЫЛКИ: Теперь загружаются из базы данных! */}
          <div className="w-full md:w-1/2 bg-white p-6 md:p-8 rounded-[1.5rem] shadow-sm border border-gray-100 min-w-[200px] flex flex-col">
            <h3 className="font-bold text-gray-900 text-xl mb-6">Полезные ссылки</h3>
            <ul className="space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[220px]">
              {links.length > 0 ? links.map(link => {
                // УМНАЯ ПРОВЕРКА ССЫЛОК
                let isExternal = false;
                let navPath = link.url;

                // Если ссылка начинается с http/https
                if (navPath.startsWith('http')) {
                  // Проверяем, содержит ли она наш текущий домен (например, localhost:5173)
                  if (navPath.includes(window.location.host)) {
                    // Это наш сайт! Отрезаем домен, чтобы оставить только путь (например, /menu)
                    try {
                      navPath = new URL(navPath).pathname;
                    } catch (e) {
                      navPath = '/'; // На случай кривой ссылки
                    }
                  } else {
                    // Это реально чужой сайт
                    isExternal = true;
                  }
                }

                return (
                  <li key={link.id}>
                    {isExternal ? (
                      <a href={navPath} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-primary-600 transition-colors font-medium text-lg group">
                        <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center mr-4 transition-transform group-hover:scale-105 ${link.colorClass || 'bg-gray-50 text-gray-500'}`}>
                          <span className="text-2xl drop-shadow-sm">{link.icon || '🔗'}</span>
                        </div>
                        <span className="truncate">{link.title}</span>
                      </a>
                    ) : (
                      <Link to={navPath} className="flex items-center text-gray-700 hover:text-primary-600 transition-colors font-medium text-lg group">
                        <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center mr-4 transition-transform group-hover:scale-105 ${link.colorClass || 'bg-gray-50 text-gray-500'}`}>
                          <span className="text-2xl drop-shadow-sm">{link.icon || '🔗'}</span>
                        </div>
                        <span className="truncate">{link.title}</span>
                      </Link>
                    )}
                  </li>
                );
              }) : (
                <p className="text-sm text-gray-400 py-4">Ссылки пока не добавлены.</p>
              )}
            </ul>
          </div>

          {/* РУКОВОДСТВО */}
          <div className="w-full md:w-1/2 bg-white p-6 md:p-8 rounded-[1.5rem] shadow-sm border border-gray-100 min-w-[200px] flex flex-col">
            <h3 className="font-bold text-gray-900 text-xl mb-6">Руководство</h3>
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[220px]">
              {management.length > 0 ? management.map((manager: any) => (
                <div key={manager.id} className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                  {manager.avatarUrl ? (
                    <img src={`http://localhost:3000${manager.avatarUrl}`} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-100" alt={manager.fullName} />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center font-bold text-lg bg-primary-100 text-primary-600">
                      {manager.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{manager.fullName}</p>
                    <p className="text-xs text-gray-500 font-medium line-clamp-1">{manager.position || 'Сотрудник'}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">Список руководства пуст</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}