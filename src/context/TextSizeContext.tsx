import { createContext, useContext, useEffect, useState } from 'react';
import { getLargeText, setLargeText as saveLargeText } from '@/utils/storage';

type TextSizeContextType = {
    largeText: boolean;
    fontScale: number;
    toggleLargeText: (value: boolean) => Promise<void>;
};

const TextSizeContext = createContext<TextSizeContextType>({
    largeText: false,
    fontScale: 1,
    toggleLargeText: async () => {},
});

export function TextSizeProvider({ children }: { children: React.ReactNode }) {
    const [largeText, setLargeText] = useState(false);

    useEffect(() => {
        getLargeText().then(setLargeText);
    }, []);

    const toggleLargeText = async (value: boolean) => {
        setLargeText(value);
        await saveLargeText(value);
    };

    return (
        <TextSizeContext.Provider value={{
            largeText,
            fontScale: largeText ? 1.5 : 1,
            toggleLargeText,
        }}>
            {children}
        </TextSizeContext.Provider>
    );
}

export function useTextSize() {
    return useContext(TextSizeContext);
}