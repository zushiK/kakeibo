/**
 * 家計簿アプリ - Kakibo App
 * シンプルな支出管理アプリケーション
 */

// ===================================
// Tag Configuration
// ===================================
const TAGS = {
    '食費': {
        keywords: ['食', '飯', 'ランチ', 'ディナー', '朝食', '昼食', '夕食', 'ご飯', 'レストラン', 'カフェ', 'コーヒー', 'お菓子', '弁当', 'コンビニ', 'スーパー', '外食', 'デリバリー', 'ウーバー', '出前', 'ラーメン', '寿司', '焼肉', 'パン', '飲み物', 'ジュース', 'お茶', '水'],
        color: '#ff6b6b',
        icon: '🍽️'
    },
    '交通費': {
        keywords: ['電車', 'バス', 'タクシー', '交通', '定期', '切符', 'Suica', 'PASMO', 'ガソリン', '駐車', '高速', '新幹線', '飛行機', '航空', 'JR', '地下鉄', 'メトロ', '運賃', 'ICカード'],
        color: '#4ecdc4',
        icon: '🚃'
    },
    '生活費': {
        keywords: ['家賃', '光熱', '電気', 'ガス', '水道', '通信', '携帯', 'スマホ', 'ネット', 'WiFi', '保険', '医療', '病院', '薬', 'クリーニング', '日用品', '洗剤', 'シャンプー', 'トイレ', 'ティッシュ', '雑貨', '家具', '家電', '修理'],
        color: '#45b7d1',
        icon: '🏠'
    },
    '交際費': {
        keywords: ['飲み会', '送別', '歓迎', 'パーティー', 'お祝い', 'プレゼント', 'ギフト', '贈り物', '結婚', '葬儀', '香典', 'お見舞い', 'デート', '合コン', '接待', '会食'],
        color: '#f7b731',
        icon: '🎉'
    },
    '趣味': {
        keywords: ['本', '書籍', '漫画', 'ゲーム', '映画', '音楽', 'ライブ', 'コンサート', 'スポーツ', 'ジム', 'フィットネス', '旅行', '温泉', 'ホテル', '宿泊', 'カメラ', '写真', 'アウトドア', 'キャンプ', '釣り', 'ゴルフ', 'サッカー', '野球', 'テニス', 'Netflix', 'YouTube', 'サブスク', 'Amazon', '趣味', '娯楽', 'レジャー'],
        color: '#a55eea',
        icon: '🎮'
    },
    'その他': {
        keywords: [],
        color: '#778ca3',
        icon: '📦'
    }
};

// ===================================
// State Management
// ===================================
const STORAGE_KEY = 'kakibo_expenses';

// 支出データを取得
function getExpenses() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 支出データを保存
function saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// ===================================
// DOM Elements
// ===================================
const form = document.getElementById('expense-form');
const itemNameInput = document.getElementById('item-name');
const amountInput = document.getElementById('amount');
const expenseList = document.getElementById('expense-list');
const totalAmountEl = document.getElementById('total-amount');
const itemCountEl = document.getElementById('item-count');
const clearAllBtn = document.getElementById('clear-all-btn');

// ===================================
// Utility Functions
// ===================================

/**
 * 金額をフォーマット（カンマ区切り）
 */
function formatAmount(amount) {
    return new Intl.NumberFormat('ja-JP').format(amount);
}

/**
 * 日付をフォーマット
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * ユニークIDを生成
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 項目名からタグを自動判定
 */
function detectTag(itemName) {
    const name = itemName.toLowerCase();

    for (const [tagName, tagConfig] of Object.entries(TAGS)) {
        if (tagName === 'その他') continue; // その他は最後に判定

        for (const keyword of tagConfig.keywords) {
            if (name.includes(keyword.toLowerCase())) {
                return tagName;
            }
        }
    }

    return 'その他';
}

/**
 * タグの設定を取得
 */
function getTagConfig(tagName) {
    return TAGS[tagName] || TAGS['その他'];
}

// ===================================
// Render Functions
// ===================================

/**
 * 空の状態を表示
 */
function renderEmptyState() {
    return `
        <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p>まだ項目がありません</p>
            <p class="empty-hint">上のフォームから追加してください</p>
        </div>
    `;
}

/**
 * タグ選択ドロップダウンのHTML生成
 */
function renderTagDropdown(expenseId, currentTag) {
    const tagNames = Object.keys(TAGS);
    const options = tagNames.map(tagName => {
        const config = TAGS[tagName];
        const isActive = tagName === currentTag ? 'active' : '';
        return `
            <button class="tag-option ${isActive}" data-expense-id="${expenseId}" data-tag="${tagName}" style="--tag-color: ${config.color}">
                ${config.icon} ${tagName}
            </button>
        `;
    }).join('');

    return `
        <div class="tag-dropdown">
            ${options}
        </div>
    `;
}

/**
 * 支出アイテムのHTML生成
 */
function renderExpenseItem(expense) {
    const tagConfig = getTagConfig(expense.tag);

    return `
        <div class="expense-item" data-id="${expense.id}">
            <div class="expense-info">
                <div class="expense-header">
                    <span class="expense-name">${escapeHtml(expense.name)}</span>
                    <div class="tag-wrapper">
                        <button class="expense-tag editable-tag" data-id="${expense.id}" style="background: ${tagConfig.color}20; color: ${tagConfig.color}; border-color: ${tagConfig.color}40;">
                            ${tagConfig.icon} ${expense.tag}
                            <span class="tag-edit-icon">▼</span>
                        </button>
                        ${renderTagDropdown(expense.id, expense.tag)}
                    </div>
                </div>
                <div class="expense-date">${formatDate(expense.date)}</div>
            </div>
            <div class="expense-amount">¥${formatAmount(expense.amount)}</div>
            <button class="delete-btn" data-id="${expense.id}" aria-label="削除">
                ×
            </button>
        </div>
    `;
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 支出一覧を描画
 */
function renderExpenses() {
    const expenses = getExpenses();

    if (expenses.length === 0) {
        expenseList.innerHTML = renderEmptyState();
        clearAllBtn.style.display = 'none';
    } else {
        // 日付順（新しい順）にソート
        const sortedExpenses = [...expenses].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        expenseList.innerHTML = sortedExpenses
            .map(expense => renderExpenseItem(expense))
            .join('');

        clearAllBtn.style.display = 'block';
    }

    updateSummary();
}

/**
 * 合計を更新
 */
function updateSummary() {
    const expenses = getExpenses();
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    totalAmountEl.textContent = formatAmount(total);
    itemCountEl.textContent = expenses.length;
}

// ===================================
// Event Handlers
// ===================================

/**
 * 新しい支出を追加
 */
function addExpense(name, amount) {
    const expenses = getExpenses();
    const trimmedName = name.trim();

    // ラジオボタンから選択されたタグを取得
    const selectedTagRadio = document.querySelector('input[name="tag"]:checked');
    const selectedValue = selectedTagRadio ? selectedTagRadio.value : '自動';

    // 「自動」が選択されている場合は自動判別、それ以外は選択されたタグを使用
    const tag = selectedValue === '自動' ? detectTag(trimmedName) : selectedValue;

    const newExpense = {
        id: generateId(),
        name: trimmedName,
        amount: parseInt(amount, 10),
        date: new Date().toISOString(),
        tag: tag
    };

    expenses.push(newExpense);
    saveExpenses(expenses);
    renderExpenses();

    // 成功フィードバック（入力欄をクリア）
    form.reset();
    itemNameInput.focus();
}

/**
 * 支出を削除
 */
function deleteExpense(id) {
    const item = document.querySelector(`.expense-item[data-id="${id}"]`);

    if (item) {
        // アニメーション付きで削除
        item.classList.add('removing');

        setTimeout(() => {
            const expenses = getExpenses();
            const filtered = expenses.filter(expense => expense.id !== id);
            saveExpenses(filtered);
            renderExpenses();
        }, 300);
    }
}

/**
 * 全ての支出を削除
 */
function clearAllExpenses() {
    if (confirm('すべての項目を削除しますか？この操作は取り消せません。')) {
        saveExpenses([]);
        renderExpenses();
    }
}

/**
 * タグを更新
 */
function updateExpenseTag(expenseId, newTag) {
    const expenses = getExpenses();
    const expense = expenses.find(e => e.id === expenseId);

    if (expense) {
        expense.tag = newTag;
        saveExpenses(expenses);
        renderExpenses();
    }
}

/**
 * すべてのタグドロップダウンを閉じる
 */
function closeAllTagDropdowns() {
    document.querySelectorAll('.tag-wrapper.open').forEach(wrapper => {
        wrapper.classList.remove('open');
    });
}

// ===================================
// Event Listeners
// ===================================

// フォーム送信
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = itemNameInput.value;
    const amount = amountInput.value;

    if (name && amount && parseInt(amount) > 0) {
        addExpense(name, amount);
    }
});

// 削除ボタンクリック（イベント委任）
expenseList.addEventListener('click', (e) => {
    // 削除ボタン
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        deleteExpense(id);
        return;
    }

    // タグ編集ボタン
    const editableTag = e.target.closest('.editable-tag');
    if (editableTag) {
        e.stopPropagation();
        const wrapper = editableTag.closest('.tag-wrapper');
        const isOpen = wrapper.classList.contains('open');

        // 他のドロップダウンを閉じる
        closeAllTagDropdowns();

        // このドロップダウンをトグル
        if (!isOpen) {
            wrapper.classList.add('open');
        }
        return;
    }

    // タグオプション選択
    if (e.target.classList.contains('tag-option')) {
        const expenseId = e.target.dataset.expenseId;
        const newTag = e.target.dataset.tag;
        updateExpenseTag(expenseId, newTag);
        return;
    }
});

// 外側クリックでドロップダウンを閉じる
document.addEventListener('click', (e) => {
    if (!e.target.closest('.tag-wrapper')) {
        closeAllTagDropdowns();
    }
});

// 全削除ボタン
clearAllBtn.addEventListener('click', clearAllExpenses);

// ===================================
// Initialize
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    renderExpenses();
});
