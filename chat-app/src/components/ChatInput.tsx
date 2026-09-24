import { useState, useRef } from 'react';
import { Plus, Paperclip, Mic, Edit3, Copy, GitBranch, Trash2, X, Check } from 'lucide-react';

export default function ChatInput({ onSend }: { onSend: (text: string, attachments?: File[]) => void }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() && files.length === 0) return;
    onSend(text, files);
    setText('');
    setFiles([]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      {files.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
              {f.name} <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="hover:text-red-500"><X size={12}/></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <button onClick={() => {}} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500" title="Mais opções" aria-label="Mais opções"><Plus size={20}/></button>
        <button onClick={() => fileRef.current?.click()} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500" title="Anexar arquivo ou imagem" aria-label="Anexar arquivo ou imagem"><Paperclip size={20}/></button>
        <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.txt,.md" className="hidden" onChange={e => { if (e.target.files) setFiles([...files, ...Array.from(e.target.files)]); }} />
        <button onClick={() => {}} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500" title="Gravar áudio" aria-label="Gravar áudio"><Mic size={20}/></button>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
          className="flex-1 resize-none min-h-[44px] max-h-[120px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          rows={1}
        />
        <button onClick={handleSend} disabled={!text.trim() && files.length === 0} className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40">Enviar</button>
      </div>
    </div>
  );
}
