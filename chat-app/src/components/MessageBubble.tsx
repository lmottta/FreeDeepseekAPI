import { useState } from 'react';
import { Edit3, Copy, GitBranch, Trash2, Check, X, MoreVertical } from 'lucide-react';

export default function MessageBubble({ role, text, onFork, onCopy, onEdit, onDelete }: { role: 'user' | 'assistant'; text: string; onFork: () => void; onCopy: () => void; onEdit: () => void; onDelete: () => void }) {
  const [editMode, setEditMode] = useState(false);
  const [edited, setEdited] = useState(text);

  const isMe = role === 'user';

  return (
    <div className={`group flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-tl-sm'}`}>
        <div className="font-medium text-xs mb-1 opacity-70">{isMe ? 'Você' : 'Assistente'}</div>
        {editMode ? (
          <textarea
            value={edited}
            onChange={e => setEdited(e.target.value)}
            className="w-full bg-transparent resize-none text-sm outline-none"
            autoFocus
            rows={2}
          />
        ) : (
          <div className="whitespace-pre-wrap">{text}</div>
        )}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {editMode ? (
            <>
              <button onClick={() => { onEdit(edited); setEditMode(false); }} className="p-1 hover:bg-white/20 rounded" title="Salvar"><Check size={14}/></button>
              <button onClick={() => { setEditMode(false); setEdited(text); }} className="p-1 hover:bg-white/20 rounded" title="Cancelar"><X size={14}/></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(true)} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded" title="Editar"><Edit3 size={14}/></button>
              <button onClick={onCopy} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded" title="Copiar"><Copy size={14}/></button>
              <button onClick={onFork} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded" title="Fork"><GitBranch size={14}/></button>
              <button onClick={onDelete} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500" title="Excluir mensagem"><Trash2 size={14}/></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
