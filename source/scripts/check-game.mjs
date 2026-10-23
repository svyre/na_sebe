import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../lib/game.ts',import.meta.url),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const g=await import('data:text/javascript;base64,'+Buffer.from(output).toString('base64'));
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const near=(a,b,tolerance=.03)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
check('Transfers preserve capital; new savings earn interest next month',()=>{const p=g.defaultPlan();const a=g.settle(g.INITIAL,p,0);const b=g.settle(g.INITIAL,{...p,save:10000},0);near(g.capital(a.after),g.capital(b.after));near(a.interest,b.interest);near(a.after.cash-b.after.cash,10000);assert.deepEqual(g.INITIAL,{cash:26000,savings:12000,fund:0,education:72,energy:78,skills:0,safety:5,loans:[],pending:[],deficits:0});});
check('Borrowed principal is not profit; all fees are charged',()=>{for(const o of g.OFFERS){const p=g.defaultPlan();const a=g.settle(g.INITIAL,p,0),b=g.settle(g.INITIAL,{...p,borrow:20000,offer:o.id},0);near(g.capital(a.after)-g.capital(b.after),o.fee);near(g.debt(b.after),20000);assert.ok(g.evaluate(b.after,'capital').reserveMonths<=g.evaluate(a.after,'capital').reserveMonths+.01);near(b.after.cash-a.after.cash,20000-o.fee);}});
check('Quoted annuity totals match amortization, including zero-percent fees',()=>{for(const o of g.OFFERS){const q=g.creditQuote(20000,o.id);let balance=20000,total=o.fee;const pay=g.annuity(20000,o.rate,o.term);for(let n=0;n<o.term;n++){const interest=Math.round(balance*o.rate/1200*100)/100;const principal=Math.min(balance,pay-interest);total+=principal+interest+o.monthlyFee;balance=Math.round((balance-principal)*100)/100;}total+=Math.max(0,balance);near(total,q.total,.15);}});
check('Loan repayments settle within the declared term',()=>{for(const id of ['clear','zero']){let s=g.settle(g.INITIAL,{...g.defaultPlan(0),borrow:20000,offer:id},0).after;const term=g.OFFERS.find(o=>o.id===id).term;for(let m=1;m<=term;m++)s=g.settle(s,g.defaultPlan(m),m).after;assert.equal(s.loans.length,0);}});
check('Forecast does not reveal the current market or hidden fraud losses',()=>{const input={...g.clone(g.INITIAL),fund:10000};const p=g.defaultPlan(0);near(g.settle(input,p,0,'capital',false).market,0);near(g.settle(input,p,0).market,-200);const fraud={...g.defaultPlan(5),choice:'code'};const before=g.settle(g.INITIAL,fraud,5,'capital',false);const after=g.settle(g.INITIAL,fraud,5);near(before.after.cash-after.after.cash,9000);});
check('Overspending, invalid numbers, unavailable assets and time are checked',()=>{const p=g.defaultPlan();assert.ok(g.validatePlan({...p,job:'intense',study:48,housing:'alone'},g.INITIAL,0));assert.ok(g.validatePlan({...p,borrow:40001},g.INITIAL,0));assert.ok(g.validatePlan({...p,withdraw:12001},g.INITIAL,0));assert.ok(g.validatePlan({...p,invest:NaN},g.INITIAL,0));assert.ok(g.validatePlan({...p,save:-1},g.INITIAL,0));assert.throws(()=>g.settle(g.INITIAL,{...p,save:999999},0));});
check('A scenario needs an explicit choice, while fixed costs can be previewed',()=>{const p={...g.defaultPlan(),choice:''};assert.ok(g.validatePlan(p,g.INITIAL,0));assert.throws(()=>g.settle(g.INITIAL,p,0));assert.ok(Number.isFinite(g.settle(g.INITIAL,p,0,'capital',false).after.cash));});
let s=g.clone(g.INITIAL),reports=[];for(let m=0;m<12;m++){const r=g.settle(s,g.defaultPlan(m),m);s=r.after;reports.push(r);}
check('An unchanged replay reproduces all 12 states exactly',()=>{assert.deepEqual(g.replay(reports,0,reports[0].plan.choice,'capital').state,s);});
check('Counterfactual changes one choice without changing the original history',()=>{const snapshot=JSON.stringify(reports);const alt=g.replay(reports,0,'new','capital');assert.equal(JSON.stringify(reports),snapshot);assert.notEqual(g.capital(alt.state),g.capital(s));assert.equal(alt.reports.length,12);});
check('Delayed obligations are deducted once, when measuring capital',()=>{const p={...g.defaultPlan(6),choice:'split'};const a=g.settle(g.INITIAL,p,6);assert.equal(a.after.pending[0].cash,-5500);const b=g.settle(a.after,g.defaultPlan(7),7);assert.equal(b.after.pending.length,0);assert.equal(b.ledger.filter(x=>x.label==='Второй платёж за ремонт').length,1);});
check('Many valid strategies keep money ledgers and resource bounds consistent',()=>{let seed=41;const rnd=n=>{seed=(seed*1664525+1013904223)>>>0;return seed%n;};for(let run=0;run<30;run++){let state=g.clone(g.INITIAL);for(let m=0;m<12;m++){let p;do{p={...g.defaultPlan(m),housing:g.HOUSING[rnd(3)].id,job:g.JOBS[rnd(4)].id,study:g.STUDIES[rnd(3)].hours,choice:g.SCENARIOS[m].options[rnd(3)].id,leisure:rnd(10)*500};}while(g.validatePlan(p,state,m));const r=g.settle(state,p,m);near(state.cash+r.ledger.reduce((a,x)=>a+x.amount,0),r.after.cash);assert.ok(r.after.savings>=0&&r.after.fund>=0&&g.debt(r.after)>=0);assert.ok(r.after.education>=0&&r.after.education<=100&&r.after.energy>=0&&r.after.energy<=100);assert.ok(Number.isFinite(g.capital(r.after)));state=r.after;}}});
check('Legacy games retain the exact balanced rules and independent initial states',()=>{
  assert.equal(g.difficultyId(undefined),'balance');assert.equal(g.difficultyId('unknown'),'balance');assert.equal(g.difficultyId('__proto__'),'balance');
  assert.deepEqual(g.initialState(),g.INITIAL);
  const first=g.initialState('first');first.loans.push({id:'test'});assert.equal(g.initialState('first').loans.length,0);
  for(let m=0;m<12;m++)assert.deepEqual(g.settle(reports[m].before,reports[m].plan,m),g.settle(reports[m].before,reports[m].plan,m,'capital',true,'balance'));
});
check('Difficulty changes support, time, prices and market risk without leaking future returns',()=>{
  const totals=[];
  for(const id of Object.keys(g.DIFFICULTIES)){
    const level=g.DIFFICULTIES[id],state=g.initialState(id),plan={...g.defaultPlan(2),job:'part',study:48,choice:'repair'};
    assert.equal(g.planHours(plan,2),118);
    assert.equal(!!g.validatePlan(plan,state,2,false,id),id==='challenge');
    const input={...state,fund:10000},p=g.defaultPlan(2);
    const result=g.settle(input,p,2,'capital',true,id),forecast=g.settle(input,p,2,'capital',false,id);
    assert.equal(result.ledger.find(x=>x.label==='Поддержка семьи').amount,level.support);
    near(result.market,-800*level.marketFactor);assert.equal(forecast.market,0);
    near(input.cash+result.ledger.reduce((sum,x)=>sum+x.amount,0),result.after.cash);
    totals.push(result.ledger.filter(x=>['Продукты','Общежитие','Транспорт','Связь и бытовые расходы'].includes(x.label)).reduce((sum,x)=>sum-x.amount,0));
    const fraud={...g.defaultPlan(5),choice:'code'};
    near(g.settle(state,fraud,5,'capital',false,id).after.cash-g.settle(state,fraud,5,'capital',true,id).after.cash,9000);
  }
  assert.ok(totals[0]<totals[1]&&totals[1]<totals[2]);
});
check('Every level completes 12 months and replays its own initial resources exactly',()=>{
  const ends=[];
  for(const id of Object.keys(g.DIFFICULTIES)){
    let state=g.initialState(id);const history=[];
    for(let m=0;m<12;m++){
      const r=g.settle(state,g.defaultPlan(m),m,'capital',true,id);
      near(state.cash+r.ledger.reduce((sum,x)=>sum+x.amount,0),r.after.cash);
      assert.equal(r.score,g.evaluate(r.after,'capital',r.plan,m,id).total);
      history.push(r);state=r.after;
    }
    assert.deepEqual(g.replay(history,0,history[0].plan.choice,'capital',id).state,state);
    const snapshot=JSON.stringify(history);const alt=g.replay(history,0,'new','capital',id);
    assert.equal(JSON.stringify(history),snapshot);assert.equal(alt.reports.length,12);
    ends.push(g.capital(state));
  }
  assert.ok(ends[0]>ends[1]&&ends[1]>ends[2]);
});
check('All goals are reachable on every level while preserving study and energy',()=>{
  const route=[['part',32,'service'],['flex',48,'university'],['part',32,'repair'],['part',32,'handmade'],['flex',48,'group'],['part',32,'official'],['flex',48,'organize'],['part',16,'paid'],['part',32,'research'],['flex',32,'bonus'],['flex',32,'project'],['part',32,'keep']];
  for(const id of Object.keys(g.DIFFICULTIES))for(const goal of Object.keys(g.GOALS)){
    let state=g.initialState(id),last;
    for(let m=0;m<12;m++){
      const [job,study,choice]=goal==='career'&&m===4?['flex',32,'course']:route[m];
      last={...g.defaultPlan(m),job,study,choice,leisure:0};
      state=g.settle(state,last,m,goal,true,id).after;
      assert.ok(state.cash>=0&&state.education>=50&&state.energy>=25);
    }
    assert.equal(g.evaluate(state,goal,last,11,id).achieved,true,`${id}: ${goal}`);
  }
});
console.log(JSON.stringify({checks,defaultStrategy:{capital:g.capital(s),education:s.education,energy:s.energy,score:g.evaluate(s,'capital').total}}));
