/**
 * 经验面板UI模块
 * 负责等级显示、经验值进度条、玩家昵称改名功能
 */
(function() {
    var cfg = window.FLOWER_CONFIG;
    var modal = window.FlowerUIModal;

    /**
     * 创建经验面板DOM元素
     * 包含：玩家昵称按钮、等级标签、经验条、经验数值、满级提示
     * @param {Object} ctx - 共享上下文对象
     */
    function createLevelPanel(ctx) {
        var leftTopPanel = ctx.leftTopPanel;

        var levelUI = document.getElementById('level-ui');
        if (!levelUI) {
            levelUI = document.createElement('div');
            levelUI.id = 'level-ui';
            levelUI.innerHTML = [
                '<div class="level-header">',
                '  <button class="level-title" id="player-name" type="button" title="点击改名">Player</button>',
                '  <span class="level-pill" id="level-pill">Lv 1</span>',
                '</div>',
                '<div class="exp-track">',
                '  <div class="exp-fill" id="exp-fill"></div>',
                '</div>',
                '<div class="exp-footer">',
                '  <span class="exp-text" id="exp-text">0/100</span>',
                '  <span class="exp-percent" id="exp-percent">0%</span>',
                '</div>',
                '<div class="max-level-text" id="max-level-text">已满级，已解锁全部花盆</div>',
            ].join('');
        }
        if (levelUI.parentNode !== leftTopPanel) {
            leftTopPanel.appendChild(levelUI);
        }

        // 缓存DOM引用
        ctx.refs.levelPill = document.getElementById('level-pill');
        ctx.refs.expFill = document.getElementById('exp-fill');
        ctx.refs.expText = document.getElementById('exp-text');
        ctx.refs.expPercent = document.getElementById('exp-percent');
        ctx.refs.maxLevelText = document.getElementById('max-level-text');
        ctx.refs.playerNameEl = document.getElementById('player-name');

        setupRenameHandler(ctx);
    }

    /**
     * 设置昵称按钮点击事件
     * @param {Object} ctx - 共享上下文对象
     */
    function setupRenameHandler(ctx) {
        if (!ctx.refs.playerNameEl) {
            return;
        }
        ctx.refs.playerNameEl.onclick = function() {
            startRename(ctx);
        };
    }

    /**
     * 过滤昵称中的危险字符（XSS防护）
     * 移除 < > & " ' / \ 和多余空格
     * @param {string} str - 原始字符串
     * @returns {string} 过滤后的安全字符串
     */
    function sanitizeName(str) {
        return str.replace(/[<>&"'\/\\]/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * 开始改名流程
     * 将昵称按钮替换为输入框，支持确认/取消/失焦操作
     * @param {Object} ctx - 共享上下文对象
     */
    function startRename(ctx) {
        if (!ctx.refs.playerNameEl || ctx.refs.playerNameEl.tagName === 'INPUT') {
            return;
        }

        var currentName = ctx.refs.playerNameEl.textContent;
        var parent = ctx.refs.playerNameEl.parentNode;

        // 创建输入框替换按钮
        var input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.maxLength = 8;
        input.className = 'name-input';
        parent.replaceChild(input, ctx.refs.playerNameEl);
        input.focus();
        input.select();

        /**
         * 确认改名
         * 过滤输入、限制长度、恢复按钮、触发回调
         */
        function confirm() {
            var newName = sanitizeName(input.value);
            if (newName.length === 0) {
                newName = currentName;
            }
            if (newName.length > 8) {
                newName = newName.substring(0, 8);
            }
            restoreButton(ctx, parent, newName);
            if (newName !== currentName && typeof ctx.callbacks.onNameChange === 'function') {
                ctx.callbacks.onNameChange(newName);
            }
        }

        // 键盘事件：Enter确认，Escape取消
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                restoreButton(ctx, parent, currentName);
            }
        });

        // 失焦时自动确认
        input.addEventListener('blur', function() {
            confirm();
        });
    }

    /**
     * 恢复昵称按钮
     * 将输入框替换回按钮，重新绑定点击事件
     * @param {Object} ctx - 共享上下文对象
     * @param {HTMLElement} parent - 父元素
     * @param {string} name - 显示的昵称
     */
    function restoreButton(ctx, parent, name) {
        var btn = document.createElement('button');
        btn.id = 'player-name';
        btn.className = 'level-title';
        btn.type = 'button';
        btn.title = '点击改名';
        btn.textContent = name;
        parent.replaceChild(btn, ctx.refs.playerNameEl);
        ctx.refs.playerNameEl = btn;
        ctx.refs.playerNameEl.onclick = function() {
            startRename(ctx);
        };
    }

    /**
     * 渲染经验面板
     * 更新等级、经验条、经验数值、满级状态、玩家昵称
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function renderLevelPanel(ctx, state) {
        var isMaxLevel = state.level >= cfg.MAX_LEVEL;
        var displayExp = isMaxLevel ? state.maxExp : state.exp;
        var expRatio = Math.min(displayExp / state.maxExp, 1);

        ctx.refs.levelPill.textContent = 'Lv ' + state.level;
        ctx.refs.expFill.style.width = Math.floor(expRatio * 100) + '%';
        ctx.refs.expText.textContent = displayExp + '/' + state.maxExp;
        ctx.refs.expPercent.textContent = isMaxLevel ? 'MAX' : Math.floor(expRatio * 100) + '%';
        ctx.refs.maxLevelText.style.display = isMaxLevel ? 'block' : 'none';

        // 更新玩家昵称
        if (ctx.refs.playerNameEl && state.playerName) {
            ctx.refs.playerNameEl.textContent = state.playerName;
        }
    }

    /** 升级提示定时器 */
    var levelUpToastTimer = null;

    /**
     * 显示升级提示
     * 1.8秒后自动消失
     * @param {Object} ctx - 共享上下文对象
     * @param {number} level - 升到的等级
     * @param {boolean} isMaxLevel - 是否满级
     */
    function showLevelUpToast(ctx, level, isMaxLevel) {
        if (!ctx.refs.levelUpToast) {
            return;
        }

        // 清除未消失的提示
        if (levelUpToastTimer) {
            clearTimeout(levelUpToastTimer);
            levelUpToastTimer = null;
        }

        ctx.refs.levelUpToast.textContent = isMaxLevel
            ? '恭喜升到 Lv.' + level + '，已解锁全部花盆！'
            : '恭喜升级到 Lv.' + level + '，解锁1个新花盆！';

        ctx.refs.levelUpToast.classList.add('show');
        levelUpToastTimer = setTimeout(function() {
            ctx.refs.levelUpToast.classList.remove('show');
            levelUpToastTimer = null;
        }, 1800);
    }

    /**
     * 创建升级提示DOM元素
     * @param {Object} ctx - 共享上下文对象
     */
    function createLevelUpToast(ctx) {
        var levelUpToast = document.getElementById('levelup-toast');
        if (!levelUpToast) {
            levelUpToast = document.createElement('div');
            levelUpToast.id = 'levelup-toast';
            document.body.appendChild(levelUpToast);
        }
        ctx.refs.levelUpToast = levelUpToast;
    }

    /** 导出经验面板接口 */
    window.FlowerUILevel = {
        create: createLevelPanel,
        createToast: createLevelUpToast,
        render: renderLevelPanel,
        showLevelUpToast: showLevelUpToast
    };
})();
