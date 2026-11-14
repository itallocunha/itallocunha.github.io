/* Preferência de movimento do site.
   O site NÃO segue mais a configuração do sistema (no Windows ela costuma vir desligada
   sem a pessoa saber e apagava todas as animações). Quem quiser menos movimento usa o
   botão "Reduzir animações" no rodapé; a escolha fica salva neste navegador. */
(function(){
  var c = false;
  try{ c = localStorage.getItem('calmo') === '1'; }catch(e){}
  window.__calmo = c;
  if(c) document.documentElement.classList.add('calmo');
})();
