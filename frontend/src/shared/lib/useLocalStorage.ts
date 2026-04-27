import { useCallback, useState } from "react";

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const readValue = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Ошибка при чтении из LS по ключу "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Ошибка при записи в LS по ключу "${key}":`, error);
      }
    },
    [storedValue, key],
  );

  return [storedValue, setValue] as const;
};
