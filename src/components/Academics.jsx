// // src/components/AcademicSection.jsx
// import React, { useMemo, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   BsArrowRight,
//   BsBook,
//   BsMortarboard,
//   BsClipboardCheck,
//   BsCalendar2Check,
//   BsPatchQuestion,
//   BsCheck2Circle,
//   BsLightbulb,
//   BsPalette,
// } from "react-icons/bs";

// const container = {
//   hidden: { opacity: 0, y: 22 },
//   show: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       duration: 0.45,
//       ease: "easeOut",
//       when: "beforeChildren",
//       staggerChildren: 0.08,
//     },
//   },
// };

// const itemVar = {
//   hidden: { opacity: 0, y: 14 },
//   show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
// };

// const tabPanel = {
//   hidden: { opacity: 0, y: 10 },
//   show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
//   exit: { opacity: 0, y: 10, transition: { duration: 0.2, ease: "easeIn" } },
// };

// const curriculumData = [
//   {
//     title: "Early Years (Creche & Nursery)",
//     icon: <BsMortarboard />,
//     points: [
//       "Phonics, sound recognition, early numeracy and handwriting readiness",
//       "Creative play, storytelling, music, colour work and fine motor development",
//       "Confidence building, courtesy, routines and strong social interaction",
//       "Learning through guided discovery, activity-based teaching and care",
//     ],
//   },
//   {
//     title: "Primary School",
//     icon: <BsBook />,
//     points: [
//       "Strong grounding in English, Mathematics, Science and other core subjects",
//       "Moral instruction, social development, civic awareness and discipline",
//       "Practical classroom learning with ICT exposure and continuous assessment",
//       "Preparation for academic excellence, confidence and future leadership",
//     ],
//   },
//   {
//     title: "Co-Curricular & Enrichment",
//     icon: <BsPalette />,
//     points: [
//       "Creative arts, music, reading culture and confidence-building activities",
//       "Clubs, projects, presentations and teamwork-based learning experiences",
//       "Sports, recreation and healthy participation beyond the classroom",
//       "Balanced development that supports talent discovery and character formation",
//     ],
//   },
// ];

// const admissionsData = {
//   steps: [
//     {
//       title: "Make an Enquiry",
//       desc: "Call, email, or visit the school to ask about available classes, fees, and requirements.",
//       icon: <BsPatchQuestion />,
//     },
//     {
//       title: "Purchase / Submit Application",
//       desc: "Obtain the application form and prospectus from the school office after paying the application fee (or download if available), then submit the completed form.",
//       icon: <BsClipboardCheck />,
//     },
//     {
//       title: "Assessment & Interview",
//       desc: "Your child sits for age-appropriate assessments (including I.Q./aptitude where applicable). Parents/guardians may also be invited for a brief interview.",
//       icon: <BsCalendar2Check />,
//     },
//     {
//       title: "Offer & Registration",
//       desc: "Successful applicants receive an offer letter. Registration is completed after admission fee/payment and documentation.",
//       icon: <BsCheck2Circle />,
//     },
//   ],

//   placementByAge: [
//     { level: "Daycare", age: "1 month – 1 year 8 months" },
//     { level: "Preschool One", age: "2 years – 3 years" },
//     { level: "Preschool Two", age: "3 years – 4 years" },
//     { level: "Preschool Three", age: "4 years – 5 years" },
//     { level: "Grades (Primary)", age: "5 years and above" },
//   ],

//   selectionNotes: [
//     "Placement is primarily based on the child’s age and readiness.",
//     "Selection depends largely on performance in I.Q./aptitude tests and other assessments/interviews administered by the school.",
//     "Admission offers may also depend on available spaces (first-come, first-served where applicable).",
//     "Parents/guardians are encouraged to complete forms carefully to ensure accurate records.",
//   ],

//   criteriaTitle: "Admission Criteria",
//   criteriaIntro:
//     "Application forms are obtained for a fee (or downloaded if available). Completed forms should be returned with the following:",
//   criteriaItems: [
//     "Two passport photographs of the candidate",
//     "Photocopy of birth certificate / age declaration",
//     "Photocopy of the candidate’s result (transfer students only)",
//     "Entrance examination / assessment",
//     "Past academic performance report from current school (as applicable)",
//     "Interview with the candidate along with parents/guardians (as scheduled)",
//   ],

//   notes: [
//     "Admission is subject to availability of slots per class.",
//     "Assessments can be scheduled periodically or by appointment.",
//     "Parents/guardians will be contacted once evaluation is complete.",
//   ],
// };

// const AcademicSection = ({
//   schoolName = "Springfield Golden Tulip Academy",
//   enquiryPhone = "(+234) 803 335 3059",
//   enquiryEmail = "springfieldshools12@gmail.com",
//   onApply = null,
// }) => {
//   const [activeTab, setActiveTab] = useState("curriculum");

//   const tabs = useMemo(
//     () => [
//       { key: "curriculum", label: "Curriculum", icon: <BsBook /> },
//       { key: "admissions", label: "Admissions", icon: <BsClipboardCheck /> },
//     ],
//     []
//   );

//   return (
//     <section
//       id="academics"
//       className="bg-slate-50 py-16 md:py-20 px-4 md:px-8 lg:px-16"
//     >
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <motion.div
//           variants={container}
//           initial="hidden"
//           whileInView="show"
//           viewport={{ once: true, amount: 0.2 }}
//           className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10"
//         >
//           <div>
//             <p className="text-xs font-semibold tracking-[0.3em] uppercase text-blue-700 mb-2">
//               Academics
//             </p>
//             <h2 className="text-3xl md:text-4xl font-extrabold text-blue-900 leading-tight">
//               Learning that builds excellence and character
//             </h2>
//             <p className="mt-3 text-sm md:text-base text-slate-600 max-w-2xl">
//               Explore our curriculum structure and understand how admissions work
//               at{" "}
//               <span className="font-semibold text-blue-900">{schoolName}</span>.
//             </p>
//           </div>

//           {/* Tabs */}
//           <div className="flex flex-wrap gap-2">
//             {tabs.map((t) => {
//               const active = t.key === activeTab;
//               return (
//                 <button
//                   key={t.key}
//                   type="button"
//                   onClick={() => setActiveTab(t.key)}
//                   className={[
//                     "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold border transition",
//                     active
//                       ? "bg-blue-900 text-white border-blue-900"
//                       : "bg-white text-blue-900 border-slate-200 hover:border-blue-300 hover:bg-blue-50",
//                   ].join(" ")}
//                 >
//                   <span className="text-base">{t.icon}</span>
//                   {t.label}
//                 </button>
//               );
//             })}
//           </div>
//         </motion.div>

//         {/* Panels */}
//         <AnimatePresence mode="wait">
//           {activeTab === "curriculum" ? (
//             <motion.div
//               key="curriculum"
//               variants={tabPanel}
//               initial="hidden"
//               animate="show"
//               exit="exit"
//               className="grid gap-6 lg:grid-cols-3"
//             >
//               {curriculumData.map((block, idx) => (
//                 <motion.div
//                   key={idx}
//                   variants={itemVar}
//                   initial="hidden"
//                   whileInView="show"
//                   viewport={{ once: true, amount: 0.2 }}
//                   className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-500 overflow-hidden"
//                 >
//                   <div className="h-1 w-full bg-gradient-to-r from-blue-900 via-blue-600 to-yellow-400" />

//                   <div className="p-6">
//                     <div className="flex items-start gap-3">
//                       <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center text-xl border border-blue-100">
//                         {block.icon}
//                       </div>
//                       <div className="min-w-0">
//                         <h3 className="text-lg md:text-xl font-extrabold text-blue-900">
//                           {block.title}
//                         </h3>
//                         <p className="text-sm text-slate-600 mt-1">
//                           Core focus areas for this section.
//                         </p>
//                       </div>
//                     </div>

//                     <ul className="mt-5 space-y-3">
//                       {block.points.map((p, i) => (
//                         <li
//                           key={i}
//                           className="flex items-start gap-2 text-sm text-slate-700"
//                         >
//                           <span className="mt-1 text-yellow-500">
//                             <BsCheck2Circle />
//                           </span>
//                           <span className="leading-relaxed">{p}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 </motion.div>
//               ))}

//               {/* Curriculum highlight card */}
//               <motion.div
//                 variants={itemVar}
//                 initial="hidden"
//                 whileInView="show"
//                 viewport={{ once: true, amount: 0.2 }}
//                 className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8"
//               >
//                 <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
//                   <div className="max-w-3xl">
//                     <div className="flex items-center gap-3">
//                       <div className="w-11 h-11 rounded-xl bg-yellow-50 text-yellow-700 flex items-center justify-center text-xl border border-yellow-100">
//                         <BsLightbulb />
//                       </div>
//                       <h3 className="text-xl md:text-2xl font-extrabold text-blue-900">
//                         The Ethos of Teaching and Learning
//                       </h3>
//                     </div>

//                     <p className="mt-4 text-sm md:text-base text-slate-600 leading-relaxed">
//                       Our curriculum is designed to develop the whole child through
//                       quality teaching, structured learning, creativity, and strong
//                       moral values. We focus on helping every learner grow in
//                       knowledge, confidence, discipline, and character.
//                     </p>

//                     <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed">
//                       At {schoolName}, children are guided with age-appropriate
//                       methods that make learning engaging, practical, and meaningful.
//                       We combine strong academic foundations with activities that
//                       support communication, curiosity, collaboration, and healthy
//                       self-expression.
//                     </p>

//                     <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed">
//                       We also believe that continuous assessment, teacher feedback,
//                       and active participation help pupils learn better and gain the
//                       confidence to succeed both inside and outside the classroom.
//                     </p>

//                     <div className="mt-6">
//                       <h4 className="text-base md:text-lg font-extrabold text-blue-900">
//                         Interaction-Based Learning
//                       </h4>
//                       <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">
//                         We promote discussion, guided tasks, hands-on classroom
//                         activities, reading culture, and collaborative experiences so
//                         children do not only memorize lessons, but truly understand
//                         and apply what they learn.
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex gap-3 flex-wrap lg:justify-end">
//                     <span className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-blue-50 text-blue-900 border border-blue-100">
//                       Strong Academic Foundation
//                     </span>
//                     <span className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-yellow-50 text-yellow-800 border border-yellow-100">
//                       Continuous Assessment
//                     </span>
//                     <span className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200">
//                       Whole-Child Development
//                     </span>
//                     <span className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200">
//                       Character & Confidence
//                     </span>
//                   </div>
//                 </div>
//               </motion.div>
//             </motion.div>
//           ) : (
//             <motion.div
//               key="admissions"
//               variants={tabPanel}
//               initial="hidden"
//               animate="show"
//               exit="exit"
//               className="grid gap-6 lg:grid-cols-3"
//             >
//               {/* Steps */}
//               <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
//                 <div className="flex items-center justify-between gap-4 flex-wrap">
//                   <div>
//                     <h3 className="text-xl md:text-2xl font-extrabold text-blue-900">
//                       Admission Procedure
//                     </h3>
//                     <p className="mt-2 text-sm md:text-base text-slate-600">
//                       A simple, parent-friendly process designed to guide you from enquiry
//                       to enrollment.
//                     </p>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() => (typeof onApply === "function" ? onApply() : null)}
//                     className={[
//                       "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold shadow-sm transition",
//                       typeof onApply === "function"
//                         ? "bg-blue-900 text-white hover:bg-blue-800"
//                         : "bg-slate-100 text-slate-500 cursor-not-allowed",
//                     ].join(" ")}
//                     title={
//                       typeof onApply === "function"
//                         ? "Apply now"
//                         : "Connect this button by passing onApply prop"
//                     }
//                   >
//                     Apply Now <BsArrowRight />
//                   </button>
//                 </div>

//                 <div className="mt-6 grid gap-4 sm:grid-cols-2">
//                   {admissionsData.steps.map((s, idx) => (
//                     <div
//                       key={idx}
//                       className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
//                     >
//                       <div className="flex items-start gap-3">
//                         <div className="w-10 h-10 rounded-xl bg-white text-blue-900 flex items-center justify-center text-xl border border-slate-200">
//                           {s.icon}
//                         </div>
//                         <div className="min-w-0">
//                           <p className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-500">
//                             Step {idx + 1}
//                           </p>
//                           <h4 className="text-base md:text-lg font-extrabold text-blue-900">
//                             {s.title}
//                           </h4>
//                         </div>
//                       </div>
//                       <p className="mt-3 text-sm text-slate-600 leading-relaxed">
//                         {s.desc}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Placement by age */}
//                 <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5">
//                   <h4 className="text-base md:text-lg font-extrabold text-blue-900">
//                     Placement by Age
//                   </h4>
//                   <p className="mt-2 text-sm text-slate-600">
//                     Placement is done according to the child’s age and readiness.
//                   </p>

//                   <div className="mt-4 grid gap-3 sm:grid-cols-2">
//                     {admissionsData.placementByAge.map((row, i) => (
//                       <div
//                         key={i}
//                         className="rounded-xl border border-slate-100 bg-slate-50 p-4"
//                       >
//                         <p className="text-sm font-extrabold text-blue-900">
//                           {row.level}
//                         </p>
//                         <p className="mt-1 text-sm text-slate-600">{row.age}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Selection notes */}
//                 <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
//                   <p className="text-sm font-semibold text-blue-900">
//                     Selection & Offer Notes
//                   </p>
//                   <ul className="mt-3 space-y-2">
//                     {admissionsData.selectionNotes.map((n, i) => (
//                       <li key={i} className="text-sm text-blue-900/90 leading-relaxed">
//                         • {n}
//                       </li>
//                     ))}
//                   </ul>

//                   <p className="mt-4 text-sm font-semibold text-blue-900">
//                     Need help?
//                   </p>
//                   <p className="mt-1 text-sm text-blue-900/90">
//                     Call: <span className="font-semibold">{enquiryPhone}</span> • Email:{" "}
//                     <span className="font-semibold">{enquiryEmail}</span>
//                   </p>
//                 </div>
//               </div>

//               {/* Requirements + Criteria */}
//               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
//                 <div className="flex items-center gap-3">
//                   <div className="w-11 h-11 rounded-xl bg-yellow-50 text-yellow-700 flex items-center justify-center text-xl border border-yellow-100">
//                     <BsClipboardCheck />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-extrabold text-blue-900">
//                       {admissionsData.criteriaTitle}
//                     </h3>
//                     <p className="text-sm text-slate-600 mt-1">
//                       {admissionsData.criteriaIntro}
//                     </p>
//                   </div>
//                 </div>

//                 <ul className="mt-5 space-y-3">
//                   {admissionsData.criteriaItems.map((r, i) => (
//                     <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
//                       <span className="mt-1 text-yellow-500">
//                         <BsCheck2Circle />
//                       </span>
//                       <span className="leading-relaxed">{r}</span>
//                     </li>
//                   ))}
//                 </ul>

//                 <div className="mt-6 pt-5 border-t border-slate-100">
//                   <p className="text-sm font-semibold text-blue-900">Important notes</p>
//                   <ul className="mt-3 space-y-2">
//                     {admissionsData.notes.map((n, i) => (
//                       <li key={i} className="text-sm text-slate-600 leading-relaxed">
//                         • {n}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </section>
//   );
// };

// export default AcademicSection;