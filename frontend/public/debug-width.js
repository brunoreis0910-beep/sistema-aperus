// Script para executar no console do navegador para debugar problemas de largura

console.log('🔍 DIAGNÓSTICO DE LARGURA DE TELA');
console.log('================================');

// Informações básicas da tela
console.log('📊 Informações da Tela:');
console.log(`- window.innerWidth: ${window.innerWidth}px`);
console.log(`- window.innerHeight: ${window.innerHeight}px`);
console.log(`- screen.width: ${screen.width}px`);
console.log(`- screen.height: ${screen.height}px`);
console.log(`- devicePixelRatio: ${window.devicePixelRatio}`);

// Verificar elementos com limitações de largura
console.log('\n🚫 Elementos com Limitações de Largura:');
const elementsWithMaxWidth = document.querySelectorAll('[style*="max-width"], [class*="maxWidth"]');
elementsWithMaxWidth.forEach((el, index) => {
  const computedStyle = getComputedStyle(el);
  console.log(`${index + 1}. ${el.tagName}.${el.className}`);
  console.log(`   max-width: ${computedStyle.maxWidth}`);
  console.log(`   width: ${computedStyle.width}`);
  console.log(`   clientWidth: ${el.clientWidth}px`);
});

// Verificar containers principais
console.log('\n📦 Containers Principais:');
const containers = [
  document.querySelector('#root'),
  document.querySelector('body'),
  document.querySelector('html'),
  document.querySelector('.MuiContainer-root'),
  document.querySelector('main'),
  document.querySelector('[role="main"]')
].filter(Boolean);

containers.forEach((el, index) => {
  const computedStyle = getComputedStyle(el);
  console.log(`${index + 1}. ${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}`);
  console.log(`   width: ${computedStyle.width} (${el.clientWidth}px)`);
  console.log(`   max-width: ${computedStyle.maxWidth}`);
  console.log(`   margin: ${computedStyle.margin}`);
  console.log(`   padding: ${computedStyle.padding}`);
});

// Funçéo para forçar largura total
window.forceFullWidth = function () {
  console.log('🔧 Forçando largura total...');

  // Reset completo
  const elements = ['html', 'body', '#root', '.MuiContainer-root', 'main', '[role="main"]'];
  elements.forEach(selector => {
    const els = document.querySelectorAll(selector);
    els.forEach(el => {
      el.style.width = '100vw';
      el.style.maxWidth = 'none';
      el.style.margin = '0';
      el.style.paddingLeft = '8px';
      el.style.paddingRight = '8px';
    });
  });

  console.log('✅ Largura forçada aplicada!');
};

// Funçéo para debug visual
window.debugBorders = function () {
  document.body.classList.toggle('debug-borders');
  console.log('🎯 Debug borders toggled');
};

console.log('\n🛠️ Comandos Disponíveis:');
console.log('- forceFullWidth() - Força largura total');
console.log('- debugBorders() - Toggle debug borders');

// Auto-executar em telas ultra-wide
if (window.innerWidth >= 3440) {
  console.log('\n🖥️ Tela ultra-wide detectada! Aplicando otimizações...');
  setTimeout(() => {
    window.forceFullWidth();
  }, 1000);
}