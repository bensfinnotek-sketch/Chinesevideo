import { LessonScene } from '../../types/lesson';
import { 
  SceneVisualMetadata, 
  VisualAssetType, 
  VisualMode, 
  VisualStyle, 
  VisualGenerationRequest 
} from '../../types/visual';
import { buildSmartVisualPrompt } from './promptBuilder';
import { generateEducationalSvgDataUrl } from './presetArt';

export class VisualEngineService {
  private static instance: VisualEngineService;
  private sceneVisuals: Map<string, SceneVisualMetadata> = new Map();

  private constructor() {}

  public static getInstance(): VisualEngineService {
    if (!VisualEngineService.instance) {
      VisualEngineService.instance = new VisualEngineService();
    }
    return VisualEngineService.instance;
  }

  public getVisualForScene(sceneId: string | number): SceneVisualMetadata | undefined {
    return this.sceneVisuals.get(String(sceneId));
  }

  public getAllVisuals(): Map<string, SceneVisualMetadata> {
    return this.sceneVisuals;
  }

  public setVisualForScene(metadata: SceneVisualMetadata) {
    this.sceneVisuals.set(String(metadata.sceneId), metadata);
  }

  /**
   * Tạo hình ảnh AI hoặc Video AI cho một Scene
   */
  public async generateSceneVisual(req: VisualGenerationRequest): Promise<SceneVisualMetadata> {
    const sceneId = String(req.sceneId);

    // Đánh dấu trạng thái đang sinh
    const initialMeta: SceneVisualMetadata = {
      sceneId,
      visualPrompt: req.visualPrompt,
      assetType: req.assetType,
      duration: req.duration,
      visualMode: req.assetType === 'video' ? 'ai_video' : 'ai_image',
      status: 'generating',
      style: req.style,
      aspectRatio: req.aspectRatio,
      createdAt: Date.now(),
    };
    this.sceneVisuals.set(sceneId, initialMeta);

    try {
      if (req.assetType === 'video') {
        // Veo AI Video generation
        const res = await fetch('/api/visual/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });

        if (!res.ok) {
          throw new Error(`Video API trả về lỗi: ${res.status}`);
        }

        const data = await res.json();
        const completedMeta: SceneVisualMetadata = {
          sceneId,
          visualPrompt: req.visualPrompt,
          assetType: 'video',
          duration: req.duration,
          visualMode: 'ai_video',
          url: data.videoUrl || data.url,
          status: 'ready',
          style: req.style,
          aspectRatio: req.aspectRatio,
          createdAt: Date.now(),
        };
        this.sceneVisuals.set(sceneId, completedMeta);
        return completedMeta;

      } else {
        // Gemini AI Image generation
        const res = await fetch('/api/visual/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            const completedMeta: SceneVisualMetadata = {
              sceneId,
              visualPrompt: req.visualPrompt,
              assetType: 'image',
              duration: req.duration,
              visualMode: 'ai_image',
              url: data.url,
              status: 'ready',
              style: req.style,
              aspectRatio: req.aspectRatio,
              createdAt: Date.now(),
            };
            this.sceneVisuals.set(sceneId, completedMeta);
            return completedMeta;
          }
        }

        // Fallback sang ảnh minh họa sư phạm nghệ thuật
        const fallbackUrl = generateEducationalSvgDataUrl(req.sceneType, req.aspectRatio, req.visualPrompt);
        const fallbackMeta: SceneVisualMetadata = {
          sceneId,
          visualPrompt: req.visualPrompt,
          assetType: 'image',
          duration: req.duration,
          visualMode: 'ai_image',
          url: fallbackUrl,
          status: 'ready',
          style: req.style,
          aspectRatio: req.aspectRatio,
          createdAt: Date.now(),
        };
        this.sceneVisuals.set(sceneId, fallbackMeta);
        return fallbackMeta;
      }
    } catch (err: any) {
      console.warn(`Lỗi khi tạo visual AI cho scene ${sceneId}, dùng preset minh họa:`, err);
      const fallbackUrl = generateEducationalSvgDataUrl(req.sceneType, req.aspectRatio, req.visualPrompt);
      const fallbackMeta: SceneVisualMetadata = {
        sceneId,
        visualPrompt: req.visualPrompt,
        assetType: 'image',
        duration: req.duration,
        visualMode: 'ai_image',
        url: fallbackUrl,
        status: 'ready',
        style: req.style,
        aspectRatio: req.aspectRatio,
        createdAt: Date.now(),
      };
      this.sceneVisuals.set(sceneId, fallbackMeta);
      return fallbackMeta;
    }
  }

  /**
   * Lưu ảnh hoặc video do người dùng tự tải lên
   */
  public async setUserUploadedFile(
    sceneId: string | number,
    file: File,
    assetType: VisualAssetType,
    duration: number
  ): Promise<SceneVisualMetadata> {
    const objectUrl = URL.createObjectURL(file);
    const meta: SceneVisualMetadata = {
      sceneId: String(sceneId),
      visualPrompt: `Tệp người dùng tải lên: ${file.name}`,
      assetType,
      duration,
      visualMode: assetType === 'video' ? 'upload_video' : 'upload_image',
      url: objectUrl,
      fileName: file.name,
      status: 'ready',
      aspectRatio: '16:9',
      createdAt: Date.now(),
    };

    this.sceneVisuals.set(String(sceneId), meta);
    return meta;
  }

  /**
   * Đặt chế độ không sử dụng visual cho Scene (No visual)
   */
  public setNoVisual(sceneId: string | number, duration: number = 15): SceneVisualMetadata {
    const meta: SceneVisualMetadata = {
      sceneId: String(sceneId),
      visualPrompt: 'Không sử dụng hình ảnh minh họa (giao diện tối giản YouTube)',
      assetType: 'image',
      duration,
      visualMode: 'no_visual',
      url: undefined,
      status: 'ready',
      aspectRatio: '16:9',
      createdAt: Date.now(),
    };

    this.sceneVisuals.set(String(sceneId), meta);
    return meta;
  }

  /**
   * Tự động sinh Visual cho toàn bộ 8 Scenes
   */
  public async generateAllScenesVisual(
    scenes: LessonScene[],
    style: VisualStyle = 'warm_educational_animation',
    assetType: VisualAssetType = 'image',
    aspectRatio: '16:9' | '9:16' = '16:9',
    onProgress?: (completed: number, total: number, sceneId: number) => void
  ): Promise<Map<string, SceneVisualMetadata>> {
    let completed = 0;
    const total = scenes.length;

    for (const scene of scenes) {
      if (onProgress) {
        onProgress(completed, total, scene.sceneId);
      }

      const prompt = buildSmartVisualPrompt(scene, style, aspectRatio);
      await this.generateSceneVisual({
        sceneId: String(scene.sceneId),
        sceneType: scene.type,
        visualPrompt: prompt,
        assetType,
        duration: scene.duration,
        aspectRatio,
        style,
        topic: scene.teacherExplanation,
        highlightWords: scene.highlightWords,
      });

      completed++;
      if (onProgress) {
        onProgress(completed, total, scene.sceneId);
      }
    }

    return this.sceneVisuals;
  }
}

export const visualEngine = VisualEngineService.getInstance();
