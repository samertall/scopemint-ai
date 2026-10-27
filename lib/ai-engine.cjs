'use strict';
/**
 * Locally trained Multinomial Naive Bayes classifier for work-scope analysis.
 * Optional OpenAI text enrichment is in api/analyze.js.
 */
const training={
  "web": [
    "Build a responsive website with mobile navigation and forms",
    "Design a three page SaaS dashboard with interactive charts",
    "Create an ecommerce store with cart checkout and products",
    "Redesign a business website for accessibility and SEO",
    "Develop a React frontend and integrate API endpoints",
    "Landing page website with lead generation and animation",
    "Improve page speed and mobile web user experience",
    "Design app wireframes and build a responsive prototype",
    "Build a WordPress site with booking and online payments",
    "Create a product design system and interactive UI components",
    "Develop web application user login and account dashboard",
    "Make online store layouts and a responsive checkout journey"
  ],
  "brand": [
    "Create a brand identity with logo colors and guidelines",
    "Design custom typography and a visual identity system",
    "Produce packaging design and marketing brand assets",
    "Design a logo and business cards for a coffee shop",
    "Create a comprehensive brand style guide and illustrations",
    "Develop icon sets and branded social media templates",
    "Redesign the company logo and stationery",
    "Create a new visual direction and brand book",
    "Design editorial layouts brochures and campaign artwork",
    "Create a visual identity and brand presentation deck"
  ],
  "marketing": [
    "Write social media posts and manage a monthly calendar",
    "Build an SEO strategy and optimize blog articles",
    "Create email campaigns and newsletter templates",
    "Plan paid search advertising and conversion tracking",
    "Develop content marketing strategy and product copy",
    "Create a launch campaign including Instagram posts",
    "Research keyword opportunities and write website content",
    "Produce three marketing videos and short reels",
    "Design performance marketing ads and measure analytics",
    "Develop audience personas and conversion funnel messaging"
  ],
  "education": [
    "Design five lessons and assessment rubrics for students",
    "Develop an online learning course with interactive exercises",
    "Create classroom activities and educational worksheets",
    "Produce training modules for teachers and a facilitator guide",
    "Write curriculum content and learner outcomes",
    "Build instructional videos and digital learning games",
    "Create a language learning course for primary school",
    "Design an LMS course and quizzes for adult learners",
    "Develop phonics lessons and student practice materials",
    "Create educational animations with learning objectives"
  ],
  "consulting": [
    "Audit current product usability and recommend improvements",
    "Research customer needs and prepare a strategy report",
    "Facilitate stakeholder workshops and present findings",
    "Analyze business operations and recommend processes",
    "Evaluate product roadmap and prioritize opportunities",
    "Run customer interviews and create user journey maps",
    "Create a competitive analysis and future growth strategy",
    "Review technical architecture and document a migration plan",
    "Advise on business launch and operational planning",
    "Conduct usability testing and summarize research insights"
  ]
};
const labels={web:'Product & web',brand:'Brand & creative',marketing:'Content & marketing',education:'Learning & training',consulting:'Research & consulting'};
const templates={
  web:['Discovery, structure & scope','UX/UI design & development','QA, handoff & launch'],
  brand:['Creative direction & discovery','Visual identity & iterations','Brand kit & final assets'],
  marketing:['Research & campaign strategy','Content production & review','Launch & performance report'],
  education:['Learning objectives & outline','Content creation & activities','Quality review & delivery'],
  consulting:['Kickoff & research plan','Investigation & working insights','Recommendations & handoff']
};
function tokenize(str){return (String(str||'').toLowerCase().match(/[a-z][a-z0-9-]{1,}/g)||[]).map(w=>w.replace(/s$/,''));}
const vocabulary=new Set(),trained={};let grandTotal=0;
for(const [category,samples] of Object.entries(training)){
 const counts=new Map();let count=0;
 for(const sample of samples)for(const word of tokenize(sample)){vocabulary.add(word);counts.set(word,(counts.get(word)||0)+1);count++;}
 trained[category]={counts,count,prior:samples.length};grandTotal+=samples.length;
}
function classify(text){
 const terms=tokenize(text);
 const scores=Object.entries(trained).map(([category,model])=>{
 let score=Math.log(model.prior/grandTotal);
 for(const t of terms)score+=Math.log(((model.counts.get(t)||0)+1)/(model.count+vocabulary.size));
 return {category,score};
 }).sort((a,b)=>b.score-a.score);
 const exp=scores.map(e=>Math.exp(e.score-scores[0].score)),z=exp.reduce((a,b)=>a+b,0);
 return {category:scores[0].category,label:labels[scores[0].category],confidence:Math.round(100*exp[0]/z),alternatives:scores.slice(0,3).map((e,i)=>({label:labels[e.category],score:Math.round(100*exp[i]/z)}))};
}
function detectMoney(text){
 const m=String(text||'').match(/(?:\$|USD\s*|budget(?:\s*(?:of|is|around|:))?\s*\$?\s*)([\d,]+(?:\.\d{1,2})?)/i);
 if(!m)return null;
 const n=Number(m[1].replace(/,/g,''));return Number.isFinite(n)&&n>=1&&n<=100000?n:null;
}
function textCase(value){const t=String(value||'').replace(/\s+/g,' ').trim();return t?t.charAt(0).toUpperCase()+t.slice(1):t;}
function analyzeBrief({brief,budget,title}){
 const input=String(brief||'').trim();
 if(input.length<20)throw Object.assign(new Error('Please describe the project in at least 20 characters.'),{code:'INVALID_BRIEF'});
 if(input.length>3000)throw Object.assign(new Error('The brief is too long (maximum 3,000 characters).'),{code:'INVALID_BRIEF'});
 const c=classify(input),found=detectMoney(input),suggested=Number(budget)||found||1200;
 const total=Math.max(1,Math.min(100000,Math.round(suggested*100)/100));
 const hasTime=/\b(day|days|week|weeks|month|months|by\s+\w+|deadline|deliver\s+by)\b/i.test(input);
 const hasQuantity=/\b\d+\s+(?:(?:responsive|interactive|digital|mobile|branded|short|custom|social|web|learning|training|online)\s+){0,2}(?:page|screen|lesson|video|post|asset|module|workshop|article|template|deliverable|logo|round)s?\b/i.test(input);
 const hasReview=/\b(review|feedback|revision|iteration|approval|amend)\b/i.test(input);
 const openEnded=/\b(unlimited|as needed|anything|everything|all tasks)\b/i.test(input);
 const risks=[];
 if(!hasTime)risks.push({type:'timeline',severity:'medium',title:'Delivery date is open',detail:'Agree on an estimated date for each milestone before accepting payment.'});
 if(!hasQuantity)risks.push({type:'scope',severity:'medium',title:'Deliverables need quantities',detail:'Add a page, screen, asset, or deliverable count to prevent misunderstandings.'});
 if(!hasReview)risks.push({type:'reviews',severity:'low',title:'Revision rounds undefined',detail:'Specify what feedback is included and how many revision rounds are allowed.'});
 if(openEnded)risks.push({type:'open-ended',severity:'high',title:'Open-ended commitment detected',detail:'Replace vague or unlimited language with measurable acceptance criteria.'});
 const titleText=textCase(String(title||'').trim()||(c.category==='web'?'Digital product project':c.label+' project'));
 const shares=[30,40,30];
 const milestones=templates[c.category].map((name,index)=>({id:index+1,name,percent:shares[index],amount:Number((total*shares[index]/100).toFixed(2)),details:[
 'Agree on a concrete scope, expected outputs, and success criteria before work begins.',
 'Produce reviewable work and collect written feedback before moving forward.',
 'Deliver final files, quality checks, and handoff documentation.'
 ][index]}));
 milestones[2].amount=Number((total-milestones[0].amount-milestones[1].amount).toFixed(2));
 const score=Math.max(30,Math.min(100,100-(hasTime?0:18)-(hasQuantity?0:19)-(hasReview?0:13)-(openEnded?20:0)));
 return {title:titleText,category:c.label,category_id:c.category,confidence:c.confidence,category_alternatives:c.alternatives,score,budget:total,currency:'USD',
 summary:`A ${c.label.toLowerCase()} engagement with three reviewable milestones and explicit client approval before every PayPal payment.`,
 milestones,risks,
 plainLanguage:`You are paying for ${titleText.toLowerCase()}. The estimated total is $${total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})} across three stages. Each stage lists what you'll receive, and each payment requires your approval. This is a project agreement preview, not an escrow service.`,
 aiProvider:'built-in-naive-bayes',
 classificationExplanation:'A locally trained Multinomial Naive Bayes text classifier categorizes the brief. Structured rules then check for missing contract clarity and produce a human-editable milestone proposal.',
 generatedAt:new Date().toISOString()};
}
module.exports={classify,analyzeBrief,detectMoney,tokenize};
