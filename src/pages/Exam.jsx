import { Navigate, useSearchParams } from 'react-router-dom';
import ExamSection from './ExamSection.jsx';

/* ?unit=&section= → قسم حقيقي من اختبار الوحدة. بلا قسم → المسار (لا يوجد اختبار تجريبي) */
export default function Exam() {
  const [qs] = useSearchParams();
  const unit = qs.get('unit'), section = qs.get('section');
  if (unit && section) return <ExamSection key={unit + '-' + section} unitId={unit} sectionId={section} />;
  return <Navigate to="/path" replace />;
}
