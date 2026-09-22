import { useEffect, useState } from 'react';

type Estado = { message: string; region: string } | 'cargando' | 'error';

export function App() {
  const [estado, setEstado] = useState<Estado>('cargando');

  useEffect(() => {
    fetch('/api/hello')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setEstado)
      .catch(() => setEstado('error'));
  }, []);

  return (
    <main>
      <h1>Rumbo a Casa</h1>
      {estado === 'cargando' && <p>Conectando con el servidor…</p>}
      {estado === 'error' && <p>No se pudo conectar con el servidor.</p>}
      {typeof estado === 'object' && (
        <p>
          {estado.message} (región: {estado.region})
        </p>
      )}
    </main>
  );
}
