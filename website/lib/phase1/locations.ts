import { allCountries } from 'country-region-data';
export type LocationOption={value:string;label:string;searchTerms?:string};
// The source includes US postal destinations; omit military address codes and
// sovereign countries from the list of US states/territories.
const nonUSRegions=new Set(['AA','AE','AP','FM','MH','PW']);
export const countryLocations=allCountries.map(([label,value,regions])=>({
 value,label,regions:regions.filter(([,code])=>value!=='US'||!nonUSRegions.has(code)).map(([name,code])=>({value:code||name,label:name})).sort((a,b)=>a.label.localeCompare(b.label,'en')),
})).sort((a,b)=>a.label.localeCompare(b.label,'en'));
const aliases:Record<string,string>={US:'USA United States of America',GB:'UK Great Britain',AE:'UAE',CZ:'Czechia',TR:'Türkiye Turkiye',KR:'South Korea',KP:'North Korea'};
export const countryOptions:LocationOption[]=countryLocations.map(({value,label})=>({value,label,searchTerms:aliases[value]??''}));
export function countryFor(code:string){return countryLocations.find(c=>c.value===code.toUpperCase());}
export function regionsFor(code:string):LocationOption[]{return countryFor(code)?.regions??[];}
export function regionFor(country:string,region:string|null){const normalized=region?.trim().toLowerCase();return regionsFor(country).find(r=>r.value.toLowerCase()===normalized||r.label.toLowerCase()===normalized);}
export function locationLabel(country:string,region:string|null){return `${countryFor(country)?.label??country}${region?' · '+(regionFor(country,region)?.label??region):''}`;}
