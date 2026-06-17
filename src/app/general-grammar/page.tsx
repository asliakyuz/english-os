'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

export default function GeneralGrammar() {
  const [topics, setTopics] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');

  const fetchTopics = () => {
    supabase.from('general_grammar').select('*').order('sort_order', { ascending: true }).then(({ data }) => {
      if (data) setTopics(data);
    });
  };

  useEffect(() => { fetchTopics(); }, []);

  const handleAddTopic = async () => {
    if (!newTitle.trim()) return;
    await supabase.from('general_grammar').insert([{ title: newTitle }]);
    setNewTitle('');
    fetchTopics();
  };

  const handleUpdateContent = async (id: string, content: string) => {
    await supabase.from('general_grammar').update({ content }).eq('id', id);
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen flex flex-col gap-6">
      <h1 className="text-2xl font-bold border-b border-slate-700 pb-2 text-indigo-400">Genel Gramer Çalışmaları</h1>
      
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Yeni Genel Konu Başlığı (Örn: Inversion, Relative Clauses)"
          className="bg-slate-800 p-2 rounded flex-1 border border-slate-700 focus:outline-none focus:border-indigo-500 text-white"
        />
        <button onClick={handleAddTopic} className="bg-indigo-600 px-5 py-2 rounded hover:bg-indigo-500 font-bold transition">
          Konu Aç
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {topics.map((topic, index) => (
          <div key={topic.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
            <h3 className="text-lg font-bold text-green-400">{index + 1}. {topic.title}</h3>
            <textarea
              defaultValue={topic.content}
              onBlur={(e) => handleUpdateContent(topic.id, e.target.value)}
              placeholder="Bu konunun özetini, kurallarını buraya yaz ve boşluğa tıkla... (Otomatik kaydedilir)"
              className="w-full h-36 bg-slate-700 p-3 rounded text-white resize-none border border-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}