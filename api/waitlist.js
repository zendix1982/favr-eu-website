const props=['country','city','role','consent_at'];
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 const {email,country,city,role,consent,website}=req.body||{};
 if(website)return res.status(200).json({ok:true});
 if(typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof country!=='string'||!(/^[A-Z]{2}$/.test(country)||country==='OTHER')||typeof city!=='string'||city.trim().length<2||city.length>100||!['rider','partner'].includes(role)||consent!==true)return res.status(400).json({error:'Invalid signup'});
 const key=process.env.RESEND_API_KEY;if(!key)return res.status(503).json({error:'Waitlist not configured'});
 const headers={Authorization:'Bearer '+key,'Content-Type':'application/json'};
 try{
  // Create missing contact properties once; never hide an authentication error.
  for(const name of props){
   const p=await fetch('https://api.resend.com/contact-properties',{method:'POST',headers,body:JSON.stringify({key:name,type:'string'})});
   if(!p.ok){const detail=await p.text();if(p.status===401||p.status===403){console.error('Resend contact-property permission',p.status,detail.slice(0,500));return res.status(503).json({error:'Resend API key lacks contact permissions'});}if(p.status!==409&&p.status!==422){console.error('Resend contact property',name,p.status,detail.slice(0,500));return res.status(503).json({error:'Waitlist setup incomplete'});}}
  }
  const response=await fetch('https://api.resend.com/contacts',{method:'POST',headers,body:JSON.stringify({email:email.trim().toLowerCase(),unsubscribed:false,properties:{country,city:city.trim(),role,consent_at:new Date().toISOString()}})});
  if(response.status===409)return res.status(409).json({error:'Already registered'});
  if(!response.ok){console.error('Resend contact create',response.status,(await response.text()).slice(0,500));return res.status(502).json({error:'Unable to save signup'});}
  return res.status(201).json({ok:true});
 }catch(error){console.error('Waitlist connection',String(error));return res.status(502).json({error:'Unable to save signup'});}
}