// frontend/src/pages/News.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface Author { fullName: string; avatarUrl: string | null; }
interface NewsItem { id: string; title: string; content: string; createdAt: string; author?: Author; }

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

export default function News() {
  const location = useLocation();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); 

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; message: string; onConfirm: () => void; }>({ isOpen: false, message: '', onConfirm: () => {} });

  useEffect(() => {
    if (news.length > 0 && location.state?.scrollToId) {
      setTimeout(() => {
        const el = document.getElementById(`news_${location.state.scrollToId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-primary-400', 'transition-all', 'duration-500');
          setTimeout(() => el.classList.remove('ring-4', 'ring-primary-400'), 2500);
        }
      }, 500);
    }
  }, [news, location.state]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const profileRes = await fetch('http://localhost:3000/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setCurrentUser(profileData.fullName);
        setUserRole(profileData.role); 
      }
      const newsRes = await fetch('http://localhost:3000/news', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!newsRes.ok) throw new Error('Не удалось загрузить новости.');
      const newsData = await newsRes.json();
      setNews(newsData);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'А';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      message: 'Точно хотите удалить эту новость? Она исчезнет навсегда.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://localhost:3000/news/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) setNews(news.filter(item => item.id !== id)); else alert('Не удалось удалить новость.');
        } catch (e) { alert('Ошибка при удалении.'); }
      }
    });
  };

  const startEdit = (item: NewsItem) => { setEditingId(item.id); setEditTitle(item.title); setEditContent(item.content); };
  const cancelEdit = () => { setEditingId(null); setEditTitle(''); setEditContent(''); };

  const handleSaveEdit = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/news/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: editTitle, content: editContent })
      });
      if (res.ok) {
        setNews(news.map(item => item.id === id ? { ...item, title: editTitle, content: editContent } : item));
        setEditingId(null);
      } else { alert('Не удалось сохранить изменения. Убедитесь, что вы автор этой новости.'); }
    } catch (e) { alert('Ошибка при сохранении.'); }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/news/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: newTitle, content: newContent })
      });
      if (response.ok) { setNewTitle(''); setNewContent(''); setIsCreateOpen(false); fetchData(); } else { alert('Ошибка при публикации новости.'); }
    } catch (err) { alert('Ошибка сети.'); } finally { setIsSubmitting(false); }
  };

  if (loading) return <div className="p-20 text-center text-gray-500 animate-pulse font-medium">Загрузка свежих новостей...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
        <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner flex-shrink-0">📰</div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Новости отеля</h1>
          <p className="text-gray-500 text-lg">Важные объявления, обновления регламентов и жизнь команды.</p>
        </div>
      </div>

      {(userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPER_ADMIN') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
          <button onClick={() => setIsCreateOpen(!isCreateOpen)} className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors outline-none">
            <span className="font-bold text-gray-800 text-lg flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl pb-0.5">+</span> Создать новость</span>
            <svg className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isCreateOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out ${isCreateOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <form onSubmit={handleCreateNews} className="p-6 pt-0 border-t border-gray-50 mt-2 space-y-4">
              <input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-gray-800" placeholder="Заголовок новости" />
              <CustomTextarea value={newContent} onChange={setNewContent} placeholder="Подробный текст новости..." focusRingClass="focus-within:ring-primary-500" />
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSubmitting} className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-xl shadow-md shadow-primary-500/20 transition-colors">{isSubmitting ? 'Публикация...' : 'Опубликовать'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {news.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-gray-100 text-center">
          <span className="text-6xl mb-4 block">📭</span><h2 className="text-2xl font-bold text-gray-800 mb-2">Новостей пока нет</h2><p className="text-gray-500">Нажмите "Создать новость", чтобы опубликовать первую!</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div id={`news_${news[0].id}`} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative group scroll-mt-24">
            <div className="h-2 w-full bg-primary-500"></div>
            <div className="p-8 md:p-10">
              {currentUser === news[0].author?.fullName && editingId !== news[0].id && (
                <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                  <button onClick={() => startEdit(news[0])} className="text-gray-400 hover:text-primary-500 transition-colors" title="Редактировать"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                  <button onClick={() => handleDelete(news[0].id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Удалить"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
              )}
              <div className="flex items-center gap-3 mb-6"><span className="bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider">Главное</span><span className="text-sm font-medium text-gray-400">{formatDate(news[0].createdAt)}</span></div>
              
              {editingId === news[0].id ? (
                <div className="space-y-4 mb-8">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-3xl font-bold text-gray-900" placeholder="Заголовок" />
                  <CustomTextarea value={editContent} onChange={setEditContent} placeholder="Текст новости" />
                  <div className="flex gap-3"><button onClick={() => handleSaveEdit(news[0].id)} className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors">Сохранить</button><button onClick={cancelEdit} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-bold transition-colors">Отмена</button></div>
                </div>
              ) : (
                <>
                  <h2 className={`text-3xl font-bold text-gray-900 mb-4 pr-16 break-words min-w-0`}>{news[0].title}</h2>
                  <div className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap mb-8 break-words min-w-0 custom-html-content" dangerouslySetInnerHTML={{ __html: news[0].content }} />
                </>
              )}

              <div className="flex items-center gap-3 pt-6 border-t border-gray-100 min-w-0">
                {news[0].author?.avatarUrl ? <img src={`http://localhost:3000${news[0].author.avatarUrl}`} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0" /> : <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">{getInitials(news[0].author?.fullName)}</div>}
                <div className="flex flex-col min-w-0 flex-1"><span className="text-sm font-bold text-gray-800 break-words min-w-0">{news[0].author?.fullName || 'Администрация'}{currentUser === news[0].author?.fullName && <span className="ml-2 text-[10px] bg-primary-50 text-primary-500 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">Вы</span>}</span><span className="text-xs text-gray-500">Автор публикации</span></div>
              </div>
            </div>
          </div>

          {news.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {news.slice(1).map((item) => {
                const isMyPost = currentUser === item.author?.fullName;
                const isEditing = editingId === item.id;
                return (
                  <div key={item.id} id={`news_${item.id}`} className="bg-white rounded-[1.5rem] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col hover:border-primary-200 hover:shadow-md transition-all group relative scroll-mt-24 min-w-0">
                    {isMyPost && !isEditing && (
                      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                        <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-primary-500 transition-colors" title="Редактировать"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                        <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Удалить"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4"><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{formatDate(item.createdAt)}</span></div>
                    
                    {isEditing ? (
                      <div className="space-y-3 mb-6 flex-1 min-w-0">
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-lg font-bold text-gray-900" placeholder="Заголовок" />
                        <CustomTextarea value={editContent} onChange={setEditContent} placeholder="Текст" />
                        <div className="flex gap-2"><button onClick={() => handleSaveEdit(item.id)} className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Сохранить</button><button onClick={cancelEdit} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-xs font-bold">Отмена</button></div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors pr-12 break-words min-w-0">{item.title}</h3>
                        <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 mb-6 flex-1 break-words min-w-0 custom-html-content" dangerouslySetInnerHTML={{ __html: item.content }} />
                      </>
                    )}

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50 mt-auto min-w-0">
                      {item.author?.avatarUrl ? <img src={`http://localhost:3000${item.author.avatarUrl}`} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" /> : <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">{getInitials(item.author?.fullName)}</div>}
                      <span className="text-sm font-medium text-gray-700 min-w-0 flex-1 break-words">{item.author?.fullName || 'Администрация'}{isMyPost && <span className="ml-2 text-[9px] bg-primary-50 text-primary-500 px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider inline-block">Вы</span>}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
  );
}