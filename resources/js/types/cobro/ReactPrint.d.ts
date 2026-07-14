declare module 'react-print' {
    import { RefObject } from 'react';

    interface UseReactToPrintOptions {
        contentRef: RefObject<HTMLElement | null>;
        pageStyle?: string;
        onBeforeGetContent?: () => Promise<void>;
        onAfterPrint?: () => void;
        onPrintError?: (error: any) => void;
        removeAfterPrint?: boolean;
    }

    function useReactToPrint(options: UseReactToPrintOptions): () => void;

    export default useReactToPrint;
}