module.exports = {
  presets: [
    [
      '@vue/app',
      {
        useBuiltIns: 'entry',
        corejs: { version: 3 },
        polyfills: ['es6.promise', 'es6.symbol'],
      },
    ],
  ],
  plugins: ['@babel/plugin-proposal-optional-chaining','@babel/plugin-proposal-nullish-coalescing-operator'],
};
