/**
 * 游戏全局配置
 * 所有游戏常量和参数集中管理
 */
window.FLOWER_CONFIG = {
    /** localStorage 存档键名 */
    SAVE_KEY: 'flower_grade_save_v1',

    /** 初始解锁花盆数量 */
    BASE_UNLOCKED_POTS: 4,

    /** 花盆总数（5行 x 4列） */
    TOTAL_POTS: 20,

    /** 最高等级 */
    MAX_LEVEL: 17,

    /** 每级所需经验值 */
    LEVEL_UP_EXP: 100,

    /** 每朵花获得的经验值 */
    EXP_PER_FLOWER: 5,

    /** 牡丹突变金花配置 */
    MUTATION: {
        /** 牡丹突变为金花的概率（每次阶段推进） */
        peonyToGoldenChance: 0.01,
        /** 牡丹的花种ID */
        peonyTypeId: 'peony',
        /** 金花的花种ID */
        goldenTypeId: 'golden'
    },

    /** 每日任务配置 */
    DAILY_TASK: {
        /** 每日收花目标数量 */
        collectGoal: 30,
        /** 完成任务的奖励 */
        reward: {
            fertilizer: 1,    /** 化肥数量 */
            wateringCan: 0    /** 浇水壶数量 */
        }
    },

    /** 玫瑰各阶段Y轴偏移量（用于调整花朵位置） */
    ROSE_STAGE_OFFSETS: [
        { x: 0, y: -33 },
        { x: 0, y: -35 },
        { x: 0, y: -50 },
        { x: 0, y: -70 },
        { x: 0, y: -80 }
    ],

    /** 各生长阶段的缩放因子（阶段1~5） */
    ROSE_STAGE_SCALE_FACTORS: [0.5, 0.6, 0.3, 1.5, 1.8],

    /** 默认选中的花种 */
    DEFAULT_FLOWER_TYPE: 'rose',

    /**
     * 花种列表
     * @property {string} id - 花种唯一标识
     * @property {string} name - 花种中文名称
     * @property {string} folder - 图片资源文件夹名
     * @property {string} logo - 种子工具栏显示的图标路径
     * @property {boolean} [seedSelectable] - 是否可手动播种（false表示不可选）
     */
    FLOWER_TYPES: [
        {
            id: 'rose',
            name: '玫瑰',
            folder: '玫瑰',
            logo: 'img/玫瑰/5.png'
        },
        {
            id: 'daisy',
            name: '雏菊',
            folder: '雏菊',
            logo: 'img/雏菊/5.png'
        },
        {
            id: 'peony',
            name: '牡丹',
            folder: '牡丹',
            logo: 'img/牡丹/5.png'
        },
        {
            id: 'golden',
            name: '金花',
            folder: '金花',
            logo: 'img/金花/5.png',
            seedSelectable: false
        }
    ],

    /**
     * 交易道具列表
     * @property {string} id - 道具唯一标识
     * @property {string} name - 道具中文名称
     * @property {number} cost - 兑换所需花朵数量
     * @property {string} image - 道具图标路径
     * @property {boolean} [permanent] - 是否为永久解锁道具
     */
    TRADE_ITEMS: [
        {
            id: 'wateringCan',
            name: '浇水壶',
            cost: 50,
            image: 'img/工具/浇水壶.png'
        },
        {
            id: 'fertilizer',
            name: '化肥',
            cost: 100,
            image: 'img/工具/肥料.png'
        },
        {
            id: 'oneClickPlant',
            name: '一键播种',
            cost: 500,
            image: 'img/工具/一键播种.png',
            permanent: true
        },
        {
            id: 'oneClickHarvest',
            name: '一键采摘',
            cost: 500,
            image: 'img/工具/一键采摘.png',
            permanent: true
        }
    ]
};
