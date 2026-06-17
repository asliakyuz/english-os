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

  // Yeni ünite ekleme form state'leri
  const [unitNumber, setUnitNumber] = useState('');
  const [unitTitle, setUnitTitle] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Sistemdeki mevcut kitapları çek, eğer kitap yoksa Essential'ı otomatik oluştur
    async function initBooks() {
      const { data } = await supabase.from('books').select('*');
      if (data && data.length > 0) {
        setBooks(data);
        setSelectedBook(data[0].id);
      } else {
        // Eğer veri tabanın bomboşsa ilk kitabı biz başlatalım
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
      fetchUnits(); // Listeyi yenile
    }
  };

  const handleToggleTick = async (unitId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase.from('user_progress').upsert(
      { unit_id: unitId, is_completed: newStatus },
      { onConflict: 'unit_id' }
    );
    if (!error) fetchUnits();
  };

  const handleSaveNote = async () => {
    if (!activeUnit) return;
    await supabase.from('user_progress').upsert(
      { unit_id: activeUnit.id, notes: noteText },
      { onConflict: 'unit_id' }
    );
    alert('Not başarıyla kaydedildi, Aslı!');
    fetchUnits();
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white p-6 gap-6">
      {/* SOL SÜTUN: Üniteler ve Ekleme Formu */}
      <div className="w-1/2 bg-slate-800 p-4 rounded-xl flex flex-col gap-4 overflow-y-auto border border-slate-700">
        <div className="flex justify-between items-center gap-2">
          <select 
            value={selectedBook} 
            onChange={(e) => setSelectedBook(e.target.value)}
            className="bg-slate-700 p-2 rounded text-white font-bold flex-1 focus:outline-none border border-slate-600"
          >
            {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded transition text-sm whitespace-nowrap"
          >
            {showAddForm ? 'Kapat' : '+ Yeni Ünite Ekle'}
          </button>
        </div>

        {/* Yeni Ünite Ekleme Formu */}
        {showAddForm && (
          <form onSubmit={handleAddUnit} className="bg-slate-700 p-4 rounded-lg flex flex-col gap-3 border border-indigo-500/30">
            <div className="flex gap-2">
              <input 
                type="number" placeholder="No (Örn: 1)" value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="bg-slate-800 p-2 rounded w-24 text-white border border-slate-600"
              />
              <input 
                type="text" placeholder="Ünite Başlığı (Örn: am/is/are)" value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                className="bg-slate-800 p-2 rounded flex-1 text-white border border-slate-600"
              />
            </div>
            <input 
              type="text" placeholder="Grup/Bölüm Adı (Örn: Present, Modals)" value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="bg-slate-800 p-2 rounded text-white border border-slate-600"
            />
            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded transition text-sm">
              Üniteyi Sisteme Kaydet
            </button>
          </form>
        )}

        {/* Eklenen Ünitelerin Listesi */}
        <div className="flex flex-col gap-2">
          {units.length === 0 ? (
            <div className="text-slate-400 text-center py-8 text-sm">Henüz ünite eklenmemiş. Yukarıdan ilk üniteni ekleyebilirsin!</div>
          ) : (
            units.map(u => {
              const isCompleted = u.user_progress?.is_completed || false;
              return (
                <div 
                  key={u.id} 
                  onClick={() => { setActiveUnit(u); setNoteText(u.user_progress?.notes || ''); }}
                  className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition ${activeUnit?.id === u.id ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={isCompleted}
                      onChange={() => handleToggleTick(u.id, isCompleted)}
                      className="w-5 h-5 cursor-pointer accent-green-500"
                    />
                    <span className="font-medium">Unit {u.unit_number}: {u.title}</span>
                  </div>
                  <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">{u.section_name}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SAĞ SÜTUN: Not Defteri */}
      <div className="w-1/2 bg-slate-800 p-6 rounded-xl flex flex-col gap-4 border border-slate-700">
        {activeUnit ? (
          <>
            <h2 className="text-xl font-bold border-b border-slate-700 pb-2 text-indigo-400">
              Unit {activeUnit.unit_number} - Ders Özetleri & Notlar
            </h2>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Bu üniteyle ilgili formülleri, istisnaları veya kendi cümlelerini buraya yazabilirsin..."
              className="w-full flex-1 bg-slate-700 p-4 rounded-lg text-white resize-none border border-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button 
              onClick={handleSaveNote}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition"
            >
              Notları Veri Tabanına Kaydet
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Not defterini açmak ve ders özeti yazmak için soldan bir üniteye tıkla.
          </div>
        )}
      </div>
    </div>
  );
}