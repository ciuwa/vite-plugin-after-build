export interface ViteAfterBuildPluginOptions {
  // 选项1：自动更新版本号
  updateVersion?: {
    enable?: boolean;
    threshold: number;
  };
  gitCommit?: {
    enable?: boolean;
    push?: boolean;
  };
  ftpUpload?: {
    enable: boolean;
    host: string;
    user: string,
    password: string,
    localPath: string,
    remotePath: string,
    secure?: boolean
  }
};
}
