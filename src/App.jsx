import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase'; // 确保路径对应你刚才创建的文件
import { BookOpen, Search, Plus, Trash2, RotateCcw, CheckCircle } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 新书表单状态
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '' });

  // 1. 获取图书列表 (读取 Supabase 数据库)
  const fetchBooks = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching books:', error);
    else setBooks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // 2. 添加图书
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) return;

    // 插入数据
    const { error } = await supabase.from('books').insert([{
      ...newBook,
      // 这里的随机封面用了 unsplash 的图床，确保演示时好看
      cover_url: `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&q=80` 
    }]);

    if (!error) {
      setNewBook({ title: '', author: '', isbn: '' });
      setIsModalOpen(false);
      fetchBooks(); // 刷新列表
    } else {
      alert('添加失败: ' + error.message);
    }
  };

  // 3. 借阅/归还逻辑
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'borrowed' : 'available';
    const { error } = await supabase.from('books').update({ status: newStatus }).eq('id', id);
    if (!error) fetchBooks();
  };

  // 4. 删除图书
  const deleteBook = async (id) => {
    if(!confirm('确定要删除这本书吗？')) return;
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (!error) fetchBooks();
  };

  // 前端过滤逻辑 (搜索功能)
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* 顶部导航栏 */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/30">
            <BookOpen size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">ProLibrary <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2">v2.0</span></h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 flex items-center gap-2 shadow-xl"
        >
          <Plus size={18} />
          入库新书
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 搜索栏 */}
        <div className="relative mb-10 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="搜索书名、作者..."
            className="w-full pl-12 pr-4 py-4 bg-white border-0 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 图书列表区域 */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">正在连接云端数据库...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredBooks.map(book => (
              <div key={book.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col">
                <div className="h-48 overflow-hidden relative bg-gray-100">
                  {/* 状态标签 */}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${
                    book.status === 'available' 
                      ? 'bg-green-500/90 text-white shadow-green-500/30' 
                      : 'bg-orange-500/90 text-white shadow-orange-500/30'
                  } shadow-lg z-10`}>
                    {book.status === 'available' ? '可借阅' : '已借出'}
                  </div>
                  {/* 书籍封面 */}
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                     {/* 如果有封面图就显示，没有就显示占位色块 */}
                     {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                     ) : (
                        <BookOpen size={48} />
                     )}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1" title={book.title}>{book.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">By {book.author}</p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => toggleStatus(book.id, book.status)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        book.status === 'available'
                          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                      }`}
                    >
                      {book.status === 'available' ? <><CheckCircle size={16}/> 借书</> : <><RotateCcw size={16}/> 还书</>}
                    </button>
                    <button 
                      onClick={() => deleteBook(book.id)}
                      className="ml-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 弹窗：入库新书 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 transform transition-all scale-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">入库新书</h2>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">书名</label>
                <input required className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
                <input required className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">取消</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gray-900 text-white hover:bg-black rounded-lg transition-colors shadow-lg">确认入库</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}