export interface AutoVersionPluginOptions {
  // 如果 patch > threshold 则 增加minorthreshold 默认为 100 （major, minor, patch）
  threshold?: number;
  disabled?: boolean;
}