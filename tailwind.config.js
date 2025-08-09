/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // 移动端专用间距
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // 移动端专用最小高度
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      // 移动端触摸优化
      screens: {
        'xs': '475px',
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
      },
    },
  },
  plugins: [
    // 添加移动端安全区域支持
    function({ addUtilities }) {
      addUtilities({
        '.safe-area-pb': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-area-pt': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-area-pl': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.safe-area-pr': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        // 移动端触摸优化
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.tap-highlight-none': {
          '-webkit-tap-highlight-color': 'transparent',
        },
      });
    },
  ],
};
