import { useParams, Navigate } from "react-router-dom";

const VideoRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/watch/${id}`} replace />;
};

export default VideoRedirect;
