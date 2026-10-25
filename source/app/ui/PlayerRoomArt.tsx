import { CharacterFigure } from './Character';
import type { CharacterId } from '@/lib/character';
import { bankLogo } from './bank-brand';

const edge={stroke:'#617383',strokeWidth:2.5,strokeLinejoin:'round' as const,strokeLinecap:'round' as const};
/** A cutaway room, with furniture on the same floor plane as the player. */
export function RoomInterior({housing,owned=[],planned=[],character,energy,night=false,ready=false}:{housing:string;owned?:string[];planned?:string[];character:CharacterId;energy:number;night?:boolean;ready?:boolean}){
 const has=(id:string)=>owned.includes(id)||planned.includes(id),pending=(id:string)=>!owned.includes(id)&&planned.includes(id);
 const studio=housing==='alone',shared=housing==='shared';
 return <svg className="player-room-art" viewBox="0 0 1000 650" role="img" aria-label={`Твоя комната: ${studio?'студия':shared?'квартира с друзьями':'общежитие'}, ${night?'вечер':'день'}`} data-housing={housing}>
  <ellipse cx="514" cy="572" rx="375" ry="25" fill="#22334e" opacity=".055"/>
  <path d="M60 340 470 195 940 360 530 575Z" fill={studio?'#d6c6ac':shared?'#d1c4b5':'#d7cbb3'} {...edge}/>
  <path d="M60 340v18l470 236v-19Zm470 235 410-215v17L530 594Z" fill="#b6b4a6" {...edge}/>
  <path d="M60 180 470 40v155L60 340Z" fill={night?'#9eafc6':'#dce7eb'} {...edge}/>
  <path d="m470 40 470 165v155L470 195Z" fill={night?'#bdc0d0':studio?'#e9e5dc':'#e5e2d7'} {...edge}/>
  <path d="m63 337 407-143 467 164" fill="none" stroke="#afbdc2" strokeWidth="7"/>
  <path d="m119 370 409-144m-312 194 409-159m-307 210 408-171m-306 224 408-183m-302 235 404-197" stroke="#b7ab96" opacity=".25" strokeWidth="2"/>
  <path d="m60 180 410-140 470 165" fill="none" stroke="#f8faf5" strokeWidth="10" strokeLinecap="round"/>
  <g transform="translate(147 192) skewY(-19)">
   <rect width={studio?220:175} height="114" rx="5" fill={night?'#6380a4':'#bbdce8'} stroke="#f7f9f2" strokeWidth="9"/>
   <path d={`M0 89 33 65h31v49H0m83 0V48h38v66m21 0V78h${studio?78:33}v36`} fill={night?'#91a4be':'#9cbecb'} opacity=".65"/>
   <path d={`M${studio?110:87} 0v114M0 57h${studio?220:175}`} stroke="#f7f9f2" strokeWidth="5"/>
   {night?<><circle cx="145" cy="21" r="11" fill="#eee3b9"/><circle cx="61" cy="26" r="2" fill="#f4efdf"/></>:<circle cx="145" cy="21" r="12" fill="#f3e5bd"/>}
   <path d={`M-10 124h${studio?240:195}`} stroke="#90a9b8" strokeWidth="8"/>
  </g>
  <g transform="translate(610 151) skewY(19)">
   <rect width="145" height="85" rx="5" fill="#cbbd9e" {...edge}/>
   <rect x="12" y="11" width="52" height="59" rx="3" fill="#f4efdd" transform="rotate(-6 37 40)"/>
   <path d="M21 28h32M21 39h27M21 50h32" stroke="#a0b2b1" strokeWidth="4"/>
   <rect x="79" y="13" width="51" height="49" fill="#d9e5c7" transform="rotate(6 104 37)"/>
   <path d="m89 37 9 9 21-23" fill="none" stroke="#799a82" strokeWidth="4"/>
   <circle cx="40" cy="10" r="3" fill="#7f96aa"/><circle cx="103" cy="14" r="3" fill="#7f96aa"/>
  </g>
  <g transform="translate(834 228) skewY(19)"><path d="M0 0h74v102H0Z" fill={studio?'#b3c5c2':'#bdc6c7'} {...edge}/><path d="M9 11h56v78H9Z" fill="#ced8d2" stroke="#9daeb4" strokeWidth="2"/><circle cx="58" cy="59" r="4" fill="#718794"/></g>
  {shared&&<g><path d="m104 337 74-25 76 28-73 27Z" fill="#c4bcb0" {...edge}/><path d="m104 337 77 30v58l-77-37Z" fill="#a7b9b0" {...edge}/><path d="m181 367 73-27v54l-73 31Z" fill="#90aaa5" {...edge}/><path d="M128 317v-49m32 36v-42m29 32v-40" stroke="#7b9793" strokeWidth="5"/><path d="m113 276 31-11 15 15-31 11Zm38-12 31-11 15 15-31 11Z" fill="#c3d1c9" {...edge}/></g>}
  {studio&&<g><path d="m105 387 86-35 154 65-91 42Z" fill="#b5c3b1" {...edge}/><path d="m105 387 149 72v41l-149-78Z" fill="#97b2a3" {...edge}/><path d="m254 459 91-42v38l-91 45Z" fill="#83a395" {...edge}/><path d="m111 376 24-12 136 61-20 17Z" fill="#c9d5c1" {...edge}/><path d="m163 380 40-16 45 20-40 17Z" fill="#e2d2b1" {...edge}/></g>}
  <path d="m340 430 159-61 190 79-155 78Z" fill={studio?'#a3bab6':'#afc1c5'} opacity=".65"/>
  <path d="m355 430 144-53 175 71-140 68Z" fill="none" stroke="#dce5dc" strokeWidth="3" opacity=".8"/>
  <g className={pending('desk')?'room-item-preview':''} data-room-item="desk" data-upgraded={has('desk')}>
   <path d="m170 290 150-55 130 45-155 60Z" fill={has('desk')?'#c1a47d':'#d5c3a2'} {...edge}/>
   <path d="M170 290v15l125 49v-14Zm125 50 155-60v15l-155 59Z" fill={has('desk')?'#a99170':'#b9aa91'} {...edge}/>
   <path d="M187 310v65m109-21v69m136-125v61" stroke="#7a8f96" strokeWidth="8"/>
   {has('desk')&&<><path d="m185 315 65 24v38l-65-25Z" fill="#b4aaa0" {...edge}/><path d="m203 343 27 10" stroke="#728995" strokeWidth="3"/></>}
  </g>
  <g transform="translate(291 250) skewY(-19)"><rect x="-24" y="-47" width="88" height="55" rx="5" fill="#8299b8" {...edge}/><rect x="-17" y="-41" width="74" height="41" rx="2" fill="#deecf1"/><path d="M-6-27h43m-43 10h29" stroke="#97b4c9" strokeWidth="4"/><path d="m-31 9 98 0 14 13H-40Z" fill="#bccad1" {...edge}/></g>
  <g data-room-item="lamp" data-upgraded={has('lamp')} className={pending('lamp')?'room-item-preview':''}>
   {has('lamp')?<><path d="M219 265v-57l36-17" fill="none" stroke="#708594" strokeWidth="5"/><path d="m242 189 24-9 14 20-43 15Z" fill="#ead198" {...edge}/><ellipse cx="218" cy="267" rx="16" ry="5" fill="#8fa3a8"/>{night&&<path d="m245 212 31-11 18 63-94 8Z" fill="#f2e0a2" opacity=".18"/>}</>:<path d="M213 266v-32l17-8m-23 11 27-13" stroke="#a3b1b7" strokeWidth="4" fill="none"/>}
  </g>
  <g transform="translate(391 277) rotate(-18)"><rect width="26" height="43" rx="5" fill="#526a8a"/><rect x="3" y="4" width="20" height="34" rx="2" fill="#f5f8ef"/><image href={bankLogo} x="5" y="11" width="16" height="5"/><path d="m7 24 5 4 7-10" fill="none" stroke="#90aa9a" strokeWidth="2"/></g>
  <g data-room-item="chair" data-upgraded={has('chair')} className={pending('chair')?'room-item-preview':''}>
   {has('chair')?<><path d="m326 343 42-16 29 15-44 19Z" fill="#a2b9c9" {...edge}/><path d="m348 319-1-44q18-14 37-2l5 43" fill="#8ea9bd" {...edge}/><path d="M357 362v37m-22 9 22-9 24 10" stroke="#6d8495" strokeWidth="6"/></>:<><ellipse cx="354" cy="349" rx="27" ry="13" fill="#c5b494" {...edge}/><path d="m337 357-8 35m40-35 7 35" stroke="#8d9c98" strokeWidth="6"/></>}
  </g>
  <g data-room-item="mattress" data-upgraded={has('mattress')} className={pending('mattress')?'room-item-preview':''}>
   <path d="m600 365 185-80 115 45-185 80Z" fill="#a6afa7" {...edge}/><path d="m600 365 115 45v32l-115-48Zm115 45 185-80v29l-185 83Z" fill="#9ba9a4" {...edge}/>
   <path d="m785 262 115 45v-48l-115-45Z" fill="#a6b8b1" {...edge}/>
   <path d="m600 344 185-80 115 43-185 80Z" fill={has('mattress')?'#f4ecdb':'#dadfd6'} {...edge}/>
   <path d="m600 344 115 43v15l-115-44Zm115 43 185-80v15l-185 80Z" fill={has('mattress')?'#e5d9be':'#c5d0ca'} {...edge}/>
   <path d="m603 344 135-57 113 44-134 57Z" fill={has('mattress')?'#a2b8d0':'#b4c5c1'} {...edge}/>
   <path d="m790 275 72 27-33 16-73-27Z" fill="#f7f5e7" {...edge}/>
   {has('mattress')&&<path d="m637 342 106-43m-77 57 107-44" stroke="#c7d6e4" strokeWidth="3"/>}
  </g>
  <g data-room-item="shelf" data-upgraded={has('shelf')} className={pending('shelf')?'room-item-preview':''}>
   {has('shelf')?<g transform="translate(81 244) skewY(-19)"><rect width="75" height="95" rx="3" fill="#baa98a" {...edge}/>{[0,1].map(row=><g key={row}><path d={`M0 ${44+row*47}h75`} stroke="#71858b" strokeWidth="3"/>{[10,24,38,54].map((x,i)=><rect key={x} x={x} y={9+row*47+i%2*5} width="11" height={30-i%2*5} fill={['#9eb5a1','#d5b686','#94abc5','#c79e88'][i]} stroke="#71858b" strokeWidth="1.5"/>)}</g>)}</g>:<g transform="translate(112 323) rotate(-12)"><path d="M-23 0h43v11h-43Z" fill="#b9c7ab" {...edge}/><path d="M-19-11h43V0h-43Z" fill="#d5be91" {...edge}/></g>}
  </g>
  <g><path d="m790 303 65-27 65 23-66 31Z" fill="#b5c0b7" {...edge}/><path d="m790 303 64 27v100l-64-27Z" fill="#a5b6ad" {...edge}/><path d="m854 330 66-31v99l-66 32Z" fill="#94a9a2" {...edge}/><path d="M820 316v97m66-98v97" stroke="#778e90" strokeWidth="2"/><path d="m833 363 5 2m39-11 5-3" stroke="#edf0df" strokeWidth="4"/></g>
  {has('plant')&&<g data-room-item="plant" className={pending('plant')?'room-item-preview':''} transform="translate(259 440)"><path d="M-22-13h44l-6 42h-32Z" fill="#c4ad8c" {...edge}/><path d="M0-12v-58" stroke="#7d9b8b" strokeWidth="5"/><path d="M0-28q-39-13-26-43 31 5 26 43m0-14q-6-35 22-47 20 31-22 47" fill="#94b69c" {...edge}/></g>}
  <g transform="translate(450 251) scale(.75)"><ellipse cx="108" cy="319" rx="60" ry="9" fill="#51677e" opacity=".12"/><CharacterFigure character={character} emotion={energy<35?'thinking':ready?'happy':'neutral'}/></g>
  {studio&&<path d="m393 123 27-9v49l-27 10Z" fill="#ced8cb" {...edge}/>}
 </svg>;
}
