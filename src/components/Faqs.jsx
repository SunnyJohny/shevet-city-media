// // src/components/Faqs.jsx
// import React, { useState } from "react";
// import { FaChevronDown, FaChevronUp } from "react-icons/fa";

// const faqData = [
//  {
//   question: "Which curriculum does Springfield Golden Tulip Academy use?",
//   answer:
//     "Springfield Golden Tulip Academy operates a blended academic program that combines the American (Abeka) curriculum with the Nigerian curriculum to provide a balanced and comprehensive learning experience.",
// },
//   {
//     question: "Where is Springfield Golden Tulip Academy located?",
//     answer:
//       "The school is located at Yakubu Gowon Way (off NTA Headquarters), Jos, Plateau State, in a safe and accessible environment for learning.",
//   },
//   {
//     question: "What age is considered suitable for admission?",
//     answer:
//       "Admission is based on the appropriate age requirement for each class level. Parents can contact the school for guidance on the best placement for their child.",
//   },
//   {
//     question: "Is transportation available for students?",
//     answer:
//       "Yes, transportation services are available for students. Details about routes, availability, and any related costs can be obtained from the school administration.",
//   },
//   {
//     question: "What is the school’s approach to student discipline?",
//     answer:
//       "We maintain a disciplined, respectful, and supportive environment. Our approach to discipline encourages responsibility, good character, and positive behavior among learners.",
//   },
//   {
//     question: "Are your teachers professionally qualified?",
//     answer:
//       "Yes, our teachers are qualified and experienced. We also place strong emphasis on training and retraining to ensure they continue to deliver quality education effectively.",
//   },
//   {
//     question: "What does the school fee structure look like?",
//     answer:
//       "School fees vary depending on the class level and services required. Parents are encouraged to contact the school directly for current fee details.",
//   },
//   {
//     question: "How can parents begin the admission process?",
//     answer:
//       "Parents can begin the admission process by contacting the school or visiting the school office to make inquiries and obtain the necessary enrollment information.",
//   },
//   {
//     question: "Are extracurricular activities part of the learning experience?",
//     answer:
//       "Yes, students are given opportunities to participate in extracurricular activities such as sports, music, arts, and other enriching programs that support all-round development.",
//   },
//   {
//     question: "How does the school keep children safe?",
//     answer:
//       "The safety of our learners is a priority. We provide a secure, caring, and well-supervised environment where children can learn and grow confidently.",
//   },
//   {
//     question: "Do parents receive updates about their child’s progress?",
//     answer:
//       "Yes, we value strong communication with parents and provide updates on student progress, school activities, and important announcements when necessary.",
//   },
//   {
//     question: "Do you accept transfer students?",
//     answer:
//       "Yes, transfer students may be admitted provided they meet the school’s entry requirements and suitable class placement is available.",
//   },
// ];

// const Faqs = () => {
//   const [activeIndex, setActiveIndex] = useState(null);

//   const toggleFaq = (index) => {
//     setActiveIndex(activeIndex === index ? null : index);
//   };

//   return (
//     <section id="faqs" className="faq-section">
//       <div className="faq-container">
//         <div className="faq-header">
//           <p className="faq-subtitle">Frequently Asked Questions</p>
//           <h2 className="faq-title">FAQs</h2>
//           <p className="faq-description">
//             Find quick answers to common questions about Springfield Golden
//             Tulip Academy, our learning approach, admission process, and
//             student experience.
//           </p>
//         </div>

//         <div className="faq-list">
//           {faqData.map((faq, index) => (
//             <div
//               className={`faq-item ${activeIndex === index ? "active" : ""}`}
//               key={index}
//             >
//               <button
//                 className="faq-question"
//                 onClick={() => toggleFaq(index)}
//                 aria-expanded={activeIndex === index}
//               >
//                 <span>{faq.question}</span>
//                 {activeIndex === index ? <FaChevronUp /> : <FaChevronDown />}
//               </button>

//               <div
//                 className="faq-answer-wrapper"
//                 style={{
//                   maxHeight: activeIndex === index ? "300px" : "0px",
//                   opacity: activeIndex === index ? 1 : 0,
//                   padding:
//                     activeIndex === index ? "0 18px 18px 18px" : "0 18px",
//                 }}
//               >
//                 <p className="faq-answer">{faq.answer}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <style>{`
//         .faq-section {
//           padding: 80px 20px;
//           background: #f9fafb;
//         }

//         .faq-container {
//           max-width: 900px;
//           margin: 0 auto;
//         }

//         .faq-header {
//           text-align: center;
//           margin-bottom: 40px;
//         }

//         .faq-subtitle {
//           color: #d4a017;
//           font-weight: 600;
//           text-transform: uppercase;
//           letter-spacing: 1px;
//           margin-bottom: 10px;
//         }

//         .faq-title {
//           font-size: 2.2rem;
//           color: #1f2937;
//           margin-bottom: 12px;
//         }

//         .faq-description {
//           color: #6b7280;
//           max-width: 650px;
//           margin: 0 auto;
//           line-height: 1.7;
//         }

//         .faq-list {
//           display: flex;
//           flex-direction: column;
//           gap: 16px;
//         }

//         .faq-item {
//           background: #ffffff;
//           border-radius: 14px;
//           box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
//           overflow: hidden;
//           transition: all 0.3s ease;
//           border: 1px solid #eee;
//         }

//         .faq-item.active {
//           border-color: #d4a017;
//         }

//         .faq-question {
//           width: 100%;
//           background: none;
//           border: none;
//           outline: none;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 15px;
//           padding: 20px 18px;
//           font-size: 1rem;
//           font-weight: 600;
//           color: #1f2937;
//           cursor: pointer;
//           text-align: left;
//         }

//         .faq-question svg {
//           flex-shrink: 0;
//           color: #d4a017;
//           font-size: 0.95rem;
//         }

//         .faq-answer-wrapper {
//           overflow: hidden;
//           transition: all 0.35s ease;
//         }

//         .faq-answer {
//           color: #4b5563;
//           line-height: 1.8;
//           margin: 0;
//         }

//         @media (max-width: 768px) {
//           .faq-section {
//             padding: 60px 15px;
//           }

//           .faq-title {
//             font-size: 1.8rem;
//           }

//           .faq-question {
//             font-size: 0.95rem;
//             padding: 18px 16px;
//           }
//         }
//       `}</style>
//     </section>
//   );
// };

// export default Faqs;