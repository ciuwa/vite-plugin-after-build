import { Plugin } from 'vite';

interface AutoVersionPluginOptions {
    threshold?: number;
    disabled?: boolean;
}

declare function autoVersionPlugin(options?: AutoVersionPluginOptions): Plugin;

export { autoVersionPlugin as default };
