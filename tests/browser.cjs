const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {migrateLegacyData}=require('../public/v2/domain');
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10)};
(async()=>{
 const legacy={anak:[{id:'anak-ahmad',nama:'Ibra',avatarText:'IM',avatarName:'Iron Man',warna:'#dc2626',accent:'#facc15',saldo:2500,tugas:[{id:'m',nama:'Baca buku',ikon:'📚',poin:100},{id:'m2',nama:'Rapikan tempat tidur',ikon:'🛏️',poin:50}],harian:{}}],hadiah:[{id:'r',nama:'Es Krim'}],riwayat:[]};
 const fixture=migrateLegacyData(legacy);fixture.rewards[0]={...fixture.rewards[0],type:'money',value:20000,convertible:true,conversionValue:20000,weight:1};
 const server=http.createServer((req,res)=>{const file=path.join(process.cwd(),'public',req.url==='/'?'index.html':req.url.split('?')[0]);try{const data=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data)}catch{res.statusCode=404;res.end()}}).listen(3177);
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'msedge'});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://script.google.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"state":null,"revision":0,"updatedAt":""}'}));
  await page.addInitScript(state=>localStorage.setItem('tombolHadiahV2',JSON.stringify(state)),fixture);
  await page.goto('http://localhost:3177');
  await page.getByRole('heading',{name:'Ibra'}).first().waitFor();
  await page.getByRole('button',{name:/Ibra/}).click();
  assert.ok(await page.locator('.avatar img').first().count(),'avatar image is rendered');

  await page.getByRole('button',{name:'Misi'}).click();
  await page.locator('[data-action="complete"]').first().click({force:true});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('tombolHadiahV2')).completions.length>0);
  await page.getByRole('button',{name:'Riwayat'}).click();
  await page.getByRole('heading',{name:'Riwayat'}).waitFor();
  await expectText(page,'Poin');

  await page.getByRole('button',{name:'Misi'}).click();
  await page.locator('#activeDateInput').fill(yesterday());
  await page.locator('[data-action="complete"]').first().click({force:true});
  await page.getByRole('button',{name:'Riwayat'}).click();
  await page.locator(`[data-id="${yesterday()}"]`).first().click();
  assert.equal(await page.locator('#activeDateInput').inputValue(),yesterday());

  page.once('dialog',d=>d.accept('1234'));
  await page.getByRole('button',{name:'Orang tua'}).click();
  await page.getByRole('button',{name:'Misi'}).click();
  page.once('dialog',d=>d.accept());
  await page.locator('[data-action="penalty"]').first().click();
  await expectText(page,'Pengurang');

  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Tandai Semua Selesai'}).click();
  await expectText(page,'misi dicatat');

  let resetDialogs=0;
  page.on('dialog',d=>{resetDialogs++;d.accept(resetDialogs===2?'Koreksi tanggal':undefined)});
  await page.getByRole('button',{name:/Reset/}).click();

  await page.locator('[data-action="page"][data-id="Gacha"]').click();
  await page.getByRole('button',{name:'Buka hadiah!'}).click();
  await page.getByRole('heading',{name:/Kamu mendapat/}).waitFor();
  await page.locator('[data-action="redeem-choice"][data-dest="saving"]').click();
  await page.getByRole('button',{name:'Riwayat'}).click();
  await page.locator('[data-action="history-tab"][data-id="Gacha"]').click();
  await expectText(page,'Ditabung');
  await page.getByRole('button',{name:'Keuangan'}).click();
  await expectText(page,'Konversi');
  await page.reload();
  await page.getByRole('heading',{name:'Ibra'}).first().waitFor();
  fs.mkdirSync('test-results',{recursive:true});
  for(const width of [360,390,430,1280]){
   await page.setViewportSize({width,height:844});
   for(const name of ['Beranda','Misi','Tombol Hadiah','Dompet','Riwayat']){
    await page.locator('.nav [data-id="'+name+'"]').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'overflow '+width+' '+name);
   }
   await page.locator('.nav [data-id="Beranda"]').click();
   await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);
  console.log('Browser parity PASS: avatar, activeDate, old-date mission, daily history click, penalty, complete-all, reset date, gacha decision, finance history, reload, no overflow.');
 }finally{await browser?.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
async function expectText(page,text){await page.getByText(text,{exact:false}).first().waitFor({timeout:10000})}
