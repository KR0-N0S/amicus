import { useEffect } from 'react';

function useOutsideClick(ref, callback) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }

    // Dodanie nasłuchiwacza zdarzenia
    document.addEventListener("mousedown", handleClickOutside);
    
    // Usunięcie nasłuchiwacza przy demontowaniu komponentu
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

export default useOutsideClick;
