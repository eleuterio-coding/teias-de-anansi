import {test,expect} from '@playwright/test';

const session={uid:'u-design-master',username:'rafael',isMaster:true,memberships:[]};
const routes=[
  '/index.html','/painel.html','/campanhas.html','/nova-campanha.html',
  '/aventuras.html','/sessoes.html','/personagens.html','/npcs.html',
  '/lista-personagens.html','/lista-npcs.html','/bibliotecas.html',
  '/regras.html','/armas.html','/magias.html','/criacao-personagem.html',
  '/configuracoes.html','/usuario.html','/usuarios.html'
];

test.beforeEach(async ({page})=>{
  await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({enabled:false,authMode:'username-password'})
  }));
  await page.addInitScript(value=>{
    localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(value));
  },session);
});

test('Design System é carregado e mantém tokens em todas as famílias de telas',async({page})=>{
  test.setTimeout(180_000);
  for(const route of routes){
    await test.step(route,async()=>{
      await page.goto(route,{waitUntil:'domcontentloaded'});
      await expect(page.locator('body')).toHaveClass(/hub-shell-enabled/);
      await expect(page.locator('#hub-design-system-styles')).toHaveCount(1);
      await page.waitForFunction(()=>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--hub-ds-motion-standard').trim()==='180ms'
      );
      const values=await page.evaluate(()=>{
        const style=getComputedStyle(document.documentElement);
        return {
          spacing:style.getPropertyValue('--hub-ds-section-nav-space').trim(),
          duration:style.getPropertyValue('--hub-ds-motion-standard').trim(),
          radius:style.getPropertyValue('--hub-ds-card-radius').trim(),
          overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
        };
      });
      expect(values.spacing,route).not.toBe('');
      expect(values.duration,route).toBe('180ms');
      expect(values.radius,route).not.toBe('');
      expect(values.overflow,route+' não pode vazar horizontalmente').toBeLessThanOrEqual(3);
    });
  }
});

test('menus horizontais equivalentes têm espaçamento simétrico e animação igual',async({page})=>{
  for(const route of ['/painel.html','/campanhas.html','/bibliotecas.html']){
    await page.goto(route,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#hub-design-system-styles')).toHaveCount(1);
    const result=await page.evaluate(()=>{
      const parent=document.querySelector('.hub-app-content');
      const section=document.createElement('nav');
      section.className='section-nav';
      section.innerHTML='<a href="#prova">Prova</a>';
      const wizard=document.createElement('nav');
      wizard.className='wizard-nav';
      wizard.innerHTML='<button type="button">Prova</button>';
      parent.append(section,wizard);
      const a=getComputedStyle(section),b=getComputedStyle(wizard);
      const link=getComputedStyle(section.querySelector('a'));
      const button=getComputedStyle(wizard.querySelector('button'));
      const result={
        section:[a.marginTop,a.marginBottom],
        wizard:[b.marginTop,b.marginBottom],
        sectionMotion:link.transitionDuration.split(',')[0].trim(),
        wizardMotion:button.transitionDuration.split(',')[0].trim(),
        navHeight:parseFloat(link.minHeight)
      };
      section.remove();wizard.remove();
      return result;
    });
    expect(result.section[0]).toBe(result.section[1]);
    expect(result.wizard[0]).toBe(result.wizard[1]);
    expect(result.section).toEqual(result.wizard);
    expect(result.sectionMotion).toBe('0.18s');
    expect(result.wizardMotion).toBe('0.18s');
    expect(result.navHeight).toBeGreaterThanOrEqual(44);
  }
});

test('preferência de movimento reduzido elimina transições nos componentes',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/painel.html');
  await expect(page.locator('#hub-design-system-styles')).toHaveCount(1);
  const duration=await page.evaluate(()=>{
    const nav=document.createElement('nav');nav.className='section-nav';
    nav.innerHTML='<a href="#teste">Teste</a>';
    document.querySelector('.hub-app-content').append(nav);
    const value=getComputedStyle(nav.querySelector('a')).transitionDuration;
    nav.remove();
    return value;
  });
  expect(duration.split(',').every(item=>parseFloat(item)===0)).toBe(true);
});
