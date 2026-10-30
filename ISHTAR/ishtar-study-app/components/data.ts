import type { Grade, StudySession, Task } from "./types";
export const initialTasks:Task[] = [
 {id:1,title:"Hoàn thành bài tập đạo hàm",subject:"Toán",due:"2026-10-31T20:00",done:false},
 {id:2,title:"Ôn từ vựng Unit 5",subject:"Tiếng Anh",due:"2026-11-01T21:00",done:false},
 {id:3,title:"Đọc lại chương Nhiệt học",subject:"Vật lý",due:"2026-11-03T19:00",done:true},
 {id:4,title:"Viết đoạn IELTS Writing Task 2",subject:"IELTS",due:"2026-11-04T20:30",done:false}
];
export const initialGrades:Grade[] = [
 {id:1,subject:"Toán",score:8.5,weight:2},{id:2,subject:"Vật lý",score:8,weight:2},{id:3,subject:"Tiếng Anh",score:9,weight:2},{id:4,subject:"Tin học",score:9.5,weight:1}
];
export const sessions:StudySession[] = [
 {day:"Thứ 2",time:"07:30",subject:"Toán",duration:"90 phút",color:"bg-blue-100 text-blue-700"},
 {day:"Thứ 2",time:"19:30",subject:"IELTS",duration:"60 phút",color:"bg-violet-100 text-violet-700"},
 {day:"Thứ 3",time:"16:00",subject:"Vật lý",duration:"90 phút",color:"bg-amber-100 text-amber-700"},
 {day:"Thứ 4",time:"19:00",subject:"Tiếng Anh",duration:"60 phút",color:"bg-emerald-100 text-emerald-700"},
 {day:"Thứ 5",time:"16:30",subject:"Toán",duration:"90 phút",color:"bg-blue-100 text-blue-700"},
 {day:"Thứ 6",time:"19:30",subject:"IELTS",duration:"60 phút",color:"bg-violet-100 text-violet-700"},
 {day:"Thứ 7",time:"08:00",subject:"Tin học",duration:"120 phút",color:"bg-rose-100 text-rose-700"}
];
export const words = [
 ["resilient","kiên cường, có khả năng phục hồi"],["allocate","phân bổ"],["consistent","kiên trì, nhất quán"],["inevitable","không thể tránh khỏi"],["substantial","đáng kể"],["enhance","nâng cao"],["perspective","góc nhìn"],["sustainable","bền vững"],["crucial","then chốt"],["reluctant","miễn cưỡng"],["acquire","tiếp thu"],["approach","cách tiếp cận"],["beneficial","có lợi"],["challenge","thử thách"],["contribute","đóng góp"],["demonstrate","chứng minh"],["efficient","hiệu quả"],["establish","thiết lập"],["factor","yếu tố"],["maintain","duy trì"]
];
