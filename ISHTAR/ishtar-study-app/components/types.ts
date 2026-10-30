export type TabId="overview"|"schedule"|"tasks"|"grades"|"pomodoro"|"resources"|"language"|"flashcards"|"settings";
export type Task={id:string;title:string;subject:string;due:string;done:boolean};
export type Grade={id:string;subject:string;score:number;weight:number};
export type Session={id:string;subject:string;day:number;start:string;end:string};
export type StudySession={day:string;time:string;subject:string;duration:string;color:string};

export type Resource={id:string;title:string;url:string;isStarred?:boolean};
export type Word={id:string;term:string;meaning:string};
export type Goal={id:string;exam:string;target:string;examDate:string;createdAt:string;scoreMin:number;scoreMax:number;scores:{id:string;date:string;score:number}[]};
export type AppData={name:string;avatar:string;subjects:string[];dailyGoal:number;tasks:Task[];grades:Grade[];sessions:Session[];resources:Resource[];words:Word[];goals:Goal[];theme?:"blue"|"green"|"pink"|"dark"};