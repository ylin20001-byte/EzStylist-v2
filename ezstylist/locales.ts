/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const en = {
  start: {
    title: "Create Your Model for Any Look.",
    subtitle: "Ever wondered how an outfit would look on you? Stop guessing. Upload a photo and see for yourself. Our AI creates your personal model, ready to try on anything.",
    upload: "Upload Photo",
    tip: "Tip: Use a clear, full-body photo for best results.",
    error: {
        fileType: "Please select an image file.",
        createModel: "Failed to create model",
    },
    compare: {
        title: "Your Personal Model is Ready",
        subtitle: "Compare your original photo with the AI-generated model. If you're happy with it, continue to the virtual dressing room.",
        generating: "Generating Model...",
        failed: "Generation Failed",
        tryAgain: "Try Again",
        newPhoto: "Use a Different Photo",
        continue: "Continue",
    }
  },
  canvas: {
      startOver: "Start Over",
      lookbook: "Lookbook",
      loadingModel: "Loading Model...",
      prevPose: "Previous pose",
      nextPose: "Next pose",
      download: "Download",
      undo: "Undo",
      redo: "Redo",
      crop: "Crop",
  },
  outfitStack: {
      title: "Outfit Stack",
      baseModel: "Base Model",
      empty: "Your stacked items will appear here. Select an item from the wardrobe below.",
      remove: "Remove",
      changeColor: "Change color for",
      changeColorTo: "Change color to",
  },
  wardrobe: {
      title: "Wardrobe",
      tops: "Tops",
      accessories: "Accessories",
      upload: "Upload",
      empty: "Your uploaded garments will appear here.",
      select: "Select",
      error: {
          load: "Failed to load wardrobe item. This is often a CORS issue. Check the developer console for details."
      }
  },
  footer: {
      poweredBy: "Powered by",
  },
  app: {
      expandPanel: "Expand panel",
      collapsePanel: "Collapse panel",
      error: {
          title: "Error",
          applyGarment: "Failed to apply garment",
          changePose: "Failed to change pose",
          changeColor: "Failed to change color",
          changeBackground: "Failed to change background",
          changeLighting: "Failed to change lighting",
          lookbook: {
              addGarment: "Add at least one garment to create a lookbook.",
              notEnough: "Not enough outfits to generate a lookbook.",
              generate: "Failed to generate lookbook",
          }
      },
      loading: {
          adding: "Adding",
          posing: "Changing pose...",
          coloring: "Changing color to",
          background: "Changing background...",
          lighting: "Adjusting lighting...",
          lookbook: "Generating your lookbook...",
      },
      lookbook: {
          title: "Your Lookbook",
          close: "Close lookbook",
          download: "Download Lookbook",
      }
  },
  poses: {
    "Full frontal view, hands on hips": "Hands on Hips",
    "Slightly turned, 3/4 view": "3/4 View",
    "Side profile view": "Side Profile",
    "Jumping in the air, mid-action shot": "Jumping",
    "Walking towards camera": "Walking",
    "Leaning against a wall": "Leaning",
  },
  backgrounds: {
    "Default": "Default",
    "Studio Background": "Studio",
    "A Parisian street cafe": "Paris Cafe",
    "A futuristic neon-lit alley": "Neon Alley",
    "A serene beach at sunset": "Sunset Beach",
    "An elegant library with wooden shelves": "Library",
    "A lush botanical garden": "Garden",
  },
  lighting: {
    "Default": "Default",
    "Bright studio lighting": "Studio",
    "Warm, golden hour lighting": "Golden Hour",
    "Dramatic, cinematic lighting": "Cinematic",
    "Soft, diffused lighting": "Soft",
  },
  magicWand: {
    label: "Edit Garment",
    placeholder: "e.g., 'make it sleeveless', 'add a logo'",
    submit: "Apply",
    error: "Failed to apply edit",
  },
  lookbookTemplates: {
    title: "Choose a Lookbook Style",
    generate: "Generate Lookbook",
    templates: {
        'Minimalist Grid': 'Minimalist Grid',
        'Magazine Spread': 'Magazine Spread',
        'Film Strip': 'Film Strip',
        'Polaroid Collage': 'Polaroid Collage',
    }
  },
  cropModal: {
    title: "Crop Image",
    apply: "Apply Crop",
  }
};

const zh: typeof en = {
  start: {
    title: "为任何造型创建您的模特。",
    subtitle: "有没有想过一套衣服穿在你身上会是什么样子？别再猜了。上传一张照片，亲眼看看。我们的AI会创建您的个人模特，随时准备试穿任何服装。",
    upload: "上传照片",
    tip: "提示：为获得最佳效果，请使用清晰的全身照片。",
     error: {
        fileType: "请选择一个图片文件。",
        createModel: "创建模特失败",
    },
    compare: {
        title: "您的个人模特已准备就绪",
        subtitle: "将您的原始照片与AI生成的模特进行比较。如果您满意，请继续进入虚拟试衣间。",
        generating: "正在生成模特...",
        failed: "生成失败",
        tryAgain: "再试一次",
        newPhoto: "使用另一张照片",
        continue: "继续",
    }
  },
  canvas: {
      startOver: "重新开始",
      lookbook: "造型集",
      loadingModel: "正在加载模特...",
      prevPose: "上一个姿势",
      nextPose: "下一个姿势",
      download: "下载",
      undo: "撤销",
      redo: "重做",
      crop: "裁剪",
  },
  outfitStack: {
      title: "服装搭配",
      baseModel: "基础模特",
      empty: "您搭配的物品将显示在这里。请从下面的衣柜中选择一件物品。",
      remove: "移除",
      changeColor: "更改颜色",
      changeColorTo: "将颜色更改为",
  },
  wardrobe: {
      title: "衣柜",
      tops: "上衣",
      accessories: "配饰",
      upload: "上传",
      empty: "您上传的服装将显示在这里。",
      select: "选择",
      error: {
          load: "加载衣柜物品失败。这通常是CORS问题。请检查开发者控制台以获取详细信息。"
      }
  },
  footer: {
      poweredBy: "技术支持",
  },
  app: {
      expandPanel: "展开面板",
      collapsePanel: "折叠面板",
      error: {
          title: "错误",
          applyGarment: "应用服装失败",
          changePose: "更改姿势失败",
          changeColor: "更改颜色失败",
          changeBackground: "更改背景失败",
          changeLighting: "更改灯光失败",
          lookbook: {
              addGarment: "至少添加一件服装才能创建造型集。",
              notEnough: "没有足够的服装来生成造型集。",
              generate: "生成造型集失败",
          }
      },
      loading: {
          adding: "正在添加",
          posing: "正在更改姿势...",
          coloring: "正在将颜色更改为",
          background: "正在更改背景...",
          lighting: "正在调整灯光...",
          lookbook: "正在生成您的造型集...",
      },
      lookbook: {
          title: "您的造型集",
          close: "关闭造型集",
          download: "下载造型集",
      }
  },
  poses: {
    "Full frontal view, hands on hips": "叉腰姿势",
    "Slightly turned, 3/4 view": "3/4侧面",
    "Side profile view": "侧面视角",
    "Jumping in the air, mid-action shot": "跳跃",
    "Walking towards camera": "走向镜头",
    "Leaning against a wall": "倚墙",
  },
  backgrounds: {
    "Default": "默认",
    "Studio Background": "影棚",
    "A Parisian street cafe": "巴黎咖啡馆",
    "A futuristic neon-lit alley": "霓虹小巷",
    "A serene beach at sunset": "日落海滩",
    "An elegant library with wooden shelves": "图书馆",
    "A lush botanical garden": "植物园",
  },
  lighting: {
    "Default": "默认",
    "Bright studio lighting": "影棚灯",
    "Warm, golden hour lighting": "黄金时刻",
    "Dramatic, cinematic lighting": "电影灯效",
    "Soft, diffused lighting": "柔光",
  },
  magicWand: {
    label: "编辑服装",
    placeholder: "例如 “改成无袖”，“添加一个标志”",
    submit: "应用",
    error: "应用编辑失败",
  },
  lookbookTemplates: {
    title: "选择造型集风格",
    generate: "生成造型集",
    templates: {
        'Minimalist Grid': '极简网格',
        'Magazine Spread': '杂志跨页',
        'Film Strip': '电影胶片',
        'Polaroid Collage': '宝丽来拼贴',
    }
  },
  cropModal: {
    title: "裁剪图片",
    apply: "应用裁剪",
  }
};

export const locales = {
    EN: en,
    '中文': zh,
};

export type Locale = typeof en;

// FIX: Replace the faulty TranslationKey with a recursive type that correctly
// generates dot-notation paths for all nested string properties in the locale object.
// This resolves all "not assignable to TranslationKey" errors.
type NestedKeyOf<ObjectType extends object> =
  {[Key in keyof ObjectType & string]: ObjectType[Key] extends string
    ? `${Key}`
    : ObjectType[Key] extends object
      ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
      : never
  }[keyof ObjectType & string];

export type TranslationKey = NestedKeyOf<Locale>;