import type { AppData, Resource, Session } from "./types";
export const STUDY_DATA_KEY = "ishtar-study-data-v2";
export const EMPTY_STUDY_DATA: AppData = { name:"", avatar:"", subjects:[], dailyGoal:0, tasks:[], grades:[], sessions:[], resources:[], words:[], goals:[], deadlines:[], events:[] };
function isRecord(value:unknown):value is Record<string,any>{return Boolean(value)&&typeof value==="object"&&!Array.isArray(value)}
function hasStrings(value:unknown,keys:string[]){return isRecord(value)&&keys.every(key=>typeof value[key]==="string")}
function validArray(value:unknown,check:(item:any)=>boolean){return value===undefined||Array.isArray(value)&&value.every(check)}
export function isStudyData(value:unknown):value is Partial<AppData>{
 if(!isRecord(value))return false;
 if(value.name!==undefined&&typeof value.name!=="string")return false;
 if(value.avatar!==undefined&&typeof value.avatar!=="string")return false;
 if(value.subjects!==undefined&&(!Array.isArray(value.subjects)||!value.subjects.every((x:unknown)=>typeof x==="string")))return false;
 if(value.dailyGoal!==undefined&&(typeof value.dailyGoal!=="number"||!Number.isFinite(value.dailyGoal)))return false;
 if(value.theme!==undefined&&value.theme!=="blue"&&value.theme!=="dark")return false;
 if(!validArray(value.tasks,x=>hasStrings(x,["id","title","subject","due"])&&typeof x.done==="boolean"))return false;
 if(!validArray(value.deadlines,x=>hasStrings(x,["id","title","date"])&&typeof x.done==="boolean"&&(x.taskId===undefined||typeof x.taskId==="string")))return false;
 if(!validArray(value.events,x=>hasStrings(x,["id","title","date"])&&(x.repeat===undefined||["none","weekly","yearly"].includes(x.repeat))))return false;
 if(!validArray(value.grades,x=>hasStrings(x,["id","subject"])&&Number.isFinite(x.score)&&Number.isFinite(x.weight)))return false;
 if(!validArray(value.sessions,x=>hasStrings(x,["id","subject","start","end"])&&Number.isFinite(x.day)))return false;
 if(!validArray(value.resources,x=>hasStrings(x,["id","title","url"])&&(x.isStarred===undefined||typeof x.isStarred==="boolean")))return false;
 if(!validArray(value.words,x=>hasStrings(x,["id","term","meaning"])&&(x.example===undefined||typeof x.example==="string")))return false;
 if(!validArray(value.goals,x=>hasStrings(x,["id","exam","target","examDate","createdAt"])&&Number.isFinite(x.scoreMin)&&Number.isFinite(x.scoreMax)&&Array.isArray(x.scores)&&x.scores.every((s:unknown)=>isRecord(s)&&hasStrings(s,["id","date"])&&typeof s.score==="number"&&Number.isFinite(s.score))))return false;
 return true;
}
export function normalizeStudyData(d:Partial<AppData>):AppData{
 const deadlines=d.deadlines||[];
 return {...EMPTY_STUDY_DATA,...d,tasks:[...(d.tasks||[]),...deadlines.filter((x:any)=>!x.taskId).map((x:any)=>({id:x.id,title:x.title,subject:"Khác",due:x.date,done:Boolean(x.done)}))],deadlines:[],events:d.events||[],grades:d.grades||[],sessions:(d.sessions||[]).map((s:Session)=>({...s,day:s.day===0?7:s.day})),resources:(d.resources||[]).map((r:Resource)=>({...r,isStarred:Boolean(r.isStarred)})),words:d.words||[],goals:d.goals||[]};
}
export function preserveCorruptData(key:string,raw:string){
 const corruptKey=key+"-corrupt-backup";
 if(localStorage.getItem(corruptKey))return true;
 localStorage.setItem(corruptKey,raw);
 return localStorage.getItem(corruptKey)===raw;
}
export function readStudyData():Partial<AppData>|null{
 try{const raw=localStorage.getItem(STUDY_DATA_KEY);if(!raw)return null;const parsed:unknown=JSON.parse(raw);return isStudyData(parsed)?parsed:null}catch{return null}
}
export type StudyWriteResult="saved"|"saved-without-backup"|"failed";
export function writeStudyData(data:AppData):StudyWriteResult{
 try{
  const previous=localStorage.getItem(STUDY_DATA_KEY);let backupFailed=false;
  if(previous){let parsed:unknown=null;try{parsed=JSON.parse(previous)}catch{}
   if(isStudyData(parsed)){try{localStorage.setItem(STUDY_DATA_KEY+"-backup",previous)}catch{backupFailed=true}}
  }
  localStorage.setItem(STUDY_DATA_KEY,JSON.stringify(data));
  return backupFailed?"saved-without-backup":"saved";
 }catch{return "failed"}
}
export function updateStudyData(patch:Partial<AppData>):StudyWriteResult{
 try{
  const raw=localStorage.getItem(STUDY_DATA_KEY);let current:AppData=EMPTY_STUDY_DATA;
  if(raw){const parsed:unknown=JSON.parse(raw);if(!isStudyData(parsed))return "failed";current=normalizeStudyData(parsed)}
  return writeStudyData({...current,...patch});
 }catch{return "failed"}
}
