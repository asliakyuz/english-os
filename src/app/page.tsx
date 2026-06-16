'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import { BookOpen, PenTool, Plus, Trash2, CheckSquare, Square, ArrowRight, Search, CheckCircle2, GraduationCap, ChevronDown, ChevronUp, BarChart3, Target, Layers } from 'lucide-react';

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

interface GrammarTopic {
  id: string;
  unit_number: number;
  title: string;
  status: 'Not Started' | 'In Progress' | 'Mastered';
  notes: string;
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
  // İlk açılış sekmesi artık Dashboard!
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'archive' | 'oxford' | 'quiz' | 'journal' | 'goals' | 'grammar' | 'dashboard'>('dashboard');
  
  const [customWords, setCustomWords] = useState<Word[]>([]);
  const [grammarTopics, setGrammarTopics] = useState<GrammarTopic[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([]);
  const [oxfordWords, setOxfordWords] = useState<OxfordWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDays, setActiveDays] = useState<number[]>([]);

  const [expandedGrammarId, setExpandedGrammarId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOxfordLevel, setSelectedOxfordLevel] = useState<string>('ALL');
  const [oxfordSearch, setOxfordSearch] = useState('');

  // Form States
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

  const [unitNum, setUnitNum] = useState<number>(1);
  const [gTitle, setGTitle] = useState('');
  const [gNotes, setGNotes] = useState('');

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
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (!days.includes(d.getDate())) days.push(d.getDate());
      }
    });

    journals.forEach(j => {
      const d = new Date(j.journal_date || j.created_at);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (!days.includes(d.getDate())) days.push(d.getDate());
      }
    });

    setActiveDays(days);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: wordsData } = await supabase.from('words').select('*').order('created_at', { ascending: false });
      const currentWords = wordsData || [];
      setCustomWords(currentWords);

      const { data: grammarData } = await supabase.from('grammar_topics').select('*').order('unit_number', { ascending: true });
      setGrammarTopics(grammarData || []);

      const { data: journalsData } = await supabase.from('journals').select('*').order('created_at', { ascending: false });
      setJournalEntries(journalsData || []);

      const { data: goalsData } = await supabase.from('goals').select('*').order('created_at', { ascending: true });
      setWeeklyGoals(goalsData || []);

      const { data: oxfordData } = await supabase.from('oxford_words').select('*').order('word', { ascending: true });
      setOxfordWords(oxfordData || []);

      calculateActiveDays(currentWords, journalsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || !meaning) return;
    try {
      await supabase.from('words').insert([{
        word: word.toLowerCase().trim(), meaning: meaning.trim(),
        v2_form: v2.trim(), v3_form: v3.trim(), example: example.trim(),
        notes: notes.trim(), image_url: imageUrl.trim(), level, 
        difficulty_rating: difficulty, word_type: wordType
      }]);
      setWord(''); setMeaning(''); setV2(''); setV3(''); setExample(''); setNotes(''); setImageUrl('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleAddGrammar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gTitle) return;
    try {
      await supabase.from('grammar_topics').insert([{ unit_number: unitNum, title: gTitle.trim(), notes: gNotes.trim(), status: 'Not Started' }]);
      setGTitle(''); setGNotes(''); setUnitNum(prev => prev + 1);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const updateGrammarStatus = async (id: string, newStatus: 'Not Started' | 'In Progress' | 'Mastered') => {
    try {
      await supabase.from('grammar_topics').update({ status: newStatus }).eq('id', id);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteGrammarTopic = async (id: string) => {
    try {
      await supabase.from('grammar_topics').delete().eq('id', id);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jContent) return;
    try {
      await supabase.from('journals').insert([{ title: jTitle.trim() || 'Untitled Entry', content: jContent.trim(), journal_date: jDate }]);
      setJTitle(''); setJContent('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    try {
      await supabase.from('goals').insert([{ text: newGoalText.trim() }]);
      setNewGoalText('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const toggleGoal = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from('goals').update({ completed: !currentStatus }).eq('id', id);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteGoal = async (id: string) => {
    try {
      await supabase.from('goals').delete().eq('id', id);
      fetchData();
    } catch (err) { console.error(err); }
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

  // İstatistiksel Veriler
  const totalWordsCount = customWords.filter(w => w.word_type !== 'Phrase').length;
  const totalPhrasesCount = customWords.filter(w => w.word_type === 'Phrase').length;
  const totalGrammarCount = grammarTopics.length;
  const masteredGrammarCount = grammarTopics.filter(g => g.status === 'Mastered').length;

  const levelCounts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
customWords.forEach(w => { 
  if (w.level && levelCounts[w.level] !== undefined) {
    levelCounts[w.level]++; 
  }
});

  const filteredAlphabeticalWords = [...customWords]
    .filter(w => w.word.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.word.localeCompare(b.word));

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

        {/* 📊 YENİ MÜSTAKİL SEKME: PERFORMANCE DASHBOARD (KOCAMAN KUTULAR) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Üst Sıra: Dev İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-[#130c25] border border-[#231742] p-8 rounded-2xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] min-h-[160px] relative overflow-hidden group hover:border-[#06b6d4]/50 transition-all">
                <div className="space-y-2">
                  <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block">Total Learned Words</span>
                  <span className="text-5xl font-black text-[#06b6d4] block font-mono tracking-tight">{totalWordsCount}</span>
                  <span className="text-[10px] text-gray-500 block font-sans">Sisteme işlenen toplam anahtar kelime nodes.</span>
                </div>
                <BookOpen size={48} className="text-[#1c1435] group-hover:text-[#06b6d4]/10 transition-colors absolute right-6 top-1/2 -translate-y-1/2" />
              </div>

              <div className="bg-[#130c25] border border-[#231742] p-8 rounded-2xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] min-h-[160px] relative overflow-hidden group hover:border-[#a855f7]/50 transition-all">
                <div className="space-y-2">
                  <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block">Phrases & Chunks</span>
                  <span className="text-5xl font-black text-[#a855f7] block font-mono tracking-tight">{totalPhrasesCount}</span>
                  <span className="text-[10px] text-gray-500 block font-sans">Günlük dilde ezberlenen kalıp öbekleri.</span>
                </div>
                <Target size={48} className="text-[#1c1435] group-hover:text-[#a855f7]/10 transition-colors absolute right-6 top-1/2 -translate-y-1/2" />
              </div>

              <div className="bg-[#130c25] border border-[#231742] p-8 rounded-2xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] min-h-[160px] relative overflow-hidden group hover:border-[#ec4899]/50 transition-all">
                <div className="space-y-2">
                  <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block">Red Book Progress</span>
                  <span className="text-5xl font-black text-[#ec4899] block font-mono tracking-tight">{masteredGrammarCount} <span className="text-xl text-gray-600">/ {totalGrammarCount}</span></span>
                  <span className="text-[10px] text-gray-500 block font-sans">Grammar in Use kitabında biten üniteler.</span>
                </div>
                <GraduationCap size={48} className="text-[#1c1435] group-hover:text-[#ec4899]/10 transition-colors absolute right-6 top-1/2 -translate-y-1/2" />
              </div>

            </div>

            {/* Alt Sıra: Kocaman CEFR Seviye Matrisi Çizelgesi */}
            <div className="bg-[#130c25] border border-[#231742] p-8 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 border-b border-[#1c1236] pb-4">
                <Layers className="text-[#06b6d4]" size={18} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">CEFR LEVEL CAPACITY MATRIX (Kelime Dağılım Grafiği)</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-2">
                {Object.entries(levelCounts).map(([lvl, count]) => {
                  const maxCount = Math.max(...Object.values(levelCounts), 1);
                  const barHeight = count > 0 ? `${(count / maxCount) * 100}%` : '4px';
                  
                  return (
                    <div key={lvl} className="bg-[#0d071a] border border-[#1c1236] p-6 rounded-xl flex flex-col items-center justify-between min-h-[180px] relative group">
                      <span className="text-xs font-black text-gray-400 tracking-wider bg-[#130c25] px-2 py-0.5 rounded border border-[#231742]">{lvl} LEVEL</span>
                      
                      {/* Küçük Siber Bar Sütunu */}
                      <div className="w-full bg-[#130c25] h-12 rounded-md overflow-hidden relative flex items-end px-1 border border-[#1c1236]">
                        <div 
                          style={{ height: barHeight }} 
                          className="w-full bg-gradient-to-t from-[#29174f] to-[#06b6d4] rounded-sm shadow-[0_0_8px_#06b6d4/30] transition-all duration-500"
                        />
                      </div>

                      <span className="text-3xl font-black text-white font-mono mt-2">{count} <span className="text-[10px] text-gray-500 font-sans font-normal block text-center">Nodes</span></span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* SEKME 2: KELİME GİRİŞİ */}
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

        {/* SEKME 3: GRAMMAR MODÜLÜ */}
        {activeTab === 'grammar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#130c25] border border-[#231742] rounded-xl p-6 h-fit lg:col-span-1">
              <h3 className="text-xs font-bold uppercase text-[#ec4899] mb-4 flex items-center gap-2"><GraduationCap size={14}/> Ingest Grammar Unit</h3>
              <form onSubmit={handleAddGrammar} className="space-y-4">
                <div>
                  <label className="block text-[9px] text-gray-400 mb-1">UNIT NUMBER</label>
                  <input type="number" required value={unitNum} onChange={e => setUnitNum(Number(e.target.value))} className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 mb-1">TOPIC TITLE</label>
                  <input type="text" required value={gTitle} onChange={e => setGTitle(e.target.value)} placeholder="Örn: Present Continuous" className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 mb-1">UNIT SUMMARY / GRAMMAR NOTES</label>
                  <textarea value={gNotes} onChange={e => setGNotes(e.target.value)} placeholder="Formüller, yapılar..." rows={6} className="w-full bg-[#0d071a] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none font-sans" />
                </div>
                <button type="submit" className="w-full bg-[#ec4899] text-white text-xs py-2.5 rounded-lg font-bold">DEPLOY_UNIT_NODE</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#130c25] border border-[#231742] rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-[#06b6d4] tracking-wider uppercase">📕 RED_BOOK_GRAMMAR_IN_USE_MATRIX</h3>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {grammarTopics.map((topic) => {
                  const isExpanded = expandedGrammarId === topic.id;
                  return (
                    <div key={topic.id} className="bg-[#0d071a] border border-[#1c1236] rounded-xl overflow-hidden transition-all">
                      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-[#110a22]/50 transition-colors">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#130c25] text-[#ec4899] mt-0.5">Unit {topic.unit_number}</span>
                          <div>
                            <h4 className="text-xs font-bold text-white">{topic.title}</h4>
                            {topic.notes && (
                              <button onClick={() => setExpandedGrammarId(isExpanded ? null : topic.id)} className="text-[9px] text-[#06b6d4] hover:underline mt-1 flex items-center gap-1 font-sans">
                                {isExpanded ? <><ChevronUp size={10}/> Notu Gizle</> : <><ChevronDown size={10}/> Ders Notunu Gör</>}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 bg-[#130c25] p-1 rounded border border-[#231742] text-[8px] font-bold">
                            {(['Not Started', 'In Progress', 'Mastered'] as const).map((st) => (
                              <button key={st} type="button" onClick={() => updateGrammarStatus(topic.id, st)} className={`px-2 py-1 rounded transition-all ${topic.status === st ? st === 'Mastered' ? 'bg-emerald-500 text-white' : st === 'In Progress' ? 'bg-amber-500 text-black' : 'bg-rose-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}>{st.toUpperCase()}</button>
                            ))}
                          </div>
                          <button onClick={() => deleteGrammarTopic(topic.id)} className="text-gray-600 hover:text-rose-500 p-1.5 transition-colors"><Trash2 size={13}/></button>
                        </div>
                      </div>
                      {isExpanded && topic.notes && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#1c1236]/60 bg-[#120a21]/20">
                          <span className="text-[8px] text-gray-500 uppercase tracking-widest block mb-1">Ders Notları</span>
                          <p className="text-xs text-gray-300 bg-[#130c25]/60 p-3 rounded-lg border border-[#1c1236] whitespace-pre-wrap leading-relaxed font-sans font-medium">{topic.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ALFABETİK DEPO */}
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

        {/* OXFORD CORE */}
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

        {/* QUIZ */}
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

        {/* JOURNAL */}
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

        {/* GOALS */}
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
                  <div key={goal.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${goal.completed ? 'bg-[#101c24] border-emerald-500/20 text-emerald-400' : 'bg-[#181130] border-[#251a4a] text-gray-300'}`}>
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