import { Navigate, useSearchParams } from 'react-router-dom';
import ActivityRun from './ActivityRun.jsx';

/* ?lesson=&activity= (&library=1 &assignment=) → نشاط حقيقي من الباك اند. بلا نشاط → المسار (لا يوجد كويز تجريبي) */
export default function QuizRun() {
  const [qs] = useSearchParams();
  const lesson = qs.get('lesson'), activity = qs.get('activity');
  if (activity && (lesson || qs.get('library'))) return <ActivityRun key={lesson + '-' + activity} lessonId={lesson} activityId={activity} assignment={qs.get('assignment')} library={qs.get('library')} />;
  return <Navigate to="/path" replace />;
}
