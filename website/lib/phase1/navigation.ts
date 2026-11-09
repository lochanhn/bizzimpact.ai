export function evidenceBackTarget(returnTo:unknown):{href:string;label:string}{
 if(returnTo==='/catalog')return {href:'/catalog',label:'Back to catalogue'};
 if(typeof returnTo==='string'&&/^\/discovery\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(returnTo))return {href:returnTo,label:'Back to discovery results'};
 return {href:'/dashboard',label:'Back to dashboard'};
}
