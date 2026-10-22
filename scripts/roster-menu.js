import{collaborationAccessMode,masterPreviewMode}from'./collaboration-view.js?v=20261021-ficha-permissao3';
const master=collaborationAccessMode()==='master'&&!masterPreviewMode();
for(const item of document.querySelectorAll('[data-master-only]'))item.hidden=!master;