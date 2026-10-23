import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile=file=>ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const toUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const gameUrl=toUrl(compile('../lib/game.ts'));
const g=await import(gameUrl);
const source=compile('../lib/month-review.ts').replace(/from ['"]\.\/game['"]/,`from ${JSON.stringify(gameUrl)}`);
const {reviewMonth}=await import(toUrl(source));
let checks=0;const check=(name,run)=>{run();checks++;console.log('PASS '+name);};
check('Affordable expensive purchases are not classified as mistakes just for their price',()=>{
 const r=g.settle({...g.initialState(),cash:100000},{...g.defaultPlan(0),choice:'new'},0);
 const v=reviewMonth(r);assert.ok(r.after.cash>0);assert.ok(v.good.some(x=>x.title==='Месяц без дефицита'));assert.ok(!v.improve.some(x=>/Риск в выбранном|Расходов больше/.test(x.title)));
});
check('Revealed phishing loss is flagged and independent verification is recognized',()=>{
 const a=g.settle(g.initialState(),{...g.defaultPlan(5),choice:'code'},5);
 const b=g.settle(g.initialState(),{...g.defaultPlan(5),choice:'official'},5);
 assert.ok(a.ledger.some(x=>x.amount===-9000&&/Передать код/.test(x.label)));
 assert.ok(reviewMonth(a).improve.some(x=>x.title==='Риск в выбранном предложении'));
 assert.ok(!reviewMonth(b).improve.some(x=>x.title==='Риск в выбранном предложении'));
 assert.ok(reviewMonth(b).good.some(x=>x.title==='Внимание к условиям'));
});
check('Deficit, scholarship risk and exhaustion produce specific guidance from the completed state',()=>{
 const r=g.settle({...g.initialState(),cash:-5000,education:30,energy:10},{...g.defaultPlan(0),choice:'service'},0);
 const v=reviewMonth(r);assert.ok(v.improve.some(x=>x.title==='Расходов больше, чем доступных денег'));assert.ok(v.improve.some(x=>x.title==='Стипендия под угрозой'));assert.ok(v.improve.some(x=>x.title==='Нужна передышка'));assert.match(v.next,/закрой дефицит/);
});
check('Taking new debt is reported even when repayments make the total balance fall',()=>{
 const r=g.settle({...g.initialState(),cash:100000,loans:[{id:'old',name:'Old',balance:20000,rate:0,remaining:1,payment:20000,monthlyFee:0}]},{...g.defaultPlan(0),choice:'service',borrow:1000,save:1000},0);
 assert.ok(g.debt(r.after)<g.debt(r.before));const v=reviewMonth(r);assert.ok(v.improve.some(x=>x.title==='Появилось будущее обязательство'));assert.ok(!v.good.some(x=>x.title==='Пополнен резерв'));
});
check('Deferred payments are distinguished from current spending',()=>{
 const r=g.settle(g.initialState(),{...g.defaultPlan(6),choice:'split'},6);
 const v=reviewMonth(r);assert.ok(v.improve.some(x=>x.title==='Есть отложенные расходы'&&/5.500/.test(x.text)));
});
check('Safety feedback remains truthful at the maximum and reports are not mutated',()=>{
 const r=g.settle({...g.initialState(),safety:10},{...g.defaultPlan(0),choice:'service'},0);const before=JSON.stringify(r);const v=reviewMonth(r);assert.ok(v.good.some(x=>x.text.includes('10 → 10')));assert.equal(JSON.stringify(r),before);
});
check('An unsafe additional decision is flagged even when the main event was safe',()=>{
 const r=g.settle(g.initialState(),{...g.defaultPlan(5),choice:'official',extras:[{scenario:'5-0',choice:'form'},{scenario:'5-1',choice:'offline'}]},5);const v=reviewMonth(r);assert.ok(v.improve.some(x=>x.title.includes('Возврат за заказ')&&x.text.includes('3 500')));assert.ok(v.good.some(x=>x.title==='Внимание к условиям'));
});
check('Safety feedback includes the additional decisions without altering their revealed reports',()=>{
 const r=g.settle(g.initialState(),{...g.defaultPlan(0),choice:'new',extras:[{scenario:'0-0',choice:'visit'},{scenario:'0-1',choice:'route'}]},0);const snapshot=JSON.stringify(r),v=reviewMonth(r);assert.ok(v.good.some(x=>x.title.includes('Ключи от новой комнаты')));assert.ok(v.good.some(x=>x.title.includes('Как добираться на пары')));assert.equal(JSON.stringify(r),snapshot);
});
console.log(JSON.stringify({checks,status:'PASS'}));
