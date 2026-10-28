import { Navigate, useSearchParams } from 'react-router-dom';
import ExamInstructions from './ExamInstructions.jsx';

/* ?unit= → تعليمات اختبار الوحدة الحقيقي. بلا وحدة → المسار (لا توجد صفحة تجريبية) */
export default function QuizInstructions() {
  const [qs] = useSearchParams();
  const unit = qs.get('unit');
  return unit ? <ExamInstructions unitId={unit} /> : <Navigate to="/path" replace />;
}
