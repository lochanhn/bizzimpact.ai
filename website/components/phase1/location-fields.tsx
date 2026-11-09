'use client';
import { useEffect,useRef,useState } from 'react';
import { Check,ChevronDown } from 'lucide-react';
import { countryOptions,countryFor,regionsFor,regionFor,type LocationOption } from '@/lib/phase1/locations';

function SearchSelect({id,label,value,options,onChange,disabled=false,optional=false}:{id:string;label:string;value:string;options:LocationOption[];onChange:(value:string)=>void;disabled?:boolean;optional?:boolean}){
 const [open,setOpen]=useState(false);const [query,setQuery]=useState('');const [active,setActive]=useState(0);
 const list=useRef<HTMLDivElement>(null);const selected=options.find(o=>o.value===value);
 const normalize=(text:string)=>text.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('en');const term=normalize(query.trim());
 const score=(o:LocationOption)=>!term?0:normalize(o.value)===term||normalize(o.searchTerms??'').split(/\s+/).includes(term)?3:normalize(o.label)===term?2:normalize(o.label).startsWith(term)?1:0;
 const matches=options.filter(o=>normalize(o.label+' '+o.value+' '+(o.searchTerms??'')).includes(term)).sort((a,b)=>score(b)-score(a));
 const activeId=open&&matches[active]?`${id}-option-${active}`:undefined;
 useEffect(()=>{
  const menu=list.current;const item=activeId?document.getElementById(activeId):null;if(!menu||!item)return;
  const top=item.getBoundingClientRect().top-menu.getBoundingClientRect().top+menu.scrollTop;
  if(top<menu.scrollTop)menu.scrollTop=top;
  else if(top+item.offsetHeight>menu.scrollTop+menu.clientHeight)menu.scrollTop=top+item.offsetHeight-menu.clientHeight;
 },[activeId]);
 function close(){setOpen(false);setQuery('');setActive(0);}
 function openList(){setOpen(true);setQuery('');setActive(Math.max(0,options.findIndex(o=>o.value===value)));}
 function choose(option:LocationOption){onChange(option.value);close();}
 return <div className="location-control" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))close();}}>
  <label className="location-label" htmlFor={id}>{label}{optional&&<span>Optional</span>}</label>
  <div className="location-input"><input id={id} role="combobox" aria-expanded={open} aria-controls={`${id}-options`} aria-autocomplete="list" aria-activedescendant={activeId} aria-required={!optional} disabled={disabled} autoComplete="off" value={disabled?'':open?query:selected?.label??value} placeholder={disabled?'Choose a country first':selected?.label??`Choose ${label.toLowerCase()}`} onFocus={openList} onClick={()=>{if(!open)openList();}} onChange={e=>{setQuery(e.target.value);setOpen(true);setActive(0);}} onKeyDown={e=>{
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!open){openList();}else setActive(i=>matches.length?(i+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length:0);}
   else if(e.key==='Enter'&&open){e.preventDefault();if(matches[active])choose(matches[active]);}
   else if(e.key==='Escape'){e.preventDefault();close();}
   else if(e.key==='Tab')close();
  }}/><ChevronDown size={17} aria-hidden="true"/></div>
  {open&&!disabled&&<div className="location-options" ref={list} id={`${id}-options`} role="listbox" aria-label={`${label} options`}>{matches.length?matches.map((o,i)=><button type="button" role="option" id={`${id}-option-${i}`} key={o.value} tabIndex={-1} aria-selected={o.value===value} className={i===active?'is-highlighted':''} onPointerDown={e=>e.preventDefault()} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActive(i)} onClick={()=>choose(o)}>{o.label}{o.value===value&&<Check size={15} aria-hidden="true"/>}</button>):<p className="location-empty" role="status">No matching options.</p>}</div>}
 </div>;
}

export default function LocationFields({value,onChange,label}:{value:{country:string;region:string|null};onChange:(value:{country:string;region:string|null})=>void;label:string}){
 const [manual,setManual]=useState(false);const country=countryFor(value.country);const regions=regionsFor(value.country);const known=regionFor(value.country,value.region);
 useEffect(()=>setManual(false),[value.country]);
 const options:LocationOption[]=[{value:'',label:'Not specified'},...regions,...(value.region&&!known?[{value:value.region,label:value.region}]:[]),{value:'__other__',label:'Other / not listed'}];
 return <fieldset className="location-fields"><legend className="field-label">{label}</legend><div className="location-grid">
  <SearchSelect id="Q5" label="Country" value={value.country.toUpperCase()} options={countryOptions} onChange={code=>onChange({country:code,region:code===value.country?value.region:null})}/>
  {country&&(manual||!regions.length)?<div className="location-control"><label className="location-label" htmlFor="region">State / province / region<span>Optional</span></label><input id="region" value={value.region??''} maxLength={100} placeholder="Enter your state or region" autoComplete="address-level1" onChange={e=>onChange({...value,region:e.target.value||null})}/>{regions.length>0&&<button className="text-button location-list-link" type="button" onClick={()=>setManual(false)}>Choose from list</button>}</div>:<SearchSelect key={value.country} id="region" label="State / province / region" optional disabled={!country} value={known?.value??value.region??''} options={options} onChange={region=>{if(region==='__other__'){setManual(true);onChange({...value,region:null});}else onChange({...value,region:region||null});}}/>}
 </div></fieldset>;
}
