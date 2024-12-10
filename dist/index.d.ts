import { Plugin } from 'vite';

interface ViteAfterBuildPluginOptions {
    updateVersion?: {
        enable?: boolean;
        threshold: number;
    };
    gitCommit?: GitCommitOptions;
    ftpUpload?: FtpUploadOptions;
}
interface FtpUploadOptions {
    enable: boolean;
    host: string;
    user: string;
    password: string;
    secure: boolean;
    localPath: string;
    remotePath: string;
    verbose?: boolean;
}
interface GitCommitOptions {
    enable?: boolean;
    push?: boolean;
    tag?: boolean;
}

declare function autoVersionPlugin(options?: ViteAfterBuildPluginOptions): Plugin;

export { autoVersionPlugin as default };
