module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: false
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'script'
    },
    globals: {
        // Material Design Components
        mdc: 'readonly',

        // Google Maps
        google: 'readonly',

        // App globals
        Utils: 'readonly',
        Storage: 'readonly',

        // Our app instances
        tourGuidanceApp: 'readonly',
        formManager: 'readonly',
        chatManager: 'readonly',
        mapManager: 'readonly',
        appConfig: 'readonly',

        // Browser APIs
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly'
    },
    rules: {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-unused-vars': ['warn'],
        'no-console': ['warn'],
        'no-debugger': ['error'],
        'no-alert': ['warn'],
        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'all'],
        'brace-style': ['error', '1tbs'],
        'comma-dangle': ['error', 'never'],
        'no-trailing-spaces': ['error'],
        'eol-last': ['error', 'always'],
        'no-multiple-empty-lines': ['error', { 'max': 2 }],
        'space-before-blocks': ['error', 'always'],
        'keyword-spacing': ['error', { 'before': true, 'after': true }],
        'space-infix-ops': ['error'],
        'comma-spacing': ['error', { 'before': false, 'after': true }],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'func-call-spacing': ['error', 'never']
    }
};