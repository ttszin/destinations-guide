// Importa o StrictMode do React, que ajuda a encontrar problemas comuns no app (funciona apenas em desenvolvimento)
import { StrictMode } from 'react';
// Importa a função createRoot, que é a nova forma de renderizar o React a partir da versão 18
import { createRoot } from 'react-dom/client';
// Importa os estilos CSS globais (coisas que afetam o 'body', 'html', etc.)
import './index.css';
// Importa o componente principal da nossa aplicação
import App from './App.tsx';

// 1. Encontra o elemento HTML com o ID 'root' no seu index.html
// 2. Cria uma "raiz" de renderização do React nesse elemento
createRoot(document.getElementById('root')!).render(
  // StrictMode ativa verificações adicionais e avisos para seus componentes
  <StrictMode>
    {/* Renderiza o componente 'App' dentro do StrictMode, que é o ponto de partida de toda a sua UI */}
    <App />
  </StrictMode>
);
