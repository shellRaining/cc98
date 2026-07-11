export type RichContentType = "ubb" | "markdown";

export interface ContentRendererProps {
  content: string;
  type: RichContentType;
  options?: Partial<RichContentOptions>;
}

export interface RichContentOptions {
  allowExternalUrl: boolean;
  allowImage: boolean;
  allowExternalImage: boolean;
  allowMediaContent: boolean;
  allowEmotion: boolean;
  allowEmbeddedMarkdown: boolean;
  allowToolbox: boolean;
  maxImageCount: number;
}
