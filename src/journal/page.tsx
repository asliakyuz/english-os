'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PenTool, Calendar, HelpCircle, RefreshCw } from 'lucide-react';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  referred_question: string;
  created_at: string;
}

// Çiziminde bahsettiğin o 10 random sorudan oluşan havuzumuz
const DAILY_QUESTIONS = [
  "What is the best thing that happened to you today?",
  "If you could travel anywhere right now, where would you go and why?",
  "Describe your current mood using three English adjectives.",
  "What is a goal you want to achieve by the end of this week?",
  "What did you learn in your English studies today?",
  "Write about a movie or book that recently inspired you.",
  "What is your favorite memory from your childhood?",
  "If you had a superpower for one day, what would it be?",
  "What are you grateful for today?",
  "Describe your perfect dream house."
];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form durumları
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');

  // Rastgele Soru Seçme Fonksiyonu
  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * DAILY_QUESTIONS.length);
    setCurrentQuestion(DAILY_QUESTIONS[randomIndex]);
  };

  // Günlükleri Veri Tabanından Çekme
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    getRandomQuestion(); // Sayfa ilk açıldığında rastgele soru doğurur
  }, []);

  // Yeni Günlük Kaydetme
  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    try {
      const { error } = await supabase.from('journals').insert([
        {
          title: title.trim() || 'Untitled Entry',
          content: content.trim(),
          referred_question: currentQuestion
        }
      ]);

      if (error) throw error;

      // Formu temizle
      setTitle('');
      setContent('');
      getRandomQuestion(); // Yeni yazı sonrası yeni soru getir
      fetchEntries(); // Listeyi yenile
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Başlık */}
      <div className="border-b border-[#231742] pb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent tracking-widest">
          ENGLISH_OS // JOURNAL_WORKSPACE
        </h1>
        <p className="text-xs text-gray-400 mt-1">Düşüncelerini özgürce İngilizceye dök. Yapay zeka analizine hazır altyapı.</p>
      </div>

      {/* Çizimindeki Örnek Günün Sorusu Paneli */}
      <div className="bg-[#130c25] border border-[#231742] rounded-xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <HelpCircle size={80} className="text-[#06b6d4]" />
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-[#06b6d4] font-bold tracking-wider uppercase flex items-center gap-1.5">
            <HelpCircle size={12} /> RANDOM_DAILY_QUESTION
          </span>
          <button 
            onClick={getRandomQuestion}
            className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
          >
            <RefreshCw size={10} /> NEXT_QUESTION
          </button>
        </div>
        <p className="text-sm text-gray-200 italic font-sans font-medium">"{currentQuestion}"</p>
      </div>

      {/* Yazma ve Depolama Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sol 2 Sütun: Yazma Editörü */}
        <div className="lg:col-span-2 bg-[#130c25] border border-[#231742] rounded-xl p-6">
          <h3 className="text-xs font-bold uppercase text-[#a855f7] mb-4 flex items-center gap-2">
            <PenTool size={14} /> Ingest Daily Thoughts
          </h3>
          <form onSubmit={handleSaveJournal} className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">ENTRY TITLE (OPTIONAL)</label>
              <input 
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g., A Rainy Reflection..." 
                className="w-full bg-[#1c1236] border border-[#2d1e56] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#a855f7]" 
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">WRITE IN ENGLISH</label>
              <textarea 
                required value={content} onChange={e => setContent(e.target.value)}
                placeholder="Today, I spent my time studying computer science..." 
                rows={10} 
                className="w-full bg-[#1c1236] border border-[#2d1e56] rounded-lg px-3 py-3 text-xs text-white font-sans focus:outline-none focus:border-[#06b6d4] resize-none leading-relaxed" 
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-[#a855f7] to-[#06b6d4] text-white text-xs py-2.5 rounded-lg font-bold hover:opacity-90 transition-all">
              SECURE_LOG_TO_DATABASE
            </button>
          </form>
        </div>

        {/* Sağ Sütun: Geçmiş Günlük Arşivi */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <Calendar size={14} /> Archived Logs ({entries.length})
          </h3>
          
          {loading ? (
            <p className="text-xs text-gray-500 animate-pulse">CONNECTING_TO_JOURNAL_NODES...</p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-gray-600 border border-dashed border-[#231742] p-4 rounded-xl text-center">NO_LOGS: Henüz bir şey yazılmadı.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-[#130c25] border border-[#231742] p-4 rounded-xl hover:border-[#06b6d4] transition-all">
                  <div className="flex justify-between items-center border-b border-[#1c1236] pb-2 mb-2">
                    <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{entry.title}</h4>
                    <span className="text-[9px] text-[#a855f7]">
                      {new Date(entry.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-sans line-clamp-3 leading-relaxed mb-2">
                    {entry.content}
                  </p>
                  {entry.referred_question && (
                    <p className="text-[9px] text-gray-500 italic border-t border-[#1c1236] pt-1.5 truncate">
                      Q: {entry.referred_question}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}