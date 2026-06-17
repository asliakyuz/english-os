'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

export default function BooksTracker() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [units, setUnits] = useState<any[]>([]);
  const [activeUnit, setActiveUnit] = useState<any>(null);
  const [noteText, setNoteText] = useState<string>('');

  useEffect(() => {
    // 1. Sistemdeki kitapları çek (Grammar, Vocab hepsi buraya dinamik gelir!)
    supabase.from('books').select('*').then(({ data }) => {
      if (data) {
        setBooks(data);
        if (data.length > 0) setSelectedBook(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedBook) return;
    // 2. Seçili kitabın ünitelerini ve senin ilerleme (tik/not) durumunu çek
    supabase.from('book_units')
      .select(`*, user_progress(is_completed, notes)`)
      .eq('book_id', selectedBook)
      .order('unit_number', { ascending: true })
      .then(({ data }) => { if (data) setUnits(data); });
  }, [selectedBook]);

  const handleToggleTick = async (unitId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase.from('user_progress').upsert(
      { unit_id: unitId, is_completed: newStatus },
      { onConflict: 'unit_id' }
    );
    // Sayfayı anlık güncelle
    if (!error) {
      setUnits(units.map(u => u.id === unitId ? { ...u, user_progress: { ...u.user_progress, is_completed: newStatus } } : u));
    }
  };

  const handleSaveNote = async () => {
    if (!activeUnit) return;
    await supabase.from('user_progress').upsert(
      { unit_id: activeUnit.id, notes: noteText },
      { onConflict: 'unit_id' }
    );
    alert('Not başarıyla kaydedildi, Aslı!');
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white p-6 gap-6">
      {/* SOL SÜTUN: Üniteler ve Seçim */}
      <div className="w-1/2 bg-slate-800 p-4 rounded-xl flex flex-col gap-4 overflow-y-auto">
        <select 
          value={selectedBook} 
          onChange={(e) => setSelectedBook(e.target.value)}
          className="bg-slate-700 p-2 rounded text-white font-bold"
        >
          {books.map(b => <option key={b.id} value={b.id}>{b.title} ({b.category})</option>)}
        </select>

        <div className="flex flex-col gap-2">
          {units.map(u => {
            const isCompleted = u.user_progress?.is_completed || false;
            return (
              <div 
                key={u.id} 
                onClick={() => { setActiveUnit(u); setNoteText(u.user_progress?.notes || ''); }}
                className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition ${activeUnit?.id === u.id ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={isCompleted}
                    onChange={() => handleToggleTick(u.id, isCompleted)}
                    className="w-5 h-5 cursor-pointer accent-green-500"
                  />
                  <span>Unit {u.unit_number}: {u.title}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">{u.section_name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SAĞ SÜTUN: Not Defteri */}
      <div className="w-1/2 bg-slate-800 p-6 rounded-xl flex flex-col gap-4">
        {activeUnit ? (
          <>
            <h2 className="text-xl font-bold border-b border-slate-700 pb-2">
              Unit {activeUnit.unit_number} - Çalışma Notları
            </h2>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Bu üniteyle ilgili formülleri, kuralları veya kelime eşleşmelerini buraya yazabilirsin..."
              className="w-full flex-1 bg-slate-700 p-4 rounded-lg text-white resize-none border border-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button 
              onClick={handleSaveNote}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition"
            >
              Değişiklikleri Kaydet
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Not defterini açmak için soldan bir ünite seç.
          </div>
        )}
      </div>
    </div>
  );
}