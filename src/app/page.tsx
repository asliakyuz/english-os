'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import { BookOpen, PenTool, Plus, Trash2, CheckSquare, Square, ArrowRight, Search, CheckCircle2, GraduationCap, ChevronDown, ChevronUp, BarChart3, Target, Layers, FileText, Star } from 'lucide-react';

const [isClient, setIsClient] = useState(false);
useEffect(() => { setIsClient(true); fetchData(); }, []);
if (!isClient) return <div className="text-white">LOADING_SYSTEM_RESOURCES...</div>;

interface Word {
  id: string;
  word: string;
  meaning: string;
  v2_form: string;
  v3_form: string;
  example: string;
  notes: string;
  image_url: string;
  level: string;
  difficulty_rating: number;
  word_type: string;
  created_at: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  journal_date?: string;
}

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

interface OxfordWord {
  id: number;
  word: string;
  word_type: string;
  level: string;
}

export default function EnglishOSMaster() {
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'archive' | 'oxford' | 'quiz' | 'journal' | 'goals' | 'grammar' | 'books_tracker' | 'general_grammar'>('dashboard');
  
  const [customWords, setCustomWords] = useState<Word[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([]);
  const [oxfordWords, setOxfordWords] = useState<OxfordWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDays, setActiveDays] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedOxfordLevel, setSelectedOxfordLevel] = useState<string>('ALL');
  const [oxfordSearch, setOxfordSearch] = useState('');

  // --- KİTAP VE AKORDEON STATE'LERİ ---
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [units, setUnits] = useState<any[]>([]);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [bookNoteText, setBookNoteText] = useState<string>('');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitTitle, setUnitTitle] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // --- GENEL GRAMER STATE'LERİ ---
  const [generalTopics, setGeneralTopics] = useState<any[]>([]);
  const [showGeneralForm, setShowGeneralForm] = useState(false);
  const [newGeneralTitle, setNewGeneralTitle] = useState('');
  const [newGeneralContent, setNewGeneralContent] = useState('');
  const [newGeneralStarred, setNewGeneralStarred] = useState(false);

  // Form States (Vocabulary & Journal)
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [v2, setV2] = useState('');
  const [v3, setV3] = useState('');
  const [example, setExample] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [level, setLevel] = useState('A1');
  const [difficulty, setDifficulty] = useState(3);
  const [wordType, setWordType] = useState('Noun');
  const [jTitle, setJTitle] = useState('');
  const [jContent, setJContent] = useState('');
  const [jDate, setJDate] = useState(new Date().toISOString().split('T')[0]); 
  const [newGoalText, setNewGoalText] = useState('');
  const [currentQuizWord, setCurrentQuizWord] = useState<Word | null>(null);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState('');

  const calculateActiveDays = (words: Word[], journals: JournalEntry[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const days: number[] = [];
    words.forEach(w => {
      const d = new Date(w.created_at);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && !days.includes(d.getDate())) days.push(d.getDate());
    });
    journals.forEach(j => {
      const d = new Date(j.journal_date || j.created_at);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && !days.includes(d.getDate())) days.push(d.getDate());
    });
    setActiveDays(days);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: wordsData } = await supabase.from('words').select('*').order('created_at', { ascending: false });
      const currentWords = wordsData || [];
      setCustomWords(currentWords);

      const { data: journalsData } = await supabase.from('journals').select('*').order('created_at', { ascending: false });
      setJournalEntries(journalsData || []);

      const { data: goalsData } = await supabase.from('goals').select('*').order('created_at', { ascending: true });
      setWeeklyGoals(goalsData || []);

      const { data: oxfordData } = await supabase.from('oxford_words').select('*').order('word', { ascending: true });
      setOxfordWords(oxfordData || []);

      calculateActiveDays(currentWords, journalsData || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    async function initBooks() {
      const { data } = await supabase.from('books').select('*');
      if (data && data.length > 0) {
        setBooks(data);
        setSelectedBook(data[0].id);
      } else {
        const { data: newBook } = await supabase.from('books').insert([{ title: 'Essential Grammar in Use', category: 'grammar' }]).select();
        if (newBook) { setBooks(newBook); setSelectedBook(newBook[0].id); }
      }
    }
    initBooks();
    fetchData();
    fetchGeneralTopics();
  }, []);

  const fetchUnits = async () => {
    if (!selectedBook) return;
    const { data } = await supabase.from('book_units')
      .select(`*, user_progress(is_completed, notes, is_starred)`)
      .eq('book_id', selectedBook)
      .order('unit_number', { ascending: true });
    if (data) setUnits(data);
  };

  useEffect(() => { fetchUnits(); }, [selectedBook]);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber || !unitTitle) return;
    const { error } = await supabase.from('book_units').insert([
      { book_id: selectedBook, unit_number: parseInt(unitNumber), title: unitTitle, section_name: sectionName || 'General' }
    ]);
    if (!error) { setUnitNumber(''); setUnitTitle(''); setSectionName(''); setShowAddForm(false); fetchUnits(); }
  };

  const handleToggleTick = async (unitId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !currentStatus;
    const { error } = await supabase.from('user_progress').upsert({ unit_id: unitId, is_completed: newStatus }, { onConflict: 'unit_id' });
    if (!error) fetchUnits();
  };

  const handleToggleBookStar = async (unitId: string, currentStarStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStarStatus = !currentStarStatus;
    const { error } = await supabase.from('user_progress').upsert({ unit_id: unitId, is_starred: newStarStatus }, { onConflict: 'unit_id' });
    if (!error) fetchUnits();
  };

  const handleSaveBookNote = async (unitId: string) => {
    await supabase.from('user_progress').upsert({ unit_id: unitId, notes: bookNoteText }, { onConflict: 'unit_id' });
    alert('Notlar kaydedildi, Aslı!');
    fetchUnits();
  };

  const toggleExpand = (unit: any) => {
    if (expandedUnitId === unit.id) { setExpandedUnitId(null); } 
    else { setExpandedUnitId(unit.id); setBookNoteText(unit.user_progress?.notes || ''); }
  };

  // --- GENEL GRAMER SÜREÇLERİ ---
  const fetchGeneralTopics = () => {
    supabase.from('general_grammar').select('*').order('sort_order', { ascending: true }).then(({ data }) => {
      if (data) setGeneralTopics(data);
    });
  };

  const handleAddGeneralTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGeneralTitle.trim()) return;
    await supabase.from('general_grammar').insert([
      { title: newGeneralTitle.trim(), content: newGeneralContent.trim(), is_starred: newGeneralStarred }
    ]);
    setNewGeneralTitle('');
    setNewGeneralContent('');
    setNewGeneralStarred(false);
    setShowGeneralForm(false);
    fetchGeneralTopics();
  };

  const handleUpdateGeneralContent = async (id: string, content: string) => {
    await supabase.from('general_grammar').update({ content }).eq('id', id);
  };

  const handleToggleGeneralStar = async (id: string, currentStarStatus: boolean) => {
    const newStarStatus = !currentStarStatus;
    const { error } = await supabase.from('general_grammar').update({ is_starred: newStarStatus }).eq('id', id);
    if (!error) fetchGeneralTopics();
  };

  const handleDeleteGeneralTopic = async (id: string) => {
    if (!confirm("Bu genel konuyu silmek istiyor musun Aslı?")) return;
    await supabase.from('general_grammar').delete().eq('id', id);
    fetchGeneralTopics();
  };

  // Vocab Handlers
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || !meaning) return;
    await supabase.from('words').insert([{
      word: word.toLowerCase().trim(), meaning: meaning.trim(),
      v2_form: v2.trim(), v3_form: v3.trim(), example: example.trim(),
      notes: notes.trim(), image_url: imageUrl.trim(), level, 
      difficulty_rating: difficulty, word_type: wordType
    }]);
    setWord(''); setMeaning(''); setV2(''); setV3(''); setExample(''); setNotes(''); setImageUrl('');
    fetchData();
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jContent) return;
    await supabase.from('journals').insert([{ title: jTitle.trim() || 'Untitled Entry', content: jContent.trim(), journal_date: jDate }]);
    setJTitle(''); setJContent('');
    fetchData();
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    await supabase.from('goals').insert([{ text: newGoalText.trim() }]);
    setNewGoalText('');
    fetchData();
  };

  const toggleGoal = async (id: string, currentStatus: boolean) => {
    await supabase.from('goals').update({ completed: !currentStatus }).eq('id', id);
    fetchData();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    fetchData();
  };

  const startQuiz = () => {
    if (customWords.length === 0) return;
    const randomIndex = Math.floor(Math.random() * customWords.length);
    setCurrentQuizWord(customWords[randomIndex]);
    setQuizAnswer(''); setQuizFeedback('');
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuizWord) return;
    if (quizAnswer.toLowerCase().trim() === currentQuizWord.meaning.toLowerCase().trim()) {
      setQuizFeedback('🟩 SYSTEM_SUCCESS: Doğru cevap!');
    } else {
      setQuizFeedback(`🟥 SYSTEM_ERROR: Yanlış. Doğru: "${currentQuizWord.meaning}"`);
    }
  };

  // İstatistiksel Hesaplamalar
  const totalWordsCount = customWords.filter(w => w.word_type !== 'Phrase').length;
  const totalPhrasesCount = customWords.filter(w => w.word_type === 'Phrase').length;
  const totalBookUnitsCount = units.length;
  const masteredBookUnitsCount = units.filter(u => u.user_progress?.is_completed).length;

  const levelCounts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
  customWords.forEach(w => { if (w.level && levelCounts[w.level] !== undefined) levelCounts[w.level]++; });

  const filteredAlphabeticalWords = [...customWords].filter(w => w.word.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => a.word.localeCompare(b.word));
  const latestFiveWords = [...customWords].slice(0, 5);
  const filteredOxfordWords = oxfordWords.filter(ow => (selectedOxfordLevel === 'ALL' || ow.level === selectedOxfordLevel) && ow.word.toLowerCase().includes(oxfordSearch.toLowerCase()));
  const learnedWordsSet = new Set(customWords.map(cw => cw.word.toLowerCase().trim()));

  return (
    <div className="flex bg-[#0a0616] min-h-screen text-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} activeDays={activeDays} />

      <main className="flex-1 min-h-screen ml-64 p-8 overflow-y-auto font-mono space-y-6">
        
        {/* SEKME BAŞLIĞI */}
        <div className="border-b border-[#231742] pb-3 flex justify-between items-center">
          <h1 className="text-sm font-bold bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent tracking-widest">
            ENGINE_SYS // {activeTab.toUpperCase()}_MODE
          </h1>
        </div>

        {/* 📊 SEKME 1: PERFORMANCE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#130c25] border border-[#231742] p-8 rounded-2xl flex items-center justify-between shadow-2xl relative overflow-hidden group hover:border-[#06b6d4]/50 transition-all">
                <div className="space-y-2">
                  <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block">Total Learned Words</span>
                  <span className="text-5xl font-black text-[#06b6d4] block">{totalWordsCount}</span>
                </div>
                <BookOpen size={48} className="text-[#1c1435] absolute right-6 top-1/2 -translate-y-1/2" />
              </div>
              <div className="bg-[#130c25] border border-[#231742] p-8 rounded-2xl flex items-center justify-between shadow-2xl relative overflow-hidden group hover:border-[#a855f7]/50 transition-all">
                <div className="space-y-2">
                  <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block">Phrases & Chunks</span>
                  <span className="text-5xl font-black text-[#a855f7] block">{totalPhrasesCount}</span>
                </div>
                <Target size={48} className="text-[#1c1435] absolute right-6 top-1/2 -translate-y-1/2" />
              </div>
              <div className="bg-[#130c25] border border-[#231742] p-8 rounded-2xl flex items-center justify-between shadow-2xl relative overflow-hidden group hover:border-[#ec4899]/50 transition-all">
                <div className="space-y-2">
                  <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block">Essential Grammar Progress</span>
                  <span className="text-5xl font-black text-[#ec4899] block">{masteredBookUnitsCount} <span className="text-xl text-gray-600">/ {totalBookUnitsCount}</span></span>
                </div>
                <GraduationCap size={48} className="text-[#1c1435] absolute right-6 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="bg-[#130c25] border border-[#231742] p-8 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 border-b border-[#1c1236] pb-4">
                <Layers className="text-[#06b6d4]" size={18} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">CEFR LEVEL CAPACITY MATRIX</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-2">
                {Object.entries(levelCounts).map(([lvl, count]) => {
                  const maxCount = Math.max(...Object.values(levelCounts), 1);
                  const barHeight = count > 0 ? `${(count / maxCount) * 100}%` : '4px';
                  return (
                    <div key={lvl} className="bg-[#0d071a] border border-[#1c1236] p-6 rounded-xl flex flex-col items-center justify-between min-h-[180px] relative">
                      <span className="text-xs font-black text-gray-400 tracking-wider bg-[#130c25] px-2 py-0.5 rounded border border-[#231742]">{lvl} LEVEL</span>
                      <div className="w-full bg-[#130c25] h-12 rounded-md overflow-hidden relative flex items-end px-1 border border-[#1c1236]">
                        <div style={{ height: barHeight }} className="w-full bg-gradient-to-t from-[#29174f] to-[#06b6d4] rounded-sm" />
                      </div>
                      <span className="text-3xl font-black text-white mt-2">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 📘 SEKME: ESSENTIAL GRAMMAR IN USE (AKORDEON KUTULARI) */}
        {activeTab === 'books_tracker' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-[#130c25] border border-[#231742] p-4 rounded-xl">
              <span className="text-xs font-bold text-gray-400 font-mono">CHOOSE_ACTIVE_BOOK_NODE:</span>
              <div className="flex gap-4 items-center">
                <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} className="bg-[#0d071a] border border-[#2d1e56] p-2 rounded-lg text-xs text-white font-bold focus:outline-none">
                  {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
                <button onClick={() => setShowAddForm(!showAddForm)} className="bg-[#06b6d4] text-black text-xs font-bold py-2 px-4 rounded-lg transition-all">
                  {showAddForm ? 'CLOSE_FORM' : '+ INGEST_NEW_UNIT'}
                </button>
              </div>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddUnit} className="bg-[#130c25] border border-[#ec4899]/30 p-5 rounded-xl flex flex-col gap-4 shadow-xl">
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" required placeholder="Unit No" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className="bg-[#0d071a] border border-[#2d1e56] p-3 rounded-lg text-xs text-white focus:outline-none" />
                  <input type="text" required placeholder="Unit Title" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} className="bg-[#0d071a] border border-[#2d1e56] p-3 rounded-lg col-span-2 text-xs text-white focus:outline-none" />
                </div>
                <input type="text" placeholder="Section / Group Name" value={sectionName} onChange={(e) => setSectionName(e.target.value)} className="bg-[#0d071a] border border-[#2d1e56] p-3 rounded-lg text-xs text-white focus:outline-none" />
                <button type="submit" className="bg-[#ec4899] text-white font-bold py-2.5 rounded-lg text-xs">DEPLOY_UNIT_TO_MATRIX</button>
              </form>
            )}

            <div className="flex flex-col gap-3">
              {units.length === 0 ? (
                <div className="text-gray-600 text-center py-12 border border-dashed border-[#231742] rounded-xl text-xs">Henüz ünite kaydı yapılmamış Aslı. Sağ üstten ekleme yapabilirsin.</div>
              ) : (
                units.map(u => {
                  const isCompleted = u.user_progress?.is_completed || false;
                  const isStarred = u.user_progress?.is_starred || false;
                  const isExpanded = expandedUnitId === u.id;
                  return (
                    <div key={u.id} className="bg-[#130c25] rounded-xl border border-[#231742] overflow-hidden transition-all">
                      <div onClick={() => toggleExpand(u)} className={`p-4 flex items-center justify-between cursor-pointer select-none ${isExpanded ? 'bg-[#1c1236]/40' : 'hover:bg-[#1a1033]/30'}`}>
                        <div className="flex items-center gap-4">
                          <button type="button" onClick={(e) => handleToggleTick(u.id, isCompleted, e)} className="text-gray-400 hover:text-white mt-0.5">
                            {isCompleted ? <CheckSquare size={16} className="text-emerald-400" /> : <Square size={16} />}
                          </button>
                          
                          <button type="button" onClick={(e) => handleToggleBookStar(u.id, isStarred, e)} className="text-gray-500 hover:text-amber-400 transition-colors">
                            <Star size={16} className={isStarred ? 'text-amber-400 fill-amber-400' : 'text-gray-500'} />
                          </button>

                          <span className={`text-xs font-bold ${isCompleted ? 'line-through text-gray-600' : 'text-gray-200'}`}>Unit {u.unit_number}: {u.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] bg-[#0d071a] px-2.5 py-0.5 rounded border border-[#1c1236] text-gray-400 font-mono">{u.section_name}</span>
                          <span className="text-gray-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="p-4 bg-[#0d071a]/50 border-t border-[#231742]/50 flex flex-col gap-3">
                          <textarea value={bookNoteText} onChange={(e) => setBookNoteText(e.target.value)} placeholder="Bu üniteyle ilgili formülleri, kuralları veya kendi cümlelerini buraya yazabilirsin..." className="w-full h-36 bg-[#130c25] p-4 rounded-lg text-xs text-white resize-none border border-[#231742] focus:outline-none focus:border-[#06b6d4] font-sans font-medium" />
                          <div className="flex justify-end"><button onClick={() => handleSaveBookNote(u.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-md text-[10px] uppercase shadow-md">SAVE_UNIT_NOTES</button></div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 📝 SEKME: GENEL GRAMER KONULARI (GELİŞMİŞ KOCAMAN FORM) */}
        {activeTab === 'general_grammar' && (
          <div className="p-2 flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-[#130c25] border border-[#231742] p-4 rounded-xl">
              <span className="text-xs font-bold text-gray-400 font-mono">MANUAL_GRAMMAR_MATRIX_RESOURCES:</span>
              <button onClick={() => setShowGeneralForm(!showGeneralForm)} className="bg-[#06b6d4] text-black text-xs font-bold py-2 px-5 rounded-lg transition-all">
                {showGeneralForm ? 'CLOSE_FORM' : '+ INGEST_NEW_TOPIC'}
              </button>
            </div>

            {showGeneralForm && (
              <form onSubmit={handleAddGeneralTopic} className="bg-[#130c25] border border-[#a855f7]/40 p-6 rounded-xl flex flex-col gap-4 shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center border-b border-[#231742] pb-3">
                  <h3 className="text-xs font-bold uppercase text-gray-300">New Topic Node Specification</h3>
                  <button type="button" onClick={() => setNewGeneralStarred(!newGeneralStarred)} className="flex items-center gap-1.5 text-[10px] font-bold bg-[#0d071a] border border-[#231742] px-3 py-1.5 rounded-md hover:text-amber-400 transition-colors">
                    <Star size={14} className={newGeneralStarred ? 'text-amber-400 fill-amber-400' : 'text-gray-500'} />
                    {newGeneralStarred ? 'IMPORTANT_NODE' : 'MARK_AS_IMPORTANT'}
                  </button>
                </div>
                <input type="text" required value={newGeneralTitle} onChange={e => setNewGeneralTitle(e.target.value)} placeholder="Konu Başlığı Gir (Örn: Inversion, Relative Clauses)" className="bg-[#0d071a] border border-[#2d1e56] p-3 rounded-lg text-xs text-white focus:outline-none focus:border-[#a855f7]" />
                <textarea value={newGeneralContent} onChange={e => setNewGeneralContent(e.target.value)} placeholder="Konunun ilk detaylı özetini, formüllerini buraya kocaman yazabilirsin, Aslı..." rows={6} className="bg-[#0d071a] border border-[#2d1e56] p-4 rounded-lg text-xs text-white resize-none focus:outline-none focus:border-[#a855f7] font-sans font-medium leading-relaxed" />
                <button type="submit" className="bg-[#a855f7] text-white py-3 rounded-lg hover:bg-[#9333ea] text-xs font-bold transition-all">LAUNCH_TOPIC_NODE_TO_MATRIX</button>
              </form>
            )}

            <div className="flex flex-col gap-4">
              {generalTopics.length === 0 ? (
                <div className="text-gray-600 text-center py-12 border border-dashed border-[#231742] rounded-xl text-xs">Henüz genel konu başlığı eklenmemiş Aslı.</div>
              ) : (
                generalTopics.map((topic, index) => (
                  <div key={topic.id} className="bg-[#130c25] border border-[#231742] p-5 rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-center border-b border-[#1c1236] pb-2">
                      <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <FileText size={12}/> NODE_ID // {index + 1}. {topic.title.toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => handleToggleGeneralStar(topic.id, topic.is_starred)} className="text-gray-500 hover:text-amber-400 transition-colors">
                          <Star size={14} className={topic.is_starred ? 'text-amber-400 fill-amber-400' : 'text-gray-500'} />
                        </button>
                        <button onClick={() => handleDeleteGeneralTopic(topic.id)} className="text-gray-600 hover:text-rose-500 transition-colors">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                    <textarea defaultValue={topic.content} onBlur={(e) => handleUpdateGeneralContent(topic.id, e.target.value)} placeholder="Bu konunun özetini, formüllerini buraya yaz..." className="w-full h-36 bg-[#0d071a] p-4 rounded-lg text-xs text-white resize-none border border-[#2d1e56] focus:outline-none focus:border-emerald-500 font-sans font-medium leading-relaxed" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* KELİME GİRİŞİ */}
        {activeTab === 'vocabulary' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#130c25] border border-[#231742] rounded-xl p-6 h-fit lg:col-span-1">
              <h3 className="text-xs font-bold uppercase text-[#06b6d4] mb-4 flex items-center gap-2"><BookOpen size={14}/> Ingest Word Node</h3>
              <form onSubmit={handleAddWord} className="space-y-4">
                <input type="text" required value={word} onChange={e => setWord(e.target.value)} placeholder="WORD (V1)" className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                <div>
                  <label className="block text-[9px] text-gray-400 mb-1">WORD TYPE</label>
                  <select value={wordType} onChange={e => setWordType(e.target.value)} className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-2 py-2 text-xs text-white focus:outline-none">
                    {['Noun (İsim)', 'Verb (Fiil)', 'Adjective (Sıfat)', 'Adverb (Zarf)', 'Phrase (Kalıp / Chunk)'].map(t => (
                      <option key={t} value={t.split(' ')[0]} className="bg-[#130c25]">{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={v2} onChange={e => setV2(e.target.value)} placeholder="PAST (V2)" className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                  <input type="text" value={v3} onChange={e => setV3(e.target.value)} placeholder="PART. (V3)" className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <input type="text" required value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="MEANING (TR)" className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="IMAGE URL LINK" className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                <textarea value={example} onChange={e => setExample(e.target.value)} placeholder="EXAMPLE SENTENCE" rows={2} className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none" />
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="NOTES" rows={2} className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none" />
                <div className="grid grid-cols-2 gap-4 border-t border-[#1c1236] pt-3">
                  <div>
                    <label className="block text-[9px] text-gray-400 mb-1">CEFR LEVEL</label>
                    <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                      {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l} className="bg-[#130c25]">{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-400 mb-1">DIFFICULTY ({difficulty}/5)</label>
                    <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full accent-[#06b6d4] mt-1.5" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-[#a855f7] to-[#06b6d4] text-white text-xs py-2.5 rounded-lg font-bold">SAVE_TO_SYSTEM</button>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold uppercase text-[#a855f7] tracking-wider">⚡ RECENTLY_ADDED_LOGS (Son 5 Kelime)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestFiveWords.map((item) => (
                  <div key={item.id} className="bg-[#130c25] border border-[#231742] p-4 rounded-xl relative">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-bold text-white">{item.word}</h4>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#1c1236] text-[#06b6d4] uppercase">{item.word_type}</span>
                    </div>
                    <p className="text-xs text-gray-400">TR: {item.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DIĞER TÜM SEKMELER */}
        {activeTab === 'archive' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-160px)]">
            <div className="bg-[#130c25] border border-[#231742] rounded-xl p-4 flex flex-col space-y-3 lg:col-span-1 h-full overflow-hidden">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-gray-500" size={14} />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Sistemde kelime arat..." className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none" />
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                {filteredAlphabeticalWords.map((item) => (
                  <button key={item.id} onClick={() => setSelectedWord(item)} className={`w-full flex justify-between items-center p-2.5 rounded-lg text-xs font-mono text-left transition-all ${selectedWord?.id === item.id ? 'bg-gradient-to-r from-[#29174f] to-[#130c25] border-l-2 border-[#06b6d4] text-[#06b6d4]' : 'bg-[#181130]/50 hover:bg-[#1c1236] text-gray-300'}`}>
                    <span className="font-bold truncate">{item.word}</span>
                    <span className="text-[9px] text-gray-500">({item.level})</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 bg-[#130c25] border border-[#231742] rounded-xl p-6 h-full overflow-y-auto">
              {selectedWord ? (
                <div className="space-y-5">
                  <div className="flex justify-between items-start border-b border-[#231742] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-white tracking-wide">{selectedWord.word}</h2>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#29174f] text-[#a855f7] font-bold uppercase">{selectedWord.word_type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-800/30">CEFR: {selectedWord.level}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0d071a] p-3.5 rounded-lg border border-[#1c1236]">
                      <span className="text-[9px] text-gray-500 uppercase block mb-1">Türkçe Anlamı</span>
                      <p className="text-sm font-bold text-gray-200">{selectedWord.meaning}</p>
                    </div>
                    <div className="bg-[#0d071a] p-3.5 rounded-lg border border-[#1c1236]">
                      <span className="text-[9px] text-gray-500 uppercase block mb-1">Zaman Halleri</span>
                      <p className="text-xs text-gray-300">V2: <span className="text-white font-bold">{selectedWord.v2_form || '—'}</span> | V3: <span className="text-white font-bold">{selectedWord.v3_form || '—'}</span></p>
                    </div>
                  </div>
                  {selectedWord.image_url && <img src={selectedWord.image_url} alt={selectedWord.word} className="w-full h-44 object-cover rounded-xl border border-[#231742]" />}
                  {selectedWord.example && <p className="text-xs italic text-gray-200 bg-[#1c1236]/30 p-4 rounded-xl border border-[#2d1e56]/40">"{selectedWord.example}"</p>}
                  {selectedWord.notes && <p className="text-xs text-gray-400 bg-[#0d071a] p-3 rounded-lg border border-[#1c1236] whitespace-pre-wrap">{selectedWord.notes}</p>}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
                  <ArrowRight size={24} className="animate-pulse mb-2" />
                  <p className="text-xs">Detayları görmek için soldan bir kelime seçin.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'oxford' && (
          <div className="bg-[#130c25] border border-[#231742] rounded-xl p-6 space-y-4 h-[calc(100vh-160px)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-[#1c1236] pb-4">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 text-gray-500" size={14} />
                <input type="text" value={oxfordSearch} onChange={e => setOxfordSearch(e.target.value)} placeholder="Oxford kelimelerinde ara..." className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none" />
              </div>
              <div className="flex flex-wrap gap-1 bg-[#0d071a] border border-[#1c1236] p-1 rounded-lg text-[10px] font-bold">
                {['ALL', 'A1', 'A2', 'B1', 'B2', 'C1'].map(lvl => (
                  <button key={lvl} onClick={() => setSelectedOxfordLevel(lvl)} className={`px-3 py-1.5 rounded transition-all ${selectedOxfordLevel === lvl ? 'bg-[#06b6d4] text-white' : 'text-gray-400 hover:text-white'}`}>{lvl}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 custom-scrollbar">
              {filteredOxfordWords.map((ow) => {
                const isLearned = learnedWordsSet.has(ow.word.toLowerCase().trim());
                return (
                  <div key={ow.id} className={`p-3 rounded-lg border flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${isLearned ? 'bg-[#0b201a] border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.05)]' : 'bg-[#181130]/40 border-[#251a4a] text-gray-300'}`}>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs truncate max-w-[100px]">{ow.word}</span>
                      {isLearned && <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />}
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[8px] font-bold text-gray-500 border-t border-[#1c1236]/50 pt-1.5">
                      <span className="uppercase font-sans">{ow.word_type}</span>
                      <span className={isLearned ? 'text-emerald-400' : 'text-gray-400'}>{ow.level}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="max-w-md mx-auto bg-[#130c25] border border-[#231742] p-6 rounded-xl text-center space-y-4">
            <h2 className="text-xs font-bold text-[#06b6d4] uppercase">⚡ QUIZ_MATRIX</h2>
            {currentQuizWord ? (
              <form onSubmit={handleQuizSubmit} className="space-y-4">
                <h3 className="text-2xl font-bold text-white">{currentQuizWord.word}</h3>
                <input type="text" required value={quizAnswer} onChange={e => setQuizAnswer(e.target.value)} placeholder="Türkçe anlamı..." className="w-full bg-[#1c1236] border border-[#2d1e56] rounded-lg p-2.5 text-center text-xs text-white focus:outline-none" />
                {quizFeedback && <p className="text-xs font-bold p-2 bg-[#1c1236] rounded">{quizFeedback}</p>}
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-[#06b6d4] text-white py-2 rounded-lg text-xs font-bold">CHECK</button>
                  <button type="button" onClick={startQuiz} className="flex-1 bg-[#231742] text-white py-2 rounded-lg text-xs font-bold">NEXT ▷</button>
                </div>
              </form>
            ) : <p className="text-xs text-gray-500 py-4">Kelime bulunamadı.</p>}
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#130c25] border border-[#231742] rounded-xl p-6">
                <h3 className="text-xs font-bold uppercase text-[#ec4899] mb-4 flex items-center gap-2"><PenTool size={14}/> Write Entry</h3>
                <form onSubmit={handleSaveJournal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] text-gray-400 mb-1">LOG TITLE</label>
                      <input type="text" value={jTitle} onChange={j => setJTitle(j.target.value)} placeholder="TITLE (OPTIONAL)" className="w-full bg-[#1c1236] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 mb-1">LOG DATE</label>
                      <input type="date" value={jDate} onChange={j => setJDate(j.target.value)} className="w-full bg-[#1c1236] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ec4899] accent-[#ec4899]" />
                    </div>
                  </div>
                  <textarea required value={jContent} onChange={j => setJContent(j.target.value)} placeholder="Write your thoughts in English here..." rows={8} className="w-full bg-[#1c1236] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none font-sans" />
                  <button type="submit" className="w-full bg-[#ec4899] text-white text-xs py-2.5 rounded-lg font-bold">LOG_TO_DATABASE</button>
                </form>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-gray-400">▶ Archived Journals ({journalEntries.length})</h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {journalEntries.map(entry => (
                    <div key={entry.id} className="bg-[#130c25] border border-[#231742] p-3 rounded-xl">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 border-b border-[#1c1236] pb-1.5 mb-1.5">
                        <span className="font-bold text-white truncate max-w-[120px]">{entry.title}</span>
                        <span>{new Date(entry.journal_date || entry.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <p className="text-[11px] text-gray-300 font-sans line-clamp-3 leading-relaxed">{entry.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#130c25] border border-[#231742] rounded-xl p-6 h-fit">
              <h3 className="text-xs font-bold uppercase text-[#a855f7] mb-4 flex items-center gap-2"><Plus size={14} /> Create New Target</h3>
              <form onSubmit={handleAddGoal} className="space-y-4">
                <input type="text" required value={newGoalText} onChange={e => setNewGoalText(e.target.value)} placeholder="e.g., Read 5 pages..." className="w-full bg-[#1c1236] border border-[#2d1e56] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none" />
                <button type="submit" className="w-full bg-gradient-to-r from-[#a855f7] to-[#06b6d4] text-white text-xs py-2.5 rounded-lg font-bold">DEPLOY_TARGET</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-[#130c25] border border-[#231742] rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 border-b border-[#1c1236] pb-3">
                <span className="text-[#06b6d4]">ACTIVE_TARGET_MATRIX</span>
                <span>{weeklyGoals.filter(g => g.completed).length} / {weeklyGoals.length} Done</span>
              </div>
              <div className="space-y-2">
                {weeklyGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 rounded-lg border transition-all">
                    <button onClick={() => toggleGoal(goal.id, goal.completed)} className="flex items-start gap-3 text-left text-xs leading-relaxed flex-1 group">
                      <span className="mt-0.5 flex-shrink-0">{goal.completed ? <CheckSquare size={14} /> : <Square size={14} />}</span>
                      <span className={goal.completed ? 'line-through opacity-50' : ''}>{goal.text}</span>
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="text-gray-600 hover:text-rose-500 p-1 transition-colors ml-2"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}