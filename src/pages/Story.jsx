import { Navigate, useSearchParams } from 'react-router-dom';
import StoryReader from './StoryReader.jsx';

/* ?id= → قصة حقيقية من الباك اند. بلا قصة → مكتبة القصص (لا توجد قصة تجريبية) */
export default function Story() {
  const [qs] = useSearchParams();
  const id = qs.get('id');
  return id ? <StoryReader key={id} id={id} /> : <Navigate to="/library" replace />;
}
