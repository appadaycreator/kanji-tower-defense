import { kanjiDatabase } from './words.js';
// ... index.htmlの<script type="module">...</script>内の全JSコードをここに移動 ... 

function setLevel(level, event) {
    gameState.level = level;
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const btn = document.querySelector(`.level-btn[onclick*="setLevel('${level}'"]`);
        if (btn) btn.classList.add('active');
    }
    saveSettings();
} 