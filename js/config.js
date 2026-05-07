window.FLOWER_CONFIG = {
    SAVE_KEY: 'flower_grade_save_v1',
    BASE_UNLOCKED_POTS: 4,
    TOTAL_POTS: 20,
    MAX_LEVEL: 17,
    LEVEL_UP_EXP: 100,
    EXP_PER_FLOWER: 5,
    ROSE_STAGE_OFFSETS: [
        { x: 0, y: -33 },
        { x: 0, y: -35 },
        { x: 0, y: -50 },
        { x: 0, y: -70 },
        { x: 0, y: -80 }
    ],
    ROSE_STAGE_SCALE_FACTORS: [0.5, 0.6, 0.3, 1.5, 1.8],
    DEFAULT_FLOWER_TYPE: 'rose',
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
        }
    ],
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
