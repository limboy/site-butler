import { useState, useEffect, useCallback } from "react";

export function useStorage<T>(
  key: string,
  defaultValue: T
): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    chrome.storage.sync.get(key).then((data) => {
      if (data[key] !== undefined) {
        setValue(data[key] as T);
      }
    });

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === "sync" && changes[key]) {
        setValue(changes[key].newValue as T);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key]);

  const setter = useCallback(
    (val: T) => {
      setValue(val);
      chrome.storage.sync.set({ [key]: val });
    },
    [key]
  );

  return [value, setter];
}
