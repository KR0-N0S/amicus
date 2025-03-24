import { useState, useEffect } from 'react';

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Dodanie nasłuchiwacza zdarzenia
    window.addEventListener("resize", handleResize);
    
    // Wywołanie funkcji handleResize, aby ustawić początkowy rozmiar
    handleResize();
    
    // Usunięcie nasłuchiwacza przy demontowaniu komponentu
    return () => window.removeEventListener("resize", handleResize);
  }, []); 

  return windowSize;
}

export default useWindowSize;
