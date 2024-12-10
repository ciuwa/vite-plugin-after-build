export interface ViteAfterBuildPluginOptions {
  // 选项1：自动更新版本号
  updateVersion?: {
    enable?: boolean;
    threshold: number;
  };
  gitCommit?: GitCommitOptions;
  ftpUpload?: FtpUploadOptions
};

export interface FtpUploadOptions {
  enable: boolean;
  host: string;
  user: string;
  password: string;
  secure: boolean;
  localPath: string;
  remotePath: string;
  verbose?: boolean;
}

export interface GitCommitOptions {
  enable?: boolean;
  push?: boolean;
  tag?: boolean;
}  