import React from 'react';
import { BookmarkCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const norm = String(status || '').trim().toLowerCase();

  if (norm === 'activo' || norm === 'completado' || norm === 'pagado') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        {status}
      </span>
    );
  }

  if (norm === 'apartado') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-700 shadow-2xs">
        <BookmarkCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        Apartado
      </span>
    );
  }

  if (norm === 'pendiente') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        Pendiente
      </span>
    );
  }

  if (norm === 'cancelado' || norm === 'inactivo' || norm === 'agotado') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
      {status || 'Desconocido'}
    </span>
  );
}
