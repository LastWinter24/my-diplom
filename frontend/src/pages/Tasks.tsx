// frontend/src/pages/Tasks.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface Task { id: string; type: string; title: string; content: string; priority: string; status: string; createdAt: string; author?: { fullName: string; avatarUrl: string | null; } | null; }

// УМНЫЙ РЕДАКТОР С МАРКЕРАМИ И БИБЛИОТЕКОЙ ЭМОДЗИ
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
      <ReactQuill ref={quillRef} theme="snow" value={value} onChange={onChange} modules={quillModules} placeholder={placeholder} className="w-full flex-1" />
    </div>
  );
};

export default function Tasks() {
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null); 
  
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('PROBLEM');
  const [priority, setPriority] = useState('MEDIUM');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; message: string; onConfirm: () => void; }>({ isOpen: false, message: '', onConfirm: () => {} });

  useEffect(() => {
    if (tasks.length > 0 && location.state?.scrollToId) {
      setTimeout(() => {
        const el = document.getElementById(`task_${location.state.scrollToId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-primary-400', 'transition-all', 'duration-500');
          setTimeout(() => el.classList.remove('ring-4', 'ring-primary-400'), 2500);
        }
      }, 500);
    }
  }, [tasks, location.state]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const profileRes = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setCurrentUser(profileData.fullName);
      }
      const response = await fetch('/api/tasks/all', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      const sorted = data.sort((a: Task, b: Task) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTasks(sorted);
    } catch (err) { console.error('Ошибка загрузки задач:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title, content, type, priority })
      });
      if (response.ok) { setTitle(''); setContent(''); fetchData(); setIsFormOpen(false); }
    } catch (err) { console.error('Ошибка при создании:', err); }
  };

 const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      message: 'Точно хотите удалить эту заявку? Это действие нельзя отменить.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) setTasks(tasks.filter(t => t.id !== id)); else alert('Не удалось удалить заявку.');
        } catch (e) { alert('Ошибка при удалении.'); }
      }
    });
  };

  const startEdit = (task: Task) => { setEditingId(task.id); setEditTitle(task.title); setEditContent(task.content); };
  const cancelEdit = () => { setEditingId(null); setEditTitle(''); setEditContent(''); };

  const handleSaveEdit = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: editTitle, content: editContent })
      });
      if (res.ok) {
        setTasks(tasks.map(t => t.id === id ? { ...t, title: editTitle, content: editContent } : t));
        setEditingId(null);
      } else { alert('Не удалось сохранить изменения.'); }
    } catch (e) { alert('Ошибка при сохранении.'); }
  };

  const getStatusColor = (status: string) => {
    switch(status) { case 'NEW': return 'bg-blue-100 text-blue-700'; case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700'; case 'RESOLVED': return 'bg-green-100 text-green-700'; default: return 'bg-gray-100 text-gray-700'; }
  };

  const getTypeIcon = (type: string) => {
    switch(type) { case 'PROBLEM': return '⚠️'; case 'SUGGESTION': return '💡'; case 'GRATITUDE': return '🎉'; default: return '📋'; }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
        <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner flex-shrink-0">📋</div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Лента задач и заявок</h1>
          <p className="text-gray-500 text-lg">Общий раздел отеля. Сообщайте о проблемах, предлагайте идеи и следите за жизнью коллектива.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
        <button onClick={() => setIsFormOpen(!isFormOpen)} className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors outline-none">
          <span className="font-bold text-gray-800 text-lg flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl pb-0.5">+</span> Создать новую заявку</span>
          <svg className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isFormOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>

        <div className={`transition-all duration-300 ease-in-out ${isFormOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-6 pt-0 border-t border-gray-50 mt-2 bg-gray-50/30">
            <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Тип</label><select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"><option value="PROBLEM">Проблема</option><option value="SUGGESTION">Предложение</option><option value="GRATITUDE">Благодарность</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label><select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"><option value="LOW">Низкий</option><option value="MEDIUM">Средний</option><option value="HIGH">Высокий</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Краткий заголовок</label><input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Например: Не работает ТВ в номере 101" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Подробное описание</label><CustomTextarea value={content} onChange={setContent} placeholder="Опишите ситуацию подробнее..." /></div>
              <div className="flex justify-end pt-2"><button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-primary-500/20 transition-colors">Отправить заявку</button></div>
            </form>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 pl-2">Все заявки сотрудников</h2>
        {loading ? ( <p className="text-gray-500 font-medium pl-2">Загрузка...</p> ) : tasks.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-gray-100 text-center"><span className="text-6xl mb-4 block">📭</span><h2 className="text-xl font-bold text-gray-800 mb-2">Лента заявок пока пуста</h2><p className="text-gray-500">Они появятся здесь после отправки формы выше.</p></div>
        ) : (
          <div className="space-y-6">
            {tasks.map((task) => {
              const isMyTask = currentUser === task.author?.fullName;
              const isEditing = editingId === task.id;
              return (
                <div key={task.id} id={`task_${task.id}`} className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group scroll-mt-24">
                  {isMyTask && !isEditing && (
                    <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                      <button onClick={() => startEdit(task)} className="text-gray-400 hover:text-primary-500 transition-colors" title="Редактировать"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                      <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Удалить"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3"><span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${getStatusColor(task.status)}`}>{task.status}</span><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{task.priority}</span></div>
                    <span className="text-xs font-bold text-gray-400">{new Date(task.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4 mb-6">
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-xl font-bold text-gray-900" placeholder="Заголовок" />
                      <CustomTextarea value={editContent} onChange={setEditContent} placeholder="Описание" />
                      <div className="flex gap-3"><button onClick={() => handleSaveEdit(task.id)} className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors">Сохранить</button><button onClick={cancelEdit} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-bold transition-colors">Отмена</button></div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 pr-8 md:pr-16 flex items-start gap-3"><span className="flex-shrink-0 mt-0.5">{getTypeIcon(task.type)}</span><span className="break-words min-w-0 flex-1">{task.title}</span></h3>
                      <div className="text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap break-words custom-html-content" dangerouslySetInnerHTML={{ __html: task.content }} />
                    </>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-50 min-w-0">
                    {task.author ? (
                      <>{task.author.avatarUrl ? <img src={`/api${task.author.avatarUrl}`} alt={task.author.fullName} className="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0" /> : <div className="w-8 h-8 bg-primary-100 rounded-full flex flex-shrink-0 items-center justify-center font-bold text-primary-600 text-sm">{task.author.fullName.charAt(0).toUpperCase()}</div>}
                      <span className="text-sm font-medium text-gray-700 min-w-0 flex-1 break-words">{task.author.fullName}{isMyTask && <span className="ml-2 text-[10px] bg-primary-50 text-primary-500 px-2 py-0.5 rounded-md uppercase tracking-wider font-bold inline-block">Вы</span>}</span></>
                    ) : (
                      <><div className="w-8 h-8 bg-gray-100 rounded-full flex flex-shrink-0 items-center justify-center font-bold text-gray-400 text-sm">?</div><span className="text-sm font-medium text-gray-400 italic">Анонимно</span></>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* КАСТОМНАЯ МОДАЛКА УДАЛЕНИЯ */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-fade-in">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">⚠️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Подтверждение</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">Отмена</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} className="flex-1 px-6 py-3 text-white font-bold rounded-xl transition-colors shadow-lg bg-red-500 hover:bg-red-600 shadow-red-500/30">Да, удалить</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}