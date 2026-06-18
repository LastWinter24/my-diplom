import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast'; 
import EmojiPicker, { Theme } from 'emoji-picker-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface Employee { id: string; fullName: string; role: string; position?: string; avatarUrl?: string | null; }
interface Shift { id: string; date: string; startTime: string; endTime: string; department: string; isLookingForSwap?: boolean; employee: { fullName: string; position?: string; avatarUrl?: string | null }; createdBy: { fullName: string }; }
interface Task { id: string; title: string; content: string; status: string; author?: { fullName: string; avatarUrl?: string | null } }
interface Memo { id: string; title: string; content: string; }
interface UsefulLink { id: string; title: string; url: string; icon: string; colorClass: string; }
interface ManagementMember { id: string; userId: string; fullName: string; position?: string; avatarUrl?: string | null; }
interface MenuDay { day: string; breakfast: string; lunch: string; dinner: string; }
interface MenuPreset { id: string; name: string; menu: MenuDay[]; }
interface KnowledgeItem { id: string; title: string; content: string; }
interface SafetyRule { id: string; title: string; content: string; }
interface FeedbackItem { id: string; text: string; author: string; date: string; }

interface HomeData { 
  title: string; subtitle: string; welcomeText: string; memos: Memo[]; links: UsefulLink[]; management?: ManagementMember[]; 
  restaurantMenu?: MenuDay[]; menuPresets?: MenuPreset[]; activeMenuId?: string;
  knowledgeBase?: KnowledgeItem[]; safetyRules?: SafetyRule[];
}

const COLOR_OPTIONS = [
  { label: 'Оранжевый', value: 'bg-orange-50 text-orange-500' }, { label: 'Зеленый', value: 'bg-green-50 text-green-500' },
  { label: 'Синий', value: 'bg-blue-50 text-blue-500' }, { label: 'Фиолетовый', value: 'bg-purple-50 text-purple-500' },
  { label: 'Розовый', value: 'bg-rose-50 text-rose-500' }, { label: 'Желтый', value: 'bg-yellow-50 text-yellow-500' },
];

const DEFAULT_MENU: MenuDay[] = [
  { day: 'Понедельник', breakfast: '', lunch: '', dinner: '' }, { day: 'Вторник', breakfast: '', lunch: '', dinner: '' },
  { day: 'Среда', breakfast: '', lunch: '', dinner: '' }, { day: 'Четверг', breakfast: '', lunch: '', dinner: '' },
  { day: 'Пятница', breakfast: '', lunch: '', dinner: '' }, { day: 'Суббота', breakfast: '', lunch: '', dinner: '' },
  { day: 'Воскресенье', breakfast: '', lunch: '', dinner: '' },
];

const getRoleNameInRussian = (role: string) => {
  switch(role) { case 'SUPER_ADMIN': return 'Главный администратор'; case 'ADMIN': return 'Администратор'; case 'MANAGER': return 'Менеджер'; case 'CHEF': return 'Шеф-повар'; case 'EMPLOYEE': return 'Сотрудник'; default: return role; }
};

const AVATAR_COLORS = ['bg-orange-100 text-orange-600', 'bg-green-100 text-green-600', 'bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-rose-100 text-rose-600', 'bg-yellow-100 text-yellow-700', 'bg-cyan-100 text-cyan-600', 'bg-pink-100 text-pink-600', 'bg-teal-100 text-teal-600'];
const getAvatarColor = (name: string) => { if (!name) return AVATAR_COLORS[0]; let sum = 0; for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i); return AVATAR_COLORS[sum % AVATAR_COLORS.length]; };

// Настройки кнопок для нашего редактора
const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'], 
    [{ 'list': 'bullet' }, { 'list': 'ordered' }],
    ['clean']
  ],
};

const CustomTextarea = ({ value, onChange, placeholder, focusRingClass = 'focus-within:ring-primary-500 focus-within:border-primary-500' }: { value: string, onChange: (val: string) => void, placeholder: string, focusRingClass?: string }) => {
  const quillRef = useRef<any>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const handleInsertEmoji = (emoji: string) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const selection = editor.getSelection();
      const cursorPosition = selection ? selection.index : editor.getLength() - 1;
      editor.insertText(cursorPosition, emoji);
      setTimeout(() => editor.setSelection(cursorPosition + emoji.length, 0), 0);
    }
  };

  return (
    <div className={`border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all bg-white relative flex flex-col shadow-sm focus-within:border-transparent focus-within:ring-4 ${focusRingClass} custom-quill-container`}>
      <div className="flex items-center gap-2 bg-gray-50/50 px-3 pt-3 pb-1 rounded-t-xl relative z-20">
        <div className="relative">
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-lg shadow-sm border border-gray-200 text-gray-700 transition-all text-xs font-bold flex items-center gap-2 outline-none">
            😀 Смайлики
          </button>
          
          {showEmoji && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)}></div>
              <div className="absolute top-full left-0 mt-2 z-50 shadow-2xl rounded-xl overflow-hidden">
                <EmojiPicker onEmojiClick={(ed) => { handleInsertEmoji(ed.emoji); setShowEmoji(false); }} theme={Theme.LIGHT} searchPlaceHolder="Поиск смайликов..." width={300} height={400} />
              </div>
            </>
          )}
        </div>
      </div>

      <ReactQuill 
        ref={quillRef}
        theme="snow"
        value={value} 
        onChange={onChange} 
        modules={quillModules}
        placeholder={placeholder}
        className="w-full flex-1"
      />
    </div>
  );
};

export default function Workspace() {
  const location = useLocation(); 
  const [activeTab, setActiveTab] = useState('main'); 
  const [userRole, setUserRole] = useState<string | null>(null); 
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [shiftRequests, setShiftRequests] = useState<Task[]>([]); 
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  
  const [shiftEmployeeId, setShiftEmployeeId] = useState('');
  const [shiftDepartment, setShiftDepartment] = useState('Ресепшн');
  const [shiftDate, setShiftDate] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('09:00');
  const [shiftEndTime, setShiftEndTime] = useState('18:00');
  const [shiftViewMode, setShiftViewMode] = useState<'cards' | 'table'>('table');

  const [baseDate, setBaseDate] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });

  const [homeData, setHomeData] = useState<HomeData>({ title: '', subtitle: '', welcomeText: '', memos: [], links: [], management: [], menuPresets: [], activeMenuId: '', knowledgeBase: [], safetyRules: [] });
  const [isSavingHome, setIsSavingHome] = useState(false);
  const [isHomeLoaded, setIsHomeLoaded] = useState(false); // ИНДИКАТОР ЗАГРУЗКИ ДАННЫХ
  
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkIcon, setNewLinkIcon] = useState('📁');
  const [newLinkColor, setNewLinkColor] = useState(COLOR_OPTIONS[0].value);
  const [showLinkEmojiPicker, setShowLinkEmojiPicker] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);

  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const [isShiftEmployeeDropdownOpen, setIsShiftEmployeeDropdownOpen] = useState(false);

  const [newKnowledgeTitle, setNewKnowledgeTitle] = useState('');
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('');
  const [newSafetyTitle, setNewSafetyTitle] = useState('');
  const [newSafetyContent, setNewSafetyContent] = useState('');

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; confirmBtnText?: string; confirmBtnColor?: string; onConfirm: () => void; }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [promptModal, setPromptModal] = useState<{ isOpen: boolean; title: string; onConfirm: (value: string) => void; }>({ isOpen: false, title: '', onConfirm: () => {} });
  const [promptInputValue, setPromptInputValue] = useState('');

  useEffect(() => { if (location.state?.activeTab) setActiveTab(location.state.activeTab); }, [location.state]);

  useEffect(() => {
    if (activeTab === 'shifts' && shiftRequests.length > 0 && location.state?.scrollToId) {
      setTimeout(() => {
        const el = document.getElementById(`req_${location.state.scrollToId}`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-4', 'ring-red-400', 'transition-all', 'duration-500'); setTimeout(() => el.classList.remove('ring-4', 'ring-red-400'), 2500); }
      }, 500);
    }
  }, [activeTab, shiftRequests, location.state]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) { const data = await response.json(); setUserRole(data.role); if (data.role === 'CHEF') setActiveTab('menu'); }
      } catch (error) { }
    };
    fetchUserRole();
  }, []);

  // ЗАГРУЗКА НАСТРОЕК ОДИН РАЗ ПРИ СТАРТЕ (ИСПРАВЛЕНИЕ БАГА С ПУСТЫМИ ПОЛЯМИ)
  useEffect(() => {
    fetchHomeContent();
  }, []);

  useEffect(() => {
    if (activeTab === 'shifts' || activeTab === 'main') fetchEmployeesAndShifts(); 
    if (activeTab === 'menu') fetchFeedbacks();
  }, [activeTab]);

  const fetchHomeContent = async () => {
    try {
      const response = await fetch('/api/pages/home');
      const data = await response.json();
      if (data && data.content) {
        try {
          let parsed = typeof data.content === 'string' && data.content.trim().startsWith('{') ? JSON.parse(data.content) : data.content;
          let presets = parsed.menuPresets;
          if (!presets || presets.length === 0) {
            presets = [{ id: 'default', name: 'Основное меню', menu: parsed.restaurantMenu?.length === 7 ? parsed.restaurantMenu : DEFAULT_MENU }];
          }
          setHomeData({
            title: parsed.title || '', subtitle: parsed.subtitle || '', welcomeText: parsed.welcomeText || '',
            memos: Array.isArray(parsed.memos) ? parsed.memos : [], links: Array.isArray(parsed.links) ? parsed.links : [],
            management: Array.isArray(parsed.management) ? parsed.management : [],
            menuPresets: presets, activeMenuId: parsed.activeMenuId || presets[0].id,
            knowledgeBase: Array.isArray(parsed.knowledgeBase) ? parsed.knowledgeBase : [], safetyRules: Array.isArray(parsed.safetyRules) ? parsed.safetyRules : []
          });
        } catch (e) { }
      }
    } catch (err) { } finally {
      setIsHomeLoaded(true); 
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/pages/feedback');
      const data = await res.json();
      if (data && data.content) setFeedbacks(JSON.parse(data.content));
      else setFeedbacks([]);
    } catch(e) { }
  };

  const handleRemoveFeedback = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Удаление пожелания',
      message: 'Точно удалить этот отзыв от сотрудника? Он исчезнет навсегда.',
      confirmBtnText: 'Удалить',
      confirmBtnColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/30',
      onConfirm: async () => {
        const updated = feedbacks.filter(f => f.id !== id);
        setFeedbacks(updated);
        try {
          const token = localStorage.getItem('token');
          await fetch('/api/pages/feedback', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
            body: JSON.stringify({ content: JSON.stringify(updated) }) 
          });
          toast.success('Отзыв удален');
        } catch (e) {}
      }
    });
  };

  const fetchEmployeesAndShifts = async () => {
    setIsLoadingShifts(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [empRes, shiftsRes, tasksRes] = await Promise.all([ fetch('/api/shifts/employees', { headers }), fetch('/api/shifts/all', { headers }), fetch('/api/tasks/all', { headers }).catch(() => null) ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (shiftsRes.ok) setAllShifts(await shiftsRes.json());
      if (tasksRes && tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (Array.isArray(tasksData)) setShiftRequests(tasksData.filter(t => (t.status === 'NEW' || t.status === 'IN_PROGRESS') && (t.title.includes('БОЛЬНИЧНЫЙ') || t.title.includes('ПОИСК ЗАМЕНЫ'))));
      }
    } catch (err) { } finally { setIsLoadingShifts(false); }
  };

  const handleSaveHome = async () => {
    setIsSavingHome(true);
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.stringify({ content: JSON.stringify(homeData) });
      const response = await fetch('/api/pages/home', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: payload });
      if (response.ok) toast.success('Изменения успешно сохранены! ✨'); else toast.error('Ошибка сохранения изменений');
    } catch (err) { toast.error('Ошибка соединения'); } finally { setIsSavingHome(false); }
  };

  const handleAddMemo = () => { if (!newMemoTitle.trim() || !newMemoContent.trim()) return toast.error('Заполните все!'); const newMemo: Memo = { id: Date.now().toString(), title: newMemoTitle, content: newMemoContent }; setHomeData(prev => ({ ...prev, memos: [...(prev.memos || []), newMemo] })); setNewMemoTitle(''); setNewMemoContent(''); };
  const handleRemoveMemo = (id: string) => setHomeData(prev => ({ ...prev, memos: prev.memos.filter(m => m.id !== id) }));
  const handleAddLink = () => { if (!newLinkTitle.trim() || !newLinkUrl.trim()) return toast.error('Заполните все!'); const newLink: UsefulLink = { id: Date.now().toString(), title: newLinkTitle, url: newLinkUrl, icon: newLinkIcon, colorClass: newLinkColor }; setHomeData(prev => ({ ...prev, links: [...(prev.links || []), newLink] })); setNewLinkTitle(''); setNewLinkUrl(''); };
  const handleRemoveLink = (id: string) => setHomeData(prev => ({ ...prev, links: prev.links.filter(l => l.id !== id) }));
  
  const handleAddManager = (emp: Employee) => { if (homeData.management?.some(m => m.userId === emp.id)) return toast.error('Уже есть!'); setHomeData(prev => ({ ...prev, management: [...(prev.management || []), { id: Date.now().toString(), userId: emp.id, fullName: emp.fullName, position: emp.position || getRoleNameInRussian(emp.role), avatarUrl: emp.avatarUrl }] })); setIsManagerDropdownOpen(false); };
  const handleRemoveManager = (id: string) => setHomeData(prev => ({ ...prev, management: (prev.management || []).filter(m => m.id !== id) }));

  const handleCreateMenuPreset = () => {
    const defaultName = `Меню ${(homeData.menuPresets?.length || 0) + 1}`;
    setPromptInputValue(defaultName);
    setPromptModal({
      isOpen: true,
      title: 'Введите название нового меню:',
      onConfirm: (name) => {
        if (!name.trim()) return;
        const newPreset: MenuPreset = { id: Date.now().toString(), name, menu: JSON.parse(JSON.stringify(DEFAULT_MENU)) };
        setHomeData(prev => ({ ...prev, menuPresets: [...(prev.menuPresets || []), newPreset], activeMenuId: newPreset.id }));
      }
    });
  };

  const handleDeleteMenuPreset = () => {
    if ((homeData.menuPresets?.length || 0) <= 1) return toast.error('Нельзя удалить последнее меню!');
    setConfirmModal({
      isOpen: true,
      title: 'Удаление меню',
      message: 'Вы уверены, что хотите удалить этот шаблон меню? Это действие нельзя отменить.',
      confirmBtnText: 'Да, удалить',
      confirmBtnColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/30',
      onConfirm: () => {
        setHomeData(prev => {
          const updated = prev.menuPresets!.filter(p => p.id !== prev.activeMenuId);
          return { ...prev, menuPresets: updated, activeMenuId: updated[0].id };
        });
        toast.success('Меню удалено');
      }
    });
  };

  const handleRenameMenuPreset = () => {
    const currentName = homeData.menuPresets?.find(p => p.id === homeData.activeMenuId)?.name || '';
    setPromptInputValue(currentName);
    setPromptModal({
      isOpen: true,
      title: 'Новое название меню:',
      onConfirm: (name) => {
        if (!name.trim()) return;
        setHomeData(prev => ({
          ...prev, menuPresets: prev.menuPresets?.map(p => p.id === prev.activeMenuId ? { ...p, name } : p)
        }));
      }
    });
  };

  const handleMenuChange = (dayIndex: number, field: 'breakfast' | 'lunch' | 'dinner', value: string) => {
    setHomeData(prev => {
      const presets = [...(prev.menuPresets || [])];
      const pIndex = presets.findIndex(p => p.id === prev.activeMenuId);
      if (pIndex === -1) return prev;
      const newMenu = [...presets[pIndex].menu];
      newMenu[dayIndex] = { ...newMenu[dayIndex], [field]: value };
      presets[pIndex] = { ...presets[pIndex], menu: newMenu };
      return { ...prev, menuPresets: presets };
    });
  };

  const handleAddKnowledge = () => { if (!newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) return toast.error('Заполните все!'); setHomeData(prev => ({ ...prev, knowledgeBase: [...(prev.knowledgeBase || []), { id: Date.now().toString(), title: newKnowledgeTitle, content: newKnowledgeContent }] })); setNewKnowledgeTitle(''); setNewKnowledgeContent(''); };
  const handleRemoveKnowledge = (id: string) => setHomeData(prev => ({ ...prev, knowledgeBase: (prev.knowledgeBase || []).filter(i => i.id !== id) }));
  const handleAddSafety = () => { if (!newSafetyTitle.trim() || !newSafetyContent.trim()) return toast.error('Заполните все!'); setHomeData(prev => ({ ...prev, safetyRules: [...(prev.safetyRules || []), { id: Date.now().toString(), title: newSafetyTitle, content: newSafetyContent }] })); setNewSafetyTitle(''); setNewSafetyContent(''); };
  const handleRemoveSafety = (id: string) => setHomeData(prev => ({ ...prev, safetyRules: (prev.safetyRules || []).filter(r => r.id !== id) }));

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault(); if (!shiftEmployeeId) return toast.error('Выберите сотрудника!');
    try {
      const response = await fetch('/api/shifts/assign', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ employeeId: shiftEmployeeId, department: shiftDepartment, date: new Date(shiftDate).toISOString(), startTime: shiftStartTime, endTime: shiftEndTime }) });
      if (response.ok) { toast.success('Смена назначена!'); setShiftDate(''); setShiftEmployeeId(''); fetchEmployeesAndShifts(); } else toast.error('Ошибка назначения');
    } catch (err) { toast.error('Ошибка'); }
  };

  const requestDeleteShift = (id: string) => { setConfirmModal({ isOpen: true, title: 'Удаление смены', message: 'Вы уверены, что хотите удалить эту смену?', confirmBtnText: 'Удалить смену', confirmBtnColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/30', onConfirm: () => executeDeleteShift(id) }); };
  const executeDeleteShift = async (id: string) => {
    try { const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (res.ok) { toast.success('Удалена'); fetchEmployeesAndShifts(); } else toast.error('Ошибка'); } catch (err) {}
  };

  const requestResolveRequest = (req: Task) => { setConfirmModal({ isOpen: true, title: 'Подтверждение заявки', message: 'Одобрить этот запрос? Смена перейдет на Биржу.', confirmBtnText: 'Подтвердить', confirmBtnColor: 'bg-green-500 hover:bg-green-600 shadow-green-500/30', onConfirm: () => executeResolveRequest(req) }); };
  const executeResolveRequest = async (req: Task) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${req.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: 'RESOLVED' }) });
      if (res.ok) {
        if ((req.title.includes('БОЛЬНИЧНЫЙ') || req.title.includes('ПОИСК ЗАМЕНЫ')) && req.author) {
          const dateMatch = req.title.match(/(\d{2}\.\d{2}\.\d{4})/);
          if (dateMatch) {
            const targetShift = allShifts.find(s => s.employee.fullName === req.author?.fullName && ('0' + new Date(s.date).getDate()).slice(-2) + '.' + ('0' + (new Date(s.date).getMonth() + 1)).slice(-2) + '.' + new Date(s.date).getFullYear() === dateMatch[1]);
            if (targetShift) await fetch(`/api/shifts/${targetShift.id}/swap-request`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
          }
        }
        setShiftRequests(prev => prev.filter(r => r.id !== req.id)); toast.success('Запрос одобрен! 🔄'); fetchEmployeesAndShifts(); 
      }
    } catch (e) { toast.error('Ошибка'); }
  };

  const moveDateView = (days: number) => { setBaseDate(prev => { const next = new Date(prev); next.setDate(prev.getDate() + days); return next; }); };
  const moveMonthView = (months: number) => { setBaseDate(prev => { const next = new Date(prev); next.setMonth(prev.getMonth() + months); return next; }); };
  const resetDateToToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setBaseDate(d); };
  const weekDates = Array.from({ length: 7 }).map((_, i) => { const d = new Date(baseDate); d.setDate(baseDate.getDate() + i); return d; });

  const activeMenuPreset = homeData.menuPresets?.find(p => p.id === homeData.activeMenuId) || homeData.menuPresets?.[0];
  const currentMenuDays = activeMenuPreset?.menu || DEFAULT_MENU;

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <h1 className="text-3xl font-bold text-primary-900 mb-6">Рабочее пространство</h1>

      <div className="flex w-full bg-gray-100 p-1.5 rounded-full overflow-x-auto custom-scrollbar mb-6 shadow-inner border border-gray-200/60">
        {userRole !== 'CHEF' && (
          <>
            <button onClick={() => setActiveTab('main')} className={`flex-1 min-w-fit py-2.5 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap text-center outline-none ${activeTab === 'main' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}>Главная страница</button>
            <button onClick={() => setActiveTab('shifts')} className={`flex-1 min-w-fit py-2.5 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap text-center outline-none ${activeTab === 'shifts' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}>Расписание смен</button>
          </>
        )}
        <button onClick={() => setActiveTab('menu')} className={`flex-1 min-w-fit py-2.5 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap text-center outline-none ${activeTab === 'menu' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}>Меню ресторана</button>
        {userRole !== 'CHEF' && (
          <>
            <button onClick={() => setActiveTab('knowledge')} className={`flex-1 min-w-fit py-2.5 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap text-center outline-none ${activeTab === 'knowledge' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}>База знаний</button>
            <button onClick={() => setActiveTab('safety')} className={`flex-1 min-w-fit py-2.5 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap text-center outline-none ${activeTab === 'safety' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}>Инструкции ТБ</button>
          </>
        )}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">

        {activeTab === 'shifts' && userRole !== 'CHEF' && (
          <div className="space-y-12">
            <div className="max-w-3xl bg-gray-50/50 p-6 rounded-xl border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Назначить смену</h2>
              <form onSubmit={handleAssignShift} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative md:col-span-2">
                  <button type="button" onClick={() => setIsShiftEmployeeDropdownOpen(!isShiftEmployeeDropdownOpen)} className="w-full bg-white border border-gray-200 hover:bg-gray-50 py-2.5 rounded-lg font-medium flex justify-between items-center px-4 transition-colors outline-none focus:ring-2 focus:ring-primary-500">
                    <span className={shiftEmployeeId ? "text-gray-900" : "text-gray-500"}>{shiftEmployeeId ? employees.find(e => e.id === shiftEmployeeId)?.fullName : '-- Выберите сотрудника --'}</span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isShiftEmployeeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {isShiftEmployeeDropdownOpen && (
                    <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                      {employees.map(emp => (
                        <div key={emp.id} onClick={() => { setShiftEmployeeId(emp.id); setIsShiftEmployeeDropdownOpen(false); }} className="p-3 hover:bg-primary-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0">
                          {emp.avatarUrl ? <img src={`/api${emp.avatarUrl}`} className="w-10 h-10 rounded-full object-cover" alt="" /> : <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(emp.fullName)}`}>{emp.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>}
                          <div><p className="font-bold text-gray-800 text-sm truncate">{emp.fullName}</p><p className="text-xs text-gray-500 truncate">{emp.position || getRoleNameInRussian(emp.role)}</p></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div><input required value={shiftDepartment} onChange={(e) => setShiftDepartment(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="Отдел" /></div>
                <div><input type="date" required value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div><input type="time" required value={shiftStartTime} onChange={(e) => setShiftStartTime(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div><input type="time" required value={shiftEndTime} onChange={(e) => setShiftEndTime(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div className="md:col-span-2 pt-2"><button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">Назначить смену</button></div>
              </form>
            </div>

            {shiftRequests.length > 0 && (
              <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
                <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2"><span className="animate-pulse">🚨</span> Запросы сотрудников по сменам</h2>
                <div className="space-y-4">
                  {shiftRequests.map(req => (
                    <div key={req.id} id={`req_${req.id}`} className="bg-white p-5 rounded-xl border border-red-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 scroll-mt-24">
                      <div className="flex gap-4 items-start min-w-0 flex-1">
                        {req.author?.avatarUrl ? <img src={`/api${req.author.avatarUrl}`} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" /> : <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${getAvatarColor(req.author?.fullName || 'Аноним')}`}>{req.author?.fullName ? req.author.fullName.charAt(0).toUpperCase() : '👤'}</div>}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-1 flex-wrap"><span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0">Важно</span><span className="font-bold text-gray-900 break-words">{req.title}</span></div>
                          <p className="text-sm text-gray-600 mb-2 break-words whitespace-pre-wrap">{req.content}</p>
                          <p className="text-xs text-gray-400 font-medium break-words">Сотрудник: {req.author?.fullName}</p>
                        </div>
                      </div>
                      <button onClick={() => requestResolveRequest(req)} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-6 rounded-lg text-sm transition-colors whitespace-nowrap flex-shrink-0">Подтвердить и на Биржу</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800">График работы сотрудников</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {shiftViewMode === 'table' && (
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                      <button onClick={() => moveMonthView(-1)} className="px-3 py-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-bold text-sm" title="На месяц назад">« Мес</button>
                      <button onClick={() => moveDateView(-7)} className="px-3 py-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-bold text-sm" title="На неделю назад">‹ Нед</button>
                      <button onClick={resetDateToToday} className="px-4 py-1.5 text-sm font-extrabold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">Сегодня</button>
                      <button onClick={() => moveDateView(7)} className="px-3 py-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-bold text-sm" title="На неделю вперед">Нед ›</button>
                      <button onClick={() => moveMonthView(1)} className="px-3 py-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-bold text-sm" title="На месяц вперед">Мес »</button>
                    </div>
                  )}
                  <div className="bg-gray-100 p-1 rounded-lg flex gap-1 self-start sm:self-auto">
                    <button onClick={() => setShiftViewMode('table')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all outline-none ${shiftViewMode === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>Таблица</button>
                    <button onClick={() => setShiftViewMode('cards')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all outline-none ${shiftViewMode === 'cards' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>Карточки</button>
                  </div>
                </div>
              </div>

              {isLoadingShifts ? <p className="text-gray-500">Загрузка...</p> : allShifts.length === 0 ? <p className="text-gray-500 bg-gray-50 p-6 rounded-xl text-center">Смен пока не назначено.</p> : shiftViewMode === 'table' ? (
                <div className="overflow-x-auto border border-gray-200 rounded-2xl custom-scrollbar animate-fade-in">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-4 border-b border-gray-200 font-bold text-gray-700 sticky left-0 bg-gray-50 z-10 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Сотрудник</th>
                        {weekDates.map(d => ( <th key={d.toISOString()} className="p-4 border-b border-gray-200 font-bold text-gray-600 text-center min-w-[120px] uppercase text-xs tracking-wider"><span className="block text-gray-400 font-medium mb-1">{d.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>{d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</th> ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => (
                        <tr key={emp.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center gap-3">
                              {emp.avatarUrl ? <img src={`/api${emp.avatarUrl}`} className="w-8 h-8 rounded-full object-cover" alt="" /> : <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(emp.fullName)}`}>{emp.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>}
                              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-gray-800 truncate">{emp.fullName}</p><p className="text-[10px] text-gray-500 truncate">{emp.position || getRoleNameInRussian(emp.role)}</p></div>
                            </div>
                          </td>
                          {weekDates.map(d => {
                            const shift = allShifts.find(s => s.employee.fullName === emp.fullName && new Date(s.date).toDateString() === d.toDateString());
                            return (
                              <td key={d.toISOString()} className="p-2 text-center border-l border-gray-100 relative group h-full">
                                {shift ? (
                                  <div className={`rounded-lg p-2 text-xs font-bold border flex flex-col h-full justify-center relative ${shift.isLookingForSwap ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-primary-50 text-primary-700 border-primary-100'}`}>
                                    <span>{shift.startTime} - {shift.endTime}</span><span className="text-[9px] font-medium opacity-70 truncate mt-0.5">{shift.department}</span>
                                    <button onClick={() => requestDeleteShift(shift.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-sm" title="Удалить"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                  </div>
                                ) : <span className="text-gray-200">-</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {allShifts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(shift => {
                    const dateObj = new Date(shift.date); const isPast = dateObj < new Date(new Date().setHours(0,0,0,0));
                    return (
                      <div key={shift.id} className={`border p-6 rounded-[1.5rem] shadow-sm relative group transition-all ${isPast ? 'bg-gray-50 opacity-75' : shift.isLookingForSwap ? 'bg-orange-50 border-orange-200 hover:shadow-md' : 'bg-white hover:shadow-md hover:border-primary-200'}`}>
                        <div className="flex justify-between items-start mb-4"><div className={`font-bold px-3 py-1.5 rounded-lg text-sm ${isPast ? 'bg-gray-200 text-gray-600' : shift.isLookingForSwap ? 'bg-orange-500 text-white' : 'bg-primary-50 text-primary-700'}`}>{dateObj.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}</div><div className="text-gray-500 font-bold bg-gray-100 px-3 py-1.5 rounded-lg text-sm flex-shrink-0">{shift.startTime} - {shift.endTime}</div></div>
                        <div className="flex items-center gap-3 mb-4 min-w-0">
                          {shift.employee.avatarUrl ? <img src={`/api${shift.employee.avatarUrl}`} className="w-12 h-12 rounded-full object-cover flex-shrink-0" alt="" /> : <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${getAvatarColor(shift.employee.fullName)}`}>{shift.employee.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>}
                          <div className="min-w-0 flex-1"><h3 className="font-extrabold text-lg text-gray-900 truncate">{shift.employee.fullName}</h3><p className="text-gray-500 text-xs font-medium truncate">{shift.department} {shift.employee.position ? `• ${shift.employee.position}` : ''}</p></div>
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 border-t border-gray-50 pt-3 flex items-center justify-between min-w-0"><span className="truncate">Назначил: <span className="font-bold text-gray-500">{shift.createdBy.fullName}</span></span>{shift.isLookingForSwap && <span className="text-orange-500 font-bold ml-2">На бирже</span>}</div>
                        <button onClick={() => requestDeleteShift(shift.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg opacity-0 group-hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ГЛАВНАЯ СТРАНИЦА */}
        {activeTab === 'main' && userRole !== 'CHEF' && (
          !isHomeLoaded ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-pulse bg-white rounded-3xl shadow-sm border border-gray-100">
              <span className="text-4xl mb-4">⏳</span>
              <p className="font-bold text-lg">Загрузка настроек портала...</p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-6 mx-auto animate-fade-in">
              <div className="space-y-5">
                <input value={homeData.title || ''} onChange={(e) => setHomeData({...homeData, title: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50/50 text-center font-medium" placeholder="Главный заголовок" />
                <input value={homeData.subtitle || ''} onChange={(e) => setHomeData({...homeData, subtitle: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50/50 text-center font-medium" placeholder="Подзаголовок" />
                <CustomTextarea value={homeData.welcomeText || ''} onChange={(val) => setHomeData({...homeData, welcomeText: val})} placeholder="Текст приветствия (с переносами и маркерами)" />
              </div>

              <div className="pt-8 mt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-center mb-6">Карусель памяток</h3>
                <div className="space-y-3 mb-6">
                  {(homeData.memos || []).map(memo => (
                    <div key={memo.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                      <div className="mr-4 min-w-0 flex-1"><p className="font-bold break-words">{memo.title}</p><p className="text-sm text-gray-500 break-words whitespace-pre-wrap">{memo.content}</p></div>
                      <button onClick={() => handleRemoveMemo(memo.id)} className="text-red-500 text-sm font-medium flex-shrink-0">Удалить</button>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-5 border rounded-xl space-y-4">
                   <input value={newMemoTitle} onChange={e => setNewMemoTitle(e.target.value)} placeholder="Название" className="w-full px-4 py-2 border rounded-lg outline-none text-center" />
                   <CustomTextarea value={newMemoContent} onChange={setNewMemoContent} placeholder="Текст памятки..." />
                   <button onClick={handleAddMemo} type="button" className="w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-medium">+ Добавить карточку</button>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-center mb-6">Полезные ссылки</h3>
                <div className="space-y-3 mb-6">
                  {(homeData.links || []).map(link => (
                    <div key={link.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                      <div className="flex items-center gap-4 min-w-0 flex-1"><div className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-xl ${link.colorClass}`}>{link.icon}</div><div className="min-w-0 flex-1"><p className="font-bold break-words truncate">{link.title}</p><p className="text-xs text-primary-500 break-words truncate">{link.url}</p></div></div>
                      <button onClick={() => handleRemoveLink(link.id)} className="text-red-500 text-sm font-medium flex-shrink-0 ml-4">Удалить</button>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-5 border rounded-xl space-y-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <input value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)} placeholder="Название" className="w-full px-4 py-2 border rounded-lg outline-none" />
                     <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="URL (Ссылка)" className="w-full px-4 py-2 border rounded-lg outline-none" />
                     
                     <div className="relative">
                        <button type="button" onClick={() => setShowLinkEmojiPicker(!showLinkEmojiPicker)} className="w-full px-4 py-2 border rounded-lg outline-none text-center bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-xl">
                          {newLinkIcon || '📁'} <span className="text-xs text-gray-400 font-medium">(Выбрать иконку)</span>
                        </button>
                        {showLinkEmojiPicker && (
                          <><div className="fixed inset-0 z-10" onClick={() => setShowLinkEmojiPicker(false)}></div>
                          <div className="absolute bottom-full left-0 mb-2 z-50 shadow-2xl rounded-xl overflow-hidden"><EmojiPicker onEmojiClick={(ed) => { setNewLinkIcon(ed.emoji); setShowLinkEmojiPicker(false); }} theme={Theme.LIGHT} searchPlaceHolder="Поиск иконки..." width={300} height={400} /></div></>
                        )}
                      </div>
                     <div className="relative">
                        <button 
                          type="button" 
                          onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)} 
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none bg-white text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                          <span className={`px-3 py-0.5 rounded-md text-sm font-bold ${newLinkColor}`}>
                            {COLOR_OPTIONS.find(o => o.value === newLinkColor)?.label}
                          </span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isColorDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        
                        {isColorDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsColorDropdownOpen(false)}></div>
                            <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-100 rounded-xl shadow-2xl z-20 overflow-hidden py-2 space-y-1 px-2">
                              {COLOR_OPTIONS.map(opt => (
                                <div 
                                  key={opt.value} 
                                  onClick={() => { setNewLinkColor(opt.value); setIsColorDropdownOpen(false); }} 
                                  className={`px-3 py-2 cursor-pointer rounded-lg transition-colors text-sm font-bold text-center ${opt.value} hover:brightness-95`}
                                >
                                  {opt.label}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                   </div>
                   <button onClick={handleAddLink} type="button" className="w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-medium">+ Добавить ссылку</button>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-center mb-6">Руководство (Контакты)</h3>
                <div className="space-y-3 mb-6">
                  {(homeData.management || []).map(manager => (
                    <div key={manager.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {manager.avatarUrl ? <img src={`/api${manager.avatarUrl}`} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${getAvatarColor(manager.fullName)}`}>{manager.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>}
                        <div className="min-w-0 flex-1"><p className="font-bold break-words truncate">{manager.fullName}</p><p className="text-xs text-gray-500 break-words truncate">{manager.position || 'Сотрудник'}</p></div>
                      </div>
                      <button onClick={() => handleRemoveManager(manager.id)} className="text-red-500 text-sm font-medium hover:underline flex-shrink-0 ml-4">Удалить</button>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setIsManagerDropdownOpen(!isManagerDropdownOpen)} className="w-full bg-white border border-gray-200 hover:bg-gray-50 py-3 rounded-xl font-medium flex justify-between items-center px-5 transition-colors outline-none focus:ring-2 focus:ring-primary-500">
                    <span className="text-gray-700">+ Выбрать сотрудника из базы</span><svg className={`w-5 h-5 text-gray-400 transition-transform ${isManagerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {isManagerDropdownOpen && (
                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                      {employees.map(emp => (
                        <div key={emp.id} onClick={() => handleAddManager(emp)} className="p-3 hover:bg-primary-50 cursor-pointer flex items-center gap-3 border-b border-gray-50">
                          {emp.avatarUrl ? <img src={`/api${emp.avatarUrl}`} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" /> : <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(emp.fullName)}`}>{emp.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>}
                          <div className="min-w-0 flex-1"><p className="font-bold text-gray-800 text-sm truncate">{emp.fullName}</p><p className="text-xs text-gray-500 truncate">{emp.position || getRoleNameInRussian(emp.role)}</p></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 flex justify-center"><button onClick={handleSaveHome} disabled={isSavingHome} className="bg-primary-500 text-white font-bold py-3 px-10 rounded-xl shadow-lg">{isSavingHome ? 'Сохранение...' : 'Сохранить изменения'}</button></div>
            </div>
          )
        )}

        {/* МЕНЮ РЕСТОРАНА И ОТЗЫВЫ */}
        {activeTab === 'menu' && (
          <div className="max-w-4xl space-y-12 mx-auto">
            <div>
              <div className="border-b border-gray-100 pb-6 text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Управление меню</h2>
                <p className="text-gray-500 mb-6">Создавайте шаблоны (кластеры) меню, чтобы быстро переключаться между ними каждую неделю.</p>
                
                {/* ИСПРАВЛЕНИЕ: Выбор и управление шаблонами меню */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
                  <select 
                    value={homeData.activeMenuId} 
                    onChange={(e) => setHomeData({...homeData, activeMenuId: e.target.value})}
                    className="w-full sm:w-auto flex-1 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-gray-800 shadow-sm"
                  >
                    {(homeData.menuPresets || []).map(preset => (
                      <option key={preset.id} value={preset.id}>📋 {preset.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleCreateMenuPreset} className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 px-4 py-3 rounded-xl font-bold transition-colors" title="Создать новое меню">+ Создать</button>
                    <button onClick={handleRenameMenuPreset} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-3 rounded-xl transition-colors" title="Переименовать">✏️</button>
                    <button onClick={handleDeleteMenuPreset} className="bg-red-50 text-red-600 hover:bg-red-100 p-3 rounded-xl transition-colors" title="Удалить текущее меню">❌</button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentMenuDays.map((menuDay, idx) => (
                  <div key={idx} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm min-w-0">
                    <h3 className="font-extrabold text-primary-700 uppercase tracking-widest text-sm mb-4">{menuDay.day}</h3>
                    <div className="space-y-4">
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">🥐 Завтрак</label><input value={menuDay.breakfast} onChange={(e) => handleMenuChange(idx, 'breakfast', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm" /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">🥣 Обед</label><input value={menuDay.lunch} onChange={(e) => handleMenuChange(idx, 'lunch', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm" /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">🥗 Ужин</label><input value={menuDay.dinner} onChange={(e) => handleMenuChange(idx, 'dinner', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm" /></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex justify-center"><button onClick={handleSaveHome} disabled={isSavingHome} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-12 rounded-xl shadow-lg transition-colors">{isSavingHome ? 'Сохранение...' : 'Сохранить меню (и выбор)'}</button></div>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Пожелания от сотрудников 👨‍🍳</h2>
              <div className="space-y-4">
                {feedbacks.length === 0 ? <p className="text-center text-gray-400">Пока пожеланий нет.</p> : feedbacks.map(fb => (
                  <div key={fb.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-800 font-medium leading-relaxed mb-2 break-words whitespace-pre-wrap">{fb.text}</p>
                      <p className="text-xs text-gray-500 break-words">От: <span className="font-bold">{fb.author}</span> • {fb.date}</p>
                    </div>
                    {/* ИСПРАВЛЕНИЕ: Добавлены кнопки "Прочитано" и "Удалить" */}
                    <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                      <button onClick={() => handleRemoveFeedback(fb.id)} className="flex-1 sm:flex-none bg-white border border-gray-200 hover:border-green-500 text-gray-500 hover:text-green-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors">Прочитано ✓</button>
                      <button onClick={() => handleRemoveFeedback(fb.id)} className="flex-1 sm:flex-none bg-white border border-gray-200 hover:border-red-500 text-gray-500 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors">Удалить 🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* БАЗА ЗНАНИЙ */}
        {activeTab === 'knowledge' && userRole !== 'CHEF' && (
          <div className="max-w-3xl space-y-6 mx-auto">
            <div className="border-b border-gray-100 pb-4 mb-6 text-center"><h2 className="text-xl font-bold text-gray-800">Редактирование Базы знаний</h2><p className="text-sm text-gray-500 mt-1">Добавляйте регламенты, правила и ответы на вопросы.</p></div>
            <div className="space-y-3 mb-6">
              {(homeData.knowledgeBase || []).length === 0 ? <p className="text-center text-gray-400 text-sm">В базе знаний пока пусто.</p> : (homeData.knowledgeBase || []).map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100"><div className="min-w-0 flex-1 mr-4"><p className="font-bold text-gray-800 break-words">{item.title}</p><div className="text-sm text-gray-500 break-words min-w-0 custom-html-content" dangerouslySetInnerHTML={{ __html: item.content }} /></div><button onClick={() => handleRemoveKnowledge(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium flex-shrink-0">Удалить</button></div>
              ))}
            </div>
            <div className="bg-white p-5 border border-gray-200 rounded-xl space-y-4 shadow-sm">
               <h4 className="font-medium text-gray-700">Добавить новую запись</h4>
               <input value={newKnowledgeTitle} onChange={e => setNewKnowledgeTitle(e.target.value)} placeholder="Заголовок (например: Как оформить отпуск?)" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
               <CustomTextarea value={newKnowledgeContent} onChange={setNewKnowledgeContent} placeholder="Полный текст регламента или ответа..." focusRingClass="focus-within:ring-orange-500" />
               <button onClick={handleAddKnowledge} type="button" className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold py-2 rounded-lg transition-colors">+ Добавить в базу</button>
            </div>
            <div className="pt-6 flex justify-center"><button onClick={handleSaveHome} disabled={isSavingHome} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-12 rounded-xl shadow-lg transition-colors">{isSavingHome ? 'Сохранение...' : 'Сохранить изменения'}</button></div>
          </div>
        )}

        {/* ИНСТРУКЦИИ ТБ */}
        {activeTab === 'safety' && userRole !== 'CHEF' && (
          <div className="max-w-3xl space-y-6 mx-auto">
            <div className="border-b border-gray-100 pb-4 mb-6 text-center"><h2 className="text-xl font-bold text-gray-800">Инструкции по Технике Безопасности</h2><p className="text-sm text-gray-500 mt-1">Они будут выводиться единым списком на странице ТБ.</p></div>
            <div className="space-y-3 mb-6">
              {(homeData.safetyRules || []).length === 0 ? <p className="text-center text-gray-400 text-sm">Правил пока нет.</p> : (homeData.safetyRules || []).map((rule, idx) => (
                <div key={rule.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-xl border border-gray-100"><div className="flex items-start gap-3 min-w-0 flex-1 mr-4"><span className="font-bold text-blue-500 mt-0.5 flex-shrink-0">{idx + 1}.</span><div className="min-w-0 flex-1"><p className="font-bold text-gray-800 break-words">{rule.title}</p><div className="text-sm text-gray-500 break-words mt-1 min-w-0 custom-html-content" dangerouslySetInnerHTML={{ __html: rule.content }} /></div></div><button onClick={() => handleRemoveSafety(rule.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium flex-shrink-0 mt-0.5">Удалить</button></div>
              ))}
            </div>
            <div className="bg-white p-5 border border-gray-200 rounded-xl space-y-4 shadow-sm">
               <h4 className="font-medium text-gray-700">Добавить новое правило</h4>
               <input value={newSafetyTitle} onChange={e => setNewSafetyTitle(e.target.value)} placeholder="Заголовок (например: Пожарная безопасность)" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
               <CustomTextarea value={newSafetyContent} onChange={setNewSafetyContent} placeholder="Подробное описание правила..." focusRingClass="focus-within:ring-blue-500" />
               <button onClick={handleAddSafety} type="button" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2 rounded-lg transition-colors">+ Добавить правило</button>
            </div>
            <div className="pt-6 flex justify-center"><button onClick={handleSaveHome} disabled={isSavingHome} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-12 rounded-xl shadow-lg transition-colors">{isSavingHome ? 'Сохранение...' : 'Сохранить изменения'}</button></div>
          </div>
        )}

      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-fade-in"><div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">⚠️</div><h3 className="text-2xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3><p className="text-gray-600 mb-8 leading-relaxed">{confirmModal.message}</p><div className="flex gap-3"><button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">Отмена</button><button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} className={`flex-1 px-6 py-3 text-white font-bold rounded-xl transition-colors shadow-lg ${confirmModal.confirmBtnColor || 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/30'}`}>{confirmModal.confirmBtnText || 'Да, уверен'}</button></div></div>
        </div>
      )}

      {/* КАСТОМНАЯ МОДАЛКА ВВОДА (ДЛЯ НАЗВАНИЙ МЕНЮ) */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{promptModal.title}</h3>
            <input 
              type="text" 
              value={promptInputValue} 
              onChange={(e) => setPromptInputValue(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 mb-6 text-gray-800 font-medium shadow-sm"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setPromptModal({ ...promptModal, isOpen: false })}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={() => {
                  promptModal.onConfirm(promptInputValue);
                  setPromptModal({ ...promptModal, isOpen: false });
                }}
                className="flex-1 px-6 py-3 text-white font-bold rounded-xl transition-colors shadow-lg bg-primary-500 hover:bg-primary-600 shadow-primary-500/30"
              >
                Продолжить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}