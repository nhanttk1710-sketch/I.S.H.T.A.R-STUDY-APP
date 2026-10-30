export type TabId = "overview" | "schedule" | "tasks" | "grades" | "pomodoro" | "resources" | "language" | "flashcards";
export type Task = { id:number; title:string; subject:string; due:string; done:boolean };
export type Grade = { id:number; subject:string; score:number; weight:number };
export type StudySession = { day:string; time:string; subject:string; duration:string; color:string };
export type AppData = { name:string; subjects:string[]; dailyGoal:number; deadlines:string; examDate:string; tasks:Task[]; grades:Grade[]; streak:number; languageGoal:string; languageProgress:number };
