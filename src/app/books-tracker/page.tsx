'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

export default function BooksTracker() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [units, setUnits] = useState<any[]>([]);
  
  // Akordeon mantığı için: Hangi ünitenin açık olduğunu tutan state
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Yeni ünite ekleme form state'leri
  const [unitNumber, setUnitNumber] = useState('');
  const [unitTitle, setUnitTitle] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    async function initBooks() {
      const { data } = await supabase.from('books').select('*');
      if (data && data.length > 0) {
        setBooks(data);
        setSelectedBook(data[0].id);
      } else {
        const { data: newBook } = await supabase.from('books').insert([
          { title: 'Essential Grammar in Use', category: 'grammar' }
        ]).select();
        if (newBook) {
          setBooks(newBook);
          setSelectedBook(newBook[0].id);
        }
      }
    }
    initBooks();
  }, []);

  const fetchUnits = async () => {
    if (!selectedBook) return;
    const { data } = await supabase.from('book_units')
      .select(`*, user_progress(is_completed, notes)`)
      .eq('book_id', selectedBook)
      .order('unit_number', { ascending: true });
    if (data) setUnits(data);
  };

  useEffect(() => { fetchUnits(); }, [selectedBook]);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber || !unitTitle) return alert('Lütfen ünite numarası ve başlığını girin!');

    const { error } = await supabase.from('book_units').insert([
      {
        book_id: selectedBook,
        unit_number: parseInt(unitNumber),
        title: unitTitle,
        section_name: sectionName || 'General'
      }
    ]);

    if (!error) {
      setUnitNumber('');
      setUnitTitle('');
      setSectionName('');
      setShowAddForm(false);
      fetchUnits();
    }
  };

  const handleToggleTick = async (unitId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Ünitenin genişleme mekanizmasını tetiklemesin diye durduruyoruz
    const newStatus = !currentStatus;
    const { error } = await supabase.from('user_progress').upsert(
      { unit_id: unitId, is_completed: newStatus },
      { onConflict: 'unit_id' }
    );
    if (!error) fetchUnits();
  };

  const handleSaveNote = async (unitId: string) => {
    await supabase.from('user_progress').upsert(
      { unit_id: unitId, notes: noteText },
      { onConflict: 'unit_id' }
    );
    alert('Notların başarıyla kaydedildi, Aslı!');
    fetchUnits();
  };

  const toggleExpand = (unit: any) => {
    if (expandedUnitId === unit.id) {
      setExpandedUnitId(null);
    } else {
      setExpandedUnitId(unit.id);
      setNoteText(unit.user_progress?.notes || '');
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen flex flex-col gap-6 max-w-4xl mx-auto">
      {/* BAŞLIK VE EKLEME BUTONU */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-400">Essential Grammar in Use</h1>
          <p className="text-xs text-slate-400 mt-1">Çalıştığın üniteleri ekle, tikle ve notlarını tut.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm"
        >
          {showAddForm ? 'Formu Kapat' : '+ Yeni Ünite Ekle'}
        </button>
      </div>

      {/* BÜYÜYEN YENİ ÜNİTE EKLEME FORMU */}
      {showAddForm && (
        <form onSubmit={handleAddUnit} className="bg-slate-800 p-5 rounded-2xl flex flex-col gap-4 border border-indigo-500/30 animate-fade-in shadow-xl">
          <h3 className="text-sm font-bold text-slate-300">Ünite Detayları</h3>
          <div className="grid grid-cols-3 gap-3">
            <input 
              type="number" placeholder="Ünite No (Örn: 1)" value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="bg-slate-700 p-3 rounded-xl text-white border border-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
            />
            <input 
              type="text" placeholder="Ünite Başlığı (Örn: am/is/are)" value={unitTitle}
              onChange={(e) => setUnitTitle(e.target.value)}
              className="bg-slate-700 p-3 rounded-xl col-span-2 text-white border border-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>
          <input 
            type="text" placeholder="Grup/Bölüm İsmi (Örn: Present, Past, Modals)" value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            className="bg-slate-700 p-3 rounded-xl text-white border border-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
          />
          <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition text-sm shadow-lg shadow-green-600/10">
            Üniteyi Kitaba Ekle
          </button>
        </form>
      )}

      {/* AKORDEON ÜNİTE LİSTESİ */}
      <div className="flex flex-col gap-3">
        {units.length === 0 ? (
          <div className="text-slate-500 text-center py-12 border border-dashed border-slate-800 rounded-2xl text-sm">
            Henüz hiç ünite eklememişsin Aslı. Sağ üstteki butondan ilk konunu ekleyebilirsin!
          </div>
        ) : (
          units.map(u => {
            const isCompleted = u.user_progress?.is_completed || false;
            const isExpanded = expandedUnitId === u.id;

            return (
              <div key={u.id} className="bg-slate-800 rounded-xl border border-slate-800 overflow-hidden transition shadow-sm">
                {/* ÜNİTE SATIRI */}
                <div 
                  onClick={() => toggleExpand(u)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition select-none ${isExpanded ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'}`}
                >
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      checked={isCompleted}
                      onChange={(e) => handleToggleTick(u.id, isCompleted, e)}
                      className="w-5 h-5 cursor-pointer accent-green-500 rounded"
                    />
                    <span className={`font-semibold ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      Unit {u.unit_number}: {u.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-slate-900 px-3 py-1 rounded-full text-slate-400 font-mono">{u.section_name}</span>
                    <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* GENİŞLEYEN NOT ALANI */}
                {isExpanded && (
                  <div className="p-4 bg-slate-800/80 border-t border-slate-700/40 flex flex-col gap-3 animate-slide-down">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Bu üniteye ait özel formülleri, kuralları ve çalışma özetlerini buraya yazabilirsin..."
                      className="w-full h-40 bg-slate-700 p-4 rounded-xl text-white resize-none border border-slate-600 focus:outline-none focus:border-indigo-500 text-sm line-height-6"
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleSaveNote(u.id)}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition text-xs shadow-md"
                      >
                        Notu Güncelle ve Kaydet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}